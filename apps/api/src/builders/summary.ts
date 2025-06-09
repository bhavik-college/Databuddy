/**
 * Analytics Summary Builders
 *
 * Builders for high-level summary metrics including today's data
 */

import { createSqlBuilder, buildWhereClauses } from './utils';

// Data types
export interface SummaryData {
  pageviews: number;
  unique_visitors: number;
  sessions: number;
  bounce_rate: number;
  avg_session_duration: number;
  total_events: number;
}

export interface TodayData {
  pageviews: number;
  visitors: number;
  sessions: number;
  bounce_rate: number;
}

/**
 * Creates a builder for fetching summary analytics data over a period
 */
export function createSummaryBuilder(
  websiteId: string,
  startDate: string,
  endDate: string
) {
  const builder = createSqlBuilder();

  // Use raw SQL to calculate bounce rate and session duration properly
  const sql = `
    WITH session_metrics AS (
      SELECT
        session_id,
        countIf(event_name = 'screen_view') as page_count
      FROM analytics.events
      WHERE 
        client_id = '${websiteId}'
        AND toDate(time) >= '${startDate}'
        AND toDate(time) <= '${endDate}'
      GROUP BY session_id
    ),
    session_durations AS (
      SELECT
        session_id,
        dateDiff('second', MIN(time), MAX(time)) as duration
      FROM analytics.events
      WHERE 
        client_id = '${websiteId}'
        AND toDate(time) >= '${startDate}'
        AND toDate(time) <= '${endDate}'
      GROUP BY session_id
      HAVING duration > 0
    ),
    unique_visitors AS (
      SELECT
        countDistinct(anonymous_id) as unique_visitors
      FROM analytics.events
      WHERE 
        client_id = '${websiteId}'
        AND toDate(time) >= '${startDate}'
        AND toDate(time) <= '${endDate}'
        AND event_name = 'screen_view'
    ),
    all_events AS (
      SELECT
        count() as total_events
      FROM analytics.events
      WHERE 
        client_id = '${websiteId}'
        AND toDate(time) >= '${startDate}'
        AND toDate(time) <= '${endDate}'
    )
    SELECT
      sum(page_count) as pageviews,
      (SELECT unique_visitors FROM unique_visitors) as unique_visitors,
      count(session_metrics.session_id) as sessions,
      (COALESCE(countIf(page_count = 1), 0) / COALESCE(COUNT(*), 0)) * 100 as bounce_rate,
      AVG(sd.duration) as avg_session_duration,
      (SELECT total_events FROM all_events) as total_events
    FROM session_metrics
    LEFT JOIN session_durations as sd ON session_metrics.session_id = sd.session_id
  `;

  // Override the getSql method
  builder.getSql = () => sql;

  return builder;
}

/**
 * Creates a builder for fetching today's analytics data
 */
export function createTodayBuilder(websiteId: string) {
  const builder = createSqlBuilder();
  
  // Use raw SQL to calculate bounce rate properly
  const sql = `
    WITH session_metrics AS (
      SELECT
        session_id,
        countIf(event_name = 'screen_view') as page_count
      FROM analytics.events
      WHERE 
        client_id = '${websiteId}'
        AND formatDateTime(time, '%Y-%m-%d', 'UTC') = formatDateTime(now(), '%Y-%m-%d', 'UTC')
      GROUP BY session_id
    ),
    session_durations AS (
      SELECT
        session_id,
        dateDiff('second', MIN(time), MAX(time)) as duration
      FROM analytics.events
      WHERE 
        client_id = '${websiteId}'
        AND formatDateTime(time, '%Y-%m-%d', 'UTC') = formatDateTime(now(), '%Y-%m-%d', 'UTC')
      GROUP BY session_id
      HAVING duration > 0
    ),
    unique_visitors AS (
      SELECT
        countDistinct(anonymous_id) as unique_visitors
      FROM analytics.events
      WHERE 
        client_id = '${websiteId}'
        AND formatDateTime(time, '%Y-%m-%d', 'UTC') = formatDateTime(now(), '%Y-%m-%d', 'UTC')
        AND event_name = 'screen_view'
    ),
    all_events AS (
      SELECT
        count() as total_events
      FROM analytics.events
      WHERE 
        client_id = '${websiteId}'
        AND formatDateTime(time, '%Y-%m-%d', 'UTC') = formatDateTime(now(), '%Y-%m-%d', 'UTC')
    )
    SELECT
      sum(page_count) as pageviews,
      (SELECT unique_visitors FROM unique_visitors) as unique_visitors,
      count(session_metrics.session_id) as sessions,
      (COALESCE(countIf(page_count = 1), 0) / COALESCE(COUNT(*), 0)) * 100 as bounce_rate,
      AVG(sd.duration) as avg_session_duration,
      (SELECT total_events FROM all_events) as total_events
    FROM session_metrics
    LEFT JOIN session_durations as sd ON session_metrics.session_id = sd.session_id
  `;
  
  // Override the getSql method
  builder.getSql = () => sql;
  
  return builder;
}

/**
 * Creates a builder for fetching today's data broken down by hour
 * This allows for more accurate aggregation of today's data
 */
export function createTodayByHourBuilder(websiteId: string) {
  const builder = createSqlBuilder();
  const today = new Date().toISOString().split('T')[0];
  
  const sql = `
    WITH hour_range AS (
      SELECT arrayJoin(arrayMap(
        h -> toDateTime('${today} 00:00:00') + (h * 3600),
        range(24)
      )) AS datetime
    ),
    session_metrics AS (
      SELECT
        toStartOfHour(time) as event_hour,
        session_id,
        countIf(event_name = 'screen_view') as page_count
      FROM analytics.events
      WHERE 
        client_id = '${websiteId}'
        AND formatDateTime(time, '%Y-%m-%d', 'UTC') = formatDateTime(now(), '%Y-%m-%d', 'UTC')
      GROUP BY event_hour, session_id
    ),
    hourly_visitors AS (
      SELECT
        toStartOfHour(time) as event_hour,
        count(distinct anonymous_id) as unique_visitors
      FROM analytics.events
      WHERE 
        client_id = '${websiteId}'
        AND formatDateTime(time, '%Y-%m-%d', 'UTC') = formatDateTime(now(), '%Y-%m-%d', 'UTC')
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
          AND formatDateTime(time, '%Y-%m-%d', 'UTC') = formatDateTime(now(), '%Y-%m-%d', 'UTC')
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