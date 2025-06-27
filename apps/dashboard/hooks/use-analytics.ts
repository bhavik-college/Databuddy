import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

// Types
export interface AnalyticsSummary {
  pageviews: number;
  visitors: number;
  sessions: number;
  unique_visitors: number;
  bounce_rate: number;
  bounce_rate_pct: string;
  avg_session_duration: number;
  avg_session_duration_formatted: string;
}

export interface TodayStats {
  pageviews: number;
  visitors: number;
  sessions: number;
  bounce_rate: number;
  bounce_rate_pct: string;
}

export interface DateRange {
  start_date: string;
  end_date: string;
  granularity?: "hourly" | "daily";
  timezone?: string;
}

export interface PageData {
  path: string;
  pageviews: number;
  visitors: number;
  avg_time_on_page: number;
  avg_time_on_page_formatted: string;
}

export interface EntryPageData {
  path: string;
  entries: number;
  visitors: number;
  percentage: number;
}

export interface ExitPageData {
  path: string;
  exits: number;
  visitors: number;
  percentage: number;
}

export interface ReferrerData {
  referrer: string;
  visitors: number;
  pageviews: number;
  type?: string;
  name?: string;
  domain?: string;
}

export interface TrendData {
  date: string;
  week: string;
  month: string;
  pageviews: number;
  visitors: number;
  sessions: number;
  bounce_rate: number;
  bounce_rate_pct?: string;
  avg_session_duration: number;
  avg_session_duration_formatted?: string;
}

export interface DeviceData {
  browsers: Array<{
    browser: string;
    version?: string;
    visitors: number;
    pageviews: number;
    count?: number;
  }>;
  os: Array<{
    os: string;
    visitors: number;
    pageviews: number;
  }>;
  device_types: Array<{
    device_type: string;
    visitors: number;
    pageviews: number;
  }>;
  screen_resolutions?: Array<{
    screen_resolution: string;
    count: number;
    visitors: number;
  }>;
}

export interface LocationData {
  countries: Array<{
    country: string;
    visitors: number;
    pageviews: number;
  }>;
  regions: Array<{
    country: string;
    region: string;
    visitors: number;
    pageviews: number;
  }>;
}

export interface PerformanceData {
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

export interface SessionData {
  session_id: string;
  session_name: string;
  first_visit: string;
  last_visit: string;
  duration: number;
  duration_formatted: string;
  page_views: number;
  visitor_id: string;
  device: string;
  browser: string;
  os: string;
  country: string;
  referrer: string;
  is_returning_visitor: boolean;
  visitor_session_count: number;
  referrer_parsed?: {
    type: string;
    name: string;
    domain: string;
  };
  events?: SessionEventData[];
}

export interface SessionEventData {
  event_id: string;
  time: string;
  event_name: string;
  path: string;
  error_message?: string;
  error_type?: string;
  properties?: Record<string, any>;
}

export interface SessionWithEvents extends SessionData {
  events: SessionEventData[];
}

export interface MiniChartDataPoint {
  date: string;
  value: number;
}

export type TimeInterval = "day" | "week" | "month";

export interface ProfileData {
  visitor_id: string;
  first_visit: string;
  last_visit: string;
  total_sessions: number;
  total_pageviews: number;
  total_duration: number;
  total_duration_formatted: string;
  device: string;
  browser: string;
  os: string;
  country: string;
  region: string;
  sessions: SessionWithEvents[];
}

export interface ErrorDetail {
  error_id: string;
  error_type: string;
  error_message: string;
  stack_trace?: string;
  url: string;
  path: string;
  time: string;
  visitor_id: string;
  browser: string;
  os: string;
  device_type: string;
  count: number;
  unique_users: number;
}

export interface ErrorTypeSummary {
  error_type: string;
  error_message: string;
  count: number;
  unique_users: number;
  last_occurrence: string;
}

export interface ErrorsData {
  success: boolean;
  date_range: DateRange;
  error_types: ErrorTypeSummary[];
  recent_errors: ErrorDetail[];
  errors_over_time: Array<{
    date: string;
    [key: string]: number | string;
  }>;
  total_errors: number;
  total_pages: number;
  current_page: number;
}

// API Response interfaces
interface ApiResponse {
  success: boolean;
  error?: string;
}

interface SummaryResponse extends ApiResponse {
  tracking_setup?: boolean;
  summary: AnalyticsSummary;
  today: TodayStats;
  date_range: DateRange;
  performance: PerformanceData;
  browser_versions: Array<{
    browser: string;
    version: string;
    count: number;
    visitors: number;
  }>;
  device_types: Array<{
    device_type: string;
    visitors: number;
    pageviews: number;
  }>;
  countries: Array<{
    country: string;
    visitors: number;
    pageviews: number;
  }>;
  connection_types: Array<{
    connection_type: string;
    visitors: number;
    pageviews: number;
  }>;
  languages: Array<{
    language: string;
    visitors: number;
    pageviews: number;
  }>;
  timezones: Array<{
    timezone: string;
    visitors: number;
    pageviews: number;
  }>;
  top_pages: Array<PageData>;
  top_referrers: Array<ReferrerData>;
  entry_pages: Array<EntryPageData>;
  exit_pages: Array<ExitPageData>;
  screen_resolutions: Array<{
    screen_resolution: string;
    count: number;
    visitors: number;
  }>;
  utm_sources: Array<{
    utm_source: string;
    visitors: number;
    pageviews: number;
  }>;
  utm_mediums: Array<{
    utm_medium: string;
    visitors: number;
    pageviews: number;
  }>;
  utm_campaigns: Array<{
    utm_campaign: string;
    visitors: number;
    pageviews: number;
  }>;
  events_by_date: Array<TrendData>;
}

interface SimpleSummaryResponse extends ApiResponse {
  summary: AnalyticsSummary;
  today: TodayStats;
  date_range: DateRange;
}

interface TrendsResponse extends ApiResponse {
  data: TrendData[];
  date_range: DateRange;
  interval: TimeInterval;
}

interface PagesResponse extends ApiResponse {
  data: PageData[];
  date_range: DateRange;
}

interface ReferrersResponse extends ApiResponse {
  data: ReferrerData[];
  date_range: DateRange;
}

interface DevicesResponse extends ApiResponse {
  browsers: Array<{
    browser: string;
    version?: string;
    visitors: number;
    pageviews: number;
  }>;
  os: Array<{
    os: string;
    visitors: number;
    pageviews: number;
  }>;
  device_types: Array<{
    device_type: string;
    visitors: number;
    pageviews: number;
  }>;
  date_range: DateRange;
}

interface LocationsResponse extends ApiResponse {
  countries: Array<{
    country: string;
    visitors: number;
    pageviews: number;
  }>;
  regions: Array<{
    country: string;
    region: string;
    visitors: number;
    pageviews: number;
  }>;
  date_range: DateRange;
}

interface SessionsResponse extends ApiResponse {
  sessions: SessionData[];
  date_range: DateRange;
  pagination: {
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface SessionDetailsResponse extends ApiResponse {
  session: SessionWithEvents;
}

interface ProfilesResponse extends ApiResponse {
  profiles: ProfileData[];
  date_range: DateRange;
  total_visitors: number;
  returning_visitors: number;
  pagination: {
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface MiniChartResponse extends ApiResponse {
  data: MiniChartDataPoint[];
}

interface BatchMiniChartResponse extends ApiResponse {
  data: Record<string, MiniChartDataPoint[]>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// Base params builder
function buildParams(
  websiteId: string,
  dateRange?: DateRange,
  additionalParams?: Record<string, string | number>
): URLSearchParams {
  const params = new URLSearchParams({
    website_id: websiteId,
  });

  if (dateRange) {
    params.append("start_date", dateRange.start_date);
    params.append("end_date", dateRange.end_date);
    if (dateRange.granularity) {
      params.append("granularity", dateRange.granularity);
    }
    if (dateRange.timezone) {
      params.append("timezone", dateRange.timezone);
    }
  }

  if (additionalParams) {
    for (const [key, value] of Object.entries(additionalParams)) {
      params.append(key, value.toString());
    }
  }

  // Add cache busting
  params.append("_t", Date.now().toString());

  return params;
}

// Base fetcher function
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

export function useWebsiteAnalytics(websiteId: string, dateRange: DateRange) {
  const fetchData = useCallback(
    async ({ signal }: { signal?: AbortSignal }) => {
      return fetchAnalyticsData<SummaryResponse>(
        "/analytics/summary",
        websiteId,
        dateRange,
        undefined,
        signal
      );
    },
    [websiteId, dateRange]
  );

  const summaryQuery = useQuery({
    queryKey: ["analytics", "summary", websiteId, dateRange],
    queryFn: fetchData,
    ...defaultQueryOptions,
    // Prefetch next likely date ranges
    meta: {
      prefetchRelated: true,
    },
  });

  return {
    analytics: {
      tracking_setup: summaryQuery.data?.tracking_setup,
      summary: summaryQuery.data?.summary,
      today: summaryQuery.data?.today,
      performance: summaryQuery.data?.performance,
      browser_versions: summaryQuery.data?.browser_versions,
      device_types: summaryQuery.data?.device_types,
      countries: summaryQuery.data?.countries,
      connection_types: summaryQuery.data?.connection_types,
      languages: summaryQuery.data?.languages,
      timezones: summaryQuery.data?.timezones,
      top_pages: summaryQuery.data?.top_pages,
      top_referrers: summaryQuery.data?.top_referrers,
      entry_pages: summaryQuery.data?.entry_pages,
      exit_pages: summaryQuery.data?.exit_pages,
      screen_resolutions: summaryQuery.data?.screen_resolutions,
      utm_sources: summaryQuery.data?.utm_sources,
      utm_mediums: summaryQuery.data?.utm_mediums,
      utm_campaigns: summaryQuery.data?.utm_campaigns,
      events_by_date: summaryQuery.data?.events_by_date,
    },
    loading: {
      summary: summaryQuery.isLoading,
      any: summaryQuery.isLoading,
    },
    error: {
      summary: summaryQuery.isError,
      any: summaryQuery.isError,
    },
    queries: { summary: summaryQuery },
    refetch: () => summaryQuery.refetch(),
  };
}

/**
 * Hook to fetch summary analytics data
 */
export function useAnalyticsSummary(websiteId: string, dateRange?: DateRange) {
  return useQuery({
    queryKey: ["analytics", "summary", websiteId, dateRange],
    queryFn: () =>
      fetchAnalyticsData<SimpleSummaryResponse>("/analytics/summary", websiteId, dateRange),
    ...defaultQueryOptions,
  });
}

/**
 * Hook to fetch mini chart data for website cards
 */
export function useMiniChartData(websiteId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["analytics", "mini-chart", websiteId],
    queryFn: () =>
      fetchAnalyticsData<MiniChartResponse>(`/analytics/mini-chart/${websiteId}`, websiteId),
    ...defaultQueryOptions,
    enabled: options?.enabled !== undefined ? options.enabled : true,
  });
}

/**
 * Hook to fetch mini chart data for multiple websites with a single request
 * @param websiteIds Array of website IDs to fetch data for
 * @returns Object with data for each website ID, loading states, and error states
 */
export function useBatchedMiniCharts(websiteIds: string[]) {
  // Ensure stable query key by sorting IDs
  const sortedIds = useMemo(() => [...websiteIds].sort(), [websiteIds]);
  const idsString = useMemo(() => sortedIds.join(","), [sortedIds]);

  const query = useQuery({
    queryKey: ["analytics", "batch-mini-charts", idsString],
    queryFn: async () => {
      if (!websiteIds.length) return {};

      // Use the first ID for the middleware, and pass all IDs in the query
      const primaryWebsiteId = websiteIds[0];
      const response = await fetchAnalyticsData<BatchMiniChartResponse>(
        "/analytics/mini-chart/batch-mini-charts",
        primaryWebsiteId,
        undefined,
        { ids: idsString }
      );

      return response.data || {};
    },
    ...defaultQueryOptions,
    staleTime: 10 * 60 * 1000, // 10 minutes for mini charts
    enabled: websiteIds.length > 0,
    meta: {
      batchSize: websiteIds.length,
    },
  });

  // The query function now directly returns the data object
  const chartsData: Record<string, MiniChartDataPoint[]> = query.data || {};

  return {
    chartsData,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

/**
 * Hook to fetch top pages data
 */
export function useAnalyticsPages(websiteId: string, dateRange?: DateRange, limit = 10) {
  return useQuery({
    queryKey: ["analytics", "pages", websiteId, dateRange, limit],
    queryFn: () =>
      fetchAnalyticsData<PagesResponse>("/analytics/pages", websiteId, dateRange, { limit }),
    ...defaultQueryOptions,
  });
}

/**
 * Hook to fetch referrer data
 */
export function useAnalyticsReferrers(websiteId: string, dateRange?: DateRange, limit = 10) {
  return useQuery({
    queryKey: ["analytics", "referrers", websiteId, dateRange, limit],
    queryFn: () =>
      fetchAnalyticsData<ReferrersResponse>("/analytics/referrers", websiteId, dateRange, {
        limit,
      }),
    ...defaultQueryOptions,
  });
}

/**
 * Hook to fetch device information
 */
export function useAnalyticsDevices(websiteId: string, dateRange?: DateRange, limit = 10) {
  return useQuery({
    queryKey: ["analytics", "devices", websiteId, dateRange, limit],
    queryFn: () =>
      fetchAnalyticsData<DevicesResponse>("/analytics/devices", websiteId, dateRange, { limit }),
    ...defaultQueryOptions,
  });
}

/**
 * Hook to fetch location data
 */
export function useAnalyticsLocations(websiteId: string, dateRange?: DateRange, limit = 10) {
  return useQuery({
    queryKey: ["analytics", "locations", websiteId, dateRange, limit],
    queryFn: () =>
      fetchAnalyticsData<LocationsResponse>(
        "/analytics/locations",
        websiteId,
        dateRange
        // { limit }
      ),
    ...defaultQueryOptions,
  });
}

/**
 * Hook to fetch sessions list
 */
export function useAnalyticsSessions(
  websiteId: string,
  dateRange?: DateRange,
  limit = 100,
  page = 1
) {
  return useQuery<SessionsResponse>({
    queryKey: ["analytics", "sessions", websiteId, dateRange, limit, page],
    queryFn: ({ signal }) =>
      fetchAnalyticsData<SessionsResponse>(
        "/analytics/sessions",
        websiteId,
        dateRange,
        { limit, page },
        signal
      ),
    enabled: !!websiteId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to fetch sessions list with infinite scrolling
 */
export function useInfiniteAnalyticsSessions(websiteId: string, dateRange?: DateRange, limit = 50) {
  return useInfiniteQuery({
    queryKey: ["analytics", "sessions-infinite", websiteId, dateRange, limit],
    queryFn: ({ pageParam = 1, signal }) =>
      fetchAnalyticsData<SessionsResponse>(
        "/analytics/sessions",
        websiteId,
        dateRange,
        { limit, page: pageParam },
        signal
      ),
    enabled: !!websiteId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined;
    },
    getPreviousPageParam: (firstPage) => {
      return firstPage.pagination.hasPrev ? firstPage.pagination.page - 1 : undefined;
    },
  });
}

/**
 * Hook to fetch details for a specific session
 */
export function useAnalyticsSessionDetails(websiteId: string, sessionId: string, enabled = true) {
  return useQuery({
    queryKey: ["analytics", "session", websiteId, sessionId],
    queryFn: ({ signal }) =>
      fetchAnalyticsData<SessionDetailsResponse>(
        `/analytics/sessions/${sessionId}`,
        websiteId,
        undefined,
        undefined,
        signal
      ),
    ...defaultQueryOptions,
    enabled: enabled && !!sessionId,
  });
}

/**
 * Hook to fetch visitor profiles
 */
export function useAnalyticsProfiles(
  websiteId: string,
  dateRange?: DateRange,
  limit = 500,
  page = 1
) {
  return useQuery({
    queryKey: ["analytics", "profiles", websiteId, dateRange, limit, page],
    queryFn: ({ signal }) =>
      fetchAnalyticsData<ProfilesResponse>(
        "/analytics/profiles",
        websiteId,
        dateRange,
        { limit, page },
        signal
      ),
    ...defaultQueryOptions,
  });
}

/**
 * Hook to fetch visitor profiles with infinite scrolling
 */
export function useInfiniteAnalyticsProfiles(websiteId: string, dateRange?: DateRange, limit = 50) {
  return useInfiniteQuery({
    queryKey: ["analytics", "profiles-infinite", websiteId, dateRange, limit],
    queryFn: ({ pageParam = 1, signal }) =>
      fetchAnalyticsData<ProfilesResponse>(
        "/analytics/profiles",
        websiteId,
        dateRange,
        { limit, page: pageParam },
        signal
      ),
    enabled: !!websiteId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined;
    },
    getPreviousPageParam: (firstPage) => {
      return firstPage.pagination.hasPrev ? firstPage.pagination.page - 1 : undefined;
    },
  });
}

/**
 * Hook to fetch website error analytics
 */
export function useWebsiteErrors(websiteId: string, dateRange?: DateRange, limit = 50, page = 1) {
  return useQuery({
    queryKey: ["analytics", "errors", websiteId, dateRange, limit, page],
    queryFn: ({ signal }) =>
      fetchAnalyticsData<ErrorsData>(
        "/analytics/errors",
        websiteId,
        dateRange,
        { limit, page },
        signal
      ),
    ...defaultQueryOptions,
  });
}
