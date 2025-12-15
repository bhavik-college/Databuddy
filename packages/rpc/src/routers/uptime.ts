import { db, eq, and, uptimeSchedules } from "@databuddy/db";
import { logger } from "@databuddy/shared/logger";
import { ORPCError } from "@orpc/server";
import { Client } from "@upstash/qstash";
import { z } from "zod";
import { recordORPCError } from "../lib/otel";
import { protectedProcedure } from "../orpc";
import { authorizeWebsiteAccess, authorizeUptimeScheduleAccess } from "../utils/auth";
import { nanoid } from "nanoid";
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
	websiteId?: string | null,
	excludeScheduleId?: string
) {
	const conditions = [
		eq(uptimeSchedules.url, url),
		eq(uptimeSchedules.userId, userId),
	];

	if (websiteId) {
		conditions.push(eq(uptimeSchedules.websiteId, websiteId));
	}

	const schedules = await db.query.uptimeSchedules.findMany({
		where: and(...conditions),
	});

	const conflictingSchedules = excludeScheduleId
		? schedules.filter((s) => s.id !== excludeScheduleId)
		: schedules;

	if (conflictingSchedules.length > 0) {
		const message = websiteId
			? "A monitor already exists for this website. Please delete the existing monitor before creating a new one."
			: "A monitor already exists for this URL. Please delete the existing monitor before creating a new one.";
		throw new ORPCError("CONFLICT", { message });
	}
}

export const uptimeRouter = {
	getScheduleByWebsiteId: protectedProcedure
		.input(
			z.object({
				websiteId: z.string().min(1, "Website ID is required"),
			})
		)
		.handler(async ({ context, input }) => {
			await authorizeWebsiteAccess(context, input.websiteId, "read");

			const schedule = await findScheduleByWebsiteId(input.websiteId);
			return schedule || null;
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
		.input(
			z.object({
				scheduleId: z.string().min(1, "Schedule ID is required"),
			})
		)
		.handler(async ({ context, input }) => {
			const [dbSchedule, qstashSchedule] = await Promise.all([
				findScheduleById(input.scheduleId),
				client.schedules.get(input.scheduleId).catch(() => null),
			]);

			if (!dbSchedule) {
				recordORPCError({
					code: "NOT_FOUND",
					message: "Schedule not found",
				});
				throw new ORPCError("NOT_FOUND", {
					message: "Schedule not found",
				});
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

			const scheduleId = input.websiteId ? input.websiteId : nanoid(10);
			await createQStashSchedule(scheduleId, input.granularity);

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

			try {
				await client.publish({
					urlGroup: UPTIME_URL_GROUP,
					headers: {
						"Content-Type": "application/json",
						"X-Schedule-Id": scheduleId,
					},
				});
				logger.info({ scheduleId }, "Triggered uptime check after creation");
			} catch (error) {
				logger.error({ scheduleId, error }, "Failed to trigger initial check");
			}

			logger.info(
				{
					scheduleId,
					url: input.url,
					websiteId: input.websiteId,
					userId: context.user.id,
				},
				"Uptime schedule created"
			);

			return {
				scheduleId,
				url: input.url,
				name: input.name,
				granularity: input.granularity,
				cron: CRON_GRANULARITIES[input.granularity],
			};
		}),

	updateSchedule: protectedProcedure
		.input(
			z.object({
				scheduleId: z.string().min(1, "Schedule ID is required"),
				granularity: granularityEnum,
			})
		)
		.handler(async ({ context, input }) => {
			const schedule = await findScheduleById(input.scheduleId);

			if (!schedule) {
				recordORPCError({
					code: "NOT_FOUND",
					message: "Schedule not found",
				});
				throw new ORPCError("NOT_FOUND", {
					message: "Schedule not found",
				});
			}

			await authorizeUptimeScheduleAccess(context, {
				websiteId: schedule.websiteId,
				userId: schedule.userId,
			});

			try {
				await client.schedules.delete(input.scheduleId);
			} catch (error) {
				logger.error(
					{ scheduleId: input.scheduleId, error },
					"Failed to delete old QStash schedule during update"
				);
				recordORPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to delete old QStash schedule",
				});
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to delete old QStash schedule. Please try again.",
				});
			}

			await db
				.update(uptimeSchedules)
				.set({
					granularity: input.granularity,
					cron: CRON_GRANULARITIES[input.granularity],
					updatedAt: new Date(),
				})
				.where(eq(uptimeSchedules.id, input.scheduleId));

			const newScheduleId = await createQStashSchedule(
				input.scheduleId,
				input.granularity
			);

			logger.info(
				{
					scheduleId: input.scheduleId,
					granularity: input.granularity,
					userId: context.user.id,
				},
				"Uptime schedule updated"
			);

			return {
				scheduleId: input.scheduleId,
				granularity: input.granularity,
				cron: CRON_GRANULARITIES[input.granularity],
			};
		}),

	deleteSchedule: protectedProcedure
		.input(
			z.object({
				scheduleId: z.string().min(1, "Schedule ID is required"),
			})
		)
		.handler(async ({ context, input }) => {
			const schedule = await findScheduleById(input.scheduleId);

			if (!schedule) {
				recordORPCError({
					code: "NOT_FOUND",
					message: "Schedule not found",
				});
				throw new ORPCError("NOT_FOUND", {
					message: "Schedule not found",
				});
			}

			await authorizeUptimeScheduleAccess(context, {
				websiteId: schedule.websiteId,
				userId: schedule.userId,
			});

			try {
				await client.schedules.delete(input.scheduleId);
			} catch (error) {
				logger.error(
					{ scheduleId: input.scheduleId, error },
					"Failed to delete QStash schedule"
				);
				recordORPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to delete QStash schedule",
				});
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to delete QStash schedule. Please try again.",
				});
			}

			await db
				.delete(uptimeSchedules)
				.where(eq(uptimeSchedules.id, input.scheduleId));

			const verifyDeleted = await findScheduleById(input.scheduleId);
			if (verifyDeleted) {
				recordORPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to verify schedule deletion",
				});
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to verify schedule deletion",
				});
			}

			logger.info(
				{
					scheduleId: input.scheduleId,
					websiteId: schedule.websiteId,
					userId: context.user.id,
				},
				"Uptime schedule deleted"
			);

			return { success: true, scheduleId: input.scheduleId };
		}),

	pauseSchedule: protectedProcedure
		.input(
			z.object({
				scheduleId: z.string().min(1, "Schedule ID is required"),
			})
		)
		.handler(async ({ context, input }) => {
			const schedule = await findScheduleById(input.scheduleId);

			if (!schedule) {
				recordORPCError({
					code: "NOT_FOUND",
					message: "Schedule not found",
				});
				throw new ORPCError("NOT_FOUND", {
					message: "Schedule not found",
				});
			}

			await authorizeUptimeScheduleAccess(context, {
				websiteId: schedule.websiteId,
				userId: schedule.userId,
			});

			if (schedule.isPaused) {
				recordORPCError({
					code: "BAD_REQUEST",
					message: "Schedule is already paused",
				});
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

			logger.info(
				{
					scheduleId: input.scheduleId,
					websiteId: schedule.websiteId,
					userId: context.user.id,
				},
				"Uptime schedule paused"
			);

			return { success: true, scheduleId: input.scheduleId, isPaused: true };
		}),

	resumeSchedule: protectedProcedure
		.input(
			z.object({
				scheduleId: z.string().min(1, "Schedule ID is required"),
			})
		)
		.handler(async ({ context, input }) => {
			const schedule = await findScheduleById(input.scheduleId);

			if (!schedule) {
				recordORPCError({
					code: "NOT_FOUND",
					message: "Schedule not found",
				});
				throw new ORPCError("NOT_FOUND", {
					message: "Schedule not found",
				});
			}

			await authorizeUptimeScheduleAccess(context, {
				websiteId: schedule.websiteId,
				userId: schedule.userId,
			});

			if (!schedule.isPaused) {
				recordORPCError({
					code: "BAD_REQUEST",
					message: "Schedule is not paused",
				});
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

			logger.info(
				{
					scheduleId: input.scheduleId,
					websiteId: schedule.websiteId,
					userId: context.user.id,
				},
				"Uptime schedule resumed"
			);

			return { success: true, scheduleId: input.scheduleId, isPaused: false };
		}),
};
