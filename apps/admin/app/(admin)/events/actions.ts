"use server";

import { chQuery } from "@databuddy/db";

export interface ClickhouseEvent {
  id: string;
  client_id: string;
  event_name: string;
  anonymous_id: string;
  time: string;
  session_id: string;
  referrer: string | null;
  url: string;
  path: string;
  title: string | null;
  ip: string;
  user_agent: string;
  browser_name: string | null;
  browser_version: string | null;
  os_name: string | null;
  os_version: string | null;
  device_type: string | null;
  screen_resolution: string | null;
  language: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  properties: string;
  created_at: string;
  [key: string]: any;
}

export interface EventsQueryParams {
  limit?: number;
  offset?: number;
  from?: string;
  to?: string;
  client_id?: string;
  event_name?: string;
  search?: string;
  browser_name?: string;
  os_name?: string;
  country?: string;
  device_type?: string;
  path?: string;
  anonymous_id?: string;
  session_id?: string;
  ip?: string;
  has_error?: boolean;
  sort_by?: 'time' | 'event_name' | 'path' | 'country';
  sort_order?: 'ASC' | 'DESC';
  properties_filter?: string;
  performance_threshold?: number;
}

export interface EventStats {
  total_events: number;
  unique_sessions: number;
  unique_users: number;
  unique_pages: number;
  unique_countries: number;
  error_rate: number;
  avg_session_duration: number;
  top_events: Array<{ event_name: string; count: number }>;
  top_pages: Array<{ path: string; count: number }>;
  top_countries: Array<{ country: string; count: number }>;
  top_browsers: Array<{ browser_name: string; count: number }>;
  hourly_distribution: Array<{ hour: number; count: number }>;
}

export interface RealTimeStats {
  events_last_minute: number;
  events_last_hour: number;
  active_sessions: number;
  top_pages_now: Array<{ path: string; count: number }>;
  recent_errors: Array<{ time: string; event_name: string; path: string; error_message?: string }>;
}

function escapeString(str: string): string {
  return str.replace(/'/g, "''");
}

function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

export async function fetchEvents(params: EventsQueryParams = {}) {
  try {
    const {
      limit = 25,
      offset = 0,
      from,
      to,
      client_id,
      event_name,
      search,
      browser_name,
      os_name,
      country,
      device_type,
      path,
      anonymous_id,
      session_id,
      ip,
      has_error,
      sort_by = 'time',
      sort_order = 'DESC',
      properties_filter,
      performance_threshold,
    } = params;

    // Build the query conditions
    const conditions = [];
    
    // Date range filters
    if (from) {
      const fromDate = new Date(from);
      if (!Number.isNaN(fromDate.getTime())) {
        conditions.push(`time >= parseDateTimeBestEffort('${escapeString(from)}')`);
      }
    }
    if (to) {
      const toDate = new Date(`${to}T23:59:59`);
      if (!Number.isNaN(toDate.getTime())) {
        conditions.push(`time <= parseDateTimeBestEffort('${escapeString(`${to} 23:59:59`)}')`);
      }
    }

    // Basic filters
    if (client_id) {
      if (isValidUUID(client_id)) {
        conditions.push(`client_id = '${escapeString(client_id)}'`);
      } else {
        conditions.push(`toString(client_id) ILIKE '%${escapeString(client_id)}%'`);
      }
    }
    if (event_name) conditions.push(`event_name = '${escapeString(event_name)}'`);
    if (browser_name) conditions.push(`browser_name ILIKE '%${escapeString(browser_name)}%'`);
    if (os_name) conditions.push(`os_name ILIKE '%${escapeString(os_name)}%'`);
    if (country) conditions.push(`country ILIKE '%${escapeString(country)}%'`);
    if (device_type) conditions.push(`device_type ILIKE '%${escapeString(device_type)}%'`);
    if (anonymous_id) {
      if (isValidUUID(anonymous_id)) {
        conditions.push(`anonymous_id = '${escapeString(anonymous_id)}'`);
      } else {
        conditions.push(`toString(anonymous_id) ILIKE '%${escapeString(anonymous_id)}%'`);
      }
    }
    if (session_id) {
      if (isValidUUID(session_id)) {
        conditions.push(`session_id = '${escapeString(session_id)}'`);
      } else {
        conditions.push(`toString(session_id) ILIKE '%${escapeString(session_id)}%'`);
      }
    }
    if (ip) conditions.push(`ip ILIKE '%${escapeString(ip)}%'`);
    if (has_error !== undefined) {
      conditions.push(has_error ? `event_name = 'error'` : `event_name != 'error'`);
    }

    // Path filter with wildcard support
    if (path) {
      if (path.includes('*')) {
        const pathPattern = escapeString(path.replace(/\*/g, '%'));
        conditions.push(`path ILIKE '${pathPattern}'`);
      } else {
        conditions.push(`path = '${escapeString(path)}'`);
      }
    }

    // Properties filter (JSON search)
    if (properties_filter) {
      conditions.push(`properties ILIKE '%${escapeString(properties_filter)}%'`);
    }

    // Performance threshold filter
    if (performance_threshold) {
      conditions.push(`JSONExtractFloat(properties, 'load_time') > ${performance_threshold}`);
    }

    // Advanced search - FIXED UUID issue
    if (search) {
      const escapedSearch = escapeString(search);
      const searchConditions = [];
      
      // Only search UUID fields if search term looks like a UUID
      if (isValidUUID(search)) {
        searchConditions.push(`id = '${escapedSearch}'`);
        searchConditions.push(`client_id = '${escapedSearch}'`);
        searchConditions.push(`anonymous_id = '${escapedSearch}'`);
        searchConditions.push(`session_id = '${escapedSearch}'`);
      } else {
        // For non-UUID searches, cast UUID fields to string
        searchConditions.push(`toString(id) ILIKE '%${escapedSearch}%'`);
        searchConditions.push(`toString(client_id) ILIKE '%${escapedSearch}%'`);
        searchConditions.push(`toString(anonymous_id) ILIKE '%${escapedSearch}%'`);
        searchConditions.push(`toString(session_id) ILIKE '%${escapedSearch}%'`);
      }
      
      // Text fields can use ILIKE directly
      searchConditions.push(`event_name ILIKE '%${escapedSearch}%'`);
      searchConditions.push(`url ILIKE '%${escapedSearch}%'`);
      searchConditions.push(`path ILIKE '%${escapedSearch}%'`);
      searchConditions.push(`title ILIKE '%${escapedSearch}%'`);
      searchConditions.push(`properties ILIKE '%${escapedSearch}%'`);
      searchConditions.push(`referrer ILIKE '%${escapedSearch}%'`);
      searchConditions.push(`browser_name ILIKE '%${escapedSearch}%'`);
      searchConditions.push(`os_name ILIKE '%${escapedSearch}%'`);
      searchConditions.push(`country ILIKE '%${escapedSearch}%'`);
      searchConditions.push(`region ILIKE '%${escapedSearch}%'`);
      searchConditions.push(`city ILIKE '%${escapedSearch}%'`);
      searchConditions.push(`ip ILIKE '%${escapedSearch}%'`);
      searchConditions.push(`user_agent ILIKE '%${escapedSearch}%'`);
      
      conditions.push(`(${searchConditions.join(' OR ')})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Build ORDER BY clause
    const validSortFields = ['time', 'event_name', 'path', 'country'];
    const sortField = validSortFields.includes(sort_by) ? sort_by : 'time';
    const sortDirection = sort_order === 'ASC' ? 'ASC' : 'DESC';
    const orderClause = `ORDER BY ${sortField} ${sortDirection}`;

    // Count total matching events
    const totalQuery = `
      SELECT count() as total 
      FROM analytics.events
      ${whereClause}
    `;
    
    const totalResult = await chQuery<{ total: number }>(totalQuery);
    const total = totalResult[0]?.total || 0;

    // Fetch events with pagination
    const eventsQuery = `
      SELECT *
      FROM analytics.events
      ${whereClause}
      ${orderClause}
      LIMIT ${limit}
      OFFSET ${offset}
    `;
    
    const data = await chQuery<ClickhouseEvent>(eventsQuery);
    
    return { data, total };
  } catch (error) {
    console.error("Error fetching events:", error);
    return { data: [], total: 0, error: String(error) };
  }
}

export async function fetchEventStats(params: Pick<EventsQueryParams, 'from' | 'to' | 'client_id'> = {}): Promise<EventStats> {
  try {
    const { from, to, client_id } = params;
    
    const conditions = [];
    if (from) conditions.push(`time >= parseDateTimeBestEffort('${escapeString(from)}')`);
    if (to) conditions.push(`time <= parseDateTimeBestEffort('${escapeString(`${to} 23:59:59`)}')`);
    if (client_id) conditions.push(`client_id = '${escapeString(client_id)}'`);
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Main stats query
    const statsQuery = `
      SELECT
        count() as total_events,
        uniq(session_id) as unique_sessions,
        uniq(anonymous_id) as unique_users,
        uniq(path) as unique_pages,
        uniq(country) as unique_countries,
        countIf(event_name = 'error') / count() * 100 as error_rate
      FROM analytics.events
      ${whereClause}
    `;

    // Session duration calculation
    const sessionDurationQuery = `
      SELECT
        avg(duration) as avg_session_duration
      FROM (
        SELECT
          session_id,
          dateDiff('second', min(time), max(time)) as duration
        FROM analytics.events
        ${whereClause}
        GROUP BY session_id
        HAVING duration > 0
      )
    `;

    // Top events
    const topEventsQuery = `
      SELECT
        event_name,
        count() as count
      FROM analytics.events
      ${whereClause}
      GROUP BY event_name
      ORDER BY count DESC
      LIMIT 10
    `;

    // Top pages
    const topPagesQuery = `
      SELECT
        path,
        count() as count
      FROM analytics.events
      ${whereClause}
      AND event_name = 'screen_view'
      GROUP BY path
      ORDER BY count DESC
      LIMIT 10
    `;

    // Top countries
    const topCountriesQuery = `
      SELECT
        country,
        count() as count
      FROM analytics.events
      ${whereClause}
      AND country != ''
      GROUP BY country
      ORDER BY count DESC
      LIMIT 10
    `;

    // Top browsers
    const topBrowsersQuery = `
      SELECT
        browser_name,
        count() as count
      FROM analytics.events
      ${whereClause}
      AND browser_name != ''
      GROUP BY browser_name
      ORDER BY count DESC
      LIMIT 10
    `;

    // Hourly distribution
    const hourlyQuery = `
      SELECT
        toHour(time) as hour,
        count() as count
      FROM analytics.events
      ${whereClause}
      GROUP BY hour
      ORDER BY hour
    `;

    const [
      statsResult,
      sessionDurationResult,
      topEventsResult,
      topPagesResult,
      topCountriesResult,
      topBrowsersResult,
      hourlyResult
    ] = await Promise.all([
      chQuery<{ total_events: number; unique_sessions: number; unique_users: number; unique_pages: number; unique_countries: number; error_rate: number }>(statsQuery),
      chQuery<{ avg_session_duration: number }>(sessionDurationQuery),
      chQuery<{ event_name: string; count: number }>(topEventsQuery),
      chQuery<{ path: string; count: number }>(topPagesQuery),
      chQuery<{ country: string; count: number }>(topCountriesQuery),
      chQuery<{ browser_name: string; count: number }>(topBrowsersQuery),
      chQuery<{ hour: number; count: number }>(hourlyQuery)
    ]);

    const stats = statsResult[0] || {
      total_events: 0,
      unique_sessions: 0,
      unique_users: 0,
      unique_pages: 0,
      unique_countries: 0,
      error_rate: 0
    };

    return {
      ...stats,
      avg_session_duration: sessionDurationResult[0]?.avg_session_duration || 0,
      top_events: topEventsResult,
      top_pages: topPagesResult,
      top_countries: topCountriesResult,
      top_browsers: topBrowsersResult,
      hourly_distribution: hourlyResult
    };
  } catch (error) {
    console.error("Error fetching event stats:", error);
    return {
      total_events: 0,
      unique_sessions: 0,
      unique_users: 0,
      unique_pages: 0,
      unique_countries: 0,
      error_rate: 0,
      avg_session_duration: 0,
      top_events: [],
      top_pages: [],
      top_countries: [],
      top_browsers: [],
      hourly_distribution: []
    };
  }
}

export async function fetchRealTimeStats(): Promise<RealTimeStats> {
  try {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    // Events in last minute
    const lastMinuteQuery = `
      SELECT count() as count
      FROM analytics.events
      WHERE time >= parseDateTimeBestEffort('${oneMinuteAgo.toISOString()}')
    `;

    // Events in last hour
    const lastHourQuery = `
      SELECT count() as count
      FROM analytics.events
      WHERE time >= parseDateTimeBestEffort('${oneHourAgo.toISOString()}')
    `;

    // Active sessions (sessions with activity in last 5 minutes)
    const activeSessionsQuery = `
      SELECT uniq(session_id) as count
      FROM analytics.events
      WHERE time >= parseDateTimeBestEffort('${fiveMinutesAgo.toISOString()}')
    `;

    // Top pages right now (last 5 minutes)
    const topPagesNowQuery = `
      SELECT
        path,
        count() as count
      FROM analytics.events
      WHERE time >= parseDateTimeBestEffort('${fiveMinutesAgo.toISOString()}')
      AND event_name = 'screen_view'
      GROUP BY path
      ORDER BY count DESC
      LIMIT 5
    `;

    // Recent errors (last hour)
    const recentErrorsQuery = `
      SELECT
        time,
        event_name,
        path,
        JSONExtractString(properties, 'message') as error_message
      FROM analytics.events
      WHERE time >= parseDateTimeBestEffort('${oneHourAgo.toISOString()}')
      AND event_name = 'error'
      ORDER BY time DESC
      LIMIT 10
    `;

    const [
      lastMinuteResult,
      lastHourResult,
      activeSessionsResult,
      topPagesNowResult,
      recentErrorsResult
    ] = await Promise.all([
      chQuery<{ count: number }>(lastMinuteQuery),
      chQuery<{ count: number }>(lastHourQuery),
      chQuery<{ count: number }>(activeSessionsQuery),
      chQuery<{ path: string; count: number }>(topPagesNowQuery),
      chQuery<{ time: string; event_name: string; path: string; error_message?: string }>(recentErrorsQuery)
    ]);

    return {
      events_last_minute: lastMinuteResult[0]?.count || 0,
      events_last_hour: lastHourResult[0]?.count || 0,
      active_sessions: activeSessionsResult[0]?.count || 0,
      top_pages_now: topPagesNowResult,
      recent_errors: recentErrorsResult
    };
  } catch (error) {
    console.error("Error fetching real-time stats:", error);
    return {
      events_last_minute: 0,
      events_last_hour: 0,
      active_sessions: 0,
      top_pages_now: [],
      recent_errors: []
    };
  }
}

export async function exportEvents(params: EventsQueryParams = {}, format: 'csv' | 'json' = 'csv') {
  try {
    const { data } = await fetchEvents({ ...params, limit: 10000, offset: 0 });
    
    if (format === 'json') {
      return {
        content: JSON.stringify(data, null, 2),
        filename: `events_${new Date().toISOString().split('T')[0]}.json`,
        mimeType: 'application/json'
      };
    }

    // CSV format
    if (data.length === 0) {
      return {
        content: '',
        filename: `events_${new Date().toISOString().split('T')[0]}.csv`,
        mimeType: 'text/csv'
      };
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          return typeof value === 'string' && value.includes(',') 
            ? `"${value.replace(/"/g, '""')}"` 
            : String(value);
        }).join(',')
      )
    ].join('\n');

    return {
      content: csvContent,
      filename: `events_${new Date().toISOString().split('T')[0]}.csv`,
      mimeType: 'text/csv'
    };
  } catch (error) {
    console.error("Error exporting events:", error);
    throw new Error(`Export failed: ${error}`);
  }
}

export async function fetchEventsBySession(sessionId: string) {
  try {
    const query = `
      SELECT *
      FROM analytics.events
      WHERE session_id = '${escapeString(sessionId)}'
      ORDER BY time ASC
    `;
    
    const data = await chQuery<ClickhouseEvent>(query);
    return { data, total: data.length };
  } catch (error) {
    console.error("Error fetching session events:", error);
    return { data: [], total: 0, error: String(error) };
  }
}

export async function fetchEventsByUser(anonymousId: string) {
  try {
    const query = `
      SELECT *
      FROM analytics.events
      WHERE anonymous_id = '${escapeString(anonymousId)}'
      ORDER BY time DESC
      LIMIT 1000
    `;
    
    const data = await chQuery<ClickhouseEvent>(query);
    return { data, total: data.length };
  } catch (error) {
    console.error("Error fetching user events:", error);
    return { data: [], total: 0, error: String(error) };
  }
} 