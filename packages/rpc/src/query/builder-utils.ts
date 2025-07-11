import type { QueryDateRange, QueryFilters, QueryWithParams } from './types'
import { buildCommonWhereClauses, getWhereClause } from './utils'

type QueryOptions = {
  select: string
  groupBy?: string
  orderBy?: string
  baseWhere?: string[]
}

export function createQueryBuilder(table: string, baseWhereClauses: string[] = []) {
  return (
    websiteId: string,
    dateRange: QueryDateRange,
    options: QueryOptions,
    filters?: QueryFilters,
    limit = 100,
    offset = 0
  ): QueryWithParams => {
    const { select, groupBy, orderBy, baseWhere } = options

    // Build base where clauses
    const { clause: baseWhereClause, params: baseParams } = buildCommonWhereClauses(
      websiteId,
      dateRange.from,
      dateRange.to,
      { event_filter: 'event_name = \'error\'' }
    )

    // Add base where clauses
    const allBaseWhere = [...baseWhereClauses, ...(baseWhere || [])]
    const baseWhereClauseWithExtras = allBaseWhere.length > 0
      ? `${baseWhereClause} AND ${allBaseWhere.join(' AND ')}`
      : baseWhereClause

    // Build filter where clauses
    const { clause: filterWhereClause, params: filterParams } = getWhereClause(filters)

    // Combine all where clauses
    const whereClause = [baseWhereClauseWithExtras, filterWhereClause]
      .filter(Boolean)
      .join(' AND ')

    // Build the final query
    const query = `
      SELECT ${select}
      FROM ${table}
      WHERE ${whereClause}
      ${groupBy ? `GROUP BY ${groupBy}` : ''}
      ${orderBy ? `ORDER BY ${orderBy}` : ''}
      LIMIT {limit:UInt64} OFFSET {offset:UInt64}
    `

    // Combine all parameters
    const params: Record<string, unknown> = {
      ...baseParams,
      ...filterParams,
      limit,
      offset
    }

    return { query, params }
  }
}

export function createStandardQuery(
  nameColumn: string,
  groupByColumns: string[],
  extraWhere?: string,
  orderBy = 'visitors DESC'
) {
  return (
    websiteId: string,
    dateRange: QueryDateRange,
    filters?: QueryFilters,
    limit?: number,
    offset?: number
  ): QueryWithParams => {
    const builder = createQueryBuilder('analytics.events', extraWhere ? [extraWhere] : [])
    return builder(websiteId, dateRange, {
      select: `
        ${nameColumn} as name,
        uniq(anonymous_id) as visitors,
        COUNT(*) as pageviews,
        uniq(session_id) as sessions
      `,
      groupBy: groupByColumns.join(', '),
      orderBy
    }, filters, limit, offset)
  }
} 