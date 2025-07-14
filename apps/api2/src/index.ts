import { Elysia } from "elysia";
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter, createTRPCContext } from '@databuddy/rpc';
import { query } from "./routes/query";
import { assistant } from "./routes/assistant";
import cors from "@elysiajs/cors";

const app = new Elysia()
  .use(cors({
    credentials: true,
    origin: process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : 'https://staging.databuddy.cc',
    // origin: (origin) => ['http://localhost:3000', 'https://staging.databuddy.cc'].includes(origin ?? '') ? origin : false
  }))
  .use(query)
  .use(assistant)
  .all('/trpc/*', async ({ request }) => {
    return fetchRequestHandler({
      endpoint: '/trpc',
      router: appRouter,
      req: request,
      createContext: () => createTRPCContext({ headers: request.headers }),
    });
  })
  .onError(({ error, code }) => {
    console.error(error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return { success: false, code };
  })

export default {
  fetch: app.fetch,
  port: 3001
}

process.on('SIGINT', () => {
  console.log('SIGINT signal received, shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received, shutting down...');
  process.exit(0);
});