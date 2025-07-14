import { Elysia } from "elysia";
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter, createTRPCContext } from '@databuddy/rpc';
import { query } from "./routes/query";

import cors from '@elysiajs/cors';

const app = new Elysia();

const isDev = process.env.NODE_ENV === 'development';
const allowedOrigins = [
  'https://staging.databuddy.cc',
  'https://app.databuddy.cc',
];
app.get('/', () => {
  return 'Hello World';
})
  .onBeforeHandle(({ request, set }) => {
    const origin = request.headers.get('origin');
    set.headers ??= {};
    set.headers['Access-Control-Allow-Origin'] = origin || 'https://staging.databuddy.cc';
    set.headers['Access-Control-Allow-Credentials'] = 'true';
    set.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Cookie, Cache-Control, X-Website-Id';
    set.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS, GET, DELETE, PUT, PATCH, HEAD';
    set.headers['Access-Control-Expose-Headers'] = 'Content-Type, Set-Cookie';
    set.headers['Access-Control-Max-Age'] = '600';
    set.headers.Vary = 'Origin, Access-Control-Request-Headers';
  })
  .options('*', () => new Response(null, { status: 204 }))
  .use(query)
  .all('/trpc/*', async ({ request }) => {
    return fetchRequestHandler({
      endpoint: '/trpc',
      router: appRouter,
      req: request,
      createContext: () => createTRPCContext({ headers: request.headers }),
    });
  });

app.listen(3001)
  .onStart(() => {
    console.log('Server is running on port 3001');
  });

app.onError(({ error, code }) => {
  console.error(error);
  return {
    success: false,
    code: code
  };
});