import { createMiddleware } from 'hono/factory'
import { db, eq, websites } from "@databuddy/db";
import { cacheable } from "@databuddy/redis";
import { auth } from './betterauth';
import { logger } from '../lib/logger';

type Permission = { [key: string]: string[] };

/**
 * Caches and retrieves website data by ID.
 */
export const getWebsiteById = cacheable(
  async (id: string) => {
    try {
      if (!id) return null;
      return await db.query.websites.findFirst({
        where: eq(websites.id, id),
      });
    } catch (error) {
      logger.error('Error fetching website by ID:', { error, id });
      return null;
    }
  },
  {
    expireInSec: 600,
    prefix: 'website_by_id',
    staleWhileRevalidate: true,
    staleTime: 60
  }
);

/**
 * Creates an authorization middleware for website access.
 * This should be used AFTER the main authMiddleware.
 */
export const websiteAuthHook = (permission: Permission = { website: ["read"] }) => {
  return createMiddleware(async (c, next) => {
    const user = c.get('user');
    const session = c.get('session');

    if (!user || !session) {
      return c.json({ success: false, error: 'Unauthorized: User context missing' }, 401);
    }

    const websiteId = c.req.header('X-Website-Id') || c.req.query('website_id') || c.req.param('id');

    if (!websiteId) {
      return c.json({ success: false, error: 'Website ID is required' }, 400);
    }

    // Bypass for the public demo website
    if (websiteId === 'OXmNQsViBT-FOS_wZCTHc') {
      const demoWebsite = await getWebsiteById(websiteId);
      c.set('website', demoWebsite);
      return next();
    }

    if (user.role === 'ADMIN' || user.role === 'owner') {
      const website = await getWebsiteById(websiteId);
      c.set('website', website);
      return next();
    }

    const website = await getWebsiteById(websiteId);
    if (!website) {
      return c.json({ success: false, error: 'Website not found' }, 404);
    }

    const hasOwnership = website.userId === user.id;

    if (website.organizationId) {

      const { success: hasPermission } = await auth.api.hasPermission({
        headers: c.req.raw.headers,
        body: { permissions: permission }
      });

      if (!hasPermission) {
        return c.json({ success: false, error: 'Permission denied within organization.' }, 403);
      }
    }
    else {
      if (!hasOwnership) {
        return c.json({ success: false, error: 'You do not own this website.' }, 403);
      }
    }

    c.set('website', website);
    await next();
  });
};


