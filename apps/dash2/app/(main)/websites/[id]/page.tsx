"use client";

import { useEffect, useState, useMemo, useCallback, Suspense, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { 
  ArrowLeft, 
  RefreshCw,
  Calendar,
  AlertTriangle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getWebsiteById } from "@/app/actions/websites";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, subHours, differenceInDays } from "date-fns";
import type { DateRange as DayPickerRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useAtom } from "jotai";
import {
  dateRangeAtom,
  timeGranularityAtom,
  setDateRangeAndAdjustGranularityAtom,
  formattedDateRangeAtom,
} from "@/stores/jotai/filterAtoms";

import type React from "react";
import type { FullTabProps, WebsiteDataTabProps } from "./components/utils/types";

// Add type for tab ID
type TabId = 'overview' | 'audience' | 'content' | 'performance' | 'settings' | 'errors';

// Dynamic imports with proper loading states and error boundaries
const WebsiteOverviewTab = dynamic(
  () => import("./components/tabs/overview-tab").then(mod => ({ default: mod.WebsiteOverviewTab })),
  {
    loading: () => <TabLoadingSkeleton />,
    ssr: false
  }
);

const WebsiteAudienceTab = dynamic(
  () => import("./components/tabs/audience-tab").then(mod => ({ default: mod.WebsiteAudienceTab })),
  {
    loading: () => <TabLoadingSkeleton />,
    ssr: false
  }
);

const WebsiteContentTab = dynamic(
  () => import("./components/tabs/content-tab").then(mod => ({ default: mod.WebsiteContentTab })),
  {
    loading: () => <TabLoadingSkeleton />,
    ssr: false
  }
);

const WebsitePerformanceTab = dynamic(
  () => import("./components/tabs/performance-tab").then(mod => ({ default: mod.WebsitePerformanceTab })),
  {
    loading: () => <TabLoadingSkeleton />,
    ssr: false
  }
);

const WebsiteSettingsTab = dynamic(
  () => import("./components/tabs/settings-tab").then(mod => ({ default: mod.WebsiteSettingsTab })),
  {
    loading: () => <TabLoadingSkeleton />,
    ssr: false
  }
);

const WebsiteErrorsTab = dynamic(
  () => import("./components/tabs/errors-tab").then(mod => ({ default: mod.WebsiteErrorsTab })),
  {
    loading: () => <TabLoadingSkeleton />,
    ssr: false
  }
);

// Tab definition structure
type TabDefinition = {
  id: TabId;
  label: string;
  component: React.ComponentType<any>;
  className?: string;
  props?: "settings" | "full";
};

function WebsiteDetailsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const { id } = useParams();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshDetails, setRefreshDetails] = useState({
    component: "",
    progress: 0,
    total: 4
  });
  // Replace useState with Jotai atoms
  const [currentDateRange, setCurrentDateRangeState] = useAtom(dateRangeAtom);
  const [currentGranularity, setCurrentGranularityAtomState] = useAtom(timeGranularityAtom);
  const [, setDateRangeAction] = useAtom(setDateRangeAndAdjustGranularityAtom);
  const [formattedDateRangeState] = useAtom(formattedDateRangeAtom); // For passing string dates to tabs

  // The DayPickerRange uses 'from' and 'to', while our atom uses 'startDate' and 'endDate'
  const dayPickerSelectedRange: DayPickerRange | undefined = useMemo(() => ({
    from: currentDateRange.startDate,
    to: currentDateRange.endDate,
  }), [currentDateRange]);
  
  // Quick date range options - mobile optimized labels
  const quickRanges = [
    { label: "24h", fullLabel: "Last 24 hours", value: "24h", fn: () => ({
      start: subHours(new Date(), 24),
      end: new Date()
    })},
    { label: "7d", fullLabel: "Last 7 days", value: "7d", fn: () => ({
      start: subDays(new Date(), 7),
      end: new Date()
    })},
    { label: "30d", fullLabel: "Last 30 days", value: "30d", fn: () => ({
      start: subDays(new Date(), 30),
      end: new Date()
    })},
  ];
  
  // Handler for quick range selection
  const handleQuickRangeSelect = (rangeValue: string) => {
    const selectedRange = quickRanges.find(r => r.value === rangeValue);
    if (selectedRange) {
      const { start, end } = selectedRange.fn();
      setDateRangeAction({ startDate: start, endDate: end });
    }
  };

  // Memoize date range to prevent unnecessary re-renders
  // This will now be passed to tabs, using the string-formatted dates from Jotai
  const memoizedDateRangeForTabs = useMemo(() => ({
    start_date: formattedDateRangeState.startDate,
    end_date: formattedDateRangeState.endDate,
    granularity: currentGranularity,
  }), [formattedDateRangeState, currentGranularity]);

  // Callback for date range updates from Calendar
  const handleDateRangeChange = useCallback((range: DayPickerRange | undefined) => {
    if (range?.from && range?.to) {
      setDateRangeAction({ startDate: range.from, endDate: range.to });
    }
  }, [setDateRangeAction]);

  // Fetch website details with optimized settings and proper caching
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["website", id],
    queryFn: async () => {
      const result = await getWebsiteById(id as string);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 min
    gcTime: 10 * 60 * 1000, // 10 min
    refetchOnWindowFocus: false, // Prevent refetch on focus
    refetchInterval: false, // Disable automatic refetching
    retry: 1, // Limit retries to prevent request loops
    retryDelay: 3000, // Add delay between retries
  });

  // Add a stable reference to website ID to prevent unnecessary re-renders
  const websiteIdRef = useRef(id);
  useEffect(() => {
    websiteIdRef.current = id as string;
  }, [id]);

  // Create stable versions of the props objects before using in dependencies
  const stableTabProps = useMemo(() => ({
    websiteId: id as string,
    dateRange: memoizedDateRangeForTabs,
    websiteData: data,
    isRefreshing,
    setIsRefreshing: (value: boolean) => {
      setIsRefreshing(value);
    }
  }), [id, memoizedDateRangeForTabs, data, isRefreshing]);

  const stableSettingsProps: WebsiteDataTabProps = useMemo(() => ({
    websiteId: id as string,
    dateRange: memoizedDateRangeForTabs,
    websiteData: data
  }), [id, memoizedDateRangeForTabs, data]);

  // Function to render tab content with stable props and lazy loading
  const renderTabContent = useCallback((tabId: TabId) => {
    // Only render if this tab is active
    if (tabId !== activeTab) return null;

    // Settings tab uses different props (no refresh functionality)
    const key = `${tabId}-${websiteIdRef.current}-${tabId === "settings" ? "static" : memoizedDateRangeForTabs.start_date}`;

    if (tabId === "settings") {
      return (
        <Suspense fallback={<TabLoadingSkeleton />}>
          <WebsiteSettingsTab key={key} {...stableSettingsProps} />
        </Suspense>
      );
    }

    // All other tabs use FullTabProps
    const TabComponent = (() => {
      switch (tabId) {
        case "overview":
          return WebsiteOverviewTab;
        case "audience":
          return WebsiteAudienceTab;
        case "content":
          return WebsiteContentTab;
        case "performance":
          return WebsitePerformanceTab;
        case "errors":
          return WebsiteErrorsTab;
        default:
          return null;
      }
    })();

    if (!TabComponent) return null;

    return (
      <Suspense fallback={<TabLoadingSkeleton />}>
        <TabComponent key={key} {...stableTabProps} />
      </Suspense>
    );
  }, [activeTab, stableTabProps, stableSettingsProps, memoizedDateRangeForTabs.start_date]);

  // Define all tabs
  const tabs: TabDefinition[] = [
    { id: "overview", label: "Overview", component: WebsiteOverviewTab, className: "pt-2 space-y-2" },
    { id: "audience", label: "Audience", component: WebsiteAudienceTab },
    { id: "content", label: "Content", component: WebsiteContentTab },
    { id: "performance", label: "Performance", component: WebsitePerformanceTab },
    { id: "errors", label: "Errors", component: WebsiteErrorsTab },
    { id: "settings", label: "Settings", component: WebsiteSettingsTab, props: "settings" },
  ];

  // Add a new handleRefresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      // Find active tab component and only refresh the currently visible tab
      const activeTabDef = tabs.find(tab => tab.id === activeTab);
      setRefreshDetails({ 
        component: `${activeTabDef?.label || "Current"} data`, 
        progress: 1, 
        total: 1 
      });
      
      // Success message
      toast.success(`${activeTabDef?.label || "Dashboard"} data refreshed`);
    } catch (error) {
      toast.error("Failed to refresh data");
      console.error(error);
    } finally {
      // Component will set isRefreshing to false when done, but set it here as a fallback
      setRefreshDetails({ component: "", progress: 0, total: 1 });
      
      // Add a timeout safety to ensure isRefreshing is always reset
      // This handles edge cases where the component might fail to reset isRefreshing
      setTimeout(() => {
        setIsRefreshing(false);
      }, 5000); // 5 second safety timeout
    }
  };

  if (isLoading) {
    return (
      <div className="p-3 sm:p-4">
        {/* Mobile-optimized loading header */}
        <div className="flex items-center gap-2 mb-3">
          <Button variant="ghost" size="icon" disabled className="h-8 w-8 touch-manipulation">
            <ArrowLeft className="h-3.5 w-3.5" />
          </Button>
          <Skeleton className="h-4 w-24 sm:w-32" />
        </div>
        
        {/* Mobile-optimized loading controls */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
          <div>
            <Skeleton className="h-6 sm:h-7 w-32 sm:w-48 mb-1" />
            <Skeleton className="h-3 sm:h-3.5 w-24 sm:w-32" />
          </div>
          <Skeleton className="h-8 w-full sm:w-32" />
        </div>
        
        <Skeleton className="h-9 w-full mb-4" />
        
        {/* Mobile-optimized loading grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {[1, 2, 3, 4].map((num) => (
            <Skeleton key={`loading-skeleton-${num}`} className="h-20 sm:h-24 w-full" />
          ))}
        </div>
        
        <Skeleton className="h-48 sm:h-64 w-full mb-4" />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Skeleton className="h-32 sm:h-40 w-full" />
          <Skeleton className="h-32 sm:h-40 w-full" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] p-3 sm:p-4">
        <div className="bg-card border rounded-lg shadow-sm p-6 sm:p-8 max-w-md w-full text-center">
          <div className="bg-muted/50 rounded-full h-12 w-12 sm:h-16 sm:w-16 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold mb-3">Website Not Found</h1>
          <p className="text-muted-foreground mb-6 text-sm sm:text-base max-w-xs mx-auto">
            The website you're looking for doesn't exist or you don't have
            permission to view it.
          </p>
          <Button asChild size="default" className="px-6 touch-manipulation">
            <Link href="/websites">Back to Websites</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 max-w-[1600px] mx-auto">
      {/* Mobile-optimized header */}
      <header className="border-b pb-3">
        {/* Mobile-optimized controls */}
        <div className="flex flex-col gap-3 mt-3 bg-muted/30 rounded-lg p-2.5 border">
          {/* Top row: Time granularity and refresh button */}
          <div className="flex items-center justify-between gap-3">
            {/* Time granularity toggle */}
            <div className="bg-background rounded-md border overflow-hidden flex shadow-sm h-8">
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 text-xs px-2 sm:px-3 rounded-none touch-manipulation ${currentGranularity === 'daily' ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground'}`}
                onClick={() => setCurrentGranularityAtomState('daily')}
                title="View daily aggregated data"
              >
                Daily
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 text-xs px-2 sm:px-3 rounded-none touch-manipulation ${currentGranularity === 'hourly' ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground'}`}
                onClick={() => setCurrentGranularityAtomState('hourly')}
                title="View hourly data (best for 24h periods)"
              >
                Hourly
              </Button>
            </div>
            
            {/* Refresh button */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5 bg-background shadow-sm font-medium touch-manipulation"
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">
                {isRefreshing 
                  ? `${refreshDetails.progress}/${refreshDetails.total}` 
                  : 'Refresh'
                }
              </span>
            </Button>
          </div>
          
          {/* Bottom row: Date range controls */}
          <div className="flex items-center gap-2 bg-background rounded-md p-1 border shadow-sm overflow-x-auto">
            {/* Quick range buttons */}
            {quickRanges.map((range) => {
              const dayPickerCurrentRange = dayPickerSelectedRange;
              const isActive = dayPickerCurrentRange?.from && dayPickerCurrentRange?.to &&
                format(dayPickerCurrentRange.from, 'yyyy-MM-dd') === format(range.fn().start, 'yyyy-MM-dd') &&
                format(dayPickerCurrentRange.to, 'yyyy-MM-dd') === format(range.fn().end, 'yyyy-MM-dd');
              
              return (
                <Button 
                  key={range.value}
                  variant={isActive ? 'default' : 'ghost'} 
                  size="sm" 
                  className={`h-6 text-xs whitespace-nowrap px-2 sm:px-2.5 touch-manipulation ${isActive ? 'shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  onClick={() => handleQuickRangeSelect(range.value)}
                  title={range.fullLabel}
                >
                  <span className="sm:hidden">{range.label}</span>
                  <span className="hidden sm:inline">{range.fullLabel}</span>
                </Button>
              );
            })}
            
            {/* Custom date picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-xs gap-1 sm:gap-1.5 whitespace-nowrap px-2 sm:px-2.5 border-l border-border/50 ml-1 pl-2 sm:pl-3 touch-manipulation"
                >
                  <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary flex-shrink-0" />
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
                          key={range.value}
                          variant="outline"
                          size="sm" 
                          className="h-7 text-xs touch-manipulation"
                          onClick={() => handleQuickRangeSelect(range.value)}
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
      </header>

      {/* Mobile-optimized tabs */}
      <Tabs 
        defaultValue="overview" 
        value={activeTab} 
        onValueChange={(value) => setActiveTab(value as TabId)} 
        className="space-y-4"
      >
        <div className="border-b relative">
          <TabsList className="h-10 bg-transparent p-0 w-full justify-start gap-0.5 sm:gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id} 
                className="text-xs sm:text-sm h-10 px-2 sm:px-4 rounded-none touch-manipulation hover:bg-muted/50 relative transition-colors whitespace-nowrap"
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary animate-slideIn" />
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {tabs.map((tab) => (
          <TabsContent 
            key={tab.id} 
            value={tab.id} 
            className={`${tab.className} transition-all duration-200 animate-fadeIn`}
          >
            {renderTabContent(tab.id)}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
} 

// Mobile-optimized TabLoadingSkeleton
function TabLoadingSkeleton() {
  return (
    <div className="space-y-3 sm:space-y-4 pt-2">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((num) => (
          <Skeleton key={`tab-loading-skeleton-${num}`} className="h-20 sm:h-24 w-full" />
        ))}
      </div>
      <Skeleton className="h-48 sm:h-64 w-full" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Skeleton className="h-32 sm:h-40 w-full" />
        <Skeleton className="h-32 sm:h-40 w-full" />
      </div>
    </div>
  );
}

export default function Page() {
    return (
        <Suspense fallback={
          <div className="p-3 sm:p-4 flex items-center justify-center h-screen">
            <div className="space-y-3 w-full max-w-md">
              <Skeleton className="h-6 sm:h-7 w-2/3 mx-auto" />
              <Skeleton className="h-20 sm:h-24 w-full" />
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-12 sm:h-16 w-full" />
                <Skeleton className="h-12 sm:h-16 w-full" />
              </div>
              <Skeleton className="h-32 sm:h-48 w-full" />
            </div>
          </div>
        }>
            <WebsiteDetailsPage />
        </Suspense>
    )
}