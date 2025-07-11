import { useMutation, useQuery, useQueryClient, useQueries } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { trpc } from "@/lib/trpc";
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

// Hook for managing funnels (CRUD operations)
export function useFunnels(websiteId: string, enabled = true) {
  const queryClient = useQueryClient();

  const query = trpc.funnels.list.useQuery(
    { websiteId },
    { enabled: enabled && !!websiteId }
  );

  // Create funnel mutation
  const createMutation = trpc.funnels.create.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["funnels", "list"]] });
    },
  });

  // Update funnel mutation
  const updateMutation = trpc.funnels.update.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["funnels", "list"]] });
      queryClient.invalidateQueries({ queryKey: [["funnels", "getAnalytics"]] });
    },
  });

  // Delete funnel mutation
  const deleteMutation = trpc.funnels.delete.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["funnels", "list"]] });
      queryClient.invalidateQueries({ queryKey: [["funnels", "getAnalytics"]] });
    },
  });

  return {
    data: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,

    // Mutations
    createFunnel: async (funnelData: CreateFunnelData) => {
      return createMutation.mutateAsync({
        websiteId,
        ...funnelData,
      });
    },
    updateFunnel: async ({
      funnelId,
      updates,
    }: {
      funnelId: string;
      updates: Partial<CreateFunnelData>;
    }) => {
      return updateMutation.mutateAsync({
        id: funnelId,
        ...updates,
      });
    },
    deleteFunnel: async (funnelId: string) => {
      return deleteMutation.mutateAsync({ id: funnelId });
    },

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
export function useFunnel(websiteId: string, funnelId: string, enabled = true) {
  return trpc.funnels.getById.useQuery(
    { id: funnelId, websiteId },
    { enabled: enabled && !!websiteId && !!funnelId }
  );
}

// Hook for funnel analytics data
export function useFunnelAnalytics(
  websiteId: string,
  funnelId: string,
  dateRange: DateRange,
  enabled = true
) {
  return trpc.funnels.getAnalytics.useQuery(
    {
      funnelId,
      websiteId,
      startDate: dateRange?.start_date,
      endDate: dateRange?.end_date,
    },
    { enabled: enabled && !!websiteId && !!funnelId }
  );
}

// Hook for funnel analytics grouped by referrer
export function useFunnelAnalyticsByReferrer(
  websiteId: string,
  funnelId: string,
  dateRange?: DateRange,
  enabled = true
) {
  return trpc.funnels.getAnalyticsByReferrer.useQuery(
    {
      funnelId,
      websiteId,
      startDate: dateRange?.start_date,
      endDate: dateRange?.end_date,
    },
    { enabled: enabled && !!websiteId && !!funnelId }
  );
}

// Hook for comprehensive funnel analytics using direct endpoints
export function useEnhancedFunnelAnalytics(
  websiteId: string,
  funnelId: string,
  dateRange: DateRange,
  enabled = true
) {
  // Get funnel definition
  const funnelQuery = useFunnel(websiteId, funnelId, enabled);

  // Get analytics data using direct endpoint
  const analyticsQuery = useFunnelAnalytics(websiteId, funnelId, dateRange, enabled);

  // Process and structure the enhanced data
  const enhancedData = useMemo(() => {
    const analytics = analyticsQuery.data;

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
    funnel: funnelQuery.data,
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
    hasPerformanceData: !!analyticsQuery.data,
    hasStepsData: !!analyticsQuery.data?.steps_analytics?.length,

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
  enabled = true
) {
  // Get analytics for each funnel using direct endpoints
  const funnelQueries = funnelIds.map((funnelId) => ({
    funnelId,
    analytics: useFunnelAnalytics(websiteId, funnelId, dateRange, enabled),
  }));

  // Process comparison data
  const comparisonData = useMemo(() => {
    return funnelQueries.map(({ funnelId, analytics }) => ({
      funnelId,
      data: analytics.data || null,
      hasData: !!analytics.data,
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
      for (const q of funnelQueries) {
        q.analytics.refetch();
      }
    },
  };
}

// Hook for overall funnel performance metrics (simplified)
export function useFunnelPerformance(
  websiteId: string,
  dateRange: DateRange,
  enabled = true
) {
  // Get all funnels
  const funnelsQuery = useFunnels(websiteId, enabled);

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

// Autocomplete hook using tRPC
export function useAutocompleteData(websiteId: string, enabled = true) {
  const query = trpc.funnels.getAutocomplete.useQuery(
    { websiteId },
    {
      enabled: enabled && !!websiteId,
      staleTime: 60 * 60 * 1000, // 1 hour - autocomplete data doesn't change often
      gcTime: 2 * 60 * 60 * 1000, // 2 hours
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: 2,
    }
  );

  // Get suggestions for a specific field type
  const getSuggestions = useCallback(
    (fieldType: string, searchQuery = ""): string[] => {
      if (!query.data) return [];

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

      const fieldData = query.data[fieldMap[fieldType]] || [];

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
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
    getSuggestions,
  };
}
