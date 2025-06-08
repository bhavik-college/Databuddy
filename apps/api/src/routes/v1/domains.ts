import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { db, domains, eq, projectAccess, and, or, inArray } from '@databuddy/db';
import type { AppVariables } from '../../types';
import { authMiddleware } from '../../middleware/auth';
import { logger } from '../../lib/logger';
import { Resolver } from "node:dns";
import { randomUUID, randomBytes } from "node:crypto";

// DNS resolver setup
const resolver = new Resolver();
resolver.setServers(["8.8.8.8", "1.1.1.1"]);

// Validation schemas
const createDomainSchema = z.object({
  name: z.string().min(1, 'Domain name is required'),
  userId: z.string().optional(),
  projectId: z.string().optional(),
});

const updateDomainSchema = z.object({
  name: z.string().min(1, 'Domain name is required').optional(),
});

// Types for domain context
type DomainsContext = {
  Variables: AppVariables;
};

// Helper functions
function generateVerificationToken() {
  const token = `databuddy_${randomBytes(16).toString("hex")}`;
  console.log(`[Verification] Generated token: ${token}`);
  return token;
}

async function getUserProjectIds(userId: string) {
  const access = await db.query.projectAccess.findMany({
    where: eq(projectAccess.userId, userId),
    columns: { projectId: true }
  });
  return access.map(a => a.projectId);
}

async function findAccessibleDomain(user: any, id: string) {
  const projectIds = await getUserProjectIds(user.id);
  return db.query.domains.findFirst({
    where: or(
      and(eq(domains.id, id), eq(domains.userId, user.id)),
      and(
        eq(domains.id, id),
        projectIds.length > 0 ? inArray(domains.projectId, projectIds) : eq(domains.id, "impossible-match")
      )
    )
  });
}

function getOwnerData(user: any, data: { userId?: string; projectId?: string }) {
  if (data.userId) return { userId: data.userId };
  if (data.projectId) return { projectId: data.projectId };
  return { userId: user.id };
}

// Create router
export const domainsRouter = new Hono<DomainsContext>();

// Apply auth middleware to all routes
domainsRouter.use('*', authMiddleware);

/**
 * Get all user domains
 * GET /domains
 */
domainsRouter.get('/', async (c) => {
  const user = c.get('user');

  try {
    const userDomains = await db.query.domains.findMany({
      where: eq(domains.userId, user.id),
      orderBy: (domains, { desc }) => [desc(domains.createdAt)]
    });

    return c.json({
      success: true,
      data: userDomains
    });
  } catch (error) {
    logger.error('Error fetching domains', { error, userId: user.id });
    return c.json({ 
      success: false, 
      error: 'Failed to fetch domains' 
    }, 500);
  }
});

/**
 * Get domain by ID
 * GET /domains/:id
 */
domainsRouter.get('/:id', async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();

  try {
    const domain = await findAccessibleDomain(user, id);
    if (!domain) {
      return c.json({ 
        success: false, 
        error: 'Domain not found' 
      }, 404);
    }

    return c.json({
      success: true,
      data: domain
    });
  } catch (error) {
    logger.error('Error fetching domain', { error, domainId: id, userId: user.id });
    return c.json({ 
      success: false, 
      error: 'Failed to fetch domain' 
    }, 500);
  }
});

/**
 * Get domains by project ID
 * GET /domains/project/:projectId
 */
domainsRouter.get('/project/:projectId', async (c) => {
  const user = c.get('user');
  const { projectId } = c.req.param();

  try {
    const access = await db.query.projectAccess.findFirst({
      where: and(eq(projectAccess.projectId, projectId), eq(projectAccess.userId, user.id))
    });
    
    if (!access) {
      return c.json({ 
        success: false, 
        error: "You don't have access to this project" 
      }, 403);
    }

    const projectDomains = await db.query.domains.findMany({
      where: eq(domains.projectId, projectId),
      orderBy: (domains, { desc }) => [desc(domains.createdAt)]
    });

    return c.json({
      success: true,
      data: projectDomains
    });
  } catch (error) {
    logger.error('Error fetching project domains', { error, projectId, userId: user.id });
    return c.json({ 
      success: false, 
      error: 'Failed to fetch project domains' 
    }, 500);
  }
});

/**
 * Create domain
 * POST /domains
 */
domainsRouter.post('/', zValidator('json', createDomainSchema), async (c) => {
  const user = c.get('user');
  const data = c.req.valid('json');

  try {
    console.log(`[Domain] Creating: ${data.name}`);
    
    // Check if domain already exists
    const existingDomain = await db.query.domains.findFirst({ 
      where: eq(domains.name, data.name) 
    });
    
    if (existingDomain) {
      return c.json({ 
        success: false, 
        error: 'Domain already exists' 
      }, 400);
    }

    const verificationToken = generateVerificationToken();
    const ownerData = getOwnerData(user, data);
    const domainId = randomUUID();

    await db.insert(domains).values({
      id: domainId,
      name: data.name,
      verificationToken,
      verificationStatus: "PENDING",
      ...ownerData
    });

    const createdDomain = await db.query.domains.findFirst({ 
      where: eq(domains.id, domainId) 
    });

    // TODO: Log domain creation to Discord webhook if available

    return c.json({
      success: true,
      data: createdDomain
    });
  } catch (error) {
    logger.error('Domain creation failed', { error, domainName: data.name, userId: user.id });
    return c.json({ 
      success: false, 
      error: 'Failed to create domain' 
    }, 500);
  }
});

/**
 * Update domain
 * PATCH /domains/:id
 */
domainsRouter.patch('/:id', zValidator('json', updateDomainSchema), async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();
  const data = c.req.valid('json');

  try {
    console.log(`[Domain] Updating: ${id}`);
    
    const domain = await findAccessibleDomain(user, id);
    if (!domain) {
      return c.json({ 
        success: false, 
        error: 'Domain not found' 
      }, 404);
    }

    await db.update(domains).set(data).where(eq(domains.id, id));
    
    const updatedDomain = await db.query.domains.findFirst({ 
      where: eq(domains.id, id) 
    });

    return c.json({
      success: true,
      data: updatedDomain
    });
  } catch (error) {
    logger.error('Domain update failed', { error, domainId: id, userId: user.id });
    return c.json({ 
      success: false, 
      error: 'Failed to update domain' 
    }, 500);
  }
});

/**
 * Delete domain
 * DELETE /domains/:id
 */
domainsRouter.delete('/:id', async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();

  try {
    console.log(`[Domain] Deleting: ${id}`);
    
    const domain = await findAccessibleDomain(user, id);
    if (!domain) {
      return c.json({ 
        success: false, 
        error: 'Domain not found' 
      }, 404);
    }

    await db.delete(domains).where(eq(domains.id, id));

    // TODO: Log domain deletion to Discord webhook if available

    return c.json({
      success: true,
      data: { success: true }
    });
  } catch (error) {
    logger.error('Domain deletion failed', { error, domainId: id, userId: user.id });
    return c.json({ 
      success: false, 
      error: 'Failed to delete domain' 
    }, 500);
  }
});

/**
 * Check domain verification
 * POST /domains/:id/verify
 */
domainsRouter.post('/:id/verify', async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();

  if (!id) {
    return c.json({ 
      success: false, 
      error: 'Invalid domain ID' 
    }, 400);
  }

  try {
    console.log(`[Verification] Checking: ${id}`);
    
    const domain = await findAccessibleDomain(user, id);
    if (!domain) {
      return c.json({ 
        success: false, 
        error: 'Domain not found' 
      }, 404);
    }

    if (!domain.name) {
      return c.json({ 
        success: false, 
        error: 'Invalid domain name' 
      }, 400);
    }

    const isLocalhost = domain.name.includes("localhost") || domain.name.includes("127.0.0.1");
    
    // Auto-verify localhost domains
    if (isLocalhost) {
      await db.update(domains).set({
        verifiedAt: new Date().toISOString(),
        verificationStatus: "VERIFIED"
      }).where(eq(domains.id, id));

      return c.json({
        success: true,
        data: { 
          verified: true, 
          message: "Localhost domain automatically verified" 
        }
      });
    }
    
    // Check if already verified
    if (domain.verificationStatus === "VERIFIED" && domain.verifiedAt) {
      return c.json({
        success: true,
        data: { 
          verified: true, 
          message: "Domain already verified" 
        }
      });
    }
    
    const rootDomain = domain.name.replace(/^www\./, "");
    const expectedToken = domain.verificationToken;
    
    if (!expectedToken) {
      return c.json({
        success: true,
        data: { 
          verified: false, 
          message: "Missing verification token. Please regenerate the token and try again." 
        }
      });
    }
    
    const dnsRecord = `_databuddy.${rootDomain}`;
    let txtRecords: string[][] | undefined;
    
    try {
      // DNS lookup with timeout
      txtRecords = await Promise.race([
        new Promise<string[][]>((resolve, reject) => {
          resolver.resolveTxt(dnsRecord, (err, records) => {
            if (err) return reject(err);
            resolve(records);
          });
        }),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('DNS lookup timeout')), 10000);
        })
      ]);
    } catch (dnsError: unknown) {
      const errorMessage = dnsError instanceof Error && dnsError.message.includes('timeout')
        ? "DNS lookup timed out. The DNS servers may be slow or the record doesn't exist yet."
        : "DNS lookup failed. Please make sure the TXT record is correctly configured and try again.";
      
      await db.update(domains).set({ verificationStatus: "FAILED" }).where(eq(domains.id, id));
      
      return c.json({
        success: true,
        data: { 
          verified: false, 
          message: errorMessage 
        }
      });
    }
    
    if (!txtRecords || txtRecords.length === 0) {
      await db.update(domains).set({ verificationStatus: "FAILED" }).where(eq(domains.id, id));
      
      return c.json({
        success: true,
        data: { 
          verified: false, 
          message: "No DNS records found. Please add the TXT record and wait for DNS propagation (which can take up to 24-48 hours)." 
        }
      });
    }
    
    const isVerified = txtRecords.some(record => 
      Array.isArray(record) && record.some(txt => 
        typeof txt === "string" && txt.includes(expectedToken)
      )
    );
    
    const updateData = isVerified 
      ? {
          verifiedAt: new Date().toISOString(),
          verificationStatus: "VERIFIED" as const
        }
      : {
          verificationStatus: "FAILED" as const
        };

    await db.update(domains).set(updateData).where(eq(domains.id, id));

    const message = isVerified
      ? "Domain verified successfully. You can now use this domain for websites."
      : "Verification token not found in DNS records. Please check your DNS configuration and try again.";

    return c.json({
      success: true,
      data: { 
        verified: isVerified, 
        message 
      }
    });
  } catch (error) {
    logger.error('Domain verification check failed', { error, domainId: id, userId: user.id });
    return c.json({ 
      success: false, 
      error: 'Failed to check domain verification' 
    }, 500);
  }
});

/**
 * Regenerate verification token
 * POST /domains/:id/regenerate-token
 */
domainsRouter.post('/:id/regenerate-token', async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();

  try {
    console.log(`[Verification] Regenerating token: ${id}`);
    
    const domain = await findAccessibleDomain(user, id);
    if (!domain) {
      return c.json({ 
        success: false, 
        error: 'Domain not found' 
      }, 404);
    }

    const verificationToken = generateVerificationToken();
    
    await db.update(domains).set({
      verificationToken,
      verificationStatus: "PENDING",
      verifiedAt: null
    }).where(eq(domains.id, id));
    
    const updatedDomain = await db.query.domains.findFirst({ 
      where: eq(domains.id, id) 
    });

    return c.json({
      success: true,
      data: updatedDomain
    });
  } catch (error) {
    logger.error('Token regeneration failed', { error, domainId: id, userId: user.id });
    return c.json({ 
      success: false, 
      error: 'Failed to regenerate verification token' 
    }, 500);
  }
});

export default domainsRouter; 