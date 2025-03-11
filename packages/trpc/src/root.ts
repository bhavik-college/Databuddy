import { router } from './trpc';
// import { userRouter } from './routers/user';
// import { postRouter } from './routers/post';
import { projectRouter } from './routers/project';
import { createTRPCRouter } from './trpc';

export const appRouter = createTRPCRouter({
//   user: userRouter,
//   post: postRouter,
  project: projectRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter; 