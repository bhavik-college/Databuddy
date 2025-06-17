import { Hono } from 'hono'
import { z } from 'zod'
import { eq, and, isNull, desc } from 'drizzle-orm'

import { authMiddleware } from '../../middleware/auth'
import { websiteAuthHook } from '../../middleware/website'
import { logger } from '../../lib/logger'
import { db, funnelDefinitions, funnelGoals, chQuery } from '@databuddy/db'

interface Website {
  id: string;
  domain: string;
}

type FunnelContext = {
  Variables: {
    website: Website;
    user: any;
  };
};

// Validation schemas
const createFunnelSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  steps: z.array(z.object({
    type: z.enum(['PAGE_VIEW', 'EVENT', 'CUSTOM']),
    target: z.string(), // URL path, event name, or custom condition
    name: z.string(),
    conditions: z.record(z.any()).optional(), // Additional conditions
  })).min(2).max(10), // Funnels need at least 2 steps, max 10 for performance
});

const updateFunnelSchema = createFunnelSchema.partial();

const createGoalSchema = z.object({
  goalType: z.enum(['COMPLETION', 'STEP_CONVERSION', 'TIME_TO_CONVERT']),
  targetValue: z.string(),
  description: z.string().optional(),
});

export const funnelRouter = new Hono<FunnelContext>()

funnelRouter.use('*', authMiddleware)
funnelRouter.use('*', websiteAuthHook)

// Get all funnels for a website
funnelRouter.get('/', async (c) => {
  try {
    const website = c.get('website')
    
    const funnels = await db
      .select({
        id: funnelDefinitions.id,
        name: funnelDefinitions.name,
        description: funnelDefinitions.description,
        steps: funnelDefinitions.steps,
        isActive: funnelDefinitions.isActive,
        createdAt: funnelDefinitions.createdAt,
        updatedAt: funnelDefinitions.updatedAt,
      })
      .from(funnelDefinitions)
      .where(and(
        eq(funnelDefinitions.websiteId, website.id),
        isNull(funnelDefinitions.deletedAt)
      ))
      .orderBy(desc(funnelDefinitions.createdAt))

    return c.json({
      success: true,
      data: funnels,
      meta: {
        total: funnels.length,
        website_id: website.id
      }
    })
  } catch (error: any) {
    logger.error('Failed to fetch funnels', {
      error: error.message,
      website_id: c.get('website')?.id
    })
    
    return c.json({
      success: false,
      error: 'Failed to fetch funnels'
    }, 500)
  }
})

// Get a specific funnel
funnelRouter.get('/:id', async (c) => {
  try {
    const website = c.get('website')
    const funnelId = c.req.param('id')
    
    const funnel = await db
      .select()
      .from(funnelDefinitions)
      .where(and(
        eq(funnelDefinitions.id, funnelId),
        eq(funnelDefinitions.websiteId, website.id),
        isNull(funnelDefinitions.deletedAt)
      ))
      .limit(1)

    if (funnel.length === 0) {
      return c.json({
        success: false,
        error: 'Funnel not found'
      }, 404)
    }

    // Get associated goals
    const goals = await db
      .select()
      .from(funnelGoals)
      .where(and(
        eq(funnelGoals.funnelId, funnelId),
        eq(funnelGoals.isActive, true)
      ))

    return c.json({
      success: true,
      data: {
        ...funnel[0],
        goals
      }
    })
  } catch (error: any) {
    logger.error('Failed to fetch funnel', {
      error: error.message,
      funnel_id: c.req.param('id'),
      website_id: c.get('website')?.id
    })
    
    return c.json({
      success: false,
      error: 'Failed to fetch funnel'
    }, 500)
  }
})

// Create a new funnel
funnelRouter.post(
  '/',
  async (c) => {
    try {
      const website = c.get('website')
      const user = c.get('user')
      const { name, description, steps } = await c.req.json()
      
      const funnelId = crypto.randomUUID()
      
      const [newFunnel] = await db
        .insert(funnelDefinitions)
        .values({
          id: funnelId,
          websiteId: website.id,
          name,
          description,
          steps,
          createdBy: user.id,
        })
        .returning()

      logger.info('Funnel created', {
        funnel_id: funnelId,
        name,
        steps_count: steps.length,
        website_id: website.id,
        user_id: user.id
      })

      return c.json({
        success: true,
        data: newFunnel
      }, 201)
    } catch (error: any) {
      logger.error('Failed to create funnel', {
        error: error.message,
        website_id: c.get('website')?.id,
        user_id: c.get('user')?.id
      })
      
      return c.json({
        success: false,
        error: 'Failed to create funnel'
      }, 500)
    }
  }
)

// Update a funnel
funnelRouter.put(
  '/:id',
  async (c) => {
    try {
      const website = c.get('website')
      const funnelId = c.req.param('id')
      const updates = await c.req.json()
      
      const [updatedFunnel] = await db
        .update(funnelDefinitions)
        .set({
          ...updates,
          updatedAt: new Date().toISOString(),
        })
        .where(and(
          eq(funnelDefinitions.id, funnelId),
          eq(funnelDefinitions.websiteId, website.id),
          isNull(funnelDefinitions.deletedAt)
        ))
        .returning()

      if (!updatedFunnel) {
        return c.json({
          success: false,
          error: 'Funnel not found'
        }, 404)
      }

      return c.json({
        success: true,
        data: updatedFunnel
      })
    } catch (error: any) {
      logger.error('Failed to update funnel', {
        error: error.message,
        funnel_id: c.req.param('id'),
        website_id: c.get('website')?.id
      })
      
      return c.json({
        success: false,
        error: 'Failed to update funnel'
      }, 500)
    }
  }
)

// Delete a funnel (soft delete)
funnelRouter.delete('/:id', async (c) => {
  try {
    const website = c.get('website')
    const funnelId = c.req.param('id')
    
    const [deletedFunnel] = await db
      .update(funnelDefinitions)
      .set({
        deletedAt: new Date().toISOString(),
        isActive: false,
      })
      .where(and(
        eq(funnelDefinitions.id, funnelId),
        eq(funnelDefinitions.websiteId, website.id),
        isNull(funnelDefinitions.deletedAt)
      ))
      .returning({ id: funnelDefinitions.id })

    if (!deletedFunnel) {
      return c.json({
        success: false,
        error: 'Funnel not found'
      }, 404)
    }

    // Also deactivate associated goals
    await db
      .update(funnelGoals)
      .set({ isActive: false })
      .where(eq(funnelGoals.funnelId, funnelId))

    return c.json({
      success: true,
      message: 'Funnel deleted successfully'
    })
  } catch (error: any) {
    logger.error('Failed to delete funnel', {
      error: error.message,
      funnel_id: c.req.param('id'),
      website_id: c.get('website')?.id
    })
    
    return c.json({
      success: false,
      error: 'Failed to delete funnel'
    }, 500)
  }
})

// Funnel Goals endpoints

// Create a goal for a funnel
funnelRouter.post(
  '/:id/goals',
  async (c) => {
    try {
      const website = c.get('website')
      const funnelId = c.req.param('id')
      const { goalType, targetValue, description } = await c.req.json()
      
      // Verify funnel exists and belongs to website
      const funnel = await db
        .select({ id: funnelDefinitions.id })
        .from(funnelDefinitions)
        .where(and(
          eq(funnelDefinitions.id, funnelId),
          eq(funnelDefinitions.websiteId, website.id),
          isNull(funnelDefinitions.deletedAt)
        ))
        .limit(1)

      if (funnel.length === 0) {
        return c.json({
          success: false,
          error: 'Funnel not found'
        }, 404)
      }
      
      const [newGoal] = await db
        .insert(funnelGoals)
        .values({
          id: crypto.randomUUID(),
          funnelId,
          goalType,
          targetValue,
          description,
        })
        .returning()

      return c.json({
        success: true,
        data: newGoal
      }, 201)
    } catch (error: any) {
      logger.error('Failed to create funnel goal', {
        error: error.message,
        funnel_id: c.req.param('id'),
        website_id: c.get('website')?.id
      })
      
      return c.json({
        success: false,
        error: 'Failed to create goal'
      }, 500)
    }
  }
)

// Get goals for a funnel
funnelRouter.get('/:id/goals', async (c) => {
  try {
    const website = c.get('website')
    const funnelId = c.req.param('id')
    
    // Verify funnel exists and belongs to website
    const funnel = await db
      .select({ id: funnelDefinitions.id })
      .from(funnelDefinitions)
      .where(and(
        eq(funnelDefinitions.id, funnelId),
        eq(funnelDefinitions.websiteId, website.id),
        isNull(funnelDefinitions.deletedAt)
      ))
      .limit(1)

    if (funnel.length === 0) {
      return c.json({
        success: false,
        error: 'Funnel not found'
      }, 404)
    }

    const goals = await db
      .select()
      .from(funnelGoals)
      .where(and(
        eq(funnelGoals.funnelId, funnelId),
        eq(funnelGoals.isActive, true)
      ))

    return c.json({
      success: true,
      data: goals
    })
  } catch (error: any) {
    logger.error('Failed to fetch funnel goals', {
      error: error.message,
      funnel_id: c.req.param('id'),
      website_id: c.get('website')?.id
    })
    
    return c.json({
      success: false,
      error: 'Failed to fetch goals'
    }, 500)
  }
})

// Get funnel analytics
funnelRouter.get('/:id/analytics', async (c) => {
  try {
    const website = c.get('website')
    const funnelId = c.req.param('id')
    const startDate = c.req.query('start_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const endDate = c.req.query('end_date') || new Date().toISOString().split('T')[0]
    
    // Get the funnel definition
    const funnel = await db
      .select()
      .from(funnelDefinitions)
      .where(and(
        eq(funnelDefinitions.id, funnelId),
        eq(funnelDefinitions.websiteId, website.id),
        isNull(funnelDefinitions.deletedAt)
      ))
      .limit(1)

    if (funnel.length === 0) {
      return c.json({
        success: false,
        error: 'Funnel not found'
      }, 404)
    }

    const funnelData = funnel[0]
    const steps = funnelData.steps as Array<{ type: string; target: string; name: string; conditions?: any }>

    // Execute funnel analysis query
    const analysisQuery = `
      WITH ${steps.map((step, index: number) => {
        let whereCondition = '';
        
        if (step.type === 'PAGE_VIEW') {
          // Handle page views - only screen_view events with matching path
          const targetPath = step.target.replace(/'/g, "''");
          whereCondition = `event_name = 'screen_view' AND (path = '${targetPath}' OR path LIKE '%${targetPath}')`;
        } else if (step.type === 'EVENT') {
          // Handle custom events - exclude system events like in query.ts
          const eventName = step.target.replace(/'/g, "''");
          whereCondition = `event_name = '${eventName}' AND event_name NOT IN ('screen_view', 'page_exit', 'error', 'web_vitals')`;
        } else if (step.type === 'CUSTOM' && step.conditions) {
          // Handle custom conditions with properties
          const eventName = step.target.replace(/'/g, "''");
          let customConditions = `event_name = '${eventName}' AND event_name NOT IN ('screen_view', 'page_exit', 'error', 'web_vitals')`;
          
          // Add property-based conditions if specified
          if (step.conditions && typeof step.conditions === 'object') {
            Object.entries(step.conditions).forEach(([key, value]) => {
              if (typeof value === 'string') {
                customConditions += ` AND JSONExtractString(properties, '${key.replace(/'/g, "''")}') = '${String(value).replace(/'/g, "''")}'`;
              } else if (typeof value === 'number') {
                customConditions += ` AND JSONExtractFloat(properties, '${key.replace(/'/g, "''")}') = ${value}`;
              } else if (typeof value === 'boolean') {
                customConditions += ` AND JSONExtractBool(properties, '${key.replace(/'/g, "''")}') = ${value ? 1 : 0}`;
              }
            });
          }
          
          whereCondition = customConditions;
        }
        
        return `step_${index + 1}_users AS (
          SELECT DISTINCT
            session_id,
            anonymous_id,
            MIN(time) as step_time
          FROM analytics.events
          WHERE client_id = '${website.id}'
            AND toDate(time) >= '${startDate}'
            AND toDate(time) <= '${endDate}'
            AND ${whereCondition}
          GROUP BY session_id, anonymous_id
        )`;
      }).join(',\n      ')},
      step_progression AS (
        ${steps.map((step, index: number) => {
          const stepNum = index + 1;
          const joins = Array.from({length: stepNum}, (_, i) => {
            if (i === 0) return 'step_1_users s1';
            return `LEFT JOIN step_${i + 1}_users s${i + 1} ON s1.session_id = s${i + 1}.session_id AND s${i + 1}.step_time >= s${i}.step_time`;
          }).join('\n        ');
          
          return `
            SELECT 
              ${stepNum} as step_number,
              '${step.name.replace(/'/g, "''")}' as step_name,
              COUNT(DISTINCT s1.session_id) as total_users,
              ${index === 0 ? 
                'COUNT(DISTINCT s1.session_id)' : 
                `COUNT(DISTINCT s${stepNum}.session_id)`} as users,
              ${index === 0 ? 
                '100.0' : 
                `ROUND((COUNT(DISTINCT s${stepNum}.session_id) * 100.0 / NULLIF(COUNT(DISTINCT s1.session_id), 0)), 2)`} as conversion_rate,
              ${index === 0 ? 
                '0' : 
                `(COUNT(DISTINCT s1.session_id) - COUNT(DISTINCT s${stepNum}.session_id))`} as dropoffs,
              ${index === 0 ? 
                '0.0' : 
                `ROUND(((COUNT(DISTINCT s1.session_id) - COUNT(DISTINCT s${stepNum}.session_id)) * 100.0 / NULLIF(COUNT(DISTINCT s1.session_id), 0)), 2)`} as dropoff_rate,
              ${index === 0 ? 
                '0.0' : 
                `ROUND(AVG(CASE WHEN s${stepNum}.step_time > s${stepNum - 1}.step_time AND dateDiff('second', s${stepNum - 1}.step_time, s${stepNum}.step_time) > 0 AND dateDiff('second', s${stepNum - 1}.step_time, s${stepNum}.step_time) < 86400 THEN dateDiff('second', s${stepNum - 1}.step_time, s${stepNum}.step_time) ELSE NULL END), 2)`} as avg_time_to_complete
            FROM ${joins}`;
        }).join('\nUNION ALL\n')}
      )
      SELECT * FROM step_progression ORDER BY step_number
    `;

    // Log the generated query for debugging
    logger.info('Generated funnel analysis query', {
      funnel_id: funnelId,
      website_id: website.id,
      query: analysisQuery
    });

    let analyticsResults;
    try {
      analyticsResults = await chQuery<{
        step_number: number;
        step_name: string;
        total_users: number;
        users: number;
        conversion_rate: number;
        dropoffs: number;
        dropoff_rate: number;
        avg_time_to_complete?: number;
      }>(analysisQuery);
    } catch (sqlError: any) {
      logger.error('SQL query failed for funnel analytics', {
        funnel_id: funnelId,
        website_id: website.id,
        sql_error: sqlError.message,
        query: analysisQuery
      });
      throw new Error(`SQL query failed: ${sqlError.message}`);
    }

    // Calculate overall metrics
    const firstStep = analyticsResults[0];
    const lastStep = analyticsResults[analyticsResults.length - 1];
    const biggestDropoff = analyticsResults.reduce((max, step) => 
      step.dropoff_rate > max.dropoff_rate ? step : max, analyticsResults[1] || analyticsResults[0]);

    // Calculate average completion time across all steps
    const completionTimes = analyticsResults
      .filter(step => step.avg_time_to_complete && step.avg_time_to_complete > 0)
      .map(step => step.avg_time_to_complete!);
    
    const avgCompletionTime = completionTimes.length > 0 
      ? Number((completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length).toFixed(2))
      : 0;

    // Format completion time
    const formatCompletionTime = (seconds: number) => {
      if (seconds < 60) return `${Math.round(seconds)}s`;
      if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
      return `${Math.round(seconds / 3600)}h`;
    };

    const overallAnalytics = {
      overall_conversion_rate: lastStep ? lastStep.conversion_rate : 0,
      total_users_entered: firstStep ? firstStep.total_users : 0,
      total_users_completed: lastStep ? lastStep.users : 0,
      avg_completion_time: avgCompletionTime,
      avg_completion_time_formatted: formatCompletionTime(avgCompletionTime),
      biggest_dropoff_step: biggestDropoff ? biggestDropoff.step_number : 1,
      biggest_dropoff_rate: biggestDropoff ? biggestDropoff.dropoff_rate : 0,
      steps_analytics: analyticsResults.map(step => ({
        step_number: step.step_number,
        step_name: step.step_name,
        users: step.users,
        total_users: step.total_users,
        conversion_rate: step.conversion_rate,
        dropoffs: step.dropoffs,
        dropoff_rate: step.dropoff_rate,
        avg_time_to_complete: step.avg_time_to_complete || 0
      }))
    };

    return c.json({
      success: true,
      data: overallAnalytics,
      date_range: {
        start_date: startDate,
        end_date: endDate
      }
    })
  } catch (error: any) {
    logger.error('Failed to fetch funnel analytics', {
      error: error.message,
      funnel_id: c.req.param('id'),
      website_id: c.get('website')?.id
    })
    
    return c.json({
      success: false,
      error: 'Failed to fetch funnel analytics'
    }, 500)
  }
})

export default funnelRouter 