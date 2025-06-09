import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { auth, type User, type Session } from '@databuddy/auth';
import analyticsRouter from './routes/v1/analytics';
import assistantRouter from './routes/v1/assistant';
import queryRouter from './routes/v1/query';
import domainInfoRouter from './routes/v1/domain-info';
import websitesRouter from './routes/v1/websites';
import domainsRouter from './routes/v1/domains';
import { logger } from './lib/logger';
import { logger as HonoLogger } from "hono/logger"
import { sentry } from '@hono/sentry'

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
  origin: (origin) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return '*';
    
    const allowedOrigins = [
      'https://dashboard.databuddy.cc',
      'https://app.databuddy.cc',
      'http://localhost:3000',
      'http://localhost:4000',
      'https://api.databuddy.cc',
      'https://databuddy.cc',
      'https://www.databuddy.cc'
    ];
    
    return allowedOrigins.includes(origin) ? origin : null;
  },
  allowHeaders: [
    'Content-Type',
    'Authorization',
    'Cookie',
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

app.get('/health', (c) => c.json({ status: 'ok', version: '1.0.0' }));
app.get('/', (c) => c.json({ status: 'ok', version: '1.0.0' }));

// Error handling
app.onError((err) => {
  logger.error({
    message: `[API Error]: ${err.message}`,
    stack: err.stack,
    name: err.name
  });
  return new Response(JSON.stringify({ 
    error: err.message || 'Internal Server Error',
    status: 500
  }), { 
    status: 500,
    headers: { 'Content-Type': 'application/json' }
  });
});

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