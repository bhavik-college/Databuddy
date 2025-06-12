import { clickHouse } from './client';


// Define the analytics database schema with tables for events, sessions, and aggregated data
const ANALYTICS_DATABASE = 'analytics';

// SQL statements for creating the analytics database and tables
const CREATE_DATABASE = `
CREATE DATABASE IF NOT EXISTS ${ANALYTICS_DATABASE}
`;

// Events table stores all raw events
const CREATE_EVENTS_TABLE = `
CREATE TABLE IF NOT EXISTS ${ANALYTICS_DATABASE}.events (
  id UUID,
  client_id String,
  event_name String,
  anonymous_id String,
  time DateTime64(3, 'UTC'),
  session_id String,
  referrer Nullable(String),
  url String,
  path String,
  title Nullable(String),
  ip String,
  user_agent String,
  browser_name Nullable(String),
  browser_version Nullable(String),
  os_name Nullable(String),
  os_version Nullable(String),
  device_type Nullable(String),
  device_brand Nullable(String),
  device_model Nullable(String),
  screen_resolution Nullable(String),
  viewport_size Nullable(String),
  language Nullable(String),
  timezone Nullable(String),
  connection_type Nullable(String),
  rtt Nullable(Int16),
  time_on_page Nullable(Float32),
  country Nullable(String),
  region Nullable(String),
  city Nullable(String),
  utm_source Nullable(String),
  utm_medium Nullable(String),
  utm_campaign Nullable(String),
  utm_term Nullable(String),
  utm_content Nullable(String),
  load_time Nullable(Int32),
  dom_ready_time Nullable(Int32),
  ttfb Nullable(Int32),
  connection_time Nullable(Int32),
  request_time Nullable(Int32),
  render_time Nullable(Int32),
  fcp Nullable(Int32),
  lcp Nullable(Int32),
  cls Nullable(Float32),
  page_size Nullable(Int32),
  scroll_depth Nullable(Float32),
  interaction_count Nullable(Int16),
  exit_intent UInt8,
  page_count UInt8 DEFAULT 1,
  is_bounce UInt8 DEFAULT 1,
  error_message Nullable(String),
  error_filename Nullable(String),
  error_lineno Nullable(Int32),
  error_colno Nullable(Int32),
  error_stack Nullable(String),
  error_type Nullable(String),
  properties String,
  created_at DateTime64(3, 'UTC')
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(time)
ORDER BY (client_id, time, id)
TTL toDateTime(time) + INTERVAL 24 MONTH
SETTINGS index_granularity = 8192
`;

// Sessions table for tracking user sessions
const CREATE_SESSIONS_TABLE = `
CREATE TABLE IF NOT EXISTS ${ANALYTICS_DATABASE}.sessions (
  session_id String,
  client_id String,
  anonymous_id String,
  start_time DateTime64(3, 'UTC'),
  end_time DateTime64(3, 'UTC'),
  duration Int32,
  pages Int32,
  is_bounce UInt8,
  entry_page String,
  exit_page String,
  country String,
  region String,
  city String,
  browser String,
  os String,
  device_type String,
  referrer String,
  utm_source String,
  utm_medium String,
  utm_campaign String,
  created_at DateTime64(3, 'UTC')
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(start_time)
ORDER BY (client_id, start_time, session_id)
TTL toDateTime(start_time) + INTERVAL 24 MONTH
SETTINGS index_granularity = 8192
`;

// Daily stats aggregation table
const CREATE_DAILY_STATS_TABLE = `
CREATE TABLE IF NOT EXISTS ${ANALYTICS_DATABASE}.daily_stats (
  client_id String,
  date Date,
  pageviews Int32,
  visitors Int32,
  sessions Int32,
  bounce_rate Float32,
  avg_session_duration Float32,
  created_at DateTime64(3, 'UTC')
) ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (client_id, date)
TTL date + INTERVAL 24 MONTH
SETTINGS index_granularity = 8192
`;

// Page stats aggregation table
const CREATE_PAGE_STATS_TABLE = `
CREATE TABLE IF NOT EXISTS ${ANALYTICS_DATABASE}.page_stats (
  client_id String,
  date Date,
  path String,
  pageviews Int32,
  visitors Int32,
  avg_time_on_page Float32,
  created_at DateTime64(3, 'UTC')
) ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (client_id, date, path)
TTL date + INTERVAL 24 MONTH
SETTINGS index_granularity = 8192
`;

// Referrer stats aggregation table
const CREATE_REFERRER_STATS_TABLE = `
CREATE TABLE IF NOT EXISTS ${ANALYTICS_DATABASE}.referrer_stats (
  client_id String,
  date Date,
  referrer String,
  visitors Int32,
  pageviews Int32,
  created_at DateTime64(3, 'UTC')
) ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (client_id, date, referrer)
TTL date + INTERVAL 24 MONTH
SETTINGS index_granularity = 8192
`;

// Location stats aggregation table
const CREATE_LOCATION_STATS_TABLE = `
CREATE TABLE IF NOT EXISTS ${ANALYTICS_DATABASE}.location_stats (
  client_id String,
  date Date,
  country String,
  region String,
  city String,
  visitors Int32,
  pageviews Int32,
  created_at DateTime64(3, 'UTC')
) ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (client_id, date, country, region, city)
TTL date + INTERVAL 24 MONTH
SETTINGS index_granularity = 8192
`;

// Device stats aggregation table
const CREATE_DEVICE_STATS_TABLE = `
CREATE TABLE IF NOT EXISTS ${ANALYTICS_DATABASE}.device_stats (
  client_id String,
  date Date,
  browser_name String,
  browser_version String,
  os_name String,
  os_version String,
  device_type String,
  device_brand String,
  device_model String,
  visitors Int32,
  pageviews Int32,
  created_at DateTime64(3, 'UTC')
) ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (client_id, date, browser_name, os_name, device_type)
TTL date + INTERVAL 24 MONTH
SETTINGS index_granularity = 8192
`;

// Performance stats aggregation table
const CREATE_PERFORMANCE_STATS_TABLE = `
CREATE TABLE IF NOT EXISTS ${ANALYTICS_DATABASE}.performance_stats (
  client_id String,
  date Date,
  path String,
  avg_load_time Float32,
  avg_dom_ready_time Float32,
  avg_ttfb Float32,
  avg_render_time Float32,
  p95_load_time Float32,
  p95_dom_ready_time Float32,
  p95_ttfb Float32,
  visitors Int32,
  pageviews Int32,
  created_at DateTime64(3, 'UTC')
) ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (client_id, date, path)
TTL date + INTERVAL 24 MONTH
SETTINGS index_granularity = 8192
`;

/**
 * Initialize the ClickHouse schema by creating necessary database and tables
 */
export async function initClickHouseSchema() {
  try {
    console.info('Initializing ClickHouse schema...');
    
    // Create the analytics database
    await clickHouse.command({
      query: CREATE_DATABASE,
    });
    console.info(`Created database: ${ANALYTICS_DATABASE}`);
    
    // Create tables
    const tables = [
      { name: 'events', query: CREATE_EVENTS_TABLE },
      { name: 'sessions', query: CREATE_SESSIONS_TABLE },
      { name: 'daily_stats', query: CREATE_DAILY_STATS_TABLE },
      { name: 'page_stats', query: CREATE_PAGE_STATS_TABLE },
      { name: 'referrer_stats', query: CREATE_REFERRER_STATS_TABLE },
      { name: 'location_stats', query: CREATE_LOCATION_STATS_TABLE },
      { name: 'device_stats', query: CREATE_DEVICE_STATS_TABLE },
      { name: 'performance_stats', query: CREATE_PERFORMANCE_STATS_TABLE }
    ];
    
    for (const table of tables) {
      await clickHouse.command({
        query: table.query,
      });
      console.info(`Created table: ${ANALYTICS_DATABASE}.${table.name}`);
    }
    
    console.info('ClickHouse schema initialization completed successfully');
    return {
      success: true,
      message: 'ClickHouse schema initialized successfully',
      details: {
        database: ANALYTICS_DATABASE,
        tables: tables.map(t => t.name)
      }
    };
  } catch (error) {
    console.error('Error initializing ClickHouse schema:', error);
    return {
      success: false,
      message: 'Failed to initialize ClickHouse schema',
      error: error instanceof Error ? error.message : String(error)
    };
  }
} 