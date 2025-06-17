import { eq } from "@databuddy/db";
import { websites } from "@databuddy/db";
import { db } from "@databuddy/db";
import { cacheable } from "@databuddy/redis";
import { createMiddleware } from "hono/factory";

export const getWebsiteById = cacheable(
    async (id: string): Promise<any> => {
      return db.query.websites.findFirst({
        where: eq(websites.id, id)
      });
    },
    {
      expireInSec: 300, 
      prefix: 'website_by_id',
      staleWhileRevalidate: true,
      staleTime: 60
    }
  );

// Import the existing checkWebsiteAccess function
import { verifyWebsiteAccess } from './auth';


  

export const websiteAuthHook = createMiddleware(async (c, next) => {
  const websiteId = c.req.header('X-Website-Id') || c.req.query('website_id') || c.req.query('websiteId');
  const user = c.get('user');

  if (!websiteId) {
    return c.json({
      success: false,
      error: 'Website ID is required',
      code: 'WEBSITE_ID_REQUIRED' 
    }, 401);
  }

  if (!user) {
    return c.json({
      success: false,
      error: 'User authentication required',
      code: 'AUTH_REQUIRED'
    }, 401);
  }

  // Use the existing verifyWebsiteAccess function to check permissions
  const hasAccess = await verifyWebsiteAccess(user.id, websiteId, user.role || 'USER');

  if (!hasAccess) {
    return c.json({
      success: false,
      error: 'Unauthorized access to website',
      code: 'UNAUTHORIZED_WEBSITE_ACCESS'
    }, 403);
  }

  // Get the website data after access is verified
  const website = await getWebsiteById(websiteId);

  if (!website) {
    return c.json({
      success: false,
      error: 'Website not found',
      code: 'WEBSITE_NOT_FOUND'
    }, 404);
  }   

  c.set('website', website);
  await next();
});


