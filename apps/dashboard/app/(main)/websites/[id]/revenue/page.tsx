"use client";

import { ChartLineIcon, CreditCardIcon, ReceiptIcon, TrendUpIcon } from "@phosphor-icons/react";
import { useAtom } from "jotai";
import { useParams } from "next/navigation";
import { lazy, Suspense, useCallback, useMemo, useState } from "react";
import { useRevenueConfig } from "@/app/(main)/revenue/hooks/use-revenue-config";
// Card components removed - using direct div styling for consistency with overview tab
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWebsite } from "@/hooks/use-websites";
import { formattedDateRangeAtom, timeGranularityAtom } from "@/stores/jotai/filterAtoms";
import { useWebsiteRevenue } from "./hooks/use-website-revenue";

// Lazy load components
const PageHeader = lazy(() =>
  import("./_components/page-header").then((m) => ({ default: m.PageHeader }))
);
const RevenueMetrics = lazy(() =>
  import("./_components/revenue-metrics").then((m) => ({ default: m.RevenueMetrics }))
);
const RevenueChart = lazy(() =>
  import("./_components/revenue-chart").then((m) => ({ default: m.RevenueChart }))
);
const RecentTransactions = lazy(() =>
  import("./_components/recent-transactions").then((m) => ({ default: m.RecentTransactions }))
);
const RevenueNotSetup = lazy(() =>
  import("./_components/empty-states").then((m) => ({ default: m.RevenueNotSetup }))
);
const NoRevenueData = lazy(() =>
  import("./_components/empty-states").then((m) => ({ default: m.NoRevenueData }))
);

const PageHeaderSkeleton = () => (
  <div className="space-y-4">
    <div className="-mx-3 sm:-mx-4 lg:-mx-6 border-b bg-gradient-to-r from-background via-background to-muted/20 px-3 pb-6 sm:px-4 lg:px-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 animate-pulse rounded-xl bg-muted" />
            <div>
              <div className="mb-2 h-8 w-48 animate-pulse rounded bg-muted" />
              <div className="h-4 w-64 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-32 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    </div>

    {/* Metrics Skeleton */}
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div className="overflow-hidden rounded-lg border bg-card" key={i}>
          <div className="p-3 sm:p-4">
            <div className="mb-1.5 flex items-center justify-between sm:mb-2">
              <Skeleton className="h-2.5 w-16 rounded sm:h-3 sm:w-20" />
              <div className="rounded-md bg-muted/20 p-1">
                <Skeleton className="h-3 w-3 rounded sm:h-4 sm:w-4" />
              </div>
            </div>
            <Skeleton className="mb-1.5 h-5 w-20 rounded sm:mb-2 sm:h-6 sm:w-24 md:h-8" />
            <Skeleton className="h-3 w-12 rounded sm:h-4 sm:w-16" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const RevenueMetricsSkeleton = () => (
  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
    {[...Array(4)].map((_, i) => (
      <div className="overflow-hidden rounded-lg border bg-card" key={i}>
        <div className="p-3 sm:p-4">
          <div className="mb-1.5 flex items-center justify-between sm:mb-2">
            <Skeleton className="h-2.5 w-16 rounded sm:h-3 sm:w-20" />
            <div className="rounded-md bg-muted/20 p-1">
              <Skeleton className="h-3 w-3 rounded sm:h-4 sm:w-4" />
            </div>
          </div>
          <Skeleton className="mb-1.5 h-5 w-20 rounded sm:mb-2 sm:h-6 sm:w-24 md:h-8" />
          <Skeleton className="h-3 w-12 rounded sm:h-4 sm:w-16" />
        </div>
      </div>
    ))}
  </div>
);

export default function WebsiteRevenuePage() {
  const { id } = useParams();
  const websiteId = id as string;
  const [activeTab, setActiveTab] = useState("overview");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Date range state
  const [formattedDateRangeState] = useAtom(formattedDateRangeAtom);
  const [currentGranularity] = useAtom(timeGranularityAtom);

  const dateRange = useMemo(
    () => ({
      start_date: formattedDateRangeState.startDate,
      end_date: formattedDateRangeState.endDate,
      granularity: currentGranularity,
    }),
    [formattedDateRangeState, currentGranularity]
  );

  // Fetch data
  const { data: websiteData } = useWebsite(websiteId);
  const revenueConfig = useRevenueConfig();
  const {
    data: revenueData,
    summaryStats,
    isLoading: revenueLoading,
    error: revenueError,
    refetch,
  } = useWebsiteRevenue(websiteId, dateRange);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetch(), revenueConfig.refetch?.()]);
    } catch (error) {
      console.error("Failed to refresh revenue data:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch, revenueConfig.refetch]);

  // Loading state
  if (revenueConfig.isLoading) {
    return (
      <div className="mx-auto max-w-[1600px] space-y-4 p-3 sm:p-4 lg:p-6">
        <PageHeaderSkeleton />
      </div>
    );
  }

  // Revenue not set up
  if (!revenueConfig.isSetupComplete) {
    return (
      <div className="mx-auto max-w-[1600px] space-y-4 p-3 sm:p-4 lg:p-6">
        <Suspense fallback={<PageHeaderSkeleton />}>
          <PageHeader
            isRefreshing={isRefreshing}
            onRefresh={handleRefresh}
            websiteId={websiteId}
            websiteName={websiteData?.name || undefined}
          />
        </Suspense>

        <Suspense fallback={<Skeleton className="h-64 w-full" />}>
          <RevenueNotSetup websiteName={websiteData?.name || undefined} />
        </Suspense>
      </div>
    );
  }

  // No data state
  if (!(summaryStats.hasData || revenueLoading)) {
    return (
      <div className="mx-auto max-w-[1600px] space-y-4 p-3 sm:p-4 lg:p-6">
        <Suspense fallback={<PageHeaderSkeleton />}>
          <PageHeader
            errorMessage={revenueError?.message}
            hasError={!!revenueError}
            isRefreshing={isRefreshing}
            onRefresh={handleRefresh}
            websiteId={websiteId}
            websiteName={websiteData?.name || undefined}
          />
        </Suspense>

        <Suspense fallback={<Skeleton className="h-64 w-full" />}>
          <NoRevenueData websiteName={websiteData?.name || undefined} />
        </Suspense>
      </div>
    );
  }

  // Main revenue page
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-3 sm:p-4 lg:p-6">
      <Suspense fallback={<PageHeaderSkeleton />}>
        <PageHeader
          errorMessage={revenueError?.message}
          hasError={!!revenueError}
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
          websiteId={websiteId}
          websiteName={websiteData?.name || undefined}
        />
      </Suspense>

      {/* Revenue Metrics */}
      <Suspense fallback={<RevenueMetricsSkeleton />}>
        <RevenueMetrics
          isLoading={revenueLoading}
          refundRate={summaryStats.refundRate}
          summary={revenueData.summary}
        />
      </Suspense>

      {/* Revenue Analytics Tabs */}
      <Tabs className="space-y-4" onValueChange={setActiveTab} value={activeTab}>
        <div className="relative border-b">
          <TabsList className="h-10 w-full justify-start overflow-x-auto bg-transparent p-0">
            <TabsTrigger
              className="relative flex h-10 cursor-pointer touch-manipulation items-center gap-2 whitespace-nowrap rounded-none px-2 text-xs transition-colors hover:bg-muted/50 sm:px-4 sm:text-sm"
              value="overview"
            >
              <ChartLineIcon size={16} />
              Overview
              {activeTab === "overview" && (
                <div className="absolute bottom-0 left-0 h-[2px] w-full bg-primary" />
              )}
            </TabsTrigger>
            <TabsTrigger
              className="relative flex h-10 cursor-pointer touch-manipulation items-center gap-2 whitespace-nowrap rounded-none px-2 text-xs transition-colors hover:bg-muted/50 sm:px-4 sm:text-sm"
              value="transactions"
            >
              <ReceiptIcon size={16} />
              Transactions
              {activeTab === "transactions" && (
                <div className="absolute bottom-0 left-0 h-[2px] w-full bg-primary" />
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          className="animate-fadeIn space-y-6 transition-all duration-200"
          value="overview"
        >
          <div className="rounded border bg-card shadow-sm">
            <div className="flex flex-col items-start justify-between gap-3 border-b p-4 sm:flex-row">
              <div>
                <h2 className="flex items-center gap-2 font-semibold text-lg tracking-tight">
                  <TrendUpIcon size={20} weight="duotone" />
                  Revenue Trends
                </h2>
                <p className="text-muted-foreground text-sm">
                  {dateRange.granularity === "hourly" ? "Hourly" : "Daily"} revenue data
                </p>
              </div>
            </div>
            <div>
              <Suspense
                fallback={
                  <div className="flex items-center justify-center py-8">
                    <div className="relative">
                      <div className="h-6 w-6 rounded-full border-2 border-muted" />
                      <div className="absolute top-0 left-0 h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                    <div className="ml-3 text-muted-foreground text-sm">Loading chart...</div>
                  </div>
                }
              >
                <RevenueChart data={revenueData.trends} isLoading={revenueLoading} />
              </Suspense>
            </div>
          </div>
        </TabsContent>

        <TabsContent
          className="animate-fadeIn space-y-6 transition-all duration-200"
          value="transactions"
        >
          <div className="rounded border bg-card shadow-sm">
            <div className="flex flex-col items-start justify-between gap-3 border-b p-4 sm:flex-row">
              <div>
                <h2 className="flex items-center gap-2 font-semibold text-lg tracking-tight">
                  <CreditCardIcon size={20} weight="duotone" />
                  Recent Transactions
                </h2>
                <p className="text-muted-foreground text-sm">
                  Latest payment transactions for this website
                </p>
              </div>
            </div>
            <div className="p-4">
              <Suspense
                fallback={
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div
                        className="flex items-center justify-between rounded-lg border p-3"
                        key={i}
                      >
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                        <Skeleton className="h-6 w-16" />
                      </div>
                    ))}
                  </div>
                }
              >
                <RecentTransactions
                  data={revenueData.recent_transactions}
                  isLoading={revenueLoading}
                />
              </Suspense>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
