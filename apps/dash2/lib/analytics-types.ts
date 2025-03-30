/**
 * Databuddy Analytics Types
 * 
 * This file contains TypeScript interfaces for analytics collected by Databuddy.
 * Structured to match how databuddy.js actually sends data.
 */

/**
 * Configuration options for Databuddy client initialization
 */
export interface DatabuddyConfig {
  /** Required unique identifier for your website/project */
  clientId: string;
  
  /** API endpoint - defaults to https://api.databuddy.cc */
  apiUrl?: string;
  
  /** Optional client secret for server-side usage */
  clientSecret?: string;
  
  /** Automatically track page views when URL changes */
  trackScreenViews?: boolean;
  
  /** Track hash changes in URL as separate page views */
  trackHashChanges?: boolean;
  
  /** Automatically track clicks on external links */
  trackOutgoingLinks?: boolean;
  
  /** Track clicks on elements with data-track attributes */
  trackAttributes?: boolean;
  
  /** Disable tracking entirely */
  disabled?: boolean;
  
  /** Wait for profile to be set before sending events */
  waitForProfile?: boolean;
  
  /** Custom function to filter events */
  filter?: (event: DatabuddyEvent) => boolean;
  
  /** SDK name (auto-set based on platform) */
  sdk?: "web" | "node" | "react-native";
  
  /** SDK version number */
  sdkVersion?: string;
  
  /** Use anonymized tracking (default: true) */
  anonymized?: boolean;
}

/**
 * Base event data structure
 */
export interface DatabuddyEvent {
  type: "track" | "alias" | "increment" | "decrement";
  payload: {
    /** Properties of the event (for track events) */
    properties?: Record<string, any>;
    /** Anonymous ID for user identification */
    anonymousId?: string;
    /** Profile ID for user identification (deprecated) */
    profileId?: string;
    /** Additional fields based on event type */
    [key: string]: any;
  };
}

/**
 * Track event data structure - this is what databuddy.js actually sends
 */
export interface DatabuddyTrackEvent extends DatabuddyEvent {
  type: "track";
  payload: {
    /** Event name */
    name: string;
    /** Anonymous ID (preferred) */
    anonymousId?: string;
    /** Profile ID (deprecated) */
    profileId?: string;
    /** Event properties */
    properties: {
      /** Any properties passed to the track method */
      [key: string]: any;
      /** Referrer automatically added by databuddy.js */
      __referrer?: string;
      /** Current path automatically added by databuddy.js for screen_view events - anonymized */
      __path?: string;
      /** Page title automatically added by databuddy.js for screen_view events */
      __title?: string;
      /** Flag indicating data is anonymized */
      __anonymized?: boolean;
    };
  };
}

/**
 * Alias event data structure - used to connect anonymous to known users
 */
export interface DatabuddyAliasEvent extends DatabuddyEvent {
  type: "alias";
  payload: {
    /** Original anonymous ID */
    anonymousId: string;
    /** New anonymous ID to associate with */
    newAnonymousId: string;
  };
}

/**
 * Increment event data structure
 */
export interface DatabuddyIncrementEvent extends DatabuddyEvent {
  type: "increment";
  payload: {
    /** Property to increment */
    property: string;
    /** Amount to increment by */
    value: number;
    /** Anonymous ID */
    anonymousId: string;
  };
}

/**
 * Decrement event data structure
 */
export interface DatabuddyDecrementEvent extends DatabuddyEvent {
  type: "decrement";
  payload: {
    /** Property to decrement */
    property: string;
    /** Amount to decrement by */
    value: number;
    /** Anonymous ID */
    anonymousId: string;
  };
}

/**
 * Standard properties that can be sent with any event
 * This includes automatically collected properties and suggested ones
 */
export interface DatabuddyEventProperties {
  /** Referrer URL - automatically added by databuddy.js (anonymized) */
  __referrer?: string;
  /** Current path - automatically added by databuddy.js for screen_view (anonymized) */
  __path?: string;
  /** Page title - automatically added by databuddy.js for screen_view */
  __title?: string;
  /** Flag indicating data is anonymized */
  __anonymized?: boolean;
  
  // The following properties are not collected automatically
  // You need to add them manually when calling track()
  
  /** Session identifier */
  sessionId?: string;
  /** Browser name and version */
  browser?: string;
  /** Operating system */
  os?: string;
  /** Device type */
  deviceType?: "desktop" | "mobile" | "tablet";
  /** Browser language */
  language?: string;
  /** Screen resolution */
  screenResolution?: string;
  /** Connection type if available */
  connectionType?: string;
  /** Category or section */
  category?: string;
  /** Action performed */
  action?: string;
  /** Time spent in seconds */
  timeSpent?: number;
  /** Any other custom properties */
  [key: string]: any;
}

/**
 * Properties specific to screen_view events
 * "screen_view" events are automatically sent by databuddy.js when trackScreenViews is true
 */
export interface ScreenViewProperties extends DatabuddyEventProperties {
  /** Current page path - automatically added by databuddy.js (anonymized) */
  __path: string;
  /** Page title - automatically added by databuddy.js */
  __title: string;
  /** Referrer URL - automatically added by databuddy.js (anonymized) */
  __referrer?: string;
  /** Page section or area */
  section?: string;
  /** Page load time in ms - not automatic */
  loadTime?: number;
  /** Time spent on page in seconds - not automatic */
  timeOnPage?: number;
}

/**
 * Properties for link_out events
 * "link_out" events are automatically sent by databuddy.js when trackOutgoingLinks is true
 */
export interface LinkOutProperties extends DatabuddyEventProperties {
  /** Link URL - automatically added by databuddy.js (anonymized) */
  href: string;
  /** Link text content - automatically added by databuddy.js if available */
  text?: string;
}

/**
 * Session tracking properties
 * Use these when manually tracking sessions
 * (Not automatically collected by databuddy.js)
 */
export interface SessionProperties extends DatabuddyEventProperties {
  /** Session duration in seconds */
  duration: number;
  /** Number of pages viewed */
  pageCount: number;
  /** Session start time */
  startTime: string | number;
  /** Session end time */
  endTime: string | number;
  /** First page visited */
  entryPage?: string;
  /** Last page visited */
  exitPage?: string;
}

// Event-specific property interfaces for common event types
// These are not built into databuddy.js but are useful for consistent tracking

/**
 * Form submission properties
 */
export interface FormEventProperties extends DatabuddyEventProperties {
  /** Form identifier */
  formId?: string;
  /** Number of fields in the form */
  fieldCount?: number;  
  /** Whether form submission was successful */
  success?: boolean;
  /** Time spent on form in seconds */
  timeSpent?: number;
}

/**
 * Error tracking properties
 */
export interface ErrorEventProperties extends DatabuddyEventProperties {
  /** Error type or category */
  errorType: string;
  /** Component or area where error occurred */
  component?: string;
  /** Error message (avoid including PII) */
  message?: string;
  /** Whether error was handled */
  handled?: boolean;
}

/**
 * Interaction properties (clicks, etc.)
 */
export interface InteractionEventProperties extends DatabuddyEventProperties {
  /** Element type (button, link, etc.) */
  elementType: string;
  /** Element identifier */
  elementId?: string;
  /** Interface section where interaction occurred */
  section?: string;
  /** Position (top-nav, sidebar, etc.) */
  position?: string;
}

/**
 * Feature usage properties
 */
export interface FeatureEventProperties extends DatabuddyEventProperties {
  /** Feature name */
  feature: string;
  /** Action performed with feature */
  action: string;
  /** Whether action was successful */
  success?: boolean;
  /** Time spent using feature in seconds */
  timeSpent?: number;
}

export interface DateRange {
  start_date: string;
  end_date: string;
}

export interface AnalyticsSummary {
  pageviews: number;
  unique_visitors: number;
  visitors: number;
  sessions: number;
  bounce_rate: number;
  bounce_rate_pct: string;
  avg_session_duration: number;
  avg_session_duration_formatted: string;
}

export interface TodaySummary {
  pageviews: number;
  visitors: number;
  sessions: number;
}

export interface DailyStats {
  date: string;
  pageviews: number;
  unique_visitors: number;
  sessions: number;
  bounce_rate: number;
  bounce_rate_pct: string;
  avg_session_duration: number;
  avg_session_duration_formatted: string;
}

export interface PageStats {
  pageviews: number;
  visitors: number;
  path: string;
  avg_time_on_page: number;
  avg_time_on_page_formatted: string;
}

export interface ReferrerStats {
  referrer: string;
  visitors: number;
  pageviews: number;
  type: string;
  name: string;
  domain: string;
}

export interface ScreenResolution {
  screen_resolution: string;
  count: number;
  visitors: number;
}

export interface BrowserVersion {
  browser: string;
  version: string;
  count: number;
  visitors: number;
}

export interface CountryStats {
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
  avg_load_time_formatted: string;
  avg_ttfb_formatted: string;
  avg_dom_ready_time_formatted: string;
  avg_render_time_formatted: string;
  avg_fcp_formatted: string;
  avg_lcp_formatted: string;
  avg_cls_formatted: string;
}

export interface AnalyticsDashboardData {
  success: boolean;
  website_id: string;
  date_range: DateRange;
  summary: AnalyticsSummary;
  today: TodaySummary;
  events_by_date: DailyStats[];
  top_pages: PageStats[];
  top_referrers: ReferrerStats[];
  screen_resolutions: ScreenResolution[];
  browser_versions: BrowserVersion[];
  countries: CountryStats[];
  device_types: DeviceType[];
  performance: PerformanceMetrics;
}

// Chart data types
export interface MetricsDataPoint {
  date: string;
  pageviews: number;
  visitors: number;
  sessions: number;
  bounce_rate: number;
  bounce_rate_pct: string;
  avg_session_duration: number;
  avg_session_duration_formatted: string;
}

export interface HourlyDistribution {
  hour: number;
  events: number;
  visitors: number;
}

export interface ChartData {
  success: boolean;
  website_id: string;
  date_range: DateRange;
  interval: string;
  metrics: MetricsDataPoint[];
  hourly_distribution: HourlyDistribution[];
  total_days: number;
}

// Page data types
export interface PagesData {
  success: boolean;
  website_id: string;
  date_range: DateRange;
  data: PageStats[];
}

// Referrer data types
export interface ReferrersData {
  success: boolean;
  website_id: string;
  date_range: DateRange;
  data: ReferrerStats[];
}

// Location data types
export interface CityStats {
  country: string;
  region: string;
  city: string;
  visitors: number;
  pageviews: number;
}

export interface LocationsData {
  success: boolean;
  website_id: string;
  date_range: DateRange;
  countries: CountryStats[];
  cities: CityStats[];
}

// Device data types
export interface DevicesData {
  success: boolean;
  website_id: string;
  date_range: DateRange;
  browsers: { browser: string; visitors: number; pageviews: number }[];
  browser_versions: BrowserVersion[];
  os: { os: string; visitors: number; pageviews: number }[];
  device_types: DeviceType[];
}

// Error data types
export interface ErrorType {
  error_type: string;
  error_message: string;
  count: number;
  unique_users: number;
  last_occurrence: string;
}

export interface ErrorTimePoint {
  date: string;
  [key: string]: string | number;
}

export interface ErrorDetails {
  error_type: string;
  error_message: string;
  error_filename: string;
  error_lineno: number;
  error_colno: number;
  error_stack: string;
  url: string;
  user_agent: string;
  time: string;
  anonymous_id: string;
  browser: string;
  os: string;
  device_type: string;
}

export interface ErrorsData {
  success: boolean;
  website_id: string;
  date_range: DateRange;
  error_types: ErrorType[];
  errors_over_time: ErrorTimePoint[];
  recent_errors: ErrorDetails[];
}

// Campaign data types
export interface CampaignSource {
  utm_source: string;
  visits: number;
  visitors: number;
}

export interface CampaignMedium {
  utm_medium: string;
  visits: number;
  visitors: number;
}

export interface CampaignName {
  utm_campaign: string;
  visits: number;
  visitors: number;
}

export interface CampaignCombined {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  visits: number;
  visitors: number;
}

export interface CampaignsData {
  success: boolean;
  website_id: string;
  date_range: DateRange;
  sources: CampaignSource[];
  mediums: CampaignMedium[];
  campaigns: CampaignName[];
  combined: CampaignCombined[];
} 