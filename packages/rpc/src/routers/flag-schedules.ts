import { randomUUID } from "node:crypto";
import { desc, eq, flagSchedules, flags } from "@databuddy/db";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import {
	createBullMQRolloutSchedule,
	createBullMQSchedule,
	deleteBullMQSchedule,
	updateBullMQRolloutSchedule,
	updateBullMQSchedule,
} from "@/services/flag-scheduler-bullmq";
import { logger } from "../lib/logger";
import { protectedProcedure } from "../orpc";
import { authorizeWebsiteAccess } from "../utils/auth";

type DbRolloutStep = {
	scheduledAt: string;
	executedAt?: string;
	value: number | "enable" | "disable";
};

type FlagScheduleType = "enable" | "disable" | "update_rollout";

const rolloutStepSchema = z.object({
	scheduledAt: z.string(),
	executedAt: z.string().optional(),
	value: z.union([
		z.number().min(0).max(100),
		z.literal("enable"),
		z.literal("disable"),
	]),
});

const flagScheduleTypeEnum = z.enum(["enable", "disable", "update_rollout"]);

const flagScheduleSchema = z
	.object({
		id: z.string().optional(),
		flagId: z.string(),
		type: flagScheduleTypeEnum,
		isEnabled: z.boolean(),
		scheduledAt: z.string().optional(),
		rolloutSteps: z.array(rolloutStepSchema).optional(),
	})
	.superRefine((data, ctx) => {
		if (!data.isEnabled) {
			return;
		}
		if (data.type !== "update_rollout") {
			if (data.rolloutSteps && data.rolloutSteps.length > 0) {
				ctx.addIssue({
					code: "custom",
					path: ["rolloutSteps"],
					message: "Rollout steps allowed only for update_rollout type",
				});
			}
			if (data.scheduledAt) {
				const scheduledDate = new Date(data.scheduledAt);
				if (Number.isNaN(scheduledDate.getTime())) {
					ctx.addIssue({
						code: "custom",
						path: ["scheduledAt"],
						message: "Invalid schedule date",
					});
				} else if (Date.now() > scheduledDate.getTime()) {
					ctx.addIssue({
						code: "custom",
						path: ["scheduledAt"],
						message: "Scheduled time must be in the future",
					});
				}
			} else {
				ctx.addIssue({
					code: "custom",
					path: ["scheduledAt"],
					message: "Date time is required for enable/disable schedule types",
				});
			}
		} else {
			if (data.scheduledAt) {
				ctx.addIssue({
					code: "custom",
					path: ["scheduledAt"],
					message: "scheduledAt not allowed for rollout schedules",
				});
				return;
			}
			if (Array.isArray(data.rolloutSteps) && data.rolloutSteps.length > 0) {
				for (const step of data.rolloutSteps) {
					if (typeof step.value !== "number") {
						ctx.addIssue({
							code: "custom",
							path: ["value"],
							message:
								"Step value must be a number between 0 and 100 for rollout steps",
						});
						continue;
					}
					if (step.value < 0 || step.value > 100) {
						ctx.addIssue({
							code: "custom",
							path: ["value"],
							message:
								"Step value must be a number between 0 and 100 for rollout steps",
						});
					}
					const stepDate = new Date(step.scheduledAt);
					if (
						Number.isNaN(stepDate.getTime()) ||
						Date.now() > stepDate.getTime()
					) {
						ctx.addIssue({
							code: "custom",
							path: ["rolloutSteps"],
							message: "Scheduled time must be in the future",
						});
					}
				}
			} else {
				ctx.addIssue({
					code: "custom",
					path: ["rolloutSteps"],
					message: "Rollout steps are required for batch rollout schedules",
				});
			}
		}
	});

type FlagScheduleUpdateData = {
	flagId: string;
	type: FlagScheduleType;
	isEnabled: boolean;
	scheduledAt?: Date | null;
	rolloutSteps?: DbRolloutStep[];
	executedAt: null;
	updatedAt: Date;
};

export const flagSchedulesRouter = {
	getByFlagId: protectedProcedure
		.input(z.object({ flagId: z.string() }))
		.handler(async ({ context, input }) => {
			const flag = await context.db.query.flags.findFirst({
				where: eq(flags.id, input.flagId),
			});

			if (!flag?.websiteId) {
				throw new ORPCError("NOT_FOUND", { message: "Flag not found" });
			}

			await authorizeWebsiteAccess(context, flag.websiteId, "read");

			const schedules = await context.db
				.select()
				.from(flagSchedules)
				.where(eq(flagSchedules.flagId, input.flagId))
				.orderBy(desc(flagSchedules.scheduledAt));

			if (!schedules[0]) {
				throw new ORPCError("NOT_FOUND", {
					message: "No schedules found for this flag",
				});
			}

			return schedules[0];
		}),

	create: protectedProcedure
		.input(flagScheduleSchema)
		.handler(async ({ context, input }) => {
			const flag = await context.db.query.flags.findFirst({
				where: eq(flags.id, input.flagId),
			});

			if (!flag?.websiteId) {
				throw new ORPCError("NOT_FOUND", { message: "Flag not found" });
			}

			await authorizeWebsiteAccess(context, flag.websiteId, "update");

			const scheduleId = randomUUID();
			let bullmqJobIds: string[] | null = null;

			try {
				if (input.type === "update_rollout" && input.rolloutSteps) {
					bullmqJobIds = await createBullMQRolloutSchedule(
						scheduleId,
						input.flagId,
						input.rolloutSteps
					);
				} else if (
					input.scheduledAt &&
					(input.type === "enable" || input.type === "disable")
				) {
					const jobId = await createBullMQSchedule(
						scheduleId,
						new Date(input.scheduledAt),
						input.flagId,
						input.type
					);
					bullmqJobIds = [jobId]; // Store as array for consistency
				}
			} catch (error: unknown) {
				logger.error(
					{ error, scheduleId, input },
					"Failed to create BullMQ schedule"
				);
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to create schedule in BullMQ",
					data: error,
				});
			}

			let schedule: typeof flagSchedules.$inferSelect;
			try {
				[schedule] = await context.db
					.insert(flagSchedules)
					.values({
						id: scheduleId,
						flagId: input.flagId,
						scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
						type: input.type,
						isEnabled: input.isEnabled,
						qstashScheduleIds: bullmqJobIds, // Using same column name for now (migration needed)
						rolloutSteps: input.rolloutSteps?.map((step: DbRolloutStep) => ({
							...step,
							executedAt: undefined,
						})),
					})
					.returning();
			} catch (dbError: unknown) {
				if (bullmqJobIds) {
					for (const jobId of bullmqJobIds) {
						await deleteBullMQSchedule(jobId).catch((e) =>
							logger.error(
								{ error: e, bullmqJobId: jobId },
								"Failed to cleanup BullMQ schedule"
							)
						);
					}
				}
				throw dbError;
			}

			logger.info(
				{
					scheduleId,
					bullmqJobIds,
					flagId: input.flagId,
					type: input.type,
					userId: context.user.id,
				},
				"Flag schedule created"
			);

			return schedule;
		}),

	update: protectedProcedure
		.input(flagScheduleSchema)
		.handler(async ({ context, input }) => {
			if (!input.id) {
				throw new ORPCError("BAD_REQUEST", {
					message: "Schedule ID is required",
				});
			}

			const flag = await context.db.query.flags.findFirst({
				where: eq(flags.id, input.flagId),
			});

			if (!flag?.websiteId) {
				throw new ORPCError("NOT_FOUND", { message: "Flag not found" });
			}

			await authorizeWebsiteAccess(context, flag.websiteId, "update");

			const existingSchedule = await context.db.query.flagSchedules.findFirst({
				where: eq(flagSchedules.id, input.id),
			});

			if (!existingSchedule) {
				throw new ORPCError("NOT_FOUND", { message: "Schedule not found" });
			}

			const { id, ...updates } = input;

			let bullmqJobIds: string[] | null =
				(existingSchedule.qstashScheduleIds as string[] | null) || null; // Using same column for now
			try {
				if (input.type === "update_rollout" && input.rolloutSteps) {
					bullmqJobIds = await updateBullMQRolloutSchedule(
						input.id,
						existingSchedule.qstashScheduleIds,
						input.rolloutSteps,
						input.flagId
					);
				} else if (
					input.scheduledAt &&
					(input.type === "enable" || input.type === "disable")
				) {
					const jobId = await updateBullMQSchedule(
						input.id,
						existingSchedule.qstashScheduleIds?.[0] || null,
						new Date(input.scheduledAt),
						input.flagId,
						input.type
					);
					bullmqJobIds = [jobId]; // Store as array for consistency
				}
			} catch (error: unknown) {
				logger.error(
					{ error, scheduleId: input.id, input },
					"Failed to update BullMQ schedule"
				);
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to update schedule in BullMQ",
				});
			}

			const updateData: FlagScheduleUpdateData = {
				...updates,
				updatedAt: new Date(),
				executedAt: null,
				scheduledAt: updates.scheduledAt ? new Date(updates.scheduledAt) : null,
				rolloutSteps: updates.rolloutSteps?.map((step: DbRolloutStep) => ({
					value: step.value,
					scheduledAt: step.scheduledAt,
					executedAt: undefined,
				})),
			};

			const [updated] = await context.db
				.update(flagSchedules)
				.set({ ...updateData, qstashScheduleIds: bullmqJobIds }) // Using same column for now
				.where(eq(flagSchedules.id, id))
				.returning();

			logger.info(
				{
					scheduleId: id,
					bullmqJobIds,
					flagId: input.flagId,
					userId: context.user.id,
				},
				"Flag schedule updated"
			);

			return updated;
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ context, input }) => {
			const existingSchedule = await context.db.query.flagSchedules.findFirst({
				where: eq(flagSchedules.id, input.id),
			});
			if (!existingSchedule) {
				throw new ORPCError("NOT_FOUND", { message: "Schedule not found" });
			}

			const flag = await context.db.query.flags.findFirst({
				where: eq(flags.id, existingSchedule.flagId),
			});
			if (!flag?.websiteId) {
				throw new ORPCError("NOT_FOUND", { message: "Flag not found" });
			}

			await authorizeWebsiteAccess(context, flag.websiteId, "update");

			// Delete BullMQ jobs if they exist
			if (existingSchedule.qstashScheduleIds) {
				for (const jobId of existingSchedule.qstashScheduleIds) {
					try {
						await deleteBullMQSchedule(jobId);
					} catch (error: unknown) {
						logger.error(
							{ error, scheduleId: input.id, bullmqJobId: jobId },
							"Failed to delete BullMQ schedule"
						);
						// Continue with database deletion even if BullMQ deletion fails
					}
				}
			}

			await context.db
				.delete(flagSchedules)
				.where(eq(flagSchedules.id, input.id));

			logger.info(
				{
					scheduleId: input.id,
					bullmqJobIds: existingSchedule.qstashScheduleIds,
					flagId: existingSchedule.flagId,
					userId: context.user.id,
				},
				"Flag schedule deleted"
			);

			return { success: true };
		}),
};
