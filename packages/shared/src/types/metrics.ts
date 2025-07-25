// Metrics and data types for analytics

// Base interface for common metric structure
export interface BaseMetricData {
  name: string;
  visitors: number;
  pageviews: number;
}

export interface DeviceTypeData extends BaseMetricData {}

export interface BrowserData extends BaseMetricData {}

export interface CountryData extends BaseMetricData {}

export interface RegionData extends BaseMetricData {}

export interface PageData extends BaseMetricData {}

export interface ReferrerData extends BaseMetricData {}

export interface PerformanceData extends BaseMetricData {
  sessions: number;
  avg_load_time: number;
  avg_ttfb?: number;
  avg_dom_ready_time?: number;
  avg_render_time?: number;
}

export interface TimezoneData {
  name: string;
  code?: string;
  current_time?: string;
  visitors: number;
  pageviews: number;
}

export interface LanguageData {
  name: string;
  code?: string;
  visitors: number;
  pageviews: number;
}

export interface UTMData {
  name: string;
  visitors: number;
  pageviews: number;
}

export interface CustomEventData {
  name: string;
  total_events: number;
  unique_users: number;
  unique_sessions: number;
  last_occurrence: string;
  first_occurrence: string;
  unique_pages: number;
}
