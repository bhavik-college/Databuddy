import { funnelsRouter } from './routers/funnels';
import { goalsRouter } from './routers/goals';
import { miniChartsRouter } from './routers/mini-charts';
import { preferencesRouter } from './routers/preferences';
import { websitesRouter } from './routers/websites';
import { createTRPCRouter } from './trpc';

export const appRouter = createTRPCRouter({
  websites: websitesRouter,
  miniCharts: miniChartsRouter,
  funnels: funnelsRouter,
  preferences: preferencesRouter,
  goals: goalsRouter,
});

export type AppRouter = typeof appRouter;
