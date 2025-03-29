"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { 
  Globe, 
  Users, 
  MousePointer, 
  Clock, 
  Zap,
  AlertTriangle,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { toast } from "sonner";

import { StatCard } from "@/components/analytics/stat-card";
import { MetricsChart } from "@/components/charts/metrics-chart";
import { DistributionChart } from "@/components/charts/distribution-chart";
import { DataTable } from "@/components/analytics/data-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useWebsiteAnalytics } from "@/hooks/use-analytics";
import { DateRange } from "@/hooks/use-analytics";
import { ExternalLink } from "lucide-react";
import { 
  formatDateByGranularity, 
  handleDataRefresh, 
  createMetricToggles,
  formatDistributionData,
  groupBrowserData,
  formatDomainLink,
  getColorVariant,
  calculatePercentChange,
  formatPercentChange
} from "../utils/analytics-helpers";
import { MetricToggles, ExternalLinkButton, BORDER_RADIUS } from "../utils/ui-components";
import { FullTabProps, MetricPoint } from "../utils/types";

// Define metric types
type MetricType = 'pageviews' | 'visitors' | 'sessions' | 'bounce_rate';

export function WebsiteOverviewTab({
  websiteId,
  dateRange,
  websiteData,
  isRefreshing,
  setIsRefreshing,
}: FullTabProps) {
  // Local state for adjusted granularity
  const [adjustedDateRange, setAdjustedDateRange] = useState(dateRange);
  
  // Fetch all analytics data with a single hook
  const {
    analytics,
    loading,
    refetch
  } = useWebsiteAnalytics(websiteId, adjustedDateRange);

  // Add state for chart metric visibility
  const [visibleMetrics, setVisibleMetrics] = useState<Record<string, boolean>>(
    createMetricToggles(['pageviews', 'sessions'])
  );
  
  // Handler for toggling metrics visibility
  const toggleMetric = useCallback((metric: string) => {
    setVisibleMetrics(prev => ({
      ...prev,
      [metric]: !prev[metric]
    }));
  }, []);

  // Run refetch when isRefreshing changes to true
  useEffect(() => {
    handleDataRefresh(isRefreshing, refetch, setIsRefreshing, "Analytics data has been updated");
  }, [isRefreshing, refetch, setIsRefreshing]);

  // Automatically set granularity based on date range
  useEffect(() => {
    // Get the date objects
    const start = new Date(dateRange.start_date);
    const end = new Date(dateRange.end_date);
    
    // Calculate the time difference in hours
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffHours = diffTime / (1000 * 60 * 60);
    
    // Create a new dateRange object with appropriate granularity
    const newDateRange = { ...dateRange };
    
    // Only override granularity if not explicitly set by parent
    if (!dateRange.granularity) {
      // For 24-hour range or less, use hourly granularity
      if (diffHours <= 24) {
        newDateRange.granularity = 'hourly';
      } else {
        newDateRange.granularity = 'daily';
      }
    }
    
    setAdjustedDateRange(newDateRange);
  }, [dateRange]);

  // Prepare data for charts and tables
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

  // Format the chart data
  const chartData = useMemo(() => {
    if (!analytics.events_by_date?.length) return [];
    
    return analytics.events_by_date.map((event: MetricPoint) => {
      // Create a filtered object with only the visible metrics
      const filtered: any = {};
      
      if (visibleMetrics.pageviews) filtered.pageviews = event.pageviews;
      if (visibleMetrics.visitors) filtered.visitors = event.visitors;
      if (visibleMetrics.sessions) filtered.sessions = event.sessions;
      if (visibleMetrics.bounce_rate) filtered.bounce_rate = event.bounce_rate;
      
      // Format the date based on granularity
      filtered.date = formatDateByGranularity(event.date, adjustedDateRange.granularity);
      
      return filtered;
    });
  }, [analytics.events_by_date, visibleMetrics, adjustedDateRange.granularity]);

  // Calculate date range duration for warning message
  const dateFrom = useMemo(() => new Date(dateRange.start_date), [dateRange.start_date]);
  const dateTo = useMemo(() => new Date(dateRange.end_date), [dateRange.end_date]);
  const dateDiff = useMemo(() => differenceInDays(dateTo, dateFrom), [dateTo, dateFrom]);

  // Metric toggle colors
  const metricColors = {
    pageviews: 'blue-500',
    visitors: 'emerald-500', 
    sessions: 'yellow-500',
    bounce_rate: 'red-500'
  };

  // Calculate trends based on events_by_date data
  const calculateTrends = useMemo(() => {
    if (!analytics.events_by_date?.length || analytics.events_by_date.length < 2) {
      return {
        visitors: undefined,
        pageviews: undefined,
        bounce_rate: undefined,
        session_duration: undefined
      };
    }

    const events = [...analytics.events_by_date].sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
    
    const totalEvents = events.length;
    
    // If we have enough data, compare the second half with the first half of the period
    if (totalEvents >= 2) {
      const midpoint = Math.floor(totalEvents / 2);
      
      // Calculate sums for the two periods - previous period is first half, current is second half
      const previousPeriod = events.slice(0, midpoint);
      const currentPeriod = events.slice(midpoint);
      
      // Sum total metrics for each period
      const currentVisitors = currentPeriod.reduce((sum, day) => sum + (day.visitors || 0), 0);
      const previousVisitors = previousPeriod.reduce((sum, day) => sum + (day.visitors || 0), 0);
      
      const currentPageviews = currentPeriod.reduce((sum, day) => sum + (day.pageviews || 0), 0);
      const previousPageviews = previousPeriod.reduce((sum, day) => sum + (day.pageviews || 0), 0);
      
      // For bounce rate and session duration, calculate weighted averages
      // Only use entries with non-zero values
      const currentBounceRateEntries = currentPeriod.filter(day => day.bounce_rate !== undefined && day.bounce_rate > 0);
      const previousBounceRateEntries = previousPeriod.filter(day => day.bounce_rate !== undefined && day.bounce_rate > 0);
      
      const currentBounceRate = currentBounceRateEntries.length > 0 
        ? currentBounceRateEntries.reduce((sum, day) => sum + (day.bounce_rate || 0), 0) / currentBounceRateEntries.length 
        : 0;
      
      const previousBounceRate = previousBounceRateEntries.length > 0 
        ? previousBounceRateEntries.reduce((sum, day) => sum + (day.bounce_rate || 0), 0) / previousBounceRateEntries.length 
        : 0;
      
      const currentSessionDurationEntries = currentPeriod.filter(day => day.avg_session_duration !== undefined && day.avg_session_duration > 0);
      const previousSessionDurationEntries = previousPeriod.filter(day => day.avg_session_duration !== undefined && day.avg_session_duration > 0);
      
      const currentSessionDuration = currentSessionDurationEntries.length > 0
        ? currentSessionDurationEntries.reduce((sum, day) => sum + (day.avg_session_duration || 0), 0) / currentSessionDurationEntries.length
        : 0;
      
      const previousSessionDuration = previousSessionDurationEntries.length > 0
        ? previousSessionDurationEntries.reduce((sum, day) => sum + (day.avg_session_duration || 0), 0) / previousSessionDurationEntries.length
        : 0;

      // Round percentages to whole numbers for display
      const roundPercentage = (value: number) => Math.round(value);

      // Prevent impossible percentages
      const validatePercentage = (value: number) => {
        if (value < -100) return -100;
        if (value > 1000) return 1000; // Cap at 1000% to avoid unrealistic numbers
        return value;
      };

      // For bounce rate, lower is better, so invert the trend
      let bounceRateTrend = undefined;
      if (previousBounceRate > 0 && currentBounceRate >= 0) {
        const rawTrend = calculatePercentChange(currentBounceRate, previousBounceRate);
        // Invert the trend since a decrease in bounce rate is positive
        bounceRateTrend = -rawTrend;
      }

      // Only return trends when we have valid data in both periods
      return {
        visitors: previousVisitors > 0 ? roundPercentage(validatePercentage(calculatePercentChange(currentVisitors, previousVisitors))) : undefined,
        pageviews: previousPageviews > 0 ? roundPercentage(validatePercentage(calculatePercentChange(currentPageviews, previousPageviews))) : undefined,
        bounce_rate: bounceRateTrend !== undefined ? roundPercentage(validatePercentage(bounceRateTrend)) : undefined,
        session_duration: previousSessionDuration > 0 ? roundPercentage(validatePercentage(calculatePercentChange(currentSessionDuration, previousSessionDuration))) : undefined
      };
    }
    
    return {
      visitors: undefined,
      pageviews: undefined,
      bounce_rate: undefined,
      session_duration: undefined
    };
  }, [analytics.events_by_date]);

  return (
    <>
      {/* Key metrics */}
      <div className="grid grid-cols-4 gap-1.5">
        <StatCard 
          title="Unique Visitors"
          value={analytics.summary?.unique_visitors || 0}
          icon={Users}
          description={`${analytics.today?.visitors || 0} today`}
          isLoading={loading.summary}
          variant="info"
          trend={calculateTrends.visitors}
          trendLabel={calculateTrends.visitors !== undefined ? "vs previous period" : undefined}
          className={`shadow-sm ${BORDER_RADIUS.card}`}
        />
        <StatCard 
          title="Page Views"
          value={analytics.summary?.pageviews || 0}
          icon={Globe}
          description={`${analytics.today?.pageviews || 0} today`}
          isLoading={loading.summary}
          trend={calculateTrends.pageviews}
          trendLabel={calculateTrends.pageviews !== undefined ? "vs previous period" : undefined}
          className={`shadow-sm ${BORDER_RADIUS.card}`}
        />
        <StatCard 
          title="Bounce Rate"
          value={analytics.summary?.bounce_rate_pct || '0%'}
          icon={MousePointer}
          isLoading={loading.summary}
          trend={calculateTrends.bounce_rate}
          trendLabel={calculateTrends.bounce_rate !== undefined ? "vs previous period" : undefined}
          variant={getColorVariant(analytics.summary?.bounce_rate || 0, 70, 50)}
          invertTrend={true}
          className={`shadow-sm ${BORDER_RADIUS.card}`}
        />
        <StatCard 
          title="Avg. Session"
          value={analytics.summary?.avg_session_duration_formatted || '0s'}
          icon={Clock}
          isLoading={loading.summary}
          trend={calculateTrends.session_duration}
          trendLabel={calculateTrends.session_duration !== undefined ? "vs previous period" : undefined}
          className={`shadow-sm ${BORDER_RADIUS.card}`}
        />
      </div>

      {/* Visitor Trends */}
      <div className="rounded-2xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-start gap-2">
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
          isLoading={loading.summary}
        />
      </div>

      {/* Two column layout for smaller charts and tables */}
      <div className="grid gap-2 grid-cols-2">
        {/* Left column */}
        <div className="space-y-2">
          <div className="rounded-2xl border shadow-sm overflow-hidden">
            <DistributionChart 
              data={deviceData} 
              isLoading={loading.summary}
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
              isLoading={loading.summary}
              limit={5}
            />
          </div>
        </div>
        
        {/* Right column */}
        <div className="space-y-2">
          <div className="rounded-2xl border shadow-sm overflow-hidden">
            <DistributionChart 
              data={browserData} 
              isLoading={loading.summary}
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
              isLoading={loading.summary}
              limit={5}
            />
          </div>
        </div>
      </div>

      {/* Performance Snapshot */}
      {/* <div className="grid grid-cols-4 gap-1.5">
        <StatCard 
          title="Page Load Time"
          value={analytics.performance?.avg_load_time_formatted || '0 ms'}
          icon={Zap}
          isLoading={loading.summary}
          variant={getColorVariant(analytics.performance?.avg_load_time || 0, 3000, 1500)}
          className={`shadow-sm ${BORDER_RADIUS.card}`}
        />
        <StatCard 
          title="Time to First Byte"
          value={analytics.performance?.avg_ttfb_formatted || '0 ms'}
          icon={Zap}
          isLoading={loading.summary}
          className={`shadow-sm ${BORDER_RADIUS.card}`}
        />
        <StatCard 
          title="DOM Ready"
          value={analytics.performance?.avg_dom_ready_time_formatted || '0 ms'}
          icon={Zap}
          isLoading={loading.summary}
          className={`shadow-sm ${BORDER_RADIUS.card}`}
        />
        <StatCard 
          title="Render Time"
          value={analytics.performance?.avg_render_time_formatted || '0 ms'}
          icon={Zap}
          isLoading={loading.summary}
          className={`shadow-sm ${BORDER_RADIUS.card}`}
        />
      </div> */}
    </>
  );
} 