import { type Job, Worker } from "bullmq";
import { logger } from "../lib/logger";
import { executeSchedule } from "../services/flag-scheduler";

type FlagScheduleJobData = {
	scheduleId: string;
	type: "enable" | "disable" | "update_rollout";
	flagId: string;
	stepScheduledAt?: string;
	stepValue?: number | "enable" | "disable";
};

// Convert ioredis to BullMQ connection format
const getConnection = () => {
	const redisUrl = process.env.REDIS_URL;
	if (!redisUrl) {
		throw new Error("REDIS_URL environment variable is required");
	}

	const url = new URL(redisUrl);
	return {
		host: url.hostname,
		port: Number(url.port) || 6379,
		password: url.password || undefined,
		db: url.pathname ? Number(url.pathname.slice(1)) : undefined,
	};
};

const connection = getConnection();

/**
 * BullMQ Worker to process flag schedule jobs
 * This replaces the QStash webhook endpoint
 */
export function createFlagSchedulerWorker() {
	const worker = new Worker<FlagScheduleJobData>(
		"flag-schedules",
		async (job: Job<FlagScheduleJobData>) => {
			const { scheduleId, type, flagId, stepScheduledAt, stepValue } = job.data;

			logger.info(
				{
					jobId: job.id,
					scheduleId,
					type,
					flagId,
					stepScheduledAt,
					stepValue,
				},
				"Processing flag schedule job"
			);

			try {
				// Fetch schedule from database
				const { db, eq, flagSchedules } = await import("@databuddy/db");
				const schedule = await db.query.flagSchedules.findFirst({
					where: eq(flagSchedules.id, scheduleId),
				});

				if (!schedule) {
					logger.warn(
						{ scheduleId, jobId: job.id },
						"Schedule not found, job will be marked as failed"
					);
					throw new Error(`Schedule not found: ${scheduleId}`);
				}

				if (!schedule.isEnabled) {
					logger.info(
						{ scheduleId, jobId: job.id },
						"Schedule is disabled, skipping execution"
					);
					return { success: true, skipped: true, reason: "disabled" };
				}

				if (schedule.executedAt && schedule.type !== "update_rollout") {
					logger.info(
						{ scheduleId, jobId: job.id },
						"Schedule already executed, skipping"
					);
					return {
						success: true,
						skipped: true,
						reason: "already_executed",
					};
				}

				// Execute the schedule
				if (
					schedule.type === "update_rollout" &&
					stepScheduledAt &&
					stepValue !== undefined
				) {
					const stepAlreadyExecuted = schedule.rolloutSteps?.some(
						(step) => step.scheduledAt === stepScheduledAt && step.executedAt
					);

					if (stepAlreadyExecuted) {
						logger.info(
							{
								scheduleId,
								stepScheduledAt,
								jobId: job.id,
							},
							"Rollout step already executed, skipping"
						);
						return {
							success: true,
							skipped: true,
							reason: "step_already_executed",
						};
					}

					await executeSchedule({
						...schedule,
						__isStep: true,
						stepValue,
						stepScheduledAt,
					});
				} else {
					await executeSchedule(schedule);
				}

				logger.info(
					{ scheduleId, jobId: job.id },
					"Flag schedule executed successfully"
				);

				return { success: true, scheduleId };
			} catch (error) {
				logger.error(
					{ error, scheduleId, jobId: job.id },
					"Failed to process flag schedule job"
				);
				throw error; // Re-throw to mark job as failed
			}
		},
		{
			connection,
			concurrency: 10, // Process up to 10 jobs concurrently
			limiter: {
				max: 100, // Max 100 jobs
				duration: 1000, // Per second
			},
		}
	);

	worker.on("completed", (job: Job<FlagScheduleJobData>) => {
		logger.info(
			{ jobId: job.id, scheduleId: job.data.scheduleId },
			"Flag schedule job completed"
		);
	});

	worker.on(
		"failed",
		(job: Job<FlagScheduleJobData> | undefined, err: Error) => {
			logger.error(
				{
					jobId: job?.id,
					scheduleId: job?.data.scheduleId,
					error: err,
				},
				"Flag schedule job failed"
			);
		}
	);

	worker.on("error", (err: Error) => {
		logger.error({ error: err }, "Flag scheduler worker error");
	});

	logger.info("Flag scheduler worker started");

	return worker;
}
