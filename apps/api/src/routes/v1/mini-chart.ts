import { createErrorResponse } from "../../utils/analytics-helpers";

import { createMiniChartBuilder } from "../../builders/analytics";
import { createSuccessResponse } from "../../utils/analytics-helpers";
import { chQuery } from "@databuddy/db";
import { logger } from "../../lib/logger";
import type { AppVariables } from "../../types";
import { timezoneMiddleware, useTimezone } from "../../middleware/timezone";
import { Hono } from "hono";


const miniChartRouter = new Hono<{ Variables: AppVariables }>();

// Apply timezone middleware
miniChartRouter.use('*', timezoneMiddleware);

/**
 * Get mini chart data for website card
 * GET /analytics/mini-chart/:website_id
 */
miniChartRouter.get('/:website_id', async (c) => {
    const websiteId = c.req.param('website_id');
    const timezoneInfo = useTimezone(c);

  
    try {
      const miniChartBuilder = createMiniChartBuilder(websiteId);
      
      const chartData = await chQuery(miniChartBuilder.getSql());
      
      return c.json(createSuccessResponse({
        data: chartData || [],
        timezone: {
          timezone: timezoneInfo.timezone,
          detected: timezoneInfo.detected,
          source: timezoneInfo.source
        }
      }));
      
    } catch (error: any) {
      logger.error('Error fetching mini chart data:', error);
      return c.json(createErrorResponse({ 
        message: 'Error fetching mini chart data',
        error: error.message
      }), 500);
    }
  });
  
  /**
   * Get mini charts data for multiple websites in a single request
   * GET /analytics/batch-mini-charts?ids=id1,id2,id3
   */
  miniChartRouter.get('/batch-mini-charts', async (c) => {
    const ids = await c.req.query('ids');
    const user = c.get('user');
    const timezoneInfo = useTimezone(c);
    
    if (!user) {
      return c.json({ error: 'Authentication required' }, 401);
    }
  
    if (!ids) {
      return c.json(createErrorResponse({ 
        message: 'Website IDs required',
        error: 'Missing ids parameter'
      }), 400);
    }
  
    try {
      // Parse the comma-separated ids
      const websiteIds = ids.split(',');
      
      // Fetch mini chart data for all websites in parallel
      const promises = websiteIds.map(async (id) => {
        const miniChartBuilder = createMiniChartBuilder(id);
        const data = await chQuery(miniChartBuilder.getSql());
        return { 
          id, 
          data: data || [] 
        };
      });
      
      const results = await Promise.all(promises);
      
      // Convert results array to an object with website IDs as keys
      const batchData = results.reduce((acc, { id, data }) => {
        acc[id] = data;
        return acc;
      }, {} as Record<string, any>);
      
      return c.json(createSuccessResponse({
        data: batchData,
        timezone: {
          timezone: timezoneInfo.timezone,
          detected: timezoneInfo.detected,
          source: timezoneInfo.source
        }
      }));
      
    } catch (error: any) {
      logger.error('Error fetching batch mini chart data:', error);
      return c.json(createErrorResponse({ 
        message: 'Error fetching batch mini chart data'
      }), 500);
    }
  });

  export default miniChartRouter;