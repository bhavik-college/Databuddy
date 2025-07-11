import { websitesRouter } from "./routers/websites";
import { miniChartsRouter } from "./routers/mini-charts";
import { funnelsRouter } from "./routers/funnels";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  websites: websitesRouter,
  miniCharts: miniChartsRouter,
  funnels: funnelsRouter,
});

export type AppRouter = typeof appRouter;