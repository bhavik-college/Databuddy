import { Hono } from 'hono';
import { db, userStripeConfig, eq } from '@databuddy/db';
import { authMiddleware } from '../../middleware/auth';
import { logger } from '../../lib/logger';
import { nanoid } from 'nanoid';
import { cacheable } from '@databuddy/redis';
import type { AppVariables } from '../../types';
import { randomBytes } from 'crypto';

type RevenueContext = {
  Variables: AppVariables & {
    user: any;
  };
};

export const revenueRouter = new Hono<RevenueContext>();

// Apply auth middleware to all routes
revenueRouter.use('*', authMiddleware);

// Helper function to generate secure tokens
function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString('hex');
}

// Helper function to generate webhook secret is removed - user provides it

// Cache user revenue config for 5 minutes
async function _getUserRevenueConfig(userId: string) {
  try {
    return await db.query.userStripeConfig.findFirst({
      where: eq(userStripeConfig.userId, userId)
    });
  } catch (error) {
    logger.error('[Revenue API] Error fetching user revenue config:', { error });
    return null;
  }
}

const getUserRevenueConfig = cacheable(_getUserRevenueConfig, {
  expireInSec: 300, // 5 minutes
  prefix: 'user_revenue_config',
  staleWhileRevalidate: true,
  staleTime: 60 // Revalidate if cache is older than 1 minute
});

// GET /revenue/config - Get user's revenue configuration (auto-create if doesn't exist)
revenueRouter.get('/config', async (c) => {
  const user = c.get('user');

  if (!user) {
    return c.json({ success: false, error: "Unauthorized" }, 401);
  }

  try {
    logger.info('[Revenue API] Fetching revenue config for user:', { userId: user.id });
    
    let config = await getUserRevenueConfig(user.id);
    
    // Auto-create config if it doesn't exist
    if (!config) {
      logger.info('[Revenue API] No config found, creating new one for user:', { userId: user.id });
      
      [config] = await db
        .insert(userStripeConfig)
        .values({
          id: nanoid(),
          userId: user.id,
          webhookToken: generateSecureToken(),
          stripeSecretKey: '', // Not used anymore
          stripePublishableKey: '', // Not used anymore
          webhookSecret: '',
          isLiveMode: false,
          isActive: true,
          webhookFailureCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returning();
        
      logger.info('[Revenue API] Successfully created new revenue config:', { configId: config.id });
    }

    // Return config without sensitive data
    const safeConfig = {
      id: config.id,
      userId: config.userId,
      webhookToken: config.webhookToken,
      webhookSecret: config.webhookSecret,
      isLiveMode: config.isLiveMode,
      isActive: config.isActive,
      lastWebhookAt: config.lastWebhookAt,
      webhookFailureCount: config.webhookFailureCount,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };

    return c.json({
      success: true,
      data: safeConfig
    });
  } catch (error) {
    logger.error('[Revenue API] Error fetching/creating revenue config:', { error });
    return c.json({ 
      success: false, 
      error: "Failed to fetch revenue configuration" 
    }, 500);
  }
});

// POST /revenue/config - Create or update revenue configuration
revenueRouter.post('/config', async (c) => {
  const user = c.get('user');
  const data = await c.req.json();

  if (!user) {
    return c.json({ success: false, error: "Unauthorized" }, 401);
  }

  try {
    logger.info('[Revenue API] Creating/updating revenue config:', { userId: user.id });
    
    const existingConfig = await db.query.userStripeConfig.findFirst({
      where: eq(userStripeConfig.userId, user.id)
    });

    let config;
    
    if (existingConfig) {
      // Update existing config
      const updateData: any = {
        updatedAt: new Date().toISOString(),
      };

      if (data.webhookSecret) updateData.webhookSecret = data.webhookSecret;
      if (typeof data.isLiveMode === 'boolean') updateData.isLiveMode = data.isLiveMode;
      if (typeof data.isActive === 'boolean') updateData.isActive = data.isActive;

      [config] = await db
        .update(userStripeConfig)
        .set(updateData)
        .where(eq(userStripeConfig.userId, user.id))
        .returning();
    } else {
      // Create new config
      [config] = await db
        .insert(userStripeConfig)
        .values({
          id: nanoid(),
          userId: user.id,
          webhookToken: generateSecureToken(),
          stripeSecretKey: '', // Not used anymore
          stripePublishableKey: '', // Not used anymore
          webhookSecret: data.webhookSecret || '',
          isLiveMode: data.isLiveMode || false,
          isActive: data.isActive !== false, // Default to true
          webhookFailureCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returning();
    }

    // Return safe config without sensitive data
    const safeConfig = {
      id: config.id,
      userId: config.userId,
      webhookToken: config.webhookToken,
      webhookSecret: config.webhookSecret,
      isLiveMode: config.isLiveMode,
      isActive: config.isActive,
      lastWebhookAt: config.lastWebhookAt,
      webhookFailureCount: config.webhookFailureCount,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };

    logger.info('[Revenue API] Successfully created/updated revenue config:', { configId: config.id });

    return c.json({
      success: true,
      data: safeConfig
    });
  } catch (error) {
    logger.error('[Revenue API] Error creating/updating revenue config:', { error });
    
    if (error instanceof Error) {
      return c.json({ 
        success: false, 
        error: `Failed to save revenue configuration: ${error.message}` 
      }, 500);
    }
    return c.json({ 
      success: false, 
      error: "Failed to save revenue configuration" 
    }, 500);
  }
});

// POST /revenue/config/regenerate-webhook-token - Regenerate webhook token
revenueRouter.post('/config/regenerate-webhook-token', async (c) => {
  const user = c.get('user');

  if (!user) {
    return c.json({ success: false, error: "Unauthorized" }, 401);
  }

  try {
    logger.info('[Revenue API] Regenerating webhook token for user:', { userId: user.id });
    
    const existingConfig = await db.query.userStripeConfig.findFirst({
      where: eq(userStripeConfig.userId, user.id)
    });

    if (!existingConfig) {
      return c.json({ 
        success: false, 
        error: "Revenue configuration not found" 
      }, 404);
    }

    const [config] = await db
      .update(userStripeConfig)
      .set({
        webhookToken: generateSecureToken(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(userStripeConfig.userId, user.id))
      .returning();

    logger.info('[Revenue API] Successfully regenerated webhook token:', { configId: config.id });

    return c.json({
      success: true,
      data: {
        webhookToken: config.webhookToken
      }
    });
  } catch (error) {
    logger.error('[Revenue API] Error regenerating webhook token:', { error });
    return c.json({ 
      success: false, 
      error: "Failed to regenerate webhook token" 
    }, 500);
  }
});

// DELETE /revenue/config - Delete revenue configuration
revenueRouter.delete('/config', async (c) => {
  const user = c.get('user');

  if (!user) {
    return c.json({ success: false, error: "Unauthorized" }, 401);
  }

  try {
    logger.info('[Revenue API] Deleting revenue config for user:', { userId: user.id });
    
    const existingConfig = await db.query.userStripeConfig.findFirst({
      where: eq(userStripeConfig.userId, user.id)
    });

    if (!existingConfig) {
      return c.json({ 
        success: false, 
        error: "Revenue configuration not found" 
      }, 404);
    }

    await db
      .delete(userStripeConfig)
      .where(eq(userStripeConfig.userId, user.id));

    logger.info('[Revenue API] Successfully deleted revenue config:', { userId: user.id });

    return c.json({
      success: true,
      message: "Revenue configuration deleted successfully"
    });
  } catch (error) {
    logger.error('[Revenue API] Error deleting revenue config:', { error });
    return c.json({ 
      success: false, 
      error: "Failed to delete revenue configuration" 
    }, 500);
  }
});

export default revenueRouter; 