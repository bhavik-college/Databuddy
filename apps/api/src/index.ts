import { type Context, Hono } from "hono";
import { cors } from "hono/cors";
import { logger as HonoLogger } from "hono/logger";
import { autumnHandler } from "autumn-js/hono";

import type { User, Session } from "@databuddy/auth";
import { auth } from "./middleware/betterauth";
import { logger } from "./lib/logger";
import { logger as discordLogger } from "./lib/discord-webhook";

// Route imports
import analyticsRouter from "./routes/v1/analytics";
import assistantRouter from "./routes/v1/assistant";
import queryRouter from "./routes/v1/query";
import websitesRouter from "./routes/v1/websites";
import funnelRouter from "./routes/v1/funnels";
import revenueRouter from "./routes/v1/revenue";
import redditRouter from "./routes/v1/reddit";
import { uploadRouter } from "./routes/v1/upload";
import { healthRouter } from "./routes/v1/health";

// Polyfills
import "./polyfills/compression";

// Types
type AppVariables = {
	Variables: {
		user: User;
		session: Session;
	};
};

// Configuration
const isDevelopment = process.env.NODE_ENV === "development";
const corsOrigin = isDevelopment
	? "http://localhost:3000"
	: "https://app.databuddy.cc";

const corsConfig = {
	origin: corsOrigin,
	allowHeaders: [
		"Content-Type",
		"Authorization",
		"Cookie",
		"Cache-Control",
		"X-Website-Id",
	],
	allowMethods: ["POST", "OPTIONS", "GET", "DELETE", "PUT", "PATCH", "HEAD"],
	credentials: true,
	exposeHeaders: ["Content-Type", "Set-Cookie"],
	maxAge: 600,
};

const serverConfig = {
	port: Number(process.env.PORT) || 4000,
	idleTimeout: 30,
};

// Helper functions
const createErrorResponse = (error: string, message: string, status = 500) => {
	return new Response(
		JSON.stringify({ error, message, status }),
		{
			status,
			headers: { "Content-Type": "application/json" },
		},
	);
};

const handleAuthError = async (error: unknown) => {
	const errorMessage = error instanceof Error ? error.message : "Unknown error";
	const errorName = error instanceof Error ? error.name : "Unknown";

	logger.error("[Auth Handler Error]:", error);

	await discordLogger.error(
		"Authentication Service Error",
		`Critical error in authentication handler: ${errorMessage}`,
		{
			errorName,
			errorMessage,
			endpoint: "auth",
		},
	);

	return createErrorResponse(
		"Authentication error",
		`An error occurred in the authentication service: ${errorMessage}`,
	);
};

// App initialization
const app = new Hono<AppVariables>();

// Middleware
app.use("*", HonoLogger());
app.use("*", cors(corsConfig));

// Authentication handler
app.on(["POST", "GET", "OPTIONS"], "/api/auth/*", async (c) => {
	try {
		const response = await auth.handler(c.req.raw);
		return response;
	} catch (error) {
		return handleAuthError(error);
	}
});

// Autumn handler for billing/payments
app.use(
	"/api/autumn/*",
	autumnHandler({
		identify: async (c: Context) => {
			try {
				const session = await auth.api.getSession({
					headers: c.req.raw.headers,
				});

				if (!session?.user?.id) {
					return {
						customerId: undefined,
						customerData: {},
					};
				}


				return {
					customerId: session.user.id,
					customerData: {
						name: session.user.name,
						email: session.user.email,
					},
				};
			} catch (error) {
				logger.error("[Autumn] Error in identify function:", error);
				throw error;
			}
		},
	}),
);

// API routes
app.route("/v1/analytics", analyticsRouter);
app.route("/v1/assistant", assistantRouter);
app.route("/v1/query", queryRouter);
app.route("/v1/websites", websitesRouter);
app.route("/v1/funnels", funnelRouter);
app.route("/v1/revenue", revenueRouter);
app.route("/v1/reddit", redditRouter);
app.route("/v1/upload", uploadRouter);

// Health check endpoints
app.route("/health", healthRouter);
app.get("/", (c) => c.json({ status: "ok", version: "1.0.0" }));

// Error handlers
app.onError(async (err) => {
	logger.error({
		message: `[API Error]: ${err.message}`,
		stack: err.stack,
		name: err.name,
	});

	await discordLogger.error(
		"API Error",
		`Unhandled error in API: ${err.message}`,
		{
			errorName: err.name,
			errorMessage: err.message,
			stackTrace: err.stack?.slice(0, 500) || "No stack trace",
		},
	);

	return createErrorResponse(
		err.message || "Internal Server Error",
		"An unexpected error occurred",
	);
});

app.notFound(() => {
	return createErrorResponse("Route not found", "The requested endpoint does not exist", 404);
});

Bun.serve({
	fetch: app.fetch,
	port: serverConfig.port,
	idleTimeout: serverConfig.idleTimeout,
});

logger.info(`🚀 API server running on port ${serverConfig.port}`);