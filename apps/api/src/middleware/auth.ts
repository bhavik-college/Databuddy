import { createMiddleware } from 'hono/factory'
import { auth } from "./betterauth"
import { logger } from '../lib/logger';
import { db, session } from "@databuddy/db";
import { eq, and } from "drizzle-orm";
import { websites, projectAccess } from "@databuddy/db";

// Helper function to verify website access
async function verifyWebsiteAccess(userId: string, websiteId: string): Promise<boolean> {
  try {
    // First check if user owns the website
    const website = await db.query.websites.findFirst({
      where: eq(websites.id, websiteId)
    });

    if (!website) return false;
    if (website.userId === userId) return true;

    // Then check if user has access through project access
    if (website.projectId) {
      const access = await db.query.projectAccess.findFirst({
        where: and(
          eq(projectAccess.projectId, website.projectId),
          eq(projectAccess.userId, userId)
        )
      });
      
      return !!access;
    }

    return false;
  } catch (error) {
    logger.error('Error verifying website access:', { error, userId, websiteId });
    return false;
  }
}

// Helper function to log audit events
async function logAuditEvent(event: {
  userId: string;
  action: string;
  path: string;
  method: string;
  ip: string;
  details?: Record<string, any>;
}) {
  try {
    // Log to console for now - implement proper audit logging later
    logger.info('Audit event:', {
      ...event,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error logging audit event:', { error, event });
  }
}

export const authMiddleware = createMiddleware(async (c, next) => {
  const startTime = Date.now();
  const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
  const path = c.req.path;
  const method = c.req.method;

  try {
    // Check rate limit
    // if (!checkRateLimit(ip)) {
    //   return c.json({
    //     success: false,
    //     error: 'Too many requests',
    //     code: 'RATE_LIMIT_EXCEEDED'
    //   }, 429);
    // }

    // Get session
    const session = await auth.api.getSession({ 
      headers: c.req.raw.headers 
    });

    // Set context
    c.set('user', session?.user || null);
    c.set('session', session || null);

    // Check if route requires authentication
    // if (isProtectedRoute(path)) {
    //   if (!session) {
    //     return c.json({
    //       success: false,
    //       error: 'Authentication required',
    //       code: 'AUTH_REQUIRED'
    //     }, 401);
    //   }

      // Check role requirements
      // const requiredRoles = getRequiredRoles(path);
      // if (requiredRoles.length > 0) {
      //   const userRole = session.user.role || 'USER';
      //   if (!requiredRoles.includes(userRole)) {
      //     return c.json({
      //       success: false,
      //       error: 'Insufficient permissions',
      //       code: 'INSUFFICIENT_PERMISSIONS'
      //     }, 403);
      //   }
      // }

      // Check website access for analytics routes
      if (path.startsWith('/analytics/') && session) {
        const websiteId = c.req.query('website_id');
        if (websiteId) {
          const hasAccess = await verifyWebsiteAccess(session.user.id, websiteId);
          if (!hasAccess) {
            return c.json({
              success: false,
              error: 'Unauthorized access to website',
              code: 'UNAUTHORIZED_WEBSITE_ACCESS'
            }, 403);
          }
        }
      }

    // Log audit event for authenticated requests
    if (session) {
      await logAuditEvent({
        userId: session.user.id,
        action: 'api_access',
        path,
        method,
        ip,
        details: {
          userAgent: c.req.header('user-agent'),
          responseTime: Date.now() - startTime
        }
      });
    }

    return next();
  } catch (error) {
    logger.error('Auth middleware error:', { 
      error,
      path,
      method,
      ip
    });
    
    return c.json({
      success: false,
      error: 'Authentication service error',
      code: 'AUTH_SERVICE_ERROR'
    }, 500);
  }
}); 