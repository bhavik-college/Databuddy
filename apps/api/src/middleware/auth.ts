import { createMiddleware } from 'hono/factory'
import { auth } from "./betterauth"
import { logger } from '../lib/logger';
import { db } from "@databuddy/db";
import { eq, and } from "drizzle-orm";
import { websites, projects } from "@databuddy/db";
import { cacheable } from "@databuddy/redis";

// Helper function to verify website access with caching
export const verifyWebsiteAccess = cacheable(
  async (userId: string, websiteId: string, role: string): Promise<boolean> => {
    try {
      // First check if user owns the website
      const website = await db.query.websites.findFirst({
        where: eq(websites.id, websiteId)
      });

      if (!website) return false;
      if (role === 'ADMIN') return true;
      if (website.userId === userId) return true;

      // Then check if user has access through project access
      if (website.projectId) {
        const access = await db.query.projects.findFirst({
          where: and(
            eq(projects.id, website.projectId),
            eq(projects.organizationId, userId)
          )
        });
        
        return !!access;
      }

      return false;
    } catch (error) {
      logger.error('Error verifying website access:', { error, userId, websiteId });
      return false;
    }
  },
  {
    expireInSec: 300, // Cache for 5 minutes
    prefix: 'website-access',
    staleWhileRevalidate: true,
    staleTime: 60 // Revalidate if data is older than 1 minute
  }
);

export const authMiddleware = createMiddleware(async (c, next) => {
  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-real-ip') || 'unknown';
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

    if (!session) {
      return c.json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      }, 401);
    }
    // Set context
    c.set('user', session.user);
    c.set('session', session);

      // Check website access for analytics routes
      if (path.startsWith('/analytics/') && session) {
        const websiteId = c.req.query('website_id');
        if (websiteId) {
          const hasAccess = await verifyWebsiteAccess(session.user.id, websiteId, session.user.role);
          if (!hasAccess) {
            return c.json({
              success: false,
              error: 'Unauthorized access to website',
              code: 'UNAUTHORIZED_WEBSITE_ACCESS'
            }, 403);
          }
        }
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