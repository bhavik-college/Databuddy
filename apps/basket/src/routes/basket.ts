/**
 * Databuddy Analytics Collection Endpoint (Basket)
 * Collects analytics events from the databuddy.js client and stores them in ClickHouse.
 */

import { Hono } from 'hono';
import { websiteAuthHook } from '../hooks/auth';
import { processEvent } from '../controllers/analytics.controller';
import type { AppVariables, TrackingEvent } from '../types';
import { UAParser } from 'ua-parser-js';
import { parseIp, anonymizeIp } from '../utils/ip-geo';
import { parseReferrer } from '../utils/referrer';
import { isBot } from '../lists';
import { logger } from '../lib/logger';
import { getRedisCache } from '@databuddy/redis';
import {
  analyticsEventSchema,
  batchAnalyticsEventSchema,
  validatePayloadSize,
  validateProperties,
  filterSafeHeaders,
  validateLanguage,
  validateTimezone,
  validateTimezoneOffset,
  validateSessionId,
  validateUtmParameter,
  validatePerformanceMetric,
  validateScreenResolution,
  validateViewportSize,
  validateScrollDepth,
  validatePageCount,
  validateInteractionCount,
  validateExitIntent,
  sanitizeString,
  VALIDATION_LIMITS
} from '../utils/validation';

const redis = getRedisCache();

const basketRouter = new Hono<{ Variables: AppVariables & { enriched?: any } }>();

basketRouter.use(websiteAuthHook());

const enrichEvent = (properties: Record<string, any>, enriched: any) => {
  const customProperties: Record<string, any> = {};
  const standardProperties: Record<string, any> = {};

  for (const key in properties) {
    if (Object.prototype.hasOwnProperty.call(properties, key)) {
      if (key.startsWith('__')) {
        standardProperties[key] = properties[key];
      } else {
        const standardKeys = ['screen_resolution', 'viewport_size', 'language', 'timezone', 'timezone_offset', 'connection_type', 'connection_speed', 'rtt', 'load_time', 'dom_ready_time', 'ttfb', 'redirect_time', 'domain_lookup_time', 'connection_time', 'request_time', 'render_time', 'fcp', 'lcp', 'cls', 'page_size', 'time_on_page', 'page_count', 'scroll_depth', 'interaction_count', 'exit_intent', 'sessionId', 'sessionStartTime', 'is_bounce'];
        if (standardKeys.includes(key)) {
          standardProperties[key] = properties[key];
        } else {
          customProperties[key] = properties[key];
        }
      }
    }
  }

  const validatedProperties = validateProperties(standardProperties);
  
  let currentDomain = '';
  try {
    const urlPath = validatedProperties.__path || enriched.path;
    if (urlPath && typeof urlPath === 'string') {
      currentDomain = new URL(urlPath).hostname;
    }
  } catch (e) {
    logger.warn(new Error(`Invalid URL path provided: ${validatedProperties.__path || enriched.path}`));
    currentDomain = '';
  }
  
  let referrer = validatedProperties.__referrer || enriched.referrer;
  let referrerType = validatedProperties.__referrer_type;
  let referrerName = validatedProperties.__referrer_name;
  
  if (referrer && currentDomain && referrer !== 'direct') {
    try {
      const referrerUrl = new URL(referrer as string);
      if (referrerUrl.hostname === currentDomain) {
        referrer = 'direct';
        referrerType = 'direct';
        referrerName = 'Direct';
      }
    } catch (e) {
      logger.warn(new Error(`Invalid referrer URL: ${referrer}`));
    }
  }

  return {
    screen_resolution: validateScreenResolution(validatedProperties.screen_resolution),
    viewport_size: validateViewportSize(validatedProperties.viewport_size),
    language: validateLanguage(validatedProperties.language || enriched.language),
    timezone: validateTimezone(validatedProperties.timezone || enriched.timezone),
    timezone_offset: validateTimezoneOffset(validatedProperties.timezone_offset),
    connection_type: sanitizeString(validatedProperties.connection_type, VALIDATION_LIMITS.SHORT_STRING_MAX_LENGTH),
    connection_speed: sanitizeString(validatedProperties.connection_speed, VALIDATION_LIMITS.SHORT_STRING_MAX_LENGTH),
    rtt: validatePerformanceMetric(validatedProperties.rtt),
    load_time: validatePerformanceMetric(validatedProperties.load_time),
    dom_ready_time: validatePerformanceMetric(validatedProperties.dom_ready_time),
    ttfb: validatePerformanceMetric(validatedProperties.ttfb),
    redirect_time: validatePerformanceMetric(validatedProperties.redirect_time),
    domain_lookup_time: validatePerformanceMetric(validatedProperties.domain_lookup_time),
    connection_time: validatePerformanceMetric(validatedProperties.connection_time),
    request_time: validatePerformanceMetric(validatedProperties.request_time),
    render_time: validatePerformanceMetric(validatedProperties.render_time),
    fcp: validatePerformanceMetric(validatedProperties.fcp),
    lcp: validatePerformanceMetric(validatedProperties.lcp),
    cls: validatePerformanceMetric(validatedProperties.cls),
    page_size: validatePerformanceMetric(validatedProperties.page_size),
    time_on_page: validatePerformanceMetric(validatedProperties.time_on_page),
    page_count: validatePageCount(validatedProperties.page_count),
    scroll_depth: validateScrollDepth(validatedProperties.scroll_depth),
    interaction_count: validateInteractionCount(validatedProperties.interaction_count),
    exit_intent: validateExitIntent(validatedProperties.exit_intent),
    title: sanitizeString(validatedProperties.__title, VALIDATION_LIMITS.STRING_MAX_LENGTH),
    path: sanitizeString(validatedProperties.__path || enriched.path, VALIDATION_LIMITS.STRING_MAX_LENGTH),
    session_id: validateSessionId(validatedProperties.sessionId),
    session_start_time: validatePerformanceMetric(validatedProperties.sessionStartTime),
    referrer: sanitizeString(referrer, VALIDATION_LIMITS.STRING_MAX_LENGTH),
    referrer_type: sanitizeString(referrerType, VALIDATION_LIMITS.SHORT_STRING_MAX_LENGTH),
    referrer_name: sanitizeString(referrerName, VALIDATION_LIMITS.SHORT_STRING_MAX_LENGTH),
    sdk_name: sanitizeString(validatedProperties.__sdk_name || (validatedProperties.__enriched as any)?.sdk_name, VALIDATION_LIMITS.SHORT_STRING_MAX_LENGTH),
    sdk_version: sanitizeString(validatedProperties.__sdk_version || (validatedProperties.__enriched as any)?.sdk_version, VALIDATION_LIMITS.SHORT_STRING_MAX_LENGTH),
    __raw_properties: customProperties,
    __enriched: null
  };
};

basketRouter.use('*', async (c, next) => {
  const userAgent = sanitizeString(c.req.header('user-agent'), VALIDATION_LIMITS.STRING_MAX_LENGTH);
  const referrer = sanitizeString(c.req.header('referer'), VALIDATION_LIMITS.STRING_MAX_LENGTH);
  const url = new URL(c.req.url);
  const rawLanguage = c.req.header('accept-language')?.split(',')[0] || '';
  const language = validateLanguage(rawLanguage);

  if (isBot(userAgent)) {
    try {
      redis.publish('bot_requests', 'Bot request');
    } catch (error) {
      logger.warn('Redis operation failed for bot tracking', { error: error instanceof Error ? error.message : String(error) });
    }
    logger.info('Skipping bot request', { userAgent });
    return c.json({ status: 'skipped', message: 'Bot request' }, 200);
  }

  const parser = new UAParser(userAgent);
  const result = parser.getResult();
  
  // Use safe header filtering instead of copying all headers
  const safeHeaders = filterSafeHeaders(c.req.header());
  const headers = new Headers();
  for (const [key, value] of Object.entries(safeHeaders)) {
    headers.append(key, value);
  }
  
  const request = new Request(c.req.url, { headers, method: c.req.method });
  const geo = await parseIp(request);
  const referrerInfo = parseReferrer(referrer);
  const urlParams = new URLSearchParams(url.search);

  c.set('enriched', {
    url: url.toString(),
    path: url.pathname,
    title: '',
    user_agent: userAgent,
    browser_name: sanitizeString(result.browser.name, VALIDATION_LIMITS.SHORT_STRING_MAX_LENGTH),
    browser_version: sanitizeString(result.browser.version, VALIDATION_LIMITS.SHORT_STRING_MAX_LENGTH),
    os_name: sanitizeString(result.os.name, VALIDATION_LIMITS.SHORT_STRING_MAX_LENGTH),
    os_version: sanitizeString(result.os.version, VALIDATION_LIMITS.SHORT_STRING_MAX_LENGTH),
    device_type: sanitizeString(result.device.type, VALIDATION_LIMITS.SHORT_STRING_MAX_LENGTH) || 'desktop',
    device_brand: sanitizeString(result.device.vendor, VALIDATION_LIMITS.SHORT_STRING_MAX_LENGTH),
    device_model: sanitizeString(result.device.model, VALIDATION_LIMITS.SHORT_STRING_MAX_LENGTH),
    screen_resolution: '',
    viewport_size: '',
    language,
    timezone: validateTimezone(geo.timezone),
    timezone_offset: null,
    connection_type: '',
    connection_speed: '',
    rtt: null,
    ip: anonymizeIp(geo.ip || ''),
    country: sanitizeString(geo.country, VALIDATION_LIMITS.SHORT_STRING_MAX_LENGTH),
    region: sanitizeString(geo.region, VALIDATION_LIMITS.SHORT_STRING_MAX_LENGTH),
    referrer: referrerInfo.url,
    utm_source: validateUtmParameter(urlParams.get('utm_source')),
    utm_medium: validateUtmParameter(urlParams.get('utm_medium')),
    utm_campaign: validateUtmParameter(urlParams.get('utm_campaign')),
    utm_term: validateUtmParameter(urlParams.get('utm_term')),
    utm_content: validateUtmParameter(urlParams.get('utm_content')),
    load_time: null,
    dom_ready_time: null,
    ttfb: null,
    redirect_time: null,
    domain_lookup_time: null,
    connection_time: null,
    request_time: null,
    render_time: null,
    fcp: null,
    lcp: null,
    cls: null,
    page_size: null,
    time_on_page: null,
    page_count: null,
    scroll_depth: null,
    interaction_count: null,
    exit_intent: 0
  });

  await next();
});

basketRouter.post('/', async (c) => {
  try {
    const requestBody = await c.req.json();
    
    // Comprehensive payload validation
    if (!validatePayloadSize(requestBody, VALIDATION_LIMITS.PAYLOAD_MAX_SIZE)) {
      return c.json({ 
        status: 'error', 
        message: 'Request payload too large'
      }, 413);
    }
    
    const validationResult = analyticsEventSchema.safeParse(requestBody);
    
    if (!validationResult.success) {
      return c.json({ 
        status: 'error', 
        message: 'Invalid event data',
        errors: validationResult.error.issues
      }, 400);
    }
    
    const enriched = c.get('enriched');
    const properties = validationResult.data.payload.properties || {};
    
    const enrichedProperties = enrichEvent(properties, enriched);
    const mappedEvent = {
      ...validationResult.data,
      payload: {
        ...validationResult.data.payload,
        properties: enrichedProperties
      }
    } as TrackingEvent;
    
    c.set('event', mappedEvent);
    return processEvent(c);
  } catch (error) {
    logger.error('Error processing event', { error: error instanceof Error ? error.message : String(error) });
    return c.json({ 
      status: 'error', 
      message: 'Failed to process event'
    }, 500);
  }
});

basketRouter.post('/batch', async (c) => {
  try {
    const requestBody = await c.req.json();
    
    // Comprehensive batch payload validation
    if (!validatePayloadSize(requestBody, VALIDATION_LIMITS.BATCH_PAYLOAD_MAX_SIZE)) {
      return c.json({ 
        status: 'error', 
        message: 'Batch payload too large'
      }, 413);
    }
    
    const validationResult = batchAnalyticsEventSchema.safeParse(requestBody);
    
    if (!validationResult.success) {
      return c.json({ 
        status: 'error', 
        message: 'Invalid batch events data',
        errors: validationResult.error.issues
      }, 400);
    }
    
    const enriched = c.get('enriched');
    const events = validationResult.data;
    const results = [];
    
    for (const event of events) {
      const properties = event.payload.properties || {};
      
      const enrichedProperties = enrichEvent(properties, enriched);
      const mappedEvent = {
        ...event,
        payload: {
          ...event.payload,
          properties: enrichedProperties
        }
      } as TrackingEvent;
      
      c.set('event', mappedEvent);
      try {
        const result = await processEvent(c);
        const resultData = await result.json() as { status: string };
        results.push({
          status: resultData.status, 
          eventName: event.payload.name,
          anonymousId: event.payload.anonymousId?.substring(0, 8)
        });
      } catch (error) {
        logger.error('Error processing batch event', { 
          error: error instanceof Error ? error.message : String(error),
          eventName: event.payload.name 
        });
        results.push({
          status: 'error',
          eventName: event.payload.name,
          anonymousId: event.payload.anonymousId?.substring(0, 8),
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    return c.json({
      status: 'success',
      message: `Processed ${events.length} events`,
      processed: results
    }, 200);
  } catch (error) {
    logger.error({ message: `Error processing batch events: ${error instanceof Error ? error.message : String(error)}` });
    return c.json({ 
      status: 'error', 
      message: 'Failed to process batch events'
    }, 500);
  }
});

export default basketRouter;
