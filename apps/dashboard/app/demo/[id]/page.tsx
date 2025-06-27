"use client";

import { ArrowClockwiseIcon, CalendarIcon, WarningIcon } from "@phosphor-icons/react";
import { format, subDays, subHours } from "date-fns";
import { useAtom } from "jotai";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQueryState } from "nuqs";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import type { DateRange as DayPickerRange } from "react-day-picker";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWebsiteAnalytics } from "@/hooks/use-analytics";
import { useWebsite } from "@/hooks/use-websites";
import {
  dateRangeAtom,
  formattedDateRangeAtom,
  setDateRangeAndAdjustGranularityAtom,
  timeGranularityAtom,
  timezoneAtom,
} from "@/stores/jotai/filterAtoms";
import type { FullTabProps, WebsiteDataTabProps } from "./_components/utils/types";
import { EmptyState } from "./_components/utils/ui-components";

type TabId =
  | "overview"
  | "audience"
  | "content"
  | "performance"
  | "settings"
  | "errors"
  | "tracking-setup";

const WebsiteOverviewTab = dynamic(
  () =>
    import("./_components/tabs/overview-tab").then((mod) => ({ default: mod.WebsiteOverviewTab })),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);
const WebsiteAudienceTab = dynamic(
  () =>
    import("./_components/tabs/audience-tab").then((mod) => ({ default: mod.WebsiteAudienceTab })),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);
const WebsitePerformanceTab = dynamic(
  () =>
    import("./_components/tabs/performance-tab").then((mod) => ({
      default: mod.WebsitePerformanceTab,
    })),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);
const WebsiteSettingsTab = dynamic(
  () =>
    import("./_components/tabs/settings-tab").then((mod) => ({ default: mod.WebsiteSettingsTab })),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);
const WebsiteTrackingSetupTab = dynamic(
  () =>
    import("./_components/tabs/tracking-setup-tab").then((mod) => ({
      default: mod.WebsiteTrackingSetupTab,
    })),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);

type TabDefinition = {
  id: TabId;
  label: string;
  className?: string;
};

function WebsiteDetailsPage() {
  const [activeTab, setActiveTab] = useQueryState("tab", { defaultValue: "overview" as TabId });
  const { id } = useParams();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentDateRange, setCurrentDateRangeState] = useAtom(dateRangeAtom);
  const [currentGranularity, setCurrentGranularityAtomState] = useAtom(timeGranularityAtom);
  const [, setDateRangeAction] = useAtom(setDateRangeAndAdjustGranularityAtom);
  const [formattedDateRangeState] = useAtom(formattedDateRangeAtom);
  const [timezone] = useAtom(timezoneAtom);

  const dayPickerSelectedRange: DayPickerRange | undefined = useMemo(
    () => ({
      from: currentDateRange.startDate,
      to: currentDateRange.endDate,
    }),
    [currentDateRange]
  );

  const quickRanges = useMemo(
    () => [
      { label: "24h", fullLabel: "Last 24 hours", hours: 24 },
      { label: "7d", fullLabel: "Last 7 days", days: 7 },
      { label: "30d", fullLabel: "Last 30 days", days: 30 },
    ],
    []
  );

  const handleQuickRangeSelect = useCallback(
    (range: (typeof quickRanges)[0]) => {
      const now = new Date();
      const start = range.hours ? subHours(now, range.hours) : subDays(now, range.days || 7);
      setDateRangeAction({ startDate: start, endDate: now });
    },
    [setDateRangeAction]
  );

  const memoizedDateRangeForTabs = useMemo(
    () => ({
      start_date: formattedDateRangeState.startDate,
      end_date: formattedDateRangeState.endDate,
      granularity: currentGranularity,
      timezone,
    }),
    [formattedDateRangeState, currentGranularity, timezone]
  );

  const handleDateRangeChange = useCallback(
    (range: DayPickerRange | undefined) => {
      if (range?.from && range?.to) {
        setDateRangeAction({ startDate: range.from, endDate: range.to });
      }
    },
    [setDateRangeAction]
  );

  const { data, isLoading, isError, error, refetch: refetchWebsiteData } = useWebsite(id as string);

  // Always call the analytics hook with the websiteId to maintain hook order
  const { analytics: analyticsData, loading: analyticsLoading } = useWebsiteAnalytics(
    id as string,
    memoizedDateRangeForTabs
  );

  // Determine tracking status once we have both website and analytics data
  const isTrackingSetup = useMemo(() => {
    if (!data || analyticsLoading.summary) return null; // Still loading
    return analyticsData?.tracking_setup !== false;
  }, [data, analyticsLoading.summary, analyticsData?.tracking_setup]);

  // Set initial tab based on tracking status, but only once when we first determine the status
  useEffect(() => {
    if (isTrackingSetup === false && activeTab === "overview") {
      setActiveTab("tracking-setup");
    }
  }, [isTrackingSetup, activeTab, setActiveTab]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Data refreshed");
    }, 1000);
  }, []);

  const renderTabContent = useCallback(
    (tabId: TabId) => {
      if (tabId !== activeTab) return null;

      const key = `${tabId}-${id as string}`;
      const settingsProps: WebsiteDataTabProps = {
        websiteId: id as string,
        dateRange: memoizedDateRangeForTabs,
        websiteData: data,
        onWebsiteUpdated: refetchWebsiteData,
      };

      const tabProps: FullTabProps = {
        ...settingsProps,
        isRefreshing,
        setIsRefreshing,
      };

      const getTabComponent = () => {
        switch (tabId) {
          case "overview":
            return <WebsiteOverviewTab {...tabProps} />;
          case "audience":
            return <WebsiteAudienceTab {...tabProps} />;
          case "performance":
            return <WebsitePerformanceTab {...tabProps} />;
          case "settings":
            return <WebsiteSettingsTab {...settingsProps} />;
          case "tracking-setup":
            return <WebsiteTrackingSetupTab {...settingsProps} />;
          default:
            return null;
        }
      };

      return (
        <Suspense fallback={<TabLoadingSkeleton />} key={key}>
          {getTabComponent()}
        </Suspense>
      );
    },
    [activeTab, id, memoizedDateRangeForTabs, data, isRefreshing, refetchWebsiteData]
  );

  if (isLoading || isTrackingSetup === null) {
    return <TabLoadingSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="pt-8">
        <EmptyState
          action={
            <Link href="/websites">
              <Button variant="outline">Back to Websites</Button>
            </Link>
          }
          description="The website you are looking for does not exist or you do not have access."
          icon={<WarningIcon className="h-10 w-10" size={48} weight="duotone" />}
          title="Website not found"
        />
      </div>
    );
  }

  const tabs: TabDefinition[] = isTrackingSetup
    ? [
        { id: "overview", label: "Overview", className: "pt-2 space-y-2" },
        { id: "audience", label: "Audience" },
        { id: "performance", label: "Performance" },
        { id: "settings", label: "Settings" },
      ]
    : [
        { id: "tracking-setup", label: "Setup Tracking" },
        { id: "settings", label: "Settings" },
      ];

  return (
    <div className="mx-auto max-w-[1600px] p-3 sm:p-4">
      <header className="border-b pb-3">
        {/* Only show date range controls if tracking is set up */}
        {isTrackingSetup && (
          <div className="mt-3 flex flex-col gap-3 rounded-lg border bg-muted/30 p-2.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex h-8 overflow-hidden rounded-md border bg-background shadow-sm">
                <Button
                  className={`h-8 cursor-pointer touch-manipulation rounded-none px-2 text-xs sm:px-3 ${currentGranularity === "daily" ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground"}`}
                  onClick={() => setCurrentGranularityAtomState("daily")}
                  size="sm"
                  title="View daily aggregated data"
                  variant="ghost"
                >
                  Daily
                </Button>
                <Button
                  className={`h-8 cursor-pointer touch-manipulation rounded-none px-2 text-xs sm:px-3 ${currentGranularity === "hourly" ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground"}`}
                  onClick={() => setCurrentGranularityAtomState("hourly")}
                  size="sm"
                  title="View hourly data (best for 24h periods)"
                  variant="ghost"
                >
                  Hourly
                </Button>
              </div>

              <Button
                className="h-8 cursor-pointer touch-manipulation gap-1.5 bg-background font-medium text-xs shadow-sm"
                disabled={isRefreshing || isLoading}
                onClick={handleRefresh}
                size="sm"
                variant="outline"
              >
                <ArrowClockwiseIcon
                  className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`}
                  size={24}
                  weight="fill"
                />
                <span className="hidden sm:inline">
                  {isRefreshing ? "Refreshing..." : "Refresh"}
                </span>
              </Button>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto rounded-md border bg-background p-1 shadow-sm">
              {quickRanges.map((range) => {
                const now = new Date();
                const start = range.hours
                  ? subHours(now, range.hours)
                  : subDays(now, range.days || 7);
                const dayPickerCurrentRange = dayPickerSelectedRange;
                const isActive =
                  dayPickerCurrentRange?.from &&
                  dayPickerCurrentRange?.to &&
                  format(dayPickerCurrentRange.from, "yyyy-MM-dd") ===
                    format(start, "yyyy-MM-dd") &&
                  format(dayPickerCurrentRange.to, "yyyy-MM-dd") === format(now, "yyyy-MM-dd");

                return (
                  <Button
                    className={`h-6 cursor-pointer touch-manipulation whitespace-nowrap px-2 text-xs sm:px-2.5 ${isActive ? "shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    key={range.label}
                    onClick={() => handleQuickRangeSelect(range)}
                    size="sm"
                    title={range.fullLabel}
                    variant={isActive ? "default" : "ghost"}
                  >
                    <span className="sm:hidden">{range.label}</span>
                    <span className="hidden sm:inline">{range.fullLabel}</span>
                  </Button>
                );
              })}

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    className="ml-1 h-6 touch-manipulation gap-1 whitespace-nowrap border-border/50 border-l px-2 pl-2 text-xs sm:gap-1.5 sm:px-2.5 sm:pl-3"
                    size="sm"
                    variant="ghost"
                  >
                    <CalendarIcon
                      className="h-3 w-3 flex-shrink-0 text-primary sm:h-3.5 sm:w-3.5"
                      size={24}
                      weight="fill"
                    />
                    <span className="truncate font-medium text-xs">
                      {dayPickerSelectedRange?.from
                        ? format(dayPickerSelectedRange.from, "MMM d")
                        : ""}{" "}
                      -{" "}
                      {dayPickerSelectedRange?.to ? format(dayPickerSelectedRange.to, "MMM d") : ""}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-auto border p-2 shadow-lg">
                  <div className="grid gap-2">
                    <div className="mb-2 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                      <span className="font-medium text-sm">Select date range</span>
                      <div className="flex flex-wrap gap-1">
                        {quickRanges.map((range) => (
                          <Button
                            className="h-7 touch-manipulation text-xs"
                            key={range.label}
                            onClick={() => handleQuickRangeSelect(range)}
                            size="sm"
                            variant="outline"
                          >
                            {range.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <CalendarComponent
                      className="rounded-md border"
                      defaultMonth={dayPickerSelectedRange?.from}
                      disabled={(d) => d > new Date() || d < new Date(2020, 0, 1)}
                      initialFocus
                      mode="range"
                      numberOfMonths={window.innerWidth < 640 ? 1 : 2}
                      onSelect={handleDateRangeChange}
                      selected={dayPickerSelectedRange}
                    />
                    <div className="flex justify-end">
                      <Button
                        className="mt-2 touch-manipulation"
                        onClick={() => {
                          if (dayPickerSelectedRange?.from && dayPickerSelectedRange?.to) {
                            setDateRangeAction({
                              startDate: dayPickerSelectedRange.from,
                              endDate: dayPickerSelectedRange.to,
                            });
                          }
                        }}
                        size="sm"
                      >
                        Apply Range
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}
      </header>

      <Tabs
        className="space-y-4"
        defaultValue="overview"
        onValueChange={(value) => setActiveTab(value as TabId)}
        value={activeTab}
      >
        <div className="relative border-b">
          <TabsList className="h-10 w-full justify-start overflow-x-auto bg-transparent p-0">
            {tabs.map((tab) => (
              <TabsTrigger
                className="relative h-10 cursor-pointer touch-manipulation whitespace-nowrap rounded-none px-2 text-xs transition-colors hover:bg-muted/50 sm:px-4 sm:text-sm"
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                value={tab.id}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 h-[2px] w-full bg-primary" />
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent
          className={`${tabs.find((t) => t.id === activeTab)?.className || ""} animate-fadeIn transition-all duration-200`}
          key={activeTab}
          value={activeTab as TabId}
        >
          {renderTabContent(activeTab as TabId)}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TabLoadingSkeleton() {
  return (
    <div className="space-y-6 p-4 py-8">
      {/* Key metrics cards skeleton */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {[1, 2, 3, 4, 5, 6].map((num) => (
          <div className="rounded-lg border bg-background p-4" key={`metric-skeleton-${num}`}>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="rounded border shadow-sm">
        <div className="flex flex-col items-start justify-between gap-3 border-b p-4 sm:flex-row">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
        <div className="p-4">
          <Skeleton className="h-80 w-full" />
        </div>
      </div>

      {/* Data tables skeleton */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[1, 2].map((tableNum) => (
          <div className="rounded-lg border bg-background" key={`table-skeleton-${tableNum}`}>
            <div className="border-b p-4">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="mt-1 h-4 w-32" />
            </div>
            <div className="space-y-3 p-4">
              {[1, 2, 3, 4, 5].map((rowNum) => (
                <div className="flex items-center justify-between" key={`row-skeleton-${rowNum}`}>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-5 w-10 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Technology breakdown skeleton */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {[1, 2, 3].map((techNum) => (
          <div className="rounded-lg border bg-background" key={`tech-skeleton-${techNum}`}>
            <div className="border-b p-4">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="mt-1 h-4 w-28" />
            </div>
            <div className="space-y-3 p-4">
              {[1, 2, 3, 4].map((rowNum) => (
                <div
                  className="flex items-center justify-between"
                  key={`tech-row-skeleton-${rowNum}`}
                >
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-6 w-6" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<PageLoadingSkeleton />}>
      <WebsiteDetailsPage />
    </Suspense>
  );
}

function PageLoadingSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 py-12">
      {/* Header skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>

        {/* Date range controls skeleton */}
        <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex overflow-hidden rounded-md border">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="space-y-4">
        <div className="border-b">
          <div className="flex gap-4">
            {[1, 2, 3, 4, 5].map((num) => (
              <Skeleton className="h-10 w-20" key={`tab-${num}`} />
            ))}
          </div>
        </div>

        {/* Tab content skeleton */}
        <TabLoadingSkeleton />
      </div>
    </div>
  );
}
