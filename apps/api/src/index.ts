import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import trpcRoutes from './routes/trpc';
import { highlightMiddleware } from '@highlight-run/hono'

// Create the main Hono app
const app = new Hono();
app.use(highlightMiddleware({
  projectID: 'ney0p09d'
}))

// Add middleware
app.use('*', logger());
// app.use('*', cors({
//   origin: ['http://localhost:3000', 'https://databuddy.cc'],
//   credentials: true,
// }));

// Health check route
app.get('/', (c) => c.json({ status: 'ok', version: '1.0.0' }));

// Mount tRPC routes
app.route('/trpc', trpcRoutes);

// Start the server if not in production (Cloudflare Workers)
if (process.env.NODE_ENV !== 'production') {
  const port = process.env.PORT || 3001;
  console.log(`Server is running on port ${port}`);
  
  serve({
    fetch: app.fetch,
    port: Number(port),
  });
}

app.onError((err, c) => {
  throw new Error('Internal Server Error', { cause: err });
});

app.notFound((c) => {
  throw new Error('Route not found', { cause: c });
});

// Export the app for Cloudflare Workers
export default app;
