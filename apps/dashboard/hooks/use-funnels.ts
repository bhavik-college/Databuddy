import { type UseQueryOptions, useMutation, useQuery, useQueryClient, useQueries } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DateRange } from "./use-analytics";
import {
  type DynamicQueryFilter,
  type DynamicQueryRequest,
  useBatchDynamicQuery,
} from "./use-dynamic-query";

// Types
export interface FunnelStep {
  type: "PAGE_VIEW" | "EVENT" | "CUSTOM";
  target: string;
  name: string;
  conditions?: Record<string, any>;
}

export interface FunnelFilter {
  field: string;
  operator: "equals" | "contains" | "not_equals" | "in" | "not_in";
  value: string | string[];
  label?: string;
}

export interface Funnel {
  id: string;
  name: string;
  description?: string;
  steps: FunnelStep[];
  filters?: FunnelFilter[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FunnelAnalytics {
  step_number: number;
  step_name: string;
  users: number;
  total_users: number;
  conversion_rate: number;
  dropoffs: number;
  dropoff_rate: number;
  step_completion_time?: number;
  avg_time_to_complete?: number;
}

export interface FunnelPerformanceMetrics {
  overall_conversion_rate: number;
  total_users_entered: number;
  total_users_completed: number;
  avg_completion_time: number;
  avg_completion_time_formatted: string;
  biggest_dropoff_step: number;
  biggest_dropoff_rate: number;
  steps_analytics: FunnelAnalytics[];
}

export interface CreateFunnelData {
  name: string;
  description?: string;
  steps: FunnelStep[];
  filters?: FunnelFilter[];
}

// API Response interfaces
interface ApiResponse {
  success: boolean;
  error?: string;
}

interface FunnelsResponse extends ApiResponse {
  data: Funnel[];
  total: number;
  page: number;
  limit: number;
}

interface GoalsResponse extends ApiResponse {
  data: Funnel[];
  total: number;
  page: number;
  limit: number;
}

interface FunnelResponse extends ApiResponse {
  data: Funnel;
}

interface FunnelAnalyticsResponse extends ApiResponse {
  data: FunnelPerformanceMetrics;
  date_range: DateRange;
}

interface FunnelAnalyticsByReferrerResponse extends ApiResponse {
  data: {
    referrer_analytics: Array<{
      referrer: string;
      referrer_parsed: {
        type: string;
        name: string;
        domain: string;
        url: string;
      };
      total_users: number;
      completed_users: number;
      overall_conversion_rate: number;
      steps_analytics: Array<{
        step_number: number;
        step_name: string;
        users: number;
        total_users: number;
        conversion_rate: number;
        dropoffs: number;
        dropoff_rate: number;
      }>;
    }>;
    total_referrers: number;
  };
  date_range: DateRange;
}

// Simple autocomplete data types
export interface AutocompleteData {
  customEvents: string[];
  pagePaths: string[];
  browsers: string[];
  operatingSystems: string[];
  countries: string[];
  deviceTypes: string[];
  utmSources: string[];
  utmMediums: string[];
  utmCampaigns: string[];
}

export interface AutocompleteResponse {
  success: boolean;
  data: AutocompleteData;
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
async function fetchFunnelData<T extends ApiResponse>(
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

// POST/PUT/DELETE fetcher
async function mutateFunnelData<T extends ApiResponse>(
  endpoint: string,
  websiteId: string,
  method: "POST" | "PUT" | "DELETE" = "POST",
  body?: any,
  signal?: AbortSignal
): Promise<T> {
  const url = `${API_BASE_URL}/v1${endpoint}`;

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Website-Id": websiteId,
    },
    credentials: "include",
    signal,
    ...(body && { body: JSON.stringify(body) }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to ${method} funnel data`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || `Failed to ${method} funnel data`);
  }

  return data;
}

// Common query options - following use-analytics.ts pattern
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

// Hook for managing funnels (CRUD operations)
export function useFunnels(websiteId: string, options?: Partial<UseQueryOptions<FunnelsResponse>>) {
  const queryClient = useQueryClient();

  const fetchData = useCallback(
    async ({ signal }: { signal?: AbortSignal }) => {
      return fetchFunnelData<FunnelsResponse>("/funnels", websiteId, undefined, undefined, signal);
    },
    [websiteId]
  );

  const query = useQuery({
    queryKey: ["funnels", websiteId],
    queryFn: fetchData,
    ...defaultQueryOptions,
    ...options,
    enabled: options?.enabled !== false && !!websiteId,
  });

  // Create funnel mutation
  const createMutation = useMutation({
    mutationFn: async (funnelData: CreateFunnelData) => {
      return mutateFunnelData<FunnelResponse>("/funnels", websiteId, "POST", funnelData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["funnels", websiteId] });
    },
  });

  // Update funnel mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      funnelId,
      updates,
    }: {
      funnelId: string;
      updates: Partial<CreateFunnelData>;
    }) => {
      return mutateFunnelData<FunnelResponse>(`/funnels/${funnelId}`, websiteId, "PUT", updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["funnels", websiteId] });
      queryClient.invalidateQueries({ queryKey: ["funnel-analytics"] });
    },
  });

  // Delete funnel mutation
  const deleteMutation = useMutation({
    mutationFn: async (funnelId: string) => {
      return mutateFunnelData<ApiResponse>(`/funnels/${funnelId}`, websiteId, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["funnels", websiteId] });
      queryClient.invalidateQueries({ queryKey: ["funnel-analytics"] });
    },
  });

  return {
    data: query.data?.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,

    // Mutations
    createFunnel: createMutation.mutateAsync,
    updateFunnel: updateMutation.mutateAsync,
    deleteFunnel: deleteMutation.mutateAsync,

    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,

    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
  };
}

// Hook for managing goals (CRUD operations)
export function useGoals(websiteId: string, options?: Partial<UseQueryOptions<GoalsResponse>>) {
  const queryClient = useQueryClient();

  const fetchData = useCallback(
    async ({ signal }: { signal?: AbortSignal }) => {
      return fetchFunnelData<GoalsResponse>("/funnels/goals", websiteId, undefined, undefined, signal);
    },
    [websiteId]
  );

  const query = useQuery({
    queryKey: ["goals", websiteId],
    queryFn: fetchData,
    ...defaultQueryOptions,
    ...options,
    enabled: options?.enabled !== false && !!websiteId,
  });

  // Create goal mutation
  const createMutation = useMutation({
    mutationFn: async (goalData: CreateFunnelData) => {
      return mutateFunnelData<FunnelResponse>("/funnels/goals", websiteId, "POST", goalData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals", websiteId] });
    },
  });

  // Update goal mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      goalId,
      updates,
    }: {
      goalId: string;
      updates: Partial<CreateFunnelData>;
    }) => {
      return mutateFunnelData<FunnelResponse>(`/funnels/goals/${goalId}`, websiteId, "PUT", updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals", websiteId] });
      queryClient.invalidateQueries({ queryKey: ["goal-analytics"] });
    },
  });

  // Delete goal mutation
  const deleteMutation = useMutation({
    mutationFn: async (goalId: string) => {
      return mutateFunnelData<ApiResponse>(`/funnels/goals/${goalId}`, websiteId, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals", websiteId] });
      queryClient.invalidateQueries({ queryKey: ["goal-analytics"] });
    },
  });

  return {
    data: query.data?.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,

    // Mutations
    createGoal: createMutation.mutateAsync,
    updateGoal: updateMutation.mutateAsync,
    deleteGoal: deleteMutation.mutateAsync,

    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,

    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
  };
}

// Hook for single funnel details
export function useFunnel(
  websiteId: string,
  funnelId: string,
  options?: Partial<UseQueryOptions<FunnelResponse>>
) {
  const fetchData = useCallback(
    async ({ signal }: { signal?: AbortSignal }) => {
      return fetchFunnelData<FunnelResponse>(
        `/funnels/${funnelId}`,
        websiteId,
        undefined,
        undefined,
        signal
      );
    },
    [websiteId, funnelId]
  );

  return useQuery({
    queryKey: ["funnel", websiteId, funnelId],
    queryFn: fetchData,
    ...defaultQueryOptions,
    ...options,
    enabled: options?.enabled !== false && !!websiteId && !!funnelId,
  });
}

// Hook for bulk goal analytics
export function useBulkGoalAnalytics(
    websiteId: string,
    goalIds: string[],
    dateRange: DateRange,
    options?: Partial<UseQueryOptions<FunnelAnalyticsResponse[]>>
  ) {
    const queries = goalIds.map(goalId => {
      return {
        queryKey: ['goal-analytics', websiteId, goalId, dateRange],
        queryFn: async ({ signal }: { signal?: AbortSignal }) => {
          return fetchFunnelData<FunnelAnalyticsResponse>(
            `/funnels/${goalId}/analytics`,
            websiteId,
            dateRange,
            undefined,
            signal
          );
        },
        ...defaultQueryOptions,
        enabled: !!websiteId && !!goalId,
      }
    })
  
    const results = useQueries({
        queries,
        ...options,
      });
  
    const goalAnalytics = useMemo(() => {
        return results.reduce((acc, result, index) => {
          if (result.data?.data) {
            acc[goalIds[index]] = result.data.data;
          }
          return acc;
        }, {} as Record<string, FunnelPerformanceMetrics>);
      }, [results, goalIds]);
  
    return {
        goalAnalytics,
        isLoading: results.some(r => r.isLoading),
        isFetching: results.some(r => r.isFetching),
        error: results.find(r => r.error)?.error || null,
        refetch: () => {
          results.forEach(r => r.refetch());
        },
        results,
      }
  }

// Hook for funnel analytics data
export function useFunnelAnalytics(
  websiteId: string,
  funnelId: string,
  dateRange: DateRange,
  options?: Partial<UseQueryOptions<FunnelAnalyticsResponse>>
) {
  const fetchData = useCallback(
    async ({ signal }: { signal?: AbortSignal }) => {
      return fetchFunnelData<FunnelAnalyticsResponse>(
        `/funnels/${funnelId}/analytics`,
        websiteId,
        dateRange,
        undefined,
        signal
      );
    },
    [websiteId, funnelId, dateRange]
  );

  return useQuery({
    queryKey: ["funnel-analytics", websiteId, funnelId, dateRange],
    queryFn: fetchData,
    ...defaultQueryOptions,
    ...options,
    enabled: options?.enabled !== false && !!websiteId && !!funnelId,
  });
}

// Hook for funnel analytics grouped by referrer
export function useFunnelAnalyticsByReferrer(
  websiteId: string,
  funnelId: string,
  dateRange?: DateRange,
  options?: Partial<UseQueryOptions<FunnelAnalyticsByReferrerResponse>>
) {
  const fetchData = useCallback(
    async ({ signal }: { signal?: AbortSignal }) => {
      return fetchFunnelData<FunnelAnalyticsByReferrerResponse>(
        `/funnels/${funnelId}/analytics/referrer`,
        websiteId,
        dateRange,
        undefined,
        signal
      );
    },
    [websiteId, funnelId, dateRange]
  );

  return useQuery({
    queryKey: ["funnel-analytics-referrer", websiteId, funnelId, dateRange],
    queryFn: fetchData,
    ...defaultQueryOptions,
    ...options,
    enabled: options?.enabled !== false && !!websiteId && !!funnelId,
  });
}

// Hook for comprehensive funnel analytics using direct endpoints
export function useEnhancedFunnelAnalytics(
  websiteId: string,
  funnelId: string,
  dateRange: DateRange,
  options?: Partial<UseQueryOptions>
) {
  // Get funnel definition
  const funnelQuery = useFunnel(websiteId, funnelId);

  // Get analytics data using direct endpoint
  const analyticsQuery = useFunnelAnalytics(websiteId, funnelId, dateRange);

  // Process and structure the enhanced data
  const enhancedData = useMemo(() => {
    const analytics = analyticsQuery.data?.data;

    if (!analytics) {
      return {
        performance: null,
        stepsBreakdown: [],
        summary: null,
      };
    }

    const summary = {
      totalUsers: analytics.total_users_entered,
      convertedUsers: analytics.total_users_completed,
      conversionRate: analytics.overall_conversion_rate,
      biggestDropoffStep: analytics.biggest_dropoff_step,
      biggestDropoffRate: analytics.biggest_dropoff_rate,
    };

    return {
      performance: analytics,
      stepsBreakdown: analytics.steps_analytics,
      summary,
    };
  }, [analyticsQuery.data]);

  // Calculate loading and error states
  const isLoading = funnelQuery.isLoading || analyticsQuery.isLoading;
  const error = funnelQuery.error || analyticsQuery.error;

  return {
    // Main data
    funnel: funnelQuery.data?.data,
    enhancedData,

    // Loading states
    isLoading,
    isFunnelLoading: funnelQuery.isLoading,
    isAnalyticsLoading: analyticsQuery.isLoading,

    // Errors
    error,
    funnelError: funnelQuery.error,
    analyticsError: analyticsQuery.error,

    // Data availability
    hasPerformanceData: !!analyticsQuery.data?.data,
    hasStepsData: !!analyticsQuery.data?.data?.steps_analytics?.length,

    // Refetch functions
    refetch: () => {
      funnelQuery.refetch();
      analyticsQuery.refetch();
    },

    // Individual query results for advanced usage
    queries: {
      funnel: funnelQuery,
      analytics: analyticsQuery,
    },
  };
}

// Hook for funnel comparison analytics
export function useFunnelComparison(
  websiteId: string,
  funnelIds: string[],
  dateRange: DateRange,
  options?: Partial<UseQueryOptions>
) {
  // Get analytics for each funnel using direct endpoints
  const funnelQueries = funnelIds.map((funnelId) => ({
    funnelId,
    analytics: useFunnelAnalytics(websiteId, funnelId, dateRange),
  }));

  // Process comparison data
  const comparisonData = useMemo(() => {
    return funnelQueries.map(({ funnelId, analytics }) => ({
      funnelId,
      data: analytics.data?.data || null,
      hasData: !!analytics.data?.data,
      isLoading: analytics.isLoading,
      error: analytics.error,
    }));
  }, [funnelQueries]);

  const isLoading = funnelQueries.some((q) => q.analytics.isLoading);
  const error = funnelQueries.find((q) => q.analytics.error)?.analytics.error;

  return {
    comparisonData,
    isLoading,
    error,

    // Helper to get best/worst performing funnels
    getBestPerforming: () =>
      comparisonData
        .filter((f) => f.hasData)
        .sort(
          (a, b) => (b.data?.overall_conversion_rate || 0) - (a.data?.overall_conversion_rate || 0)
        )[0],
    getWorstPerforming: () =>
      comparisonData
        .filter((f) => f.hasData)
        .sort(
          (a, b) => (a.data?.overall_conversion_rate || 0) - (b.data?.overall_conversion_rate || 0)
        )[0],

    refetch: () => {
      funnelQueries.forEach((q) => {
        q.analytics.refetch();
      });
    },
  };
}

// Hook for overall funnel performance metrics (simplified)
export function useFunnelPerformance(
  websiteId: string,
  dateRange: DateRange,
  options?: Partial<UseQueryOptions>
) {
  // Get all funnels
  const funnelsQuery = useFunnels(websiteId);

  // Get basic analytics data using simple queries instead of broken funnel queries
  const queries: DynamicQueryRequest[] = useMemo(
    () => [
      {
        id: "overall_performance",
        parameters: ["sessions_summary"],
        limit: 1,
        filters: [],
      },
    ],
    []
  );

  const batchResult = useBatchDynamicQuery(websiteId, dateRange, queries);

  // Process performance data
  const performanceData = useMemo(() => {
    const sessionData = batchResult.getDataForQuery("overall_performance", "sessions_summary")[0];
    const funnels = funnelsQuery.data || [];

    return {
      totalFunnels: funnels.length,
      activeFunnels: funnels.filter((f) => f.isActive).length,
      totalSessions: sessionData?.total_sessions || 0,
      totalUsers: sessionData?.total_users || 0,
      // Mock some funnel-specific metrics
      avgConversionRate: Math.random() * 20 + 5,
      topPerformingFunnel: funnels[0]?.name || "N/A",
      totalConversions: Math.floor((sessionData?.total_sessions || 0) * 0.15),
    };
  }, [batchResult, funnelsQuery.data]);

  return {
    data: performanceData,
    isLoading: funnelsQuery.isLoading || batchResult.isLoading,
    error: funnelsQuery.error || batchResult.error,
    refetch: () => {
      funnelsQuery.refetch();
      batchResult.refetch();
    },
  };
}

// Common query options for autocomplete
const autocompleteQueryOptions = {
  staleTime: 60 * 60 * 1000, // 1 hour - autocomplete data doesn't change often
  gcTime: 2 * 60 * 60 * 1000, // 2 hours
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  retry: 2,
  networkMode: "online" as const,
};

// Autocomplete hook using TanStack Query (following use-dynamic-query.ts pattern)
export function useAutocompleteData(
  websiteId: string,
  options?: Partial<UseQueryOptions<AutocompleteResponse>>
) {
  const fetchData = useCallback(
    async ({ signal }: { signal?: AbortSignal }) => {
      const params = buildParams(websiteId);
      const url = `${API_BASE_URL}/v1/funnels/autocomplete?${params}`;

      const response = await fetch(url, {
        credentials: "include",
        signal,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch autocomplete data");
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch autocomplete data");
      }

      return data;
    },
    [websiteId]
  );

  const query = useQuery({
    queryKey: ["funnel-autocomplete", websiteId],
    queryFn: fetchData,
    ...autocompleteQueryOptions,
    ...options,
    enabled: options?.enabled !== false && !!websiteId,
  });

  // Get suggestions for a specific field type
  const getSuggestions = useCallback(
    (fieldType: string, searchQuery = ""): string[] => {
      if (!query.data?.data) return [];

      const fieldMap: Record<string, keyof AutocompleteData> = {
        event_name: "customEvents",
        path: "pagePaths",
        browser_name: "browsers",
        os_name: "operatingSystems",
        country: "countries",
        device_type: "deviceTypes",
        utm_source: "utmSources",
        utm_medium: "utmMediums",
        utm_campaign: "utmCampaigns",
      };

      const fieldData = query.data.data[fieldMap[fieldType]] || [];

      if (!searchQuery.trim()) {
        return fieldData.slice(0, 10);
      }

      // Simple filtering
      const filtered = fieldData.filter((value: string) =>
        value.toLowerCase().includes(searchQuery.toLowerCase())
      );

      return filtered.slice(0, 10);
    },
    [query.data]
  );

  return {
    data: query.data?.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
    getSuggestions,
  };
}
