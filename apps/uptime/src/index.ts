import { Receiver } from "@upstash/qstash";
import Elysia from "elysia";
import { z } from "zod";
import { checkUptime, lookupSchedule } from "./actions";
import { sendUptimeEvent } from "./lib/producer";
import {
	captureError,
	endRequestSpan,
	initTracing,
	shutdownTracing,
	startRequestSpan,
} from "./lib/tracing";

initTracing();

process.on("unhandledRejection", (reason, _promise) => {
	console.error("Unhandled Rejection:", reason);
	captureError(reason);
});

process.on("uncaughtException", (error) => {
	console.error("Uncaught Exception:", error);
	captureError(error);
});

process.on("SIGTERM", async () => {
	console.log("SIGTERM received, shutting down gracefully...");
	await shutdownTracing().catch((error) =>
		console.error("Shutdown error:", error)
	);
	process.exit(0);
});

process.on("SIGINT", async () => {
	console.log("SIGINT received, shutting down gracefully...");
	await shutdownTracing().catch((error) =>
		console.error("Shutdown error:", error)
	);
	process.exit(0);
});

const CURRENT_SIGNING_KEY = process.env.QSTASH_CURRENT_SIGNING_KEY;
const NEXT_SIGNING_KEY = process.env.QSTASH_NEXT_SIGNING_KEY;

if (!(CURRENT_SIGNING_KEY && NEXT_SIGNING_KEY)) {
	throw new Error(
		"QSTASH_SIGNING_KEY and QSTASH_NEXT_SIGNING_KEY environment variables are required"
	);
}

const receiver = new Receiver({
	currentSigningKey: CURRENT_SIGNING_KEY,
	nextSigningKey: NEXT_SIGNING_KEY,
});

const app = new Elysia()
	.state("tracing", {
		span: null as ReturnType<typeof startRequestSpan> | null,
		startTime: 0,
	})
	.onBeforeHandle(function startTrace({ request, path, store }) {
		const method = request.method;
		const startTime = Date.now();
		const span = startRequestSpan(method, request.url, path);

		store.tracing = {
			span,
			startTime,
		};
	})
	.onAfterHandle(function endTrace({ responseValue, store }) {
		if (store.tracing?.span && store.tracing.startTime) {
			const statusCode =
				responseValue instanceof Response ? responseValue.status : 200;
			endRequestSpan(store.tracing.span, statusCode, store.tracing.startTime);
		}
	})
	.onError(function handleError({ error, code, store }) {
		if (store.tracing?.span && store.tracing.startTime) {
			const statusCode = code === "NOT_FOUND" ? 404 : 500;
			endRequestSpan(store.tracing.span, statusCode, store.tracing.startTime);
		}
		captureError(error);
	})
	.get("/health", () => ({ status: "ok" }))
	.post("/", async ({ headers, body }) => {
		try {
			const headerSchema = z.object({
				"upstash-signature": z.string(),
				"x-schedule-id": z.string(),
				"x-max-retries": z.string().optional(),
			});

			const parsed = headerSchema.safeParse(headers);
			if (!parsed.success) {
				return new Response("Missing required headers", { status: 400 });
			}

			const { "upstash-signature": signature, "x-schedule-id": scheduleId } =
				parsed.data;

			const isValid = await receiver.verify({
				// @ts-expect-error, this doesn't require type assertions
				body,
				signature,
				url: "https://uptime.databuddy.cc",
			});

			if (!isValid) {
				return new Response("Invalid signature", { status: 401 });
			}

			const schedule = await lookupSchedule(scheduleId);
			if (!schedule.success) {
				captureError(schedule.error);
				return new Response("Schedule not found", { status: 404 });
			}

			const monitorId = schedule.data.websiteId || scheduleId;

			const maxRetries = parsed.data["x-max-retries"]
				? Number.parseInt(parsed.data["x-max-retries"], 10)
				: 3;

			const result = await checkUptime(monitorId, schedule.data.url, 1, maxRetries);

			if (!result.success) {
				console.error("Uptime check failed:", result.error);
				captureError(result.error);
				return new Response("Failed to check uptime", { status: 500 });
			}

			try {
				await sendUptimeEvent(result.data, monitorId);
			} catch (error) {
				console.error("Failed to send uptime event:", error);
				captureError(error);
			}

			return new Response("Uptime check complete", { status: 200 });
		} catch (error) {
			captureError(error);
			return new Response("Internal server error", { status: 500 });
		}
	});

export default {
	port: 4000,
	fetch: app.fetch,
};
