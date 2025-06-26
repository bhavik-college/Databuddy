import type { ParameterBuilder, BuilderConfig } from './types';
import sqlstring from 'sqlstring'

export function escapeSqlString(value: string | number): string {
  if (typeof value === 'number') {
    return value.toString()
  }
  return sqlstring.escape(value)
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
};

// Query builder factory
export function createQueryBuilder(config: BuilderConfig): ParameterBuilder {
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

export function createStandardQuery(nameColumn: string, groupByColumns: string[], extraWhere?: string, orderBy = 'visitors DESC'): ParameterBuilder {
  return createQueryBuilder({
    metricSet: METRICS.standard,
    nameColumn,
    groupByColumns,
    extraWhere,
    orderBy
  });
}

export function createAlias(targetParameter: string): ParameterBuilder {
  return (websiteId, startDate, endDate, limit, offset, granularity = 'daily') => {
    // This will be resolved at runtime by the parameter registry
    throw new Error(`Alias ${targetParameter} needs to be resolved by parameter registry`);
  };
}

// Helper function to get metric type for a parameter
export function getMetricType(parameter: string): string {
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

  const revenueParams = [
    'revenue_summary', 'revenue_trends', 'recent_transactions', 'recent_refunds',
    'revenue_by_country', 'revenue_by_currency', 'revenue_by_card_brand'
  ]

  const exitParams = ['exit_page']

  const specialParams = ['sessions_summary']

  if (performanceParams.includes(parameter)) return 'performance'
  if (errorParams.includes(parameter)) return 'errors'
  if (webVitalsParams.includes(parameter)) return 'web_vitals'
  if (revenueParams.includes(parameter)) return 'revenue'
  if (exitParams.includes(parameter)) return 'exits'
  if (specialParams.includes(parameter)) return 'special'

  return 'standard'
} 