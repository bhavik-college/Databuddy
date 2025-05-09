import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { auth, type AuthUser, type SessionData } from '@databuddy/auth';
import analyticsRouter from './routes/analytics';
import { logger } from './lib/logger';
import { logger as HonoLogger } from "hono/logger"
import { sentry } from '@hono/sentry'

// Define the Hono app with typed context
type AppVariables = {
  Variables: {
    user: AuthUser; // Replace 'any' with your actual user type
    session: SessionData; // Replace 'any' with your actual session type
  }
}

const app = new Hono<AppVariables>();

app.use('*', sentry())
app.use('*', HonoLogger());

// Configure CORS - must be before auth routes
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
  ],
  allowMethods: ['POST', 'OPTIONS', 'GET'],
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

// Health check route
app.get('/', (c) => c.json({ status: 'ok', version: '1.0.0' }));

// Mount analytics routes with auth middleware
app.route('/analytics', analyticsRouter);

app.get('/health', (c) => c.json({ status: 'ok', version: '1.0.0' }));

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


export default {
  fetch: app.fetch,
  port: process.env.PORT || 4001,
};
