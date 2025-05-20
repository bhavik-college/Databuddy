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
  

export const websiteAuthHook = createMiddleware(async (c, next) => {
  const websiteId = c.req.header('X-Website-Id') || c.req.query('website_id');

    if (!websiteId) {
      return c.json({
        success: false,
        error: 'Website ID is required',
        code: 'WEBSITE_ID_REQUIRED' 
      }, 401);
    }

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


