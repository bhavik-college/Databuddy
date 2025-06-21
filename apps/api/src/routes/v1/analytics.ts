/**
 * Analytics Dashboard Data API
 * 
 * Provides endpoints for retrieving aggregated analytics data for website dashboards.
 */

import { Hono } from 'hono';

import { authMiddleware } from '../../middleware/auth';
import { timezoneMiddleware } from '../../middleware/timezone';
import { logger } from '../../lib/logger';
import { websiteAuthHook } from '../../middleware/website';

type AnalyticsContext = {
  Variables: {
    website: any;
    user: any;
  };
};

export const analyticsRouter = new Hono<AnalyticsContext>();

analyticsRouter.use('*', authMiddleware);
analyticsRouter.use('*', websiteAuthHook);
analyticsRouter.use('*', timezoneMiddleware);

analyticsRouter.get('/summary', async (c: any) => {
  const website = c.get('website');

  if (!website?.id) {
    return c.json({ error: 'Website not found' }, 404);
  }

  try {
    const { chQuery } = await import('@databuddy/db');
    
    const hasData = await chQuery<{ count: number }>(`
      SELECT COUNT(*) as count
      FROM analytics.events
      WHERE client_id = '${website.id}'
      AND event_name = 'screen_view'
      LIMIT 1
    `);

    const hasTrackingData = hasData[0]?.count > 0;

    return c.json({
      success: true,
      tracking_setup: hasTrackingData,
      website_id: website.id,
      domain: website.domain
    });
  } catch (error) {
    logger.error('Error checking tracking data', { error, website_id: website.id });
    return c.json({ success: false, error: "Error checking tracking data" }, 500);
  }
});

import miniChartRouter from './mini-chart';
import sessionsRouter from './sessions';
import profilesRouter from './profiles';
import locationsRouter from './locations';
import errorsRouter from './errors';
import queryRouter from './query';

analyticsRouter.route('/mini-chart', miniChartRouter);
analyticsRouter.route('/sessions', sessionsRouter);
analyticsRouter.route('/profiles', profilesRouter);
analyticsRouter.route('/locations', locationsRouter);
analyticsRouter.route('/errors', errorsRouter);
analyticsRouter.route('/query', queryRouter);

export default analyticsRouter;