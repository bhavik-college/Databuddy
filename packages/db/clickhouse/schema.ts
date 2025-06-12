import { clickHouse } from './client';


// Define the analytics database schema with tables for events, sessions, and aggregated data
const ANALYTICS_DATABASE = 'analytics';

// SQL statements for creating the analytics database and tables
const CREATE_DATABASE = `
CREATE DATABASE IF NOT EXISTS ${ANALYTICS_DATABASE}
`;

// Optimizations:
// 1. Use LowCardinality(String) for fields with limited distinct values
// 2. Reorder ORDER BY to prioritize time-based queries
// 3. Add materialized views for common aggregations
// 4. Remove Nullable where 0 is a sensible default


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