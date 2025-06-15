import { z } from 'zod'
import { chQuery } from '@databuddy/db'
import { logger } from '../lib/logger'
import { PARAMETER_BUILDERS } from './builders'
import { 
  getMetricType, 
  escapeSqlString,
  processLanguageData,
  processCountryData,
  processPageData,
  processCustomEventsData,
  processCustomEventDetailsData,
  processBrowserGroupedData,
  processReferrerData,
  processTimezoneData,
  processRevenueSummary,
  processRevenueTrends,
  processRecentTransactions,
  processRecentRefunds
} from '.'

// Filter schema
export const filterSchema = z.object({
  field: z.string(),
  operator: z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'not_in', 'contains', 'starts_with']),
  value: z.union([z.string(), z.number(), z.array(z.union([z.string(), z.number()]))])
});

// Query schema
export const querySchema = z.object({
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

export type QueryRequest = z.infer<typeof querySchema> & { id: string }
export type FilterRequest = z.infer<typeof filterSchema>

// Apply filters to SQL query
function applyFilters(sql: string, filters: FilterRequest[]): string {
  if (filters.length === 0) return sql

  const filterClauses = filters.map((filter) => {
    switch (filter.operator) {
      case 'eq': return `${filter.field} = ${escapeSqlString(filter.value as string | number)}`
      case 'ne': return `${filter.field} != ${escapeSqlString(filter.value as string | number)}`
      case 'in': 
        if (Array.isArray(filter.value)) {
          const inValues = filter.value.map((v: any) => escapeSqlString(v)).join(',')
          return `${filter.field} IN (${inValues})`
        }
        return `${filter.field} = ${escapeSqlString(filter.value as string | number)}`
      case 'contains': return `${filter.field} LIKE CONCAT('%', ${escapeSqlString(filter.value as string | number)}, '%')`
      case 'starts_with': return `${filter.field} LIKE CONCAT(${escapeSqlString(filter.value as string | number)}, '%')`
      default: return ''
    }
  }).filter(Boolean)
  
  if (filterClauses.length > 0) {
    if (sql.includes('GROUP BY')) {
      const result = sql.replace('GROUP BY', `AND ${filterClauses.join(' AND ')}\n    GROUP BY`);
      return result;
    } else {
      if (sql.includes('WHERE')) {
        const result = sql.replace(/WHERE/, `WHERE ${filterClauses.join(' AND ')} AND`);
        return result;
      } else {
        return sql;
      }
    }
  }
  
  return sql
}

// Process data based on parameter type
function processParameterData(parameter: string, rawData: any[], websiteDomain?: string): any[] {
  switch (parameter) {
    case 'language':
      return processLanguageData(rawData)
      
    case 'referrer':
    case 'top_referrers':
      return processReferrerData(rawData, websiteDomain)
      
    case 'browsers_grouped':
      return processBrowserGroupedData(rawData)
      
    case 'timezone':
      return processTimezoneData(rawData)
      
    case 'country':
    case 'countries':
    case 'region':
    case 'regions':
    case 'performance_by_country':
    case 'errors_by_country':
      return processCountryData(rawData)
      
    case 'custom_events':
    case 'custom_events_by_page':
    case 'custom_events_by_user':
    case 'custom_event_properties':
      return processCustomEventsData(rawData)
      
    case 'custom_event_details':
      return processCustomEventDetailsData(rawData)
      
    case 'top_pages':
    case 'entry_pages':
    case 'exit_pages':
    case 'exit_page':
      return processPageData(rawData)
      
    case 'revenue_summary':
      return [processRevenueSummary(rawData)]
      
    case 'revenue_trends':
      return processRevenueTrends(rawData)
      
    case 'recent_transactions':
      return processRecentTransactions(rawData)
      
    case 'recent_refunds':
      return processRecentRefunds(rawData)
      
    default:
      return rawData
  }
}

// Extract column structure from a SQL query
function extractColumnStructure(sql: string): string[] {
  // This is a simplified column extraction - in a production system you might want
  // to use a proper SQL parser, but for now we'll use pattern matching
  const selectMatch = sql.match(/SELECT\s+(.*?)\s+FROM/is)
  if (!selectMatch) return []
  
  const selectClause = selectMatch[1]
  // Split by comma but handle nested functions and aliases
  const columns = selectClause
    .split(',')
    .map(col => {
      // Extract the final alias or column name
      const trimmed = col.trim()
      const asMatch = trimmed.match(/\s+as\s+(\w+)$/i)
      if (asMatch) {
        return asMatch[1]
      }
      // If no alias, try to extract the column name
      const parts = trimmed.split(/\s+/)
      return parts[parts.length - 1].replace(/['"]/g, '')
    })
    .filter(col => col && col !== '*')
  
  return columns
}

// Check if two column structures are compatible for UNION ALL
function areColumnStructuresCompatible(columns1: string[], columns2: string[]): boolean {
  if (columns1.length !== columns2.length) return false
  
  // For now, we require exact column name matches in the same order
  // In a more sophisticated system, you might allow type-compatible columns
  for (let i = 0; i < columns1.length; i++) {
    if (columns1[i].toLowerCase() !== columns2[i].toLowerCase()) {
      return false
    }
  }
  
  return true
}

// Group queries by compatible column structures
function groupQueriesByColumnStructure(
  queries: QueryRequest[],
  websiteId: string,
  websiteDomain?: string
): Array<{
  queries: Array<{ query: QueryRequest, parameter: string }>,
  columnStructure: string[]
}> {
  const groups: Array<{
    queries: Array<{ query: QueryRequest, parameter: string }>,
    columnStructure: string[]
  }> = []
  
  for (const query of queries) {
    const { parameters } = query
    
    for (const parameter of parameters) {
      const builder = PARAMETER_BUILDERS[parameter as keyof typeof PARAMETER_BUILDERS]
      if (!builder) continue
      
      const { startDate, endDate, limit, page, filters, timeZone, granularity } = query
      const offset = (page - 1) * limit
      
      let sql = builder(websiteId, startDate, `${endDate} 23:59:59`, limit, offset, granularity, timeZone, filters)
      
      // Don't apply generic filters to revenue queries - they handle filtering internally
      const isRevenueQuery = parameter.startsWith('revenue_') || parameter.startsWith('recent_') || parameter === 'all_revenue_by_client'
      if (!isRevenueQuery) {
        sql = applyFilters(sql, filters)
      }
      
      const columnStructure = extractColumnStructure(sql)
      
      // Find a compatible group
      let compatibleGroup = groups.find(group => 
        areColumnStructuresCompatible(group.columnStructure, columnStructure)
      )
      
      if (compatibleGroup) {
        compatibleGroup.queries.push({ query, parameter })
      } else {
        // Create a new group
        groups.push({
          queries: [{ query, parameter }],
          columnStructure
        })
      }
    }
  }
  
  return groups
}

// Build unified query for multiple parameters with column structure validation
function buildUnifiedQuery(
  queries: QueryRequest[],
  websiteId: string,
  websiteDomain?: string
): string {
  // Group queries by compatible column structures
  const columnGroups = groupQueriesByColumnStructure(queries, websiteId, websiteDomain)
  
  // If we have multiple incompatible groups, we can't create a unified query
  if (columnGroups.length > 1) {
    logger.info('Cannot unify queries due to incompatible column structures', {
      groups_count: columnGroups.length,
      group_details: columnGroups.map(group => ({
        query_count: group.queries.length,
        parameters: group.queries.map(q => q.parameter),
        columns: group.columnStructure
      }))
    })
    throw new Error('Cannot unify queries with incompatible column structures')
  }
  
  if (columnGroups.length === 0) {
    throw new Error('No valid queries found')
  }
  
  const group = columnGroups[0]
  const subQueries: string[] = []
  
  for (const { query, parameter } of group.queries) {
    const { startDate, endDate, limit, page, filters, timeZone, granularity } = query
    const offset = (page - 1) * limit
    
    const builder = PARAMETER_BUILDERS[parameter as keyof typeof PARAMETER_BUILDERS]
    if (!builder) continue
    
    let sql = builder(websiteId, startDate, `${endDate} 23:59:59`, limit, offset, granularity, timeZone, filters)
    
    // Don't apply generic filters to revenue queries - they handle filtering internally
    const isRevenueQuery = parameter.startsWith('revenue_') || parameter.startsWith('recent_') || parameter === 'all_revenue_by_client'
    if (!isRevenueQuery) {
      sql = applyFilters(sql, filters)
    }
    
    // Add query and parameter identifiers to the result
    const wrappedQuery = `
      SELECT 
        '${query.id}' as query_id,
        '${parameter}' as parameter,
        '${getMetricType(parameter)}' as metric_type,
        *
      FROM (
        ${sql}
      ) subquery
    `
    
    subQueries.push(wrappedQuery)
  }
  
  if (subQueries.length === 0) {
    throw new Error('No valid subqueries generated')
  }
  
  return subQueries.join('\nUNION ALL\n')
}

// Process unified query results
function processUnifiedResults(
  rawResults: Array<Record<string, any>>,
  queries: QueryRequest[],
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
      const processedData = processParameterData(parameter, rawData, websiteDomain)
      
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

// Execute individual query (fallback method)
async function executeIndividualQuery(query: QueryRequest, websiteId: string, websiteDomain?: string) {
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
      let sql = builder(websiteId, startDate, `${endDate} 23:59:59`, limit, offset, granularity, timeZone, filters)
      
      const isRevenueQuery = parameter.startsWith('revenue_') || parameter.startsWith('recent_') || parameter === 'all_revenue_by_client'
      if (!isRevenueQuery) {
        sql = applyFilters(sql, filters)
      }

      const result = await chQuery<Record<string, any>>(sql)
      const processedData = processParameterData(parameter, result, websiteDomain)
      
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
}

// Main batch query execution function
export async function executeBatchQueries(
  queries: QueryRequest[],
  websiteId: string,
  websiteDomain?: string
) {
  try {
    // Try unified query first
    const unifiedQuery = buildUnifiedQuery(queries, websiteId, websiteDomain)
    
    if (!unifiedQuery) {
      throw new Error('No unifiable queries found')
    }
    
    const rawResults = await chQuery<Record<string, any>>(unifiedQuery)
    return processUnifiedResults(rawResults, queries, websiteDomain)
    
  } catch (error: any) {
    // Fall back to individual queries
    if (error.message?.includes('Cannot unify queries with different metric types')) {
      logger.info('Using individual queries due to mixed metric types', {
        queries_count: queries.length
      })
    } else if (error.message?.includes('Cannot unify queries with incompatible column structures')) {
      logger.info('Using individual queries due to incompatible column structures', {
        queries_count: queries.length,
        error: error.message
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
          return await executeIndividualQuery(query, websiteId, websiteDomain)
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

// Single query execution (for backward compatibility)
export async function executeSingleQuery(
  query: z.infer<typeof querySchema>, 
  websiteId: string,
  websiteDomain?: string
) {
  const queryWithId = { ...query, id: query.id || 'single_query' }
  const results = await executeBatchQueries([queryWithId], websiteId, websiteDomain)
  return results[0]
} 