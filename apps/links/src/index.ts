import { Elysia } from "elysia";
import { redirectRoute } from "./routes/redirect";

const app = new Elysia()
	.get("/health", () => ({ status: "ok" }))
	.use(redirectRoute);

export default {
	port: 4001,
	fetch: app.fetch,
};
