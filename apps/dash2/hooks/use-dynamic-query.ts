import { useCallback, useMemo } from 'react';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { DateRange } from './use-analytics';

// API Request Types
export interface DynamicQueryRequest {
  id?: string;
  parameters: string[];
  limit?: number;
  page?: number;
  filters?: DynamicQueryFilter[];
}

export interface DynamicQueryFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in' | 'contains' | 'starts_with';
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Base params builder - following use-analytics.ts pattern
function buildParams(
  websiteId: string, 
  dateRange?: DateRange, 
  additionalParams?: Record<string, string | number>
): URLSearchParams {
  const params = new URLSearchParams({
    website_id: websiteId,
    ...additionalParams
  });
  
  if (dateRange?.start_date) {
    params.append('start_date', dateRange.start_date);
  }
  
  if (dateRange?.end_date) {
    params.append('end_date', dateRange.end_date);
  }

  if (dateRange?.granularity) {
    params.append('granularity', dateRange.granularity);
  }
  
  // Add cache busting
  params.append('_t', Date.now().toString());
  
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
    credentials: 'include',
    signal
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
    if (error instanceof DOMException && error.name === 'AbortError') {
      return false;
    }
    return failureCount < 2;
  },
  networkMode: 'online' as const,
  refetchIntervalInBackground: false,
};

// Dynamic query specific fetcher - POST request (supports both single and batch)
async function fetchDynamicQuery(
  websiteId: string,
  dateRange: DateRange,
  queryData: DynamicQueryRequest | DynamicQueryRequest[],
  signal?: AbortSignal
): Promise<DynamicQueryResponse | BatchQueryResponse> {
  const params = buildParams(websiteId, dateRange);
  const url = `${API_BASE_URL}/v1/query?${params}`;
  
  // Prepare the request body
  const requestBody = Array.isArray(queryData) 
    ? queryData.map(query => ({
        ...query,
        startDate: dateRange.start_date,
        endDate: dateRange.end_date,
        timeZone: 'UTC',
        limit: query.limit || 100,
        page: query.page || 1,
        filters: query.filters || [],
      }))
    : {
        ...queryData,
        startDate: dateRange.start_date,
        endDate: dateRange.end_date,
        timeZone: 'UTC',
        limit: queryData.limit || 100,
        page: queryData.page || 1,
        filters: queryData.filters || [],
      };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    signal,
    body: JSON.stringify(requestBody),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch dynamic query data: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch dynamic query data');
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
  const fetchData = useCallback(async ({ signal }: { signal?: AbortSignal }) => {
    const result = await fetchDynamicQuery(websiteId, dateRange, queryData, signal);
    // Ensure we return a single query response (not batch)
    return result as DynamicQueryResponse;
  }, [websiteId, dateRange, queryData]);

  const query = useQuery({
    queryKey: ['dynamic-query', websiteId, dateRange, queryData],
    queryFn: fetchData,
    ...defaultQueryOptions,
    ...options,
    enabled: options?.enabled !== false && !!websiteId && queryData.parameters.length > 0,
  });

  // Process data into a more usable format
  const processedData = useMemo(() => {
    return query.data?.data.reduce((acc, result) => {
      if (result.success) {
        acc[result.parameter] = result.data;
      }
      return acc;
    }, {} as Record<string, any>) || {};
  }, [query.data]);

  // Extract errors
  const errors = useMemo(() => {
    return query.data?.data
      .filter(result => !result.success)
      .map(result => ({ parameter: result.parameter, error: result.error })) || [];
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
  const fetchData = useCallback(async ({ signal }: { signal?: AbortSignal }) => {
    const result = await fetchDynamicQuery(websiteId, dateRange, queries, signal);
    // Ensure we return a batch query response
    return result as BatchQueryResponse;
  }, [websiteId, dateRange, queries]);

  const query = useQuery({
    queryKey: ['batch-dynamic-query', websiteId, dateRange, queries],
    queryFn: fetchData,
    ...defaultQueryOptions,
    ...options,
    enabled: options?.enabled !== false && !!websiteId && queries.length > 0,
  });

  // Process batch data into a more usable format
  const processedResults = useMemo(() => {
    return query.data?.results.map(result => ({
      queryId: result.queryId,
      success: result.success,
      data: result.success 
        ? result.data.reduce((acc, paramResult) => {
            if (paramResult.success) {
              acc[paramResult.parameter] = paramResult.data;
            }
            return acc;
          }, {} as Record<string, any>)
        : {},
      errors: result.success 
        ? result.data
            .filter(paramResult => !paramResult.success)
            .map(paramResult => ({ parameter: paramResult.parameter, error: paramResult.error }))
        : [{ parameter: 'query', error: result.error }],
      meta: result.success ? result.meta : undefined,
    })) || [];
  }, [query.data]);

  return {
    results: processedResults,
    meta: query.data?.meta,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}

/**
 * Hook to fetch available parameters
 */
export function useAvailableParameters(websiteId: string, options?: Partial<UseQueryOptions<ParametersResponse>>) {
  return useQuery({
    queryKey: ['dynamic-query-parameters', websiteId],
    queryFn: ({ signal }) => fetchAnalyticsData<ParametersResponse>('/query/parameters', websiteId, undefined, undefined, signal),
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
      id: 'device-data',
      parameters: ['device_type', 'browser_name', 'os_name'],
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
      id: 'geographic-data',
      parameters: ['country', 'region', 'city', 'timezone', 'language'],
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
      id: 'utm-data',
      parameters: ['utm_source', 'utm_medium', 'utm_campaign'],
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
      id: 'page-analytics',
      parameters: ['top_pages', 'exit_page'],
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
      id: 'performance-data',
      parameters: ['slow_pages'],
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
      id: 'pages',
      parameters: ['slow_pages'],
      limit: 100,
    },
    {
      id: 'countries',
      parameters: ['performance_by_country'],
      limit: 100,
    },
    {
      id: 'devices',
      parameters: ['performance_by_device'],
      limit: 100,
    },
    {
      id: 'browsers',
      parameters: ['performance_by_browser'],
      limit: 100,
    },
    {
      id: 'operating_systems',
      parameters: ['performance_by_os'],
      limit: 100,
    },
    {
      id: 'regions',
      parameters: ['performance_by_region'],
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
      id: 'traffic-sources',
      parameters: ['referrer', 'utm_source', 'utm_medium', 'utm_campaign'],
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
      id: 'countries',
      parameters: ['country'],
      limit: 100,
    },
    {
      id: 'regions',
      parameters: ['region'],
      limit: 100,
    },
    {
      id: 'timezones',
      parameters: ['timezone'],
      limit: 100,
    },
    {
      id: 'languages',
      parameters: ['language'],
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
      id: 'device-analytics',
      parameters: ['device_type', 'browser_name', 'os_name'],
      limit: 10,
    },
    {
      id: 'geographic-analytics',
      parameters: ['country', 'region', 'city', 'timezone', 'language'],
      limit: 100,
    },
    {
      id: 'utm-analytics',
      parameters: ['utm_source', 'utm_medium', 'utm_campaign'],
      limit: 10,
    },
    {
      id: 'page-analytics',
      parameters: ['top_pages', 'exit_page'],
      limit: 10,
    },
    {
      id: 'performance-analytics',
      parameters: ['slow_pages'],
      limit: 10,
    },
  ];

  return useBatchDynamicQuery(websiteId, dateRange, queries, options);
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
      { id: 'recent_errors', parameters: ['recent_errors'], limit: 100, filters },
      { id: 'error_types', parameters: ['error_types'], limit: 100, filters },
      { id: 'errors_by_page', parameters: ['errors_by_page'], filters },
      { id: 'errors_by_browser', parameters: ['errors_by_browser'], filters },
      { id: 'errors_by_os', parameters: ['errors_by_os'], filters },
      { id: 'errors_by_country', parameters: ['errors_by_country'], filters },
      { id: 'errors_by_device', parameters: ['errors_by_device'], filters },
      { id: 'error_trends', parameters: ['error_trends'], limit: 30, filters },
      { id: 'sessions_summary', parameters: ['sessions_summary'], filters },
    ],
    {
      ...options,
    }
  );
} 
