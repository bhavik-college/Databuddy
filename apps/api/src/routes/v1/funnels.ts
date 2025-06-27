import { Hono } from 'hono'
import { z } from 'zod'
import { eq, and, isNull, desc, sql } from 'drizzle-orm'

import { authMiddleware } from '../../middleware/auth'
import { websiteAuthHook } from '../../middleware/website'
import { logger } from '../../lib/logger'
import { db, funnelDefinitions, funnelGoals, chQuery } from '@databuddy/db'
import { parseReferrer } from '../../utils/referrer'

interface Website {
  id: string;
  domain: string;
  organizationId: string | null;
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

export const funnelRouter = new Hono<FunnelContext>()

funnelRouter.use('*', authMiddleware)
funnelRouter.use('*', websiteAuthHook({ website: ["read"] }))

// Get autocomplete data for funnel creation
async function getAutocompleteData(websiteId: string, startDate: string, endDate: string) {
  const query = `
    SELECT 'customEvents' as category, event_name as value
    FROM analytics.events
    WHERE client_id = '${websiteId}'
      AND time >= parseDateTimeBestEffort('${startDate}')
      AND time <= parseDateTimeBestEffort('${endDate}')
      AND event_name NOT IN ('screen_view', 'page_exit', 'error', 'web_vitals', 'link_out')
      AND event_name != ''
    GROUP BY event_name
    
    UNION ALL
    
    SELECT 'pagePaths' as category, 
           CASE 
             WHEN path LIKE 'http%' THEN 
               substring(path, position(path, '/', 9))
             ELSE path
           END as value
    FROM analytics.events
    WHERE client_id = '${websiteId}'
      AND time >= parseDateTimeBestEffort('${startDate}')
      AND time <= parseDateTimeBestEffort('${endDate}')
      AND event_name = 'screen_view'
      AND path != ''
    GROUP BY value
    HAVING value != '' AND value != '/'
    
    UNION ALL
    
    SELECT 'browsers' as category, browser_name as value
    FROM analytics.events
    WHERE client_id = '${websiteId}'
      AND time >= parseDateTimeBestEffort('${startDate}')
      AND time <= parseDateTimeBestEffort('${endDate}')
      AND browser_name IS NOT NULL AND browser_name != '' AND browser_name != 'Unknown'
    GROUP BY browser_name
    
    UNION ALL
    
    SELECT 'operatingSystems' as category, os_name as value
    FROM analytics.events
    WHERE client_id = '${websiteId}'
      AND time >= parseDateTimeBestEffort('${startDate}')
      AND time <= parseDateTimeBestEffort('${endDate}')
      AND os_name IS NOT NULL AND os_name != '' AND os_name != 'Unknown'
    GROUP BY os_name
    
    UNION ALL
    
    SELECT 'countries' as category, country as value
    FROM analytics.events
    WHERE client_id = '${websiteId}'
      AND time >= parseDateTimeBestEffort('${startDate}')
      AND time <= parseDateTimeBestEffort('${endDate}')
      AND country IS NOT NULL AND country != ''
    GROUP BY country
    
    UNION ALL
    
    SELECT 'deviceTypes' as category, device_type as value
    FROM analytics.events
    WHERE client_id = '${websiteId}'
      AND time >= parseDateTimeBestEffort('${startDate}')
      AND time <= parseDateTimeBestEffort('${endDate}')
      AND device_type IS NOT NULL AND device_type != ''
    GROUP BY device_type
    
    UNION ALL
    
    SELECT 'utmSources' as category, utm_source as value
    FROM analytics.events
    WHERE client_id = '${websiteId}'
      AND time >= parseDateTimeBestEffort('${startDate}')
      AND time <= parseDateTimeBestEffort('${endDate}')
      AND utm_source IS NOT NULL AND utm_source != ''
    GROUP BY utm_source
    
    UNION ALL
    
    SELECT 'utmMediums' as category, utm_medium as value
    FROM analytics.events
    WHERE client_id = '${websiteId}'
      AND time >= parseDateTimeBestEffort('${startDate}')
      AND time <= parseDateTimeBestEffort('${endDate}')
      AND utm_medium IS NOT NULL AND utm_medium != ''
    GROUP BY utm_medium
    
    UNION ALL
    
    SELECT 'utmCampaigns' as category, utm_campaign as value
    FROM analytics.events
    WHERE client_id = '${websiteId}'
      AND time >= parseDateTimeBestEffort('${startDate}')
      AND time <= parseDateTimeBestEffort('${endDate}')
      AND utm_campaign IS NOT NULL AND utm_campaign != ''
    GROUP BY utm_campaign
  `

  const results = await chQuery<{
    category: string;
    value: string;
  }>(query)

  // Group results by category - just simple arrays of strings
  const categorized = {
    customEvents: results.filter(r => r.category === 'customEvents').map(r => r.value),
    pagePaths: results.filter(r => r.category === 'pagePaths').map(r => r.value),
    browsers: results.filter(r => r.category === 'browsers').map(r => r.value),
    operatingSystems: results.filter(r => r.category === 'operatingSystems').map(r => r.value),
    countries: results.filter(r => r.category === 'countries').map(r => r.value),
    deviceTypes: results.filter(r => r.category === 'deviceTypes').map(r => r.value),
    utmSources: results.filter(r => r.category === 'utmSources').map(r => r.value),
    utmMediums: results.filter(r => r.category === 'utmMediums').map(r => r.value),
    utmCampaigns: results.filter(r => r.category === 'utmCampaigns').map(r => r.value)
  }

  return categorized
}

// Get autocomplete data for funnel creation
funnelRouter.get('/autocomplete', async (c) => {
  try {
    const website = c.get('website')
    const startDate = c.req.query('start_date') || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const endDate = c.req.query('end_date') || new Date().toISOString().split('T')[0]

    const autocompleteData = await getAutocompleteData(website.id, startDate, endDate)

    return c.json({
      success: true,
      data: autocompleteData,
      meta: {
        website_id: website.id,
        date_range: {
          start_date: startDate,
          end_date: endDate
        }
      }
    })
  } catch (error: any) {
    logger.error('Failed to fetch autocomplete data', {
      error: error.message,
      website_id: c.get('website')?.id
    })

    return c.json({
      success: false,
      error: 'Failed to fetch autocomplete data'
    }, 500)
  }
})

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
        isNull(funnelDefinitions.deletedAt),
        sql`jsonb_array_length(${funnelDefinitions.steps}) > 1`
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

// Get all goals for a website
funnelRouter.get('/goals', async (c) => {
    try {
      const website = c.get('website')
  
      const goals = await db
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
          isNull(funnelDefinitions.deletedAt),
          sql`jsonb_array_length(${funnelDefinitions.steps}) = 1`
        ))
        .orderBy(desc(funnelDefinitions.createdAt))
  
      return c.json({
        success: true,
        data: goals,
        meta: {
          total: goals.length,
          website_id: website.id
        }
      })
    } catch (error: any) {
      logger.error('Failed to fetch goals', {
        error: error.message,
        website_id: c.get('website')?.id
      })
  
      return c.json({
        success: false,
        error: 'Failed to fetch goals'
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

      if (steps.length <= 1) {
        return c.json({
            success: false,
            error: 'Funnels must have more than one step.'
        }, 400)
      }

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

// Create a new goal
funnelRouter.post(
    '/goals',
    async (c) => {
      try {
        const website = c.get('website')
        const user = c.get('user')
        const { name, description, steps, filters } = await c.req.json()
  
        if (steps.length !== 1) {
          return c.json({
              success: false,
              error: 'Goals must have exactly one step.'
          }, 400)
        }
  
        const goalId = crypto.randomUUID()
  
        const [newGoal] = await db
          .insert(funnelDefinitions)
          .values({
            id: goalId,
            websiteId: website.id,
            name,
            description,
            steps,
            filters,
            createdBy: user.id,
          })
          .returning()
  
        logger.info('Goal created', {
          goal_id: goalId,
          name,
          website_id: website.id,
          user_id: user.id
        })
  
        return c.json({
          success: true,
          data: newGoal
        }, 201)
      } catch (error: any) {
        logger.error('Failed to create goal', {
          error: error.message,
          website_id: c.get('website')?.id,
          user_id: c.get('user')?.id
        })
  
        return c.json({
          success: false,
          error: 'Failed to create goal'
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

      if (updates.steps && updates.steps.length <= 1) {
        return c.json({
            success: false,
            error: 'Funnels must have more than one step.'
        }, 400)
      }

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

// Update a goal
funnelRouter.put(
    '/:id/goals',
    async (c) => {
      try {
        const website = c.get('website')
        const goalId = c.req.param('id')
        const updates = await c.req.json()
  
        if (updates.steps && updates.steps.length !== 1) {
          return c.json({
              success: false,
              error: 'Goals must have exactly one step.'
          }, 400)
        }
  
        const [updatedGoal] = await db
          .update(funnelDefinitions)
          .set({
            ...updates,
            updatedAt: new Date().toISOString(),
          })
          .where(and(
            eq(funnelDefinitions.id, goalId),
            eq(funnelDefinitions.websiteId, website.id),
            isNull(funnelDefinitions.deletedAt)
          ))
          .returning()
  
        if (!updatedGoal) {
          return c.json({
            success: false,
            error: 'Goal not found'
          }, 404)
        }
  
        return c.json({
          success: true,
          data: updatedGoal
        })
      } catch (error: any) {
        logger.error('Failed to update goal', {
          error: error.message,
          goal_id: c.req.param('id'),
          website_id: c.get('website')?.id
        })
  
        return c.json({
          success: false,
          error: 'Failed to update goal'
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

// Delete a goal (soft delete)
funnelRouter.delete('/:id/goals', async (c) => {
    try {
      const website = c.get('website')
      const goalId = c.req.param('id')
  
      const [deletedGoal] = await db
        .update(funnelDefinitions)
        .set({
          deletedAt: new Date().toISOString(),
          isActive: false,
        })
        .where(and(
          eq(funnelDefinitions.id, goalId),
          eq(funnelDefinitions.websiteId, website.id),
          isNull(funnelDefinitions.deletedAt)
        ))
        .returning({ id: funnelDefinitions.id })
  
      if (!deletedGoal) {
        return c.json({
          success: false,
          error: 'Goal not found'
        }, 404)
      }
  
      return c.json({
        success: true,
        message: 'Goal deleted successfully'
      })
    } catch (error: any) {
      logger.error('Failed to delete goal', {
        error: error.message,
        goal_id: c.req.param('id'),
        website_id: c.get('website')?.id
      })
  
      return c.json({
        success: false,
        error: 'Failed to delete goal'
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
    const sessionEvents = new Map<string, Array<{ step_number: number, step_name: string, first_occurrence: number }>>();

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

// Get funnel analytics grouped by referrer
funnelRouter.get('/:funnel_id/analytics/referrer', async (c) => {
  const { funnel_id: funnelId } = c.req.param();
  const website = c.get('website');

  if (!website?.id) {
    return c.json({ success: false, error: 'Website not found' }, 404);
  }

  try {
    const params = c.req.query();
    const endDate = params.end_date || new Date().toISOString().split('T')[0];
    const startDate = params.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

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

    if (!steps || steps.length === 0) {
      return c.json({ success: false, error: 'Funnel has no steps' }, 400);
    }

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
          MIN(time) as first_occurrence,
          any(referrer) as session_referrer
        FROM analytics.events
        WHERE client_id = '${website.id}'
          AND time >= parseDateTimeBestEffort('${startDate}')
          AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')
          AND ${whereCondition}${filterConditions}
        GROUP BY session_id`;
    });

    // Get the first chronological referrer for each session, then get step events
    const sessionReferrerQuery = `
      WITH session_referrers AS (
        SELECT DISTINCT
          session_id,
          argMin(referrer, time) as first_referrer
        FROM analytics.events
        WHERE client_id = '${website.id}'
          AND time >= parseDateTimeBestEffort('${startDate}')
          AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')${filterConditions}
        GROUP BY session_id
      ),
      all_step_events AS (
        ${stepQueries.join('\n        UNION ALL\n')}
      )
      SELECT 
        ase.step_number,
        ase.step_name,
        ase.session_id,
        ase.first_occurrence,
        COALESCE(sr.first_referrer, '') as session_referrer
      FROM all_step_events ase
      LEFT JOIN session_referrers sr ON ase.session_id = sr.session_id
      ORDER BY ase.session_id, ase.first_occurrence
    `;

    // Log the generated query for debugging
    logger.info('Generated funnel referrer analysis query', {
      funnel_id: funnelId,
      website_id: website.id
    });

    let rawResults;
    try {
      rawResults = await chQuery<{
        step_number: number;
        step_name: string;
        session_id: string;
        first_occurrence: number;
        session_referrer: string;
      }>(sessionReferrerQuery);
    } catch (sqlError: any) {
      logger.error('SQL query failed for funnel referrer analytics', {
        funnel_id: funnelId,
        website_id: website.id,
        sql_error: sqlError.message,
        query: sessionReferrerQuery
      });
      throw new Error(`SQL query failed: ${sqlError.message}`);
    }

    const sessionReferrerMap = new Map<string, { normalizedKey: string, parsedReferrer: any }>();
    const referrerData = new Map<string, {
      parsedReferrer: any,
      sessions: Map<string, Array<{ step_number: number, step_name: string, first_occurrence: number }>>
    }>();

    for (const event of rawResults) {
      const rawReferrer = event.session_referrer || '';

      if (!sessionReferrerMap.has(event.session_id)) {
        let shouldSkip = false;
        if (website.domain && rawReferrer && rawReferrer !== 'direct') {
          try {
            const url = new URL(rawReferrer.startsWith('http') ? rawReferrer : `http://${rawReferrer}`);
            const hostname = url.hostname;

            if (hostname === website.domain || hostname.endsWith(`.${website.domain}`) ||
              (website.domain.startsWith('www.') && hostname === website.domain.substring(4)) ||
              (hostname.startsWith('www.') && website.domain === hostname.substring(4))) {
              shouldSkip = true;
            }
          } catch (e) { }
        }

        if (shouldSkip) {
          sessionReferrerMap.set(event.session_id, {
            normalizedKey: 'Direct',
            parsedReferrer: { type: 'direct', name: 'Direct', domain: '', url: '' }
          });
        } else {
          const parsedReferrer = parseReferrer(rawReferrer || null, website.domain);
          sessionReferrerMap.set(event.session_id, {
            normalizedKey: parsedReferrer.name,
            parsedReferrer
          });
        }
      }

      const sessionData = sessionReferrerMap.get(event.session_id)!;
      const normalizedReferrer = sessionData.normalizedKey;

      if (!referrerData.has(normalizedReferrer)) {
        referrerData.set(normalizedReferrer, {
          parsedReferrer: sessionData.parsedReferrer,
          sessions: new Map()
        });
      }

      const referrerGroup = referrerData.get(normalizedReferrer)!;
      if (!referrerGroup.sessions.has(event.session_id)) {
        referrerGroup.sessions.set(event.session_id, []);
      }

      referrerGroup.sessions.get(event.session_id)!.push({
        step_number: event.step_number,
        step_name: event.step_name,
        first_occurrence: event.first_occurrence
      });
    }

    const referrerAnalytics = [];

    for (const [normalizedKey, referrerGroup] of referrerData) {
      const stepCounts = new Map<number, Set<string>>();

      // Calculate progression for each session
      for (const [sessionId, events] of referrerGroup.sessions) {
        events.sort((a, b) => a.first_occurrence - b.first_occurrence);

        let currentStep = 1;
        for (const event of events) {
          if (event.step_number === currentStep) {
            if (!stepCounts.has(event.step_number)) {
              stepCounts.set(event.step_number, new Set());
            }
            stepCounts.get(event.step_number)!.add(sessionId);
            currentStep++;
          }
        }
      }

      const parsedReferrer = referrerGroup.parsedReferrer;
      const stepsAnalytics = steps.map((step: any, index: number) => {
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
          dropoff_rate
        };
      });

      const firstStep = stepsAnalytics[0];
      const lastStep = stepsAnalytics[stepsAnalytics.length - 1];
      const overallConversion = lastStep && firstStep && firstStep.users > 0 ?
        Math.round((lastStep.users / firstStep.users) * 100 * 100) / 100 : 0;

      referrerAnalytics.push({
        referrer: parsedReferrer.name,
        referrer_parsed: {
          type: parsedReferrer.type,
          name: parsedReferrer.name,
          domain: parsedReferrer.domain,
          url: parsedReferrer.url
        },
        total_users: firstStep ? firstStep.users : 0,
        completed_users: lastStep ? lastStep.users : 0,
        overall_conversion_rate: overallConversion,
        steps_analytics: stepsAnalytics
      });
    }

    referrerAnalytics.sort((a, b) => b.total_users - a.total_users);

    return c.json({
      success: true,
      data: {
        referrer_analytics: referrerAnalytics,
        total_referrers: referrerAnalytics.length
      },
      date_range: {
        start_date: startDate,
        end_date: endDate
      }
    });

  } catch (error: any) {
    logger.error('Failed to fetch funnel analytics by referrer', {
      error: error.message,
      funnel_id: funnelId,
      website_id: website.id
    });
    return c.json({ success: false, error: 'Failed to fetch funnel analytics by referrer' }, 500);
  }
});

// Get goal analytics (single-step conversion rate vs all site users)
funnelRouter.get('/:id/goal-analytics', async (c) => {
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
        error: 'Goal not found'
      }, 404)
    }

    const funnelData = funnel[0]
    const steps = funnelData.steps as Array<{ type: string; target: string; name: string; conditions?: any }>
    const filters = funnelData.filters as Array<{ field: string; operator: string; value: string | string[] }> || []

    // For goals, we only care about the first (and only) step
    const goalStep = steps[0]
    if (!goalStep) {
      return c.json({
        success: false,
        error: 'Invalid goal configuration'
      }, 400)
    }

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

    // Build goal-specific where condition
    let goalWhereCondition = '';
    if (goalStep.type === 'PAGE_VIEW') {
      const targetPath = goalStep.target.replace(/'/g, "''");
      goalWhereCondition = `event_name = 'screen_view' AND (path = '${targetPath}' OR path LIKE '%${targetPath}%')`;
    } else if (goalStep.type === 'EVENT') {
      const eventName = goalStep.target.replace(/'/g, "''");
      goalWhereCondition = `event_name = '${eventName}'`;
    }

    // Query to get total unique users (sessions) and goal completions
    const analyticsQuery = `
      WITH 
      total_sessions AS (
        SELECT COUNT(DISTINCT session_id) as total_users
        FROM analytics.events
        WHERE client_id = '${website.id}'
          AND time >= parseDateTimeBestEffort('${startDate}')
          AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')${filterConditions}
      ),
      goal_sessions AS (
        SELECT COUNT(DISTINCT session_id) as goal_users
        FROM analytics.events
        WHERE client_id = '${website.id}'
          AND time >= parseDateTimeBestEffort('${startDate}')
          AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')
          AND ${goalWhereCondition}${filterConditions}
      )
      SELECT 
        total_sessions.total_users,
        goal_sessions.goal_users,
        CASE 
          WHEN total_sessions.total_users > 0 
          THEN ROUND((goal_sessions.goal_users * 100.0) / total_sessions.total_users, 2)
          ELSE 0.0 
        END as conversion_rate
      FROM total_sessions, goal_sessions
    `;

    logger.info('Generated goal analytics query', {
      funnel_id: funnelId,
      website_id: website.id,
      goal_type: goalStep.type,
      goal_target: goalStep.target,
      query: analyticsQuery
    });

    let results;
    try {
      results = await chQuery<{
        total_users: number;
        goal_users: number;
        conversion_rate: number;
      }>(analyticsQuery);
    } catch (sqlError: any) {
      logger.error('SQL query failed for goal analytics', {
        funnel_id: funnelId,
        website_id: website.id,
        sql_error: sqlError.message,
        query: analyticsQuery
      });
      throw new Error(`SQL query failed: ${sqlError.message}`);
    }

    const result = results[0] || { total_users: 0, goal_users: 0, conversion_rate: 0 };

    // Format response to match funnel analytics structure
    const goalAnalytics = {
      overall_conversion_rate: result.conversion_rate,
      total_users_entered: result.total_users,
      total_users_completed: result.goal_users,
      avg_completion_time: 0,
      avg_completion_time_formatted: "0s",
      biggest_dropoff_step: 1,
      biggest_dropoff_rate: 0,
      steps_analytics: [{
        step_number: 1,
        step_name: goalStep.name,
        users: result.goal_users,
        total_users: result.total_users,
        conversion_rate: result.conversion_rate,
        dropoffs: result.total_users - result.goal_users,
        dropoff_rate: result.total_users > 0 ?
          Math.round(((result.total_users - result.goal_users) / result.total_users) * 100 * 100) / 100 : 0,
        avg_time_to_complete: 0
      }]
    };

    return c.json({
      success: true,
      data: goalAnalytics,
      date_range: {
        start_date: startDate,
        end_date: endDate
      }
    });

  } catch (error: any) {
    logger.error('Failed to fetch goal analytics', {
      error: error.message,
      funnel_id: c.req.param('id'),
      website_id: c.get('website')?.id
    });

    return c.json({
      success: false,
      error: 'Failed to fetch goal analytics'
    }, 500);
  }
});

export default funnelRouter 