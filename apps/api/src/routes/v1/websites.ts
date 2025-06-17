import { Hono } from 'hono';
import { db, websites, domains, projects, eq, and, or, inArray, sql } from '@databuddy/db';
import { authMiddleware } from '../../middleware/auth';
import { logger } from '../../lib/logger';
import { nanoid } from 'nanoid';
import { cacheable } from '@databuddy/redis';
import type { AppVariables } from '../../types';
import { z } from 'zod';

type WebsitesContext = {
  Variables: AppVariables & {
    user: any;
  };
};

export const websitesRouter = new Hono<WebsitesContext>();

// Validation schemas
const createWebsiteSchema = z.object({
  name: z.string().min(1).max(100).regex(/^[a-zA-Z0-9\s\-_.]+$/, 'Invalid website name format'),
  domain: z.string().min(1).max(253).regex(/^[a-zA-Z0-9.-]+$/, 'Invalid domain format'),
  subdomain: z.string().max(63).regex(/^[a-zA-Z0-9-]*$/, 'Invalid subdomain format').optional(),
  domainId: z.string().uuid('Invalid domain ID format')
});

const updateWebsiteSchema = z.object({
  name: z.string().min(1).max(100).regex(/^[a-zA-Z0-9\s\-_.]+$/, 'Invalid website name format')
});

// Apply auth middleware to all routes
websitesRouter.use('*', authMiddleware);

// Helper functions - Redis cached
async function _getUserProjectIds(userId: string): Promise<string[]> {
  try {
    const userProjects = await db.query.projects.findMany({
      where: eq(projects.organizationId, userId),
      columns: {
        id: true
      }
    });
    
    return userProjects.map(project => project.id);
  } catch (error) {
    logger.error('[Website API] Error fetching project IDs:', { error });
    return [];
  }
}

// Cache user project IDs for 5 minutes with stale-while-revalidate
const getUserProjectIds = cacheable(_getUserProjectIds, {
  expireInSec: 300, // 5 minutes
  prefix: 'user_projects',
  staleWhileRevalidate: true,
  staleTime: 60 // Revalidate if cache is older than 1 minute
});

async function checkWebsiteAccess(id: string, userId: string) {
  try {
    const projectIds = await getUserProjectIds(userId);
    
    return await db.query.websites.findFirst({
      where: or(
        and(
          eq(websites.id, id),
          eq(websites.userId, userId)
        ),
        and(
          eq(websites.id, id),
          projectIds.length > 0 ? inArray(websites.projectId, projectIds) : sql`FALSE`
        )
      )
    });
  } catch (error) {
    logger.error('[Website API] Error checking website access:', { error });
    return null;
  }
}

async function _verifyDomainAccess(domainId: string, userId: string): Promise<boolean> {
  if (!domainId || !userId) return false;
  
  try {
    const domain = await db.query.domains.findFirst({
      where: and(
        eq(domains.id, domainId),
        eq(domains.verificationStatus, "VERIFIED"),
        eq(domains.userId, userId)
      ),
      columns: {
        id: true
      }
    });

    return !!domain;
  } catch (error) {
    logger.error('[Website API] Error verifying domain access:', { error });
    return false;
  }
}

// Cache domain verification for 2 minutes (shorter TTL for security)
const verifyDomainAccess = cacheable(_verifyDomainAccess, {
  expireInSec: 120, // 2 minutes
  prefix: 'domain_access',
  staleWhileRevalidate: true,
  staleTime: 30 // Revalidate if cache is older than 30 seconds
});

// CREATE - POST /websites
websitesRouter.post('/', async (c) => {
  const user = c.get('user');
  const rawData = await c.req.json();

  if (!user) {
    return c.json({ success: false, error: "Unauthorized" }, 401);
  }

  try {
    // Validate input data
    const validationResult = createWebsiteSchema.safeParse(rawData);
    if (!validationResult.success) {
      return c.json({ 
        success: false, 
        error: "Invalid input data",
        details: validationResult.error.issues
      }, 400);
    }
    
    const data = validationResult.data;
    logger.info('[Website API] Creating website with data:', { ...data, userId: user.id });
    
    // Verify domain access
    const hasAccess = await verifyDomainAccess(data.domainId, user.id);
    if (!hasAccess) {
      return c.json({ 
        success: false, 
        error: "Domain not found or not verified" 
      }, 400);
    }

    // Check for existing websites with the same domain
    const fullDomain = data.subdomain 
      ? `${data.subdomain}.${data.domain}`
      : data.domain;

    const existingWebsite = await db.query.websites.findFirst({
      where: eq(websites.domain, fullDomain)
    });

    if (existingWebsite) {
      return c.json({ 
        success: false, 
        error: `A website with the domain "${fullDomain}" already exists` 
      }, 400);
    }

    const [website] = await db
      .insert(websites)
      .values({
        id: nanoid(),
        name: data.name,
        domain: fullDomain,
        domainId: data.domainId,
        userId: user.id,
      })
      .returning();

    logger.info('[Website API] Successfully created website:', website);

    return c.json({
      success: true,
      data: website
    });
  } catch (error) {
    logger.error('[Website API] Error creating website:', { error });
    
    if (error instanceof Error) {
      return c.json({ 
        success: false, 
        error: `Failed to create website: ${error.message}` 
      }, 500);
    }
    return c.json({ 
      success: false, 
      error: "Failed to create website" 
    }, 500);
  }
});

// UPDATE - PATCH /websites/:id
websitesRouter.patch('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const rawData = await c.req.json();

  if (!user) {
    return c.json({ success: false, error: "Unauthorized" }, 401);
  }

  try {
    // Validate input data
    const validationResult = updateWebsiteSchema.safeParse(rawData);
    if (!validationResult.success) {
      return c.json({ 
        success: false, 
        error: "Invalid input data",
        details: validationResult.error.issues
      }, 400);
    }
    
    const { name } = validationResult.data;
    logger.info('[Website API] Updating website name:', { id, name, userId: user.id });

    const website = await checkWebsiteAccess(id, user.id);
    if (!website) {
      logger.info('[Website API] Website not found or no access:', { id });
      return c.json({ 
        success: false, 
        error: "Website not found" 
      }, 404);
    }

    const [updatedWebsite] = await db
      .update(websites)
      .set({ name })
      .where(eq(websites.id, id))
      .returning();

    logger.info('[Website API] Successfully updated website:', updatedWebsite);

    return c.json({
      success: true,
      data: updatedWebsite
    });
  } catch (error) {
    logger.error('[Website API] Error updating website:', { error });
    if (error instanceof Error) {
      return c.json({ 
        success: false, 
        error: `Failed to update website: ${error.message}` 
      }, 500);
    }
    return c.json({ 
      success: false, 
      error: "Failed to update website" 
    }, 500);
  }
});

// GET ALL - GET /websites
websitesRouter.get('/', async (c) => {
  const user = c.get('user');

  if (!user) {
    return c.json({ success: false, error: "Unauthorized" }, 401);
  }

  if (user.role === 'ADMIN') {
    const allWebsites = await db.query.websites.findMany({
      orderBy: (websites, { desc }) => [desc(websites.createdAt)]
    });
    return c.json({
      success: true,
      data: allWebsites
    });
  }

  try {
    const userWebsites = await db.query.websites.findMany({
      where: eq(websites.userId, user.id),
      orderBy: (websites, { desc }) => [desc(websites.createdAt)]
    });
    
    return c.json({
      success: true,
      data: userWebsites
    });
  } catch (error) {
    logger.error('[Website API] Error fetching user websites:', { error });
    return c.json({ 
      success: false, 
      error: "Failed to fetch websites" 
    }, 500);
  }
});

// GET BY PROJECT - GET /websites/project/:projectId
websitesRouter.get('/project/:projectId', async (c) => {
  const user = c.get('user');
  const projectId = c.req.param('projectId');

  if (!user) {
    return c.json({ success: false, error: "Unauthorized" }, 401);
  }

  try {
    // Check if user has access to the project
    const projectAccessRecord = await db.query.projects.findFirst({
      where: and(
        eq(projects.id, projectId),
        eq(projects.organizationId, user.id)
      )
    });

    if (!projectAccessRecord) {
      return c.json({ 
        success: false, 
        error: "You don't have access to this project" 
      }, 403);
    }

    const projectWebsites = await db.query.websites.findMany({
      where: eq(websites.projectId, projectId),
      orderBy: (websites, { desc }) => [desc(websites.createdAt)]
    });
    
    return c.json({
      success: true,
      data: projectWebsites
    });
  } catch (error) {
    logger.error('[Website API] Error fetching project websites:', { error });
    return c.json({ 
      success: false, 
      error: "Failed to fetch project websites" 
    }, 500);
  }
});

// GET BY ID - GET /websites/:id
websitesRouter.get('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  if (!user) {
    return c.json({ success: false, error: "Unauthorized" }, 401);
  }

  try {
    if (user.role === 'ADMIN') {
      const website = await db.query.websites.findFirst({
        where: eq(websites.id, id)
      });
      return c.json({
        success: true,
        data: website
      });
    }

    const projectIds = await getUserProjectIds(user.id);
    
    const website = await db.query.websites.findFirst({
      where: or(
        and(
          eq(websites.id, id),
          eq(websites.userId, user.id)
        ),
        and(
          eq(websites.id, id),
          projectIds.length > 0 ? inArray(websites.projectId, projectIds) : sql`FALSE`
        )
      )
    });
    
    if (!website) {
      return c.json({ 
        success: false, 
        error: "Website not found" 
      }, 404);
    }
    
    return c.json({
      success: true,
      data: website
    });
  } catch (error) {
    logger.error('[Website API] Error fetching website:', { error });
    return c.json({ 
      success: false, 
      error: "Failed to fetch website" 
    }, 500);
  }
});

// DELETE - DELETE /websites/:id
websitesRouter.delete('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  if (!user) {
    return c.json({ success: false, error: "Unauthorized" }, 401);
  }

  try {
    const website = await checkWebsiteAccess(id, user.id);
    if (!website) {
      return c.json({ 
        success: false, 
        error: "Website not found" 
      }, 404);
    }

    await db.delete(websites)
      .where(eq(websites.id, id));

    return c.json({
      success: true,
      data: { success: true }
    });
  } catch (error) {
    logger.error('[Website API] Error deleting website:', { error });
    return c.json({ 
      success: false, 
      error: "Failed to delete website" 
    }, 500);
  }
});

export default websitesRouter; 