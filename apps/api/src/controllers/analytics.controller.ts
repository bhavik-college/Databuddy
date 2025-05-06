/**
 * Analytics Controller
 * 
 * Handles processing and storing analytics events from tracking clients.
 */

import type { Context } from 'hono';
import { clickHouse } from '../clickhouse/client';
import { parseUserAgent } from '../utils/user-agent';
import { getGeoData } from '../utils/ip-geo';
import { getRedisCache } from '@databuddy/redis';
import { logger } from '../lib/logger';
import { nanoid } from 'nanoid';

/**
 * Redis client wrapper for recent events cache
 */
const recentEventsCache = {
  async get(key: string): Promise<string | null> {
    try {
      // Use Redis directly for checking duplicates
      const redis = getRedisCache();
      return await redis.get(`recent_events:${key}`);
    } catch (error) {
      logger.warn('Error getting from cache', { key, error });
      return null;
    }
  },
  async set(key: string, value: string): Promise<void> {
    try {
      // Use Redis directly for setting values
      const redis = getRedisCache();
      await redis.setex(`recent_events:${key}`, 300, value);
    } catch (error) {
      logger.warn('Error setting cache', { key, error });
    }
  }
};

/**
 * Create a unique key for an event based on its properties
 * This key is used to detect duplicate events
 */
function createEventKey(websiteId: string, sessionId: string, url: string, eventName: string, timestamp: number): string {
  return `${websiteId}:${sessionId}:${url}:${eventName}:${Math.floor(timestamp / 1000)}`;
}

/**
 * Process a tracking event from databuddy.js client
 */
export async function processEvent(c: Context) {
  const event = c.get('event');
  const website = c.get('website');
  
  if (!event || !website) {
    return c.json({ status: 'error', message: 'Missing event or website data' }, 400);
  }

  try {
    const now = new Date();
    const payload = event.payload;
    const properties = payload.properties || {};
    const enriched = payload.__enriched || {};
    
    // Get exact event time from timestamp_ms
    const eventTimestamp = properties.__timestamp_ms || enriched.timestamp_ms || now.getTime();
    const eventTime = new Date(eventTimestamp);
    
    // Create a unique key for this event to detect duplicates
    const eventKey = createEventKey(
      website.id,
      properties.sessionId || '',
      properties.__path || enriched.url || '',
      payload.name || event.type,
      eventTimestamp
    );
    
    // Check if this is a duplicate event (processed in the last 5 minutes)
    try {
      const existing = await recentEventsCache.get(eventKey);
      if (existing) {
        // This is a duplicate, log it and return success without inserting
        logger.debug('Skipping duplicate event', { eventKey });
        return c.json({ status: 'success', duplicate: true });
      }
      
      // Mark this event as processed
      await recentEventsCache.set(eventKey, now.toISOString());
    } catch (cacheError) {
      // If cache fails, log and continue (better to risk duplicates than lose events)
      logger.warn('Event deduplication cache failed', { error: cacheError });
    }
    
    // Parse user agent
    const userAgent = parseUserAgent(enriched.user_agent || '');
    
    // Get geo data
    const geo = await getGeoData(enriched.ip || '');
    // Map event data to ClickHouse columns
    const eventData = {
      id: nanoid(),
      client_id: website.id,
      event_name: payload.name || event.type,
      anonymous_id: payload.anonymousId || '',
      time: eventTime,
      session_id: properties.sessionId || '',
      referrer: properties.__referrer || enriched.referrer || '',
      url: properties.__path || enriched.url || '',
      path: properties.__path?.split('?')[0] || enriched.path || '',
      title: properties.__title || enriched.title || '',
      ip: enriched.ip || '',
      user_agent: enriched.user_agent || '',
      browser_name: enriched.browser_name || '',
      browser_version: enriched.browser_version || '',
      os_name: enriched.os_name || '',
      os_version: enriched.os_version || '',
      device_type: enriched.device_type || 'desktop',
      device_brand: enriched.device_brand || '',
      device_model: enriched.device_model || '',
      screen_resolution: properties.screen_resolution || properties.screenResolution || enriched.screen_resolution || '',
      viewport_size: properties.viewport_size || properties.viewportSize || enriched.viewport_size || '',
      language: properties.language || enriched.language || '',
      timezone: properties.timezone || enriched.timezone || '',
      connection_type: properties.connection_type || properties.connectionType || enriched.connection_type || '',
      rtt: properties.rtt || enriched.rtt || null,
      time_on_page: properties.timeOnPage || properties.time_on_page || properties.timeSpent || enriched.time_on_page || null,
      country: geo.country || enriched.country || '',
      region: geo.region || enriched.region || '',
      city: geo.city || enriched.city || '',
      utm_source: properties.utmSource || properties.utm_source || (properties.utmParams?.utm_source) || enriched.utm_source || '',
      utm_medium: properties.utmMedium || properties.utm_medium || (properties.utmParams?.utm_medium) || enriched.utm_medium || '',
      utm_campaign: properties.utmCampaign || properties.utm_campaign || (properties.utmParams?.utm_campaign) || enriched.utm_campaign || '',
      utm_term: properties.utmTerm || properties.utm_term || (properties.utmParams?.utm_term) || enriched.utm_term || '',
      utm_content: properties.utmContent || properties.utm_content || (properties.utmParams?.utm_content) || enriched.utm_content || '',
      load_time: properties.loadTime || properties.load_time || enriched.load_time || null,
      dom_ready_time: properties.domReadyTime || properties.dom_ready_time || enriched.dom_ready_time || null,
      ttfb: properties.ttfb || enriched.ttfb || null,
      connection_time: properties.connectionTime || properties.connection_time || enriched.connection_time || null,
      request_time: properties.requestTime || properties.request_time || enriched.request_time || null,
      render_time: properties.renderTime || properties.render_time || enriched.render_time || null,
      fcp: properties.fcp || properties.firstContentfulPaint || enriched.fcp || null,
      lcp: properties.lcp || properties.largestContentfulPaint || enriched.lcp || null,
      cls: properties.cls || properties.cumulativeLayoutShift || enriched.cls || null,
      page_size: properties.pageSize || properties.page_size || enriched.page_size || null,
      scroll_depth: properties.scrollDepth || properties.maxScrollDepth || properties.scroll_depth || enriched.scroll_depth || null,
      interaction_count: properties.interactionCount || properties.interaction_count || enriched.interaction_count || null,
      exit_intent: properties.exitIntent || properties.hasExitIntent || properties.exit_intent || enriched.exit_intent ? 1 : 0,
      // Bounce rate tracking - capture from events or calculate based on page count
      page_count: properties.page_count || 1,
      is_bounce: properties.is_bounce !== undefined ? (properties.is_bounce ? 1 : 0) : 
                (payload.name === 'page_exit' && properties.page_count <= 1 ? 1 : 0),
      // Error event specific fields
      error_message: payload.name === 'error' ? properties.message || '' : null,
      error_filename: payload.name === 'error' ? properties.filename || '' : null,
      error_lineno: payload.name === 'error' ? properties.lineno || null : null,
      error_colno: payload.name === 'error' ? properties.colno || null : null,
      error_stack: payload.name === 'error' ? properties.stack || '' : null,
      error_type: payload.name === 'error' ? properties.errorType || 'Error' : null,
      properties: JSON.stringify({
        __enriched: {
          timestamp_ms: properties.__enriched?.timestamp_ms,
          userAgent: userAgent,
          geo: geo
        }
      }),
      created_at: now
    };

    // Insert into ClickHouse
    await clickHouse.insert({
      table: 'analytics.events',
      values: [eventData],
      format: 'JSONEachRow'
    });

    return c.json({ status: 'success' });
  } catch (error) {
    logger.error('Error processing event:', { error });
    return c.json({ status: 'error', message: 'Failed to process event' }, 500);
  }
}