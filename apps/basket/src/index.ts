import { Hono } from 'hono';
import { cors } from 'hono/cors';
import basketRouter from './routes/basket';
import { logger } from './lib/logger';
import { sentry } from '@hono/sentry'

const app = new Hono();

app.use('*', sentry())

app.use('*', cors({
  origin: (origin) => {
    return origin;
  },
  allowMethods: ['POST', 'OPTIONS', 'GET', 'PING'],
  allowHeaders: ['Content-Type', 'databuddy-client-id', 'databuddy-client-secret', 'databuddy-sdk-name', 'databuddy-sdk-version'],
  exposeHeaders: ['Content-Type'],
  credentials: true,
  maxAge: 600,
}));

app.route('/', basketRouter);

app.get('/health', (c) => c.json({ status: 'ok', version: '1.0.0' }));

app.onError((err) => {
  logger.error({
    name: err.name,
    message: err.message,
    stack: err.stack,
  });
  return new Response(JSON.stringify({ 
    error: 'Internal Server Error',
    status: 500
  }), { 
    status: 500,
    headers: { 'Content-Type': 'application/json' }
  });
});

app.notFound(() => {
  return new Response(JSON.stringify({ error: 'Route not found' }), { 
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  });
});


export default {
  fetch: app.fetch,
  port: process.env.PORT || 4001,
};
