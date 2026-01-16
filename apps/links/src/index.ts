import { Elysia } from "elysia";
import { redirectRoute } from "./routes/redirect";

const app = new Elysia()
	.get("/", () => ({ status: "ok" }))
	.get("/health", () => ({ status: "ok" }))
	.use(redirectRoute);

export default {
	port: 2500,
	fetch: app.fetch,
};