"use client";

import { useEffect, useState, useMemo, useCallback, Suspense } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { useQueryState } from "nuqs";
import { ArrowClockwiseIcon, CalendarIcon, WarningIcon } from '@phosphor-icons/react';

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWebsite } from "@/hooks/use-websites";
import { useWebsiteAnalytics } from "@/hooks/use-analytics";
import { format, subDays, subHours } from "date-fns";
import type { DateRange as DayPickerRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useAtom } from "jotai";
import {
  dateRangeAtom,
  timeGranularityAtom,
  setDateRangeAndAdjustGranularityAtom,
  formattedDateRangeAtom,
  timezoneAtom,
} from "@/stores/jotai/filterAtoms";
import { EmptyState } from "./_components/utils/ui-components";

import type { FullTabProps, WebsiteDataTabProps } from "./_components/utils/types";

type TabId = 'overview' | 'audience' | 'content' | 'performance' | 'settings' | 'errors' | 'tracking-setup';

const WebsiteOverviewTab = dynamic(
  () => import("./_components/tabs/overview-tab").then(mod => ({ default: mod.WebsiteOverviewTab })),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);
const WebsiteAudienceTab = dynamic(
  () => import("./_components/tabs/audience-tab").then(mod => ({ default: mod.WebsiteAudienceTab })),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);
const WebsitePerformanceTab = dynamic(
  () => import("./_components/tabs/performance-tab").then(mod => ({ default: mod.WebsitePerformanceTab })),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);
const WebsiteSettingsTab = dynamic(
  () => import("./_components/tabs/settings-tab").then(mod => ({ default: mod.WebsiteSettingsTab })),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);
const WebsiteTrackingSetupTab = dynamic(
  () => import("./_components/tabs/tracking-setup-tab").then(mod => ({ default: mod.WebsiteTrackingSetupTab })),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);

type TabDefinition = {
  id: TabId;
  label: string;
  className?: string;
};

function WebsiteDetailsPage() {
  const [activeTab, setActiveTab] = useQueryState('tab', { defaultValue: 'overview' as TabId });
  const { id } = useParams();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentDateRange, setCurrentDateRangeState] = useAtom(dateRangeAtom);
  const [currentGranularity, setCurrentGranularityAtomState] = useAtom(timeGranularityAtom);
  const [, setDateRangeAction] = useAtom(setDateRangeAndAdjustGranularityAtom);
  const [formattedDateRangeState] = useAtom(formattedDateRangeAtom);
  const [timezone] = useAtom(timezoneAtom);

  const dayPickerSelectedRange: DayPickerRange | undefined = useMemo(() => ({
    from: currentDateRange.startDate,
    to: currentDateRange.endDate,
  }), [currentDateRange]);

  const quickRanges = useMemo(() => [
    { label: "24h", fullLabel: "Last 24 hours", hours: 24 },
    { label: "7d", fullLabel: "Last 7 days", days: 7 },
    { label: "30d", fullLabel: "Last 30 days", days: 30 },
  ], []);

  const handleQuickRangeSelect = useCallback((range: typeof quickRanges[0]) => {
    const now = new Date();
    const start = range.hours ? subHours(now, range.hours) : subDays(now, range.days || 7);
    setDateRangeAction({ startDate: start, endDate: now });
  }, [setDateRangeAction]);

  const memoizedDateRangeForTabs = useMemo(() => ({
    start_date: formattedDateRangeState.startDate,
    end_date: formattedDateRangeState.endDate,
    granularity: currentGranularity,
    timezone,
  }), [formattedDateRangeState, currentGranularity, timezone]);

  const handleDateRangeChange = useCallback((range: DayPickerRange | undefined) => {
    if (range?.from && range?.to) {
      setDateRangeAction({ startDate: range.from, endDate: range.to });
    }
  }, [setDateRangeAction]);

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
    if (isTrackingSetup === false && activeTab === 'overview') {
      setActiveTab('tracking-setup');
    }
  }, [isTrackingSetup, activeTab, setActiveTab]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Data refreshed");
    }, 1000);
  }, []);

  const renderTabContent = useCallback((tabId: TabId) => {
    if (tabId !== activeTab) return null;

    const key = `${tabId}-${id as string}`;
    const settingsProps: WebsiteDataTabProps = {
      websiteId: id as string,
      dateRange: memoizedDateRangeForTabs,
      websiteData: data,
      onWebsiteUpdated: refetchWebsiteData
    };

    const tabProps: FullTabProps = {
      ...settingsProps,
      isRefreshing,
      setIsRefreshing,
    };

    const getTabComponent = () => {
      switch (tabId) {
        case "overview": return <WebsiteOverviewTab {...tabProps} />;
        case "audience": return <WebsiteAudienceTab {...tabProps} />;
        case "performance": return <WebsitePerformanceTab {...tabProps} />;
        case "settings": return <WebsiteSettingsTab {...settingsProps} />;
        case "tracking-setup": return <WebsiteTrackingSetupTab {...settingsProps} />;
        default: return null;
      }
    };

    return (
      <Suspense key={key} fallback={<TabLoadingSkeleton />}>
        {getTabComponent()}
      </Suspense>
    );
  }, [activeTab, id, memoizedDateRangeForTabs, data, isRefreshing, refetchWebsiteData]);

  if (isLoading || isTrackingSetup === null) {
    return <TabLoadingSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="pt-8">
        <EmptyState
          icon={<WarningIcon size={48} weight="duotone" className="h-10 w-10" />}
          title="Website not found"
          description="The website you are looking for does not exist or you do not have access."
          action={<Link href="/websites"><Button variant="outline">Back to Websites</Button></Link>}
        />
      </div>
    );
  }

  const tabs: TabDefinition[] = isTrackingSetup ? [
    { id: "overview", label: "Overview", className: "pt-2 space-y-2" },
    { id: "audience", label: "Audience" },
    { id: "performance", label: "Performance" },
    { id: "settings", label: "Settings" },
  ] : [
    { id: "tracking-setup", label: "Setup Tracking" },
    { id: "settings", label: "Settings" },
  ];

  return (
    <div className="p-3 sm:p-4 max-w-[1600px] mx-auto">
      <header className="border-b pb-3">
        {/* Only show date range controls if tracking is set up */}
        {isTrackingSetup && (
          <div className="flex flex-col gap-3 mt-3 bg-muted/30 rounded-lg p-2.5 border">
            <div className="flex items-center justify-between gap-3">
              <div className="bg-background rounded-md border overflow-hidden flex shadow-sm h-8">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 text-xs px-2 sm:px-3 rounded-none cursor-pointer touch-manipulation ${currentGranularity === 'daily' ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground'}`}
                  onClick={() => setCurrentGranularityAtomState('daily')}
                  title="View daily aggregated data"
                >
                  Daily
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 text-xs px-2 sm:px-3 rounded-none cursor-pointer touch-manipulation ${currentGranularity === 'hourly' ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground'}`}
                  onClick={() => setCurrentGranularityAtomState('hourly')}
                  title="View hourly data (best for 24h periods)"
                >
                  Hourly
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 bg-background shadow-sm font-medium touch-manipulation cursor-pointer"
                onClick={handleRefresh}
                disabled={isRefreshing || isLoading}
              >
                <ArrowClockwiseIcon size={24} weight="fill" className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </span>
              </Button>
            </div>

            <div className="flex items-center gap-2 bg-background rounded-md p-1 border shadow-sm overflow-x-auto">
              {quickRanges.map((range) => {
                const now = new Date();
                const start = range.hours ? subHours(now, range.hours) : subDays(now, range.days || 7);
                const dayPickerCurrentRange = dayPickerSelectedRange;
                const isActive = dayPickerCurrentRange?.from && dayPickerCurrentRange?.to &&
                  format(dayPickerCurrentRange.from, 'yyyy-MM-dd') === format(start, 'yyyy-MM-dd') &&
                  format(dayPickerCurrentRange.to, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');

                return (
                  <Button
                    key={range.label}
                    variant={isActive ? 'default' : 'ghost'}
                    size="sm"
                    className={`h-6 cursor-pointer text-xs whitespace-nowrap px-2 sm:px-2.5 touch-manipulation ${isActive ? 'shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    onClick={() => handleQuickRangeSelect(range)}
                    title={range.fullLabel}
                  >
                    <span className="sm:hidden">{range.label}</span>
                    <span className="hidden sm:inline">{range.fullLabel}</span>
                  </Button>
                );
              })}

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs gap-1 sm:gap-1.5 whitespace-nowrap px-2 sm:px-2.5 border-l border-border/50 ml-1 pl-2 sm:pl-3 touch-manipulation"
                  >
                    <CalendarIcon size={24} weight="fill" className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary flex-shrink-0" />
                    <span className="font-medium text-xs truncate">
                      {dayPickerSelectedRange?.from ? format(dayPickerSelectedRange.from, 'MMM d') : ''} - {dayPickerSelectedRange?.to ? format(dayPickerSelectedRange.to, 'MMM d') : ''}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2 border shadow-lg" align="end">
                  <div className="grid gap-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                      <span className="text-sm font-medium">Select date range</span>
                      <div className="flex gap-1 flex-wrap">
                        {quickRanges.map((range) => (
                          <Button
                            key={range.label}
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs touch-manipulation"
                            onClick={() => handleQuickRangeSelect(range)}
                          >
                            {range.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <CalendarComponent
                      initialFocus
                      mode="range"
                      defaultMonth={dayPickerSelectedRange?.from}
                      selected={dayPickerSelectedRange}
                      onSelect={handleDateRangeChange}
                      numberOfMonths={window.innerWidth < 640 ? 1 : 2}
                      disabled={(d) => d > new Date() || d < new Date(2020, 0, 1)}
                      className="rounded-md border"
                    />
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        className="mt-2 touch-manipulation"
                        onClick={() => {
                          if (dayPickerSelectedRange?.from && dayPickerSelectedRange?.to) {
                            setDateRangeAction({ startDate: dayPickerSelectedRange.from, endDate: dayPickerSelectedRange.to });
                          }
                        }}
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
        defaultValue="overview"
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as TabId)}
        className="space-y-4"
      >
        <div className="border-b relative">
          <TabsList className="h-10 bg-transparent p-0 w-full justify-start overflow-x-auto">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="text-xs sm:text-sm h-10 px-2 sm:px-4 rounded-none touch-manipulation hover:bg-muted/50 relative transition-colors whitespace-nowrap cursor-pointer"
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary" />
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent
          key={activeTab}
          value={activeTab as TabId}
          className={`${tabs.find(t => t.id === activeTab)?.className || ''} transition-all duration-200 animate-fadeIn`}
        >
          {renderTabContent(activeTab as TabId)}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TabLoadingSkeleton() {
  return (
    <div className="space-y-6 py-8 p-4">
      {/* Key metrics cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[1, 2, 3, 4, 5, 6].map((num) => (
          <div key={`metric-skeleton-${num}`} className="rounded-lg border bg-background p-4">
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
        <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-start gap-3">
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map((tableNum) => (
          <div key={`table-skeleton-${tableNum}`} className="rounded-lg border bg-background">
            <div className="p-4 border-b">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-32 mt-1" />
            </div>
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map((rowNum) => (
                <div key={`row-skeleton-${rowNum}`} className="flex items-center justify-between">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((techNum) => (
          <div key={`tech-skeleton-${techNum}`} className="rounded-lg border bg-background">
            <div className="p-4 border-b">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-28 mt-1" />
            </div>
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4].map((rowNum) => (
                <div key={`tech-row-skeleton-${rowNum}`} className="flex items-center justify-between">
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
  )
}

function PageLoadingSkeleton() {
  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6 py-12">
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
        <div className="bg-muted/30 rounded-lg p-3 border space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex border rounded-md overflow-hidden">
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
              <Skeleton key={`tab-${num}`} className="h-10 w-20" />
            ))}
          </div>
        </div>

        {/* Tab content skeleton */}
        <TabLoadingSkeleton />
      </div>
    </div>
  );
}