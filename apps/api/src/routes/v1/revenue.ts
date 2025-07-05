import { type Context, Hono } from 'hono';
import { db, userStripeConfig, eq, websites } from '@databuddy/db';
import { authMiddleware } from '../../middleware/auth';
import { logger } from '../../lib/logger';
import { logger as discordLogger } from '../../lib/discord-webhook';
import { nanoid } from 'nanoid';
import { cacheable } from '@databuddy/redis';
import type { AppVariables } from '../../types';
import { randomBytes } from 'node:crypto';
import { chQuery } from '../../clickhouse/client';
import { escapeSqlString } from '../../query/utils';

type RevenueContext = {
  Variables: AppVariables & {
    user: any;
  };
};

export const revenueRouter = new Hono<RevenueContext>();

// Apply auth middleware to all routes
revenueRouter.use('*', authMiddleware);

// Helper function to generate secure tokens
function generateSecureToken(length = 32): string {
  return randomBytes(length).toString('hex');
}

// Helper function to mask webhook secret for security
function maskWebhookSecret(secret: string): string {
  if (!secret || secret.length <= 8) {
    return secret; // Return as-is if too short to mask
  }

  const firstFour = secret.substring(0, 4);
  const lastFour = secret.substring(secret.length - 4);
  const middleLength = secret.length - 8;
  const maskedMiddle = '*'.repeat(middleLength);

  return `${firstFour}${maskedMiddle}${lastFour}`;
}

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

// Helper function to get user's website IDs
async function getUserWebsiteIds(userId: string): Promise<string[]> {
  try {
    const userWebsites = await db.query.websites.findMany({
      where: eq(websites.userId, userId),
      columns: { id: true }
    });
    return userWebsites.map(w => w.id);
  } catch (error) {
    logger.error('[Revenue API] Error fetching user websites:', { error });
    return [];
  }
}

// Helper to clamp limits
function clampLimit(value: number, max = 1000, min = 1) {
  if (Number.isNaN(value) || value < min) return min;
  if (value > max) return max;
  return value;
}

// Helper to validate ISO date string (basic)
function isValidDateString(date: any): boolean {
  return typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date);
}

// Helper to validate UUID (basic)
function isValidUUID(id: any): boolean {
  return typeof id === 'string' && /^[0-9a-fA-F-]{32,36}$/.test(id);
}

// GET /revenue/config - Get user's revenue configuration (auto-create if doesn't exist)
revenueRouter.get('/config', async (c: Context) => {
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

      // Discord notification for revenue configuration setup
      await discordLogger.info(
        'Revenue Tracking Setup',
        'User has set up revenue tracking and webhooks',
        {
          configId: config.id,
          userId: user.id,
          webhookToken: config.webhookToken
        }
      );
    }

    // Return config without sensitive data
    const safeConfig = {
      id: config.id,
      userId: config.userId,
      webhookToken: config.webhookToken,
      webhookSecret: maskWebhookSecret(config.webhookSecret || ''),
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

// GET /revenue/analytics/batch - Get all global revenue analytics in one request
revenueRouter.get('/analytics/batch', async (c: Context) => {
  const user = c.get('user');
  const startDate = c.req.query('start_date');
  const endDate = c.req.query('end_date');
  const granularity = c.req.query('granularity') || 'daily';
  const isLiveMode = c.req.query('live_mode') === 'true';
  const trendsLimit = clampLimit(Number.parseInt(c.req.query('trends_limit') || '100'));
  const transactionsLimit = clampLimit(Number.parseInt(c.req.query('transactions_limit') || '50'));
  const countryLimit = clampLimit(Number.parseInt(c.req.query('country_limit') || '20'));

  if (!user) {
    return c.json({ success: false, error: "Unauthorized" }, 401);
  }

  if (!startDate || !endDate || !isValidDateString(startDate) || !isValidDateString(endDate)) {
    return c.json({ success: false, error: "start_date and end_date are required and must be valid ISO date strings" }, 400);
  }

  try {
    const config = await getUserRevenueConfig(user.id);
    if (!config) {
      return c.json({ success: false, error: "Revenue configuration not found" }, 404);
    }

    const websiteIds = await getUserWebsiteIds(user.id);
    if (websiteIds.length === 0) {
      return c.json({
        success: true,
        data: {
          summary: {
            total_revenue: 0,
            total_transactions: 0,
            total_refunds: 0,
            avg_order_value: 0,
            success_rate: 0,
          },
          trends: [],
          recentTransactions: [],
          byCountry: [],
        }
      });
    }

    // Escape all website IDs for SQL safety
    const websiteIdList = websiteIds.map(id => escapeSqlString(id)).join(',');
    const liveModeCondition = `AND livemode = ${isLiveMode ? 1 : 0}`;
    const timeFormat = granularity === 'hourly'
      ? 'toDateTime(toStartOfHour(toDateTime(created)))'
      : 'toDate(toDateTime(created))';

    // Execute all queries in parallel
    const [summaryResult, trendsResult, transactionsResult, countryResult] = await Promise.all([
      // Summary query
      (async () => {
        const refundsQuery = `(SELECT COUNT(*) FROM analytics.stripe_refunds r
           JOIN analytics.stripe_payment_intents pi ON r.payment_intent_id = pi.id
           WHERE r.created >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
           AND r.created <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
           AND r.client_id IN (${websiteIdList})
           AND pi.livemode = ${isLiveMode ? 1 : 0})`;

        const sql = `
          SELECT 
            SUM(CASE WHEN status = 'succeeded' THEN amount ELSE 0 END) / 100 as total_revenue,
            COUNT(DISTINCT CASE WHEN status = 'succeeded' THEN id END) as total_transactions,
            COUNT(DISTINCT CASE WHEN status = 'succeeded' THEN id END) as successful_transactions,
            ${refundsQuery} as total_refunds,
            AVG(CASE WHEN status = 'succeeded' THEN amount ELSE NULL END) / 100 as avg_order_value,
            100.0 as success_rate
          FROM analytics.stripe_payment_intents 
          WHERE created >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
            AND created <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
            AND client_id IN (${websiteIdList})
            AND status = 'succeeded'
            ${liveModeCondition}
        `;

        const result = await chQuery<any>(sql);
        return result[0] || {
          total_revenue: 0,
          total_transactions: 0,
          total_refunds: 0,
          avg_order_value: 0,
          success_rate: 0,
        };
      })(),

      // Trends query
      (async () => {
        const sql = `
          SELECT 
            ${timeFormat} as time,
            SUM(amount) / 100 as total_revenue,
            COUNT(DISTINCT id) as total_transactions,
            AVG(amount) / 100 as avg_order_value,
            100.0 as success_rate
          FROM analytics.stripe_payment_intents 
          WHERE created >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
            AND created <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
            AND client_id IN (${websiteIdList})
            AND status = 'succeeded'
            ${liveModeCondition}
          GROUP BY time 
          ORDER BY time DESC 
          LIMIT ${trendsLimit}
        `;

        return await chQuery<any>(sql);
      })(),

      // Recent transactions query
      (async () => {
        const sql = `
          SELECT 
            id,
            toDateTime(created) as created,
            status,
            currency,
            amount / 100 as amount,
            session_id
          FROM analytics.stripe_payment_intents 
          WHERE created >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
            AND created <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
            AND client_id IN (${websiteIdList})
            AND status = 'succeeded'
            ${liveModeCondition}
          ORDER BY created DESC 
          LIMIT ${transactionsLimit}
        `;

        return await chQuery<any>(sql);
      })(),

      // Revenue by country query
      (async () => {
        const sql = `
          SELECT 
            e.country as name,
            SUM(pi.amount) / 100 as total_revenue,
            COUNT(pi.id) as total_transactions,
            AVG(pi.amount) / 100 as avg_order_value
          FROM analytics.stripe_payment_intents pi
          LEFT JOIN analytics.events e ON pi.session_id = e.session_id
          WHERE pi.created >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
            AND pi.created <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
            AND pi.client_id IN (${websiteIdList})
            AND pi.status = 'succeeded'
            ${liveModeCondition}
            AND e.country IS NOT NULL 
            AND e.country != ''
          GROUP BY e.country 
          ORDER BY total_revenue DESC 
          LIMIT ${countryLimit}
        `;

        return await chQuery<any>(sql);
      })(),
    ]);

    return c.json({
      success: true,
      data: {
        summary: summaryResult,
        trends: trendsResult,
        recentTransactions: transactionsResult,
        byCountry: countryResult,
      }
    });
  } catch (error) {
    logger.error('[Revenue API] Error fetching batched revenue analytics:', { error });
    return c.json({
      success: false,
      error: "Failed to fetch revenue analytics"
    }, 500);
  }
});

// GET /revenue/analytics/summary - Get global revenue summary
revenueRouter.get('/analytics/summary', async (c: Context) => {
  const user = c.get('user');
  const startDate = c.req.query('start_date');
  const endDate = c.req.query('end_date');
  const isLiveMode = c.req.query('live_mode') === 'true';

  if (!user) {
    return c.json({ success: false, error: "Unauthorized" }, 401);
  }

  if (!startDate || !endDate) {
    return c.json({ success: false, error: "start_date and end_date are required" }, 400);
  }

  try {
    const config = await getUserRevenueConfig(user.id);
    if (!config) {
      return c.json({ success: false, error: "Revenue configuration not found" }, 404);
    }

    const websiteIds = await getUserWebsiteIds(user.id);
    if (websiteIds.length === 0) {
      return c.json({
        success: true,
        data: {
          total_revenue: 0,
          total_transactions: 0,
          total_refunds: 0,
          avg_order_value: 0,
          success_rate: 0,
        }
      });
    }

    const websiteIdList = websiteIds.map(id => `'${id}'`).join(',');
    const liveModeCondition = `AND livemode = ${isLiveMode ? 1 : 0}`;

    const refundsQuery = `(SELECT COUNT(*) FROM analytics.stripe_refunds r
       JOIN analytics.stripe_payment_intents pi ON r.payment_intent_id = pi.id
       WHERE r.created >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
       AND r.created <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
       AND r.client_id IN (${websiteIdList})
       AND pi.livemode = ${isLiveMode ? 1 : 0})`;

    const sql = `
      SELECT 
        SUM(CASE WHEN status = 'succeeded' THEN amount ELSE 0 END) / 100 as total_revenue,
        COUNT(DISTINCT CASE WHEN status = 'succeeded' THEN id END) as total_transactions,
        COUNT(DISTINCT CASE WHEN status = 'succeeded' THEN id END) as successful_transactions,
        ${refundsQuery} as total_refunds,
        AVG(CASE WHEN status = 'succeeded' THEN amount ELSE NULL END) / 100 as avg_order_value,
        100.0 as success_rate
      FROM analytics.stripe_payment_intents 
      WHERE created >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
        AND created <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
        AND client_id IN (${websiteIdList})
        AND status = 'succeeded'
        ${liveModeCondition}
    `;

    const result = await chQuery<any>(sql);
    const summary = result[0] || {
      total_revenue: 0,
      total_transactions: 0,
      total_refunds: 0,
      avg_order_value: 0,
      success_rate: 0,
    };

    return c.json({
      success: true,
      data: summary
    });
  } catch (error) {
    logger.error('[Revenue API] Error fetching revenue summary:', { error });
    return c.json({
      success: false,
      error: "Failed to fetch revenue summary"
    }, 500);
  }
});

// GET /revenue/analytics/trends - Get global revenue trends
revenueRouter.get('/analytics/trends', async (c: Context) => {
  const user = c.get('user');
  const startDate = c.req.query('start_date');
  const endDate = c.req.query('end_date');
  const granularity = c.req.query('granularity') || 'daily';
  const isLiveMode = c.req.query('live_mode') === 'true';
  const limit = clampLimit(Number.parseInt(c.req.query('limit') || '100'));

  if (!user) {
    return c.json({ success: false, error: "Unauthorized" }, 401);
  }

  if (!startDate || !endDate || !isValidDateString(startDate) || !isValidDateString(endDate)) {
    return c.json({ success: false, error: "start_date and end_date are required and must be valid ISO date strings" }, 400);
  }

  try {
    const config = await getUserRevenueConfig(user.id);
    if (!config) {
      return c.json({ success: false, error: "Revenue configuration not found" }, 404);
    }

    const websiteIds = await getUserWebsiteIds(user.id);
    if (websiteIds.length === 0) {
      return c.json({
        success: true,
        data: []
      });
    }

    const websiteIdList = websiteIds.map(id => `'${id}'`).join(',');
    const timeFormat = granularity === 'hourly'
      ? 'toDateTime(toStartOfHour(toDateTime(created)))'
      : 'toDate(toDateTime(created))';
    const liveModeCondition = `AND livemode = ${isLiveMode ? 1 : 0}`;

    const sql = `
      SELECT 
        ${timeFormat} as time,
        SUM(amount) / 100 as total_revenue,
        COUNT(DISTINCT id) as total_transactions,
        AVG(amount) / 100 as avg_order_value,
        100.0 as success_rate
      FROM analytics.stripe_payment_intents 
      WHERE created >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
        AND created <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
        AND client_id IN (${websiteIdList})
        AND status = 'succeeded'
        ${liveModeCondition}
      GROUP BY time 
      ORDER BY time DESC 
      LIMIT ${limit}
    `;

    const result = await chQuery<any>(sql);

    return c.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('[Revenue API] Error fetching revenue trends:', { error });
    return c.json({
      success: false,
      error: "Failed to fetch revenue trends"
    }, 500);
  }
});

// GET /revenue/analytics/transactions - Get recent transactions
revenueRouter.get('/analytics/transactions', async (c: Context) => {
  const user = c.get('user');
  const startDate = c.req.query('start_date');
  const endDate = c.req.query('end_date');
  const isLiveMode = c.req.query('live_mode') === 'true';
  const limit = clampLimit(Number.parseInt(c.req.query('limit') || '50'));

  if (!user) {
    return c.json({ success: false, error: "Unauthorized" }, 401);
  }

  if (!startDate || !endDate || !isValidDateString(startDate) || !isValidDateString(endDate)) {
    return c.json({ success: false, error: "start_date and end_date are required and must be valid ISO date strings" }, 400);
  }

  try {
    const config = await getUserRevenueConfig(user.id);
    if (!config) {
      return c.json({ success: false, error: "Revenue configuration not found" }, 404);
    }

    const websiteIds = await getUserWebsiteIds(user.id);
    if (websiteIds.length === 0) {
      return c.json({
        success: true,
        data: []
      });
    }

    const websiteIdList = websiteIds.map(id => `'${id}'`).join(',');
    const liveModeCondition = `AND livemode = ${isLiveMode ? 1 : 0}`;

    const sql = `
      SELECT 
        id,
        toDateTime(created) as created,
        status,
        currency,
        amount / 100 as amount,
        session_id
      FROM analytics.stripe_payment_intents 
      WHERE created >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
        AND created <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
        AND client_id IN (${websiteIdList})
        AND status = 'succeeded'
        ${liveModeCondition}
      ORDER BY created DESC 
      LIMIT ${limit}
    `;

    const result = await chQuery<any>(sql);

    return c.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('[Revenue API] Error fetching recent transactions:', { error });
    return c.json({
      success: false,
      error: "Failed to fetch recent transactions"
    }, 500);
  }
});

// GET /revenue/analytics/breakdown/country - Get revenue by country
revenueRouter.get('/analytics/breakdown/country', async (c: Context) => {
  const user = c.get('user');
  const startDate = c.req.query('start_date');
  const endDate = c.req.query('end_date');
  const isLiveMode = c.req.query('live_mode') === 'true';
  const limit = clampLimit(Number.parseInt(c.req.query('limit') || '20'));

  if (!user) {
    return c.json({ success: false, error: "Unauthorized" }, 401);
  }

  if (!startDate || !endDate || !isValidDateString(startDate) || !isValidDateString(endDate)) {
    return c.json({ success: false, error: "start_date and end_date are required and must be valid ISO date strings" }, 400);
  }

  try {
    const config = await getUserRevenueConfig(user.id);
    if (!config) {
      return c.json({ success: false, error: "Revenue configuration not found" }, 404);
    }

    const websiteIds = await getUserWebsiteIds(user.id);
    if (websiteIds.length === 0) {
      return c.json({
        success: true,
        data: []
      });
    }

    const websiteIdList = websiteIds.map(id => `'${id}'`).join(',');
    const liveModeCondition = `AND pi.livemode = ${isLiveMode ? 1 : 0}`;

    const sql = `
      SELECT 
        e.country as name,
        SUM(pi.amount) / 100 as total_revenue,
        COUNT(pi.id) as total_transactions,
        AVG(pi.amount) / 100 as avg_order_value
      FROM analytics.stripe_payment_intents pi
      LEFT JOIN analytics.events e ON pi.session_id = e.session_id
      WHERE pi.created >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
        AND pi.created <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
        AND pi.client_id IN (${websiteIdList})
        AND pi.status = 'succeeded'
        ${liveModeCondition}
        AND e.country IS NOT NULL 
        AND e.country != ''
      GROUP BY e.country 
      ORDER BY total_revenue DESC 
      LIMIT ${limit}
    `;

    const result = await chQuery<any>(sql);

    return c.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('[Revenue API] Error fetching revenue by country:', { error });
    return c.json({
      success: false,
      error: "Failed to fetch revenue by country"
    }, 500);
  }
});

// POST /revenue/config - Create or update revenue configuration
revenueRouter.post('/config', async (c: Context) => {
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

    let config: typeof userStripeConfig.$inferSelect;

    if (existingConfig) {
      // Update existing config
      const updateData: Partial<typeof userStripeConfig.$inferInsert> = {
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
      webhookSecret: maskWebhookSecret(config.webhookSecret || ''),
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
revenueRouter.post('/config/regenerate-webhook-token', async (c: Context) => {
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
revenueRouter.delete('/config', async (c: Context) => {
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

// GET /revenue/analytics/website/:websiteId - Get website-specific revenue analytics
revenueRouter.get('/analytics/website/:websiteId', async (c: Context) => {
  const user = c.get('user');
  const websiteId = c.req.param('websiteId');
  const startDate = c.req.query('start_date');
  const endDate = c.req.query('end_date');
  const granularity = c.req.query('granularity') || 'daily';
  const isLiveMode = c.req.query('live_mode') === 'true';

  if (!user) {
    return c.json({ success: false, error: "Unauthorized" }, 401);
  }

  if (!startDate || !endDate || !isValidDateString(startDate) || !isValidDateString(endDate)) {
    return c.json({ success: false, error: "start_date and end_date are required and must be valid ISO date strings" }, 400);
  }

  if (!isValidUUID(websiteId)) {
    return c.json({ success: false, error: "Invalid websiteId format" }, 400);
  }

  try {
    // Verify user owns this website
    const website = await db.query.websites.findFirst({
      where: eq(websites.id, websiteId)
    });

    if (!website || website.userId !== user.id) {
      return c.json({ success: false, error: "Website not found or unauthorized" }, 404);
    }

    const config = await getUserRevenueConfig(user.id);
    if (!config) {
      return c.json({ success: false, error: "Revenue configuration not found" }, 404);
    }

    const liveModeCondition = `AND livemode = ${isLiveMode ? 1 : 0}`;
    const timeFormat = granularity === 'hourly'
      ? 'toDateTime(toStartOfHour(toDateTime(created)))'
      : 'toDate(toDateTime(created))';

    // Execute all queries in parallel
    const [summaryResult, trendsResult, transactionsResult] = await Promise.all([
      // Summary query
      (async () => {
        const refundsQuery = `(SELECT COUNT(*) FROM analytics.stripe_refunds r
           JOIN analytics.stripe_payment_intents pi ON r.payment_intent_id = pi.id
           WHERE r.created >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
           AND r.created <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
           AND r.client_id = ${escapeSqlString(websiteId)}
           AND pi.livemode = ${isLiveMode ? 1 : 0})`;

        const sql = `
          SELECT 
            SUM(CASE WHEN status = 'succeeded' THEN amount ELSE 0 END) / 100 as total_revenue,
            COUNT(DISTINCT CASE WHEN status = 'succeeded' THEN id END) as total_transactions,
            AVG(CASE WHEN status = 'succeeded' THEN amount ELSE NULL END) / 100 as avg_order_value,
                         ${refundsQuery} as total_refunds
          FROM analytics.stripe_payment_intents 
          WHERE created >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
            AND created <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
            AND client_id = ${escapeSqlString(websiteId)}
            AND status = 'succeeded'
            ${liveModeCondition}
        `;

        const result = await chQuery<any>(sql);
        return result[0] || {
          total_revenue: 0,
          total_transactions: 0,
          avg_order_value: 0,
          total_refunds: 0,
        };
      })(),

      // Trends query
      (async () => {
        const sql = `
          SELECT 
            ${timeFormat} as date,
            SUM(amount) / 100 as revenue,
            COUNT(DISTINCT id) as transactions
          FROM analytics.stripe_payment_intents 
          WHERE created >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
            AND created <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
            AND client_id = ${escapeSqlString(websiteId)}
            AND status = 'succeeded'
            ${liveModeCondition}
          GROUP BY date 
          ORDER BY date DESC 
          LIMIT 100
        `;

        return await chQuery<any>(sql);
      })(),

      // Recent transactions query
      (async () => {
        const sql = `
          SELECT 
            id,
            toDateTime(created) as created,
            status,
            currency,
            amount / 100 as amount
          FROM analytics.stripe_payment_intents 
          WHERE created >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
            AND created <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
            AND client_id = ${escapeSqlString(websiteId)}
            AND status = 'succeeded'
            ${liveModeCondition}
          ORDER BY created DESC 
          LIMIT 50
        `;

        return await chQuery<any>(sql);
      })(),
    ]);

    return c.json({
      success: true,
      summary: summaryResult,
      trends: trendsResult,
      recent_transactions: transactionsResult,
    });
  } catch (error) {
    logger.error('[Revenue API] Error fetching website revenue analytics:', { error, websiteId });
    return c.json({
      success: false,
      error: "Failed to fetch website revenue analytics"
    }, 500);
  }
});

export default revenueRouter; 