import { Elysia } from "elysia";
import { disconnectProducer } from "./lib/producer";
import { expiredRoute } from "./routes/expired";
import { redirectRoute } from "./routes/redirect";

const app = new Elysia()
	.get("/", () => ({ status: "ok" }))
	.get("/health", () => ({ status: "ok" }))
	.use(expiredRoute)
	.use(redirectRoute);

process.on("SIGTERM", async () => {
	console.log("SIGTERM received, shutting down gracefully...");
	await disconnectProducer();
	process.exit(0);
});

process.on("SIGINT", async () => {
	console.log("SIGINT received, shutting down gracefully...");
	await disconnectProducer();
	process.exit(0);
});

export default {
	port: 2500,
	fetch: app.fetch,
};