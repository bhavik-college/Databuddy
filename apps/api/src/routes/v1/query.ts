import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

import { authMiddleware } from '../../middleware/auth'
import { websiteAuthHook } from '../../middleware/website'
import { timezoneMiddleware } from '../../middleware/timezone'
import { logger } from '../../lib/logger'
import { chQuery } from '@databuddy/db'
import { getLanguageName } from '@databuddy/shared'

// Single query schema
const singleQuerySchema = z.object({
  id: z.string().optional(), // Optional ID to identify the query in the batch
  startDate: z.string(),
  endDate: z.string(),
  timeZone: z.string().default('UTC'),
  parameters: z.array(z.string()).min(1),
  limit: z.number().min(1).max(1000).default(100),
  page: z.number().min(1).default(1),
  filters: z.array(z.object({
    field: z.string(),
    operator: z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'not_in', 'contains', 'starts_with']),
    value: z.union([z.string(), z.number(), z.array(z.union([z.string(), z.number()]))])
  })).default([])
})

// Batch query schema - supports both single query and array of queries
const batchQuerySchema = z.union([
  singleQuerySchema, // Single query (backward compatibility)
  z.array(singleQuerySchema).min(1).max(10) // Array of queries (max 10 for performance)
])

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
      `time >= ${escapeSqlString(startDate)}`,
      `time <= ${escapeSqlString(endDate)}`
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
    eventName: 'screen_view',
    extraWhere: "device_type != ''",
    orderBy: 'visitors DESC'
  }),

  browser_name: createQueryBuilder({
    metricSet: METRICS.standard,
    nameColumn: 'browser_name',
    groupByColumns: ['browser_name'],
    eventName: 'screen_view',
    extraWhere: "browser_name != ''",
    orderBy: 'visitors DESC'
  }),

  os_name: createQueryBuilder({
    metricSet: METRICS.standard,
    nameColumn: 'os_name',
    groupByColumns: ['os_name'],
    eventName: 'screen_view',
    extraWhere: "os_name != ''",
    orderBy: 'visitors DESC'
  }),

  // Geography
  country: createQueryBuilder({
    metricSet: METRICS.standard,
    nameColumn: 'country',
    groupByColumns: ['country'],
    eventName: 'screen_view',
    extraWhere: "country != ''",
    orderBy: 'visitors DESC'
  }),

  region: createQueryBuilder({
    metricSet: METRICS.standard,
    nameColumn: "CONCAT(region, ', ', country)",
    groupByColumns: ['region', 'country'],
    eventName: 'screen_view',
    extraWhere: "region != ''",
    orderBy: 'visitors DESC'
  }),
  
  timezone: createQueryBuilder({
    metricSet: METRICS.standard,
    nameColumn: 'timezone',
    groupByColumns: ['timezone'],
    eventName: 'screen_view',
    extraWhere: "timezone != ''",
    orderBy: 'visitors DESC'
  }),

  language: createQueryBuilder({
    metricSet: METRICS.standard,
    nameColumn: 'language',
    groupByColumns: ['language'],
    eventName: 'screen_view',
    extraWhere: "language != '' AND language IS NOT NULL",
    orderBy: 'visitors DESC'
  }),

  // Pages
  top_pages: createQueryBuilder({
    metricSet: METRICS.standard,
    nameColumn: 'path',
    groupByColumns: ['path'],
    eventName: 'screen_view',
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
    eventName: 'screen_view',
    extraWhere: "utm_source != ''",
    orderBy: 'visitors DESC'
  }),

  utm_medium: createQueryBuilder({
    metricSet: METRICS.standard,
    nameColumn: 'utm_medium',
    groupByColumns: ['utm_medium'],
    eventName: 'screen_view',
    extraWhere: "utm_medium != ''",
    orderBy: 'visitors DESC'
  }),

  utm_campaign: createQueryBuilder({
    metricSet: METRICS.standard,
    nameColumn: 'utm_campaign',
    groupByColumns: ['utm_campaign'],
    eventName: 'screen_view',
    extraWhere: "utm_campaign != ''",
    orderBy: 'visitors DESC'
  }),

  utm_content: createQueryBuilder({
    metricSet: METRICS.standard,
    nameColumn: 'utm_content',
    groupByColumns: ['utm_content'],
    eventName: 'screen_view',
    extraWhere: "utm_content != ''",
    orderBy: 'visitors DESC'
  }),

  utm_term: createQueryBuilder({
    metricSet: METRICS.standard,
    nameColumn: 'utm_term',
    groupByColumns: ['utm_term'],
    eventName: 'screen_view',
    extraWhere: "utm_term != ''",
    orderBy: 'visitors DESC'
  }),

  // Referrers
  referrer: createQueryBuilder({
    metricSet: METRICS.standard,
    nameColumn: 'referrer',
    groupByColumns: ['referrer'],
    eventName: 'screen_view',
    extraWhere: "referrer != ''",
    orderBy: 'visitors DESC'
  }),

  slow_pages: createQueryBuilder({
    metricSet: METRICS.performance,
    nameColumn: 'path',
    groupByColumns: ['path'],
    eventName: 'screen_view',
    extraWhere: "load_time > 0 AND path != ''",
    orderBy: 'avg_load_time DESC'
  }),

  performance_by_country: createQueryBuilder({
    metricSet: METRICS.performance,
    nameColumn: 'country',
    groupByColumns: ['country'],
    eventName: 'screen_view',
    extraWhere: "load_time > 0 AND country != ''",
    orderBy: 'avg_load_time DESC'
  }),

  performance_by_device: createQueryBuilder({
    metricSet: METRICS.performance,
    nameColumn: 'device_type',
    groupByColumns: ['device_type'],
    eventName: 'screen_view',
    extraWhere: "load_time > 0 AND device_type != ''",
    orderBy: 'avg_load_time DESC'
  }),

  performance_by_browser: createQueryBuilder({
    metricSet: METRICS.performance,
    nameColumn: 'browser_name',
    groupByColumns: ['browser_name'],
    eventName: 'screen_view',
    extraWhere: "load_time > 0 AND browser_name != ''",
    orderBy: 'avg_load_time DESC'
  }),

  performance_by_os: createQueryBuilder({
    metricSet: METRICS.performance,
    nameColumn: 'os_name',
    groupByColumns: ['os_name'],
    eventName: 'screen_view',
    extraWhere: "load_time > 0 AND os_name != ''",
    orderBy: 'avg_load_time DESC'
  }),

  performance_by_region: createQueryBuilder({
    metricSet: METRICS.performance,
    nameColumn: "CONCAT(region, ', ', country)",
    groupByColumns: ['region', 'country'],
    eventName: 'screen_view',
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
      os_name,
      device_type,
      country,
      region
    FROM analytics.events
    WHERE client_id = ${escapeSqlString(websiteId)}
      AND time >= ${escapeSqlString(startDate)}
      AND time <= ${escapeSqlString(endDate)}
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
      AND time >= ${escapeSqlString(startDate)}
      AND time <= ${escapeSqlString(endDate)}
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
    nameColumn: 'browser_name',
    groupByColumns: ['browser_name'],
    eventName: 'error',
    extraWhere: "error_message != '' AND browser_name != ''",
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
      AND time >= ${escapeSqlString(startDate)}
      AND time <= ${escapeSqlString(endDate)}
      AND event_name = 'error'
      AND error_message != ''
    GROUP BY toDate(time)
    ORDER BY date DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  sessions_summary: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number) => `
    SELECT
      uniq(session_id) as total_sessions,
      uniq(anonymous_id) as total_users
    FROM analytics.events
    WHERE client_id = ${escapeSqlString(websiteId)}
      AND time >= ${escapeSqlString(startDate)}
      AND time <= ${escapeSqlString(endDate)}
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
    PARAMETER_BUILDERS.region(websiteId, startDate, endDate, limit, offset)
}

// Helper function to build a unified query for multiple parameters
function buildUnifiedQuery(
  queries: Array<z.infer<typeof singleQuerySchema> & { id: string }>,
  websiteId: string
): string {
  const subQueries: string[] = []
  
  for (const query of queries) {
    const { startDate, endDate, parameters, limit, page, filters } = query
    const offset = (page - 1) * limit
    
    for (const parameter of parameters) {
      const builder = PARAMETER_BUILDERS[parameter as keyof typeof PARAMETER_BUILDERS]
      if (!builder) continue
      
      let sql = builder(websiteId, startDate, endDate, limit, offset)
      
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
          *
        FROM (
          ${sql}
        ) subquery
      `
      
      subQueries.push(wrappedQuery)
    }
  }
  
  return subQueries.join('\nUNION ALL\n')
}

// Helper function to process data after unified query
function processUnifiedResults(
  rawResults: Array<Record<string, any>>,
  queries: Array<z.infer<typeof singleQuerySchema> & { id: string }>
) {
  // Group results by query_id and parameter
  const groupedResults: Record<string, Record<string, any[]>> = {}
  
  for (const row of rawResults) {
    const { query_id, parameter, ...data } = row
    
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
      let processedData = rawData
      
      if (parameter === 'language') {
        processedData = processLanguageData(rawData)
      } else if (parameter === 'timezone') {
        processedData = rawData.map(item => {
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
    
    // Execute single query
    const rawResults = await chQuery<Record<string, any>>(unifiedQuery)
    
    // Process and group results
    return processUnifiedResults(rawResults, queries)
    
  } catch (error: any) {
    // If unified query fails, fall back to individual queries for error isolation
    logger.error('Unified query failed, falling back to individual queries', {
      error: error.message,
      queries_count: queries.length
    })
    
    return Promise.all(
      queries.map(async (query) => {
        try {
          const { startDate, endDate, parameters, limit, page, filters } = query
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
              let sql = builder(websiteId, startDate, endDate, limit, offset)
              
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
              let processedData = result
              
              if (parameter === 'language') {
                processedData = processLanguageData(result)
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
  zValidator('json', batchQuerySchema),
  async (c) => {
    const requestData = c.req.valid('json')
    const website = c.get('website')

    try {
      if (!website?.id) {
        return c.json({ success: false, error: 'Invalid website access' }, 403)
      }

      const queries = Array.isArray(requestData) ? requestData : [requestData]
      
      // Add IDs to queries if not provided
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
      device: ['device_type', 'browser_name', 'os_name'],
      geography: ['country', 'region', 'timezone', 'language'],
      pages: ['top_pages', 'exit_page'],
      utm: ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'],
      referrers: ['referrer'],
      performance: ['slow_pages', 'performance_by_country', 'performance_by_device', 'performance_by_browser', 'performance_by_os', 'performance_by_region'],
      errors: ['recent_errors', 'error_types', 'errors_by_page', 'errors_by_browser', 'errors_by_os', 'errors_by_country', 'errors_by_device', 'error_trends', 'sessions_summary']
    }
  })
})

export default queryRouter 