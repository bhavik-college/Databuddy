import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { createLogger } from '@databuddy/logger';
// import { highlightMiddleware } from '@highlight-run/hono'
import { appRouter } from '@databuddy/trpc';
import { trpcServer } from '@hono/trpc-server'
import { authMiddleware } from './middleware/auth'
import { auth } from '@databuddy/auth';
import { TRPCError } from '@trpc/server';
import basketRouter from './routes/basket';
import adminRouter from './routes/admin';
import analyticsRouter from './routes/analytics';

// Define the Hono app with typed context
type AppVariables = {
  Variables: {
    user: any; // Replace 'any' with your actual user type
    session: any; // Replace 'any' with your actual session type
  }
}

const app = new Hono<AppVariables>();

// // Add core middleware
// app.use(highlightMiddleware({
//   projectID: 'ney0p09d'
// }));

app.use('*', logger());

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
    'databuddy-client-id',
    'databuddy-sdk-name',
    'databuddy-sdk-version',
    'x-user-timezone'
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
    console.error('[Auth Handler Error]:', error);
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

// Mount analytics basket endpoint (no auth required)
app.route('/basket', basketRouter);

// Mount admin routes with auth middleware
app.use('/admin/*', authMiddleware);
app.route('/admin', adminRouter);

// Mount analytics routes with auth middleware
app.route('/analytics', analyticsRouter);

// Add auth middleware for protected routes
app.use('/trpc/*', authMiddleware);

app.get('/session', (c) => {
  return c.json({ session: c.get('session') });
});

// Mount tRPC routes
app.use('/trpc/*', trpcServer({
  router: appRouter,
  createContext: async (opts) => {
    const c = opts.req as any;
    return {
      user: c.user,
      session: c.session
    };
  },
  onError: ({ error, path }) => {
    if (error instanceof TRPCError) {
      console.error(`[tRPC] Error in ${path}:`, error.message);
      return;
    }
    console.error(`[tRPC] Unknown error in ${path}:`, error);
  }
}));

// Error handling
app.onError((err, c) => {
  console.error('[API Error]:', err);
  const status = err instanceof TRPCError ? mapTRPCErrorToStatus(err.code) : 500;
  return new Response(JSON.stringify({ 
    error: err.message || 'Internal Server Error',
    status: err instanceof TRPCError ? err.code : 500
  }), { 
    status,
    headers: { 'Content-Type': 'application/json' }
  });
});

app.notFound((c) => {
  return new Response(JSON.stringify({ error: 'Route not found' }), { 
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  });
});

// Map TRPC error codes to HTTP status codes
function mapTRPCErrorToStatus(code: string): number {
  switch (code) {
    case 'UNAUTHORIZED': return 401;
    case 'FORBIDDEN': return 403;
    case 'NOT_FOUND': return 404;
    case 'TIMEOUT': return 408;
    case 'CONFLICT': return 409;
    case 'PRECONDITION_FAILED': return 412;
    case 'PAYLOAD_TOO_LARGE': return 413;
    case 'METHOD_NOT_SUPPORTED': return 405;
    case 'TOO_MANY_REQUESTS': return 429;
    case 'BAD_REQUEST': return 400;
    default: return 500;
  }
}

// Helper function to access environment variables in both Node.js and Cloudflare Workers
function getEnv(key: string) {
  return process.env[key] || 
         (typeof globalThis.process !== 'undefined' ? globalThis.process.env?.[key] : null) || 
         (typeof globalThis !== 'undefined' && key in globalThis ? (globalThis as Record<string, any>)[key] : null);
}

// Export the app for Cloudflare Workers - DONT ENABLE.
export default {
  fetch: app.fetch,
  port: getEnv('PORT') || 3001,
};
