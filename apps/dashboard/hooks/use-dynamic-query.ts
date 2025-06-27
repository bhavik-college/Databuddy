import { type UseQueryOptions, useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import type { DateRange } from "./use-analytics";
import { usePreferences } from "./use-preferences";

// API Request Types
export interface DynamicQueryRequest {
  id?: string;
  parameters: string[];
  limit?: number;
  page?: number;
  filters?: DynamicQueryFilter[];
  granularity?: "hourly" | "daily";
}

export interface DynamicQueryFilter {
  field: string;
  operator:
    | "eq"
    | "ne"
    | "gt"
    | "gte"
    | "lt"
    | "lte"
    | "in"
    | "not_in"
    | "contains"
    | "starts_with";
  value: string | number | (string | number)[];
}

// API Response Types
export interface DynamicQueryResult {
  parameter: string;
  data: any[];
  success: boolean;
  error?: string;
}

export interface DynamicQueryResponse {
  success: boolean;
  queryId?: string;
  data: DynamicQueryResult[];
  meta: {
    parameters: string[];
    total_parameters: number;
    page: number;
    limit: number;
    filters_applied: number;
  };
  error?: string;
  date_range?: DateRange;
}

export interface BatchQueryResponse {
  success: boolean;
  batch: true;
  results: DynamicQueryResponse[];
  meta: {
    total_queries: number;
    successful_queries: number;
    failed_queries: number;
  };
}

export interface ParametersResponse {
  success: boolean;
  parameters: string[];
  categories: {
    device: string[];
    geography: string[];
    pages: string[];
    utm: string[];
    referrers: string[];
    performance: string[];
    errors: string[];
    web_vitals: string[];
    custom_events: string[];
    user_journeys: string[];
    funnel_analysis: string[];
    revenue: string[];
    real_time: string[];
  };
}

// Specific Data Types
export interface DeviceTypeData {
  name: string;
  visitors: number;
  pageviews: number;
}

export interface BrowserData {
  name: string;
  visitors: number;
  pageviews: number;
}

export interface CountryData {
  name: string;
  visitors: number;
  pageviews: number;
}

export interface RegionData {
  name: string;
  visitors: number;
  pageviews: number;
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

export interface PageData {
  name: string; // This is the path
  pageviews: number;
  visitors: number;
}

export interface UTMData {
  name: string;
  visitors: number;
  pageviews: number;
}

export interface ReferrerData {
  name: string;
  visitors: number;
  pageviews: number;
}

export interface ExitPageData {
  name: string; // This is the path
  exits: number;
  sessions: number;
  visitors?: number;
}

export interface PerformanceData {
  name: string; // This is the path or dimension name
  visitors: number;
  pageviews: number;
  sessions: number;
  avg_load_time: number;
  avg_ttfb?: number;
  avg_dom_ready_time?: number;
  avg_render_time?: number;
}

// Error-related data interfaces
export interface ErrorData {
  error_message: string;
  error_stack?: string;
  page_url: string;
  anonymous_id: string;
  session_id: string;
  time: string;
  browser_name: string;
  os_name: string;
  device_type: string;
  country: string;
  region?: string;
  city?: string;
}

export interface ErrorTypeData {
  name: string; // error message
  total_occurrences: number;
  affected_users: number;
  affected_sessions: number;
  last_occurrence: string;
  first_occurrence: string;
}

export interface ErrorBreakdownData {
  name: string; // page, browser, os, country, device
  total_errors: number;
  unique_error_types: number;
  affected_users: number;
  affected_sessions: number;
}

export interface ErrorTrendData {
  date: string;
  total_errors: number;
  unique_error_types: number;
  affected_users: number;
  affected_sessions: number;
}

export interface SessionsSummaryData {
  total_sessions: number;
  total_users: number;
}

// Custom Events data interfaces
export interface CustomEventData {
  name: string; // event name
  total_events: number;
  unique_users: number;
  unique_sessions: number;
  last_occurrence: string;
  first_occurrence: string;
  unique_pages: number;
}

// Summary metrics data interfaces
export interface SummaryMetricsData {
  unique_visitors: number;
  sessions: number;
  pageviews: number;
  bounce_rate: number;
  bounce_rate_pct: string;
  avg_session_duration: number;
  avg_session_duration_formatted: string;
  pages_per_session: number;
}

export interface TodayMetricsData {
  visitors: number;
  sessions: number;
  pageviews: number;
}

export interface ActiveStatsData {
  active_users: number;
}

export interface LatestEventData {
  [key: string]: any;
}

export interface EventsByDateData {
  date: string;
  pageviews: number;
  visitors: number;
  unique_visitors: number;
  sessions: number;
  bounce_rate: number;
  avg_session_duration: number;
  revenue_by_currency: RevenueBreakdownData;
  revenue_by_card_brand: RevenueBreakdownData;
  // Real-time
  active_stats: ActiveStatsData;
  latest_events: LatestEventData;
}

export interface EntryPageData {
  name: string; // This is the path
  entries: number;
  visitors: number;
  sessions: number;
  bounce_rate: number;
}

// Parameter type mapping for better type safety
export interface GroupedBrowserData {
  name: string; // browser name (e.g., "Chrome", "Firefox")
  visitors: number;
  pageviews: number;
  sessions: number;
  versions: {
    name: string; // version number
    version: string;
    visitors: number;
    pageviews: number;
    sessions: number;
  }[];
}

export type ParameterDataMap = {
  device_type: DeviceTypeData;
  browser_name: BrowserData;
  browsers_grouped: GroupedBrowserData;
  os_name: BrowserData;
  screen_resolution: DeviceTypeData; // Same structure as device_type
  connection_type: DeviceTypeData; // Same structure as device_type
  country: CountryData;
  region: RegionData;
  city: CountryData;
  timezone: TimezoneData;
  language: LanguageData;
  top_pages: PageData;
  exit_page: ExitPageData;
  utm_source: UTMData;
  utm_medium: UTMData;
  utm_campaign: UTMData;
  referrer: ReferrerData;
  slow_pages: PerformanceData;
  performance_by_country: PerformanceData;
  performance_by_device: PerformanceData;
  performance_by_browser: PerformanceData;
  performance_by_os: PerformanceData;
  performance_by_region: PerformanceData;
  // Error-related parameters
  recent_errors: ErrorData;
  error_types: ErrorTypeData;
  errors_by_page: ErrorBreakdownData;
  errors_by_browser: ErrorBreakdownData;
  errors_by_os: ErrorBreakdownData;
  errors_by_country: ErrorBreakdownData;
  errors_by_device: ErrorBreakdownData;
  error_trends: ErrorTrendData;
  sessions_summary: SessionsSummaryData;
  // Custom Events parameters
  custom_events: CustomEventData;
  custom_event_details: any; // Complex structure with properties
  custom_events_by_page: any;
  custom_events_by_user: any;
  custom_event_properties: any;
  custom_event_property_values: { name: string; total_events: number; unique_users: number };
  // Summary and overview parameters
  summary_metrics: SummaryMetricsData;
  today_metrics: TodayMetricsData;
  events_by_date: EventsByDateData;
  entry_pages: EntryPageData;
  exit_pages: ExitPageData;
  top_referrers: ReferrerData;
  utm_sources: UTMData;
  utm_mediums: UTMData;
  utm_campaigns: UTMData;
  device_types: DeviceTypeData;
  browser_versions: BrowserData;
  // Revenue parameters
  revenue_summary: RevenueSummaryData;
  revenue_trends: RevenueTrendData;
  recent_transactions: RecentTransactionData;
  recent_refunds: RecentRefundData;
  revenue_by_country: RevenueBreakdownData;
  revenue_by_currency: RevenueBreakdownData;
  revenue_by_card_brand: RevenueBreakdownData;
  // Real-time
  active_stats: ActiveStatsData;
  latest_events: LatestEventData;
};

// Helper type to extract data types from parameters
export type ExtractDataTypes<T extends (keyof ParameterDataMap)[]> = {
  [K in T[number]]: ParameterDataMap[K][];
};

// API Response interfaces
interface ApiResponse {
  success: boolean;
  error?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// Base params builder - following use-analytics.ts pattern
function buildParams(
  websiteId: string,
  dateRange?: DateRange,
  additionalParams?: Record<string, string | number>
): URLSearchParams {
  const params = new URLSearchParams({
    website_id: websiteId,
    ...additionalParams,
  });

  if (dateRange?.start_date) {
    params.append("start_date", dateRange.start_date);
  }

  if (dateRange?.end_date) {
    params.append("end_date", dateRange.end_date);
  }

  if (dateRange?.granularity) {
    params.append("granularity", dateRange.granularity);
  }

  // Add cache busting
  params.append("_t", Date.now().toString());

  return params;
}

// Base fetcher function - following use-analytics.ts pattern
async function fetchAnalyticsData<T extends ApiResponse>(
  endpoint: string,
  websiteId: string,
  dateRange?: DateRange,
  additionalParams?: Record<string, string | number>,
  signal?: AbortSignal
): Promise<T> {
  const params = buildParams(websiteId, dateRange, additionalParams);
  const url = `${API_BASE_URL}/v1${endpoint}?${params}`;

  const response = await fetch(url, {
    credentials: "include",
    signal,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch data from ${endpoint}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || `Failed to fetch data from ${endpoint}`);
  }

  return data;
}

// Common query options
const defaultQueryOptions = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 30 * 60 * 1000, // 30 minutes
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchInterval: 10 * 60 * 1000, // Background refetch every 10 minutes
  retry: (failureCount: number, error: Error) => {
    if (error instanceof DOMException && error.name === "AbortError") {
      return false;
    }
    return failureCount < 2;
  },
  networkMode: "online" as const,
  refetchIntervalInBackground: false,
};

/**
 * Hook to get the user's effective timezone
 */
function useUserTimezone(): string {
  const { preferences } = usePreferences();

  // Get browser timezone as fallback
  const browserTimezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return "UTC";
    }
  }, []);

  // Return user's preferred timezone or browser timezone if 'auto'
  if (!preferences) return browserTimezone;

  return preferences.timezone === "auto" ? browserTimezone : preferences.timezone;
}

// Dynamic query specific fetcher - POST request (supports both single and batch)
async function fetchDynamicQuery(
  websiteId: string,
  dateRange: DateRange,
  queryData: DynamicQueryRequest | DynamicQueryRequest[],
  signal?: AbortSignal,
  userTimezone?: string
): Promise<DynamicQueryResponse | BatchQueryResponse> {
  const timezone = userTimezone || "UTC";
  const params = buildParams(websiteId, dateRange, { timezone });
  const url = `${API_BASE_URL}/v1/query?${params}`;

  // Prepare the request body
  const requestBody = Array.isArray(queryData)
    ? queryData.map((query) => ({
        ...query,
        startDate: dateRange.start_date,
        endDate: dateRange.end_date,
        timeZone: timezone,
        limit: query.limit || 100,
        page: query.page || 1,
        filters: query.filters || [],
        granularity: query.granularity || dateRange.granularity || "daily",
      }))
    : {
        ...queryData,
        startDate: dateRange.start_date,
        endDate: dateRange.end_date,
        timeZone: timezone,
        limit: queryData.limit || 100,
        page: queryData.page || 1,
        filters: queryData.filters || [],
        granularity: queryData.granularity || dateRange.granularity || "daily",
      };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    signal,
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch dynamic query data: ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || "Failed to fetch dynamic query data");
  }

  return data;
}

/**
 * Hook to fetch dynamic query data - supports both single and batch queries
 */
export function useDynamicQuery<T extends (keyof ParameterDataMap)[]>(
  websiteId: string,
  dateRange: DateRange,
  queryData: DynamicQueryRequest,
  options?: Partial<UseQueryOptions<DynamicQueryResponse>>
) {
  const userTimezone = useUserTimezone();

  const fetchData = useCallback(
    async ({ signal }: { signal?: AbortSignal }) => {
      const result = await fetchDynamicQuery(websiteId, dateRange, queryData, signal, userTimezone);
      // Ensure we return a single query response (not batch)
      return result as DynamicQueryResponse;
    },
    [websiteId, dateRange, queryData, userTimezone]
  );

  const query = useQuery({
    queryKey: ["dynamic-query", websiteId, dateRange, queryData, userTimezone],
    queryFn: fetchData,
    ...defaultQueryOptions,
    ...options,
    enabled: options?.enabled !== false && !!websiteId && queryData.parameters.length > 0,
  });

  // Process data into a more usable format
  const processedData = useMemo(() => {
    return (
      query.data?.data.reduce(
        (acc, result) => {
          if (result.success) {
            acc[result.parameter] = result.data;
          }
          return acc;
        },
        {} as Record<string, any>
      ) || {}
    );
  }, [query.data]);

  // Extract errors
  const errors = useMemo(() => {
    return (
      query.data?.data
        .filter((result) => !result.success)
        .map((result) => ({ parameter: result.parameter, error: result.error })) || []
    );
  }, [query.data]);

  return {
    data: processedData as ExtractDataTypes<T>,
    meta: query.data?.meta,
    errors,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}

/**
 * Hook to fetch batch dynamic queries
 */
export function useBatchDynamicQuery(
  websiteId: string,
  dateRange: DateRange,
  queries: DynamicQueryRequest[],
  options?: Partial<UseQueryOptions<BatchQueryResponse>>
) {
  const userTimezone = useUserTimezone();

  const fetchData = useCallback(
    async ({ signal }: { signal?: AbortSignal }) => {
      const result = await fetchDynamicQuery(websiteId, dateRange, queries, signal, userTimezone);
      // Ensure we return a batch query response
      return result as BatchQueryResponse;
    },
    [websiteId, dateRange, queries, userTimezone]
  );

  const query = useQuery({
    queryKey: [
      "batch-dynamic-query",
      websiteId,
      dateRange.start_date,
      dateRange.end_date,
      dateRange.granularity,
      dateRange.timezone,
      JSON.stringify(queries),
    ],
    queryFn: fetchData,
    ...defaultQueryOptions,
    ...options,
    enabled: options?.enabled !== false && !!websiteId && queries.length > 0,
  });

  // Enhanced processing with better debugging and clearer structure
  const processedResults = useMemo(() => {
    if (!query.data?.results) {
      return [];
    }

    return query.data.results.map((result, index) => {
      const processedResult = {
        queryId: result.queryId,
        success: result.success,
        data: {} as Record<string, any>,
        errors: [] as Array<{ parameter: string; error?: string }>,
        meta: result.success ? result.meta : undefined,
        rawResult: result, // Keep raw result for debugging
      };

      if (result.success && result.data) {
        // Process each parameter result
        result.data.forEach((paramResult) => {
          if (paramResult.success && paramResult.data) {
            processedResult.data[paramResult.parameter] = paramResult.data;
          } else {
            processedResult.errors.push({
              parameter: paramResult.parameter,
              error: paramResult.error,
            });
          }
        });
      } else {
        processedResult.errors.push({
          parameter: "query",
          error: result.error || "Unknown query error",
        });
      }

      return processedResult;
    });
  }, [query.data]);

  // Helper functions for easier data access
  const getDataForQuery = useCallback(
    (queryId: string, parameter: string) => {
      const result = processedResults.find((r) => r.queryId === queryId);
      if (!result?.success) {
        return [];
      }
      const data = result.data[parameter];
      if (!data) {
        return [];
      }
      return data;
    },
    [processedResults]
  );

  const hasDataForQuery = useCallback(
    (queryId: string, parameter: string) => {
      const result = processedResults.find((r) => r.queryId === queryId);
      return (
        result?.success &&
        result.data[parameter] &&
        Array.isArray(result.data[parameter]) &&
        result.data[parameter].length > 0
      );
    },
    [processedResults]
  );

  const getErrorsForQuery = useCallback(
    (queryId: string) => {
      const result = processedResults.find((r) => r.queryId === queryId);
      return result?.errors || [];
    },
    [processedResults]
  );

  return {
    results: processedResults,
    meta: query.data?.meta,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
    // Helper functions
    getDataForQuery,
    hasDataForQuery,
    getErrorsForQuery,
    // Debug info
    debugInfo: {
      queryCount: queries.length,
      successfulQueries: processedResults.filter((r) => r.success).length,
      failedQueries: processedResults.filter((r) => !r.success).length,
      totalParameters: processedResults.reduce((sum, r) => sum + Object.keys(r.data).length, 0),
    },
  };
}

/**
 * Hook to fetch available parameters
 */
export function useAvailableParameters(
  websiteId: string,
  options?: Partial<UseQueryOptions<ParametersResponse>>
) {
  return useQuery({
    queryKey: ["dynamic-query-parameters", websiteId],
    queryFn: ({ signal }) =>
      fetchAnalyticsData<ParametersResponse>(
        "/query/parameters",
        websiteId,
        undefined,
        undefined,
        signal
      ),
    ...defaultQueryOptions,
    staleTime: 60 * 60 * 1000, // 1 hour - parameters don't change often
    ...options,
  });
}

/**
 * Convenience hook for device data
 */
export function useDeviceData(
  websiteId: string,
  dateRange: DateRange,
  options?: Partial<UseQueryOptions<DynamicQueryResponse>>
) {
  return useDynamicQuery(
    websiteId,
    dateRange,
    {
      id: "device-data",
      parameters: ["device_type", "browser_name", "os_name"],
    },
    options
  );
}

/**
 * Convenience hook for geographic data
 */
export function useGeographicData(
  websiteId: string,
  dateRange: DateRange,
  options?: Partial<UseQueryOptions<DynamicQueryResponse>>
) {
  return useDynamicQuery(
    websiteId,
    dateRange,
    {
      id: "geographic-data",
      parameters: ["country", "region", "city", "timezone", "language"],
      limit: 100,
    },
    options
  );
}

/**
 * Convenience hook for UTM data
 */
export function useUTMData(
  websiteId: string,
  dateRange: DateRange,
  options?: Partial<UseQueryOptions<DynamicQueryResponse>>
) {
  return useDynamicQuery(
    websiteId,
    dateRange,
    {
      id: "utm-data",
      parameters: ["utm_source", "utm_medium", "utm_campaign"],
    },
    options
  );
}

/**
 * Convenience hook for page analytics
 */
export function usePageAnalytics(
  websiteId: string,
  dateRange: DateRange,
  options?: Partial<UseQueryOptions<DynamicQueryResponse>>
) {
  return useDynamicQuery(
    websiteId,
    dateRange,
    {
      id: "page-analytics",
      parameters: ["top_pages", "exit_page"],
    },
    options
  );
}

/**
 * Convenience hook for performance data
 */
export function usePerformanceData(
  websiteId: string,
  dateRange: DateRange,
  options?: Partial<UseQueryOptions<DynamicQueryResponse>>
) {
  return useDynamicQuery(
    websiteId,
    dateRange,
    {
      id: "performance-data",
      parameters: ["slow_pages"],
    },
    options
  );
}

/**
 * Convenience hook for comprehensive performance analytics using batch queries
 */
export function useEnhancedPerformanceData(
  websiteId: string,
  dateRange: DateRange,
  options?: Partial<UseQueryOptions<BatchQueryResponse>>
) {
  const queries: DynamicQueryRequest[] = [
    {
      id: "pages",
      parameters: ["slow_pages"],
      limit: 100,
    },
    {
      id: "countries",
      parameters: ["performance_by_country"],
      limit: 100,
    },
    {
      id: "devices",
      parameters: ["performance_by_device"],
      limit: 100,
    },
    {
      id: "browsers",
      parameters: ["performance_by_browser"],
      limit: 100,
    },
    {
      id: "operating_systems",
      parameters: ["performance_by_os"],
      limit: 100,
    },
    {
      id: "regions",
      parameters: ["performance_by_region"],
      limit: 100,
    },
  ];

  return useBatchDynamicQuery(websiteId, dateRange, queries, options);
}

/**
 * Convenience hook for traffic sources
 */
export function useTrafficSources(
  websiteId: string,
  dateRange: DateRange,
  options?: Partial<UseQueryOptions<DynamicQueryResponse>>
) {
  return useDynamicQuery(
    websiteId,
    dateRange,
    {
      id: "traffic-sources",
      parameters: ["referrer", "utm_source", "utm_medium", "utm_campaign"],
    },
    options
  );
}

/**
 * Convenience hook for enhanced geographic analytics with individual parameter queries
 */
export function useEnhancedGeographicData(
  websiteId: string,
  dateRange: DateRange,
  options?: Partial<UseQueryOptions<BatchQueryResponse>>
) {
  const queries: DynamicQueryRequest[] = [
    {
      id: "countries",
      parameters: ["country"],
      limit: 100,
    },
    {
      id: "regions",
      parameters: ["region"],
      limit: 100,
    },
    {
      id: "timezones",
      parameters: ["timezone"],
      limit: 100,
    },
    {
      id: "languages",
      parameters: ["language"],
      limit: 100,
    },
  ];

  return useBatchDynamicQuery(websiteId, dateRange, queries, options);
}

/**
 * Convenience hook for comprehensive analytics using batch queries
 */
export function useComprehensiveAnalytics(
  websiteId: string,
  dateRange: DateRange,
  options?: Partial<UseQueryOptions<BatchQueryResponse>>
) {
  const queries: DynamicQueryRequest[] = [
    {
      id: "device-analytics",
      parameters: ["device_type", "browser_name", "os_name"],
      limit: 10,
    },
    {
      id: "geographic-analytics",
      parameters: ["country", "region", "city", "timezone", "language"],
      limit: 100,
    },
    {
      id: "utm-analytics",
      parameters: ["utm_source", "utm_medium", "utm_campaign"],
      limit: 10,
    },
    {
      id: "page-analytics",
      parameters: ["top_pages", "exit_page"],
      limit: 10,
    },
    {
      id: "performance-analytics",
      parameters: ["slow_pages"],
      limit: 10,
    },
  ];

  return useBatchDynamicQuery(websiteId, dateRange, queries, options);
}

// Journey-specific data interfaces
export interface JourneyTransition {
  from_page: string;
  to_page: string;
  transitions: number;
  sessions: number;
  users: number;
  avg_step_in_journey: number;
}

export interface JourneyPath {
  name: string;
  entry_page: string;
  exit_page: string;
  frequency: number;
  unique_users: number;
  avg_pages_in_path: number;
  avg_duration_seconds: number;
  avg_duration_minutes: number;
}

export interface JourneyDropoff {
  name: string;
  total_visits: number;
  total_sessions: number;
  total_users: number;
  exits: number;
  continuations: number;
  exit_rate: number;
  continuation_rate: number;
}

export interface JourneyEntryPoint {
  name: string;
  entries: number;
  sessions: number;
  users: number;
  bounce_rate: number;
  avg_pages_per_session: number;
}

// Revenue-specific data interfaces
export interface RevenueSummaryData {
  total_revenue: number;
  total_transactions: number;
  total_refunds: number;
  avg_order_value: number;
  success_rate: number;
}

export interface RevenueTrendData {
  time: string;
  revenue: number;
  transactions: number;
  avg_order_value: number;
  success_rate: number;
}

export interface RecentTransactionData {
  id: string;
  created: string;
  status: string;
  currency: string;
  amount: number;
  card_brand?: string;
  session_id?: string;
}

export interface RecentRefundData {
  id: string;
  created: string;
  status: string;
  reason?: string;
  currency: string;
  amount: number;
  payment_intent_id: string;
  session_id?: string;
}

export interface RevenueBreakdownData {
  name: string;
  total_revenue: number;
  total_transactions: number;
  avg_order_value: number;
}

/**
 * Enhanced Error Data Hook for comprehensive error analytics
 */
export function useEnhancedErrorData(
  websiteId: string,
  dateRange: DateRange,
  options?: Partial<UseQueryOptions<BatchQueryResponse>> & { filters?: DynamicQueryFilter[] }
) {
  const filters = options?.filters || [];

  return useBatchDynamicQuery(
    websiteId,
    dateRange,
    [
      { id: "recent_errors", parameters: ["recent_errors"], limit: 100, filters },
      { id: "error_types", parameters: ["error_types"], limit: 100, filters },
      { id: "errors_by_page", parameters: ["errors_by_page"], filters },
      { id: "errors_by_browser", parameters: ["errors_by_browser"], filters },
      { id: "errors_by_os", parameters: ["errors_by_os"], filters },
      { id: "errors_by_country", parameters: ["errors_by_country"], filters },
      { id: "errors_by_device", parameters: ["errors_by_device"], filters },
      { id: "error_trends", parameters: ["error_trends"], limit: 30, filters },
      { id: "sessions_summary", parameters: ["sessions_summary"], filters },
    ],
    {
      ...options,
    }
  );
}

/**
 * Convenience hook for comprehensive journey analytics
 */
export function useJourneyAnalytics(
  websiteId: string,
  dateRange: DateRange,
  options?: Partial<UseQueryOptions<BatchQueryResponse>>
) {
  const queries: DynamicQueryRequest[] = [
    {
      id: "user-journeys",
      parameters: ["user_journeys"],
      limit: 50,
    },
    {
      id: "journey-paths",
      parameters: ["journey_paths"],
      limit: 25,
    },
    {
      id: "journey-dropoffs",
      parameters: ["journey_dropoffs"],
      limit: 20,
    },
    {
      id: "journey-entry-points",
      parameters: ["journey_entry_points"],
      limit: 20,
    },
  ];

  const batchResult = useBatchDynamicQuery(websiteId, dateRange, queries, options);

  // Convenient accessors with proper typing
  const journeyData = useMemo(
    () => ({
      transitions: batchResult.getDataForQuery(
        "user-journeys",
        "user_journeys"
      ) as JourneyTransition[],
      paths: batchResult.getDataForQuery("journey-paths", "journey_paths") as JourneyPath[],
      dropoffs: batchResult.getDataForQuery(
        "journey-dropoffs",
        "journey_dropoffs"
      ) as JourneyDropoff[],
      entryPoints: batchResult.getDataForQuery(
        "journey-entry-points",
        "journey_entry_points"
      ) as JourneyEntryPoint[],
    }),
    [batchResult]
  );

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const { transitions, dropoffs, paths } = journeyData;

    const totalTransitions = transitions.reduce((sum, item) => sum + item.transitions, 0);
    const totalUsers = transitions.reduce((sum, item) => sum + item.users, 0);
    const avgStepInJourney =
      transitions.length > 0
        ? transitions.reduce((sum, item) => sum + item.avg_step_in_journey, 0) / transitions.length
        : 0;
    const avgExitRate =
      dropoffs.length > 0
        ? dropoffs.reduce((sum, item) => sum + item.exit_rate, 0) / dropoffs.length
        : 0;

    // Fallback stats from other queries when user_journeys query fails
    const fallbackUsers = paths.reduce((sum, item) => sum + item.unique_users, 0);
    const fallbackTransitions = paths.reduce((sum, item) => sum + item.frequency, 0);

    return {
      totalTransitions: totalTransitions || fallbackTransitions,
      totalUsers: totalUsers || fallbackUsers,
      avgStepInJourney: Math.round(avgStepInJourney * 100) / 100,
      avgExitRate: Math.round(avgExitRate * 100) / 100,
    };
  }, [journeyData]);

  return {
    ...batchResult,
    journeyData,
    summaryStats,
    // Convenience methods
    hasJourneyData: batchResult.hasDataForQuery("user-journeys", "user_journeys"),
    hasPathData: batchResult.hasDataForQuery("journey-paths", "journey_paths"),
    hasDropoffData: batchResult.hasDataForQuery("journey-dropoffs", "journey_dropoffs"),
    hasEntryPointData: batchResult.hasDataForQuery("journey-entry-points", "journey_entry_points"),
  };
}

/**
 * Convenience hook for comprehensive revenue analytics using batch queries
 */
export function useRevenueAnalytics(
  websiteId: string,
  dateRange: DateRange,
  options?: Partial<UseQueryOptions<BatchQueryResponse>>
) {
  const queries: DynamicQueryRequest[] = [
    {
      id: "revenue-summary",
      parameters: ["revenue_summary"],
      limit: 1,
    },
    {
      id: "revenue-trends",
      parameters: ["revenue_trends"],
      limit: 100,
    },
    {
      id: "recent-transactions",
      parameters: ["recent_transactions"],
      limit: 50,
    },
    {
      id: "recent-refunds",
      parameters: ["recent_refunds"],
      limit: 50,
    },
    {
      id: "revenue-by-country",
      parameters: ["revenue_by_country"],
      limit: 20,
    },
    {
      id: "revenue-by-currency",
      parameters: ["revenue_by_currency"],
      limit: 10,
    },
    {
      id: "revenue-by-card-brand",
      parameters: ["revenue_by_card_brand"],
      limit: 10,
    },
  ];

  const batchResult = useBatchDynamicQuery(websiteId, dateRange, queries, options);

  // Convenient accessors with proper typing
  const revenueData = useMemo(() => {
    const summaryData = batchResult.getDataForQuery(
      "revenue-summary",
      "revenue_summary"
    ) as RevenueSummaryData[];
    const summary = summaryData?.[0] || {
      total_revenue: 0,
      total_transactions: 0,
      total_refunds: 0,
      avg_order_value: 0,
      success_rate: 0,
    };

    return {
      summary,
      trends: batchResult.getDataForQuery("revenue-trends", "revenue_trends") as RevenueTrendData[],
      recentTransactions: batchResult.getDataForQuery(
        "recent-transactions",
        "recent_transactions"
      ) as RecentTransactionData[],
      recentRefunds: batchResult.getDataForQuery(
        "recent-refunds",
        "recent_refunds"
      ) as RecentRefundData[],
      byCountry: batchResult.getDataForQuery(
        "revenue-by-country",
        "revenue_by_country"
      ) as RevenueBreakdownData[],
      byCurrency: batchResult.getDataForQuery(
        "revenue-by-currency",
        "revenue_by_currency"
      ) as RevenueBreakdownData[],
      byCardBrand: batchResult.getDataForQuery(
        "revenue-by-card-brand",
        "revenue_by_card_brand"
      ) as RevenueBreakdownData[],
    };
  }, [batchResult]);

  // Calculate additional summary statistics
  const summaryStats = useMemo(() => {
    const { summary, trends, recentTransactions, recentRefunds } = revenueData;

    // Calculate growth from trends if available
    const revenueGrowth =
      trends.length >= 2
        ? (((trends[0]?.revenue || 0) - (trends[1]?.revenue || 0)) / (trends[1]?.revenue || 1)) *
          100
        : 0;

    const transactionGrowth =
      trends.length >= 2
        ? (((trends[0]?.transactions || 0) - (trends[1]?.transactions || 0)) /
            (trends[1]?.transactions || 1)) *
          100
        : 0;

    // Calculate refund rate
    const refundRate =
      summary.total_transactions > 0
        ? (summary.total_refunds / summary.total_transactions) * 100
        : 0;

    return {
      revenueGrowth: Math.round(revenueGrowth * 100) / 100,
      transactionGrowth: Math.round(transactionGrowth * 100) / 100,
      refundRate: Math.round(refundRate * 100) / 100,
      totalRecentTransactions: recentTransactions.length,
      totalRecentRefunds: recentRefunds.length,
    };
  }, [revenueData]);

  return {
    ...batchResult,
    revenueData,
    summaryStats,
    // Convenience methods
    hasSummaryData: batchResult.hasDataForQuery("revenue-summary", "revenue_summary"),
    hasTrendsData: batchResult.hasDataForQuery("revenue-trends", "revenue_trends"),
    hasTransactionsData: batchResult.hasDataForQuery("recent-transactions", "recent_transactions"),
    hasRefundsData: batchResult.hasDataForQuery("recent-refunds", "recent_refunds"),
    hasCountryData: batchResult.hasDataForQuery("revenue-by-country", "revenue_by_country"),
    hasCurrencyData: batchResult.hasDataForQuery("revenue-by-currency", "revenue_by_currency"),
    hasCardBrandData: batchResult.hasDataForQuery("revenue-by-card-brand", "revenue_by_card_brand"),
  };
}

/**
 * Hook for real-time active user stats. Polls every 5 seconds.
 */
export function useRealTimeStats(
  websiteId: string,
  options?: Partial<UseQueryOptions<DynamicQueryResponse>>
) {
  const dateRange = useMemo(() => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    return {
      start_date: fiveMinutesAgo.toISOString(),
      end_date: now.toISOString(),
    };
  }, []);

  const queryResult = useDynamicQuery(
    websiteId,
    dateRange,
    {
      id: "realtime-active-stats",
      parameters: ["active_stats"],
    },
    {
      ...options,
      refetchInterval: 5000,
      staleTime: 0,
      gcTime: 10_000,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
    }
  );

  const activeUsers = useMemo(() => {
    const data = (queryResult.data as any)?.active_stats?.[0];
    return data?.active_users || 0;
  }, [queryResult.data]);

  return { ...queryResult, activeUsers };
}
