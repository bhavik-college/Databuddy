import { initTRPC, TRPCError } from '@trpc/server';
import { ZodError } from 'zod';
import { Role } from '@prisma/client';

import { TRPCAccessError, TRPCNotFoundError, TRPCInternalServerError, TRPCBadRequestError } from './errors';

export function createTRPCRouter() {
  return router({
    project: projectRouter,
  });
}

// Context type definition
export interface Context {
  user?: {
    id: string;
    email: string;
    role?: Role;
    name?: string;
  } | null;
}

// Helper to create initial context
export const createContext = async (opts: { 
  req?: Request; 
  user?: Context['user'] 
}): Promise<Context> => {
  return {
    user: opts.user ?? null,
  };
};

// Initialize tRPC
const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

// Export reusable router and procedure helpers
export const router = t.router;
export const publicProcedure = t.procedure;

// Middleware to check if user is authenticated
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      user: ctx.user,
    },
  });
});

// Protected procedure - requires authentication
export const protectedProcedure = t.procedure.use(isAuthed);

// Admin procedure - requires admin role
export const adminProcedure = protectedProcedure.use(
  t.middleware(({ ctx, next }) => {
    if (ctx.user?.role !== Role.ADMIN && ctx.user?.role !== Role.OWNER) {
      throw new TRPCError({ code: 'FORBIDDEN' });
    }
    return next({
      ctx: {
        user: ctx.user,
      },
    });
  })
); 