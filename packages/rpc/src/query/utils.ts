import type { QueryFilters, QueryWithParams } from './types'

export function escapeSqlString(value: string | number): string {
  if (typeof value === 'number') {
    return value.toString()
  }
  // Simple escape for single quotes
  return `'${value.replace(/'/g, "''")}'`
}

// Define reusable metric sets
export const METRICS = {
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
}

export function getWhereClause(filters?: QueryFilters): { clause: string; params: Record<string, unknown> } {
  if (!filters || Object.keys(filters).length === 0) {
    return { clause: '', params: {} }
  }

  const conditions: string[] = []
  const params: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(filters)) {
    const paramKey = `filter_${key}`
    if (Array.isArray(value)) {
      conditions.push(`${key} IN ({${paramKey}:Array(String)})`)
      params[paramKey] = value
    } else {
      conditions.push(`${key} = {${paramKey}:String}`)
      params[paramKey] = value
    }
  }

  return {
    clause: conditions.join(' AND '),
    params
  }
}

export function buildCommonWhereClauses(
  websiteId: string,
  startDate: string,
  endDate: string,
  extraFilters: Record<string, string> = {}
): { clause: string; params: Record<string, unknown> } {
  const baseClauses = [
    'client_id = {websiteId:String}',
    'time >= parseDateTimeBestEffort({startDate:String})',
    'time <= parseDateTimeBestEffort({endDate:String})'
  ]

  const extraClauses = Object.entries(extraFilters).map(([key, value]) => value)
  const allClauses = [...baseClauses, ...extraClauses]

  return {
    clause: allClauses.join(' AND '),
    params: { websiteId, startDate, endDate }
  }
}

export function buildCommonSelect(fields: Record<string, string>): string {
  return Object.entries(fields)
    .map(([alias, expression]) => `${expression} as ${alias}`)
    .join(', ')
}

export function buildCommonGroupBy(fields: Record<string, string>): string {
  return Object.values(fields).join(', ')
}

export function buildCommonOrderBy(fields: Record<string, string>): string {
  return Object.entries(fields)
    .map(([field, direction]) => `${field} ${direction}`)
    .join(', ')
} 