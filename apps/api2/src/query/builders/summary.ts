import type { SimpleQueryConfig, Filter, TimeUnit } from "../types";

export const SummaryBuilders: Record<string, SimpleQueryConfig> = {
  summary_metrics: {
    customSql: (websiteId: string, startDate: string, endDate: string) => `
            WITH session_metrics AS (
              SELECT
                session_id,
                countIf(event_name = 'screen_view') as page_count
              FROM analytics.events
              WHERE 
                client_id = '${websiteId}'
                AND time >= parseDateTimeBestEffort('${startDate}')
                AND time <= parseDateTimeBestEffort('${endDate}')
              GROUP BY session_id
            ),
            session_durations AS (
              SELECT
                session_id,
                dateDiff('second', MIN(time), MAX(time)) as duration
              FROM analytics.events
              WHERE 
                client_id = '${websiteId}'
                AND time >= parseDateTimeBestEffort('${startDate}')
                AND time <= parseDateTimeBestEffort('${endDate}')
              GROUP BY session_id
              HAVING duration > 0
            ),
            unique_visitors AS (
              SELECT
                countDistinct(anonymous_id) as unique_visitors
              FROM analytics.events
              WHERE 
                client_id = '${websiteId}'
                AND time >= parseDateTimeBestEffort('${startDate}')
                AND time <= parseDateTimeBestEffort('${endDate}')
                AND event_name = 'screen_view'
            ),
            all_events AS (
              SELECT
                count() as total_events
              FROM analytics.events
              WHERE 
                client_id = '${websiteId}'
                AND time >= parseDateTimeBestEffort('${startDate}')
                AND time <= parseDateTimeBestEffort('${endDate}')
            )
            SELECT
              sum(page_count) as pageviews,
              (SELECT unique_visitors FROM unique_visitors) as unique_visitors,
              count(session_metrics.session_id) as sessions,
              ROUND((COALESCE(countIf(page_count = 1), 0) / COALESCE(COUNT(*), 0)) * 100, 2) as bounce_rate,
              ROUND(AVG(sd.duration), 2) as avg_session_duration,
              (SELECT total_events FROM all_events) as total_events
            FROM session_metrics
            LEFT JOIN session_durations as sd ON session_metrics.session_id = sd.session_id
        `,
    timeField: 'time',
    allowedFilters: ['path', 'referrer', 'device_type', 'browser_name', 'country'],
    customizable: true
  },

  today_metrics: {
    table: 'analytics.events',
    fields: [
      'COUNT(*) as pageviews',
      'COUNT(DISTINCT anonymous_id) as visitors',
      'COUNT(DISTINCT session_id) as sessions',
      'ROUND(AVG(CASE WHEN is_bounce = 1 THEN 100 ELSE 0 END), 2) as bounce_rate'
    ],
    where: [
      'event_name = \'screen_view\'',
      'toDate(time) = today()'
    ],
    timeField: 'time',
    allowedFilters: ['path', 'referrer', 'device_type'],
    customizable: true
  },

  events_by_date: {
    customSql: (websiteId: string, startDate: string, endDate: string, filters?: Filter[], granularity?: TimeUnit) => {
      const isHourly = granularity === 'hour' || granularity === 'hourly';

      if (isHourly) {
        return `
                WITH hour_range AS (
                  SELECT arrayJoin(arrayMap(
                    h -> toDateTime('${startDate} 00:00:00') + (h * 3600),
                    range(toUInt32(dateDiff('hour', toDateTime('${startDate} 00:00:00'), toDateTime('${endDate} 23:59:59')) + 1))
                  )) AS datetime
                ),
                session_details AS (
                  SELECT
                    session_id,
                    toStartOfHour(MIN(time)) as session_start_hour,
                    countIf(event_name = 'screen_view') as page_count,
                    dateDiff('second', MIN(time), MAX(time)) as duration
                  FROM analytics.events
                  WHERE 
                    client_id = '${websiteId}'
                    AND time >= parseDateTimeBestEffort('${startDate}')
                    AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')
                  GROUP BY session_id
                ),
                hourly_session_metrics AS (
                  SELECT
                    session_start_hour as event_hour,
                    count(session_id) as sessions,
                    countIf(page_count = 1) as bounced_sessions,
                    avgIf(duration, duration > 0) as avg_session_duration
                  FROM session_details
                  GROUP BY session_start_hour
                ),
                hourly_event_metrics AS (
                  SELECT
                    toStartOfHour(time) as event_hour,
                    countIf(event_name = 'screen_view') as pageviews,
                    count(distinct anonymous_id) as unique_visitors
                  FROM analytics.events
                  WHERE 
                    client_id = '${websiteId}'
                    AND time >= parseDateTimeBestEffort('${startDate}')
                    AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')
                  GROUP BY event_hour
                )
                SELECT
                  formatDateTime(hr.datetime, '%Y-%m-%d %H:00:00') as date,
                  COALESCE(hem.pageviews, 0) as pageviews,
                  COALESCE(hem.unique_visitors, 0) as visitors,
                  COALESCE(hsm.sessions, 0) as sessions,
                  ROUND(CASE 
                    WHEN COALESCE(hsm.sessions, 0) > 0 
                    THEN (COALESCE(hsm.bounced_sessions, 0) / hsm.sessions) * 100 
                    ELSE 0 
                  END, 2) as bounce_rate,
                  ROUND(COALESCE(hsm.avg_session_duration, 0), 2) as avg_session_duration,
                  ROUND(CASE 
                    WHEN COALESCE(hsm.sessions, 0) > 0 
                    THEN COALESCE(hem.pageviews, 0) / COALESCE(hsm.sessions, 0) 
                    ELSE 0 
                  END, 2) as pages_per_session
                FROM hour_range hr
                LEFT JOIN hourly_session_metrics hsm ON hr.datetime = hsm.event_hour
                LEFT JOIN hourly_event_metrics hem ON hr.datetime = hem.event_hour
                ORDER BY hr.datetime ASC
            `;
      }

      return `
                WITH date_range AS (
                  SELECT arrayJoin(arrayMap(
                    d -> toDate('${startDate}') + d,
                    range(toUInt32(dateDiff('day', toDate('${startDate}'), toDate('${endDate}')) + 1))
                  )) AS date
                ),
                session_details AS (
                  SELECT
                    session_id,
                    toDate(MIN(time)) as session_start_date,
                    countIf(event_name = 'screen_view') as page_count,
                    dateDiff('second', MIN(time), MAX(time)) as duration
                  FROM analytics.events
                  WHERE
                    client_id = '${websiteId}'
                    AND time >= parseDateTimeBestEffort('${startDate}')
                    AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')
                  GROUP BY session_id
                ),
                daily_session_metrics AS (
                  SELECT
                    session_start_date,
                    count(session_id) as sessions,
                    countIf(page_count = 1) as bounced_sessions,
                    avgIf(duration, duration > 0) as avg_session_duration
                  FROM session_details
                  GROUP BY session_start_date
                ),
                daily_event_metrics AS (
                  SELECT
                    toDate(time) as event_date,
                    countIf(event_name = 'screen_view') as pageviews,
                    count(distinct anonymous_id) as unique_visitors
                  FROM analytics.events
                  WHERE
                    client_id = '${websiteId}'
                    AND time >= parseDateTimeBestEffort('${startDate}')
                    AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')
                  GROUP BY event_date
                )
                SELECT
                  dr.date,
                  COALESCE(dem.pageviews, 0) as pageviews,
                  COALESCE(dem.unique_visitors, 0) as visitors,
                  COALESCE(dsm.sessions, 0) as sessions,
                  ROUND(CASE 
                    WHEN COALESCE(dsm.sessions, 0) > 0 
                    THEN (COALESCE(dsm.bounced_sessions, 0) / dsm.sessions) * 100 
                    ELSE 0 
                  END, 2) as bounce_rate,
                  ROUND(COALESCE(dsm.avg_session_duration, 0), 2) as avg_session_duration,
                  ROUND(CASE 
                    WHEN COALESCE(dsm.sessions, 0) > 0 
                    THEN COALESCE(dem.pageviews, 0) / COALESCE(dsm.sessions, 0) 
                    ELSE 0 
                  END, 2) as pages_per_session
                FROM date_range dr
                LEFT JOIN daily_session_metrics dsm ON dr.date = dsm.session_start_date
                LEFT JOIN daily_event_metrics dem ON dr.date = dem.event_date
                ORDER BY dr.date ASC
            `;
    },
    timeField: 'time',
    allowedFilters: ['path', 'referrer', 'device_type'],
    customizable: true
  },

  active_stats: {
    table: 'analytics.events',
    fields: [
      'COUNT(DISTINCT anonymous_id) as active_users',
      'COUNT(DISTINCT session_id) as active_sessions'
    ],
    where: [
      'event_name = \'screen_view\'',
      'time >= now() - INTERVAL 5 MINUTE'
    ],
    timeField: 'time',
    allowedFilters: ['path', 'referrer'],
    customizable: true
  }
}; 