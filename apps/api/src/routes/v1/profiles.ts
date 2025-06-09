import { chQuery } from "@databuddy/db";
import { createSqlBuilder } from "../../builders/analytics";
import { parseReferrers } from "../../builders";
import { logger } from "../../lib/logger";
import { formatDuration } from "../../utils/dates";
import { generateSessionName } from "../../utils/sessions";
import { parseUserAgentDetails } from "../../utils/ua";
import { timezoneMiddleware, useTimezone, timezoneQuerySchema } from "../../middleware/timezone";
import { Hono } from "hono";
import type { AppVariables } from "../../types";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const profilesRouter = new Hono<{ Variables: AppVariables }>();

const mapCountryCode = (country: string): string => {
  return country === 'IL' ? 'PS' : country;
};

// Apply timezone middleware
profilesRouter.use('*', timezoneMiddleware);

const analyticsQuerySchema = z.object({
    website_id: z.string().min(1, 'Website ID is required'),
    start_date: z.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
    end_date: z.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
    interval: z.enum(['day', 'week', 'month', 'auto']).default('day'),
    granularity: z.enum(['daily', 'hourly']).default('daily'),
    limit: z.coerce.number().int().min(1).max(1000).default(30),
    page: z.coerce.number().int().min(1).default(1),
}).merge(timezoneQuerySchema);

// GET /analytics/profiles - retrieves visitor profiles with their sessions
profilesRouter.get('/', zValidator('query', analyticsQuerySchema), async (c) => {
    const params = c.req.valid('query');
    const timezoneInfo = useTimezone(c);
    
    try {
      const endDate = params.end_date || new Date().toISOString().split('T')[0];
      const startDate = params.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const profilesLimit = params.limit;
      const page = params.page || 1;
      const offset = (page - 1) * profilesLimit;
      
      // 1. Get paginated unique visitor IDs with their basic stats
      const visitorIdsBuilder = createSqlBuilder();
      visitorIdsBuilder.sb.select = {
        visitor_id: 'anonymous_id as visitor_id',
        session_count: 'uniqExact(session_id) as session_count',
        first_visit: 'MIN(time) as first_visit',
        last_visit: 'MAX(time) as last_visit'
      };
      visitorIdsBuilder.sb.from = 'analytics.events';
      visitorIdsBuilder.sb.where = {
        client_filter: `client_id = '${params.website_id}'`,
        date_filter: `time >= parseDateTimeBestEffort('${startDate}') AND time <= parseDateTimeBestEffort('${endDate} 23:59:59' )`
      };
      visitorIdsBuilder.sb.groupBy = { visitor_id: 'anonymous_id' };
      visitorIdsBuilder.sb.orderBy = { session_count: 'session_count DESC', last_visit: 'last_visit DESC' };
      visitorIdsBuilder.sb.limit = profilesLimit;
      visitorIdsBuilder.sb.offset = offset;
      
      const visitorIdsResult = await chQuery(visitorIdsBuilder.getSql());
      
      if (!visitorIdsResult.length) {
        return c.json({
          success: true,
          profiles: [],
          date_range: { start_date: startDate, end_date: endDate },
          total_visitors: 0,
          returning_visitors: 0,
          pagination: { page, limit: profilesLimit, hasNext: false,  hasPrev: page > 1 },
          timezone: { timezone: timezoneInfo.timezone, detected: timezoneInfo.detected, source: timezoneInfo.source }
        });
      }
      
      const visitorIdList = visitorIdsResult.map(v => v.visitor_id);

      // 2. Get all sessions for these specific visitor IDs
      const sessionsBuilder = createSqlBuilder();
      sessionsBuilder.sb.select = {
        session_id: 'session_id',
        visitor_id: 'anonymous_id as visitor_id',
        first_visit: 'MIN(time) as first_visit',
        last_visit: 'MAX(time) as last_visit',
        duration: 'dateDiff(\'second\', MIN(time), MAX(time)) as duration',
        page_views: 'countIf(event_name = \'screen_view\') as page_views',
        user_agent: 'any(user_agent) as user_agent',
        country: 'any(country) as country',
        region: 'any(region) as region',
        referrer: 'any(referrer) as referrer'
      };
      sessionsBuilder.sb.from = 'analytics.events';
      sessionsBuilder.sb.where = {
        client_filter: `client_id = '${params.website_id}'`,
        date_filter: `time >= parseDateTimeBestEffort('${startDate}') AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')`,
        visitor_filter: `anonymous_id IN (${visitorIdList.map(id => `'${id}'`).join(',')})`
      };
      sessionsBuilder.sb.groupBy = { session_id: 'session_id', visitor_id: 'anonymous_id' };
      sessionsBuilder.sb.orderBy = { visitor_id: 'visitor_id', first_visit: 'first_visit DESC' };

      const allSessionsResult = await chQuery(sessionsBuilder.getSql());

      const sessionsByVisitor: Record<string, any[]> = {};
      for (const session of allSessionsResult) {
        if (!sessionsByVisitor[session.visitor_id]) {
            sessionsByVisitor[session.visitor_id] = [];
        }
        sessionsByVisitor[session.visitor_id].push(session);
      }
      
      // 3. Get overall visitor stats for the date range
      const visitorStatsBuilder = createSqlBuilder();
      visitorStatsBuilder.sb.select = {
        total_visitors: 'uniqExact(anonymous_id) as total_visitors',
        returning_visitors: 'countIf(sessions > 1) as returning_visitors'
      };
      visitorStatsBuilder.sb.from = `(
        SELECT 
          anonymous_id, 
          COUNT(DISTINCT session_id) as sessions
        FROM analytics.events
        WHERE 
          client_id = '${params.website_id}'
          AND time >= parseDateTimeBestEffort('${startDate}')
          AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')
        GROUP BY anonymous_id
      )`;
      
      const visitorStatsResult = await chQuery(visitorStatsBuilder.getSql());
      const totalVisitors = visitorStatsResult[0]?.total_visitors || 0;
      const returningVisitors = visitorStatsResult[0]?.returning_visitors || 0;
      
      // 4. Construct profiles with their sessions
      const profiles = [];
      for (const visitor of visitorIdsResult) {
        const visitorSessions = sessionsByVisitor[visitor.visitor_id] || [];
        
        const formattedSessions = visitorSessions.map(session => {
          const durationInSeconds = session.duration || 0;
          const durationFormatted = formatDuration(durationInSeconds);
          const userAgentInfo = parseUserAgentDetails(session.user_agent || '');
          const referrerParsed = session.referrer ? parseReferrers(
            [{ referrer: session.referrer, visitors: 0, pageviews: 0 }]
          )[0] : null;
          const sessionName = generateSessionName(session.session_id);
          
          return {
            ...session,
            session_name: sessionName,
            device: userAgentInfo.device_type,
            browser: userAgentInfo.browser_name,
            os: userAgentInfo.os_name,
            duration_formatted: durationFormatted,
            country: mapCountryCode(session.country || ''),
            referrer_parsed: referrerParsed,
            visitor_id: visitor.visitor_id,
            is_returning_visitor: visitor.session_count > 1,
            visitor_session_count: visitor.session_count
          };
        }) as Array<any>; 
        
        const totalDuration = formattedSessions.reduce((sum, session) => sum + (session.duration || 0), 0);
        const totalDurationFormatted = formatDuration(totalDuration);
        const latestSession = formattedSessions[0];
        
        const profile = {
          visitor_id: visitor.visitor_id,
          first_visit: visitor.first_visit,
          last_visit: visitor.last_visit,
          total_sessions: visitor.session_count,
          total_pageviews: formattedSessions.reduce((sum, session) => sum + (session.page_views || 0), 0),
          total_duration: totalDuration,
          total_duration_formatted: totalDurationFormatted,
          device: latestSession?.device || 'Unknown',
          browser: latestSession?.browser || 'Unknown',
          os: latestSession?.os || 'Unknown',
          country: mapCountryCode(latestSession?.country || 'Unknown'),
          region: latestSession?.region || 'Unknown',
          sessions: formattedSessions
        };
        
        profiles.push(profile);
      }
      
      const hasNext = page * profilesLimit < totalVisitors;

      return c.json({
        success: true,
        profiles,
        date_range: { start_date: startDate, end_date: endDate },
        total_visitors: totalVisitors, 
        returning_visitors: returningVisitors,
        pagination: { page, limit: profilesLimit, hasNext, hasPrev: page > 1 },
        timezone: { timezone: timezoneInfo.timezone, detected: timezoneInfo.detected, source: timezoneInfo.source }
      });
    } catch (error) {
      logger.error('Error retrieving visitor profiles:', { 
        error,
        website_id: params.website_id
      });
      
      return c.json({
        success: false,
        error: "Error retrieving visitor profiles"
      }, 500);
    }
  });
  
  export default profilesRouter;