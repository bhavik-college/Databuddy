/**
 * Analytics Referrers Builders
 *
 * Builders for referrer analytics metrics
 */

import { 
  createSqlBuilder, 
  buildWhereClauses, 
  buildCommonSelect, 
  buildCommonGroupBy, 
  buildCommonOrderBy 
} from './utils';

// Data types
export interface ReferrerData {
  referrer: string;
  visitors: number;
  pageviews: number;
}

export interface TopReferrer {
  referrer: string;
  visitors: number;
  pageviews: number;
  type?: string;
  name?: string;
  domain?: string;
}

/**
 * Creates a builder for fetching top referrers data
 */
export function createTopReferrersBuilder(websiteId: string, startDate: string, endDate: string, domain?: string) {
  const builder = createSqlBuilder();
  builder.setTable('events');
  
  builder.sb.select = buildCommonSelect({
    referrer: `
      CASE
        WHEN referrer = '' OR referrer IS NULL THEN 'direct'
        WHEN referrer LIKE '%${domain}%' THEN 'direct'
        ELSE referrer
      END as referrer`,
    visitors: 'COUNT(DISTINCT anonymous_id) as visitors',
    pageviews: 'COUNT(*) as pageviews'
  });
  
  builder.sb.where = buildWhereClauses(websiteId, startDate, endDate, {
    event_filter: "event_name = 'screen_view'"
  });
  
  builder.sb.groupBy = buildCommonGroupBy({ referrer: 'referrer' });
  builder.sb.orderBy = buildCommonOrderBy({ visitors: 'visitors DESC' });
  
  return builder;
}

/**
 * Creates a builder for fetching data for a specific referrer
 */
export function createReferrerDetailBuilder(websiteId: string, referrer: string, startDate: string, endDate: string) {
  const builder = createSqlBuilder();
  builder.setTable('events');
  
  builder.sb.select = buildCommonSelect({
    pageviews: 'COUNT(*) as pageviews',
    visitors: 'COUNT(DISTINCT anonymous_id) as visitors'
  });
  
  builder.sb.where = buildWhereClauses(websiteId, startDate, endDate, {
    referrer_filter: `referrer = '${referrer}'`,
    event_filter: "event_name = 'screen_view'"
  });
  
  return builder;
}

/**
 * Creates a builder for fetching referrer time series data
 */
export function createReferrerTimeSeriesBuilder(websiteId: string, referrer: string, startDate: string, endDate: string) {
  const builder = createSqlBuilder();
  
  const sql = `
    WITH date_range AS (
      SELECT arrayJoin(arrayMap(
        d -> toDate('${startDate}') + d,
        range(toUInt32(dateDiff('day', toDate('${startDate}'), toDate('${endDate}')) + 1))
      )) AS date
    ),
    daily_referrer_metrics AS (
      SELECT 
        toDate(time) as event_date,
        COUNT(*) as pageviews,
        COUNT(DISTINCT anonymous_id) as visitors
      FROM analytics.events
      WHERE 
        client_id = '${websiteId}'
        AND time >= parseDateTimeBestEffort('${startDate}')
        AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')
        AND event_name = 'screen_view'
        AND referrer = '${referrer}'
      GROUP BY event_date
    )
    SELECT
      date_range.date,
      COALESCE(drm.pageviews, 0) as pageviews,
      COALESCE(drm.visitors, 0) as visitors
    FROM date_range
    LEFT JOIN daily_referrer_metrics drm ON date_range.date = drm.event_date
    ORDER BY date_range.date ASC
  `;
  
  // Override the getSql method to return our custom query
  builder.getSql = () => sql;
  
  return builder;
}

/**
 * Creates a builder for fetching referrer types data
 */
export function createReferrerTypesBuilder(websiteId: string, startDate: string, endDate: string) {
  const builder = createSqlBuilder();
  
  // This query requires post-processing with parseReferrer for each returned item
  builder.setTable('events');
  
  builder.sb.select = buildCommonSelect({
    referrer: 'referrer',
    visitors: 'COUNT(DISTINCT anonymous_id) as visitors',
    pageviews: 'COUNT(*) as pageviews'
  });
  
  builder.sb.where = buildWhereClauses(websiteId, startDate, endDate, {
    event_filter: "event_name = 'screen_view'"
  });
  
  builder.sb.groupBy = buildCommonGroupBy({ referrer: 'referrer' });
  builder.sb.orderBy = buildCommonOrderBy({ visitors: 'visitors DESC' });
  
  return builder;
}

/**
 * Creates a builder for fetching traffic source data
 */
export function createTrafficSourceBuilder(websiteId: string, startDate: string, endDate: string) {
  const builder = createSqlBuilder();
  
  const sql = `
    WITH traffic_sources AS (
      SELECT
        CASE
          WHEN referrer = '' THEN 'direct'
          WHEN referrer LIKE '%google.%' THEN 'search'
          WHEN referrer LIKE '%bing.%' THEN 'search'
          WHEN referrer LIKE '%yahoo.%' THEN 'search'
          WHEN referrer LIKE '%facebook.%' THEN 'social'
          WHEN referrer LIKE '%twitter.%' THEN 'social'
          WHEN referrer LIKE '%instagram.%' THEN 'social'
          WHEN referrer LIKE '%linkedin.%' THEN 'social'
          WHEN referrer LIKE '%pinterest.%' THEN 'social'
          WHEN utm_source != '' THEN 'campaign'
          ELSE 'referral'
        END as source,
        COUNT(DISTINCT anonymous_id) as visitors,
        COUNT(*) as pageviews
      FROM analytics.events
      WHERE 
        client_id = '${websiteId}'
        AND time >= parseDateTimeBestEffort('${startDate}')
        AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')
        AND event_name = 'screen_view'
      GROUP BY source
    )
    SELECT
      source,
      visitors,
      pageviews
    FROM traffic_sources
    ORDER BY visitors DESC
  `;
  
  // Override the getSql method to return our custom query
  builder.getSql = () => sql;
  
  return builder;
} 