/**
 * Analytics Sessions Builders
 *
 * Builders for session analytics metrics
 */

import { createSqlBuilder } from './utils';

/**
 * Creates a builder for fetching session list data
 */
export function createSessionsBuilder(websiteId: string, startDate: string, endDate: string, limit = 20) {
  const builder = createSqlBuilder();
  
  builder.sb.select = {
    session_id: 'session_id',
    first_visit: 'MIN(time) as first_visit',
    last_visit: 'MAX(time) as last_visit',
    duration: 'LEAST(dateDiff(\'second\', MIN(time), MAX(time)), 28800) as duration', // Cap at 8 hours max
    page_views: 'countIf(event_name = \'screen_view\') as page_views',
    visitor_id: 'any(anonymous_id) as visitor_id',
    user_agent: 'any(user_agent) as user_agent',
    country: 'any(country) as country',
    region: 'any(region) as region',
    referrer: 'any(referrer) as referrer'
  };
  
  builder.sb.from = 'analytics.events';
  
  builder.sb.where = {
    client_filter: `client_id = '${websiteId}'`,
    date_filter: `time >= parseDateTimeBestEffort('${startDate}') AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')`
  };
  
  builder.sb.groupBy = {
    session_id: 'session_id'
  };
  
  builder.sb.orderBy = {
    first_visit: 'first_visit DESC'
  };
  
  builder.sb.limit = limit;
  
  return builder;
}

/**
 * Creates a builder for fetching session detail data
 */
export function createSessionDetailBuilder(websiteId: string, sessionId: string) {
  const builder = createSqlBuilder();
  
  builder.sb.select = {
    session_id: 'session_id',
    first_visit: 'MIN(time) as first_visit',
    last_visit: 'MAX(time) as last_visit',
    duration: 'LEAST(dateDiff(\'second\', MIN(time), MAX(time)), 28800) as duration', // Cap at 8 hours max
    page_views: 'countIf(event_name = \'screen_view\') as page_views',
    visitor_id: 'any(anonymous_id) as visitor_id',
    user_agent: 'any(user_agent) as user_agent',
    country: 'any(country) as country',
    region: 'any(region) as region',
    referrer: 'any(referrer) as referrer',
    browser_name: 'any(browser_name) as browser_name',
    browser_version: 'any(browser_version) as browser_version',
    os_name: 'any(os_name) as os_name',
    os_version: 'any(os_version) as os_version',
    device_type: 'any(device_type) as device_type',
    screen_resolution: 'any(screen_resolution) as screen_resolution',
    utm_source: 'any(utm_source) as utm_source',
    utm_medium: 'any(utm_medium) as utm_medium',
    utm_campaign: 'any(utm_campaign) as utm_campaign',
    utm_content: 'any(utm_content) as utm_content',
    utm_term: 'any(utm_term) as utm_term'
  };
  
  builder.sb.from = 'analytics.events';
  
  builder.sb.where = {
    client_filter: `client_id = '${websiteId}'`,
    session_filter: `session_id = '${sessionId}'`
  };
  
  builder.sb.groupBy = {
    session_id: 'session_id'
  };
  
  return builder;
}

/**
 * Creates a builder for fetching session events data
 */
export function createSessionEventsBuilder(websiteId: string, sessionId: string) {
  const builder = createSqlBuilder();
  
  builder.sb.select = {
    event_id: 'id',
    time: 'time',
    event_name: 'event_name',
    path: 'path',
    url: 'url',
    referrer: 'referrer',
    title: 'title',
    time_on_page: 'time_on_page',
    screen_resolution: 'screen_resolution',
    user_agent: 'user_agent',
    utm_source: 'utm_source',
    utm_medium: 'utm_medium',
    utm_campaign: 'utm_campaign'
  };
  
  builder.sb.from = 'analytics.events';
  
  builder.sb.where = {
    client_filter: `client_id = '${websiteId}'`,
    session_filter: `session_id = '${sessionId}'`
  };
  
  builder.sb.orderBy = {
    time: 'time ASC'
  };
  
  return builder;
}

/**
 * Creates a builder for fetching session duration distribution
 */
export function createSessionDurationDistributionBuilder(websiteId: string, startDate: string, endDate: string) {
  const builder = createSqlBuilder();
  
  const sql = `
    WITH session_durations AS (
      SELECT
        session_id,
        dateDiff('second', MIN(time), MAX(time)) as duration
      FROM analytics.events
      WHERE 
        client_id = '${websiteId}'
        AND time >= parseDateTimeBestEffort('${startDate}')
        AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')
      GROUP BY session_id
      HAVING duration >= 0
    ),
    duration_ranges AS (
      SELECT
        CASE
          WHEN duration < 10 THEN '0-10 sec'
          WHEN duration < 30 THEN '10-30 sec'
          WHEN duration < 60 THEN '30-60 sec'
          WHEN duration < 180 THEN '1-3 min'
          WHEN duration < 300 THEN '3-5 min'
          WHEN duration < 600 THEN '5-10 min'
          WHEN duration < 1800 THEN '10-30 min'
          ELSE '30+ min'
        END as duration_range,
        COUNT(*) as session_count
      FROM session_durations
      GROUP BY duration_range
    )
    SELECT
      duration_range,
      session_count
    FROM duration_ranges
    ORDER BY
      CASE duration_range
        WHEN '0-10 sec' THEN 1
        WHEN '10-30 sec' THEN 2
        WHEN '30-60 sec' THEN 3
        WHEN '1-3 min' THEN 4
        WHEN '3-5 min' THEN 5
        WHEN '5-10 min' THEN 6
        WHEN '10-30 min' THEN 7
        WHEN '30+ min' THEN 8
        ELSE 9
      END ASC
  `;
  
  // Override the getSql method to return our custom query
  builder.getSql = () => sql;
  
  return builder;
}

/**
 * Creates a builder for fetching session count by hour of day
 */
export function createSessionsByHourBuilder(websiteId: string, startDate: string, endDate: string) {
  const builder = createSqlBuilder();
  
  const sql = `
    WITH session_hours AS (
      SELECT
        toHour(min_time) as hour_of_day,
        COUNT(*) as session_count
      FROM (
        SELECT 
          session_id, 
          MIN(time) as min_time
        FROM analytics.events
        WHERE 
          client_id = '${websiteId}'
          AND time >= parseDateTimeBestEffort('${startDate}')
          AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')
        GROUP BY session_id
      )
      GROUP BY hour_of_day
    ),
    hours AS (
      SELECT arrayJoin(range(24)) as hour_of_day
    )
    SELECT
      hours.hour_of_day,
      COALESCE(sh.session_count, 0) as session_count
    FROM hours
    LEFT JOIN session_hours sh ON hours.hour_of_day = sh.hour_of_day
    ORDER BY hours.hour_of_day ASC
  `;
  
  // Override the getSql method to return our custom query
  builder.getSql = () => sql;
  
  return builder;
}

/**
 * Creates a builder for fetching bounce rate per entry page
 */
export function createBounceRateByEntryPageBuilder(websiteId: string, startDate: string, endDate: string, limit = 10) {
  const builder = createSqlBuilder();
  
  const sql = `
    WITH entry_pages AS (
      SELECT
        entry_page.session_id,
        entry_page.path,
        countIf(e.event_name = 'screen_view') as page_count
      FROM (
        SELECT
          session_id,
          path,
          MIN(time) as entry_time
        FROM analytics.events
        WHERE 
          client_id = '${websiteId}'
          AND time >= parseDateTimeBestEffort('${startDate}')
          AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')
          AND event_name = 'screen_view'
        GROUP BY session_id, path
      ) entry_page
      LEFT JOIN analytics.events e ON entry_page.session_id = e.session_id
      WHERE 
        e.client_id = '${websiteId}'
      GROUP BY entry_page.session_id, entry_page.path
    ),
    page_metrics AS (
      SELECT
        path,
        COUNT(*) as sessions,
        countIf(page_count = 1) as bounces
      FROM entry_pages
      GROUP BY path
      HAVING sessions >= 10
    )
    SELECT
      path,
      sessions,
      bounces,
      (bounces / sessions) * 100 as bounce_rate
    FROM page_metrics
    ORDER BY sessions DESC
    LIMIT ${limit}
  `;
  
  // Override the getSql method to return our custom query
  builder.getSql = () => sql;
  
  return builder;
} 