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
        filters: funnelDefinitions.filters,
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
      const { name, description, steps, filters } = await c.req.json()
      
      const funnelId = crypto.randomUUID()
      
      const [newFunnel] = await db
        .insert(funnelDefinitions)
        .values({
          id: funnelId,
          websiteId: website.id,
          name,
          description,
          steps,
          filters,
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
    const filters = funnelData.filters as Array<{ field: string; operator: string; value: string | string[] }> || []

    // Build filter conditions
    const buildFilterConditions = () => {
      if (!filters || filters.length === 0) return '';
      
      const filterConditions = filters.map(filter => {
        const field = filter.field.replace(/'/g, "''");
        const value = Array.isArray(filter.value) ? filter.value : [filter.value];
        
        switch (filter.operator) {
          case 'equals':
            return `${field} = '${value[0].replace(/'/g, "''")}'`;
          case 'contains':
            return `${field} LIKE '%${value[0].replace(/'/g, "''")}%'`;
          case 'not_equals':
            return `${field} != '${value[0].replace(/'/g, "''")}'`;
          case 'in':
            return `${field} IN (${value.map(v => `'${v.replace(/'/g, "''")}'`).join(', ')})`;
          case 'not_in':
            return `${field} NOT IN (${value.map(v => `'${v.replace(/'/g, "''")}'`).join(', ')})`;
          default:
            return '';
        }
      }).filter(Boolean);
      
      return filterConditions.length > 0 ? ` AND ${filterConditions.join(' AND ')}` : '';
    };

    const filterConditions = buildFilterConditions();

    const stepQueries = steps.map((step, index) => {
      let whereCondition = '';
      
      if (step.type === 'PAGE_VIEW') {
        const targetPath = step.target.replace(/'/g, "''");
        whereCondition = `event_name = 'screen_view' AND (path = '${targetPath}' OR path LIKE '%${targetPath}%')`;
      } else if (step.type === 'EVENT') {
        const eventName = step.target.replace(/'/g, "''");
        whereCondition = `event_name = '${eventName}'`;
      }
      
      return `
        SELECT 
          ${index + 1} as step_number,
          '${step.name.replace(/'/g, "''")}' as step_name,
          session_id,
          MIN(time) as first_occurrence
        FROM analytics.events
        WHERE client_id = '${website.id}'
          AND time >= parseDateTimeBestEffort('${startDate}')
          AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')
          AND ${whereCondition}${filterConditions}
        GROUP BY session_id`;
    });

    // Get all step events and then process the funnel logic in JavaScript
    const analysisQuery = `
      WITH all_step_events AS (
        ${stepQueries.join('\n        UNION ALL\n')}
      )
      SELECT 
        step_number,
        step_name,
        session_id,
        first_occurrence
      FROM all_step_events
      ORDER BY session_id, first_occurrence
    `;
    


    // Log the generated query for debugging
    logger.info('Generated funnel analysis query', {
      funnel_id: funnelId,
      website_id: website.id,
      query: analysisQuery
    });

    let rawResults;
    try {
      rawResults = await chQuery<{
        step_number: number;
        step_name: string;
        session_id: string;
        first_occurrence: number;
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

    // Process the results to calculate proper funnel progression
    // Group events by session and calculate funnel progression
    const sessionEvents = new Map<string, Array<{step_number: number, step_name: string, first_occurrence: number}>>();
    
    for (const event of rawResults) {
      if (!sessionEvents.has(event.session_id)) {
        sessionEvents.set(event.session_id, []);
      }
      sessionEvents.get(event.session_id)!.push({
        step_number: event.step_number,
        step_name: event.step_name,
        first_occurrence: event.first_occurrence
      });
    }

    // Calculate funnel progression for each session
    const stepCounts = new Map<number, Set<string>>();
    
    for (const [sessionId, events] of sessionEvents) {
      // Sort events by time
      events.sort((a, b) => a.first_occurrence - b.first_occurrence);
      
      // Track which steps this session completed in order
      let currentStep = 1;
      const completedSteps = new Set<number>();
      
      for (const event of events) {
        if (event.step_number === currentStep) {
          completedSteps.add(event.step_number);
          if (!stepCounts.has(event.step_number)) {
            stepCounts.set(event.step_number, new Set());
          }
          stepCounts.get(event.step_number)!.add(sessionId);
          currentStep++;
        }
      }
    }

    // Build analytics results
    const analyticsResults = steps.map((step, index) => {
      const stepNumber = index + 1;
      const users = stepCounts.get(stepNumber)?.size || 0;
      const prevStepUsers = index > 0 ? (stepCounts.get(index)?.size || 0) : users;
      const totalUsers = stepCounts.get(1)?.size || 0;
      
      const conversion_rate = index === 0 ? 100.0 : 
        prevStepUsers > 0 ? Math.round((users / prevStepUsers) * 100 * 100) / 100 : 0;
      
      const dropoffs = index > 0 ? prevStepUsers - users : 0;
      const dropoff_rate = index > 0 && prevStepUsers > 0 ? 
        Math.round((dropoffs / prevStepUsers) * 100 * 100) / 100 : 0;

      return {
        step_number: stepNumber,
        step_name: step.name,
        users,
        total_users: totalUsers,
        conversion_rate,
        dropoffs,
        dropoff_rate,
        avg_time_to_complete: 0
      };
    });

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