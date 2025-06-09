/**
 * Analytics Query Execution Utilities
 * 
 * Handles database query execution for analytics
 */

import { chQuery } from '@databuddy/db';
import {
  createSummaryBuilder, 
  createTodayBuilder, 
  createTodayByHourBuilder,
  createTopPagesBuilder,
  createTopReferrersBuilder,
  createEventsByDateBuilder,
  createPerformanceBuilder
} from '../builders/analytics';
import { createCombinedUTMBuilder as createUTMBuilder } from '../builders/utm';
import {
  createDeviceInfoBuilder,
  createGeoInfoBuilder
} from '../builders/combined';
import {
  createEntryPagesBuilder,
  createExitPagesBuilder
} from '../builders/pages';

export interface QueryParams {
  website_id: string;
  adjustedStartDate: string;
  adjustedEndDate: string;
  granularity: 'hourly' | 'daily';
  domain: string;
}

/**
 * Execute all analytics queries in parallel
 */
export async function executeAnalyticsQueries(params: QueryParams) {
  const {
    website_id,
    adjustedStartDate,
    adjustedEndDate,
    granularity,
    domain
  } = params;

  return Promise.all([
    chQuery(createSummaryBuilder(website_id, adjustedStartDate, adjustedEndDate).getSql()),
    chQuery(createTodayBuilder(website_id).getSql()),
    chQuery(createTodayByHourBuilder(website_id).getSql()),
    chQuery(createTopPagesBuilder(website_id, adjustedStartDate, adjustedEndDate, 100).getSql()),
    chQuery(createTopReferrersBuilder(website_id, adjustedStartDate, adjustedEndDate, domain).getSql()),
    chQuery(createEventsByDateBuilder(website_id, adjustedStartDate, adjustedEndDate, granularity).getSql()),
    chQuery(createDeviceInfoBuilder(website_id, adjustedStartDate, adjustedEndDate, 200).getSql()),
    chQuery(createGeoInfoBuilder(website_id, adjustedStartDate, adjustedEndDate, 100).getSql()),
    chQuery(createPerformanceBuilder(website_id, adjustedStartDate, adjustedEndDate).getSql()),
    chQuery(createUTMBuilder(website_id, adjustedStartDate, adjustedEndDate, 30).getSql()),
    chQuery(createEntryPagesBuilder(website_id, adjustedStartDate, adjustedEndDate, 30).getSql()),
    chQuery(createExitPagesBuilder(website_id, adjustedStartDate, adjustedEndDate, 30).getSql()),
  ]);
}

/**
 * Check if tracking has been set up
 */
export function hasTrackingData(summaryData: any[], todayData: any[], eventsByDate: any[]): boolean {
  // Check if there are any pageviews (screen_view events)
  const hasPageviews = (summaryData[0]?.pageviews > 0) || 
                      (todayData[0]?.pageviews > 0) || 
                      (eventsByDate.length > 0 && eventsByDate.some((event: any) => event.pageviews > 0));
  
  // Also check for any events at all (not just pageviews)
  const hasAnyEvents = (summaryData[0]?.total_events > 0) || 
                       (todayData[0]?.total_events > 0);
  
  return hasPageviews || hasAnyEvents;
}

/**
 * Debug function to check raw path data
 */
export async function debugPathData(websiteId: string, startDate: string, endDate: string) {
  const debugSql = `
    SELECT 
      path,
      title,
      url,
      COUNT(*) as count
    FROM analytics.events 
    WHERE 
      client_id = '${websiteId}'
      AND time >= parseDateTimeBestEffort('${startDate}')
      AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')
      AND event_name = 'screen_view'
    GROUP BY path, title, url
    ORDER BY count DESC
    LIMIT 10
  `;
  
  console.log('Debug SQL:', debugSql);
  const result = await chQuery(debugSql);
  console.log('Raw path data from database:', result);
  return result;
} 