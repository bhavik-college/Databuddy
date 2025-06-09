/**
 * Analytics Time Series Builders
 *
 * Builders for time-based analytics metrics
 */

import { createSqlBuilder } from './utils';

// Data types
export interface EventByDate {
  date: string;
  pageviews: number;
  unique_visitors: number;
  sessions: number;
  bounce_rate: number;
  avg_session_duration: number;
}

export interface MiniChartDataPoint {
  date: string;
  value: number;
}

/**
 * Creates a builder for fetching analytics data broken down by time periods
 * Supports hourly or daily granularity
 */
export function createEventsByDateBuilder(
  websiteId: string, 
  startDate: string, 
  endDate: string, 
  granularity: 'hourly' | 'daily' = 'daily'
) {
  const builder = createSqlBuilder();
  
  // For hourly data, we need to generate hourly intervals instead of daily
  if (granularity === 'hourly') {
    const sql = `
      WITH hour_range AS (
        SELECT arrayJoin(arrayMap(
          h -> toDateTime('${startDate} 00:00:00') + (h * 3600),
          range(toUInt32(dateDiff('hour', toDateTime('${startDate} 00:00:00'), toDateTime('${endDate} 23:59:59')) + 1))
        )) AS datetime
      ),
      session_metrics AS (
        SELECT
          toStartOfHour(time) as event_hour,
          session_id,
          anonymous_id,
          countIf(event_name = 'screen_view') as page_count
        FROM analytics.events
        WHERE 
          client_id = '${websiteId}'
          AND time >= parseDateTimeBestEffort('${startDate}')
          AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')
        GROUP BY event_hour, session_id, anonymous_id
      ),
      hourly_visitors AS (
        SELECT
          toStartOfHour(time) as event_hour,
          count(distinct anonymous_id) as unique_visitors
        FROM analytics.events
        WHERE 
          client_id = '${websiteId}'
          AND time >= parseDateTimeBestEffort('${startDate}')
          AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')
          AND event_name = 'screen_view'
        GROUP BY event_hour
      ),
      session_durations AS (
        SELECT
          toStartOfHour(min_time) as event_hour,
          session_id,
          dateDiff('second', min_time, max_time) as duration
        FROM (
          SELECT 
            session_id,
            MIN(time) as min_time,
            MAX(time) as max_time
          FROM analytics.events
          WHERE 
            client_id = '${websiteId}'
            AND time >= parseDateTimeBestEffort('${startDate}')
            AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')
          GROUP BY session_id
          HAVING min_time < max_time
        )
      ),
      hourly_metrics AS (
        SELECT
          event_hour,
          sum(page_count) as pageviews,
          count(distinct session_id) as sessions,
          countIf(page_count = 1) as bounced_sessions
        FROM session_metrics
        GROUP BY event_hour
      )
      SELECT
        formatDateTime(hour_range.datetime, '%Y-%m-%d %H:00:00') as date,
        COALESCE(hm.pageviews, 0) as pageviews,
        COALESCE(hv.unique_visitors, 0) as unique_visitors,
        COALESCE(hm.sessions, 0) as sessions,
        CASE 
          WHEN COALESCE(hm.sessions, 0) > 0 
          THEN (COALESCE(hm.bounced_sessions, 0) / COALESCE(hm.sessions, 0)) * 100 
          ELSE 0 
        END as bounce_rate,
        COALESCE(AVG(sd.duration), 0) as avg_session_duration
      FROM hour_range
      LEFT JOIN hourly_metrics hm ON hour_range.datetime = hm.event_hour
      LEFT JOIN hourly_visitors hv ON hour_range.datetime = hv.event_hour
      LEFT JOIN session_durations sd ON hour_range.datetime = sd.event_hour
      GROUP BY 
        hour_range.datetime, 
        hm.pageviews, 
        hv.unique_visitors, 
        hm.sessions, 
        hm.bounced_sessions
      ORDER BY hour_range.datetime ASC
    `;
    
    // Override the getSql method to return our custom query
    builder.getSql = () => sql;
    
    return builder;
  }
  
  // Default daily granularity query
  const sql = `
    WITH date_range AS (
      SELECT arrayJoin(arrayMap(
        d -> toDate('${startDate}') + d,
        range(toUInt32(dateDiff('day', toDate('${startDate}'), toDate('${endDate}')) + 1))
      )) AS date
    ),
    session_metrics AS (
      SELECT 
        toDate(time) as event_date,
        session_id,
        anonymous_id,
        countIf(event_name = 'screen_view') as page_count
      FROM analytics.events
      WHERE 
        client_id = '${websiteId}'
        AND time >= parseDateTimeBestEffort('${startDate}')
        AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')
      GROUP BY event_date, session_id, anonymous_id
    ),
    session_durations AS (
      SELECT 
        toDate(min_time) as event_date,
        session_id,
        dateDiff('second', min_time, max_time) as duration
      FROM (
        SELECT 
          session_id, 
          MIN(time) as min_time, 
          MAX(time) as max_time
        FROM analytics.events
        WHERE 
          client_id = '${websiteId}'
          AND time >= parseDateTimeBestEffort('${startDate}')
          AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')
        GROUP BY session_id
        HAVING min_time < max_time
      )
    ),
    daily_metrics AS (
      SELECT
        event_date,
        sum(page_count) as pageviews,
        count(distinct session_id) as sessions,
        countIf(page_count = 1) as bounced_sessions,
        count(distinct anonymous_id) as unique_visitors
      FROM session_metrics
      GROUP BY event_date
    )
    SELECT
      date_range.date,
      COALESCE(dm.pageviews, 0) as pageviews,
      COALESCE(dm.unique_visitors, 0) as unique_visitors,
      COALESCE(dm.sessions, 0) as sessions,
      CASE 
        WHEN COALESCE(dm.sessions, 0) > 0
        THEN (COALESCE(dm.bounced_sessions, 0) / COALESCE(dm.sessions, 0)) * 100 
        ELSE 0 
      END as bounce_rate,
      COALESCE(avg(sd.duration), 0) as avg_session_duration
    FROM date_range
    LEFT JOIN daily_metrics dm ON date_range.date = dm.event_date
    LEFT JOIN session_durations sd ON date_range.date = sd.event_date
    GROUP BY 
      date_range.date, 
      dm.pageviews, 
      dm.unique_visitors, 
      dm.sessions, 
      dm.bounced_sessions
    ORDER BY date_range.date ASC
  `;
  
  // Override the getSql method to return our custom query
  builder.getSql = () => sql;
  
  return builder;
}

/**
 * Creates a builder for fetching error timeline data
 */
export function createErrorTimelineBuilder(websiteId: string, startDate: string, endDate: string) {
  const builder = createSqlBuilder();
  builder.setTable('events');
  
  builder.sb.select = {
    date: 'toDate(time) as date',
    error_type: 'error_type',
    count: 'COUNT(*) as count'
  };
  
  builder.sb.where = {
    client_filter: `client_id = '${websiteId}'`,
    date_filter: `time >= parseDateTimeBestEffort('${startDate}') AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')`,
    event_filter: "event_name = 'error'"
  };
  
  builder.sb.groupBy = {
    date: 'toDate(time)',
    error_type: 'error_type'
  };
  
  builder.sb.orderBy = {
    date: 'date ASC',
    count: 'count DESC'
  };
  
  return builder;
}

/**
 * Creates a builder for fetching mini chart data for website cards
 * Returns last 7 days of pageviews data for simple visualization
 */
export function createMiniChartBuilder(websiteId: string) {
  const builder = createSqlBuilder();
  
  const sql = `
    WITH date_range AS (
      SELECT arrayJoin(arrayMap(
        d -> toDate(today()) - d,
        range(7) -- Last 7 days
      )) AS date
    ),
    daily_pageviews AS (
      SELECT 
        toDate(time) as event_date,
        countIf(event_name = 'screen_view') as pageviews
      FROM analytics.events
      WHERE 
        client_id = '${websiteId}'
        AND toDate(time) >= (today() - 6) -- Last 7 days including today
        AND toDate(time) <= today()
      GROUP BY event_date
    )
    SELECT
      toString(date_range.date) as date,
      COALESCE(dp.pageviews, 0) as value
    FROM date_range
    LEFT JOIN daily_pageviews dp ON date_range.date = dp.event_date
    ORDER BY date_range.date ASC
  `;
  
  // Override the getSql method
  builder.getSql = () => sql;
  
  return builder;
} 