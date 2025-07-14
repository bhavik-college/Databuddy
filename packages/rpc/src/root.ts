import { websitesRouter } from "./routers/websites";
import { miniChartsRouter } from "./routers/mini-charts";
import { funnelsRouter } from "./routers/funnels";
import { preferencesRouter } from "./routers/preferences";
import { goalsRouter } from "./routers/goals";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  websites: websitesRouter,
  miniCharts: miniChartsRouter,
  funnels: funnelsRouter,
  preferences: preferencesRouter,
  goals: goalsRouter,
});

export type AppRouter = typeof appRouter;