import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

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
}

export interface DateRange {
  start_date: string;
  end_date: string;
  granularity?: 'hourly' | 'daily';
}

export interface PageData {
  path: string;
  pageviews: number;
  visitors: number;
  avg_time_on_page: number;
  avg_time_on_page_formatted: string;
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
  cities: Array<{
    country: string;
    region: string;
    city: string;
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
  city: string;
  referrer: string;
  is_returning_visitor: boolean;
  visitor_session_count: number;
  referrer_parsed?: {
    type: string;
    name: string;
    domain: string;
  };
}

export interface SessionEventData {
  event_id: string;
  time: string;
  event_name: string;
  path: string;
  url: string;
  referrer: string;
  title: string;
  time_on_page: number;
  screen_resolution: string;
  user_agent?: string;
  device_type: string;
  browser: string;
  os: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
}

export interface SessionWithEvents extends SessionData {
  events: SessionEventData[];
}

export type TimeInterval = 'day' | 'week' | 'month';

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
  city: string;
  sessions: SessionData[];
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Unified analytics hook that fetches all the data
 * @param websiteId The ID of the website to fetch analytics for
 * @param dateRange The date range to fetch analytics for
 * @param options Additional options
 */
export function useWebsiteAnalytics(
  websiteId: string,
  dateRange: DateRange,
  options?: {
    trendsInterval?: TimeInterval;
    trendsLimit?: number;
    pagesLimit?: number;
    referrersLimit?: number;
    deviceLimit?: number;
    locationLimit?: number;
  }
) {
  // Set defaults for options
  const {
    trendsInterval = 'day',
    trendsLimit = 30,
    pagesLimit = 10,
    referrersLimit = 10,
    deviceLimit = 10,
    locationLimit = 10
  } = options || {};

  // Memoize the date range to ensure stable query keys
  const memoizedDateRange = useMemo(() => dateRange, [dateRange.start_date, dateRange.end_date, dateRange.granularity]);
  
  // Helper to build query params
  const buildParams = useCallback((additionalParams?: Record<string, string | number>) => {
    const params = new URLSearchParams({
      website_id: websiteId,
      start_date: memoizedDateRange.start_date,
      end_date: memoizedDateRange.end_date,
      ...(memoizedDateRange.granularity ? { granularity: memoizedDateRange.granularity } : {}),
      ...additionalParams
    });
    
    return params.toString();
  }, [websiteId, memoizedDateRange]);
  
  // Helper to fetch data with error handling
  const fetchData = useCallback(async (endpoint: string, params?: Record<string, string | number>, signal?: AbortSignal) => {
    // NOTE: The API should support the 'granularity' parameter with values 'hourly' or 'daily'
    // For hourly granularity, the API should return data points for each hour in the given date range
    // For daily granularity (default), the API should return data points for each day
    // When showing 24-hour data, use hourly granularity for more detailed charts
    const url = `${API_BASE_URL}${endpoint}?${buildParams(params)}`;
    
    // Add a query parameter to bust cache when manually refreshing
    const timestamp = new Date().getTime();
    
    const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}_t=${timestamp}`, {
      credentials: 'include',
      signal, // Pass the AbortSignal to allow cancellation
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch data from ${endpoint}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || `Failed to fetch data from ${endpoint}`);
    }
    
    return data;
  }, [buildParams]);

  // Summary query
  const summaryQuery = useQuery({
    queryKey: ['analytics', 'summary', websiteId, memoizedDateRange],
    queryFn: async ({ signal }) => {
      const data = await fetchData('/analytics/summary', undefined, signal);
      return {
        summary: data.summary as AnalyticsSummary,
        today: data.today as TodayStats,
        date_range: data.date_range as DateRange,
        performance: data.performance as PerformanceData,
        browser_versions: data.browser_versions as Array<{
          browser: string;
          version: string;
          count: number;
          visitors: number;
        }>,
        device_types: data.device_types as Array<{
          device_type: string;
          visitors: number;
          pageviews: number;
        }>,
        countries: data.countries as Array<{
          country: string;
          visitors: number;
          pageviews: number;
        }>,
        connection_types: data.connection_types as Array<{
          connection_type: string;
          visitors: number;
          pageviews: number;
        }>,
        languages: data.languages as Array<{
          language: string;
          visitors: number;
          pageviews: number;
        }>,
        timezones: data.timezones as Array<{
          timezone: string;
          visitors: number;
          pageviews: number;
        }>,
        top_pages: data.top_pages as Array<PageData>,
        top_referrers: data.top_referrers as Array<ReferrerData>,
        screen_resolutions: data.screen_resolutions as Array<{
          screen_resolution: string;
          count: number;
          visitors: number;
        }>,
        events_by_date: data.events_by_date as Array<TrendData>,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes - keep cached data longer
    refetchOnWindowFocus: false, // Don't auto-refresh when window gets focus
    refetchOnMount: false, // Don't auto-refresh when component mounts
    retry: (failureCount, error) => {
      // Don't retry on aborted requests
      if (error instanceof DOMException && error.name === 'AbortError') {
        return false;
      }
      return failureCount < 2; // Retry other errors up to 2 times
    }
  });
  const isLoading = summaryQuery.isLoading 
  const isError = summaryQuery.isError 
  
  // Manual refetch function
  const refetch = async () => {
    return summaryQuery.refetch({ cancelRefetch: false });
  };
  
  // Return all the data and loading states
  return {
    // Data
    analytics: {
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
      screen_resolutions: summaryQuery.data?.screen_resolutions,
      events_by_date: summaryQuery.data?.events_by_date,
    },
    // Individual loading states
    loading: {
      summary: summaryQuery.isLoading,
      any: isLoading
    },
    // Individual error states
    error: {
      summary: summaryQuery.isError,
      any: isError
    },
    // Original queries (if needed for refetching or other operations)
    queries: {
      summary: summaryQuery
    },
    // Refetch all queries
    refetch
  };
}

/**
 * Hook to fetch summary analytics data
 */
export function useAnalyticsSummary(websiteId: string, dateRange?: DateRange) {
  return useQuery({
    queryKey: ['analytics', 'summary', websiteId, dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        website_id: websiteId,
      });
      
      if (dateRange?.start_date) {
        params.append('start_date', dateRange.start_date);
      }
      
      if (dateRange?.end_date) {
        params.append('end_date', dateRange.end_date);
      }
      
      const response = await fetch(`${API_BASE_URL}/analytics/summary?${params.toString()}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics summary');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch analytics summary');
      }
      
      return {
        summary: data.summary as AnalyticsSummary,
        today: data.today as TodayStats,
        date_range: data.date_range as DateRange,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch visitor trends over time
 */
export function useAnalyticsTrends(
  websiteId: string, 
  interval: TimeInterval = 'day',
  dateRange?: DateRange,
  limit: number = 30
) {
  return useQuery({
    queryKey: ['analytics', 'trends', websiteId, interval, dateRange, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        website_id: websiteId,
        interval,
        limit: limit.toString(),
      });
      
      if (dateRange?.start_date) {
        params.append('start_date', dateRange.start_date);
      }
      
      if (dateRange?.end_date) {
        params.append('end_date', dateRange.end_date);
      }
      
      const response = await fetch(`${API_BASE_URL}/analytics/trends?${params.toString()}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics trends');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch analytics trends');
      }
      
      return {
        data: data.data as TrendData[],
        date_range: data.date_range as DateRange,
        interval: data.interval as TimeInterval,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch top pages data
 */
export function useAnalyticsPages(
  websiteId: string,
  dateRange?: DateRange,
  limit: number = 10
) {
  return useQuery({
    queryKey: ['analytics', 'pages', websiteId, dateRange, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        website_id: websiteId,
        limit: limit.toString(),
      });
      
      if (dateRange?.start_date) {
        params.append('start_date', dateRange.start_date);
      }
      
      if (dateRange?.end_date) {
        params.append('end_date', dateRange.end_date);
      }
      
      const response = await fetch(`${API_BASE_URL}/analytics/pages?${params.toString()}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch page analytics');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch page analytics');
      }
      
      return {
        data: data.data as PageData[],
        date_range: data.date_range as DateRange,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch referrer data
 */
export function useAnalyticsReferrers(
  websiteId: string,
  dateRange?: DateRange,
  limit: number = 10
) {
  return useQuery({
    queryKey: ['analytics', 'referrers', websiteId, dateRange, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        website_id: websiteId,
        limit: limit.toString(),
      });
      
      if (dateRange?.start_date) {
        params.append('start_date', dateRange.start_date);
      }
      
      if (dateRange?.end_date) {
        params.append('end_date', dateRange.end_date);
      }
      
      const response = await fetch(`${API_BASE_URL}/analytics/referrers?${params.toString()}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch referrer analytics');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch referrer analytics');
      }
      
      return {
        data: data.data as ReferrerData[],
        date_range: data.date_range as DateRange,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch device information
 */
export function useAnalyticsDevices(
  websiteId: string,
  dateRange?: DateRange,
  limit: number = 10
) {
  return useQuery({
    queryKey: ['analytics', 'devices', websiteId, dateRange, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        website_id: websiteId,
        limit: limit.toString(),
      });
      
      if (dateRange?.start_date) {
        params.append('start_date', dateRange.start_date);
      }
      
      if (dateRange?.end_date) {
        params.append('end_date', dateRange.end_date);
      }
      
      const response = await fetch(`${API_BASE_URL}/analytics/devices?${params.toString()}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch device analytics');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch device analytics');
      }
      
      return {
        browsers: data.browsers || [],
        os: data.os || [],
        device_types: data.device_types || [],
        date_range: data.date_range as DateRange,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch location data
 */
export function useAnalyticsLocations(
  websiteId: string,
  dateRange?: DateRange,
  limit: number = 10
) {
  return useQuery({
    queryKey: ['analytics', 'locations', websiteId, dateRange, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        website_id: websiteId,
        limit: limit.toString(),
      });
      
      if (dateRange?.start_date) {
        params.append('start_date', dateRange.start_date);
      }
      
      if (dateRange?.end_date) {
        params.append('end_date', dateRange.end_date);
      }
      
      const response = await fetch(`${API_BASE_URL}/analytics/locations?${params.toString()}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch location analytics');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch location analytics');
      }
      
      return {
        countries: data.countries || [],
        cities: data.cities || [],
        date_range: data.date_range as DateRange,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch sessions list
 */
export function useAnalyticsSessions(
  websiteId: string,
  dateRange?: DateRange,
  limit: number = 20
) {
  return useQuery({
    queryKey: ['analytics', 'sessions', websiteId, dateRange, limit],
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({
        website_id: websiteId,
        limit: limit.toString(),
      });
      
      if (dateRange?.start_date) {
        params.append('start_date', dateRange.start_date);
      }
      
      if (dateRange?.end_date) {
        params.append('end_date', dateRange.end_date);
      }
      
      // Add a timestamp to bust cache when manually refreshing
      params.append('_t', new Date().getTime().toString());
      
      const response = await fetch(`${API_BASE_URL}/analytics/sessions?${params.toString()}`, {
        credentials: 'include',
        signal, // Pass the AbortSignal to allow cancellation
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch sessions data');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch sessions data');
      }
      
      return {
        sessions: data.sessions as SessionData[],
        date_range: data.date_range as DateRange,
        unique_visitors: data.unique_visitors as number
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes 
    gcTime: 30 * 60 * 1000, // 30 minutes - keep cached data longer
    refetchOnWindowFocus: false, // Don't auto-refresh when window gets focus
    refetchOnMount: false, // Don't auto-refresh when component mounts
    retry: (failureCount, error) => {
      // Don't retry on aborted requests
      if (error instanceof DOMException && error.name === 'AbortError') {
        return false;
      }
      return failureCount < 2; // Retry other errors up to 2 times
    }
  });
}

/**
 * Hook to fetch details for a specific session
 */
export function useAnalyticsSessionDetails(
  websiteId: string,
  sessionId: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['analytics', 'session', websiteId, sessionId],
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({
        website_id: websiteId,
      });
      
      const response = await fetch(`${API_BASE_URL}/analytics/session/${sessionId}?${params.toString()}`, {
        credentials: 'include',
        signal, // Pass the AbortSignal to allow cancellation
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch session details');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch session details');
      }
      
      return {
        session: data.session as SessionWithEvents,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: enabled && !!sessionId,
    retry: (failureCount, error) => {
      // Don't retry on aborted requests
      if (error instanceof DOMException && error.name === 'AbortError') {
        return false;
      }
      return failureCount < 2; // Retry other errors up to 2 times
    }
  });
}

/**
 * Hook to fetch visitor profiles
 */
export function useAnalyticsProfiles(
  websiteId: string,
  dateRange?: DateRange,
  limit: number = 50
) {
  return useQuery({
    queryKey: ['analytics', 'profiles', websiteId, dateRange, limit],
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({
        website_id: websiteId,
        limit: limit.toString(),
      });
      
      if (dateRange?.start_date) {
        params.append('start_date', dateRange.start_date);
      }
      
      if (dateRange?.end_date) {
        params.append('end_date', dateRange.end_date);
      }
      
      // Add a timestamp to bust cache when manually refreshing
      params.append('_t', new Date().getTime().toString());
      
      const response = await fetch(`${API_BASE_URL}/analytics/profiles?${params.toString()}`, {
        credentials: 'include',
        signal, // Pass the AbortSignal to allow cancellation
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch visitor profiles');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch visitor profiles');
      }
      
      return {
        profiles: data.profiles as ProfileData[],
        date_range: data.date_range as DateRange,
        total_visitors: data.total_visitors as number,
        returning_visitors: data.returning_visitors as number
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes - keep cached data longer
    refetchOnWindowFocus: false, // Don't auto-refresh when window gets focus
    refetchOnMount: false, // Don't auto-refresh when component mounts
    retry: (failureCount, error) => {
      // Don't retry on aborted requests
      if (error instanceof DOMException && error.name === 'AbortError') {
        return false;
      }
      return failureCount < 2; // Retry other errors up to 2 times
    }
  });
}

/**
 * Hook to fetch website error analytics
 */
export function useWebsiteErrors(
  websiteId: string,
  dateRange?: DateRange,
  limit: number = 50,
  page: number = 1
) {
  return useQuery({
    queryKey: ['analytics', 'errors', websiteId, dateRange, limit, page],
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({
        website_id: websiteId,
        limit: limit.toString(),
        page: page.toString()
      });
      
      if (dateRange?.start_date) {
        params.append('start_date', dateRange.start_date);
      }
      
      if (dateRange?.end_date) {
        params.append('end_date', dateRange.end_date);
      }
      
      // Add a timestamp to bust cache when manually refreshing
      params.append('_t', new Date().getTime().toString());
      
      const response = await fetch(`${API_BASE_URL}/analytics/errors?${params.toString()}`, {
        credentials: 'include',
        signal, // Pass the AbortSignal to allow cancellation
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch error analytics');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch error analytics');
      }
      
      return data as ErrorsData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes - keep cached data longer
    refetchOnWindowFocus: false, // Don't auto-refresh when window gets focus
    refetchOnMount: false, // Don't auto-refresh when component mounts
    retry: (failureCount, error) => {
      // Don't retry on aborted requests
      if (error instanceof DOMException && error.name === 'AbortError') {
        return false;
      }
      return failureCount < 2; // Retry other errors up to 2 times
    }
  });
} 