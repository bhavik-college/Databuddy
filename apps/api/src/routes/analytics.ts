/**
 * Analytics Dashboard Data API
 * 
 * Provides endpoints for retrieving aggregated analytics data for website dashboards.
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { chQuery, createSqlBuilder } from '../clickhouse/client';
import type { AppVariables } from '../types';
import { authMiddleware } from '../middleware/auth';
import { UAParser } from 'ua-parser-js';
import { 
  formatTime, 
  formatPerformanceMetric, 
  getDefaultDateRange, 
  formatCleanPath,
  createSuccessResponse, 
  createErrorResponse,
  formatBrowserData,
  formatDeviceData
} from '../utils/analytics-helpers';
import {
  createSummaryBuilder, 
  createTodayBuilder, 
  createTodayByHourBuilder,
  createTopPagesBuilder, 
  createTopReferrersBuilder, 
  createEventsByDateBuilder,
  createScreenResolutionsBuilder,
  createBrowserVersionsBuilder,
  createCountriesBuilder,
  createDeviceTypesBuilder,
  createConnectionTypesBuilder,
  createLanguagesBuilder,
  createTimezonesBuilder,
  createPerformanceBuilder,
  createSessionsBuilder,
  createSessionEventsBuilder,
  createMiniChartBuilder,
  parseReferrers
} from '../builders/analytics';
import {
  mergeTodayDataIntoSummary,
  updateEventsWithTodayData,
  mergeTodayIntoTrends
} from '../utils/today-data-processor';
import { logger } from '../lib/logger';
import { websiteAuthHook } from '../middleware/website';

// Define types for data processing
interface ReferrerData {
  referrer: string;
  visitors: number;
  pageviews: number;
}


interface PageData {
  path: string;
  pageviews: number;
  visitors: number;
  avg_time_on_page: number | null;
}

interface AnalyticsEntry {
  date: string;
  pageviews: number;
  unique_visitors?: number;
  visitors?: number;
  sessions: number;
  bounce_rate: number;
  avg_session_duration?: number;
  [key: string]: any;
}


// Create router with typed context
export const analyticsRouter = new Hono<{ 
  Variables: AppVariables & { 
    user?: { id: string, email: string } | null;
    session?: any;
  }
}>();

// Apply auth middleware to all routes
analyticsRouter.use('*', authMiddleware);
analyticsRouter.use('*', websiteAuthHook);

// Validation schema for analytics query parameters
const analyticsQuerySchema = z.object({
  website_id: z.string().min(1, 'Website ID is required'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  interval: z.enum(['day', 'week', 'month', 'auto']).default('day'),
  granularity: z.enum(['daily', 'hourly']).default('daily'),
  limit: z.coerce.number().int().min(1).max(1000).default(30),
});


/**
 * Get summary statistics
 * GET /analytics/summary
 */
analyticsRouter.get('/summary', zValidator('query', analyticsQuerySchema), async (c) => {
  const params = c.req.valid('query');
  const user = c.get('user');
  const website = c.get('website');

  if (!website || !website.id) {
    return c.json({ error: 'Website not found' }, 404);
  }
  
  if (!user) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  try {
    // Set default date range if not provided
    const { startDate, endDate } = getDefaultDateRange(params.end_date, params.start_date);
    const todayDateStr = new Date().toISOString().split('T')[0];
    
    // Use our builders for all queries
    const summaryBuilder = createSummaryBuilder(params.website_id, startDate, endDate);
    const todayBuilder = createTodayBuilder(params.website_id);
    const todayByHourBuilder = createTodayByHourBuilder(params.website_id);
    const topPagesBuilder = createTopPagesBuilder(params.website_id, startDate, endDate, 5);
    const topReferrersBuilder = createTopReferrersBuilder(params.website_id, startDate, endDate, website.domain);
    const eventsByDateBuilder = createEventsByDateBuilder(
      params.website_id, 
      startDate, 
      endDate, 
      params.granularity as 'hourly' | 'daily'
    );
    const todayPagesBuilder = createTopPagesBuilder(params.website_id, todayDateStr, todayDateStr, 5);
    const resolutionsBuilder = createScreenResolutionsBuilder(params.website_id, startDate, endDate, 6);
    const browserVersionsBuilder = createBrowserVersionsBuilder(params.website_id, startDate, endDate, 5);
    const countriesBuilder = createCountriesBuilder(params.website_id, startDate, endDate, 100);
    const deviceTypesBuilder = createDeviceTypesBuilder(params.website_id, startDate, endDate, 5);
    const connectionTypesBuilder = createConnectionTypesBuilder(params.website_id, startDate, endDate, 5);
    const languagesBuilder = createLanguagesBuilder(params.website_id, startDate, endDate, 5);
    const timezonesBuilder = createTimezonesBuilder(params.website_id, startDate, endDate, 5);
    const performanceBuilder = createPerformanceBuilder(params.website_id, startDate, endDate);

    // Execute all queries
    const [
      summaryData, 
      todayData, 
      todayHourlyData,
      topPages, 
      topReferrers, 
      eventsByDate, 
      todayTopPages, 
      resolutions,
      browserVersions,
      countries,
      deviceTypeResults,
      connectionTypes,
      languages,
      timezones,
      performance,
    ] = await Promise.all([
      chQuery(summaryBuilder.getSql()),
      chQuery(todayBuilder.getSql()),
      chQuery(todayByHourBuilder.getSql()),
      chQuery(topPagesBuilder.getSql()),
      chQuery(topReferrersBuilder.getSql()),
      chQuery(eventsByDateBuilder.getSql()),
      chQuery(todayPagesBuilder.getSql()),
      chQuery(resolutionsBuilder.getSql()),
      chQuery(browserVersionsBuilder.getSql()),
      chQuery(countriesBuilder.getSql()),
      chQuery(deviceTypesBuilder.getSql()),
      chQuery(connectionTypesBuilder.getSql()),
      chQuery(languagesBuilder.getSql()),
      chQuery(timezonesBuilder.getSql()),
      chQuery(performanceBuilder.getSql()),

    ]);
    
    if (!website) {
      return c.json({ error: 'Website not found' }, 404);
    }
    
    // Process today's hourly data to make sure we have accurate "today" summary
    const todaySummary = {
      pageviews: 0,
      visitors: 0,
      sessions: 0,
      bounce_rate: 0,
      bounce_rate_pct: "0%"
    };
    
    // Sum up all the pageviews, visitors, and sessions from today's hourly data
    let todayTotalSessions = 0;
    let todayBounceRateSum = 0;
    
    for (const hour of todayHourlyData) {
      if (hour.pageviews > 0) {
        todaySummary.pageviews += hour.pageviews;
        // Don't sum up visitors here as they'll be double-counted
        todaySummary.sessions += hour.sessions || 0;
        
        // Track total sessions and weighted bounce rate
        if (hour.sessions > 0 && hour.bounce_rate > 0) {
          todayTotalSessions += hour.sessions;
          todayBounceRateSum += (hour.sessions * hour.bounce_rate);
        }
      }
    }
    
    // Create a dedicated query to get accurate unique visitor count for today
    const todayUniqueVisitorsBuilder = createSqlBuilder('events');
    
    todayUniqueVisitorsBuilder.sb.select = {
      unique_visitors: 'COUNT(DISTINCT anonymous_id) as unique_visitors'
    };
    
    todayUniqueVisitorsBuilder.sb.where = {
      client_filter: `client_id = '${params.website_id}'`,
      date_filter: "toDate(time) = today()",
      event_filter: "event_name = 'screen_view'"
    };
    
    const todayUniqueVisitorsResult = await chQuery(todayUniqueVisitorsBuilder.getSql());
    todaySummary.visitors = todayUniqueVisitorsResult[0]?.unique_visitors || 0;
    
    // Calculate weighted bounce rate
    if (todayTotalSessions > 0) {
      todaySummary.bounce_rate = todayBounceRateSum / todayTotalSessions;
      todaySummary.bounce_rate_pct = `${Math.round(todaySummary.bounce_rate * 10) / 10}%`;
    } else {
      // Ensure consistency if no sessions, bounce_rate remains 0 and bounce_rate_pct remains "0%" from initialization
      todaySummary.bounce_rate = 0;
      todaySummary.bounce_rate_pct = "0%";
    }
    
    // Process browser data to include browser version and OS info
    const processedBrowserVersions = browserVersions.length > 0 ? formatBrowserData(browserVersions as Array<{ 
      browser_name: string; 
      browser_version: string; 
      os_name: string;
      os_version: string;
      count: number; 
      visitors: number 
    }>) : [];
    
    // Process device types
    const deviceTypes = formatDeviceData(deviceTypeResults as Array<{ device_type: string; device_brand: string; device_model: string; visitors: number; pageviews: number }>);
    
    // Sort device types by visitors
    deviceTypes.sort((a: { visitors: number }, b: { visitors: number }) => b.visitors - a.visitors);
    
    // Process countries to replace empty values with "Unknown"
    const processedCountries = countries.map(country => ({
      ...country,
      country: country.country?.trim() ? country.country : 'Unknown'
    }));
    
    // Use utility to merge today's data with historical data
    const summary = mergeTodayDataIntoSummary(summaryData[0], todaySummary);
    
    // Update events_by_date to include today's data
    const updatedEventsByDate = updateEventsWithTodayData(
      eventsByDate as AnalyticsEntry[], 
      todaySummary,
      params.granularity as 'hourly' | 'daily'
    );

    // Process top pages data first for clarity before conditional logic
    const allProcessedTopPages = topPages.map(page => {
      const cleanPath = formatCleanPath(page.path);
      const timeOnPage = page.avg_time_on_page;
      return {
        pageviews: page.pageviews,
        visitors: page.visitors,
        path: cleanPath,
        avg_time_on_page: timeOnPage,
        avg_time_on_page_formatted: formatTime(timeOnPage === null ? null : timeOnPage)
      } as PageData & { avg_time_on_page_formatted: string };
    });
    
    const allProcessedTodayTopPages = todayTopPages.map(page => {
      const cleanPath = formatCleanPath(page.path);
      const timeOnPage = page.avg_time_on_page;
      return {
        pageviews: page.pageviews,
        visitors: page.visitors,
        path: cleanPath,
        avg_time_on_page: timeOnPage,
        avg_time_on_page_formatted: formatTime(timeOnPage === null ? null : timeOnPage)
      } as PageData & { avg_time_on_page_formatted: string };
    });

    // Process referrer data first for clarity before conditional logic
    const allProcessedReferrers = parseReferrers(
      topReferrers as ReferrerData[],
      true, 
      (referrer) => isInternalReferrer(referrer, website.domain),
      website.domain
    );

    // Group referrers by domain and aggregate metrics
    const groupedReferrers = new Map();
    
    for (const ref of allProcessedReferrers) {
      if (ref.referrer === 'direct') continue; // Skip direct traffic
      
      const domain = ref.domain || '';
      if (!domain) continue;
      
      if (groupedReferrers.has(domain)) {
        const existing = groupedReferrers.get(domain);
        existing.visitors += ref.visitors;
        existing.pageviews += ref.pageviews;
      } else {
        groupedReferrers.set(domain, {
          referrer: ref.referrer,
          visitors: ref.visitors,
          pageviews: ref.pageviews,
          type: ref.type,
          name: ref.name,
          domain: ref.domain
        });
      }
    }
    
    // Convert to array, sort by visitors, and take top 5
    const finalTopReferrers = Array.from(groupedReferrers.values())
      .sort((a, b) => b.visitors - a.visitors)
      .slice(0, 5);

    let finalTopPages: Array<PageData & { avg_time_on_page_formatted: string }>;
    if (endDate === todayDateStr) {
        allProcessedTopPages.sort((a, b) => b.pageviews - a.pageviews);
        finalTopPages = allProcessedTopPages.slice(0, params.limit);
    } else {
        const mergedTopPages: Array<PageData & { avg_time_on_page_formatted: string }> = [...allProcessedTopPages];
        for (const todayPage of allProcessedTodayTopPages) {
            const existingPageIndex = mergedTopPages.findIndex(p => p.path === todayPage.path);
            if (existingPageIndex >= 0) {
                mergedTopPages[existingPageIndex].pageviews += todayPage.pageviews;
                mergedTopPages[existingPageIndex].visitors += todayPage.visitors;
            } else {
                mergedTopPages.push(todayPage);
            }
        }
        mergedTopPages.sort((a, b) => b.pageviews - a.pageviews);
        finalTopPages = mergedTopPages.slice(0, params.limit);
    }
    
    return c.json({
      success: true,
      website_id: params.website_id,
      date_range: {
        start_date: startDate,
        end_date: endDate,
        granularity: params.granularity
      },
      summary: {
        pageviews: summary.pageviews,
        visitors: summary.unique_visitors,
        unique_visitors: summary.unique_visitors,
        sessions: summary.sessions,
        bounce_rate: summary.bounce_rate,
        bounce_rate_pct: `${Math.round(summary.bounce_rate * 10) / 10}%`,
        avg_session_duration: Math.round(summary.avg_session_duration),
        avg_session_duration_formatted: formatTime(summary.avg_session_duration)
      },
      events_by_date: updatedEventsByDate.map((day: AnalyticsEntry) => ({
        ...day,
        bounce_rate_pct: `${Math.round(day.bounce_rate * 10) / 10}%`,
        avg_session_duration_formatted: formatTime(day.avg_session_duration || 0)
      })),
      
      // Use our calculated today summary instead of just today's raw data
      today: todaySummary,
      
      top_pages: finalTopPages,
      top_referrers: finalTopReferrers,
      screen_resolutions: resolutions,
      browser_versions: processedBrowserVersions,
      countries: processedCountries,
      device_types: deviceTypes.slice(0, params.limit),
      connection_types: connectionTypes,
      languages: languages,
      timezones: timezones,
      performance: {
        avg_load_time: performance[0]?.avg_load_time !== undefined && performance[0]?.avg_load_time !== null ? Math.round(performance[0].avg_load_time) : null,
        avg_ttfb: performance[0]?.avg_ttfb !== undefined && performance[0]?.avg_ttfb !== null ? Math.round(performance[0].avg_ttfb) : null,
        avg_dom_ready_time: performance[0]?.avg_dom_ready_time !== undefined && performance[0]?.avg_dom_ready_time !== null ? Math.round(performance[0].avg_dom_ready_time) : null,
        avg_render_time: performance[0]?.avg_render_time !== undefined && performance[0]?.avg_render_time !== null ? Math.round(performance[0].avg_render_time) : null,
        avg_fcp: performance[0]?.avg_fcp !== undefined && performance[0]?.avg_fcp !== null ? Math.round(performance[0].avg_fcp) : null,
        avg_lcp: performance[0]?.avg_lcp !== undefined && performance[0]?.avg_lcp !== null ? Math.round(performance[0].avg_lcp) : null,
        avg_cls: performance[0]?.avg_cls !== undefined && performance[0]?.avg_cls !== null ? Math.round((performance[0].avg_cls) * 1000) / 1000 : null,
        avg_load_time_formatted: formatPerformanceMetric(performance[0]?.avg_load_time === null ? null : performance[0]?.avg_load_time || 0),
        avg_ttfb_formatted: formatPerformanceMetric(performance[0]?.avg_ttfb === null ? null : performance[0]?.avg_ttfb || 0),
        avg_dom_ready_time_formatted: formatPerformanceMetric(performance[0]?.avg_dom_ready_time === null ? null : performance[0]?.avg_dom_ready_time || 0),
        avg_render_time_formatted: formatPerformanceMetric(performance[0]?.avg_render_time === null ? null : performance[0]?.avg_render_time || 0),
        avg_fcp_formatted: formatPerformanceMetric(performance[0]?.avg_fcp === null ? null : performance[0]?.avg_fcp || 0),
        avg_lcp_formatted: formatPerformanceMetric(performance[0]?.avg_lcp === null ? null : performance[0]?.avg_lcp || 0),
        avg_cls_formatted: formatPerformanceMetric(performance[0]?.avg_cls === null ? null : performance[0]?.avg_cls || 0, '')
      }
    });
  } catch (error) {
    logger.error('Error retrieving summary analytics data', { 
      error,
      website_id: params.website_id
    });
    
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, 500);
  }
});

/**
 * Check if a referrer URL is from the same website (internal referrer)
 */
function isInternalReferrer(referrerUrl: string, websiteHostname?: string): boolean {
  if (!referrerUrl || referrerUrl === 'direct') {
    return false;
  }
  
  try {
    const url = new URL(referrerUrl);
    
    // Check if it's localhost or contains the same hostname
    if (url.hostname === 'localhost' || 
        url.hostname.includes('127.0.0.1') || 
        (websiteHostname && url.hostname === websiteHostname)) {
      return true;
    }
    
    return false;
  } catch (e) {
    // If URL parsing fails, it's not an internal referrer
    return false;
  }
}

// Helper function to generate a readable session name from a session ID
function generateSessionName(sessionId: string): string {
  if (!sessionId) return 'Unknown Session';
  
  // Use the first 6 characters of the session ID as a base
  const shortId = sessionId.substring(0, 6);
  
  // Create a descriptive name using animal names based on the hash of the ID
  const animals = [
    'Elephant', 'Tiger', 'Dolphin', 'Eagle', 'Penguin', 
    'Wolf', 'Lion', 'Bear', 'Panda', 'Fox', 
    'Owl', 'Koala', 'Whale', 'Hawk', 'Jaguar'
  ];
  
  // Simple hash function to get a consistent animal name for the session ID
  let hashValue = 0;
  for (let i = 0; i < sessionId.length; i++) {
    hashValue = ((hashValue << 5) - hashValue) + sessionId.charCodeAt(i);
    hashValue |= 0; // Convert to 32bit integer
  }
  
  const animalIndex = Math.abs(hashValue) % animals.length;
  const animal = animals[animalIndex];
  
  return `${animal}-${shortId}`;
}

// GET /analytics/sessions - retrieves a list of sessions
analyticsRouter.get('/sessions', zValidator('query', analyticsQuerySchema), async (c) => {
  const params = c.req.valid('query');
  const user = c.get('user');
  
  if (!user) {
    return c.json({ success: false, error: 'Authentication required' }, 401);
  }

  try {
    // Set default date range if not provided
    const endDate = params.end_date || new Date().toISOString().split('T')[0];
    const startDate = params.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const sessionsLimit = params.limit;
    
    // Create sessions builder and execute
    const sessionsBuilder = createSessionsBuilder(params.website_id, startDate, endDate, sessionsLimit);
    const sessionsResult = await chQuery(sessionsBuilder.getSql());
    
    // Track user profiles - get a list of unique visitor IDs
    const visitorIds = [...new Set(sessionsResult.map(session => session.visitor_id))];
    
    // Create a map of visitor IDs to their session counts
    const visitorSessionCounts: Record<string, number> = {};
    for (const session of sessionsResult) { 
      if (session.visitor_id) {
        visitorSessionCounts[session.visitor_id] = (visitorSessionCounts[session.visitor_id] || 0) + 1;
      }
    }
    
    // Format the sessions data
    const formattedSessions = sessionsResult.map(session => {
      // Format the duration as Xh Ym Zs
      const durationInSeconds = session.duration || 0;
      const hours = Math.floor(durationInSeconds / 3600);
      const minutes = Math.floor((durationInSeconds % 3600) / 60);
      const seconds = durationInSeconds % 60;
      
      let durationFormatted = '';
      if (hours > 0) durationFormatted += `${hours}h `;
      if (minutes > 0 || hours > 0) durationFormatted += `${minutes}m `;
      durationFormatted += `${seconds}s`;
      
      // Parse user agent to get device, browser, and OS
      const userAgentInfo = parseUserAgentDetails(session.user_agent || '');
      
      // Parse referrer if present
      const referrerParsed = session.referrer ? parseReferrers(
        [{ referrer: session.referrer, visitors: 0, pageviews: 0 }]
      )[0] : null;
      
      // Generate a session name
      const sessionName = generateSessionName(session.session_id);
      
      // Get the number of sessions for this visitor
      const visitorSessionCount = session.visitor_id ? visitorSessionCounts[session.visitor_id] || 1 : 1;
      
      return {
        ...session,
        session_name: sessionName,
        device: userAgentInfo.device_type,
        browser: userAgentInfo.browser_name,
        os: userAgentInfo.os_name,
        duration_formatted: durationFormatted,
        referrer_parsed: referrerParsed,
        is_returning_visitor: visitorSessionCount > 1,
        visitor_session_count: visitorSessionCount
      };
    });
    
    return c.json({
      success: true,
      sessions: formattedSessions,
      unique_visitors: visitorIds.length,
      date_range: {
        start_date: startDate,
        end_date: endDate
      }
    });
  } catch (error) {
    logger.error('Error retrieving sessions data:', { 
      error,
      website_id: params.website_id
    });
    
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve sessions data.'
    }, 400);
  }
});

// GET /analytics/session/{session_id} - retrieves details for a specific session
analyticsRouter.get('/session/:session_id', zValidator('query', z.object({
  website_id: z.string().min(1, 'Website ID is required')
})), async (c) => {
  const { session_id } = c.req.param();
  const user = c.get('user');
  const website = c.get('website');

  if (!website || !website.id) {
    return c.json({ success: false, error: 'Website not found' }, 404);
  }

  if (!user) {
    return c.json({ success: false, error: 'Authentication required' }, 401);
  }
  
  try {
    // Get the session info first
    const sessionsBuilder = createSessionsBuilder(website.id, '2000-01-01', '2100-01-01', 1);
    sessionsBuilder.sb.where.session_filter = `session_id = '${session_id}'`;
    
    const sessionResult = await chQuery(sessionsBuilder.getSql());
    
    if (!sessionResult.length) {
      return c.json({
        success: false,
        error: 'Session not found'
      }, 404);
    }
    
    const session = sessionResult[0];
    
    // Format the duration
    const durationInSeconds = session.duration || 0;
    const hours = Math.floor(durationInSeconds / 3600);
    const minutes = Math.floor((durationInSeconds % 3600) / 60);
    const seconds = durationInSeconds % 60;
    
    let durationFormatted = '';
    if (hours > 0) durationFormatted += `${hours}h `;
    if (minutes > 0 || hours > 0) durationFormatted += `${minutes}m `;
    durationFormatted += `${seconds}s`;
    
    // Parse user agent to get device, browser, and OS
    const userAgentInfo = parseUserAgentDetails(session.user_agent || '');
    
    // Parse referrer
    const referrerParsed = session.referrer ? parseReferrers(
      [{ referrer: session.referrer, visitors: 0, pageviews: 0 }]
    )[0] : null;
    
    // Get all events for this session
    const eventsBuilder = createSessionEventsBuilder(website.id, session_id);
    const eventsResult = await chQuery(eventsBuilder.getSql());
    
    // Process events to add device, browser, OS info from user_agent
    const processedEvents = eventsResult.map(event => {
      const eventUserAgentInfo = parseUserAgentDetails(event.user_agent || '');
      
      // Create a new object without the user_agent field
      const { user_agent, ...eventWithoutUserAgent } = event;
      
      return {
        ...eventWithoutUserAgent,
        device_type: eventUserAgentInfo.device_type,
        browser: eventUserAgentInfo.browser_name,
        os: eventUserAgentInfo.os_name
      };
    });
    
    // Generate a session name
    const sessionName = generateSessionName(session_id);
    
    // Check if this visitor has other sessions (is a returning visitor)
    const visitorSessionsBuilder = createSqlBuilder();
    visitorSessionsBuilder.sb.select = {
      session_count: 'COUNT(DISTINCT session_id) as session_count'
    };
    visitorSessionsBuilder.sb.from = 'analytics.events';
    visitorSessionsBuilder.sb.where = {
      client_filter: `client_id = '${website.id}'`,
      visitor_filter: `anonymous_id = '${session.visitor_id}'`
    };
    
    const visitorSessionsResult = await chQuery(visitorSessionsBuilder.getSql());
    const visitorSessionCount = visitorSessionsResult[0]?.session_count || 1;
    
    // Format the session with events, but don't include the raw user_agent
    const { user_agent, ...sessionWithoutUserAgent } = session;
    
    const formattedSession = {
      ...sessionWithoutUserAgent,
      session_name: sessionName,
      device: userAgentInfo.device_type,
      browser: userAgentInfo.browser_name,
      os: userAgentInfo.os_name,
      duration_formatted: durationFormatted,
      referrer_parsed: referrerParsed,
      is_returning_visitor: visitorSessionCount > 1,
      visitor_session_count: visitorSessionCount,
      events: processedEvents
    };
    
    return c.json({
      success: true,
      session: formattedSession
    });
  } catch (error) {
    logger.error('Error retrieving session details:', { 
      error,
      website_id: website.id,
      session_id
    });
    
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve session details.'
    }, 400);
  }
});

// GET /analytics/profiles - retrieves visitor profiles with their sessions
analyticsRouter.get('/profiles', zValidator('query', analyticsQuerySchema), async (c) => {
  const params = c.req.valid('query');
  const user = c.get('user');
  
  if (!user) {
    return c.json({ success: false, error: 'Authentication required' }, 401);
  }

  try {
    // Set default date range if not provided
    const endDate = params.end_date || new Date().toISOString().split('T')[0];
    const startDate = params.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const profilesLimit = params.limit;
    
    // First, get all unique visitor IDs
    const visitorIdsBuilder = createSqlBuilder();
    visitorIdsBuilder.sb.select = {
      visitor_id: 'anonymous_id as visitor_id',
      session_count: 'COUNT(DISTINCT session_id) as session_count',
      first_visit: 'MIN(time) as first_visit',
      last_visit: 'MAX(time) as last_visit'
    };
    visitorIdsBuilder.sb.from = 'analytics.events';
    visitorIdsBuilder.sb.where = {
      client_filter: `client_id = '${params.website_id}'`,
      date_filter: `time >= parseDateTimeBestEffort('${startDate}') AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')`
    };
    visitorIdsBuilder.sb.groupBy = {
      visitor_id: 'anonymous_id'
    };
    visitorIdsBuilder.sb.orderBy = {
      session_count: 'session_count DESC',
      last_visit: 'last_visit DESC'
    };
    visitorIdsBuilder.sb.limit = profilesLimit;
    
    const visitorIdsResult = await chQuery(visitorIdsBuilder.getSql());
    
    if (!visitorIdsResult.length) {
      return c.json({
        success: true,
        profiles: [],
        date_range: {
          start_date: startDate,
          end_date: endDate
        },
        total_visitors: 0,
        returning_visitors: 0
      });
    }
    
    // Get all sessions for these visitors
    const sessions = [];
    const profiles = [];
    
    // Get the count of all visitors and returning visitors
    const visitorStatsBuilder = createSqlBuilder();
    visitorStatsBuilder.sb.select = {
      total_visitors: 'COUNT(DISTINCT anonymous_id) as total_visitors',
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
    
    // Process each visitor
    for (const visitor of visitorIdsResult) {
      // Get sessions for this visitor
      const visitorSessionsBuilder = createSqlBuilder();
      visitorSessionsBuilder.sb.select = {
        session_id: 'session_id',
        first_visit: 'MIN(time) as first_visit',
        last_visit: 'MAX(time) as last_visit',
        duration: 'dateDiff(\'second\', MIN(time), MAX(time)) as duration',
        page_views: 'countIf(event_name = \'screen_view\') as page_views',
        user_agent: 'any(user_agent) as user_agent',
        country: 'any(country) as country',
        city: 'any(city) as city',
        referrer: 'any(referrer) as referrer'
      };
      visitorSessionsBuilder.sb.from = 'analytics.events';
      visitorSessionsBuilder.sb.where = {
        client_filter: `client_id = '${params.website_id}'`,
        date_filter: `time >= parseDateTimeBestEffort('${startDate}') AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')`,
        visitor_filter: `anonymous_id = '${visitor.visitor_id}'`
      };
      visitorSessionsBuilder.sb.groupBy = {
        session_id: 'session_id'
      };
      visitorSessionsBuilder.sb.orderBy = {
        first_visit: 'first_visit DESC'
      };
      
      const visitorSessionsResult = await chQuery(visitorSessionsBuilder.getSql());
      
      if (!visitorSessionsResult.length) {
        continue;
      }
      
      // Format the visitor's sessions
      const formattedSessions = visitorSessionsResult.map(session => {
        // Format the duration as Xh Ym Zs
        const durationInSeconds = session.duration || 0;
        const hours = Math.floor(durationInSeconds / 3600);
        const minutes = Math.floor((durationInSeconds % 3600) / 60);
        const seconds = durationInSeconds % 60;
        
        let durationFormatted = '';
        if (hours > 0) durationFormatted += `${hours}h `;
        if (minutes > 0 || hours > 0) durationFormatted += `${minutes}m `;
        durationFormatted += `${seconds}s`;
        
        // Parse user agent
        const userAgentInfo = parseUserAgentDetails(session.user_agent || '');
        
        // Parse referrer if present
        const referrerParsed = session.referrer ? parseReferrers(
          [{ referrer: session.referrer, visitors: 0, pageviews: 0 }]
        )[0] : null;
        
        // Generate a session name
        const sessionName = generateSessionName(session.session_id);
        
        return {
          ...session,
          session_name: sessionName,
          device: userAgentInfo.device_type,
          browser: userAgentInfo.browser_name,
          os: userAgentInfo.os_name,
          duration_formatted: durationFormatted,
          referrer_parsed: referrerParsed,
          visitor_id: visitor.visitor_id,
          is_returning_visitor: visitor.session_count > 1,
          visitor_session_count: visitor.session_count
        };
      }) as Array<typeof visitorSessionsResult[0] & {
        session_name: string;
        device: string;
        browser: string;
        os: string;
        duration_formatted: string;
        referrer_parsed: { type: string; name: string; domain: string; referrer: string; visitors: number; pageviews: number; } | null;
        visitor_id: string;
        is_returning_visitor: boolean;
        visitor_session_count: number;
        duration: number;
        page_views: number;
        country: string;
        city: string;
      }>;
      
      // Add sessions to the overall sessions array
      sessions.push(...formattedSessions);
      
      // Calculate total duration across all sessions
      const totalDuration = formattedSessions.reduce((sum, session) => sum + (session.duration || 0), 0);
      const hours = Math.floor(totalDuration / 3600);
      const minutes = Math.floor((totalDuration % 3600) / 60);
      const seconds = totalDuration % 60;
      
      let totalDurationFormatted = '';
      if (hours > 0) totalDurationFormatted += `${hours}h `;
      if (minutes > 0 || hours > 0) totalDurationFormatted += `${minutes}m `;
      totalDurationFormatted += `${seconds}s`;
      
      // Get the most recent session for device info
      const latestSession = formattedSessions[0];
      
      // Create profile data
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
        country: latestSession?.country || 'Unknown',
        city: latestSession?.city || 'Unknown',
        sessions: formattedSessions
      };
      
      profiles.push(profile);
    }
    
    return c.json({
      success: true,
      profiles,
      date_range: {
        start_date: startDate,
        end_date: endDate
      },
      total_visitors: totalVisitors,
      returning_visitors: returningVisitors
    });
  } catch (error) {
    logger.error('Error retrieving visitor profiles:', { 
      error,
      website_id: params.website_id
    });
    
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve visitor profiles.'
    }, 400);
  }
});

// Define interface for parsed user agent details
interface ParsedUserAgent {
  browser_name: string;
  browser_version: string;
  os_name: string;
  os_version: string;
  device_type: string;
  device_brand: string;
  device_model: string;
}

// Helper function to parse user agent and return structured data
function parseUserAgentDetails(userAgent: string): ParsedUserAgent {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();
  
  return {
    browser_name: result.browser.name || 'Unknown',
    browser_version: result.browser.version || 'Unknown',
    os_name: result.os.name || 'Unknown',
    os_version: result.os.version || 'Unknown',
    device_type: result.device.type || 'desktop', // Default to desktop if not detected
    device_brand: result.device.vendor || 'Unknown',
    device_model: result.device.model || 'Unknown'
  };
}
/**
 * Get mini chart data for website card
 * GET /analytics/mini-chart/:website_id
 */
analyticsRouter.get('/mini-chart/:website_id', async (c) => {
  const websiteId = c.req.param('website_id');
  const user = c.get('user');
  
  if (!user) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  try {
    // Use our builder for the mini chart data
    const miniChartBuilder = createMiniChartBuilder(websiteId);
    
    // Execute query
    const chartData = await chQuery(miniChartBuilder.getSql());
    
    return c.json(createSuccessResponse({
      data: chartData || []
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
analyticsRouter.get('/batch-mini-charts', async (c) => {
  const ids = c.req.query('ids');
  const user = c.get('user');
  
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
    const promises = websiteIds.map(id => {
      const miniChartBuilder = createMiniChartBuilder(id);
      return chQuery(miniChartBuilder.getSql()).then(data => ({ 
        id, 
        data: data || [] 
      }));
    });
    
    const results = await Promise.all(promises);
    
    // Convert results array to an object with website IDs as keys
    const batchData = results.reduce((acc, { id, data }) => {
      acc[id] = data;
      return acc;
    }, {} as Record<string, any>);
    
    return c.json(createSuccessResponse({
      data: batchData
    }));
    
  } catch (error: any) {
    logger.error('Error fetching batch mini chart data:', error);
    return c.json(createErrorResponse({ 
      message: 'Error fetching batch mini chart data',
      error: error.message
    }), 500);
  }
});

export default analyticsRouter; 