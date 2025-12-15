import { and, db, eq, uptimeSchedules } from "@databuddy/db";
import { logger } from "@databuddy/shared/logger";
import { ORPCError } from "@orpc/server";
import { Client } from "@upstash/qstash";
import { nanoid } from "nanoid";
import { z } from "zod";
import { protectedProcedure } from "../orpc";
import {
	authorizeUptimeScheduleAccess,
	authorizeWebsiteAccess,
} from "../utils/auth";

if (!process.env.UPSTASH_QSTASH_TOKEN) {
	logger.error("UPSTASH_QSTASH_TOKEN environment variable is required");
}

const client = new Client({
	token: process.env.UPSTASH_QSTASH_TOKEN,
});

const CRON_GRANULARITIES = {
	minute: "* * * * *",
	ten_minutes: "*/10 * * * *",
	thirty_minutes: "*/30 * * * *",
	hour: "0 * * * *",
	six_hours: "0 */6 * * *",
	twelve_hours: "0 */12 * * *",
	day: "0 0 * * *",
} as const;

const granularityEnum = z.enum([
	"minute",
	"ten_minutes",
	"thirty_minutes",
	"hour",
	"six_hours",
	"twelve_hours",
	"day",
]);

const UPTIME_URL_GROUP = process.env.UPTIME_URL_GROUP || "uptime";

async function findScheduleById(scheduleId: string) {
	const schedule = await db.query.uptimeSchedules.findFirst({
		where: eq(uptimeSchedules.id, scheduleId),
	});
	return schedule;
}

async function findScheduleByWebsiteId(websiteId: string) {
	const schedule = await db.query.uptimeSchedules.findFirst({
		where: eq(uptimeSchedules.websiteId, websiteId),
		orderBy: (table, { desc }) => [desc(table.createdAt)],
	});
	return schedule;
}

async function createQStashSchedule(
	scheduleId: string,
	granularity: z.infer<typeof granularityEnum>
) {
	const result = await client.schedules.create({
		scheduleId,
		destination: UPTIME_URL_GROUP,
		cron: CRON_GRANULARITIES[granularity],
		headers: {
			"Content-Type": "application/json",
			"X-Schedule-Id": scheduleId,
		},
	});

	if (!result.scheduleId) {
		throw new ORPCError("INTERNAL_SERVER_ERROR", {
			message: "Failed to create uptime schedule",
		});
	}

	return result.scheduleId;
}

async function ensureNoDuplicateSchedule(
	url: string,
	userId: string,
	websiteId?: string | null
) {
	const conditions = [
		eq(uptimeSchedules.url, url),
		eq(uptimeSchedules.userId, userId),
	];

	if (websiteId) {
		conditions.push(eq(uptimeSchedules.websiteId, websiteId));
	}

	const existing = await db.query.uptimeSchedules.findFirst({
		where: and(...conditions),
	});

	if (existing) {
		throw new ORPCError("CONFLICT", {
			message: websiteId
				? "Monitor already exists for this website"
				: "Monitor already exists for this URL",
		});
	}
}

export const uptimeRouter = {
	getScheduleByWebsiteId: protectedProcedure
		.input(z.object({ websiteId: z.string() }))
		.handler(async ({ context, input }) => {
			await authorizeWebsiteAccess(context, input.websiteId, "read");
			return await findScheduleByWebsiteId(input.websiteId);
		}),

	listSchedules: protectedProcedure
		.input(
			z.object({
				websiteId: z.string().optional(),
			})
		)
		.handler(async ({ context, input }) => {
			const conditions = [eq(uptimeSchedules.userId, context.user.id)];

			if (input.websiteId) {
				await authorizeWebsiteAccess(context, input.websiteId, "read");
				conditions.push(eq(uptimeSchedules.websiteId, input.websiteId));
			}

			const schedules = await db.query.uptimeSchedules.findMany({
				where: and(...conditions),
				orderBy: (table, { desc }) => [desc(table.createdAt)],
			});

			return schedules;
		}),

	getSchedule: protectedProcedure
		.input(z.object({ scheduleId: z.string() }))
		.handler(async ({ context, input }) => {
			const [dbSchedule, qstashSchedule] = await Promise.all([
				findScheduleById(input.scheduleId),
				client.schedules.get(input.scheduleId).catch(() => null),
			]);

			if (!dbSchedule) {
				throw new ORPCError("NOT_FOUND", { message: "Schedule not found" });
			}

			await authorizeUptimeScheduleAccess(context, {
				websiteId: dbSchedule.websiteId,
				userId: dbSchedule.userId,
			});

			return {
				...dbSchedule,
				qstashStatus: qstashSchedule ? "active" : "missing",
			};
		}),

	createSchedule: protectedProcedure
		.input(
			z.object({
				url: z.string().url("Valid URL is required"),
				name: z.string().optional(),
				websiteId: z.string().optional(),
				granularity: granularityEnum,
			})
		)
		.handler(async ({ context, input }) => {
			if (input.websiteId) {
				await authorizeWebsiteAccess(context, input.websiteId, "update");
			}

			await ensureNoDuplicateSchedule(
				input.url,
				context.user.id,
				input.websiteId ?? null
			);

			const scheduleId = input.websiteId || nanoid(10);

			// Insert to DB first
			await db.insert(uptimeSchedules).values({
				id: scheduleId,
				websiteId: input.websiteId ?? null,
				userId: context.user.id,
				url: input.url,
				name: input.name ?? null,
				granularity: input.granularity,
				cron: CRON_GRANULARITIES[input.granularity],
				isPaused: false,
			});

			// Then create QStash schedule, rollback DB if it fails
			try {
				await createQStashSchedule(scheduleId, input.granularity);
			} catch (error) {
				await db.delete(uptimeSchedules).where(eq(uptimeSchedules.id, scheduleId));
				logger.error({ scheduleId, error }, "QStash creation failed, rolled back");
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to create monitor",
				});
			}

			// Trigger initial check (fire-and-forget)
			client
				.publish({
					urlGroup: UPTIME_URL_GROUP,
					headers: {
						"Content-Type": "application/json",
						"X-Schedule-Id": scheduleId,
					},
				})
				.catch((error) =>
					logger.error({ scheduleId, error }, "Failed to trigger initial check")
				);

			logger.info({ scheduleId, url: input.url }, "Schedule created");

			return {
				scheduleId,
				url: input.url,
				name: input.name,
				granularity: input.granularity,
				cron: CRON_GRANULARITIES[input.granularity],
			};
		}),

	updateSchedule: protectedProcedure
		.input(z.object({ scheduleId: z.string(), granularity: granularityEnum }))
		.handler(async ({ context, input }) => {
			const schedule = await findScheduleById(input.scheduleId);
			if (!schedule) {
				throw new ORPCError("NOT_FOUND", { message: "Schedule not found" });
			}

			await authorizeUptimeScheduleAccess(context, {
				websiteId: schedule.websiteId,
				userId: schedule.userId,
			});

			await client.schedules.delete(input.scheduleId);
			await createQStashSchedule(input.scheduleId, input.granularity);

			await db
				.update(uptimeSchedules)
				.set({
					granularity: input.granularity,
					cron: CRON_GRANULARITIES[input.granularity],
					updatedAt: new Date(),
				})
				.where(eq(uptimeSchedules.id, input.scheduleId));

			logger.info({ scheduleId: input.scheduleId }, "Schedule updated");

			return {
				scheduleId: input.scheduleId,
				granularity: input.granularity,
				cron: CRON_GRANULARITIES[input.granularity],
			};
		}),

	deleteSchedule: protectedProcedure
		.input(z.object({ scheduleId: z.string() }))
		.handler(async ({ context, input }) => {
			const schedule = await findScheduleById(input.scheduleId);
			if (!schedule) {
				throw new ORPCError("NOT_FOUND", { message: "Schedule not found" });
			}

			await authorizeUptimeScheduleAccess(context, {
				websiteId: schedule.websiteId,
				userId: schedule.userId,
			});

			await Promise.all([
				client.schedules.delete(input.scheduleId),
				db.delete(uptimeSchedules).where(eq(uptimeSchedules.id, input.scheduleId)),
			]);

			logger.info({ scheduleId: input.scheduleId }, "Schedule deleted");

			return { success: true, scheduleId: input.scheduleId };
		}),

	pauseSchedule: protectedProcedure
		.input(z.object({ scheduleId: z.string() }))
		.handler(async ({ context, input }) => {
			const schedule = await findScheduleById(input.scheduleId);
			if (!schedule) {
				throw new ORPCError("NOT_FOUND", { message: "Schedule not found" });
			}

			await authorizeUptimeScheduleAccess(context, {
				websiteId: schedule.websiteId,
				userId: schedule.userId,
			});

			if (schedule.isPaused) {
				throw new ORPCError("BAD_REQUEST", {
					message: "Schedule is already paused",
				});
			}

			await Promise.all([
				client.schedules.pause({ schedule: input.scheduleId }),
				db
					.update(uptimeSchedules)
					.set({ isPaused: true, updatedAt: new Date() })
					.where(eq(uptimeSchedules.id, input.scheduleId)),
			]);

			logger.info({ scheduleId: input.scheduleId }, "Schedule paused");

			return { success: true, scheduleId: input.scheduleId, isPaused: true };
		}),

	resumeSchedule: protectedProcedure
		.input(z.object({ scheduleId: z.string() }))
		.handler(async ({ context, input }) => {
			const schedule = await findScheduleById(input.scheduleId);
			if (!schedule) {
				throw new ORPCError("NOT_FOUND", { message: "Schedule not found" });
			}

			await authorizeUptimeScheduleAccess(context, {
				websiteId: schedule.websiteId,
				userId: schedule.userId,
			});

			if (!schedule.isPaused) {
				throw new ORPCError("BAD_REQUEST", {
					message: "Schedule is not paused",
				});
			}

			await Promise.all([
				client.schedules.resume({ schedule: input.scheduleId }),
				db
					.update(uptimeSchedules)
					.set({ isPaused: false, updatedAt: new Date() })
					.where(eq(uptimeSchedules.id, input.scheduleId)),
			]);

			logger.info({ scheduleId: input.scheduleId }, "Schedule resumed");

			return { success: true, scheduleId: input.scheduleId, isPaused: false };
		}),
};
