/**
 * Analytics Dashboard Data API
 * 
 * Provides endpoints for retrieving aggregated analytics data for website dashboards.
 */

import { Hono } from 'hono';
import { createLogger } from '@databuddy/logger';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { chQuery, createSqlBuilder } from '@databuddy/db';
import { AppVariables } from '../types';
import { authMiddleware } from '../middleware/auth';
import { parseUserAgent } from '../utils/user-agent';
import { format } from 'date-fns';
import { 
  createSummaryBuilder, 
  createTodayBuilder, 
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
  createUTMSourceBuilder,
  createUTMMediumBuilder,
  createUTMCampaignBuilder,
  createCombinedUTMBuilder,
  createErrorTypesBuilder,
  createErrorTimelineBuilder,
  createErrorDetailsBuilder,
  createSessionsBuilder,
  createSessionEventsBuilder,
  parseReferrers
} from '../builders/analytics';

// Define types for data processing
interface ReferrerData {
  referrer: string;
  visitors: number;
  pageviews: number;
}

interface BrowserData {
  browser: string;
  version: string;
  count: number;
  visitors: number;
}

interface PageData {
  path: string;
  pageviews: number;
  visitors: number;
  avg_time_on_page: number | null;
}


// Initialize logger
const logger = createLogger('analytics-api');

// Create router with typed context
const analyticsRouter = new Hono<{ 
  Variables: AppVariables & { 
    user?: { id: string, email: string } | null;
    session?: any;
  }
}>();

// Apply auth middleware to all routes
analyticsRouter.use('*', authMiddleware);

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
 * Format time in seconds to a human-readable format
 * For durations under 60 seconds, returns "Xs"
 * For longer durations, returns "Xm Xs"
 */
function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0s';
  
  seconds = Math.round(seconds);
  if (seconds < 60) return `${seconds}s`;
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  // Update to handle hours for long durations
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
  }
  
  // For consistency, always use the same format with hours, even if hours is 0
  return `0h ${minutes}m ${remainingSeconds}s`;
}

/**
 * Format performance metric to show units and rounded values
 */
function formatPerformanceMetric(value: number, unit: string = 'ms'): string {
  if (!value || isNaN(value)) return `0 ${unit}`;
  
  // Round to nearest integer
  value = Math.round(value);
  
  // For large values, format with commas for readability
  const formattedValue = value.toLocaleString();
  
  return `${formattedValue} ${unit}`;
}

/**
 * Get summary statistics
 * GET /analytics/summary
 */
analyticsRouter.get('/summary', zValidator('query', analyticsQuerySchema), async (c) => {
  const params = c.req.valid('query');
  const user = c.get('user');
  
  if (!user) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  try {
    // Set default date range if not provided (last 30 days)
    const endDate = params.end_date || new Date().toISOString().split('T')[0];
    const startDate = params.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Get today's date for comparison
    const today = new Date().toISOString().split('T')[0];
    
    // Use our builders for all queries
    const summaryBuilder = createSummaryBuilder(params.website_id, startDate, endDate);
    const todayBuilder = createTodayBuilder(params.website_id);
    const topPagesBuilder = createTopPagesBuilder(params.website_id, startDate, endDate, 5);
    const topReferrersBuilder = createTopReferrersBuilder(params.website_id, startDate, endDate, 5);
    const eventsByDateBuilder = createEventsByDateBuilder(
      params.website_id, 
      startDate, 
      endDate, 
      params.granularity as 'hourly' | 'daily'
    );
    const todayPagesBuilder = createTopPagesBuilder(params.website_id, today, today, 5);
    const todayReferrersBuilder = createTopReferrersBuilder(params.website_id, today, today, 5);
    const resolutionsBuilder = createScreenResolutionsBuilder(params.website_id, startDate, endDate, 10);
    const browserVersionsBuilder = createBrowserVersionsBuilder(params.website_id, startDate, endDate, 10);
    const countriesBuilder = createCountriesBuilder(params.website_id, startDate, endDate, 5);
    const deviceTypesBuilder = createDeviceTypesBuilder(params.website_id, startDate, endDate, 5);
    const connectionTypesBuilder = createConnectionTypesBuilder(params.website_id, startDate, endDate, 5);
    const languagesBuilder = createLanguagesBuilder(params.website_id, startDate, endDate, 5);
    const timezonesBuilder = createTimezonesBuilder(params.website_id, startDate, endDate, 5);
    const performanceBuilder = createPerformanceBuilder(params.website_id, startDate, endDate);

    // Execute all queries
    const [
      summaryData, 
      todayData, 
      topPages, 
      topReferrers, 
      eventsByDate, 
      todayTopPages, 
      todayTopReferrers,
      resolutions,
      browserVersions,
      countries,
      deviceTypeResults,
      connectionTypes,
      languages,
      timezones,
      performance
    ] = await Promise.all([
      chQuery(summaryBuilder.getSql()),
      chQuery(todayBuilder.getSql()),
      chQuery(topPagesBuilder.getSql()),
      chQuery(topReferrersBuilder.getSql()),
      chQuery(eventsByDateBuilder.getSql()),
      chQuery(todayPagesBuilder.getSql()),
      chQuery(todayReferrersBuilder.getSql()),
      chQuery(resolutionsBuilder.getSql()),
      chQuery(browserVersionsBuilder.getSql()),
      chQuery(countriesBuilder.getSql()),
      chQuery(deviceTypesBuilder.getSql()),
      chQuery(connectionTypesBuilder.getSql()),
      chQuery(languagesBuilder.getSql()),
      chQuery(timezonesBuilder.getSql()),
      chQuery(performanceBuilder.getSql())
    ]);
    
    // Transform browser data to include browser and version
    const processedBrowserVersions = browserVersions.map(item => {
      const userAgentInfo = parseUserAgent(item.user_agent);
      const version = extractBrowserVersion(item.user_agent) || 'Unknown';
      
      return {
        browser: userAgentInfo.browser || 'Unknown',
        version: version,
        count: item.count,
        visitors: item.visitors
      };
    });
    
    // Process referrer data to extract domain and source info
    // Filter out internal referrers
    const processedReferrers = parseReferrers(
      topReferrers as ReferrerData[],
      true, // Filter internal referrers
      (referrer) => isInternalReferrer(referrer)
    );
    const processedTodayReferrers = parseReferrers(
      todayTopReferrers as ReferrerData[],
      true, // Filter internal referrers
      (referrer) => isInternalReferrer(referrer)
    );
    
    // Process device types
    const deviceTypes = deviceTypeResults.map(item => {
      const userAgentInfo = parseUserAgent(item.user_agent);
      return {
        device_type: userAgentInfo.device || 'Unknown',
        visitors: item.visitors,
        pageviews: item.pageviews
      };
    }).reduce((acc, current) => {
      const existing = acc.find(item => item.device_type === current.device_type);
      if (existing) {
        existing.visitors += current.visitors;
        existing.pageviews += current.pageviews;
      } else {
        acc.push(current);
      }
      return acc;
    }, [] as Array<{device_type: string, visitors: number, pageviews: number}>);
    
    // Sort device types by visitors
    deviceTypes.sort((a, b) => b.visitors - a.visitors);
    
    // Process countries to replace empty values with "Unknown"
    const processedCountries = countries.map(country => ({
      ...country,
      country: country.country?.trim() ? country.country : 'Unknown'
    }));
    
    // Process top pages to normalize paths
    const processedTopPages = topPages.map(page => {
      let cleanPath = page.path;
      
      // Remove protocol and hostname if present
      try {
        if (page.path?.startsWith('http')) {
          const url = new URL(page.path);
          cleanPath = url.pathname + url.search + url.hash;
        }
      } catch (e) {
        // If URL parsing fails, keep the original path
      }
      
      const timeOnPage = page.avg_time_on_page || 0;
      
      return {
        pageviews: page.pageviews,
        visitors: page.visitors,
        path: cleanPath,
        avg_time_on_page: timeOnPage,
        avg_time_on_page_formatted: formatTime(timeOnPage)
      } as PageData & { avg_time_on_page_formatted: string };
    });
    
    // Process today's top pages
    const processedTodayTopPages = todayTopPages.map(page => {
      let cleanPath = page.path;
      
      // Remove protocol and hostname if present
      try {
        if (page.path?.startsWith('http')) {
          const url = new URL(page.path);
          cleanPath = url.pathname + url.search + url.hash;
        }
      } catch (e) {
        // If URL parsing fails, keep the original path
      }
      
      const timeOnPage = page.avg_time_on_page || 0;
      
      return {
        pageviews: page.pageviews,
        visitors: page.visitors,
        path: cleanPath,
        avg_time_on_page: timeOnPage,
        avg_time_on_page_formatted: formatTime(timeOnPage)
      } as PageData & { avg_time_on_page_formatted: string };
    });
    
    // Merge today's data with historical data
    const summary = {
      pageviews: (summaryData[0]?.pageviews || 0) + (todayData[0]?.pageviews || 0),
      unique_visitors: (summaryData[0]?.unique_visitors || 0) + (todayData[0]?.visitors || 0),
      visitors: (summaryData[0]?.unique_visitors || 0) + (todayData[0]?.visitors || 0),
      sessions: (summaryData[0]?.sessions || 0) + (todayData[0]?.sessions || 0),
      bounce_rate: summaryData[0]?.bounce_rate || 0,
      avg_session_duration: summaryData[0]?.avg_session_duration || 0
    };
    
    // Add today to events_by_date if it's within the date range
    if (today >= startDate && today <= endDate) {
      // Only add today's summary data when using daily granularity
      if (params.granularity === 'daily') {
        const todayStats = {
          date: today,
          pageviews: todayData[0]?.pageviews || 0,
          unique_visitors: todayData[0]?.visitors || 0,
          sessions: todayData[0]?.sessions || 0,
          bounce_rate: 0, // We don't have this for raw events
          avg_session_duration: 0 // We don't have this for raw events
        };
        
        // Check if today exists in eventsByDate
        const todayExists = eventsByDate.some(day => day.date === today);
        
        if (todayExists) {
          // Update today's data to include real-time data
          const todayIndex = eventsByDate.findIndex(day => day.date === today);
          if (todayIndex >= 0) {
            eventsByDate[todayIndex].pageviews += todayData[0]?.pageviews || 0;
            eventsByDate[todayIndex].unique_visitors += todayData[0]?.visitors || 0;
            eventsByDate[todayIndex].sessions += todayData[0]?.sessions || 0;
          }
        } else {
          // Add today if it doesn't exist
          eventsByDate.push(todayStats);
          // Sort by date
          eventsByDate.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        }
      } else if (params.granularity === 'hourly') {
        // For hourly granularity, distribute today's data to the current hour
        const now = new Date();
        const currentHourFormatted = format(now, 'yyyy-MM-dd HH:00:00');
        
        // Check if current hour exists in eventsByDate
        const currentHourIndex = eventsByDate.findIndex(hour => hour.date === currentHourFormatted);
        
        if (currentHourIndex >= 0) {
          // Update current hour's data to include real-time data
          eventsByDate[currentHourIndex].pageviews += todayData[0]?.pageviews || 0;
          eventsByDate[currentHourIndex].unique_visitors += todayData[0]?.visitors || 0;
          eventsByDate[currentHourIndex].sessions += todayData[0]?.sessions || 0;
        }
        // If current hour doesn't exist in the data, we don't add it
        // as it might be outside the 48-hour limit applied in the hourly query
      }
    }
    
    // Merge top pages data
    const mergedTopPages = [...processedTopPages];
    
    // Add today's top pages that aren't already in the list
    processedTodayTopPages.forEach(todayPage => {
      const existingPageIndex = mergedTopPages.findIndex(p => p.path === todayPage.path);
      
      if (existingPageIndex >= 0) {
        // Update existing page with today's data
        mergedTopPages[existingPageIndex].pageviews += todayPage.pageviews;
        mergedTopPages[existingPageIndex].visitors += todayPage.visitors;
      } else {
        // Add new page from today
        mergedTopPages.push(todayPage);
      }
    });
    
    // Sort and limit to top 5
    mergedTopPages.sort((a, b) => b.pageviews - a.pageviews);
    const finalTopPages = mergedTopPages.slice(0, 5);
    
    // Merge top referrers data
    const mergedTopReferrers = [...processedReferrers];
    
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
        visitors: summary.visitors,
        unique_visitors: summary.unique_visitors,
        sessions: summary.sessions,
        bounce_rate: summary.bounce_rate,
        bounce_rate_pct: `${Math.round(summary.bounce_rate * 10) / 10}%`,
        avg_session_duration: Math.round(summary.avg_session_duration),
        avg_session_duration_formatted: formatTime(summary.avg_session_duration)
      },
      today: {
        pageviews: todayData[0]?.pageviews || 0,
        visitors: todayData[0]?.visitors || 0,
        sessions: todayData[0]?.sessions || 0
      },
      events_by_date: eventsByDate.map(day => ({
        ...day,
        bounce_rate_pct: `${Math.round(day.bounce_rate * 10) / 10}%`,
        avg_session_duration_formatted: formatTime(day.avg_session_duration)
      })),
      top_pages: finalTopPages,
      top_referrers: processedReferrers.slice(0, 5),
      screen_resolutions: resolutions,
      browser_versions: processedBrowserVersions,
      countries: processedCountries,
      device_types: deviceTypes.slice(0, 5),
      connection_types: connectionTypes,
      languages: languages,
      timezones: timezones,
      performance: {
        avg_load_time: Math.round(performance[0]?.avg_load_time || 0),
        avg_ttfb: Math.round(performance[0]?.avg_ttfb || 0),
        avg_dom_ready_time: Math.round(performance[0]?.avg_dom_ready_time || 0),
        avg_render_time: Math.round(performance[0]?.avg_render_time || 0),
        avg_fcp: Math.round(performance[0]?.avg_fcp || 0),
        avg_lcp: Math.round(performance[0]?.avg_lcp || 0),
        avg_cls: Math.round((performance[0]?.avg_cls || 0) * 1000) / 1000,
        avg_load_time_formatted: formatPerformanceMetric(performance[0]?.avg_load_time),
        avg_ttfb_formatted: formatPerformanceMetric(performance[0]?.avg_ttfb),
        avg_dom_ready_time_formatted: formatPerformanceMetric(performance[0]?.avg_dom_ready_time),
        avg_render_time_formatted: formatPerformanceMetric(performance[0]?.avg_render_time),
        avg_fcp_formatted: formatPerformanceMetric(performance[0]?.avg_fcp),
        avg_lcp_formatted: formatPerformanceMetric(performance[0]?.avg_lcp),
        avg_cls_formatted: formatPerformanceMetric(performance[0]?.avg_cls || 0, '')
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
 * Get visitor trends over time
 * GET /analytics/trends
 */
analyticsRouter.get('/trends', zValidator('query', analyticsQuerySchema), async (c) => {
  const params = c.req.valid('query');
  const user = c.get('user');
  
  if (!user) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  try {
    const endDate = params.end_date || new Date().toISOString().split('T')[0];
    const startDate = params.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Use EventsByDateBuilder to get consistent results across endpoints
    const eventsByDateBuilder = createEventsByDateBuilder(
      params.website_id, 
      startDate, 
      endDate, 
      params.granularity as 'hourly' | 'daily'
    );
    
    // Execute the query
    const eventsByDate = await chQuery(eventsByDateBuilder.getSql());
    
    // Format the data for better readability
    const formattedTrends = eventsByDate.map(entry => ({
      date: entry.date,
      pageviews: entry.pageviews || 0,
      visitors: entry.unique_visitors || 0,
      sessions: entry.sessions || 0,
      bounce_rate: Math.round((entry.bounce_rate || 0) * 10) / 10,
      bounce_rate_pct: `${Math.round((entry.bounce_rate || 0) * 10) / 10}%`,
      avg_session_duration: Math.round(entry.avg_session_duration || 0),
      avg_session_duration_formatted: formatTime(entry.avg_session_duration || 0)
    }));
    
    return c.json({
      success: true,
      website_id: params.website_id,
      date_range: {
        start_date: startDate,
        end_date: endDate,
        granularity: params.granularity
      },
      interval: params.granularity === 'hourly' ? 'hour' : 'day',
      data: formattedTrends
    });
  } catch (error) {
    logger.error('Error retrieving trends analytics data', { 
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
 * Get chart data for main metrics
 * GET /analytics/chart
 */
analyticsRouter.get('/chart', zValidator('query', analyticsQuerySchema), async (c) => {
  const params = c.req.valid('query');
  const user = c.get('user');
  
  if (!user) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  try {
    const endDate = params.end_date || new Date().toISOString().split('T')[0];
    const startDate = params.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Calculate number of days in the selected period
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const daysDiff = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24));
    
    // Define interval based on parameter and date range
    let intervalFunc = "toDate(time)";
    let intervalName = "date";
    
    // Automatically adjust interval based on date range
    if (params.interval === 'auto') {
      if (daysDiff > 90) {
        intervalFunc = "toStartOfMonth(time)";
        intervalName = "month";
      } else if (daysDiff > 30) {
        intervalFunc = "toStartOfWeek(time)";
        intervalName = "week";
      }
    } else if (params.interval === 'week') {
      intervalFunc = "toStartOfWeek(time)";
      intervalName = "week";
    } else if (params.interval === 'month') {
      intervalFunc = "toStartOfMonth(time)";
      intervalName = "month";
    }
    
    // Create SQL builder for metrics directly from events table
    const metricsBuilder = createSqlBuilder('events');
    
    metricsBuilder.sb.select = {
      interval_field: `${intervalFunc} as ${intervalName}`,
      pageviews: "COUNT(CASE WHEN event_name = 'screen_view' THEN 1 END) as pageviews",
      visitors: 'COUNT(DISTINCT anonymous_id) as visitors',
      sessions: 'COUNT(DISTINCT session_id) as sessions',
      bounce_rate: 'AVG(is_bounce) * 100 as bounce_rate',
      avg_session_duration: 'AVG(CASE WHEN event_name = \'screen_view\' THEN time_on_page ELSE 0 END) as avg_session_duration'
    };
    
    metricsBuilder.sb.where = {
      client_filter: `client_id = '${params.website_id}'`,
      date_filter: `time >= parseDateTimeBestEffort('${startDate}') AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')`
    };
    
    metricsBuilder.sb.groupBy = {
      interval_group: intervalFunc
    };
    
    metricsBuilder.sb.orderBy = {
      interval_order: `${intervalName} ASC`
    };
    
    // Create SQL builder for hourly distribution
    const hourlyBuilder = createSqlBuilder('events');
    
    hourlyBuilder.sb.select = {
      hour: 'toHour(time) as hour',
      events: 'COUNT(*) as events',
      visitors: 'COUNT(DISTINCT anonymous_id) as visitors'
    };
    
    hourlyBuilder.sb.where = {
      client_filter: `client_id = '${params.website_id}'`,
      date_filter: `time >= parseDateTimeBestEffort('${startDate}') AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')`,
      event_filter: "event_name = 'screen_view'"
    };
    
    hourlyBuilder.sb.groupBy = {
      hour: 'hour'
    };
    
    hourlyBuilder.sb.orderBy = {
      hour: 'hour ASC'
    };
    
    const metrics = await chQuery(metricsBuilder.getSql());
    const hourlyDistribution = await chQuery(hourlyBuilder.getSql());
    
    // Format the metrics data
    const formattedMetrics = metrics.map(entry => ({
      date: entry[intervalName],
      pageviews: entry.pageviews || 0,
      visitors: entry.visitors || 0,
      sessions: entry.sessions || 0,
      bounce_rate: Math.round((entry.bounce_rate || 0) * 10) / 10,
      bounce_rate_pct: `${Math.round((entry.bounce_rate || 0) * 10) / 10}%`,
      avg_session_duration: Math.round(entry.avg_session_duration || 0),
      avg_session_duration_formatted: formatTime(entry.avg_session_duration || 0)
    }));
    
    return c.json({
      success: true,
      website_id: params.website_id,
      date_range: {
        start_date: startDate,
        end_date: endDate
      },
      interval: intervalName,
      metrics: formattedMetrics,
      hourly_distribution: hourlyDistribution,
      total_days: daysDiff
    });
  } catch (error) {
    logger.error('Error retrieving chart analytics data', { 
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
 * Get top pages
 * GET /analytics/pages
 */
analyticsRouter.get('/pages', zValidator('query', analyticsQuerySchema), async (c) => {
  const params = c.req.valid('query');
  const user = c.get('user');
  
  if (!user) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  try {
    const endDate = params.end_date || new Date().toISOString().split('T')[0];
    const startDate = params.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Create SQL builder for pages directly from events table
    const pagesBuilder = createSqlBuilder('events');
    
    pagesBuilder.sb.select = {
      path: 'path',
      pageviews: 'COUNT(*) as pageviews',
      visitors: 'COUNT(DISTINCT anonymous_id) as visitors',
      avg_time_on_page: 'AVG(CASE WHEN time_on_page > 0 THEN time_on_page ELSE NULL END) as avg_time_on_page'
    };
    
    pagesBuilder.sb.where = {
      client_filter: `client_id = '${params.website_id}'`,
      date_filter: `time >= parseDateTimeBestEffort('${startDate}') AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')`,
      event_filter: "event_name = 'screen_view'"
    };
    
    pagesBuilder.sb.groupBy = {
      path: 'path'
    };
    
    pagesBuilder.sb.orderBy = {
      pageviews: 'pageviews DESC'
    };
    
    pagesBuilder.sb.limit = params.limit;
    
    const pages = await chQuery(pagesBuilder.getSql());
    
    // Process pages to strip URL protocol and hostname if present
    const processedPages = pages.map(page => {
      let cleanPath = page.path;
      
      // Remove protocol and hostname if present (handles both http:// and https://)
      try {
        if (page.path?.startsWith('http')) {
          const url = new URL(page.path);
          cleanPath = url.pathname + url.search + url.hash;
        }
      } catch (e) {
        // If URL parsing fails, keep the original path
      }
      
      const timeOnPage = page.avg_time_on_page || 0;
      
      return {
        ...page,
        path: cleanPath,
        avg_time_on_page: timeOnPage,
        avg_time_on_page_formatted: formatTime(timeOnPage)
      };
    });
    
    return c.json({
      success: true,
      website_id: params.website_id,
      date_range: {
        start_date: startDate,
        end_date: endDate
      },
      data: processedPages
    });
  } catch (error) {
    logger.error('Error retrieving pages analytics data', { 
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
 * Get referrer sources
 * GET /analytics/referrers
 */
analyticsRouter.get('/referrers', zValidator('query', analyticsQuerySchema), async (c) => {
  const params = c.req.valid('query');
  const user = c.get('user');
  
  if (!user) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  try {
    const endDate = params.end_date || new Date().toISOString().split('T')[0];
    const startDate = params.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Create SQL builder for referrers
    const referrersBuilder = createTopReferrersBuilder(params.website_id, startDate, endDate, params.limit);
    
    const referrers = await chQuery(referrersBuilder.getSql());
    
    // Parse referrer data using our utility function and filter out internal referrers
    const parsedReferrers = parseReferrers(
      referrers as ReferrerData[],
      true, // Filter internal referrers
      (referrer) => isInternalReferrer(referrer)
    );
    
    return c.json({
      success: true,
      website_id: params.website_id,
      date_range: {
        start_date: startDate,
        end_date: endDate
      },
      data: parsedReferrers
    });
  } catch (error) {
    logger.error('Error retrieving referrer analytics data', { 
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
 * Get location information
 * GET /analytics/locations
 */
analyticsRouter.get('/locations', zValidator('query', analyticsQuerySchema), async (c) => {
  const params = c.req.valid('query');
  const user = c.get('user');
  
  if (!user) {
    return c.json({ error: 'Authentication required' }, 401);
  }

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
    
    countryBuilder.sb.limit = params.limit;
    
    // Create SQL builder for city data - directly from events table
    const cityBuilder = createSqlBuilder('events');
    
    cityBuilder.sb.select = {
      country: 'COALESCE(country, \'Unknown\') as country',
      region: 'COALESCE(region, \'Unknown\') as region',
      city: 'COALESCE(city, \'Unknown\') as city',
      visitors: 'COUNT(DISTINCT anonymous_id) as visitors',
      pageviews: 'COUNT(*) as pageviews'
    };
    
    cityBuilder.sb.where = {
      client_filter: `client_id = '${params.website_id}'`,
      date_filter: `time >= parseDateTimeBestEffort('${startDate}') AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')`,
      city_filter: `city != ''`,
      event_filter: "event_name = 'screen_view'"
    };
    
    cityBuilder.sb.groupBy = {
      country: 'country',
      region: 'region',
      city: 'city'
    };
    
    cityBuilder.sb.orderBy = {
      visitors: 'visitors DESC'
    };
    
    cityBuilder.sb.limit = params.limit;
    
    const countries = await chQuery(countryBuilder.getSql());
    const cities = await chQuery(cityBuilder.getSql());
    
    return c.json({
      success: true,
      website_id: params.website_id,
      date_range: {
        start_date: startDate,
        end_date: endDate
      },
      countries,
      cities
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

/**
 * Get UTM campaign data
 * GET /analytics/campaigns
 */
analyticsRouter.get('/campaigns', zValidator('query', analyticsQuerySchema), async (c) => {
  const params = c.req.valid('query');
  const user = c.get('user');
  
  if (!user) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  try {
    const endDate = params.end_date || new Date().toISOString().split('T')[0];
    const startDate = params.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Use our builders for UTM data
    const sourceBuilder = createUTMSourceBuilder(params.website_id, startDate, endDate, params.limit);
    const mediumBuilder = createUTMMediumBuilder(params.website_id, startDate, endDate, params.limit);
    const campaignBuilder = createUTMCampaignBuilder(params.website_id, startDate, endDate, params.limit);
    const combinedBuilder = createCombinedUTMBuilder(params.website_id, startDate, endDate, params.limit);
    
    // Helper function to validate and transform query results
    const validateResults = (results: any[] = []) => {
      return results.map(item => ({
        ...item,
        visits: item.visits || 0,
        visitors: item.visitors || 0
      }));
    };
    
    const sources = await chQuery(sourceBuilder.getSql());
    const mediums = await chQuery(mediumBuilder.getSql());
    const campaigns = await chQuery(campaignBuilder.getSql());
    const combined = await chQuery(combinedBuilder.getSql());
    
    return c.json({
      success: true,
      website_id: params.website_id,
      date_range: {
        start_date: startDate,
        end_date: endDate
      },
      sources: validateResults(sources),
      mediums: validateResults(mediums),
      campaigns: validateResults(campaigns),
      combined: validateResults(combined)
    });
  } catch (error) {
    logger.error('Error retrieving campaign analytics data', { 
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
 * Get custom events data
 * GET /analytics/events
 */
analyticsRouter.get('/events', zValidator('query', analyticsQuerySchema), async (c) => {
  const params = c.req.valid('query');
  const user = c.get('user');
  
  if (!user) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  try {
    const endDate = params.end_date || new Date().toISOString().split('T')[0];
    const startDate = params.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Create SQL builder for event types
    const eventTypesBuilder = createSqlBuilder('events');
    
    eventTypesBuilder.sb.select = {
      event_type: 'event_name as event_type',
      count: 'COUNT(*) as count',
      unique_users: 'COUNT(DISTINCT anonymous_id) as unique_users'
    };
    
    eventTypesBuilder.sb.where = {
      client_filter: `client_id = '${params.website_id}'`,
      date_filter: `time >= parseDateTimeBestEffort('${startDate}') AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')`,
      event_filter: `event_name NOT IN ('pageview', 'screen_view')`
    };
    
    eventTypesBuilder.sb.groupBy = {
      event_name: 'event_name'
    };
    
    eventTypesBuilder.sb.orderBy = {
      count: 'count DESC'
    };
    
    eventTypesBuilder.sb.limit = params.limit;
    
    // Set up interval for events over time
    let intervalFunc = "toDate(time)";
    let intervalName = "date";
    
    if (params.interval === 'week') {
      intervalFunc = "toStartOfWeek(time)";
      intervalName = "week";
    } else if (params.interval === 'month') {
      intervalFunc = "toStartOfMonth(time)";
      intervalName = "month";
    } else if (params.interval === 'auto') {
      // Calculate date range
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      const daysDiff = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff > 90) {
        intervalFunc = "toStartOfMonth(time)";
        intervalName = "month";
      } else if (daysDiff > 30) {
        intervalFunc = "toStartOfWeek(time)";
        intervalName = "week";
      }
    }
    
    // Create SQL builder for events over time
    const eventsTimeBuilder = createSqlBuilder('events');
    
    eventsTimeBuilder.sb.select = {
      interval: `${intervalFunc} as ${intervalName}`,
      event_type: 'event_name as event_type',
      count: 'COUNT(*) as count'
    };
    
    eventsTimeBuilder.sb.where = {
      client_filter: `client_id = '${params.website_id}'`,
      date_filter: `time >= parseDateTimeBestEffort('${startDate}') AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')`,
      event_filter: `event_name NOT IN ('pageview', 'screen_view')`
    };
    
    eventsTimeBuilder.sb.groupBy = {
      interval: intervalFunc,
      event_name: 'event_name'
    };
    
    eventsTimeBuilder.sb.orderBy = {
      interval: `${intervalName} ASC`,
      count: 'count DESC'
    };
    
    eventsTimeBuilder.sb.limit = 1000;
    
    const eventTypes = await chQuery(eventTypesBuilder.getSql());
    const eventsOverTime = await chQuery(eventsTimeBuilder.getSql());
    
    // Process events over time to create a time series format
    interface TimeSeriesPoint {
      [key: string]: string | number;
    }
    
    const timeSeriesData: Record<string, TimeSeriesPoint> = {};
    
    eventsOverTime.forEach(event => {
      const date = event[intervalName] as string;
      const eventType = event.event_type as string;
      const count = event.count as number;
      
      if (!timeSeriesData[date]) {
        timeSeriesData[date] = { [intervalName]: date };
      }
      
      timeSeriesData[date][eventType] = count;
    });
    
    const timeSeriesArray = Object.values(timeSeriesData);
    
    return c.json({
      success: true,
      website_id: params.website_id,
      date_range: {
        start_date: startDate,
        end_date: endDate
      },
      event_types: eventTypes,
      events_over_time: timeSeriesArray
    });
  } catch (error) {
    logger.error('Error retrieving events analytics data', { 
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
 * Get error analytics data
 * GET /analytics/errors
 */
analyticsRouter.get('/errors', zValidator('query', analyticsQuerySchema), async (c) => {
  const params = c.req.valid('query');
  const user = c.get('user');
  
  if (!user) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  try {
    const endDate = params.end_date || new Date().toISOString().split('T')[0];
    const startDate = params.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Use our builders for error analytics
    const errorTypesBuilder = createErrorTypesBuilder(params.website_id, startDate, endDate, params.limit);
    const errorsTimeBuilder = createErrorTimelineBuilder(params.website_id, startDate, endDate);
    const errorDetailsBuilder = createErrorDetailsBuilder(params.website_id, startDate, endDate, 100);
    
    const errorTypes = await chQuery(errorTypesBuilder.getSql());
    const errorsOverTime = await chQuery(errorsTimeBuilder.getSql());
    const errorDetails = await chQuery(errorDetailsBuilder.getSql());
    
    // Process errors over time to create a time series format
    interface TimeSeriesPoint {
      [key: string]: string | number;
    }
    
    const timeSeriesData: Record<string, TimeSeriesPoint> = {};
    
    errorsOverTime.forEach(error => {
      const date = error.date as string;
      const errorType = error.error_type as string;
      const count = error.count as number;
      
      if (!timeSeriesData[date]) {
        timeSeriesData[date] = { date };
      }
      
      timeSeriesData[date][errorType] = count;
    });
    
    const timeSeriesArray = Object.values(timeSeriesData);
    
    // Process error details to include browser, OS, and device information
    const processedErrorDetails = errorDetails.map(error => {
      const userAgentInfo = parseUserAgent(error.user_agent);
      
      return {
        ...error,
        browser: userAgentInfo.browser || 'Unknown',
        os: userAgentInfo.os || 'Unknown',
        device_type: userAgentInfo.device || 'Unknown'
      };
    });
    
    return c.json({
      success: true,
      website_id: params.website_id,
      date_range: {
        start_date: startDate,
        end_date: endDate
      },
      error_types: errorTypes,
      errors_over_time: timeSeriesArray,
      recent_errors: processedErrorDetails
    });
  } catch (error) {
    logger.error('Error retrieving error analytics data', { 
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
 * Get device information
 * GET /analytics/devices
 */
analyticsRouter.get('/devices', zValidator('query', analyticsQuerySchema), async (c) => {
  const params = c.req.valid('query');
  const user = c.get('user');
  
  if (!user) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  try {
    const endDate = params.end_date || new Date().toISOString().split('T')[0];
    const startDate = params.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Create SQL builder for browser data - directly from events table
    const browsersBuilder = createSqlBuilder('events');
    
    browsersBuilder.sb.select = {
      browser: 'user_agent',
      visitors: 'COUNT(DISTINCT anonymous_id) as visitors',
      pageviews: 'COUNT(*) as pageviews'
    };
    
    browsersBuilder.sb.where = {
      client_filter: `client_id = '${params.website_id}'`,
      date_filter: `time >= parseDateTimeBestEffort('${startDate}') AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')`,
      event_filter: "event_name = 'screen_view'"
    };
    
    browsersBuilder.sb.groupBy = {
      browser: 'user_agent'
    };
    
    browsersBuilder.sb.orderBy = {
      visitors: 'visitors DESC'
    };
    
    browsersBuilder.sb.limit = params.limit;
    
    // Create SQL builder for device type data - directly from events table
    const deviceTypeBuilder = createDeviceTypesBuilder(params.website_id, startDate, endDate, params.limit);
    
    const browserResults = await chQuery(browsersBuilder.getSql());
    const deviceTypeResults = await chQuery(deviceTypeBuilder.getSql());
    
    // Process browser data to extract browser and OS information
    const browsers: Array<{browser: string, visitors: number, pageviews: number}> = [];
    const os: Array<{os: string, visitors: number, pageviews: number}> = [];
    
    browserResults.forEach(item => {
      const userAgentInfo = parseUserAgent(item.browser);
      
      // Add browser data
      const browserName = userAgentInfo.browser || 'Unknown';
      const existingBrowser = browsers.find(b => b.browser === browserName);
      
      if (existingBrowser) {
        existingBrowser.visitors += item.visitors;
        existingBrowser.pageviews += item.pageviews;
      } else {
        browsers.push({
          browser: browserName,
          visitors: item.visitors,
          pageviews: item.pageviews
        });
      }
      
      // Add OS data
      const osName = userAgentInfo.os || 'Unknown';
      const existingOS = os.find(o => o.os === osName);
      
      if (existingOS) {
        existingOS.visitors += item.visitors;
        existingOS.pageviews += item.pageviews;
      } else {
        os.push({
          os: osName,
          visitors: item.visitors,
          pageviews: item.pageviews
        });
      }
    });
    
    // Process device type data
    const deviceTypes: Array<{device_type: string, visitors: number, pageviews: number}> = [];
    
    deviceTypeResults.forEach(item => {
      const userAgentInfo = parseUserAgent(item.user_agent);
      const deviceType = userAgentInfo.device || 'Unknown';
      
      const existingDevice = deviceTypes.find(d => d.device_type === deviceType);
      
      if (existingDevice) {
        existingDevice.visitors += item.visitors;
        existingDevice.pageviews += item.pageviews;
      } else {
        deviceTypes.push({
          device_type: deviceType,
          visitors: item.visitors,
          pageviews: item.pageviews
        });
      }
    });
    
    // Process browser data to extract browser version from user_agent
    const browser_versions = browserResults.map(browser => {
      const userAgentInfo = parseUserAgent(browser.browser);
      const version = extractBrowserVersion(browser.browser) || 'Unknown';
      
      return {
        browser: userAgentInfo.browser || 'Unknown',
        version: version,
        visitors: browser.visitors,
        pageviews: browser.pageviews
      };
    }).reduce((acc, current) => {
      // Combine entries with the same browser+version
      const key = `${current.browser}-${current.version}`;
      const existing = acc.find(item => 
        item.browser === current.browser && 
        item.version === current.version
      );
      
      if (existing) {
        existing.visitors += current.visitors;
        existing.pageviews += current.pageviews;
      } else {
        acc.push(current);
      }
      
      return acc;
    }, [] as Array<{
      browser: string;
      version: string;
      visitors: number;
      pageviews: number;
    }>);
    
    // Sort by visitors
    browsers.sort((a, b) => b.visitors - a.visitors);
    os.sort((a, b) => b.visitors - a.visitors);
    deviceTypes.sort((a, b) => b.visitors - a.visitors);
    browser_versions.sort((a, b) => b.visitors - a.visitors);
    
    return c.json({
      success: true,
      website_id: params.website_id,
      date_range: {
        start_date: startDate,
        end_date: endDate
      },
      browsers: browsers.slice(0, params.limit),
      browser_versions: browser_versions.slice(0, params.limit),
      os: os.slice(0, params.limit),
      device_types: deviceTypes.slice(0, params.limit)
    });
  } catch (error) {
    logger.error('Error retrieving device analytics data', { 
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
 * Get connection type information
 * GET /analytics/connections
 */
analyticsRouter.get('/connections', zValidator('query', analyticsQuerySchema), async (c) => {
  const params = c.req.valid('query');
  const user = c.get('user');
  
  if (!user) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  try {
    const endDate = params.end_date || new Date().toISOString().split('T')[0];
    const startDate = params.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Use the predefined builder for connection type data
    const connectionBuilder = createConnectionTypesBuilder(params.website_id, startDate, endDate, params.limit);
    const connections = await chQuery(connectionBuilder.getSql());
    
    return c.json({
      success: true,
      website_id: params.website_id,
      date_range: {
        start_date: startDate,
        end_date: endDate
      },
      connections
    });
  } catch (error) {
    logger.error('Error retrieving connection analytics data', { 
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
 * Get language information
 * GET /analytics/languages
 */
analyticsRouter.get('/languages', zValidator('query', analyticsQuerySchema), async (c) => {
  const params = c.req.valid('query');
  const user = c.get('user');
  
  if (!user) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  try {
    const endDate = params.end_date || new Date().toISOString().split('T')[0];
    const startDate = params.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Use the predefined builder for language data
    const languageBuilder = createLanguagesBuilder(params.website_id, startDate, endDate, params.limit);
    const languages = await chQuery(languageBuilder.getSql());
    
    return c.json({
      success: true,
      website_id: params.website_id,
      date_range: {
        start_date: startDate,
        end_date: endDate
      },
      languages
    });
  } catch (error) {
    logger.error('Error retrieving language analytics data', { 
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
 * Get timezone information
 * GET /analytics/timezones
 */
analyticsRouter.get('/timezones', zValidator('query', analyticsQuerySchema), async (c) => {
  const params = c.req.valid('query');
  const user = c.get('user');
  
  if (!user) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  try {
    const endDate = params.end_date || new Date().toISOString().split('T')[0];
    const startDate = params.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Use the predefined builder for timezone data
    const timezoneBuilder = createTimezonesBuilder(params.website_id, startDate, endDate, params.limit);
    const timezones = await chQuery(timezoneBuilder.getSql());
    
    return c.json({
      success: true,
      website_id: params.website_id,
      date_range: {
        start_date: startDate,
        end_date: endDate
      },
      timezones
    });
  } catch (error) {
    logger.error('Error retrieving timezone analytics data', { 
      error,
      website_id: params.website_id
    });
    
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, 500);
  }
});

// Helper function to extract browser version from user agent string
function extractBrowserVersion(userAgent: string): string {
  if (!userAgent) return 'Unknown';
  
  // Simple regex patterns to extract common browser versions
  const chromeMatch = userAgent.match(/Chrome\/(\d+\.\d+)/);
  if (chromeMatch) return chromeMatch[1];
  
  const firefoxMatch = userAgent.match(/Firefox\/(\d+\.\d+)/);
  if (firefoxMatch) return firefoxMatch[1];
  
  const safariMatch = userAgent.match(/Version\/(\d+\.\d+).*Safari/);
  if (safariMatch) return safariMatch[1];
  
  const edgeMatch = userAgent.match(/Edg(?:e)?\/(\d+\.\d+)/);
  if (edgeMatch) return edgeMatch[1];
  
  const ieMatch = userAgent.match(/(?:MSIE |rv:)(\d+\.\d+)/);
  if (ieMatch) return ieMatch[1];
  
  const operaMatch = userAgent.match(/OPR\/(\d+\.\d+)/);
  if (operaMatch) return operaMatch[1];
  
  // For mobile browsers
  const mobileFirefoxMatch = userAgent.match(/(?:Mobile|Tablet).*Firefox\/(\d+\.\d+)/);
  if (mobileFirefoxMatch) return mobileFirefoxMatch[1];
  
  const chromeMobileMatch = userAgent.match(/Chrome\/(\d+\.\d+).*Mobile/);
  if (chromeMobileMatch) return chromeMobileMatch[1];
  
  // For iOS devices
  const iosMatch = userAgent.match(/OS (\d+[_.]\d+)/);
  if (iosMatch) return iosMatch[1].replace('_', '.');
  
  return 'Unknown';
}

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
    sessionsResult.forEach(session => {
      if (session.visitor_id) {
        visitorSessionCounts[session.visitor_id] = (visitorSessionCounts[session.visitor_id] || 0) + 1;
      }
    });
    
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
      const userAgentInfo = parseUserAgent(session.user_agent || '');
      
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
        device: userAgentInfo.device || 'Unknown',
        browser: userAgentInfo.browser || 'Unknown',
        os: userAgentInfo.os || 'Unknown',
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
  const { website_id } = c.req.valid('query');
  const user = c.get('user');
  
  if (!user) {
    return c.json({ success: false, error: 'Authentication required' }, 401);
  }
  
  try {
    // Get the session info first
    const sessionsBuilder = createSessionsBuilder(website_id, '2000-01-01', '2100-01-01', 1);
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
    const userAgentInfo = parseUserAgent(session.user_agent || '');
    
    // Parse referrer
    const referrerParsed = session.referrer ? parseReferrers(
      [{ referrer: session.referrer, visitors: 0, pageviews: 0 }]
    )[0] : null;
    
    // Get all events for this session
    const eventsBuilder = createSessionEventsBuilder(website_id, session_id);
    const eventsResult = await chQuery(eventsBuilder.getSql());
    
    // Process events to add device, browser, OS info from user_agent
    const processedEvents = eventsResult.map(event => {
      const eventUserAgentInfo = parseUserAgent(event.user_agent || '');
      
      // Create a new object without the user_agent field
      const { user_agent, ...eventWithoutUserAgent } = event;
      
      return {
        ...eventWithoutUserAgent,
        device_type: eventUserAgentInfo.device || 'Unknown',
        browser: eventUserAgentInfo.browser || 'Unknown',
        os: eventUserAgentInfo.os || 'Unknown'
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
      client_filter: `client_id = '${website_id}'`,
      visitor_filter: `anonymous_id = '${session.visitor_id}'`
    };
    
    const visitorSessionsResult = await chQuery(visitorSessionsBuilder.getSql());
    const visitorSessionCount = visitorSessionsResult[0]?.session_count || 1;
    
    // Format the session with events, but don't include the raw user_agent
    const { user_agent, ...sessionWithoutUserAgent } = session;
    
    const formattedSession = {
      ...sessionWithoutUserAgent,
      session_name: sessionName,
      device: userAgentInfo.device || 'Unknown',
      browser: userAgentInfo.browser || 'Unknown',
      os: userAgentInfo.os || 'Unknown',
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
      website_id,
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
        const userAgentInfo = parseUserAgent(session.user_agent || '');
        
        // Parse referrer if present
        const referrerParsed = session.referrer ? parseReferrers(
          [{ referrer: session.referrer, visitors: 0, pageviews: 0 }]
        )[0] : null;
        
        // Generate a session name
        const sessionName = generateSessionName(session.session_id);
        
        return {
          ...session,
          session_name: sessionName,
          device: userAgentInfo.device || 'Unknown',
          browser: userAgentInfo.browser || 'Unknown',
          os: userAgentInfo.os || 'Unknown',
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

export default analyticsRouter; 