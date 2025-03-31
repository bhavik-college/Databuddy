/**
 * Analytics SQL Builders
 * 
 * This file contains functions to build SQL queries for analytics data.
 * Each function returns either a builder object or a SQL string.
 */

import { SqlBuilder } from '../utils/sql-builder';
import { parseReferrer } from '../utils/referrer';
import { parseUserAgent } from '../utils/user-agent';
import { anonymizeIp } from '../utils/ip-geo';
import { createSqlBuilder } from '@databuddy/db';

// Types for analytics data
export interface SummaryData {
  pageviews: number;
  unique_visitors: number;
  sessions: number;
  bounce_rate: number;
  avg_session_duration: number;
}

export interface TopPage {
  path: string;
  pageviews: number;
  visitors: number;
}

export interface TopReferrer {
  referrer: string;
  visitors: number;
  pageviews: number;
  type?: string;
  name?: string;
  domain?: string;
}

export interface EventByDate {
  date: string;
  pageviews: number;
  unique_visitors: number;
  sessions: number;
  bounce_rate: number;
  avg_session_duration: number;
}

export interface ScreenResolution {
  resolution: string;
  count: number;
  visitors: number;
}

export interface BrowserVersion {
  browser: string;
  version: string;
  count: number;
  visitors: number;
}

export interface Country {
  country: string;
  visitors: number;
  pageviews: number;
}

export interface DeviceType {
  device_type: string;
  visitors: number;
  pageviews: number;
}

export interface PerformanceMetrics {
  avg_load_time: number;
  avg_ttfb: number;
  avg_dom_ready_time: number;
  avg_render_time: number;
  avg_fcp: number;
  avg_lcp: number;
  avg_cls: number;
}

export interface TodayData {
  pageviews: number;
  visitors: number;
  sessions: number;
  bounce_rate: number;
}

export interface UTMData {
  source?: string;
  medium?: string;
  campaign?: string;
  visitors: number;
  visits: number;
}

export interface ErrorData {
  error_type: string;
  error_message: string;
  count: number;
  unique_users: number;
  last_occurrence?: string;
}

// Helper functions
function buildWhereClauses(websiteId: string, startDate: string, endDate: string, additionalFilters: Record<string, string> = {}) {
  const baseFilters = {
    client_filter: `client_id = '${websiteId}'`,
    date_filter: `time >= parseDateTimeBestEffort('${startDate}') AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')`
  };
  
  return { ...baseFilters, ...additionalFilters };
}

function buildCommonSelect(metrics: Record<string, string>) {
  return metrics;
}

function buildCommonGroupBy(fields: Record<string, string>) {
  return fields;
}

function buildCommonOrderBy(fields: Record<string, string>) {
  return fields;
}

// Builder functions
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
        countIf(event_name = 'screen_view') as page_count,
        countDistinct(anonymous_id) as unique_visitors
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
    )
    SELECT
      sum(page_count) as pageviews,
      sum(unique_visitors) as visitors,
      count(session_metrics.session_id) as sessions,
      (COALESCE(countIf(page_count = 1), 0) / COALESCE(COUNT(*), 0)) * 100 as bounce_rate,
      AVG(sd.duration) as avg_session_duration
    FROM session_metrics
    LEFT JOIN session_durations as sd ON session_metrics.session_id = sd.session_id
  `;

  // Override the getSql method
  builder.getSql = () => sql;

  return builder;
}

export function createTodayBuilder(websiteId: string) {
  const builder = createSqlBuilder();
  
  // Use raw SQL to calculate bounce rate properly
  const sql = `
    WITH session_metrics AS (
      SELECT
        session_id,
        countIf(event_name = 'screen_view') as page_count,
        countDistinct(anonymous_id) as unique_visitors
      FROM analytics.events
      WHERE 
        client_id = '${websiteId}'
        AND toDate(time) = today()
      GROUP BY session_id
    ),
    session_durations AS (
      SELECT
        session_id,
        dateDiff('second', MIN(time), MAX(time)) as duration
      FROM analytics.events
      WHERE 
        client_id = '${websiteId}'
        AND toDate(time) = today()
      GROUP BY session_id
      HAVING duration > 0
    )
    SELECT
      sum(page_count) as pageviews,
      sum(unique_visitors) as visitors,
      count(session_metrics.session_id) as sessions,
      (COALESCE(countIf(page_count = 1), 0) / COALESCE(COUNT(*), 0)) * 100 as bounce_rate,
      AVG(sd.duration) as avg_session_duration
    FROM session_metrics
    LEFT JOIN session_durations as sd ON session_metrics.session_id = sd.session_id
  `;
  
  // Override the getSql method
  builder.getSql = () => sql;
  
  return builder;
}

/**
 * Create a builder that gets today's data broken down by hour
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
        countIf(event_name = 'screen_view') as page_count,
        countDistinct(anonymous_id) as session_visitors
      FROM analytics.events
      WHERE 
        client_id = '${websiteId}'
        AND toDate(time) = today()
      GROUP BY event_hour, session_id
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
          AND toDate(time) = today()
        GROUP BY session_id
        HAVING min_time < max_time
      )
    ),
    hourly_metrics AS (
      SELECT
        event_hour,
        sum(page_count) as pageviews,
        sum(session_visitors) as unique_visitors,
        count(session_id) as sessions,
        countIf(page_count = 1) as bounced_sessions
      FROM session_metrics
      GROUP BY event_hour
    )
    SELECT
      formatDateTime(hour_range.datetime, '%Y-%m-%d %H:00:00') as date,
      COALESCE(hm.pageviews, 0) as pageviews,
      COALESCE(hm.unique_visitors, 0) as unique_visitors,
      COALESCE(hm.sessions, 0) as sessions,
      CASE 
        WHEN COALESCE(hm.sessions, 0) > 0 
        THEN (COALESCE(hm.bounced_sessions, 0) / COALESCE(hm.sessions, 0)) * 100 
        ELSE 0 
      END as bounce_rate,
      COALESCE(AVG(sd.duration), 0) as avg_session_duration
    FROM hour_range
    LEFT JOIN hourly_metrics hm ON hour_range.datetime = hm.event_hour
    LEFT JOIN session_durations sd ON hour_range.datetime = sd.event_hour
    GROUP BY 
      hour_range.datetime, 
      hm.pageviews, 
      hm.unique_visitors, 
      hm.sessions, 
      hm.bounced_sessions
    ORDER BY hour_range.datetime ASC
  `;
  
  // Override the getSql method to return our custom query
  builder.getSql = () => sql;
  
  return builder;
}

export function createTopPagesBuilder(websiteId: string, startDate: string, endDate: string, limit: number = 5) {
  const builder = createSqlBuilder();
  builder.setTable('events');
  
  builder.sb.select = buildCommonSelect({
    path: 'path',
    pageviews: 'COUNT(*) as pageviews',
    visitors: 'COUNT(DISTINCT anonymous_id) as visitors',
    avg_time_on_page: 'AVG(CASE WHEN time_on_page > 0 AND time_on_page IS NOT NULL THEN time_on_page / 1000 ELSE NULL END) as avg_time_on_page'
  });
  
  builder.sb.where = buildWhereClauses(websiteId, startDate, endDate, {
    page_filter: "event_name = 'screen_view'"
  });
  
  builder.sb.groupBy = buildCommonGroupBy({ path: 'path' });
  builder.sb.orderBy = buildCommonOrderBy({ pageviews: 'pageviews DESC' });
  builder.sb.limit = limit;
  
  return builder;
}

export function createTopReferrersBuilder(websiteId: string, startDate: string, endDate: string, limit: number = 5) {
  const builder = createSqlBuilder();
  builder.setTable('events');
  
  builder.sb.select = buildCommonSelect({
    referrer: 'referrer',
    visitors: 'COUNT(DISTINCT anonymous_id) as visitors',
    pageviews: 'COUNT(*) as pageviews'
  });
  
  builder.sb.where = buildWhereClauses(websiteId, startDate, endDate, {
    referrer_filter: "referrer != '' AND event_name = 'screen_view'"
  });
  
  builder.sb.groupBy = buildCommonGroupBy({ referrer: 'referrer' });
  builder.sb.orderBy = buildCommonOrderBy({ visitors: 'visitors DESC' });
  builder.sb.limit = limit;
  
  return builder;
}

export function createEventsByDateBuilder(websiteId: string, startDate: string, endDate: string, granularity: 'hourly' | 'daily' = 'daily') {
  const builder = createSqlBuilder();
  
  // Generate all dates in the range with zero values by default,
  // then only fill in actual data where it exists
  
  // For hourly data, we need to generate hourly intervals instead of daily
  if (granularity === 'hourly') {
    // For hourly data, we should limit the range to avoid generating too many rows
    // Check if date range is more than 2 days and adjust if needed
    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);
    const diffInDays = Math.ceil((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60 * 24));
    
    // If more than 2 days, limit to the last 48 hours from the end date
    let adjustedStartDate = startDate;
    if (diffInDays > 2) {
      const adjustedStart = new Date(endDateTime);
      adjustedStart.setHours(adjustedStart.getHours() - 48);
      adjustedStartDate = adjustedStart.toISOString().split('T')[0];
    }
    
    const sql = `
      WITH hour_range AS (
        SELECT arrayJoin(arrayMap(
          h -> toDateTime('${adjustedStartDate} 00:00:00') + (h * 3600),
          range(toUInt32(dateDiff('hour', toDateTime('${adjustedStartDate} 00:00:00'), toDateTime('${endDate} 23:59:59')) + 1))
        )) AS datetime
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
            AND time >= parseDateTimeBestEffort('${adjustedStartDate} 00:00:00')
            AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')
          GROUP BY session_id
          HAVING min_time < max_time
        )
      ),
      session_metrics AS (
        SELECT
          toStartOfHour(time) as event_hour,
          session_id,
          countIf(event_name = 'screen_view') as page_count,
          count(distinct anonymous_id) as unique_visitors
        FROM analytics.events
        WHERE 
          client_id = '${websiteId}'
          AND time >= parseDateTimeBestEffort('${adjustedStartDate} 00:00:00')
          AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')
        GROUP BY event_hour, session_id
      ),
      hourly_metrics AS (
        SELECT
          event_hour,
          sum(page_count) as pageviews,
          sum(unique_visitors) as unique_visitors,
          count(session_id) as sessions,
          countIf(page_count = 1) as bounced_sessions
        FROM session_metrics
        GROUP BY event_hour
      )
      SELECT
        formatDateTime(hour_range.datetime, '%Y-%m-%d %H:00:00') as date,
        COALESCE(hm.pageviews, 0) as pageviews,
        COALESCE(hm.unique_visitors, 0) as unique_visitors,
        COALESCE(hm.sessions, 0) as sessions,
        CASE 
          WHEN COALESCE(hm.sessions, 0) > 0
          THEN (COALESCE(hm.bounced_sessions, 0) / COALESCE(hm.sessions, 0)) * 100 
          ELSE 0 
        END as bounce_rate,
        COALESCE(avg(sd.duration), 0) as avg_session_duration
      FROM hour_range
      LEFT JOIN hourly_metrics hm ON hour_range.datetime = hm.event_hour
      LEFT JOIN session_durations sd ON hour_range.datetime = sd.event_hour
      GROUP BY 
        hour_range.datetime, 
        hm.pageviews, 
        hm.unique_visitors, 
        hm.sessions, 
        hm.bounced_sessions
      ORDER BY hour_range.datetime ASC
    `;
    
    // Override the getSql method to return our custom query
    builder.getSql = () => sql;
    
    return builder;
  }
  
  // Default daily granularity query (unchanged)
  const sql = `
    WITH date_range AS (
      SELECT arrayJoin(arrayMap(
        d -> toDate('${startDate}') + d,
        range(toUInt32(dateDiff('day', toDate('${startDate}'), toDate('${endDate}')) + 1))
      )) AS date
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
    session_metrics AS (
      SELECT
        toDate(time) as event_date,
        session_id,
        countIf(event_name = 'screen_view') as page_count,
        count(distinct anonymous_id) as unique_visitors
      FROM analytics.events
      WHERE 
        client_id = '${websiteId}'
        AND time >= parseDateTimeBestEffort('${startDate}')
        AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')
      GROUP BY event_date, session_id
    ),
    daily_metrics AS (
      SELECT
        event_date,
        sum(page_count) as pageviews,
        sum(unique_visitors) as unique_visitors,
        count(session_id) as sessions,
        countIf(page_count = 1) as bounced_sessions
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

export function createScreenResolutionsBuilder(websiteId: string, startDate: string, endDate: string, limit: number = 10) {
  const builder = createSqlBuilder();
  builder.setTable('events');
  
  builder.sb.select = buildCommonSelect({
    resolution: 'screen_resolution',
    count: 'COUNT(CASE WHEN event_name = \'screen_view\' THEN 1 END) as count',
    visitors: 'COUNT(DISTINCT anonymous_id) as visitors'
  });
  
  builder.sb.where = buildWhereClauses(websiteId, startDate, endDate, {
    resolution_filter: "screen_resolution != ''",
    event_filter: "event_name = 'screen_view'"
  });
  
  builder.sb.groupBy = buildCommonGroupBy({ resolution: 'screen_resolution' });
  builder.sb.orderBy = buildCommonOrderBy({ visitors: 'visitors DESC' });
  builder.sb.limit = limit;
  
  return builder;
}

export function createBrowserVersionsBuilder(websiteId: string, startDate: string, endDate: string, limit: number = 10) {
  const builder = createSqlBuilder();
  builder.setTable('events');
  
  builder.sb.select = buildCommonSelect({
    user_agent: 'user_agent',
    count: 'COUNT(*) as count',
    visitors: 'COUNT(DISTINCT anonymous_id) as visitors'
  });
  
  builder.sb.where = buildWhereClauses(websiteId, startDate, endDate, {
    browser_filter: "event_name = 'screen_view'"
  });
  
  builder.sb.groupBy = buildCommonGroupBy({
    user_agent: 'user_agent'
  });
  
  builder.sb.orderBy = buildCommonOrderBy({ visitors: 'visitors DESC' });
  builder.sb.limit = limit;
  
  return builder;
}

export function createCountriesBuilder(websiteId: string, startDate: string, endDate: string, limit: number = 5) {
  const builder = createSqlBuilder();
  builder.setTable('events');
  
  builder.sb.select = buildCommonSelect({
    country: 'COALESCE(country, \'Unknown\') as country',
    visitors: 'COUNT(DISTINCT anonymous_id) as visitors',
    pageviews: 'COUNT(*) as pageviews'
  });
  
  builder.sb.where = buildWhereClauses(websiteId, startDate, endDate, {
    event_filter: "event_name = 'screen_view'"
  });
  
  builder.sb.groupBy = buildCommonGroupBy({ country: 'country' });
  builder.sb.orderBy = buildCommonOrderBy({ visitors: 'visitors DESC' });
  builder.sb.limit = limit;
  
  return builder;
}

export function createDeviceTypesBuilder(websiteId: string, startDate: string, endDate: string, limit: number = 5) {
  const builder = createSqlBuilder();
  builder.setTable('events');
  
  builder.sb.select = buildCommonSelect({
    user_agent: 'user_agent',
    visitors: 'COUNT(DISTINCT anonymous_id) as visitors',
    pageviews: 'COUNT(*) as pageviews'
  });
  
  builder.sb.where = buildWhereClauses(websiteId, startDate, endDate, {
    event_filter: "event_name = 'screen_view'"
  });
  
  builder.sb.groupBy = buildCommonGroupBy({ user_agent: 'user_agent' });
  builder.sb.orderBy = buildCommonOrderBy({ visitors: 'visitors DESC' });
  builder.sb.limit = limit;
  
  return builder;
}

export function createPerformanceBuilder(websiteId: string, startDate: string, endDate: string) {
  const builder = createSqlBuilder();
  builder.setTable('events');
  
  builder.sb.select = buildCommonSelect({
    avg_load_time: 'AVG(CASE WHEN load_time > 0 AND load_time IS NOT NULL THEN load_time ELSE NULL END) as avg_load_time',
    avg_ttfb: 'AVG(CASE WHEN ttfb > 0 AND ttfb IS NOT NULL THEN ttfb ELSE NULL END) as avg_ttfb',
    avg_dom_ready_time: 'AVG(CASE WHEN dom_ready_time > 0 AND dom_ready_time IS NOT NULL THEN dom_ready_time ELSE NULL END) as avg_dom_ready_time',
    avg_render_time: 'AVG(CASE WHEN render_time > 0 AND render_time IS NOT NULL THEN render_time ELSE NULL END) as avg_render_time',
    avg_fcp: 'AVG(CASE WHEN fcp > 0 AND fcp IS NOT NULL THEN fcp ELSE NULL END) as avg_fcp',
    avg_lcp: 'AVG(CASE WHEN lcp > 0 AND lcp IS NOT NULL THEN lcp ELSE NULL END) as avg_lcp',
    avg_cls: 'AVG(CASE WHEN cls > 0 AND cls IS NOT NULL THEN cls ELSE NULL END) as avg_cls'
  });
  
  builder.sb.where = buildWhereClauses(websiteId, startDate, endDate, {
    valid_filter: '(event_name = \'screen_view\' OR event_name = \'performance\')',
    performance_filter: '(load_time IS NOT NULL OR ttfb IS NOT NULL OR fcp IS NOT NULL OR lcp IS NOT NULL)'
  });
  
  return builder;
}

export function createUTMSourceBuilder(websiteId: string, startDate: string, endDate: string, limit: number = 10) {
  const builder = createSqlBuilder();
  builder.setTable('events');
  
  builder.sb.select = buildCommonSelect({
    utm_source: 'utm_source',
    visits: 'COUNT(*) as visits',
    visitors: 'COUNT(DISTINCT anonymous_id) as visitors'
  });
  
  builder.sb.where = buildWhereClauses(websiteId, startDate, endDate, {
    source_filter: `utm_source != ''`,
    event_filter: "event_name = 'screen_view'"
  });
  
  builder.sb.groupBy = buildCommonGroupBy({ utm_source: 'utm_source' });
  builder.sb.orderBy = buildCommonOrderBy({ visitors: 'visitors DESC' });
  builder.sb.limit = limit;
  
  return builder;
}

export function createUTMMediumBuilder(websiteId: string, startDate: string, endDate: string, limit: number = 10) {
  const builder = createSqlBuilder();
  builder.setTable('events');
  
  builder.sb.select = buildCommonSelect({
    utm_medium: 'utm_medium',
    visits: 'COUNT(*) as visits',
    visitors: 'COUNT(DISTINCT anonymous_id) as visitors'
  });
  
  builder.sb.where = buildWhereClauses(websiteId, startDate, endDate, {
    medium_filter: `utm_medium != ''`,
    event_filter: "event_name = 'screen_view'"
  });
  
  builder.sb.groupBy = buildCommonGroupBy({ utm_medium: 'utm_medium' });
  builder.sb.orderBy = buildCommonOrderBy({ visitors: 'visitors DESC' });
  builder.sb.limit = limit;
  
  return builder;
}

export function createUTMCampaignBuilder(websiteId: string, startDate: string, endDate: string, limit: number = 10) {
  const builder = createSqlBuilder();
  builder.setTable('events');
  
  builder.sb.select = buildCommonSelect({
    utm_campaign: 'utm_campaign',
    visits: 'COUNT(*) as visits',
    visitors: 'COUNT(DISTINCT anonymous_id) as visitors'
  });
  
  builder.sb.where = buildWhereClauses(websiteId, startDate, endDate, {
    campaign_filter: `utm_campaign != ''`,
    event_filter: "event_name = 'screen_view'"
  });
  
  builder.sb.groupBy = buildCommonGroupBy({ utm_campaign: 'utm_campaign' });
  builder.sb.orderBy = buildCommonOrderBy({ visitors: 'visitors DESC' });
  builder.sb.limit = limit;
  
  return builder;
}

export function createCombinedUTMBuilder(websiteId: string, startDate: string, endDate: string, limit: number = 10) {
  const builder = createSqlBuilder();
  builder.setTable('events');
  
  builder.sb.select = buildCommonSelect({
    utm_source: 'utm_source',
    utm_medium: 'utm_medium',
    utm_campaign: 'utm_campaign',
    visits: 'COUNT(*) as visits',
    visitors: 'COUNT(DISTINCT anonymous_id) as visitors'
  });
  
  builder.sb.where = buildWhereClauses(websiteId, startDate, endDate, {
    source_filter: `utm_source != ''`,
    event_filter: "event_name = 'screen_view'"
  });
  
  builder.sb.groupBy = buildCommonGroupBy({
    utm_source: 'utm_source',
    utm_medium: 'utm_medium',
    utm_campaign: 'utm_campaign'
  });
  
  builder.sb.orderBy = buildCommonOrderBy({ visitors: 'visitors DESC' });
  builder.sb.limit = limit;
  
  return builder;
}

export function createErrorTypesBuilder(websiteId: string, startDate: string, endDate: string, limit: number = 10) {
  const builder = createSqlBuilder();
  builder.setTable('events');
  
  builder.sb.select = buildCommonSelect({
    error_type: 'error_type',
    error_message: 'error_message',
    count: 'COUNT(*) as count',
    unique_users: 'COUNT(DISTINCT anonymous_id) as unique_users',
    last_occurrence: 'MAX(time) as last_occurrence'
  });
  
  builder.sb.where = buildWhereClauses(websiteId, startDate, endDate, {
    event_filter: "event_name = 'error'"
  });
  
  builder.sb.groupBy = buildCommonGroupBy({
    error_type: 'error_type',
    error_message: 'error_message'
  });
  
  builder.sb.orderBy = buildCommonOrderBy({ count: 'count DESC' });
  builder.sb.limit = limit;
  
  return builder;
}

export function createErrorTimelineBuilder(websiteId: string, startDate: string, endDate: string) {
  const builder = createSqlBuilder();
  builder.setTable('events');
  
  builder.sb.select = buildCommonSelect({
    date: 'toDate(time) as date',
    error_type: 'error_type',
    count: 'COUNT(*) as count'
  });
  
  builder.sb.where = buildWhereClauses(websiteId, startDate, endDate, {
    event_filter: "event_name = 'error'"
  });
  
  builder.sb.groupBy = buildCommonGroupBy({
    date: 'toDate(time)',
    error_type: 'error_type'
  });
  
  builder.sb.orderBy = buildCommonOrderBy({
    date: 'date ASC',
    count: 'count DESC'
  });
  
  return builder;
}

export function createErrorDetailsBuilder(websiteId: string, startDate: string, endDate: string, limit: number = 100) {
  const builder = createSqlBuilder();
  builder.setTable('events');
  
  builder.sb.select = buildCommonSelect({
    error_type: 'error_type',
    error_message: 'error_message',
    error_filename: 'error_filename',
    error_lineno: 'error_lineno',
    error_colno: 'error_colno',
    error_stack: 'error_stack',
    url: 'url',
    user_agent: 'user_agent',
    time: 'time',
    anonymous_id: 'anonymous_id'
  });
  
  builder.sb.where = buildWhereClauses(websiteId, startDate, endDate, {
    event_filter: "event_name = 'error'"
  });
  
  builder.sb.orderBy = buildCommonOrderBy({ time: 'time DESC' });
  builder.sb.limit = limit;
  
  return builder;
}

// Helper function to parse referrers from raw data
export function parseReferrers(
  referrers: Array<{ referrer: string; visitors: number; pageviews: number }>,
  filterInternal: boolean = false,
  isInternalReferrerFn?: (referrer: string) => boolean
) {
  // First map all referrers with parsed data
  const parsedReferrers = referrers.map(ref => {
    const parsed = parseReferrer(ref.referrer);
    return {
      ...ref,
      type: parsed.type,
      name: parsed.name,
      domain: parsed.domain
    };
  });
  
  // Then filter out internal referrers if requested
  if (filterInternal && isInternalReferrerFn) {
    return parsedReferrers.filter(ref => {
      // Keep direct traffic and external referrers
      return ref.type === 'direct' || !isInternalReferrerFn(ref.referrer);
    });
  }
  
  return parsedReferrers;
}

// Helper function to parse user agents for browser data
export function parseBrowserData(browserData: Array<{ browser: string; version: string; count: number; visitors: number }>) {
  return browserData.map(item => {
    const userAgentInfo = parseUserAgent(item.version);
    return {
      browser: item.browser !== 'Unknown' ? item.browser : userAgentInfo.browser || 'Unknown',
      version: extractBrowserVersion(item.version) || 'Unknown',
      count: item.count,
      visitors: item.visitors
    };
  });
}

// Helper function to extract browser version from user agent string
function extractBrowserVersion(userAgent: string): string {
  if (!userAgent) return 'Unknown';
  
  // Simple regex patterns to extract common browser versions
  const chromeMatch = userAgent.match(/Chrome\/(\d+\.\d+)/);
  if (chromeMatch) return chromeMatch[1];
  
  const firefoxMatch = userAgent.match(/Firefox\/(\d+\.\d+)/);
  if (firefoxMatch) return firefoxMatch[1];
  
  const safariMatch = userAgent.match(/Version\/(\d+\.\d+).*Safari/);
  if (safariMatch) return safariMatch[1];
  
  const edgeMatch = userAgent.match(/Edg\/(\d+\.\d+)/);
  if (edgeMatch) return edgeMatch[1];
  
  return 'Unknown';
}

// Helper function to anonymize IP addresses in bulk
export function anonymizeIpAddresses(ipAddresses: string[]) {
  return ipAddresses.map(ip => anonymizeIp(ip));
}

/**
 * Create a SQL builder for connection types
 */
export function createConnectionTypesBuilder(websiteId: string, startDate: string, endDate: string, limit = 10) {
  const builder = createSqlBuilder();
  
  builder.sb.select = {
    connection_type: 'COALESCE(connection_type, \'Unknown\') as connection_type',
    visitors: 'COUNT(DISTINCT anonymous_id) as visitors',
    pageviews: 'COUNT(*) as pageviews'
  };
  
  builder.sb.from = 'analytics.events';
  
  builder.sb.where = {
    client_filter: `client_id = '${websiteId}'`,
    date_filter: `time >= parseDateTimeBestEffort('${startDate}') AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')`,
    event_filter: "event_name = 'screen_view'"
  };
  
  builder.sb.groupBy = {
    connection_type: 'connection_type'
  };
  
  builder.sb.orderBy = {
    visitors: 'visitors DESC'
  };
  
  builder.sb.limit = limit;
  
  return builder;
}

/**
 * Create a SQL builder for languages
 */
export function createLanguagesBuilder(websiteId: string, startDate: string, endDate: string, limit = 10) {
  const builder = createSqlBuilder();
  
  builder.sb.select = {
    language: 'COALESCE(language, \'Unknown\') as language',
    visitors: 'COUNT(DISTINCT anonymous_id) as visitors',
    pageviews: 'COUNT(*) as pageviews'
  };
  
  builder.sb.from = 'analytics.events';
  
  builder.sb.where = {
    client_filter: `client_id = '${websiteId}'`,
    date_filter: `time >= parseDateTimeBestEffort('${startDate}') AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')`,
    event_filter: "event_name = 'screen_view'"
  };
  
  builder.sb.groupBy = {
    language: 'language'
  };
  
  builder.sb.orderBy = {
    visitors: 'visitors DESC'
  };
  
  builder.sb.limit = limit;
  
  return builder;
}

/**
 * Create a SQL builder for timezones
 */
export function createTimezonesBuilder(websiteId: string, startDate: string, endDate: string, limit = 10) {
  const builder = createSqlBuilder();
  
  builder.sb.select = {
    timezone: 'COALESCE(timezone, \'Unknown\') as timezone',
    visitors: 'COUNT(DISTINCT anonymous_id) as visitors',
    pageviews: 'COUNT(*) as pageviews'
  };
  
  builder.sb.from = 'analytics.events';
  
  builder.sb.where = {
    client_filter: `client_id = '${websiteId}'`,
    date_filter: `time >= parseDateTimeBestEffort('${startDate}') AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')`,
    event_filter: "event_name = 'screen_view'"
  };
  
  builder.sb.groupBy = {
    timezone: 'timezone'
  };
  
  builder.sb.orderBy = {
    visitors: 'visitors DESC'
  };
  
  builder.sb.limit = limit;
  
  return builder;
}

/**
 * Create a SQL builder for sessions
 */
export function createSessionsBuilder(websiteId: string, startDate: string, endDate: string, limit = 20) {
  const builder = createSqlBuilder();
  
  builder.sb.select = {
    session_id: 'session_id',
    first_visit: 'MIN(time) as first_visit',
    last_visit: 'MAX(time) as last_visit',
    duration: 'dateDiff(\'second\', MIN(time), MAX(time)) as duration',
    page_views: 'countIf(event_name = \'screen_view\') as page_views',
    visitor_id: 'any(anonymous_id) as visitor_id',
    user_agent: 'any(user_agent) as user_agent',
    country: 'any(country) as country',
    city: 'any(city) as city',
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
 * Create a SQL builder for session events
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