import type { ParameterBuilder } from '../types'
import { escapeSqlString } from '../utils'

const activeStatsBuilder: ParameterBuilder = (
    websiteId,
    startDate,
    endDate,
) => {
    return `
    SELECT
      uniq(anonymous_id) as active_users,
      uniq(session_id) as active_sessions,
      count() as total_events
    FROM analytics.events
    WHERE
      client_id = ${escapeSqlString(websiteId)}
      AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
  `
}

const latestEventsBuilder: ParameterBuilder = (
    websiteId,
    startDate,
    endDate,
    limit = 100,
    offset = 0,
) => {
    return `
    SELECT
      *
    FROM analytics.events
    WHERE
      client_id = ${escapeSqlString(websiteId)}
      AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
    ORDER BY time DESC
    LIMIT ${limit} OFFSET ${offset}
  `
}

export const realTimeBuilders: Record<string, ParameterBuilder> = {
    active_stats: activeStatsBuilder,
    latest_events: latestEventsBuilder,
} 