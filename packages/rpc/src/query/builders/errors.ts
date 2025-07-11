import type { QueryBuilderGroup } from '../types'
import { createQueryBuilder } from '../builder-utils'
import { buildCommonSelect, buildCommonWhereClauses, buildCommonGroupBy, buildCommonOrderBy } from '../utils'

/**
 * Creates a builder for fetching error types data
 */
function createErrorTypesBuilder(
  websiteId: string,
  dateRange: { from: string; to: string },
  filters?: Record<string, unknown>,
  limit = 10,
  offset = 0
) {
  const builder = createQueryBuilder('analytics.events', ['event_name = \'error\''])

  const select = buildCommonSelect({
    error_type: 'error_type',
    error_message: 'error_message',
    count: 'COUNT(*) as count',
    unique_users: 'COUNT(DISTINCT anonymous_id) as unique_users',
    last_occurrence: 'MAX(time) as last_occurrence',
  })

  const { clause: whereClause, params: whereParams } = buildCommonWhereClauses(
    websiteId,
    dateRange.from,
    dateRange.to,
    { event_filter: 'event_name = \'error\'' }
  )

  const groupBy = buildCommonGroupBy({
    error_type: 'error_type',
    error_message: 'error_message',
  })

  const orderBy = buildCommonOrderBy({ count: 'count DESC' })

  const query = 
    'SELECT ' + select +
    ' FROM analytics.events' +
    ' WHERE ' + whereClause +
    ' GROUP BY ' + groupBy +
    ' ORDER BY ' + orderBy +
    ' LIMIT {limit:UInt64} OFFSET {offset:UInt64}'

  return {
    query,
    params: {
      ...whereParams,
      limit,
      offset
    }
  }
}

/**
 * Creates a builder for fetching detailed error data
 */
function createErrorDetailsBuilder(
  websiteId: string,
  dateRange: { from: string; to: string },
  filters?: Record<string, unknown>,
  limit = 100,
  offset = 0
) {
  const select = buildCommonSelect({
    error_type: 'error_type',
    error_message: 'error_message',
    error_filename: 'error_filename',
    error_lineno: 'error_lineno',
    error_colno: 'error_colno',
    error_stack: 'error_stack',
    url: 'url',
    user_agent: 'user_agent',
    time: 'time',
    anonymous_id: 'anonymous_id',
  })

  const { clause: whereClause, params: whereParams } = buildCommonWhereClauses(
    websiteId,
    dateRange.from,
    dateRange.to,
    { event_filter: 'event_name = \'error\'' }
  )

  const orderBy = buildCommonOrderBy({ time: 'time DESC' })

  const query = 
    'SELECT ' + select +
    ' FROM analytics.events' +
    ' WHERE ' + whereClause +
    ' ORDER BY ' + orderBy +
    ' LIMIT {limit:UInt64} OFFSET {offset:UInt64}'

  return {
    query,
    params: {
      ...whereParams,
      limit,
      offset
    }
  }
}

/**
 * Creates a builder for fetching error data for a specific error type
 */
function createErrorTypeDetailsBuilder(
  websiteId: string,
  errorType: string,
  dateRange: { from: string; to: string },
  filters?: Record<string, unknown>,
  limit = 100,
  offset = 0
) {
  const select = buildCommonSelect({
    error_message: 'error_message',
    error_filename: 'error_filename',
    error_lineno: 'error_lineno',
    error_colno: 'error_colno',
    error_stack: 'error_stack',
    url: 'url',
    path: 'path',
    time: 'time',
    browser_name: 'browser_name',
    os_name: 'os_name',
  })

  const { clause: whereClause, params: whereParams } = buildCommonWhereClauses(
    websiteId,
    dateRange.from,
    dateRange.to,
    { 
      event_filter: 'event_name = \'error\'',
      error_type_filter: 'error_type = {errorType:String}'
    }
  )

  const orderBy = buildCommonOrderBy({ time: 'time DESC' })

  const query = 
    'SELECT ' + select +
    ' FROM analytics.events' +
    ' WHERE ' + whereClause +
    ' ORDER BY ' + orderBy +
    ' LIMIT {limit:UInt64} OFFSET {offset:UInt64}'

  return {
    query,
    params: {
      ...whereParams,
      errorType,
      limit,
      offset
    }
  }
}

/**
 * Creates a builder for fetching error frequency over time
 */
function createErrorFrequencyBuilder(
  websiteId: string,
  errorType: string,
  dateRange: { from: string; to: string },
  filters?: Record<string, unknown>
) {
  const query = 
    'WITH date_range AS (' +
    '  SELECT arrayJoin(arrayMap(' +
    '    d -> toDate({startDate:String}) + d,' +
    '    range(toUInt32(dateDiff(\'day\', toDate({startDate:String}), toDate({endDate:String})) + 1))' +
    '  )) AS date' +
    '),' +
    'daily_errors AS (' +
    '  SELECT ' +
    '    toDate(time) as error_date,' +
    '    COUNT(*) as error_count' +
    '  FROM analytics.events' +
    '  WHERE ' +
    '    client_id = {websiteId:String}' +
    '    AND time >= parseDateTimeBestEffort({startDate:String})' +
    '    AND time <= parseDateTimeBestEffort({endDate:String})' +
    '    AND event_name = \'error\'' +
    '    AND error_type = {errorType:String}' +
    '  GROUP BY error_date' +
    ')' +
    'SELECT' +
    '  date_range.date,' +
    '  COALESCE(de.error_count, 0) as count' +
    'FROM date_range' +
    'LEFT JOIN daily_errors de ON date_range.date = de.error_date' +
    'ORDER BY date_range.date ASC'

  return {
    query,
    params: {
      websiteId,
      startDate: dateRange.from,
      endDate: dateRange.to,
      errorType
    }
  }
}

export const errorBuilders: QueryBuilderGroup = {
  recent_errors: (websiteId, dateRange, filters, limit, offset) =>
    createErrorDetailsBuilder(websiteId, dateRange, filters, limit, offset),

  error_types: (websiteId, dateRange, filters, limit, offset) =>
    createErrorTypesBuilder(websiteId, dateRange, filters, limit, offset),

  error_trends: (websiteId, dateRange, filters, limit, offset) =>
    createErrorFrequencyBuilder(websiteId, 'general', dateRange, filters),

  error_details: (websiteId, dateRange, filters, limit, offset) => {
    const errorType = filters?.error_type as string || 'general'
    return createErrorTypeDetailsBuilder(websiteId, errorType, dateRange, filters, limit, offset)
  }
} 