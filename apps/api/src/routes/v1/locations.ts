import { createSqlBuilder } from "../../builders/analytics";

import { Hono } from "hono";
import type { AppVariables } from "../../types";
import { logger } from "../../lib/logger";
import { chQuery } from "@databuddy/db";



export const locationsRouter = new Hono<{ Variables: AppVariables }>();


  

locationsRouter.get('/', async (c) => {
    const params = await c.req.query();
  
    try {
      const endDate = params.end_date || new Date().toISOString().split('T')[0];
      const startDate = params.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      // Create SQL builder for country data - directly from events table
      const countryBuilder = createSqlBuilder('events');
      
      countryBuilder.sb.select = {
        country: 'COALESCE(country, \'Unknown\') as country',
        visitors: 'COUNT(DISTINCT anonymous_id) as visitors',
        pageviews: 'COUNT(*) as pageviews'
      };
      
      countryBuilder.sb.where = {
        client_filter: `client_id = '${params.website_id}'`,
        date_filter: `time >= parseDateTimeBestEffort('${startDate}') AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')`,
        event_filter: "event_name = 'screen_view'"
      };
      
      countryBuilder.sb.groupBy = {
        country: 'country'
      };
      
      countryBuilder.sb.orderBy = {
        visitors: 'visitors DESC'
      };
      
      countryBuilder.sb.limit = Number(params.limit);
      
      // Create SQL builder for region data - directly from events table
      const regionBuilder = createSqlBuilder('events');
      
      regionBuilder.sb.select = {
        country: 'COALESCE(country, \'Unknown\') as country',
        region: 'COALESCE(region, \'Unknown\') as region',
        visitors: 'COUNT(DISTINCT anonymous_id) as visitors',
        pageviews: 'COUNT(*) as pageviews'
      };
      
      regionBuilder.sb.where = {
        client_filter: `client_id = '${params.website_id}'`,
        date_filter: `time >= parseDateTimeBestEffort('${startDate}') AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')`,
        region_filter: `region != ''`,
        event_filter: "event_name = 'screen_view'"
      };
      
      regionBuilder.sb.groupBy = {
        country: 'country',
        region: 'region'
      };
      
      regionBuilder.sb.orderBy = {
        visitors: 'visitors DESC'
      };
      
      regionBuilder.sb.limit = Number(params.limit);
      
      const countries = await chQuery(countryBuilder.getSql());
      const regions = await chQuery(regionBuilder.getSql());
      
      return c.json({
        success: true,
        website_id: params.website_id,
        date_range: {
          start_date: startDate,
          end_date: endDate
        },
        countries,
        regions
      });
    } catch (error) {
      logger.error('Error retrieving location analytics data', { 
        error,
        website_id: params.website_id
      });
      
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }, 500);
    }
  });
  

export default locationsRouter;