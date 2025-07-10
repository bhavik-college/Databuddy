import type { ParameterBuilder } from '../types'
import { createQueryBuilder } from '../builder-utils'

const buildQuery = createQueryBuilder('analytics.errors', [`message != ''`])

const groupableFields: Record<string, { select: string, groupBy: string, where?: string }> = {
  page: { select: 'path', groupBy: 'path', where: `path != ''` },
  browser: { select: `CONCAT(browser_name, ' ', browser_version)`, groupBy: 'browser_name, browser_version', where: `browser_name != '' AND browser_version IS NOT NULL AND browser_version != ''` },
  os: { select: 'os_name', groupBy: 'os_name', where: `os_name != ''` },
  country: { select: 'country', groupBy: 'country', where: `country != ''` },
  device: { select: 'device_type', groupBy: 'device_type', where: `device_type != ''` },
  error: { select: 'message', groupBy: 'message' }
}

export const errorBuilders: Record<string, ParameterBuilder> = {
  recent_errors: (websiteId, startDate, endDate, limit, offset) =>
    buildQuery(websiteId, startDate, endDate, limit, offset, {
      select: `
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
      `,
      orderBy: 'timestamp DESC',
    }),

  error_types: (websiteId, startDate, endDate, limit, offset) =>
    buildQuery(websiteId, startDate, endDate, limit, offset, {
      select: `
        message as name,
        COUNT(*) as total_occurrences,
        uniq(anonymous_id) as affected_users,
        uniq(session_id) as affected_sessions,
        MAX(timestamp) as last_occurrence,
        MIN(timestamp) as first_occurrence
      `,
      groupBy: 'message',
      orderBy: 'total_occurrences DESC',
    }),

  errors_breakdown: (websiteId, startDate, endDate, limit, offset, granularity, timezone, filters, groupBy) => {
    const groupByFields = groupBy?.split(',').map(f => f.trim()).filter(f => f in groupableFields) ?? ['error'];

    if (groupByFields.length === 0) {
      throw new Error('A valid groupBy parameter is required for errors_breakdown.');
    }

    const selectFields = groupByFields.map(field => groupableFields[field].select);
    const groupByColumns = groupByFields.map(field => groupableFields[field].groupBy);
    const whereClauses = groupByFields.map(field => groupableFields[field].where).filter(Boolean) as string[];

    const finalSelect = selectFields.length > 1
      ? `CONCAT(${selectFields.join(", ' - '")})`
      : selectFields[0];

    return buildQuery(websiteId, startDate, endDate, limit, offset, {
      select: `
        ${finalSelect} as name,
        COUNT(*) as total_errors,
        COUNT(DISTINCT message) as unique_error_types,
        uniq(anonymous_id) as affected_users,
        uniq(session_id) as affected_sessions
      `,
      where: whereClauses.join(' AND '),
      groupBy: groupByColumns.join(', '),
      orderBy: 'total_errors DESC',
    }, filters)
  },

  error_trends: (websiteId, startDate, endDate, limit, offset) =>
    buildQuery(websiteId, startDate, endDate, limit, offset, {
      select: `
        toDate(timestamp) as date,
        COUNT(*) as total_errors,
        COUNT(DISTINCT message) as unique_error_types,
        uniq(anonymous_id) as affected_users,
        uniq(session_id) as affected_sessions
      `,
      groupBy: 'toDate(timestamp)',
      orderBy: 'date ASC',
    }),
} 