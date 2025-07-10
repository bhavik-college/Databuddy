import { websitesRouter } from "./routers/websites";
import { analyticsRouter } from "./routers/analytics";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  websites: websitesRouter,
  analytics: analyticsRouter,
});

export type AppRouter = typeof appRouter;