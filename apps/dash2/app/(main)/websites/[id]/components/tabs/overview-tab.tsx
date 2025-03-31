"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { 
  Globe, 
  Users, 
  MousePointer, 
  AlertTriangle,
  BarChart,
  Timer,
  LayoutDashboard
} from "lucide-react";
import { differenceInDays } from "date-fns";

import { StatCard } from "@/components/analytics/stat-card";
import { MetricsChart } from "@/components/charts/metrics-chart";
import { DistributionChart } from "@/components/charts/distribution-chart";
import { DataTable } from "@/components/analytics/data-table";
import { useWebsiteAnalytics } from "@/hooks/use-analytics";
import { 
  formatDateByGranularity, 
  handleDataRefresh, 
  createMetricToggles,
  formatDistributionData,
  groupBrowserData,
  formatDomainLink,
  getColorVariant,
  calculatePercentChange
} from "../utils/analytics-helpers";
import { MetricToggles, ExternalLinkButton, BORDER_RADIUS } from "../utils/ui-components";
import { FullTabProps, MetricPoint } from "../utils/types";
// Define trend calculation return type
interface TrendCalculation {
  visitors?: number;
  unique_visitors?: number;
  sessions?: number;
  pageviews?: number;
  bounce_rate?: number;
  session_duration?: number;
  pages_per_session?: number;
}

export function WebsiteOverviewTab({
  websiteId,
  dateRange,
  websiteData,
  isRefreshing,
  setIsRefreshing,
}: FullTabProps) {
  // Local state for adjusted granularity
  const [adjustedDateRange, setAdjustedDateRange] = useState(dateRange);
  
  // Fetch analytics data
  const { analytics, loading, refetch } = useWebsiteAnalytics(websiteId, adjustedDateRange);

  // Chart metric visibility
  const [visibleMetrics, setVisibleMetrics] = useState<Record<string, boolean>>({
    pageviews: true,
    visitors: true,
    sessions: true,
    bounce_rate: false,
    avg_session_duration: false
  });
  
  // Toggle metric visibility
  const toggleMetric = useCallback((metric: string) => {
    setVisibleMetrics(prev => ({ ...prev, [metric]: !prev[metric] }));
  }, []);

  // Handle refresh
  useEffect(() => {
    let isMounted = true;
    
    if (isRefreshing) {
      const doRefresh = async () => {
        try {
          await refetch();
        } catch (error) {
          console.error("Failed to refresh data:", error);
        } finally {
          if (isMounted) {
            setIsRefreshing(false);
          }
        }
      };
      
      doRefresh();
    }
    
    return () => {
      isMounted = false;
    };
  }, [isRefreshing, refetch, setIsRefreshing]);

  // Set granularity based on date range
  useEffect(() => {
    const start = new Date(dateRange.start_date);
    const end = new Date(dateRange.end_date);
    const diffHours = Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60);
    
    const newAdjustedRange = {
      ...dateRange,
      granularity: !dateRange.granularity ? 
        (diffHours <= 24 ? 'hourly' : 'daily') : 
        dateRange.granularity
    };
    
    setAdjustedDateRange(newAdjustedRange);
  }, [dateRange]);

  // Combine loading states into one - component is loading if:
  // 1. The API is loading
  // 2. We are refreshing data
  const isLoading = loading.summary || isRefreshing;

  // Format data for UI
  const deviceData = useMemo(() => 
    formatDistributionData(analytics.device_types, 'device_type'), 
    [analytics.device_types]
  );

  const browserData = useMemo(() => 
    groupBrowserData(analytics.browser_versions), 
    [analytics.browser_versions]
  );

  const topPagesColumns = useMemo(() => [
    {
      accessorKey: 'path',
      header: 'Page',
      cell: (value: string) => {
        const link = formatDomainLink(value, websiteData?.domain);
        return <ExternalLinkButton href={link.href} label={link.display} title={link.title} />;
      }
    },
    {
      accessorKey: 'pageviews',
      header: 'Views',
      className: 'text-right',
    },
    {
      accessorKey: 'visitors',
      header: 'Visitors',
      className: 'text-right',
    },
  ], [websiteData?.domain]);

  const referrerColumns = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Source',
      cell: (value: string, row: any) => (
        <span className="font-medium">
          {value || row.referrer || 'Direct'}
        </span>
      )
    },
    {
      accessorKey: 'visitors',
      header: 'Visitors',
      className: 'text-right',
    },
    {
      accessorKey: 'pageviews',
      header: 'Views',
      className: 'text-right',
    },
  ], []);

  // Format chart data
  const chartData = useMemo(() => {
    if (!analytics.events_by_date?.length) return [];
    
    return analytics.events_by_date.map((event: any) => {
      // Start with the date
      const filtered: any = { 
        date: formatDateByGranularity(event.date, adjustedDateRange.granularity) 
      };
      
      // Map the metrics from the API data
      if (visibleMetrics.pageviews) {
        filtered.pageviews = event.pageviews;
      }
      
      if (visibleMetrics.visitors) {
        // Use visitors field from events_by_date
        filtered.visitors = event.visitors || event.unique_visitors || 0;
      }
      
      if (visibleMetrics.sessions) {
        filtered.sessions = event.sessions;
      }
      
      if (visibleMetrics.bounce_rate) {
        filtered.bounce_rate = event.bounce_rate;
      }
      
      if (visibleMetrics.avg_session_duration) {
        // Use the value directly - API already provides duration in seconds
        filtered.avg_session_duration = event.avg_session_duration || 0;
        
        // Also include the formatted string for tooltip use
        filtered.avg_session_duration_formatted = event.avg_session_duration_formatted || '0s';
      }
      
      return filtered;
    });
  }, [analytics.events_by_date, visibleMetrics, adjustedDateRange.granularity]);

  // Date range info for warning message
  const dateFrom = useMemo(() => new Date(dateRange.start_date), [dateRange.start_date]);
  const dateTo = useMemo(() => new Date(dateRange.end_date), [dateRange.end_date]);
  const dateDiff = useMemo(() => differenceInDays(dateTo, dateFrom), [dateTo, dateFrom]);

  // Metric colors
  const metricColors = {
    pageviews: 'blue-500',
    visitors: 'green-500',
    sessions: 'yellow-500',
    bounce_rate: 'red-500',
    avg_session_duration: 'purple-500'
  };

  // Calculate trends
  const calculateTrends = useMemo<TrendCalculation>(() => {
    if (!analytics.events_by_date?.length || analytics.events_by_date.length < 2) {
      return {
        visitors: undefined,
        unique_visitors: undefined,
        sessions: undefined,
        pageviews: undefined,
        bounce_rate: undefined,
        session_duration: undefined,
        pages_per_session: undefined
      };
    }

    const events = [...analytics.events_by_date].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Filter out days with no activity to prevent skewing calculations
    const activeEvents = events.filter(event => 
      event.pageviews > 0 || 
      event.sessions > 0 || 
      (event.visitors && event.visitors > 0)
    );
    
    if (activeEvents.length < 2) {
      return {
        visitors: undefined,
        unique_visitors: undefined,
        sessions: undefined,
        pageviews: undefined,
        bounce_rate: undefined,
        session_duration: undefined,
        pages_per_session: undefined
      };
    }
    
    const midpoint = Math.floor(activeEvents.length / 2);
    const previousPeriod = activeEvents.slice(0, midpoint);
    const currentPeriod = activeEvents.slice(midpoint);
    
    // Calculate metrics for each period
    const sum = (arr: any[], field: string) => arr.reduce((sum, item) => sum + (item[field] || 0), 0);
    
    const currentVisitors = sum(currentPeriod, 'visitors');
    const previousVisitors = sum(previousPeriod, 'visitors');
    
    // Use visitors instead since the API returns unique_visitors at the summary level
    // but uses visitors in the events_by_date array
    const currentUniqueVisitors = currentVisitors;
    const previousUniqueVisitors = previousVisitors;
    
    const currentSessions = sum(currentPeriod, 'sessions');
    const previousSessions = sum(previousPeriod, 'sessions');
    
    const currentPageviews = sum(currentPeriod, 'pageviews');
    const previousPageviews = sum(previousPeriod, 'pageviews');
    
    const currentPagesPerSession = currentSessions > 0 ? currentPageviews / currentSessions : 0;
    const previousPagesPerSession = previousSessions > 0 ? previousPageviews / previousSessions : 0;
    
    // Calculate weighted averages for bounce rate and session duration
    const getWeightedAvg = (arr: any[], field: string) => {
      const filtered = arr.filter(day => day[field] !== undefined && day[field] > 0);
      return filtered.length > 0 ? filtered.reduce((sum, day) => sum + (day[field] || 0), 0) / filtered.length : 0;
    };
    
    const currentBounceRate = getWeightedAvg(currentPeriod, 'bounce_rate');
    const previousBounceRate = getWeightedAvg(previousPeriod, 'bounce_rate');
    
    const currentSessionDuration = getWeightedAvg(currentPeriod, 'avg_session_duration');
    const previousSessionDuration = getWeightedAvg(previousPeriod, 'avg_session_duration');

    // Calculate and round percent changes
    const calcTrend = (current: number, previous: number, invert = false) => {
      if (previous <= 0) return undefined;
      const change = calculatePercentChange(current, previous);
      const value = Math.round(invert ? -change : change);
      return Math.max(-100, Math.min(1000, value)); // Limit between -100% and 1000%
    };

    return {
      visitors: calcTrend(currentVisitors, previousVisitors),
      unique_visitors: calcTrend(currentUniqueVisitors, previousUniqueVisitors),
      sessions: calcTrend(currentSessions, previousSessions),
      pageviews: calcTrend(currentPageviews, previousPageviews),
      pages_per_session: calcTrend(currentPagesPerSession, previousPagesPerSession),
      bounce_rate: calcTrend(currentBounceRate, previousBounceRate, true),
      session_duration: calcTrend(currentSessionDuration, previousSessionDuration)
    };
  }, [analytics.events_by_date]);

  return (
    <>
      {/* Key metrics */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Website Analytics</h2>
            <p className="text-sm text-muted-foreground">Key performance metrics for your website</p>
          </div>
        </div>
        
        <div className="rounded-2xl border shadow-sm overflow-hidden bg-background">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            <div className="border-r border-b md:border-b-0 group">
              <StatCard 
                title="UNIQUE VISITORS"
                value={analytics.summary?.unique_visitors || 0}
                icon={Users}
                description={`${analytics.today?.visitors || 0} today`}
                isLoading={isLoading}
                variant="default"
                trend={calculateTrends.visitors}
                trendLabel={calculateTrends.visitors !== undefined ? "vs previous period" : undefined}
                className="rounded-none border-0 h-full bg-transparent group-hover:bg-muted/20 transition-colors p-1 md:px-3 md:py-3"
              />
            </div>
            <div className="border-r md:border-r lg:border-r border-b md:border-b-0 group">
              <StatCard 
                title="SESSIONS"
                value={analytics.summary?.sessions || 0}
                icon={BarChart}
                description={`${analytics.today?.sessions || 0} today`}
                isLoading={isLoading}
                variant="default"
                trend={calculateTrends.sessions}
                trendLabel={calculateTrends.sessions !== undefined ? "vs previous period" : undefined}
                className="rounded-none border-0 h-full bg-transparent group-hover:bg-muted/20 transition-colors p-1 md:px-3 md:py-3"
              />
            </div>
            <div className="border-r-0 md:border-r border-b md:border-b-0 group">
              <StatCard 
                title="PAGE VIEWS"
                value={analytics.summary?.pageviews || 0}
                icon={Globe}
                description={`${analytics.today?.pageviews || 0} today`}
                isLoading={isLoading}
                variant="default"
                trend={calculateTrends.pageviews}
                trendLabel={calculateTrends.pageviews !== undefined ? "vs previous period" : undefined}
                className="rounded-none border-0 h-full bg-transparent group-hover:bg-muted/20 transition-colors p-1 md:px-3 md:py-3"
              />
            </div>
            <div className="border-r border-b-0 md:border-t lg:border-t-0 group">
              <StatCard 
                title="PAGES/SESSION"
                value={analytics.summary ? 
                  (analytics.summary.sessions > 0 ? 
                    (analytics.summary.pageviews / analytics.summary.sessions).toFixed(1) : 
                    '0'
                  ) : '0'
                }
                icon={LayoutDashboard}
                isLoading={isLoading}
                variant="default"
                trend={calculateTrends.pages_per_session}
                trendLabel={calculateTrends.pages_per_session !== undefined ? "vs previous period" : undefined}
                className="rounded-none border-0 h-full bg-transparent group-hover:bg-muted/20 transition-colors p-1 md:px-3 md:py-3"
              />
            </div>
            <div className="border-r md:border-r lg:border-r border-b-0 md:border-t lg:border-t-0 group">
              <StatCard 
                title="BOUNCE RATE"
                value={analytics.summary?.bounce_rate_pct || '0%'}
                icon={MousePointer}
                isLoading={isLoading}
                trend={calculateTrends.bounce_rate}
                trendLabel={calculateTrends.bounce_rate !== undefined ? "vs previous period" : undefined}
                variant={getColorVariant(analytics.summary?.bounce_rate || 0, 70, 50)}
                invertTrend={true}
                className="rounded-none border-0 h-full bg-transparent group-hover:bg-muted/20 transition-colors p-1 md:px-3 md:py-3"
              />
            </div>
            <div className="border-r-0 border-b-0 md:border-t lg:border-t-0 group">
              <StatCard 
                title="AVG. SESSION"
                value={analytics.summary?.avg_session_duration_formatted || '0s'}
                icon={Timer}
                isLoading={isLoading}
                variant="default"
                trend={calculateTrends.session_duration}
                trendLabel={calculateTrends.session_duration !== undefined ? "vs previous period" : undefined}
                className="rounded-none border-0 h-full bg-transparent group-hover:bg-muted/20 transition-colors p-1 md:px-3 md:py-3"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Visitor Trends */}
      <div className="rounded-2xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-start gap-3">
          <div>
            <h2 className="text-lg font-medium">Visitor Trends</h2>
            <p className="text-sm text-muted-foreground">
              Website performance metrics over time
              {adjustedDateRange.granularity === 'hourly' ? ' (hourly data)' : ' (daily data)'}
            </p>
            {adjustedDateRange.granularity === 'hourly' && dateDiff > 7 && (
              <div className="mt-1 flex items-center text-amber-600 gap-1 text-xs">
                <AlertTriangle className="h-3 w-3" />
                <span>Showing hourly data for more than 7 days may affect performance</span>
              </div>
            )}
          </div>
          
          {/* Metrics toggles */}
          <MetricToggles 
            metrics={visibleMetrics} 
            onToggle={toggleMetric} 
            colors={metricColors}
          />
        </div>
        <MetricsChart 
          data={chartData} 
          isLoading={isLoading}
        />
      </div>

      {/* Two column layout */}
      <div className="grid gap-2 grid-cols-2">
        {/* Left column */}
        <div className="space-y-2">
          <div className="rounded-2xl border shadow-sm overflow-hidden">
            <DistributionChart 
              data={deviceData} 
              isLoading={isLoading}
              title="Device Types"
              description="Visitors by device type"
              height={190}
            />
          </div>
          
          <div className="rounded-2xl border shadow-sm overflow-hidden">  
            <DataTable 
              data={analytics.top_referrers}
              columns={referrerColumns}
              title="Top Referrers"
              description="Sources of your traffic"
              isLoading={isLoading}
              limit={5}
            />
          </div>
        </div>
        
        {/* Right column */}
        <div className="space-y-2">
          <div className="rounded-2xl border shadow-sm overflow-hidden">
            <DistributionChart 
              data={browserData} 
              isLoading={isLoading}
              title="Browsers"
              description="Visitors by browser"
              height={190}
            />
          </div>
          
          <div className="rounded-2xl border shadow-sm overflow-hidden">
            <DataTable 
              data={analytics.top_pages}
              columns={topPagesColumns}
              title="Top Pages"
              description="Most viewed content"
              isLoading={isLoading}
              limit={5}
            />
          </div>
        </div>
      </div>
    </>
  );
} 