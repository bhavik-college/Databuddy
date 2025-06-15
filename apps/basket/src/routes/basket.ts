import { Elysia } from 'elysia'
import { AnalyticsEvent, ErrorEvent, WebVitalsEvent, clickHouse } from '@databuddy/db'
import { createHash, randomUUID } from 'node:crypto'
import { getGeo } from '../utils/ip-geo'
import { parseUserAgent } from '../utils/user-agent'
import { getWebsiteById, isValidOrigin } from '../hooks/auth'
import { 
  validatePayloadSize, 
  sanitizeString, 
  validateSessionId,
  validatePerformanceMetric,
  VALIDATION_LIMITS 
} from '../utils/validation'
import { getRedisCache } from '@databuddy/redis'
import crypto from 'node:crypto'

const redis = getRedisCache()

async function insertError(errorData: any, clientId: string): Promise<void> {
  const eventId = sanitizeString(errorData.payload.eventId, VALIDATION_LIMITS.SHORT_STRING_MAX_LENGTH)
  
  // Check for duplicate
  if (await checkDuplicate(eventId, 'error')) {
    return // Skip duplicate
  }

  const errorEvent: ErrorEvent = {
    id: randomUUID(),
    client_id: clientId,
    event_id: sanitizeString(errorData.payload.eventId, VALIDATION_LIMITS.SHORT_STRING_MAX_LENGTH),
    anonymous_id: sanitizeString(errorData.payload.anonymousId, VALIDATION_LIMITS.SHORT_STRING_MAX_LENGTH),
    session_id: validateSessionId(errorData.payload.sessionId),
    timestamp: errorData.payload.timestamp && typeof errorData.payload.timestamp === 'number' ? errorData.payload.timestamp : new Date().getTime(),
    path: sanitizeString(errorData.payload.path, VALIDATION_LIMITS.STRING_MAX_LENGTH),
    message: sanitizeString(errorData.payload.message, VALIDATION_LIMITS.STRING_MAX_LENGTH),
    filename: sanitizeString(errorData.payload.filename, VALIDATION_LIMITS.STRING_MAX_LENGTH),
    lineno: errorData.payload.lineno,
    colno: errorData.payload.colno,
    stack: sanitizeString(errorData.payload.stack, VALIDATION_LIMITS.STRING_MAX_LENGTH),
    error_type: sanitizeString(errorData.payload.errorType, VALIDATION_LIMITS.SHORT_STRING_MAX_LENGTH),
    created_at: new Date().getTime()
  }
  
  await clickHouse.insert({
    table: 'analytics.errors',
    values: [errorEvent],
    format: 'JSONEachRow'
  })

}

async function insertWebVitals(vitalsData: any, clientId: string): Promise<void> {
  const eventId = sanitizeString(vitalsData.payload.eventId, VALIDATION_LIMITS.SHORT_STRING_MAX_LENGTH)
  
  // Check for duplicate
  if (await checkDuplicate(eventId, 'web_vitals')) {
    return // Skip duplicate
  }

  const webVitalsEvent: WebVitalsEvent = {
    id: randomUUID(),
    client_id: clientId,
    event_id: sanitizeString(vitalsData.payload.eventId, VALIDATION_LIMITS.SHORT_STRING_MAX_LENGTH),
    anonymous_id: sanitizeString(vitalsData.payload.anonymousId, VALIDATION_LIMITS.SHORT_STRING_MAX_LENGTH),
    session_id: validateSessionId(vitalsData.payload.sessionId),
    timestamp: vitalsData.payload.timestamp && typeof vitalsData.payload.timestamp === 'number' ? vitalsData.payload.timestamp : new Date().getTime(),
    path: sanitizeString(vitalsData.payload.path, VALIDATION_LIMITS.STRING_MAX_LENGTH),
    fcp: validatePerformanceMetric(vitalsData.payload.fcp),
    lcp: validatePerformanceMetric(vitalsData.payload.lcp),
    cls: validatePerformanceMetric(vitalsData.payload.cls),
    fid: validatePerformanceMetric(vitalsData.payload.fid),
    inp: validatePerformanceMetric(vitalsData.payload.inp),
    created_at: new Date().getTime()
  }

  await clickHouse.insert({
    table: 'analytics.web_vitals',
    values: [webVitalsEvent],
    format: 'JSONEachRow'
  })

}

async function insertTrackEvent(trackData: any, clientId: string, userAgent: string, ip: string): Promise<void> {
  const eventId = sanitizeString(trackData.eventId, VALIDATION_LIMITS.SHORT_STRING_MAX_LENGTH)
  const eventName = sanitizeString(trackData.name, VALIDATION_LIMITS.SHORT_STRING_MAX_LENGTH)
  
  // Simple deduplication using event ID (now consistent for page_exit events)
  if (await checkDuplicate(eventId, 'track')) {
    return // Skip duplicate
  }

  const { anonymizedIP, country, region } = await getGeo(ip)
  const { browserName, browserVersion, osName, osVersion, deviceType, deviceBrand, deviceModel } = parseUserAgent(userAgent)
  
  const trackEvent: AnalyticsEvent = {
    id: randomUUID(),
    client_id: clientId,
    event_name: eventName,
    anonymous_id: sanitizeString(trackData.anonymousId, VALIDATION_LIMITS.SHORT_STRING_MAX_LENGTH),
    time: trackData.timestamp && typeof trackData.timestamp === 'number' ? trackData.timestamp : new Date().getTime(),
    session_id: validateSessionId(trackData.sessionId),
    event_type: 'track',
    event_id: sanitizeString(trackData.eventId, VALIDATION_LIMITS.SHORT_STRING_MAX_LENGTH),
    session_start_time: trackData.sessionStartTime && typeof trackData.sessionStartTime === 'number' ? trackData.sessionStartTime : new Date().getTime(),
    timestamp: trackData.timestamp && typeof trackData.timestamp === 'number' ? trackData.timestamp : new Date().getTime(),
    
    // Page context
    referrer: sanitizeString(trackData.referrer, VALIDATION_LIMITS.STRING_MAX_LENGTH),
    url: sanitizeString(trackData.path, VALIDATION_LIMITS.STRING_MAX_LENGTH),
    path: sanitizeString(trackData.path, VALIDATION_LIMITS.STRING_MAX_LENGTH),
    title: sanitizeString(trackData.title, VALIDATION_LIMITS.STRING_MAX_LENGTH),
    
    ip: anonymizedIP || null,
    user_agent: sanitizeString(userAgent, VALIDATION_LIMITS.STRING_MAX_LENGTH) || null,
    browser_name: browserName || null,
    browser_version: browserVersion || null,
    os_name: osName || null,
    os_version: osVersion || null,
    device_type: deviceType || null,
    device_brand: deviceBrand || null,
    device_model: deviceModel || null,
    country: country || null,
    region: region || null,
    city: null, // No thanks
    
    // User context
    screen_resolution: trackData.screen_resolution,
    viewport_size: trackData.viewport_size,
    language: trackData.language,
    timezone: trackData.timezone,
    
    // Connection info
    connection_type: trackData.connection_type,
    rtt: trackData.rtt,
    downlink: trackData.downlink,
    
    // Engagement metrics
    time_on_page: trackData.time_on_page,
    scroll_depth: trackData.scroll_depth,
    interaction_count: trackData.interaction_count,
    exit_intent: trackData.exit_intent || 0,
    page_count: trackData.page_count || 1,
    is_bounce: trackData.is_bounce || 0,
    has_exit_intent: trackData.has_exit_intent,
    page_size: trackData.page_size,
    
    // UTM parameters
    utm_source: trackData.utm_source,
    utm_medium: trackData.utm_medium,
    utm_campaign: trackData.utm_campaign,
    utm_term: trackData.utm_term,
    utm_content: trackData.utm_content,
    
    // Performance metrics
    load_time: validatePerformanceMetric(trackData.load_time),
    dom_ready_time: validatePerformanceMetric(trackData.dom_ready_time),
    dom_interactive: validatePerformanceMetric(trackData.dom_interactive),
    ttfb: validatePerformanceMetric(trackData.ttfb),
    connection_time: validatePerformanceMetric(trackData.connection_time),
    request_time: validatePerformanceMetric(trackData.request_time),
    render_time: validatePerformanceMetric(trackData.render_time),
    redirect_time: validatePerformanceMetric(trackData.redirect_time),
    domain_lookup_time: validatePerformanceMetric(trackData.domain_lookup_time),
    
    // Web Vitals
    fcp: validatePerformanceMetric(trackData.fcp),
    lcp: validatePerformanceMetric(trackData.lcp),
    cls: validatePerformanceMetric(trackData.cls),
    fid: validatePerformanceMetric(trackData.fid),
    inp: validatePerformanceMetric(trackData.inp),
    
    // Link tracking
    href: trackData.href,
    text: trackData.text,
    
    // Custom event value
    value: trackData.value,
    
    // Error tracking (not used for track events)
    error_message: undefined,
    error_filename: undefined,
    error_lineno: undefined,
    error_colno: undefined,
    error_stack: undefined,
    error_type: undefined,
    
    // Legacy properties
    properties: '{}',
    
    // Metadata
    created_at: new Date().getTime()
  }

  await clickHouse.insert({
    table: 'analytics.events',
    values: [trackEvent],
    format: 'JSONEachRow'
  })

}

async function checkDuplicate(eventId: string, eventType: string): Promise<boolean> {
  const key = `dedup:${eventType}:${eventId}`
  const exists = await redis.exists(key)
  
  if (exists) {
    return true
  }
  
  // Use longer TTL for exit events to prevent duplicates across browser sessions
  const ttl = eventId.startsWith('exit_') ? 172800 : 86400 // 48h for exit events, 24h for others
  await redis.setex(key, ttl, '1')
  return false
}

const app = new Elysia()
  .post('/', async ({ body, query, request }: { body: any, query: any, request: Request }) => {
    if (!validatePayloadSize(body, VALIDATION_LIMITS.PAYLOAD_MAX_SIZE)) {
      return { status: 'error', message: 'Payload too large' }
    }
    
    const eventType = body.type || 'track'
    const clientId = sanitizeString(query.client_id, VALIDATION_LIMITS.SHORT_STRING_MAX_LENGTH)
    
    // Auth check
    if (!clientId) {
      return { status: 'error', message: 'Missing client ID' }
    }
    
    const website = await getWebsiteById(clientId)
    if (!website || website.status !== 'ACTIVE') {
      return { status: 'error', message: 'Invalid or inactive client ID' }
    }
    
    const origin = request.headers.get('origin')
    if (origin && !isValidOrigin(origin, website.domain)) {
      return { status: 'error', message: 'Origin not authorized' }
    }
    
    const userAgent = sanitizeString(request.headers.get('user-agent'), VALIDATION_LIMITS.STRING_MAX_LENGTH) || ''
    const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ''
    
    const saltKey = `salt:${Math.floor(Date.now() / (24 * 60 * 60 * 1000))}`
    
    const salt = await redis.get(saltKey)
    if (!salt) {
      const newSalt = crypto.randomBytes(32).toString('hex')
      await redis.setex(saltKey, 60 * 60 * 24, newSalt)
      return { status: 'success', type: 'salt', salt: newSalt }
    }
    
    body.anonymous_id = createHash('sha256').update(body.anonymous_id + salt).digest('hex')

    if (eventType === 'track') {
      await insertTrackEvent(body, clientId, userAgent, ip)
      return { status: 'success', type: 'track' }
    }
    
    if (eventType === 'error') {
      await insertError(body, clientId)
      return { status: 'success', type: 'error' }
    }
    
    if (eventType === 'web_vitals') {
      await insertWebVitals(body, clientId)
      return { status: 'success', type: 'web_vitals' }
    }

    
    return { status: 'error', message: 'Unknown event type' }
  })
  .post('/batch', async ({ body, query, request }: { body: any, query: any, request: Request }) => {
    // Validate payload size first
    if (!validatePayloadSize(body, VALIDATION_LIMITS.PAYLOAD_MAX_SIZE)) {
      return { status: 'error', message: 'Payload too large' }
    }
    
    // Handle batch events
    if (!Array.isArray(body)) {
      return { status: 'error', message: 'Batch endpoint expects array of events' }
    }
    
    if (body.length > VALIDATION_LIMITS.BATCH_MAX_SIZE) {
      return { status: 'error', message: 'Batch too large' }
    }
    
    const clientId = sanitizeString(query.client_id, VALIDATION_LIMITS.SHORT_STRING_MAX_LENGTH)
    
    // Auth check
    if (!clientId) {
      return { status: 'error', message: 'Missing client ID' }
    }
    
    const website = await getWebsiteById(clientId)
    if (!website || website.status !== 'ACTIVE') {
      return { status: 'error', message: 'Invalid or inactive client ID' }
    }
    
    const origin = request.headers.get('origin')
    if (origin && !isValidOrigin(origin, website.domain)) {
      return { status: 'error', message: 'Origin not authorized' }
    }
    
    const userAgent = sanitizeString(request.headers.get('user-agent'), VALIDATION_LIMITS.STRING_MAX_LENGTH) || ''
    const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ''
    
    // Process each event in the batch
    const results = []
    for (const event of body) {
      const eventType = event.type || 'track'
      
      try {
        if (eventType === 'track') {
          await insertTrackEvent(event, clientId, userAgent, ip)
          results.push({ status: 'success', type: 'track', eventId: event.eventId })
        } else if (eventType === 'error') {
          await insertError(event, clientId)
          results.push({ status: 'success', type: 'error', eventId: event.payload?.eventId })
        } else if (eventType === 'web_vitals') {
          await insertWebVitals(event, clientId)
          results.push({ status: 'success', type: 'web_vitals', eventId: event.payload?.eventId })
        } else {
          results.push({ status: 'error', message: 'Unknown event type', eventType })
        }
      } catch (error) {
        results.push({ status: 'error', message: 'Processing failed', eventType, error: String(error) })
      }
    }
    
    return { status: 'success', batch: true, processed: results.length, results }
  })

export default app
