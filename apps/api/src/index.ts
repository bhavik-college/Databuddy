import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { auth, type User, type Session } from '@databuddy/auth';
import analyticsRouter from './routes/v1/analytics';
import assistantRouter from './routes/v1/assistant';
import queryRouter from './routes/v1/query';
import domainInfoRouter from './routes/v1/domain-info';
import websitesRouter from './routes/v1/websites';
import domainsRouter from './routes/v1/domains';
import funnelRouter from './routes/v1/funnels';
import revenueRouter from './routes/v1/revenue';
import redditRouter from './routes/v1/reddit';
import { uploadRouter } from './routes/v1/upload';
import { logger } from './lib/logger';
import { logger as discordLogger } from './lib/discord-webhook';
import { logger as HonoLogger } from "hono/logger"
import { sentry } from '@hono/sentry'
import './polyfills/compression'

type AppVariables = {
  Variables: {
    user: User;
    session: Session;
  }
}

const app = new Hono<AppVariables>();

app.use('*', sentry())
app.use('*', HonoLogger());

app.use('*', cors({
  origin: process.env.NODE_ENV === 'development' ? "http://localhost:3000" : "https://app.databuddy.cc",
  allowHeaders: [
    'Content-Type',
    'Authorization',
    'Cookie',
    'Cache-Control',
    'X-Website-Id',
  ],
  allowMethods: ['POST', 'OPTIONS', 'GET', 'DELETE', 'PUT', 'PATCH', 'HEAD'],
  credentials: true,
  exposeHeaders: ['Content-Type', 'Set-Cookie'],
  maxAge: 600,
}));

// Mount auth routes first
app.on(['POST', 'GET', 'OPTIONS'], '/api/auth/*', async (c) => {
  try {
    const response = await auth.handler(c.req.raw);
    return response;
  } catch (error: any) {
    logger.error('[Auth Handler Error]:', error);

    // Discord notification for critical auth errors
    await discordLogger.error(
      'Authentication Service Error',
      `Critical error in authentication handler: ${error?.message || 'Unknown error'}`,
      {
        errorName: error?.name || 'Unknown',
        errorMessage: error?.message || 'Unknown error',
        endpoint: 'auth'
      }
    );

    return new Response(JSON.stringify({
      error: 'Authentication error',
      message: error?.message || 'An error occurred in the authentication service'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});


app.route('/v1/analytics', analyticsRouter);
app.route('/v1/assistant', assistantRouter);
app.route('/v1/query', queryRouter);
app.route('/v1/domain-info', domainInfoRouter);
app.route('/v1/websites', websitesRouter);
app.route('/v1/domains', domainsRouter);
app.route('/v1/funnels', funnelRouter);
app.route('/v1/revenue', revenueRouter);
app.route('/v1/reddit', redditRouter);
app.route('/v1/upload', uploadRouter);

app.get('/health', (c) => c.json({ status: 'ok', version: '1.0.0' }));
app.get('/', (c) => c.json({ status: 'ok', version: '1.0.0' }));

// Error handling
// app.onError(async (err) => {
//   logger.error({
//     message: `[API Error]: ${err.message}`,
//     stack: err.stack,
//     name: err.name
//   });

//   // Discord notification for critical API errors
//   await discordLogger.error(
//     'API Error',
//     `Unhandled error in API: ${err.message}`,
//     {
//       errorName: err.name,
//       errorMessage: err.message,
//       stackTrace: err.stack?.slice(0, 500) || 'No stack trace'
//     }
//   );

//   return new Response(JSON.stringify({ 
//     error: err.message || 'Internal Server Error',
//     status: 500
//   }), { 
//     status: 500,
//     headers: { 'Content-Type': 'application/json' }
//   });
// });

app.notFound((c) => {
  return new Response(JSON.stringify({ error: 'Route not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  });
});

Bun.serve({
  fetch: app.fetch,
  port: process.env.PORT || 4001,
  idleTimeout: 30,
});