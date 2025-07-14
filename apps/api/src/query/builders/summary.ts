import type { ParameterBuilder } from '../types'
import { escapeSqlString } from '../utils'

export const summaryBuilders: Record<string, ParameterBuilder> = {
  summary_metrics: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    WITH session_metrics AS (
      SELECT
        session_id,
        countIf(event_name = 'screen_view') as page_count
      FROM analytics.events
      WHERE 
        client_id = ${escapeSqlString(websiteId)}
        AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
        AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
      GROUP BY session_id
    ),
    session_durations AS (
      SELECT
        session_id,
        dateDiff('second', MIN(time), MAX(time)) as duration
      FROM analytics.events
      WHERE 
        client_id = ${escapeSqlString(websiteId)}
        AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
        AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
      GROUP BY session_id
      HAVING duration > 0
    ),
    unique_visitors AS (
      SELECT
        countDistinct(anonymous_id) as unique_visitors
      FROM analytics.events
      WHERE 
        client_id = ${escapeSqlString(websiteId)}
        AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
        AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
        AND event_name = 'screen_view'
    ),
    all_events AS (
      SELECT
        count() as total_events
      FROM analytics.events
      WHERE 
        client_id = ${escapeSqlString(websiteId)}
        AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
        AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
    )
    SELECT
      sum(page_count) as pageviews,
      (SELECT unique_visitors FROM unique_visitors) as unique_visitors,
      count(session_metrics.session_id) as sessions,
      (COALESCE(countIf(page_count = 1), 0) / COALESCE(COUNT(*), 0)) * 100 as bounce_rate,
      ROUND((COALESCE(countIf(page_count = 1), 0) / COALESCE(COUNT(*), 0)) * 100, 1) || '%' as bounce_rate_pct,
      AVG(sd.duration) as avg_session_duration,
      CASE 
        WHEN AVG(sd.duration) >= 3600 THEN toString(floor(AVG(sd.duration) / 3600)) || 'h ' || toString(floor((AVG(sd.duration) % 3600) / 60)) || 'm'
        WHEN AVG(sd.duration) >= 60 THEN toString(floor(AVG(sd.duration) / 60)) || 'm ' || toString(floor(AVG(sd.duration) % 60)) || 's'
        ELSE toString(floor(AVG(sd.duration))) || 's'
      END as avg_session_duration_formatted,
      (SELECT total_events FROM all_events) as total_events
    FROM session_metrics
    LEFT JOIN session_durations as sd ON session_metrics.session_id = sd.session_id
  `,

  today_metrics: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    WITH session_metrics AS (
      SELECT
        session_id,
        countIf(event_name = 'screen_view') as page_count
      FROM analytics.events
      WHERE 
        client_id = ${escapeSqlString(websiteId)}
        AND formatDateTime(time, '%Y-%m-%d', 'UTC') = formatDateTime(now(), '%Y-%m-%d', 'UTC')
      GROUP BY session_id
    ),
    unique_visitors AS (
      SELECT
        countDistinct(anonymous_id) as unique_visitors
      FROM analytics.events
      WHERE 
        client_id = ${escapeSqlString(websiteId)}
        AND formatDateTime(time, '%Y-%m-%d', 'UTC') = formatDateTime(now(), '%Y-%m-%d', 'UTC')
        AND event_name = 'screen_view'
    )
    SELECT
      sum(page_count) as pageviews,
      (SELECT unique_visitors FROM unique_visitors) as visitors,
      count(session_metrics.session_id) as sessions,
      (COALESCE(countIf(page_count = 1), 0) / COALESCE(COUNT(*), 0)) * 100 as bounce_rate
    FROM session_metrics
  `,

  events_by_date: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily', timezone = 'UTC') => {
    if (granularity === 'hourly') {
      return `
        WITH hour_range AS (
          SELECT 
            toStartOfHour(parseDateTimeBestEffort(${escapeSqlString(startDate)}), ${escapeSqlString(timezone)}) + toIntervalHour(number) as hour
          FROM numbers(dateDiff('hour', 
            toStartOfHour(parseDateTimeBestEffort(${escapeSqlString(startDate)}), ${escapeSqlString(timezone)}), 
            toStartOfHour(parseDateTimeBestEffort(${escapeSqlString(endDate)}), ${escapeSqlString(timezone)})
          ) + 1)
        ),
        hourly_sessions AS (
          SELECT
            toStartOfHour(time, ${escapeSqlString(timezone)}) as hour,
            session_id,
            countIf(event_name = 'screen_view') as page_count,
            dateDiff('second', MIN(time), MAX(time)) as session_duration
          FROM analytics.events
          WHERE 
            client_id = ${escapeSqlString(websiteId)}
            AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
            AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
          GROUP BY hour, session_id
        ),
        hourly_visitors AS (
          SELECT
            toStartOfHour(time, ${escapeSqlString(timezone)}) as hour,
            count(distinct anonymous_id) as visitors
          FROM analytics.events
          WHERE 
            client_id = ${escapeSqlString(websiteId)}
            AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
            AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
            AND event_name = 'screen_view'
          GROUP BY hour
        ),
        hourly_metrics AS (
          SELECT
            hour,
            sum(page_count) as pageviews,
            count(distinct session_id) as sessions,
            countIf(page_count = 1) as bounced_sessions,
            AVG(CASE WHEN session_duration > 0 THEN session_duration ELSE NULL END) as avg_session_duration
          FROM hourly_sessions
          GROUP BY hour
        )
        SELECT
          formatDateTime(hr.hour, '%Y-%m-%d %H:00:00', ${escapeSqlString(timezone)}) as date,
          COALESCE(hm.pageviews, 0) as pageviews,
          COALESCE(hv.visitors, 0) as visitors,
          COALESCE(hm.sessions, 0) as sessions,
          CASE 
            WHEN COALESCE(hm.sessions, 0) > 0 
            THEN (COALESCE(hm.bounced_sessions, 0) / COALESCE(hm.sessions, 0)) * 100 
            ELSE 0 
          END as bounce_rate,
          COALESCE(hm.avg_session_duration, 0) as avg_session_duration
        FROM hour_range hr
        LEFT JOIN hourly_metrics hm ON hr.hour = hm.hour
        LEFT JOIN hourly_visitors hv ON hr.hour = hv.hour
        ORDER BY hr.hour ASC
      `;
    }
    return `
        WITH date_range AS (
          SELECT 
            toDate(parseDateTimeBestEffort(${escapeSqlString(startDate)}), ${escapeSqlString(timezone)}) + number as date
          FROM numbers(dateDiff('day', 
            toDate(parseDateTimeBestEffort(${escapeSqlString(startDate)}), ${escapeSqlString(timezone)}), 
            toDate(parseDateTimeBestEffort(${escapeSqlString(endDate)}), ${escapeSqlString(timezone)})
          ) + 1)
        ),
        daily_sessions AS (
          SELECT
            toDate(time, ${escapeSqlString(timezone)}) as date,
            session_id,
            countIf(event_name = 'screen_view') as page_count,
            dateDiff('second', MIN(time), MAX(time)) as session_duration
          FROM analytics.events
          WHERE 
            client_id = ${escapeSqlString(websiteId)}
            AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
            AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
          GROUP BY date, session_id
        ),
        daily_visitors AS (
          SELECT
            toDate(time, ${escapeSqlString(timezone)}) as date,
            count(distinct anonymous_id) as visitors
          FROM analytics.events
          WHERE 
            client_id = ${escapeSqlString(websiteId)}
            AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
            AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
            AND event_name = 'screen_view'
          GROUP BY date
        ),
        daily_metrics AS (
          SELECT
            date,
            sum(page_count) as pageviews,
            count(distinct session_id) as sessions,
            countIf(page_count = 1) as bounced_sessions,
            AVG(CASE WHEN session_duration > 0 THEN session_duration ELSE NULL END) as avg_session_duration
          FROM daily_sessions
          GROUP BY date
        )
        SELECT
          formatDateTime(dr.date, '%Y-%m-%d', ${escapeSqlString(timezone)}) as date,
          COALESCE(dm.pageviews, 0) as pageviews,
          COALESCE(dv.visitors, 0) as visitors,
          COALESCE(dm.sessions, 0) as sessions,
          CASE 
            WHEN COALESCE(dm.sessions, 0) > 0 
            THEN (COALESCE(dm.bounced_sessions, 0) / COALESCE(dm.sessions, 0)) * 100 
            ELSE 0 
          END as bounce_rate,
          COALESCE(dm.avg_session_duration, 0) as avg_session_duration
        FROM date_range dr
        LEFT JOIN daily_metrics dm ON dr.date = dm.date
        LEFT JOIN daily_visitors dv ON dr.date = dv.date
        ORDER BY dr.date ASC
      `;

  },

  sessions_summary: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    SELECT
      uniq(session_id) as total_sessions,
      uniq(anonymous_id) as total_users
    FROM analytics.events
    WHERE client_id = ${escapeSqlString(websiteId)}
      AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
      AND event_name = 'screen_view'
  `,

} 