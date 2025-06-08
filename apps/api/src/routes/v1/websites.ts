import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { db, websites, domains, projectAccess, eq, and, or, inArray } from '@databuddy/db';
import { authMiddleware } from '../../middleware/auth';
import { logger } from '../../lib/logger';
import { nanoid } from 'nanoid';
import type { AppVariables } from '../../types';

// Validation schemas
const createWebsiteSchema = z.object({
  name: z.string().min(1),
  domainId: z.string().min(1),
  domain: z.string().min(1),
  subdomain: z.string().optional()
});

const updateWebsiteSchema = z.object({
  name: z.string().min(1)
});

const getWebsiteByIdSchema = z.object({
  id: z.string().min(1)
});

type WebsitesContext = {
  Variables: AppVariables & {
    user: any;
  };
};

export const websitesRouter = new Hono<WebsitesContext>();

// Apply auth middleware to all routes
websitesRouter.use('*', authMiddleware);

// Helper functions
async function getUserProjectIds(userId: string): Promise<string[]> {
  try {
    const projects = await db.query.projectAccess.findMany({
      where: eq(projectAccess.userId, userId),
      columns: {
        projectId: true
      }
    });
    
    return projects.map(access => access.projectId);
  } catch (error) {
    logger.error('[Website API] Error fetching project IDs:', error);
    return [];
  }
}

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
          projectIds.length > 0 ? 
            inArray(websites.projectId, projectIds) : 
            eq(websites.id, "impossible-match")
        )
      )
    });
  } catch (error) {
    logger.error('[Website API] Error checking website access:', error);
    return null;
  }
}

async function verifyDomainAccess(domainId: string, userId: string): Promise<boolean> {
  if (!domainId || !userId) return false;
  
  try {
    const domain = await db.query.domains.findFirst({
      where: and(
        eq(domains.id, domainId),
        eq(domains.verificationStatus, "VERIFIED"),
        eq(domains.userId, userId)
      )
    });

    return !!domain;
  } catch (error) {
    logger.error('[Website API] Error verifying domain access:', error);
    return false;
  }
}

// CREATE - POST /websites
websitesRouter.post('/', zValidator('json', createWebsiteSchema), async (c) => {
  const user = c.get('user');
  const data = c.req.valid('json');

  if (!user) {
    return c.json({ success: false, error: "Unauthorized" }, 401);
  }

  try {
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
    logger.error('[Website API] Error creating website:', error);
    
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
websitesRouter.patch('/:id', zValidator('json', updateWebsiteSchema), async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const { name } = c.req.valid('json');

  if (!user) {
    return c.json({ success: false, error: "Unauthorized" }, 401);
  }

  try {
    logger.info('[Website API] Updating website name:', { id, name, userId: user.id });

    const website = await checkWebsiteAccess(id, user.id);
    if (!website) {
      logger.info('[Website API] Website not found or no access:', id);
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
    logger.error('[Website API] Error updating website:', error);
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
    logger.error('[Website API] Error fetching user websites:', error);
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
    const projectAccessRecord = await db.query.projectAccess.findFirst({
      where: and(
        eq(projectAccess.projectId, projectId),
        eq(projectAccess.userId, user.id)
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
    logger.error('[Website API] Error fetching project websites:', error);
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

    const website = await db.query.websites.findFirst({
      where: or(
        and(
          eq(websites.id, id),
          eq(websites.userId, user.id)
        ),
        and(
          eq(websites.id, id),
          eq(websites.id, "impossible-match")
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
    logger.error('[Website API] Error fetching website:', error);
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
    logger.error('[Website API] Error deleting website:', error);
    return c.json({ 
      success: false, 
      error: "Failed to delete website" 
    }, 500);
  }
});

export default websitesRouter; 