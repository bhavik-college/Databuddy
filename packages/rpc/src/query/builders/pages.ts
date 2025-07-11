import type { QueryBuilderGroup } from '../types'
import { buildCommonSelect, buildCommonWhereClauses, buildCommonGroupBy, buildCommonOrderBy } from '../utils'

/**
 * Creates a builder for fetching page analytics data
 */
function createPagesBuilder(
  websiteId: string,
  dateRange: { from: string; to: string },
  filters?: Record<string, unknown>,
  limit = 100,
  offset = 0
) {
  const select = buildCommonSelect({
    path: 'path',
    visitors: 'uniq(anonymous_id) as visitors',
    pageviews: 'COUNT(*) as pageviews',
    sessions: 'uniq(session_id) as sessions',
    avg_time: 'avgIf(time_on_page, time_on_page > 0) as avg_time_on_page',
    bounce_rate: 'COUNT(DISTINCT session_id) / uniq(session_id) as bounce_rate'
  })

  const { clause: whereClause, params: whereParams } = buildCommonWhereClauses(
    websiteId,
    dateRange.from,
    dateRange.to,
    { event_filter: 'event_name = \'page_view\'' }
  )

  const groupBy = buildCommonGroupBy({
    path: 'path'
  })

  const orderBy = buildCommonOrderBy({ pageviews: 'pageviews DESC' })

  const query = `
    SELECT ${select}
    FROM analytics.events
    WHERE ${whereClause}
    GROUP BY ${groupBy}
    ORDER BY ${orderBy}
    LIMIT {limit:UInt64} OFFSET {offset:UInt64}
  `

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
 * Creates a builder for fetching page performance data
 */
function createPagePerformanceBuilder(
  websiteId: string,
  dateRange: { from: string; to: string },
  filters?: Record<string, unknown>,
  limit = 100,
  offset = 0
) {
  const select = buildCommonSelect({
    path: 'path',
    avg_load_time: 'avgIf(load_time, load_time > 0) as avg_load_time',
    avg_ttfb: 'avgIf(ttfb, ttfb > 0) as avg_ttfb',
    avg_fcp: 'avgIf(fcp, fcp > 0) as avg_fcp',
    avg_lcp: 'avgIf(lcp, lcp > 0) as avg_lcp',
    avg_cls: 'avgIf(cls, cls >= 0) as avg_cls',
    pageviews: 'COUNT(*) as pageviews'
  })

  const { clause: whereClause, params: whereParams } = buildCommonWhereClauses(
    websiteId,
    dateRange.from,
    dateRange.to,
    { event_filter: 'event_name = \'page_view\'' }
  )

  const groupBy = buildCommonGroupBy({
    path: 'path'
  })

  const orderBy = buildCommonOrderBy({ avg_load_time: 'avg_load_time DESC' })

  const query = `
    SELECT ${select}
    FROM analytics.events
    WHERE ${whereClause}
    GROUP BY ${groupBy}
    ORDER BY ${orderBy}
    LIMIT {limit:UInt64} OFFSET {offset:UInt64}
  `

  return {
    query,
    params: {
      ...whereParams,
      limit,
      offset
    }
  }
}

export const pageBuilders: QueryBuilderGroup = {
  pages: (websiteId, dateRange, filters, limit, offset) =>
    createPagesBuilder(websiteId, dateRange, filters, limit, offset),

  page_performance: (websiteId, dateRange, filters, limit, offset) =>
    createPagePerformanceBuilder(websiteId, dateRange, filters, limit, offset)
}