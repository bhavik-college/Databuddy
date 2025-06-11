import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

import { authMiddleware } from '../../middleware/auth'
import { websiteAuthHook } from '../../middleware/website'
import { timezoneMiddleware } from '../../middleware/timezone'
import { adjustDateRangeForTimezone } from '../../utils/timezone'
import { logger } from '../../lib/logger'
import { chQuery } from '@databuddy/db'
import { getLanguageName } from '@databuddy/shared'

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
  filters: z.array(filterSchema).default([])
});

const batchQuerySchema = z.union([
  singleQuerySchema,
  z.array(singleQuerySchema).max(10)
]);

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
  offset: number
) => string;

const processLanguageData = (data: any[]) => 
  data.map(item => ({
    ...item,
    name: getLanguageName(item.name) !== 'Unknown' ? getLanguageName(item.name) : item.name,
    code: item.name
  }))

// Helper function to transform country codes
const processCountryData = (data: any[]) => 
  data.map(item => ({
    ...item,
    name: item.name === 'IL' ? 'PS' : item.name,
    country: item.country === 'IL' ? 'PS' : item.country
  }))

// Helper function to process custom events data
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
      // Parse event types if it's an array string
      event_types: typeof item.event_types === 'string' ? 
        JSON.parse(item.event_types) : item.event_types,
      // Format timestamps
      last_occurrence: item.last_occurrence ? new Date(item.last_occurrence).toISOString() : null,
      first_occurrence: item.first_occurrence ? new Date(item.first_occurrence).toISOString() : null,
      last_event_time: item.last_event_time ? new Date(item.last_event_time).toISOString() : null,
      first_event_time: item.first_event_time ? new Date(item.first_event_time).toISOString() : null,
    };
  })

// Helper function to process custom event details with expanded properties
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
      // Add expandable properties as subrows data
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

function createQueryBuilder(config: BuilderConfig): ParameterBuilder {
  return (websiteId, startDate, endDate, limit, offset) => {
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
    
    const sql = `
      SELECT 
        ${config.nameColumn} as name,
        ${config.metricSet}
      FROM analytics.events
      WHERE ${whereClauses.join(' AND ')}
      GROUP BY ${config.groupByColumns.join(', ')}
      ORDER BY ${config.orderBy}
      LIMIT ${limit} OFFSET ${offset}
    `;

    return sql;
  };
}

// Dynamic parameter registry - now with parameterized queries and reduced duplication
const PARAMETER_BUILDERS: Record<string, ParameterBuilder> = {
  // Device & Browser
  device_type: createQueryBuilder({
    metricSet: METRICS.standard,
    nameColumn: 'device_type',
    groupByColumns: ['device_type'],
    extraWhere: "device_type != ''",
    orderBy: 'visitors DESC'
  }),

  browser_name: createQueryBuilder({
    metricSet: METRICS.standard,
    nameColumn: "CONCAT(browser_name, ' ', browser_version)",
    groupByColumns: ['browser_name', 'browser_version'],
    extraWhere: "browser_name != '' AND browser_version IS NOT NULL AND browser_version != ''",
    orderBy: 'visitors DESC'
  }),

  browsers_grouped: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number) => `
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

  os_name: createQueryBuilder({
    metricSet: METRICS.standard,
    nameColumn: 'os_name',
    groupByColumns: ['os_name'],
    extraWhere: "os_name != ''",
    orderBy: 'visitors DESC'
  }),

  screen_resolution: createQueryBuilder({
    metricSet: METRICS.standard,
    nameColumn: 'screen_resolution',
    groupByColumns: ['screen_resolution'],
    extraWhere: "screen_resolution != '' AND screen_resolution IS NOT NULL",
    orderBy: 'visitors DESC'
  }),

  connection_type: createQueryBuilder({
    metricSet: METRICS.standard,
    nameColumn: 'connection_type',
    groupByColumns: ['connection_type'],
    extraWhere: "connection_type != '' AND connection_type IS NOT NULL",
    orderBy: 'visitors DESC'
  }),

  // Geography
  country: createQueryBuilder({
    metricSet: METRICS.standard,
    nameColumn: 'country',
    groupByColumns: ['country'],
    extraWhere: "country != ''",
    orderBy: 'visitors DESC'
  }),

  region: createQueryBuilder({
    metricSet: METRICS.standard,
    nameColumn: "CONCAT(region, ', ', country)",
    groupByColumns: ['region', 'country'],
    extraWhere: "region != ''",
    orderBy: 'visitors DESC'
  }),
  
  timezone: createQueryBuilder({
    metricSet: METRICS.standard,
    nameColumn: 'timezone',
    groupByColumns: ['timezone'],
    extraWhere: "timezone != ''",
    orderBy: 'visitors DESC'
  }),

  language: createQueryBuilder({
    metricSet: METRICS.standard,
    nameColumn: 'language',
    groupByColumns: ['language'],
    extraWhere: "language != '' AND language IS NOT NULL",
    orderBy: 'visitors DESC'
  }),

  // Pages
  top_pages: createQueryBuilder({
    metricSet: METRICS.standard,
    nameColumn: 'path',
    groupByColumns: ['path'],
    extraWhere: "path != ''",
    orderBy: 'pageviews DESC'
  }),

  exit_page: createQueryBuilder({
    metricSet: METRICS.exits,
    nameColumn: 'path',
    groupByColumns: ['path'],
    extraWhere: "exit_intent = 1 AND path != ''",
    orderBy: 'exits DESC'
  }),

  // UTM
  utm_source: createQueryBuilder({
    metricSet: METRICS.standard,
    nameColumn: 'utm_source',
    groupByColumns: ['utm_source'],
    extraWhere: "utm_source != ''",
    orderBy: 'visitors DESC'
  }),

  utm_medium: createQueryBuilder({
    metricSet: METRICS.standard,
    nameColumn: 'utm_medium',
    groupByColumns: ['utm_medium'],
    extraWhere: "utm_medium != ''",
    orderBy: 'visitors DESC'
  }),

  utm_campaign: createQueryBuilder({
    metricSet: METRICS.standard,
    nameColumn: 'utm_campaign',
    groupByColumns: ['utm_campaign'],
    extraWhere: "utm_campaign != ''",
    orderBy: 'visitors DESC'
  }),

  utm_content: createQueryBuilder({
    metricSet: METRICS.standard,
    nameColumn: 'utm_content',
    groupByColumns: ['utm_content'],
    extraWhere: "utm_content != ''",
    orderBy: 'visitors DESC'
  }),

  utm_term: createQueryBuilder({
    metricSet: METRICS.standard,
    nameColumn: 'utm_term',
    groupByColumns: ['utm_term'],
    extraWhere: "utm_term != ''",
    orderBy: 'visitors DESC'
  }),

  // Referrers
  referrer: createQueryBuilder({
    metricSet: METRICS.standard,
    nameColumn: 'referrer',
    groupByColumns: ['referrer'],
    extraWhere: "referrer != ''",
    orderBy: 'visitors DESC'
  }),

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

  // Error-related queries (special cases that don't fit the standard builder)
  recent_errors: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number) => `
    SELECT 
      error_message,
      error_stack,
      path as page_url,
      anonymous_id,
      session_id,
      time,
      browser_name,
      browser_version,
      os_name,
      device_type,
      country,
      region
    FROM analytics.events
    WHERE client_id = ${escapeSqlString(websiteId)}
      AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
      AND event_name = 'error'
      AND error_message != ''
    ORDER BY time DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  error_types: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number) => `
    SELECT 
      error_message as name,
      COUNT(*) as total_occurrences,
      uniq(anonymous_id) as affected_users,
      uniq(session_id) as affected_sessions,
      MAX(time) as last_occurrence,
      MIN(time) as first_occurrence
    FROM analytics.events
    WHERE client_id = ${escapeSqlString(websiteId)}
      AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
      AND event_name = 'error'
      AND error_message != ''
    GROUP BY error_message
    ORDER BY total_occurrences DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  errors_by_page: createQueryBuilder({
    metricSet: METRICS.errors,
    nameColumn: 'path',
    groupByColumns: ['path'],
    eventName: 'error',
    extraWhere: "error_message != '' AND path != ''",
    orderBy: 'total_errors DESC'
  }),

  errors_by_browser: createQueryBuilder({
    metricSet: METRICS.errors,
    nameColumn: "CONCAT(browser_name, ' ', browser_version)",
    groupByColumns: ['browser_name', 'browser_version'],
    eventName: 'error',
    extraWhere: "error_message != '' AND browser_name != '' AND browser_version IS NOT NULL AND browser_version != ''",
    orderBy: 'total_errors DESC'
  }),

  errors_by_os: createQueryBuilder({
    metricSet: METRICS.errors,
    nameColumn: 'os_name',
    groupByColumns: ['os_name'],
    eventName: 'error',
    extraWhere: "error_message != '' AND os_name != ''",
    orderBy: 'total_errors DESC'
  }),

  errors_by_country: createQueryBuilder({
    metricSet: METRICS.errors,
    nameColumn: 'country',
    groupByColumns: ['country'],
    eventName: 'error',
    extraWhere: "error_message != '' AND country != ''",
    orderBy: 'total_errors DESC'
  }),

  errors_by_device: createQueryBuilder({
    metricSet: METRICS.errors,
    nameColumn: 'device_type',
    groupByColumns: ['device_type'],
    eventName: 'error',
    extraWhere: "error_message != '' AND device_type != ''",
    orderBy: 'total_errors DESC'
  }),

  error_trends: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number) => `
    SELECT 
      toDate(time) as date,
      COUNT(*) as total_errors,
      COUNT(DISTINCT error_message) as unique_error_types,
      uniq(anonymous_id) as affected_users,
      uniq(session_id) as affected_sessions
    FROM analytics.events
    WHERE client_id = ${escapeSqlString(websiteId)}
      AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
      AND event_name = 'error'
      AND error_message != ''
    GROUP BY toDate(time)
    ORDER BY date DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  // Custom Events queries
  custom_events: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number) => `
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

  custom_event_details: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number) => `
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

  custom_events_by_page: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number) => `
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

  custom_events_by_user: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number) => `
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

  custom_event_properties: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number) => `
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

  sessions_summary: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number) => `
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
  test_data: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number) => `
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

  // Category aliases for simplified parameter names
  pages: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number) => 
    PARAMETER_BUILDERS.top_pages(websiteId, startDate, endDate, limit, offset),
  
  countries: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number) => 
    PARAMETER_BUILDERS.country(websiteId, startDate, endDate, limit, offset),
    
  devices: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number) => 
    PARAMETER_BUILDERS.device_type(websiteId, startDate, endDate, limit, offset),
    
  browsers: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number) => 
    PARAMETER_BUILDERS.browser_name(websiteId, startDate, endDate, limit, offset),
    
  operating_systems: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number) => 
    PARAMETER_BUILDERS.os_name(websiteId, startDate, endDate, limit, offset),
    
  regions: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number) => 
    PARAMETER_BUILDERS.region(websiteId, startDate, endDate, limit, offset),
    
  screen_resolutions: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number) => 
    PARAMETER_BUILDERS.screen_resolution(websiteId, startDate, endDate, limit, offset),
    
  connection_types: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number) => 
    PARAMETER_BUILDERS.connection_type(websiteId, startDate, endDate, limit, offset),

  custom_event_property_values: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, filters: any[] = []) => {
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
  funnel_analysis: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, filters: any[] = []) => {
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

  funnel_performance: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number) => `
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
  funnel_steps_breakdown: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, filters: any[] = []) => {
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

  funnel_user_segments: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, filters: any[] = []) => {
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
  user_journeys: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number) => `
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

  journey_paths: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number) => `
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

  journey_dropoffs: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number) => `
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

  journey_entry_points: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number) => `
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
  
  const exitParams = ['exit_page']
  
  const specialParams = ['sessions_summary']
  
  if (performanceParams.includes(parameter)) return 'performance'
  if (errorParams.includes(parameter)) return 'errors'
  if (exitParams.includes(parameter)) return 'exits'
  if (specialParams.includes(parameter)) return 'special'
  
  return 'standard'
}

// Helper function to build a unified query for multiple parameters
function buildUnifiedQuery(
  queries: Array<z.infer<typeof singleQuerySchema> & { id: string }>,
  websiteId: string
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
      const { startDate, endDate, limit, page, filters, timeZone } = query
      const offset = (page - 1) * limit
      
      const { startDate: adjStartDate, endDate: adjEndDate } = adjustDateRangeForTimezone(startDate, endDate, timeZone);
      
      const builder = PARAMETER_BUILDERS[parameter as keyof typeof PARAMETER_BUILDERS]
      if (!builder) continue
      
      let sql = builder(websiteId, adjStartDate, `${adjEndDate} 23:59:59`, limit, offset)
      
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
  queries: Array<z.infer<typeof singleQuerySchema> & { id: string }>
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
  websiteId: string
) {
  try {
    // Build unified query
    const unifiedQuery = buildUnifiedQuery(queries, websiteId)
    
    // If unified query is empty (no compatible queries), fall back immediately
    if (!unifiedQuery) {
      throw new Error('No unifiable queries found')
    }
    
    // Execute single query
    const rawResults = await chQuery<Record<string, any>>(unifiedQuery)
    
    // Process and group results
    return processUnifiedResults(rawResults, queries)
    
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
          const { startDate, endDate, parameters, limit, page, filters, timeZone } = query
          const offset = (page - 1) * limit

          const { startDate: adjStartDate, endDate: adjEndDate } = adjustDateRangeForTimezone(startDate, endDate, timeZone);

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
              let sql = builder(websiteId, adjStartDate, `${adjEndDate} 23:59:59`, limit, offset)
              
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
      
      const results = await processBatchQueries(queriesWithIds, website.id)

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
      device: ['device_type', 'browser_name', 'browsers_grouped', 'os_name', 'screen_resolution', 'connection_type'],
      geography: ['country', 'region', 'timezone', 'language'],
      pages: ['top_pages', 'exit_page'],
      utm: ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'],
      referrers: ['referrer'],
      performance: ['slow_pages', 'performance_by_country', 'performance_by_device', 'performance_by_browser', 'performance_by_os', 'performance_by_region'],
      errors: ['recent_errors', 'error_types', 'errors_by_page', 'errors_by_browser', 'errors_by_os', 'errors_by_country', 'errors_by_device', 'error_trends', 'sessions_summary'],
      custom_events: ['custom_events', 'custom_event_details', 'custom_events_by_page', 'custom_events_by_user', 'custom_event_properties', 'custom_event_property_values'],
      user_journeys: ['user_journeys', 'journey_paths', 'journey_dropoffs', 'journey_entry_points'],
      funnel_analysis: ['funnel_analysis', 'funnel_performance', 'funnel_steps_breakdown', 'funnel_user_segments']
    }
  })
})

export default queryRouter 