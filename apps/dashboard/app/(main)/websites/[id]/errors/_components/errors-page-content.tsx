"use client";

import { ArrowClockwiseIcon, BugIcon } from "@phosphor-icons/react";
import { use, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AnimatedLoading } from "@/components/analytics/animated-loading";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { DateRange } from "@/hooks/use-analytics";
import type { DynamicQueryFilter } from "@/hooks/use-dynamic-query";
import { useEnhancedErrorData } from "@/hooks/use-dynamic-query";
import { EmptyState } from "../../_components/utils/ui-components";
import { ErrorDataTable } from "./error-data-table";
// Import our separated components
import { ErrorSummaryStats } from "./error-summary-stats";
import { ErrorTrendsChart } from "./error-trends-chart";
import { RecentErrorsList } from "./recent-errors-list";
import { TopErrorCard } from "./top-error-card";
import type { ErrorDetail, ErrorSummary, ProcessedError } from "./types";
import { categorizeError, normalizeData, safeFormatDate } from "./utils";

interface ErrorsPageContentProps {
  params: Promise<{ id: string }>;
}

export const ErrorsPageContent = ({ params }: ErrorsPageContentProps) => {
  const resolvedParams = use(params);
  const websiteId = resolvedParams.id;

  // Default to last 7 days
  const dateRange: DateRange = {
    start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    end_date: new Date().toISOString().split("T")[0],
    granularity: "daily",
  };

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);

  // Filters state
  const [activeFilters, setActiveFilters] = useState<DynamicQueryFilter[]>([]);

  // Add a new filter
  const addFilter = (field: string, value: string | number) => {
    // Prevent adding duplicate filters
    if (activeFilters.some((f) => f.field === field && f.value === value)) return;

    const newFilter: DynamicQueryFilter = { field, operator: "eq", value };
    setActiveFilters((prev) => [...prev, newFilter]);
  };

  // Remove a filter
  const removeFilter = (filterToRemove: DynamicQueryFilter) => {
    setActiveFilters((prev) =>
      prev.filter((f) => !(f.field === filterToRemove.field && f.value === filterToRemove.value))
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setActiveFilters([]);
  };

  // Fetch errors data using the enhanced hook
  const {
    results: errorResults,
    isLoading,
    refetch,
    error,
  } = useEnhancedErrorData(websiteId, dateRange, {
    filters: activeFilters,
    // Ensure the query re-runs when filters change
    queryKey: ["enhancedErrorData", websiteId, dateRange, activeFilters],
  });

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success("Error data refreshed");
    } catch (error) {
      console.error("Failed to refresh data:", error);
      toast.error("Failed to refresh error data.");
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  // Process all error data
  const processedData = useMemo(() => {
    if (isLoading || !errorResults || errorResults.length === 0) {
      return {
        recent_errors: [],
        error_types: [],
        errors_by_page: [],
        errors_by_browser: [],
        errors_by_os: [],
        errors_by_country: [],
        errors_by_device: [],
        error_trends: [],
        sessions_summary: [],
      };
    }

    const extractData = (queryId: string) => {
      const result = errorResults.find((r: any) => r.queryId === queryId);
      if (!result) {
        return [];
      }

      const dataObject = result.data;

      if (!dataObject || typeof dataObject !== "object" || Array.isArray(dataObject)) {
        return [];
      }

      const finalData = dataObject[queryId];

      if (!Array.isArray(finalData)) {
        return [];
      }

      return normalizeData(finalData);
    };

    const data = {
      recent_errors: extractData("recent_errors"),
      error_types: extractData("error_types"),
      errors_by_page: extractData("errors_by_page"),
      errors_by_browser: extractData("errors_by_browser"),
      errors_by_os: extractData("errors_by_os"),
      errors_by_country: extractData("errors_by_country"),
      errors_by_device: extractData("errors_by_device"),
      error_trends: extractData("error_trends"),
      sessions_summary: extractData("sessions_summary"),
    };

    return data;
  }, [errorResults, isLoading]);

  // Calculate error summary
  const errorSummary = useMemo((): ErrorSummary => {
    const recentErrors = processedData.recent_errors;
    const errorTypes = processedData.error_types;

    const summaryData = processedData.sessions_summary?.[0] || {
      total_sessions: 0,
      total_users: 0,
    };

    if (!(recentErrors.length || errorTypes.length)) {
      return {
        totalErrors: 0,
        uniqueErrorTypes: 0,
        affectedUsers: 0,
        affectedSessions: 0,
        errorRate: 0,
      };
    }

    const totalErrors = errorTypes.reduce(
      (sum: number, type: any) => sum + (type.total_occurrences || 0),
      0
    );
    const uniqueErrorTypes = errorTypes.length;
    const affectedUsers = errorTypes.reduce(
      (sum: number, type: any) => sum + (type.affected_users || 0),
      0
    );
    const affectedSessions = errorTypes.reduce(
      (sum: number, type: any) => sum + (type.affected_sessions || 0),
      0
    );

    const errorRate =
      summaryData.total_sessions > 0 ? (affectedSessions / summaryData.total_sessions) * 100 : 0;

    return {
      totalErrors,
      uniqueErrorTypes,
      affectedUsers,
      affectedSessions,
      errorRate,
    };
  }, [processedData]);

  // Find the top error
  const topError = useMemo(() => {
    if (!processedData.error_types?.length) return null;

    return processedData.error_types.reduce(
      (max, error) => (error.total_occurrences > max.total_occurrences ? error : max),
      processedData.error_types[0]
    );
  }, [processedData.error_types]);

  // Chart data for error trends
  const errorChartData = useMemo(() => {
    if (!processedData.error_trends?.length) return [];

    return processedData.error_trends.map((point: any) => ({
      date: safeFormatDate(point.date, "MMM d"),
      "Total Errors": point.total_errors || 0,
      "Affected Users": point.affected_users || 0,
    }));
  }, [processedData.error_trends]);

  // Process recent errors for display
  const processedRecentErrors = useMemo((): ProcessedError[] => {
    if (!processedData.recent_errors?.length) return [];

    const errorMap = new Map();

    for (const error of processedData.recent_errors) {
      // Add null check for error_message
      if (!(error && error.error_message)) continue;

      const { type, category, severity } = categorizeError(error.error_message);
      const key = `${type}-${error.error_message}`;

      if (errorMap.has(key)) {
        const existing = errorMap.get(key);
        existing.count += 1;
        existing.sessions.add(error.session_id);
        if (new Date(error.time) > new Date(existing.last_occurrence)) {
          existing.last_occurrence = error.time;
        }
      } else {
        errorMap.set(key, {
          error_type: type,
          category,
          severity,
          error_message: error.error_message,
          count: 1,
          unique_sessions: 1,
          sessions: new Set([error.session_id]),
          last_occurrence: error.time,
          sample_error: error,
        });
      }
    }

    return Array.from(errorMap.values())
      .map((error) => ({
        ...error,
        unique_sessions: error.sessions.size,
      }))
      .sort((a, b) => b.count - a.count);
  }, [processedData.recent_errors]);

  // Handle loading progress animation
  useEffect(() => {
    if (isLoading) {
      const intervals = [
        { target: 20, duration: 800 },
        { target: 45, duration: 1300 },
        { target: 70, duration: 1800 },
        { target: 90, duration: 2200 },
        { target: 100, duration: 2500 },
      ];

      let currentIndex = 0;
      const updateProgress = () => {
        if (currentIndex < intervals.length) {
          const { target, duration } = intervals[currentIndex];
          const startProgress = loadingProgress;
          const progressDiff = target - startProgress;
          const startTime = Date.now();

          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const currentProgress = startProgress + progressDiff * progress;

            setLoadingProgress(currentProgress);

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              currentIndex++;
              updateProgress();
            }
          };

          animate();
        }
      };

      updateProgress();
    } else {
      setLoadingProgress(0);
    }
  }, [isLoading, loadingProgress]);

  if (error) {
    return (
      <div className="mx-auto max-w-[1600px] p-3 sm:p-4 lg:p-6">
        <Card className="rounded-xl border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-3 text-center">
              <div className="rounded-full border border-destructive/20 bg-destructive/10 p-3">
                <BugIcon className="h-6 w-6 text-destructive" size={16} weight="duotone" />
              </div>
              <div>
                <h4 className="font-semibold text-destructive">Error loading error data</h4>
                <p className="mt-1 text-destructive/80 text-sm">
                  There was an issue loading your error analytics. Please try refreshing the page.
                </p>
              </div>
              <Button
                className="gap-2 rounded-lg"
                onClick={handleRefresh}
                size="sm"
                variant="outline"
              >
                <ArrowClockwiseIcon className="h-4 w-4" size={16} weight="fill" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 p-3 sm:p-4 lg:p-6">
      <div className="-mx-3 sm:-mx-4 lg:-mx-6 rounded border-b bg-muted/20 px-3 py-2 pb-6 sm:px-4 lg:px-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-primary/20 bg-primary/10 p-3">
                <BugIcon className="h-6 w-6 text-primary" size={16} weight="duotone" />
              </div>
              <div>
                <h1 className="font-bold text-2xl text-foreground tracking-tight sm:text-3xl">
                  Error Analytics
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Monitor and analyze application errors to improve user experience
                </p>
              </div>
            </div>
          </div>
          <Button
            className="gap-2 rounded-lg border-border/50 px-4 py-2 font-medium transition-all duration-300 hover:border-primary/50 hover:bg-primary/5"
            disabled={isRefreshing}
            onClick={handleRefresh}
            size="default"
            variant="outline"
          >
            <ArrowClockwiseIcon
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              size={16}
              weight="fill"
            />
            Refresh Data
          </Button>
        </div>
      </div>

      {isLoading ? (
        <AnimatedLoading progress={loadingProgress} type="errors" />
      ) : (
        <>
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left Column: Chart */}
            <div className="lg:col-span-2">
              <ErrorTrendsChart errorChartData={errorChartData} />
            </div>

            {/* Right Column: KPIs and Top Error */}
            <div className="space-y-4">
              <ErrorSummaryStats errorSummary={errorSummary} isLoading={isLoading} />
              <TopErrorCard topError={topError} />
            </div>
          </div>

          {/* Recent Errors List */}
          <RecentErrorsList processedRecentErrors={processedRecentErrors} />

          {/* Error Analysis Tables */}
          <ErrorDataTable
            isLoading={isLoading}
            isRefreshing={isRefreshing}
            onRowClick={addFilter}
            processedData={processedData}
          />
        </>
      )}
    </div>
  );
};
