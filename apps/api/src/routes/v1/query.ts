import { Hono } from 'hono'
import { z } from 'zod'

import { authMiddleware } from '../../middleware/auth'
import { websiteAuthHook } from '../../middleware/website'
import { timezoneMiddleware } from '../../middleware/timezone'
import { adjustDateRangeForTimezone } from '../../utils/timezone'
import { logger } from '../../lib/logger'
import { chQuery } from '@databuddy/db'
import { getLanguageName } from '@databuddy/shared'
import { parseReferrer } from '../../utils/referrer'

// Single query schema
const filterSchema = z.object({
  field: z.string(),
  operator: z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'not_in', 'contains', 'starts_with']),
  value: z.union([z.string(), z.number(), z.array(z.union([z.string(), z.number()]))])
});

const singleQuerySchema = z.object({
  id: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  timeZone: z.string().default('UTC'),
  parameters: z.array(z.string()).min(1),
  limit: z.number().min(1).max(1000).default(100),
  page: z.number().min(1).default(1),
  filters: z.array(filterSchema).default([]),
  granularity: z.enum(['hourly', 'daily']).default('daily')
});

interface Website {
  id: string;
  domain: string;
}

type AnalyticsContext = {
  Variables: {
    website: Website;
    user: any;
  };
};

export const queryRouter = new Hono<AnalyticsContext>()

queryRouter.use('*', authMiddleware)
queryRouter.use('*', websiteAuthHook)
queryRouter.use('*', timezoneMiddleware)



type ParameterBuilder = (
  websiteId: string,
  startDate: string,
  endDate: string,
  limit: number,
  offset: number,
  granularity?: 'hourly' | 'daily',
  timezone?: string,
  filters?: any[]
) => string;

const processLanguageData = (data: any[]) => 
  data.map(item => ({
    ...item,
    name: getLanguageName(item.name) !== 'Unknown' ? getLanguageName(item.name) : item.name,
    code: item.name
  }))

// Data processing functions
const processCountryData = (data: any[]) => 
  data.map(item => ({
    ...item,
    name: item.name === 'IL' ? 'PS' : item.name,
    country: item.country === 'IL' ? 'PS' : item.country
  }))

const processPageData = (data: any[]) => 
  data.map(item => {
    let cleanPath = item.name || item.path || '/';
    
    try {
      if (cleanPath.startsWith('http')) {
        const url = new URL(cleanPath);
        cleanPath = url.pathname + url.search + url.hash;
      }
    } catch (e) {
      // If URL parsing fails, keep the original path
    }
    
    cleanPath = cleanPath || '/';
    
    return {
      ...item,
      name: cleanPath,
      path: cleanPath
    };
  })

const processCustomEventsData = (data: any[]) => 
  data.map(item => {
    const { property_keys_arrays, ...rest } = item;
    let property_keys: string[] = [];

    if (property_keys_arrays) {
      const allKeys = (property_keys_arrays as any[]).flat();
      const filteredKeys = allKeys.filter((key: string) => 
        !key.startsWith('__') && 
        !['sessionId', 'sessionStartTime'].includes(key)
      );
      property_keys = [...new Set(filteredKeys)];
    }

    return {
      ...rest,
      property_keys,
      country: item.country === 'IL' ? 'PS' : item.country,
      event_types: typeof item.event_types === 'string' ? 
        JSON.parse(item.event_types) : item.event_types,
      last_occurrence: item.last_occurrence ? new Date(item.last_occurrence).toISOString() : null,
      first_occurrence: item.first_occurrence ? new Date(item.first_occurrence).toISOString() : null,
      last_event_time: item.last_event_time ? new Date(item.last_event_time).toISOString() : null,
      first_event_time: item.first_event_time ? new Date(item.first_event_time).toISOString() : null,
    };
  })

const processCustomEventDetailsData = (data: any[]) => 
  data.map(item => {
    let properties: Record<string, any> = {};
    let propertyKeys: string[] = [];
    
    if (item.properties_json) {
      try {
        properties = JSON.parse(item.properties_json);
        propertyKeys = Object.keys(properties).filter(key => 
          !key.startsWith('__') && 
          !['sessionId', 'sessionStartTime'].includes(key)
        );
      } catch {
        // If parsing fails, keep empty
      }
    }
    
    return {
      ...item,
      country: item.country === 'IL' ? 'PS' : item.country,
      time: new Date(item.time).toISOString(),
      properties,
      custom_property_keys: propertyKeys,
      _subRows: propertyKeys.map(key => ({
        name: key,
        value: properties[key],
        type: typeof properties[key],
        _isProperty: true
      }))
    };
  })

// Helper function to group browser version data
function processBrowserGroupedData(rawData: any[]): any[] {
  const browserGroups: Record<string, any> = {}
  
  for (const item of rawData) {
    const browserName = item.browser_name
    const version = {
      name: String(item.browser_version || ''),
      version: String(item.browser_version || ''),
      visitors: Number(item.visitors) || 0,
      pageviews: Number(item.pageviews) || 0,
      sessions: Number(item.sessions) || 0
    }
    
    if (!browserGroups[browserName]) {
      browserGroups[browserName] = {
        name: browserName,
        visitors: 0,
        pageviews: 0,
        sessions: 0,
        versions: []
      }
    }
    
    browserGroups[browserName].visitors += version.visitors
    browserGroups[browserName].pageviews += version.pageviews
    browserGroups[browserName].sessions += version.sessions
    browserGroups[browserName].versions.push(version)
  }
  
  // Convert to array and sort
  return Object.values(browserGroups)
    .map((browser: any) => ({
      ...browser,
      versions: browser.versions.sort((a: any, b: any) => b.visitors - a.visitors)
    }))
    .sort((a: any, b: any) => b.visitors - a.visitors)
}

const processReferrerData = (data: any[], websiteDomain?: string) => {
  const aggregatedReferrers: Record<string, { type: string; name: string; visitors: number; pageviews: number; sessions: number, domain: string }> = {}

  for (const row of data) {
    const { name: referrerUrl, visitors, pageviews, sessions } = row
    const parsed = parseReferrer(referrerUrl, websiteDomain)

    // Skip same-domain referrers entirely
    if (websiteDomain && referrerUrl && referrerUrl !== 'direct') {
      try {
        const url = new URL(referrerUrl.startsWith('http') ? referrerUrl : `http://${referrerUrl}`)
        const hostname = url.hostname
        
        // Check if the referrer hostname matches the website domain
        if (hostname === websiteDomain || hostname.endsWith(`.${websiteDomain}`) || 
            (websiteDomain.startsWith('www.') && hostname === websiteDomain.substring(4)) ||
            (hostname.startsWith('www.') && websiteDomain === hostname.substring(4))) {
          continue // Skip same-domain referrers
        }
      } catch (e) {
        // If URL parsing fails, continue with the original logic
      }
    }

    const key = parsed.name

    if (!aggregatedReferrers[key]) {
      aggregatedReferrers[key] = {
        type: parsed.type,
        name: key,
        domain: parsed.domain,
        visitors: 0,
        pageviews: 0,
        sessions: 0,
      }
    }

    aggregatedReferrers[key].visitors += Number(visitors) || 0
    aggregatedReferrers[key].pageviews += Number(pageviews) || 0
    aggregatedReferrers[key].sessions += Number(sessions) || 0
  }

  return Object.values(aggregatedReferrers).sort((a, b) => b.visitors - a.visitors)
}

// Helper function to process timezone data
function processTimezoneData(rawData: any[]): any[] {
  return rawData.map(item => {
    const tz = item.name
    let displayName = tz
    
    // Common timezone mappings
    const timezoneNames: Record<string, string> = {
      'UTC': 'UTC (Coordinated Universal Time)',
      'GMT': 'GMT (Greenwich Mean Time)',
      'America/New_York': 'Eastern Time (US & Canada)',
      'America/Chicago': 'Central Time (US & Canada)',
      'America/Denver': 'Mountain Time (US & Canada)',
      'America/Los_Angeles': 'Pacific Time (US & Canada)',
      'America/Anchorage': 'Alaska Time',
      'Pacific/Honolulu': 'Hawaii Time',
      'Europe/London': 'Greenwich Mean Time (UK)',
      'Europe/Paris': 'Central European Time',
      'Europe/Berlin': 'Central European Time',
      'Europe/Rome': 'Central European Time',
      'Europe/Madrid': 'Central European Time',
      'Europe/Amsterdam': 'Central European Time',
      'Europe/Helsinki': 'Eastern European Time',
      'Europe/Athens': 'Eastern European Time',
      'Europe/Moscow': 'Moscow Standard Time',
      'Asia/Tokyo': 'Japan Standard Time',
      'Asia/Shanghai': 'China Standard Time',
      'Asia/Beijing': 'China Standard Time',
      'Asia/Kolkata': 'India Standard Time',
      'Asia/Mumbai': 'India Standard Time',
      'Asia/Dubai': 'Gulf Standard Time',
      'Australia/Sydney': 'Australian Eastern Time',
      'Australia/Melbourne': 'Australian Eastern Time',
      'Australia/Perth': 'Australian Western Time',
      'Pacific/Auckland': 'New Zealand Standard Time',
      'America/Sao_Paulo': 'Brasília Time',
      'America/Argentina/Buenos_Aires': 'Argentina Time',
      'Africa/Cairo': 'Eastern European Time',
      'Africa/Johannesburg': 'South Africa Standard Time'
    }
    
    displayName = timezoneNames[tz] || tz.replace(/_/g, ' ').replace('/', ' / ')
    
    // Try to get current time in timezone
    let currentTime = ''
    try {
      const now = new Date()
      currentTime = now.toLocaleTimeString('en-US', { 
        timeZone: tz,
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      // If timezone is invalid, skip time display
    }
    
    return {
      ...item,
      name: displayName,
      code: tz,
      current_time: currentTime
    }
  })
}

// SQL escaping function to prevent injection
function escapeSqlString(value: string | number): string {
  if (typeof value === 'number') {
    return value.toString()
  }
  // Escape single quotes by doubling them
  return `'${String(value).replace(/'/g, "''")}'`
}

// Define reusable metric sets
const METRICS = {
  standard: `
    uniq(anonymous_id) as visitors,
    COUNT(*) as pageviews,
    uniq(session_id) as sessions
  `,
  performance: `
    uniq(anonymous_id) as visitors,
    avgIf(load_time, load_time > 0) as avg_load_time,
    avgIf(ttfb, ttfb > 0) as avg_ttfb,
    avgIf(dom_ready_time, dom_ready_time > 0) as avg_dom_ready_time,
    avgIf(render_time, render_time > 0) as avg_render_time,
    avgIf(fcp, fcp > 0) as avg_fcp,
    avgIf(lcp, lcp > 0) as avg_lcp,
    avgIf(cls, cls >= 0) as avg_cls
  `,
  errors: `
    COUNT(*) as total_errors,
    COUNT(DISTINCT error_message) as unique_error_types,
    uniq(anonymous_id) as affected_users,
    uniq(session_id) as affected_sessions
  `,
  exits: `
    uniq(anonymous_id) as visitors,
    COUNT(*) as exits,
    uniq(session_id) as sessions
  `
};

// Query builder factory
interface BuilderConfig {
  metricSet: string;
  nameColumn: string;
  groupByColumns: string[];
  eventName?: string;
  extraWhere?: string;
  orderBy: string;
}

// Common SQL builder functions
function createQueryBuilder(config: BuilderConfig): ParameterBuilder {
  return (websiteId, startDate, endDate, limit, offset, granularity = 'daily') => {
    const whereClauses = [
      `client_id = ${escapeSqlString(websiteId)}`,
      `time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})`,
      `time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})`,
      `event_name = 'screen_view'`
    ];
    
    if (config.eventName) {
      whereClauses.push(`event_name = ${escapeSqlString(config.eventName)}`);
    }

    if (config.extraWhere) {
      whereClauses.push(config.extraWhere);
    }
    
    return `
      SELECT 
        ${config.nameColumn} as name,
        ${config.metricSet}
      FROM analytics.events
      WHERE ${whereClauses.join(' AND ')}
      GROUP BY ${config.groupByColumns.join(', ')}
      ORDER BY ${config.orderBy}
      LIMIT ${limit} OFFSET ${offset}
    `;
  };
}

function createStandardQuery(nameColumn: string, groupByColumns: string[], extraWhere?: string, orderBy = 'visitors DESC'): ParameterBuilder {
  return createQueryBuilder({
    metricSet: METRICS.standard,
    nameColumn,
    groupByColumns,
    extraWhere,
    orderBy
  });
}

function createAlias(targetParameter: string): ParameterBuilder {
  return (websiteId, startDate, endDate, limit, offset, granularity = 'daily') => 
    PARAMETER_BUILDERS[targetParameter](websiteId, startDate, endDate, limit, offset, granularity);
}



// Parameter registry with consolidated builders
const PARAMETER_BUILDERS: Record<string, ParameterBuilder> = {
  // Device & Browser
  device_type: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    SELECT 
      COALESCE(device_type, 'desktop') as name,
      uniq(anonymous_id) as visitors,
      COUNT(*) as pageviews,
      uniq(session_id) as sessions
    FROM analytics.events
    WHERE client_id = ${escapeSqlString(websiteId)}
      AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
      AND event_name = 'screen_view'
    GROUP BY device_type
    ORDER BY visitors DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  browser_name: createStandardQuery('browser_name', ['browser_name'], "browser_name != ''"),
  
  browsers_grouped: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    SELECT 
      CONCAT(browser_name, ' ', browser_version) as name,
      browser_name,
      browser_version,
      uniq(anonymous_id) as visitors,
      COUNT(*) as pageviews,
      uniq(session_id) as sessions
    FROM analytics.events
    WHERE client_id = ${escapeSqlString(websiteId)}
      AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
      AND event_name = 'screen_view'
      AND browser_name != ''
      AND browser_version IS NOT NULL 
      AND browser_version != ''
    GROUP BY browser_name, browser_version
    ORDER BY visitors DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  os_name: createStandardQuery('os_name', ['os_name'], "os_name != ''"),
  screen_resolution: createStandardQuery('screen_resolution', ['screen_resolution'], "screen_resolution != '' AND screen_resolution IS NOT NULL"),
  connection_type: createStandardQuery('connection_type', ['connection_type'], "connection_type != '' AND connection_type IS NOT NULL"),

  // Geography
  country: createStandardQuery('country', ['country'], "country != ''"),
  region: createStandardQuery("CONCAT(region, ', ', country)", ['region', 'country'], "region != ''"),
  timezone: createStandardQuery('timezone', ['timezone'], "timezone != ''"),
  language: createStandardQuery('language', ['language'], "language != '' AND language IS NOT NULL"),

  // Pages
  top_pages: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    SELECT 
      path as name,
      uniq(anonymous_id) as visitors,
      COUNT(*) as pageviews,
      uniq(session_id) as sessions
    FROM analytics.events
    WHERE client_id = ${escapeSqlString(websiteId)}
      AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
      AND event_name = 'screen_view'
      AND path != ''
    GROUP BY path
    ORDER BY pageviews DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  exit_page: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    WITH sessions AS (
      SELECT
        session_id,
        MAX(time) as session_end_time
      FROM analytics.events
      WHERE 
        client_id = ${escapeSqlString(websiteId)}
        AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
        AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
        AND event_name = 'screen_view'
        AND path != ''
      GROUP BY session_id
    ),
    exit_pages AS (
      SELECT
        e.path,
        COUNT(DISTINCT e.session_id) as exits,
        COUNT(DISTINCT e.anonymous_id) as visitors
      FROM analytics.events e
      INNER JOIN sessions s ON e.session_id = s.session_id AND e.time = s.session_end_time
      WHERE 
        e.client_id = ${escapeSqlString(websiteId)}
        AND e.time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
        AND e.time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
        AND e.event_name = 'screen_view'
        AND e.path != ''
      GROUP BY e.path
    )
    SELECT 
      path as name,
      exits,
      visitors,
      exits as sessions
    FROM exit_pages
    WHERE path != ''
    ORDER BY exits DESC
    LIMIT ${limit} OFFSET ${offset}
  `,



  // UTM & Referrers
  utm_source: createStandardQuery('utm_source', ['utm_source'], "utm_source != ''"),
  utm_medium: createStandardQuery('utm_medium', ['utm_medium'], "utm_medium != ''"),
  utm_campaign: createStandardQuery('utm_campaign', ['utm_campaign'], "utm_campaign != ''"),
  utm_content: createStandardQuery('utm_content', ['utm_content'], "utm_content != ''"),
  utm_term: createStandardQuery('utm_term', ['utm_term'], "utm_term != ''"),
  referrer: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    SELECT 
      referrer as name,
      uniq(anonymous_id) as visitors,
      COUNT(*) as pageviews,
      uniq(session_id) as sessions
    FROM analytics.events
    WHERE client_id = ${escapeSqlString(websiteId)}
      AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
      AND event_name = 'screen_view'
      AND referrer != '' 
      AND referrer IS NOT NULL
    GROUP BY referrer
    ORDER BY visitors DESC
  `,



  slow_pages: createQueryBuilder({
    metricSet: METRICS.performance,
    nameColumn: 'path',
    groupByColumns: ['path'],
    extraWhere: "load_time > 0 AND path != ''",
    orderBy: 'avg_load_time DESC'
  }),

  performance_by_country: createQueryBuilder({
    metricSet: METRICS.performance,
    nameColumn: 'country',
    groupByColumns: ['country'],
    extraWhere: "load_time > 0 AND country != ''",
    orderBy: 'avg_load_time DESC'
  }),

  performance_by_device: createQueryBuilder({
    metricSet: METRICS.performance,
    nameColumn: 'device_type',
    groupByColumns: ['device_type'],
    extraWhere: "load_time > 0 AND device_type != ''",
    orderBy: 'avg_load_time DESC'
  }),

  performance_by_browser: createQueryBuilder({
    metricSet: METRICS.performance,
    nameColumn: "CONCAT(browser_name, ' ', browser_version)",
    groupByColumns: ['browser_name', 'browser_version'],
    extraWhere: "load_time > 0 AND browser_name != '' AND browser_version IS NOT NULL AND browser_version != ''",
    orderBy: 'avg_load_time DESC'
  }),

  performance_by_os: createQueryBuilder({
    metricSet: METRICS.performance,
    nameColumn: 'os_name',
    groupByColumns: ['os_name'],
    extraWhere: "load_time > 0 AND os_name != ''",
    orderBy: 'avg_load_time DESC'
  }),

  performance_by_region: createQueryBuilder({
    metricSet: METRICS.performance,
    nameColumn: "CONCAT(region, ', ', country)",
    groupByColumns: ['region', 'country'],
    extraWhere: "load_time > 0 AND region != ''",
    orderBy: 'avg_load_time DESC'
  }),

  recent_errors: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    SELECT 
      message as error_message,
      stack as error_stack,
      path as page_url,
      anonymous_id,
      session_id,
      timestamp as time,
      browser_name,
      browser_version,
      os_name,
      device_type,
      country,
      region
    FROM analytics.errors
    WHERE client_id = ${escapeSqlString(websiteId)}
      AND timestamp >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND timestamp <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
      AND message != ''
    ORDER BY timestamp DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  error_types: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    SELECT 
      message as name,
      COUNT(*) as total_occurrences,
      uniq(anonymous_id) as affected_users,
      uniq(session_id) as affected_sessions,
      MAX(timestamp) as last_occurrence,
      MIN(timestamp) as first_occurrence
    FROM analytics.errors
    WHERE client_id = ${escapeSqlString(websiteId)}
      AND timestamp >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND timestamp <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
      AND message != ''
    GROUP BY message
    ORDER BY total_occurrences DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  errors_by_page: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    SELECT 
      path as name,
      COUNT(*) as total_errors,
      COUNT(DISTINCT message) as unique_error_types,
      uniq(anonymous_id) as affected_users,
      uniq(session_id) as affected_sessions
    FROM analytics.errors
    WHERE client_id = ${escapeSqlString(websiteId)}
      AND timestamp >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND timestamp <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
      AND message != '' AND path != ''
    GROUP BY path
    ORDER BY total_errors DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  errors_by_browser: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    SELECT 
      CONCAT(browser_name, ' ', browser_version) as name,
      COUNT(*) as total_errors,
      COUNT(DISTINCT message) as unique_error_types,
      uniq(anonymous_id) as affected_users,
      uniq(session_id) as affected_sessions
    FROM analytics.errors
    WHERE client_id = ${escapeSqlString(websiteId)}
      AND timestamp >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND timestamp <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
      AND message != '' AND browser_name != '' AND browser_version IS NOT NULL AND browser_version != ''
    GROUP BY browser_name, browser_version
    ORDER BY total_errors DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  errors_by_os: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    SELECT 
      os_name as name,
      COUNT(*) as total_errors,
      COUNT(DISTINCT message) as unique_error_types,
      uniq(anonymous_id) as affected_users,
      uniq(session_id) as affected_sessions
    FROM analytics.errors
    WHERE client_id = ${escapeSqlString(websiteId)}
      AND timestamp >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND timestamp <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
      AND message != '' AND os_name != ''
    GROUP BY os_name
    ORDER BY total_errors DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  errors_by_country: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    SELECT 
      country as name,
      COUNT(*) as total_errors,
      COUNT(DISTINCT message) as unique_error_types,
      uniq(anonymous_id) as affected_users,
      uniq(session_id) as affected_sessions
    FROM analytics.errors
    WHERE client_id = ${escapeSqlString(websiteId)}
      AND timestamp >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND timestamp <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
      AND message != '' AND country != ''
    GROUP BY country
    ORDER BY total_errors DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  errors_by_device: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    SELECT 
      device_type as name,
      COUNT(*) as total_errors,
      COUNT(DISTINCT message) as unique_error_types,
      uniq(anonymous_id) as affected_users,
      uniq(session_id) as affected_sessions
    FROM analytics.errors
    WHERE client_id = ${escapeSqlString(websiteId)}
      AND timestamp >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND timestamp <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
      AND message != '' AND device_type != ''
    GROUP BY device_type
    ORDER BY total_errors DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  error_trends: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    SELECT 
      toDate(timestamp) as date,
      COUNT(*) as total_errors,
      COUNT(DISTINCT message) as unique_error_types,
      uniq(anonymous_id) as affected_users,
      uniq(session_id) as affected_sessions
    FROM analytics.errors
    WHERE client_id = ${escapeSqlString(websiteId)}
      AND timestamp >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND timestamp <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
      AND message != ''
    GROUP BY toDate(timestamp)
    ORDER BY date DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  // Web Vitals queries using dedicated web_vitals table
  web_vitals_overview: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    SELECT 
      'overview' as name,
      COUNT(*) as total_measurements,
      uniq(anonymous_id) as unique_users,
      uniq(session_id) as unique_sessions,
      avgIf(fcp, fcp > 0) as avg_fcp,
      avgIf(lcp, lcp > 0) as avg_lcp,
      avgIf(cls, cls >= 0) as avg_cls,
      avgIf(fid, fid > 0) as avg_fid,
      avgIf(inp, inp > 0) as avg_inp,
      quantileIf(0.75)(fcp, fcp > 0) as p75_fcp,
      quantileIf(0.75)(lcp, lcp > 0) as p75_lcp,
      quantileIf(0.75)(cls, cls >= 0) as p75_cls,
      quantileIf(0.75)(fid, fid > 0) as p75_fid,
      quantileIf(0.75)(inp, inp > 0) as p75_inp
    FROM analytics.web_vitals
    WHERE client_id = ${escapeSqlString(websiteId)}
      AND timestamp >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND timestamp <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
    LIMIT ${limit} OFFSET ${offset}
  `,

  web_vitals_by_page: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    SELECT 
      path as name,
      COUNT(*) as total_measurements,
      uniq(anonymous_id) as unique_users,
      avgIf(fcp, fcp > 0) as avg_fcp,
      avgIf(lcp, lcp > 0) as avg_lcp,
      avgIf(cls, cls >= 0) as avg_cls,
      avgIf(fid, fid > 0) as avg_fid,
      avgIf(inp, inp > 0) as avg_inp
    FROM analytics.web_vitals
    WHERE client_id = ${escapeSqlString(websiteId)}
      AND timestamp >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND timestamp <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
      AND path != ''
    GROUP BY path
    ORDER BY total_measurements DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  web_vitals_by_device: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    SELECT 
      device_type as name,
      COUNT(*) as total_measurements,
      uniq(anonymous_id) as unique_users,
      avgIf(fcp, fcp > 0) as avg_fcp,
      avgIf(lcp, lcp > 0) as avg_lcp,
      avgIf(cls, cls >= 0) as avg_cls,
      avgIf(fid, fid > 0) as avg_fid,
      avgIf(inp, inp > 0) as avg_inp
    FROM analytics.web_vitals
    WHERE client_id = ${escapeSqlString(websiteId)}
      AND timestamp >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND timestamp <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
      AND device_type != ''
    GROUP BY device_type
    ORDER BY total_measurements DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  web_vitals_trends: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    SELECT 
      toDate(timestamp) as date,
      COUNT(*) as total_measurements,
      uniq(anonymous_id) as unique_users,
      avgIf(fcp, fcp > 0) as avg_fcp,
      avgIf(lcp, lcp > 0) as avg_lcp,
      avgIf(cls, cls >= 0) as avg_cls,
      avgIf(fid, fid > 0) as avg_fid,
      avgIf(inp, inp > 0) as avg_inp
    FROM analytics.web_vitals
    WHERE client_id = ${escapeSqlString(websiteId)}
      AND timestamp >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND timestamp <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
    GROUP BY toDate(timestamp)
    ORDER BY date DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  // Custom Events queries
  custom_events: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    SELECT 
      event_name as name,
      COUNT(*) as total_events,
      uniq(anonymous_id) as unique_users,
      uniq(session_id) as unique_sessions,
      MAX(time) as last_occurrence,
      MIN(time) as first_occurrence,
      COUNT(DISTINCT path) as unique_pages,
      groupArray(JSONExtractKeys(properties)) as property_keys_arrays
    FROM analytics.events
    WHERE client_id = ${escapeSqlString(websiteId)}
      AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
      
      AND event_name NOT IN ('screen_view', 'page_exit', 'error', 'web_vitals')
      AND event_name != ''
    GROUP BY event_name
    ORDER BY total_events DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  custom_event_details: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    SELECT 
      event_name,
      time,
      path,
      anonymous_id,
      session_id,
      country,
      region,
      device_type,
      browser_name,
      os_name,
      JSONExtractKeys(CAST(properties AS String)) as property_keys,
      CAST(properties AS String) as properties_json
    FROM analytics.events
    WHERE client_id = ${escapeSqlString(websiteId)}
      AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
      
      AND event_name NOT IN ('screen_view', 'page_exit', 'error', 'web_vitals')
      AND event_name != ''
    ORDER BY time DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  custom_events_by_page: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    SELECT 
      path as name,
      COUNT(*) as total_events,
      COUNT(DISTINCT event_name) as unique_event_types,
      uniq(anonymous_id) as unique_users,
      uniq(session_id) as unique_sessions,
      groupArray(DISTINCT event_name) as event_types
    FROM analytics.events
    WHERE client_id = ${escapeSqlString(websiteId)}
      AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
      
      AND event_name NOT IN ('screen_view', 'page_exit', 'error', 'web_vitals')
      AND event_name != ''
      AND path != ''
    GROUP BY path
    ORDER BY total_events DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  custom_events_by_user: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    SELECT 
      anonymous_id as name,
      COUNT(*) as total_events,
      COUNT(DISTINCT event_name) as unique_event_types,
      COUNT(DISTINCT session_id) as unique_sessions,
      COUNT(DISTINCT path) as unique_pages,
      groupArray(DISTINCT event_name) as event_types,
      MAX(time) as last_event_time,
      MIN(time) as first_event_time
    FROM analytics.events
    WHERE client_id = ${escapeSqlString(websiteId)}
      AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
      
      AND event_name NOT IN ('screen_view', 'page_exit', 'error', 'web_vitals')
      AND event_name != ''
    GROUP BY anonymous_id
    ORDER BY total_events DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  custom_event_properties: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    WITH property_analysis AS (
      SELECT 
        event_name,
        JSONExtractKeys(CAST(properties AS String)) as keys
      FROM analytics.events
      WHERE client_id = ${escapeSqlString(websiteId)}
        AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
        AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
        
        AND event_name NOT IN ('screen_view', 'page_exit', 'error', 'web_vitals')
        AND event_name != ''
        AND properties IS NOT NULL
        AND properties != '{}'
    ),
    flattened_properties AS (
      SELECT 
        event_name,
        arrayJoin(keys) as property_key
      FROM property_analysis
      WHERE length(keys) > 0
    )
    SELECT 
      CONCAT(event_name, ':', property_key) as name,
      event_name,
      property_key,
      COUNT(*) as usage_count,
      COUNT(DISTINCT event_name) as event_types_count
    FROM flattened_properties
    WHERE property_key NOT IN ('__path', '__title', '__referrer', '__timestamp_ms', 'sessionId', 'sessionStartTime', 'screen_resolution', 'viewport_size', 'timezone', 'language', 'connection_type')
    GROUP BY event_name, property_key
    ORDER BY usage_count DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  // Summary metrics (replaces summary.ts functionality)
  summary_metrics: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    WITH session_metrics AS (
      SELECT
        session_id,
        countIf(event_name = 'screen_view') as page_count
      FROM analytics.events
      WHERE 
        client_id = ${escapeSqlString(websiteId)}
        AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
        AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
      GROUP BY session_id
    ),
    session_durations AS (
      SELECT
        session_id,
        dateDiff('second', MIN(time), MAX(time)) as duration
      FROM analytics.events
      WHERE 
        client_id = ${escapeSqlString(websiteId)}
        AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
        AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
      GROUP BY session_id
      HAVING duration > 0
    ),
    unique_visitors AS (
      SELECT
        countDistinct(anonymous_id) as unique_visitors
      FROM analytics.events
      WHERE 
        client_id = ${escapeSqlString(websiteId)}
        AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
        AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
        AND event_name = 'screen_view'
    ),
    all_events AS (
      SELECT
        count() as total_events
      FROM analytics.events
      WHERE 
        client_id = ${escapeSqlString(websiteId)}
        AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
        AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
    )
    SELECT
      sum(page_count) as pageviews,
      (SELECT unique_visitors FROM unique_visitors) as unique_visitors,
      count(session_metrics.session_id) as sessions,
      (COALESCE(countIf(page_count = 1), 0) / COALESCE(COUNT(*), 0)) * 100 as bounce_rate,
      ROUND((COALESCE(countIf(page_count = 1), 0) / COALESCE(COUNT(*), 0)) * 100, 1) || '%' as bounce_rate_pct,
      AVG(sd.duration) as avg_session_duration,
      CASE 
        WHEN AVG(sd.duration) >= 3600 THEN toString(floor(AVG(sd.duration) / 3600)) || 'h ' || toString(floor((AVG(sd.duration) % 3600) / 60)) || 'm'
        WHEN AVG(sd.duration) >= 60 THEN toString(floor(AVG(sd.duration) / 60)) || 'm ' || toString(floor(AVG(sd.duration) % 60)) || 's'
        ELSE toString(floor(AVG(sd.duration))) || 's'
      END as avg_session_duration_formatted,
      (SELECT total_events FROM all_events) as total_events
    FROM session_metrics
    LEFT JOIN session_durations as sd ON session_metrics.session_id = sd.session_id
  `,

  // Today's metrics
  today_metrics: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    WITH session_metrics AS (
      SELECT
        session_id,
        countIf(event_name = 'screen_view') as page_count
      FROM analytics.events
      WHERE 
        client_id = ${escapeSqlString(websiteId)}
        AND formatDateTime(time, '%Y-%m-%d', 'UTC') = formatDateTime(now(), '%Y-%m-%d', 'UTC')
      GROUP BY session_id
    ),
    unique_visitors AS (
      SELECT
        countDistinct(anonymous_id) as unique_visitors
      FROM analytics.events
      WHERE 
        client_id = ${escapeSqlString(websiteId)}
        AND formatDateTime(time, '%Y-%m-%d', 'UTC') = formatDateTime(now(), '%Y-%m-%d', 'UTC')
        AND event_name = 'screen_view'
    )
    SELECT
      sum(page_count) as pageviews,
      (SELECT unique_visitors FROM unique_visitors) as visitors,
      count(session_metrics.session_id) as sessions,
      (COALESCE(countIf(page_count = 1), 0) / COALESCE(COUNT(*), 0)) * 100 as bounce_rate
    FROM session_metrics
  `,

  // Events by date (for charts)
  events_by_date: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily', timezone: string = 'UTC') => {
    if (granularity === 'hourly') {
      return `
        WITH hour_range AS (
          SELECT 
            toStartOfHour(parseDateTimeBestEffort(${escapeSqlString(startDate)}), ${escapeSqlString(timezone)}) + toIntervalHour(number) as hour
          FROM numbers(dateDiff('hour', 
            toStartOfHour(parseDateTimeBestEffort(${escapeSqlString(startDate)}), ${escapeSqlString(timezone)}), 
            toStartOfHour(parseDateTimeBestEffort(${escapeSqlString(endDate)}), ${escapeSqlString(timezone)})
          ) + 1)
        ),
        hourly_sessions AS (
          SELECT
            toStartOfHour(time, ${escapeSqlString(timezone)}) as hour,
            session_id,
            countIf(event_name = 'screen_view') as page_count,
            dateDiff('second', MIN(time), MAX(time)) as session_duration
          FROM analytics.events
          WHERE 
            client_id = ${escapeSqlString(websiteId)}
            AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
            AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
          GROUP BY hour, session_id
        ),
        hourly_visitors AS (
          SELECT
            toStartOfHour(time, ${escapeSqlString(timezone)}) as hour,
            count(distinct anonymous_id) as visitors
          FROM analytics.events
          WHERE 
            client_id = ${escapeSqlString(websiteId)}
            AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
            AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
            AND event_name = 'screen_view'
          GROUP BY hour
        ),
        hourly_metrics AS (
          SELECT
            hour,
            sum(page_count) as pageviews,
            count(distinct session_id) as sessions,
            countIf(page_count = 1) as bounced_sessions,
            AVG(CASE WHEN session_duration > 0 THEN session_duration ELSE NULL END) as avg_session_duration
          FROM hourly_sessions
          GROUP BY hour
        )
        SELECT
          formatDateTime(hr.hour, '%Y-%m-%d %H:00:00', ${escapeSqlString(timezone)}) as date,
          COALESCE(hm.pageviews, 0) as pageviews,
          COALESCE(hv.visitors, 0) as visitors,
          COALESCE(hm.sessions, 0) as sessions,
          CASE 
            WHEN COALESCE(hm.sessions, 0) > 0 
            THEN (COALESCE(hm.bounced_sessions, 0) / COALESCE(hm.sessions, 0)) * 100 
            ELSE 0 
          END as bounce_rate,
          COALESCE(hm.avg_session_duration, 0) as avg_session_duration
        FROM hour_range hr
        LEFT JOIN hourly_metrics hm ON hr.hour = hm.hour
        LEFT JOIN hourly_visitors hv ON hr.hour = hv.hour
        ORDER BY hr.hour ASC
      `;
    } else {
      return `
        WITH date_range AS (
          SELECT 
            toDate(parseDateTimeBestEffort(${escapeSqlString(startDate)}), ${escapeSqlString(timezone)}) + number as date
          FROM numbers(dateDiff('day', 
            toDate(parseDateTimeBestEffort(${escapeSqlString(startDate)}), ${escapeSqlString(timezone)}), 
            toDate(parseDateTimeBestEffort(${escapeSqlString(endDate)}), ${escapeSqlString(timezone)})
          ) + 1)
        ),
        daily_sessions AS (
          SELECT
            toDate(time, ${escapeSqlString(timezone)}) as date,
            session_id,
            countIf(event_name = 'screen_view') as page_count,
            dateDiff('second', MIN(time), MAX(time)) as session_duration
          FROM analytics.events
          WHERE 
            client_id = ${escapeSqlString(websiteId)}
            AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
            AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
          GROUP BY date, session_id
        ),
        daily_visitors AS (
          SELECT
            toDate(time, ${escapeSqlString(timezone)}) as date,
            count(distinct anonymous_id) as visitors
          FROM analytics.events
          WHERE 
            client_id = ${escapeSqlString(websiteId)}
            AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
            AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
            AND event_name = 'screen_view'
          GROUP BY date
        ),
        daily_metrics AS (
          SELECT
            date,
            sum(page_count) as pageviews,
            count(distinct session_id) as sessions,
            countIf(page_count = 1) as bounced_sessions,
            AVG(CASE WHEN session_duration > 0 THEN session_duration ELSE NULL END) as avg_session_duration
          FROM daily_sessions
          GROUP BY date
        )
        SELECT
          formatDateTime(dr.date, '%Y-%m-%d', ${escapeSqlString(timezone)}) as date,
          COALESCE(dm.pageviews, 0) as pageviews,
          COALESCE(dv.visitors, 0) as visitors,
          COALESCE(dm.sessions, 0) as sessions,
          CASE 
            WHEN COALESCE(dm.sessions, 0) > 0 
            THEN (COALESCE(dm.bounced_sessions, 0) / COALESCE(dm.sessions, 0)) * 100 
            ELSE 0 
          END as bounce_rate,
          COALESCE(dm.avg_session_duration, 0) as avg_session_duration
        FROM date_range dr
        LEFT JOIN daily_metrics dm ON dr.date = dm.date
        LEFT JOIN daily_visitors dv ON dr.date = dv.date
        ORDER BY dr.date ASC
      `;
    }
  },

  // Entry pages
  entry_pages: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    WITH session_entry AS (
      SELECT 
        session_id,
        anonymous_id,
        path as entry_page,
        time as entry_time,
        ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY time) as page_rank
      FROM analytics.events
      WHERE client_id = ${escapeSqlString(websiteId)}
        AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
        AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
        AND event_name = 'screen_view'
        AND path != ''
    )
    SELECT 
      entry_page as name,
      COUNT(*) as entries,
      COUNT(DISTINCT session_id) as sessions,
      COUNT(DISTINCT anonymous_id) as visitors
    FROM session_entry
    WHERE page_rank = 1
    GROUP BY entry_page
    ORDER BY entries DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  sessions_summary: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    SELECT
      uniq(session_id) as total_sessions,
      uniq(anonymous_id) as total_users
    FROM analytics.events
    WHERE client_id = ${escapeSqlString(websiteId)}
      AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
      
      AND event_name = 'screen_view'
  `,

  // Test query to check if there's any data at all
  test_data: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    SELECT 
      'test' as name,
      COUNT(DISTINCT anonymous_id) as visitors,
      COUNT(*) as pageviews,
      COUNT(DISTINCT session_id) as sessions
    FROM analytics.events
    WHERE client_id = ${escapeSqlString(websiteId)}
      AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
      
      AND event_name = 'screen_view'
  `,


  custom_event_property_values: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily', timezone: string = 'UTC', filters: any[] = []) => {
    const eventNameFilter = filters.find((f: any) => f.field === 'event_name');
    const propertyKeyFilter = filters.find((f: any) => f.field === 'property_key');

    if (!eventNameFilter || !propertyKeyFilter || typeof eventNameFilter.value !== 'string' || typeof propertyKeyFilter.value !== 'string') {
      return `SELECT '' as name, 0 as total_events, 0 as unique_users WHERE 1=0`;
    }

    const eventName = eventNameFilter.value;
    const propertyKey = propertyKeyFilter.value;

    return `
      SELECT
        JSONExtractString(properties, ${escapeSqlString(propertyKey)}) as name,
        COUNT(*) as total_events,
        uniq(anonymous_id) as unique_users
      FROM analytics.events
      WHERE client_id = ${escapeSqlString(websiteId)}
        AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
        AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
        
        AND event_name = ${escapeSqlString(eventName)}
        AND JSONHas(properties, ${escapeSqlString(propertyKey)})
        AND JSONExtractString(properties, ${escapeSqlString(propertyKey)}) != ''
      GROUP BY name
      ORDER BY total_events DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  },

  // Funnel Analysis queries
  funnel_analysis: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily', timezone: string = 'UTC', filters: any[] = []) => {
    const funnelStepsFilter = filters.find((f: any) => f.field === 'funnel_steps');
    if (!funnelStepsFilter || !Array.isArray(funnelStepsFilter.value)) {
      return `SELECT '' as step_name, 0 as step_number, 0 as users, 0 as conversion_rate WHERE 1=0`;
    }

    const steps = funnelStepsFilter.value;
    
    // Build step CTEs dynamically
    const stepCTEs = steps.map((step: any, index: number) => {
      let whereCondition = '';
      
      if (step.type === 'PAGE_VIEW') {
        whereCondition = `path = ${escapeSqlString(step.target)}`;
      } else if (step.type === 'EVENT') {
        whereCondition = `event_name = ${escapeSqlString(step.target)}`;
      } else if (step.type === 'CUSTOM' && step.conditions) {
        // Handle custom conditions - this can be expanded based on needs
        whereCondition = `event_name = ${escapeSqlString(step.target)}`;
      }
      
      return `
        step_${index + 1}_users AS (
          SELECT DISTINCT
            session_id,
            anonymous_id,
            MIN(time) as step_time
          FROM analytics.events
          WHERE client_id = ${escapeSqlString(websiteId)}
            AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
            AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
            AND ${whereCondition}
          GROUP BY session_id, anonymous_id
        )`;
    }).join(',\n');

    // Build step joins for funnel progression
    const stepJoins = steps.map((step: any, index: number) => {
      if (index === 0) return '';
      
      return `
        LEFT JOIN step_${index + 1}_users s${index + 1} 
          ON s1.session_id = s${index + 1}.session_id 
          AND s${index + 1}.step_time >= s${index}.step_time`;
    }).join('\n');

    // Build step analysis
    const stepAnalysis = steps.map((step: any, index: number) => {
      const stepNum = index + 1;
      return `
        SELECT 
          ${stepNum} as step_number,
          ${escapeSqlString(step.name)} as step_name,
          COUNT(DISTINCT s1.session_id) as total_users,
          ${index === 0 ? 
            'COUNT(DISTINCT s1.session_id)' : 
            `COUNT(DISTINCT s${stepNum}.session_id)`} as users,
          ${index === 0 ? 
            '100.0' : 
            `ROUND((COUNT(DISTINCT s${stepNum}.session_id) * 100.0 / COUNT(DISTINCT s1.session_id)), 2)`} as conversion_rate,
          ${index === 0 ? 
            '0' : 
            `(COUNT(DISTINCT s1.session_id) - COUNT(DISTINCT s${stepNum}.session_id))`} as dropoffs
        FROM step_1_users s1 ${stepJoins}`;
    });

    return `
      WITH ${stepCTEs}
      ${stepAnalysis.join('\nUNION ALL\n')}
      ORDER BY step_number
      LIMIT ${limit} OFFSET ${offset}
    `;
  },

  funnel_performance: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    WITH funnel_sessions AS (
      SELECT DISTINCT
        session_id,
        anonymous_id,
        COUNT(DISTINCT path) as unique_pages_visited,
        MIN(time) as session_start,
        MAX(time) as session_end,
        dateDiff('second', MIN(time), MAX(time)) as session_duration
      FROM analytics.events
      WHERE client_id = ${escapeSqlString(websiteId)}
        AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
        AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
        AND event_name = 'screen_view'
      GROUP BY session_id, anonymous_id
      HAVING unique_pages_visited >= 2
    )
    SELECT
      'overall' as funnel_name,
      COUNT(DISTINCT session_id) as total_sessions,
      COUNT(DISTINCT anonymous_id) as total_users,
      AVG(unique_pages_visited) as avg_pages_per_session,
      AVG(session_duration) as avg_session_duration,
      ROUND(AVG(session_duration) / 60, 2) as avg_duration_minutes
    FROM funnel_sessions
    LIMIT ${limit} OFFSET ${offset}
  `,

  // Enhanced funnel analytics queries
  funnel_steps_breakdown: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily', timezone: string = 'UTC', filters: any[] = []) => { 
    const funnelIdFilter = filters.find((f: any) => f.field === 'funnel_id');
    if (!funnelIdFilter) {
      return `SELECT '' as step_name, 0 as step_number, 0 as users, 0 as total_users, 0 as conversion_rate, 0 as dropoffs, 0 as dropoff_rate WHERE 1=0`;
    }

    // This would need to be enhanced to fetch funnel steps from the database
    // For now, return a placeholder query
    return `
      WITH step_analysis AS (
        SELECT 
          1 as step_number,
          'Landing Page' as step_name,
          COUNT(DISTINCT session_id) as users,
          COUNT(DISTINCT session_id) as total_users,
          100.0 as conversion_rate,
          0 as dropoffs,
          0.0 as dropoff_rate,
          0.0 as avg_time_to_complete
        FROM analytics.events
        WHERE client_id = ${escapeSqlString(websiteId)}
          AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
          AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
          AND event_name = 'screen_view'
        UNION ALL
        SELECT 
          2 as step_number,
          'Conversion Page' as step_name,
          COUNT(DISTINCT session_id) as users,
          (SELECT COUNT(DISTINCT session_id) FROM analytics.events 
           WHERE client_id = ${escapeSqlString(websiteId)}
             AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
             AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
             AND event_name = 'screen_view') as total_users,
          50.0 as conversion_rate,
          COUNT(DISTINCT session_id) as dropoffs,
          50.0 as dropoff_rate,
          120.0 as avg_time_to_complete
        FROM analytics.events
        WHERE client_id = ${escapeSqlString(websiteId)}
          AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
          AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
          AND event_name = 'screen_view'
          AND path LIKE '%signup%'
      )
      SELECT * FROM step_analysis
      ORDER BY step_number
      LIMIT ${limit} OFFSET ${offset}
    `;
  },

  funnel_user_segments: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily', timezone: string = 'UTC', filters: any[] = []) => {
    const funnelIdFilter = filters.find((f: any) => f.field === 'funnel_id');
    if (!funnelIdFilter) {
      return `SELECT '' as segment_name, 0 as users, 0 as conversion_rate WHERE 1=0`;
    }

    return `
      WITH user_segments AS (
        SELECT 
          CASE 
            WHEN device_type = 'desktop' THEN 'Desktop Users'
            WHEN device_type = 'mobile' THEN 'Mobile Users'
            WHEN device_type = 'tablet' THEN 'Tablet Users'
            ELSE 'Other'
          END as segment_name,
          COUNT(DISTINCT anonymous_id) as users,
          COUNT(DISTINCT session_id) as sessions,
          AVG(load_time) as avg_load_time
        FROM analytics.events
        WHERE client_id = ${escapeSqlString(websiteId)}
          AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
          AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
          AND event_name = 'screen_view'
        GROUP BY segment_name
      )
      SELECT 
        segment_name,
        users,
        sessions,
        ROUND(users * 100.0 / SUM(users) OVER(), 2) as conversion_rate,
        ROUND(avg_load_time, 2) as avg_load_time
      FROM user_segments
      ORDER BY users DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  },



  // User Journey & Path Analysis queries
  user_journeys: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    WITH ordered_events AS (
      SELECT 
        session_id,
        anonymous_id,
        path,
        time,
        ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY time) as step_number
      FROM analytics.events
      WHERE client_id = ${escapeSqlString(websiteId)}
        AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
        AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
        AND event_name = 'screen_view'
        AND path != ''
    ),
    transitions AS (
      SELECT 
        e1.session_id,
        e1.anonymous_id,
        e1.path as from_page,
        e2.path as to_page,
        e1.step_number,
        e2.step_number as next_step
      FROM ordered_events e1
      JOIN ordered_events e2 ON e1.session_id = e2.session_id AND e2.step_number = e1.step_number + 1
      WHERE e1.path != e2.path
    )
    SELECT 
      from_page,
      to_page,
      COUNT(*) as transitions,
      COUNT(DISTINCT session_id) as sessions,
      COUNT(DISTINCT anonymous_id) as users,
      ROUND(AVG(step_number), 2) as avg_step_in_journey
    FROM transitions
    GROUP BY from_page, to_page
    ORDER BY transitions DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  journey_paths: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    WITH session_paths AS (
      SELECT 
        session_id,
        anonymous_id,
        groupArray(path) as page_sequence,
        COUNT(*) as page_count,
        MIN(time) as session_start,
        MAX(time) as session_end,
        dateDiff('second', MIN(time), MAX(time)) as session_duration
      FROM analytics.events
      WHERE client_id = ${escapeSqlString(websiteId)}
        AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
        AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
        AND event_name = 'screen_view'
        AND path != ''
      GROUP BY session_id, anonymous_id
      HAVING page_count >= 2
    ),
    path_analysis AS (
      SELECT 
        arrayStringConcat(arraySlice(page_sequence, 1, LEAST(length(page_sequence), 5)), ' → ') as journey_path,
        page_sequence[1] as entry_page,
        page_sequence[-1] as exit_page,
        COUNT(*) as frequency,
        COUNT(DISTINCT anonymous_id) as unique_users,
        ROUND(AVG(page_count), 2) as avg_pages_in_path,
        ROUND(AVG(session_duration), 2) as avg_duration_seconds
      FROM session_paths
      GROUP BY journey_path, entry_page, exit_page
    )
    SELECT 
      journey_path as name,
      entry_page,
      exit_page,
      frequency,
      unique_users,
      avg_pages_in_path,
      avg_duration_seconds,
      ROUND(avg_duration_seconds / 60, 2) as avg_duration_minutes
    FROM path_analysis
    ORDER BY frequency DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  journey_dropoffs: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    WITH session_steps AS (
      SELECT 
        session_id,
        anonymous_id,
        path,
        time,
        ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY time) as step_number,
        COUNT(*) OVER (PARTITION BY session_id) as total_steps_in_session
      FROM analytics.events
      WHERE client_id = ${escapeSqlString(websiteId)}
        AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
        AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
        AND event_name = 'screen_view'
        AND path != ''
    ),
    exit_analysis AS (
      SELECT 
        path,
        COUNT(*) as total_visits,
        COUNT(DISTINCT session_id) as total_sessions,
        COUNT(DISTINCT anonymous_id) as total_users,
        SUM(CASE WHEN step_number = total_steps_in_session THEN 1 ELSE 0 END) as exits,
        SUM(CASE WHEN step_number < total_steps_in_session THEN 1 ELSE 0 END) as continuations
      FROM session_steps
      GROUP BY path
      HAVING total_visits >= 10
    )
    SELECT 
      path as name,
      total_visits,
      total_sessions,
      total_users,
      exits,
      continuations,
      ROUND((exits * 100.0 / total_visits), 2) as exit_rate,
      ROUND((continuations * 100.0 / total_visits), 2) as continuation_rate
    FROM exit_analysis
    ORDER BY exit_rate DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  journey_entry_points: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    WITH session_entry AS (
      SELECT 
        session_id,
        anonymous_id,
        path as entry_page,
        time as entry_time,
        ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY time) as page_rank
      FROM analytics.events
      WHERE client_id = ${escapeSqlString(websiteId)}
        AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
        AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
        AND event_name = 'screen_view'
        AND path != ''
    ),
    entry_analysis AS (
      SELECT 
        entry_page,
        COUNT(*) as entries,
        COUNT(DISTINCT session_id) as sessions,
        COUNT(DISTINCT anonymous_id) as users
      FROM session_entry
      WHERE page_rank = 1
      GROUP BY entry_page
    ),
    session_metrics AS (
      SELECT 
        session_id,
        countIf(event_name = 'screen_view') as page_count
      FROM analytics.events
      WHERE client_id = ${escapeSqlString(websiteId)}
        AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
        AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
      GROUP BY session_id
    ),
    session_outcomes AS (
      SELECT 
        se.entry_page,
        COUNT(DISTINCT se.session_id) as total_sessions,
        COUNT(DISTINCT CASE WHEN sm.page_count = 1 THEN se.session_id END) as bounce_sessions,
        AVG(COALESCE(sm.page_count, 1)) as avg_pages_per_session
      FROM session_entry se
      LEFT JOIN session_metrics sm ON se.session_id = sm.session_id
      WHERE se.page_rank = 1
      GROUP BY se.entry_page
    )
    SELECT 
      ea.entry_page as name,
      ea.entries,
      ea.sessions,
      ea.users,
      ROUND((COALESCE(so.bounce_sessions, 0) * 100.0 / COALESCE(so.total_sessions, 1)), 2) as bounce_rate,
      ROUND(so.avg_pages_per_session, 2) as avg_pages_per_session
    FROM entry_analysis ea
    JOIN session_outcomes so ON ea.entry_page = so.entry_page
    ORDER BY ea.entries DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  // Aliases for backward compatibility and convenience
  browser_versions: createAlias('browser_name'),
  device_types: createAlias('device_type'),
  exit_pages: createAlias('exit_page'),
  top_referrers: createAlias('referrer'),
  utm_sources: createAlias('utm_source'),
  utm_mediums: createAlias('utm_medium'),
  utm_campaigns: createAlias('utm_campaign'),
  
  // Legacy aliases
  pages: createAlias('top_pages'),
  countries: createAlias('country'),
  devices: createAlias('device_type'),
  browsers: createAlias('browser_name'),
  operating_systems: createAlias('os_name'),
  regions: createAlias('region'),
  screen_resolutions: createAlias('screen_resolution'),
  connection_types: createAlias('connection_type'),
}

// Helper function to get metric type for a parameter
function getMetricType(parameter: string): string {
  const performanceParams = [
    'slow_pages', 'performance_by_country', 'performance_by_device', 
    'performance_by_browser', 'performance_by_os', 'performance_by_region'
  ]
  
  const errorParams = [
    'recent_errors', 'error_types', 'errors_by_page', 'errors_by_browser',
    'errors_by_os', 'errors_by_country', 'errors_by_device', 'error_trends'
  ]

  const webVitalsParams = [
    'web_vitals_overview', 'web_vitals_by_page', 'web_vitals_by_device', 'web_vitals_trends'
  ]
  
  const exitParams = ['exit_page']
  
  const specialParams = ['sessions_summary']
  
  if (performanceParams.includes(parameter)) return 'performance'
  if (errorParams.includes(parameter)) return 'errors'
  if (webVitalsParams.includes(parameter)) return 'web_vitals'
  if (exitParams.includes(parameter)) return 'exits'
  if (specialParams.includes(parameter)) return 'special'
  
  return 'standard'
}

// Helper function to build a unified query for multiple parameters
function buildUnifiedQuery(
  queries: Array<z.infer<typeof singleQuerySchema> & { id: string }>,
  websiteId: string,
  websiteDomain?: string
): string {
  // Group queries by metric type to avoid UNION ALL column mismatch
  const metricGroups: Record<string, Array<{
    query: z.infer<typeof singleQuerySchema> & { id: string },
    parameter: string
  }>> = {}
  
  for (const query of queries) {
    const { parameters } = query
    
    for (const parameter of parameters) {
      const metricType = getMetricType(parameter)
      
      if (!metricGroups[metricType]) {
        metricGroups[metricType] = []
      }
      
      metricGroups[metricType].push({ query, parameter })
    }
  }
  
  // Build separate UNION queries for each metric type
  const metricQueries: string[] = []
  
  for (const [metricType, items] of Object.entries(metricGroups)) {
    const subQueries: string[] = []
    
    for (const { query, parameter } of items) {
      const { startDate, endDate, limit, page, filters, timeZone, granularity } = query
      const offset = (page - 1) * limit
      
      const builder = PARAMETER_BUILDERS[parameter as keyof typeof PARAMETER_BUILDERS]
      if (!builder) continue
      
      let sql = builder(websiteId, startDate, `${endDate} 23:59:59`, limit, offset, granularity, timeZone)
      
      // Apply filters if provided
      if (filters.length > 0) {
        const filterClauses = filters.map((filter: any) => {
          switch (filter.operator) {
            case 'eq': return `${filter.field} = ${escapeSqlString(filter.value)}`
            case 'ne': return `${filter.field} != ${escapeSqlString(filter.value)}`
            case 'in': 
              if (Array.isArray(filter.value)) {
                const inValues = filter.value.map((v: any) => escapeSqlString(v)).join(',')
                return `${filter.field} IN (${inValues})`
              }
              return `${filter.field} = ${escapeSqlString(filter.value)}`
            case 'contains': return `${filter.field} LIKE CONCAT('%', ${escapeSqlString(filter.value)}, '%')`
            case 'starts_with': return `${filter.field} LIKE CONCAT(${escapeSqlString(filter.value)}, '%')`
            default: return ''
          }
        }).filter(Boolean)
        
        if (filterClauses.length > 0) {
          sql = sql.replace('GROUP BY', `AND ${filterClauses.join(' AND ')}\n    GROUP BY`)
        }
      }
      
      // Add query and parameter identifiers to the result
      const wrappedQuery = `
        SELECT 
          '${query.id}' as query_id,
          '${parameter}' as parameter,
          '${metricType}' as metric_type,
          *
        FROM (
          ${sql}
        ) subquery
      `
      
      subQueries.push(wrappedQuery)
    }
    
    if (subQueries.length > 0) {
      metricQueries.push(subQueries.join('\nUNION ALL\n'))
    }
  }
  
  // If we have multiple metric types, we can't union them - fall back to individual queries
  if (metricQueries.length > 1) {
    throw new Error('Cannot unify queries with different metric types')
  }
  
  return metricQueries[0] || ''
}

// Helper function to process data after unified query
function processUnifiedResults(
  rawResults: Array<Record<string, any>>,
  queries: Array<z.infer<typeof singleQuerySchema> & { id: string }>,
  websiteDomain?: string
) {
  // Group results by query_id and parameter
  const groupedResults: Record<string, Record<string, any[]>> = {}
  
  for (const row of rawResults) {
    const { query_id, parameter, metric_type, ...data } = row
    
    if (!groupedResults[query_id]) {
      groupedResults[query_id] = {}
    }
    if (!groupedResults[query_id][parameter]) {
      groupedResults[query_id][parameter] = []
    }
    
    groupedResults[query_id][parameter].push(data)
  }
  
  // Process each query's results
  return queries.map(query => {
    const queryResults = groupedResults[query.id] || {}
    
    // Check if all parameters are supported
    const unsupportedParams = query.parameters.filter((param: string) => 
      !PARAMETER_BUILDERS[param as keyof typeof PARAMETER_BUILDERS]
    )
    
    if (unsupportedParams.length > 0) {
      return {
        success: false,
        error: `Parameters not supported: ${unsupportedParams.join(', ')}`,
        available_parameters: Object.keys(PARAMETER_BUILDERS),
        queryId: query.id
      }
    }
    
    const processedResults = query.parameters.map(parameter => {
      const rawData = queryResults[parameter] || []
      
      // Post-process data based on parameter type
      let processedData: any[]
      
      switch (parameter) {
        case 'language':
          processedData = processLanguageData(rawData)
          break
          
        case 'referrer':
        case 'top_referrers':
          // Skip aggregation processing to show individual referrer URLs
          processedData = rawData
          break
          
        case 'browsers_grouped':
          processedData = processBrowserGroupedData(rawData)
          break
          
        case 'timezone':
          processedData = processTimezoneData(rawData)
          break
          
        case 'country':
        case 'countries':
        case 'region':
        case 'regions':
        case 'performance_by_country':
        case 'errors_by_country':
          processedData = processCountryData(rawData)
          break
          
        case 'custom_events':
        case 'custom_events_by_page':
        case 'custom_events_by_user':
        case 'custom_event_properties':
          processedData = processCustomEventsData(rawData)
          break
          
        case 'custom_event_details':
          processedData = processCustomEventDetailsData(rawData)
          break
          
        case 'top_pages':
        case 'entry_pages':
        case 'exit_pages':
        case 'exit_page':
          processedData = processPageData(rawData)
          break
          
        default:
          processedData = rawData
          break
      }
      
      return {
        parameter,
        data: processedData,
        success: true
      }
    })
    
    return {
      success: true,
      queryId: query.id,
      data: processedResults,
      meta: {
        parameters: query.parameters,
        total_parameters: query.parameters.length,
        page: query.page,
        limit: query.limit,
        filters_applied: query.filters.length
      }
    }
  })
}

// Helper function to process a single query (for backward compatibility)
async function processSingleQuery(
  query: z.infer<typeof singleQuerySchema>, 
  websiteId: string
) {
  const queryWithId = { ...query, id: query.id || 'single_query' }
  const results = await processBatchQueries([queryWithId], websiteId)
  return results[0]
}

// New batch processing function that uses unified query
async function processBatchQueries(
  queries: Array<z.infer<typeof singleQuerySchema> & { id: string }>,
  websiteId: string,
  websiteDomain?: string
) {
  try {
    // Build unified query
          const unifiedQuery = buildUnifiedQuery(queries, websiteId, websiteDomain)
    
    // If unified query is empty (no compatible queries), fall back immediately
    if (!unifiedQuery) {
      throw new Error('No unifiable queries found')
    }
    
    // Execute single query
    const rawResults = await chQuery<Record<string, any>>(unifiedQuery)
    
    // Process and group results
    return processUnifiedResults(rawResults, queries, websiteDomain)
    
  } catch (error: any) {
    // If unified query fails (e.g., different metric types), fall back to individual queries
    if (error.message?.includes('Cannot unify queries with different metric types')) {
      logger.info('Using individual queries due to mixed metric types', {
        queries_count: queries.length
      })
    } else {
      logger.error('Unified query failed, falling back to individual queries', {
        error: error.message,
        queries_count: queries.length
      })
    }
    
    return Promise.all(
      queries.map(async (query) => {
        try {
          const { startDate, endDate, parameters, limit, page, filters, timeZone, granularity } = query
          const offset = (page - 1) * limit

          const unsupportedParams = parameters.filter((param: string) => 
            !PARAMETER_BUILDERS[param as keyof typeof PARAMETER_BUILDERS]
          )
          
          if (unsupportedParams.length > 0) {
            return {
              success: false,
              error: `Parameters not supported: ${unsupportedParams.join(', ')}`,
              available_parameters: Object.keys(PARAMETER_BUILDERS),
              queryId: query.id
            }
          }

          const results = await Promise.all(
            parameters.map(async (parameter: string) => {
              const builder = PARAMETER_BUILDERS[parameter as keyof typeof PARAMETER_BUILDERS]
              let sql = builder(websiteId, startDate, `${endDate} 23:59:59`, limit, offset, granularity, timeZone)
              
              if (filters.length > 0) {
                const filterClauses = filters.map((filter: any) => {
                  switch (filter.operator) {
                    case 'eq': return `${filter.field} = ${escapeSqlString(filter.value)}`
                    case 'ne': return `${filter.field} != ${escapeSqlString(filter.value)}`
                    case 'in': return `${filter.field} IN (${Array.isArray(filter.value) ? filter.value.map((v: any) => escapeSqlString(v)).join(',') : escapeSqlString(filter.value)})`
                    case 'contains': return `${filter.field} LIKE '%${escapeSqlString(filter.value)}%'`
                    case 'starts_with': return `${filter.field} LIKE '${escapeSqlString(filter.value)}%'`
                    default: return ''
                  }
                }).filter(Boolean)
                
                if (filterClauses.length > 0) {
                  sql = sql.replace('GROUP BY', `AND ${filterClauses.join(' AND ')}\n    GROUP BY`)
                }
              }

              const result = await chQuery<Record<string, any>>(sql)
              
              // Post-process data based on parameter type (same as unified processing)
              let processedData: any[]
              
              switch (parameter) {
                case 'language':
                  processedData = processLanguageData(result)
                  break
                  
                case 'referrer':
                case 'top_referrers':
                  processedData = processReferrerData(result, websiteDomain)
                  break
                  
                case 'browsers_grouped':
                  processedData = processBrowserGroupedData(result)
                  break
                  
                case 'timezone':
                  processedData = processTimezoneData(result)
                  break
                  
                case 'country':
                case 'countries':
                case 'region':
                case 'regions':
                case 'performance_by_country':
                case 'errors_by_country':
                  processedData = processCountryData(result)
                  break
                  
                case 'custom_events':
                case 'custom_events_by_page':
                case 'custom_events_by_user':
                case 'custom_event_properties':
                  processedData = processCustomEventsData(result)
                  break
                  
                case 'custom_event_details':
                  processedData = processCustomEventDetailsData(result)
                  break
                  
                case 'top_pages':
                case 'entry_pages':
                case 'exit_pages':
                case 'exit_page':
                  processedData = processPageData(result)
                  break
                  
                default:
                  processedData = result
                  break
              }
              
              return { parameter, data: processedData, success: true }
            })
          )

          return {
            success: true,
            queryId: query.id,
            data: results,
            meta: {
              parameters: parameters,
              total_parameters: parameters.length,
              page,
              limit,
              filters_applied: filters.length
            }
          }
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
            queryId: query.id
          }
        }
      })
    )
  }
}

queryRouter.post(
  '/',
  async (c) => {
    const requestData = await c.req.json()
    const website = c.get('website')

    try {
      if (!website?.id) {
        return c.json({ success: false, error: 'Invalid website access' }, 403)
      }

      const queries = Array.isArray(requestData) ? requestData : [requestData]
      
      const queriesWithIds = queries.map((query, index) => ({
        ...query,
        id: query.id || `query_${index}`
      }))
      
      const results = await processBatchQueries(queriesWithIds, website.id, website.domain)

      if (!Array.isArray(requestData)) {
        return c.json(results[0])
      }

      return c.json({
        success: true,
        batch: true,
        results: results,
        meta: {
          total_queries: queries.length,
          successful_queries: results.filter(r => r.success).length,
          failed_queries: results.filter(r => !r.success).length
        }
      })

    } catch (error: any) {
      logger.error('Batch query failed', {
        error: error.message,
        website_id: website.id,
        queries_count: Array.isArray(requestData) ? requestData.length : 1
      })
      
      return c.json({ 
        success: false, 
        error: 'Query processing failed'
      }, 500)
    }
  }
)

// Get available parameters
queryRouter.get('/parameters', async (c) => {
  return c.json({
    success: true,
    parameters: Object.keys(PARAMETER_BUILDERS),
    categories: {
      summary: ['summary_metrics', 'today_metrics', 'events_by_date', 'sessions_summary'],
      device: ['device_type', 'device_types', 'browser_name', 'browsers_grouped', 'browser_versions', 'os_name', 'screen_resolution', 'connection_type'],
      geography: ['country', 'region', 'timezone', 'language'],
      pages: ['top_pages', 'entry_pages', 'exit_page', 'exit_pages'],
      utm: ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_sources', 'utm_mediums', 'utm_campaigns'],
      referrers: ['referrer', 'top_referrers'],
      performance: ['slow_pages', 'performance_by_country', 'performance_by_device', 'performance_by_browser', 'performance_by_os', 'performance_by_region'],
      errors: ['recent_errors', 'error_types', 'errors_by_page', 'errors_by_browser', 'errors_by_os', 'errors_by_country', 'errors_by_device', 'error_trends'],
      web_vitals: ['web_vitals_overview', 'web_vitals_by_page', 'web_vitals_by_device', 'web_vitals_trends'],
      custom_events: ['custom_events', 'custom_event_details', 'custom_events_by_page', 'custom_events_by_user', 'custom_event_properties', 'custom_event_property_values'],
      user_journeys: ['user_journeys', 'journey_paths', 'journey_dropoffs', 'journey_entry_points'],
      funnel_analysis: ['funnel_analysis', 'funnel_performance', 'funnel_steps_breakdown', 'funnel_user_segments']
    }
  })
})

export default queryRouter 