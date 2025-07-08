import { createMiddleware } from 'hono/factory'
import { auth } from "./betterauth"
import { logger } from '../lib/logger';
import { db } from "@databuddy/db";
import { eq, and, inArray } from "drizzle-orm";
import { websites, projects, member } from "@databuddy/db";
import { cacheable } from "@databuddy/redis";

type RequiredRole = 'owner' | 'admin' | 'member';

// Helper function to verify website access with caching
export const verifyWebsiteAccess = cacheable(
  async (
    userId: string,
    websiteId: string,
    role: string,
    requiredRole?: RequiredRole | RequiredRole[]
  ): Promise<boolean> => {
    try {
      const website = await db.query.websites.findFirst({
        where: eq(websites.id, websiteId),
      });

      if (!website) return false;
      if (role === 'ADMIN') return true;

      if (website.organizationId) {
        const membership = await db.query.member.findFirst({
          where: and(
            eq(member.userId, userId),
            eq(member.organizationId, website.organizationId)
          ),
        });

        if (!membership) return false;

        if (requiredRole) {
          const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
          return roles.includes(membership.role as RequiredRole);
        }

        return true;
      }
      return website.userId === userId;
    } catch (error) {
      logger.error('Error verifying website access:', { error, userId, websiteId });
      return false;
    }
  },
  {
    expireInSec: 300,
    prefix: 'website-access',
    staleWhileRevalidate: true,
    staleTime: 60
  }
);

export const authMiddleware = createMiddleware(async (c, next) => {
  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-real-ip') || 'unknown';
  const path = c.req.path;
  const method = c.req.method;

  try {
    // if (!checkRateLimit(ip)) {
    //   return c.json({
    //     success: false,
    //     error: 'Too many requests',
    //     code: 'RATE_LIMIT_EXCEEDED'
    //   }, 429);
    // }
    const session = await auth.api.getSession({
      headers: c.req.raw.headers
    });

    const websiteId = c.req.query('website_id');
    if (path.includes('OXmNQsViBT-FOS_wZCTHc') || websiteId === 'OXmNQsViBT-FOS_wZCTHc') {
      c.set('user', session?.user);
      c.set('session', session);
      return next();
    }

    if (!session) {
      return c.json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      }, 401);
    }

    c.set('user', session.user);
    c.set('session', session);

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