"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Globe,
  Users,
  MousePointer,
  AlertTriangle,
  BarChart,
  Timer,
  LayoutDashboard,
  Zap,
  ChevronDown,
  ChevronRight,
  Info,
  BookOpen,
} from "lucide-react";
import { differenceInDays } from "date-fns";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";

import { StatCard } from "@/components/analytics/stat-card";
import { MetricsChart } from "@/components/charts/metrics-chart";
import { DataTable } from "@/components/analytics/data-table";
import { useDynamicQuery, useBatchDynamicQuery } from "@/hooks/use-dynamic-query";
import {
  formatDateByGranularity,
  getColorVariant,
  calculatePercentChange,
} from "../utils/analytics-helpers";
import { MetricToggles } from "../utils/ui-components";
import type { FullTabProps, MetricPoint } from "../utils/types";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { ReferrerSourceCell, type ReferrerSourceCellData } from "@/components/atomic/ReferrerSourceCell";
import {
  processDeviceData,
  processBrowserData,
  inferOperatingSystems,
  TechnologyIcon,
  PercentageBadge,
} from "../utils/technology-helpers";

// Types
interface TrendCalculation {
  visitors?: number;
  sessions?: number;
  pageviews?: number;
  bounce_rate?: number;
  session_duration?: number;
  pages_per_session?: number;
}

import { useTableTabs } from "@/lib/table-tabs";

interface ChartDataPoint {
  date: string;
  pageviews?: number;
  visitors?: number;
  sessions?: number;
  [key: string]: unknown;
}

const MIN_PREVIOUS_SESSIONS_FOR_TREND = 5;
const MIN_PREVIOUS_VISITORS_FOR_TREND = 5;
const MIN_PREVIOUS_PAGEVIEWS_FOR_TREND = 10;





function UnauthorizedAccessError() {
  const router = useRouter();

  return (
    <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800/50 w-full max-w-lg mx-auto my-8">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-100 dark:bg-red-900/30 rounded-full">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <CardTitle className="text-lg">Access Denied</CardTitle>
            <CardDescription className="mt-1">
              You don't have permission to view this website's analytics.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground mb-5">
          Contact the website owner if you think this is an error.
        </p>
        <Button
          onClick={() => router.push("/websites")}
          className="w-full sm:w-auto"
          variant="destructive"
        >
          Back to Websites
        </Button>
      </CardContent>
    </Card>
  );
}

export function WebsiteOverviewTab({
  websiteId,
  dateRange,
  websiteData,
  isRefreshing,
  setIsRefreshing,
}: FullTabProps) {

  const queries = useMemo(() => [
    {
      id: 'overview-summary',
      parameters: ['summary_metrics', 'today_metrics', 'events_by_date'],
      limit: 100,
      granularity: dateRange.granularity
    },
    {
      id: 'overview-pages',
      parameters: ['top_pages', 'entry_pages', 'exit_pages'],
      limit: 100,
      granularity: dateRange.granularity
    },
    {
      id: 'overview-traffic',
      parameters: ['top_referrers', 'utm_sources', 'utm_mediums', 'utm_campaigns'],
      limit: 100,
      granularity: dateRange.granularity
    },
    {
      id: 'overview-tech',
      parameters: ['device_types', 'browser_versions'],
      limit: 100,
      granularity: dateRange.granularity
    },
    {
      id: 'overview-custom-events',
      parameters: ['custom_events', 'custom_event_details'],
      limit: 100,
      granularity: dateRange.granularity
    }
  ], [dateRange.granularity]);

  // Fetch all overview data in a single batch query
  const {
    results,
    isLoading: batchLoading,
    error: batchError,
    refetch: refetchBatch,
    getDataForQuery
  } = useBatchDynamicQuery(
    websiteId,
    dateRange,
    queries
  );

  // Combine all data into analytics object for backward compatibility
  const analytics = useMemo(() => ({
    summary: getDataForQuery('overview-summary', 'summary_metrics')?.[0] || null,
    today: getDataForQuery('overview-summary', 'today_metrics')?.[0] || null,
    events_by_date: getDataForQuery('overview-summary', 'events_by_date') || [],
    top_pages: getDataForQuery('overview-pages', 'top_pages') || [],
    entry_pages: getDataForQuery('overview-pages', 'entry_pages') || [],
    exit_pages: getDataForQuery('overview-pages', 'exit_pages') || [],
    top_referrers: getDataForQuery('overview-traffic', 'top_referrers') || [],
    utm_sources: getDataForQuery('overview-traffic', 'utm_sources') || [],
    utm_mediums: getDataForQuery('overview-traffic', 'utm_mediums') || [],
    utm_campaigns: getDataForQuery('overview-traffic', 'utm_campaigns') || [],
    device_types: getDataForQuery('overview-tech', 'device_types') || [],
    browser_versions: getDataForQuery('overview-tech', 'browser_versions') || []
  }), [getDataForQuery]);

  // Extract custom events data
  const customEventsData = useMemo(() => ({
    custom_events: getDataForQuery('overview-custom-events', 'custom_events') || [],
    custom_event_details: getDataForQuery('overview-custom-events', 'custom_event_details') || []
  }), [getDataForQuery]);

  const loading = {
    summary: batchLoading || isRefreshing
  };

  const error = batchError;

  const [visibleMetrics, setVisibleMetrics] = useState<Record<string, boolean>>({
    pageviews: true,
    visitors: true,
    sessions: false,
  });

  const toggleMetric = useCallback((metric: string) => {
    setVisibleMetrics(prev => ({ ...prev, [metric]: !prev[metric] }));
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (isRefreshing) {
      const doRefresh = async () => {
        try {
          await refetchBatch();
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
  }, [isRefreshing, refetchBatch, setIsRefreshing]);

  const isLoading = loading.summary || isRefreshing;

  if (error instanceof Error && error.message === 'UNAUTHORIZED_ACCESS') {
    return <UnauthorizedAccessError />;
  }

  const referrerCustomCell = useCallback((info: any) => {
    const cellData: ReferrerSourceCellData = info.row.original;
    return <ReferrerSourceCell {...cellData} />;
  }, []);

  const chartData = useMemo(() => {
    if (!analytics.events_by_date?.length) return [];

    return analytics.events_by_date.map((event: any): ChartDataPoint => {
      const filtered: ChartDataPoint = {
        date: formatDateByGranularity(event.date, dateRange.granularity)
      };

      if (visibleMetrics.pageviews) {
        filtered.pageviews = event.pageviews;
      }

      if (visibleMetrics.visitors) {
        filtered.visitors = event.visitors || event.unique_visitors || 0;
      }

      if (visibleMetrics.sessions) {
        filtered.sessions = event.sessions;
      }

      return filtered;
    });
  }, [analytics.events_by_date, visibleMetrics, dateRange.granularity]);

  const currentTime = useMemo(() => {
    const now = dayjs().utc();
    const dateFrom = dayjs(dateRange.start_date);
    const dateTo = dayjs(dateRange.end_date).endOf('day');

    if (now.isAfter(dateFrom) && now.isBefore(dateTo) && chartData.length > 0) {
      const timeToFormat = dateRange.granularity === 'hourly'
        ? now.startOf('hour').toDate()
        : now.toDate();

      return formatDateByGranularity(timeToFormat, dateRange.granularity);
    }
    return undefined;
  }, [dateRange.granularity, dateRange.start_date, dateRange.end_date]);

  const miniChartData = useMemo(() => {
    if (!analytics.events_by_date?.length) return {};

    const visitors = analytics.events_by_date.map((event: any) => ({
      date: event.date,
      value: event.visitors || 0
    }));

    const sessions = analytics.events_by_date.map((event: any) => ({
      date: event.date,
      value: event.sessions || 0
    }));

    const pageviews = analytics.events_by_date.map((event: any) => ({
      date: event.date,
      value: event.pageviews || 0
    }));

    const pagesPerSession = analytics.events_by_date.map((event: any) => ({
      date: event.date,
      value: event.sessions > 0 ? (event.pageviews || 0) / event.sessions : 0
    }));

    const bounceRate = analytics.events_by_date.map((event: any) => ({
      date: event.date,
      value: event.bounce_rate || 0
    }));

    const sessionDuration = analytics.events_by_date.map((event: any) => ({
      date: event.date,
      value: event.avg_session_duration || 0
    }));

    return {
      visitors,
      sessions,
      pageviews,
      pagesPerSession,
      bounceRate,
      sessionDuration
    };
  }, [analytics.events_by_date]);

  const processedTopPages = useMemo(() => {
    if (!analytics.top_pages?.length) return [];

    const totalPageviews = analytics.top_pages.reduce((sum: number, page: any) => sum + (page.pageviews || 0), 0);

    return analytics.top_pages.map((page: any) => ({
      ...page,
      percentage: totalPageviews > 0 ? Math.round((page.pageviews / totalPageviews) * 100) : 0
    }));
  }, [analytics.top_pages]);

  const processedEntryPages = useMemo(() => {
    if (!analytics.entry_pages?.length) return [];

    return analytics.entry_pages.map((page: any) => ({
      ...page,
      pageviews: page.entries,
      visitors: page.visitors
    }));
  }, [analytics.entry_pages]);

  const processedExitPages = useMemo(() => {
    if (!analytics.exit_pages?.length) return [];

    return analytics.exit_pages.map((page: any) => ({
      ...page,
      pageviews: page.exits,
      visitors: page.visitors || page.sessions // fallback to sessions if visitors not available
    }));
  }, [analytics.exit_pages]);

  const referrerTabs = useTableTabs({
    referrers: {
      data: analytics.top_referrers || [],
      label: 'Referrers',
      primaryField: 'name',
      primaryHeader: 'Source',
      customCell: referrerCustomCell
    },
    utm_sources: {
      data: analytics.utm_sources || [],
      label: 'UTM Sources',
      primaryField: 'name',
      primaryHeader: 'Source'
    },
    utm_mediums: {
      data: analytics.utm_mediums || [],
      label: 'UTM Mediums',
      primaryField: 'name',
      primaryHeader: 'Medium'
    },
    utm_campaigns: {
      data: analytics.utm_campaigns || [],
      label: 'UTM Campaigns',
      primaryField: 'name',
      primaryHeader: 'Campaign'
    }
  });

  const pagesTabs = useTableTabs({
    top_pages: {
      data: processedTopPages,
      label: 'Top Pages',
      primaryField: 'name',
      primaryHeader: 'Page'
    },
    entry_pages: {
      data: processedEntryPages,
      label: 'Entry Pages',
      primaryField: 'name',
      primaryHeader: 'Page'
    },
    exit_pages: {
      data: processedExitPages,
      label: 'Exit Pages',
      primaryField: 'name',
      primaryHeader: 'Page'
    }
  });

  const dateFrom = useMemo(() => new Date(dateRange.start_date), [dateRange.start_date]);
  const dateTo = useMemo(() => new Date(dateRange.end_date), [dateRange.end_date]);
  const dateDiff = useMemo(() => differenceInDays(dateTo, dateFrom), [dateTo, dateFrom]);

  const metricColors = {
    pageviews: 'blue-500',
    visitors: 'green-500',
    sessions: 'purple-500'
  };

  const calculateTrends = useMemo<TrendCalculation>(() => {
    if (!analytics.events_by_date?.length || analytics.events_by_date.length < 2) {
      return {};
    }

    const events = [...analytics.events_by_date].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const midpoint = Math.floor(events.length / 2);
    const previousPeriodData = events.slice(0, midpoint);
    const currentPeriodData = events.slice(midpoint);

    if (previousPeriodData.length === 0 || currentPeriodData.length === 0) {
      return {};
    }

    const sumCountMetric = (period: MetricPoint[], field: keyof Pick<MetricPoint, 'pageviews' | 'visitors' | 'sessions'>) =>
      period.reduce((acc, item) => acc + (Number(item[field]) || 0), 0);

    const currentSumVisitors = sumCountMetric(currentPeriodData, 'visitors');
    const currentSumSessions = sumCountMetric(currentPeriodData, 'sessions');
    const currentSumPageviews = sumCountMetric(currentPeriodData, 'pageviews');
    const currentPagesPerSession = currentSumSessions > 0 ? currentSumPageviews / currentSumSessions : 0;

    const previousSumVisitors = sumCountMetric(previousPeriodData, 'visitors');
    const previousSumSessions = sumCountMetric(previousPeriodData, 'sessions');
    const previousSumPageviews = sumCountMetric(previousPeriodData, 'pageviews');
    const previousPagesPerSession = previousSumSessions > 0 ? previousSumPageviews / previousSumSessions : 0;

    const averageRateMetric = (period: MetricPoint[], field: keyof Pick<MetricPoint, 'bounce_rate' | 'avg_session_duration'>) => {
      const validEntries = period.map(item => Number(item[field])).filter(value => !Number.isNaN(value) && value > 0);
      if (validEntries.length === 0) return 0;
      return validEntries.reduce((acc, value) => acc + value, 0) / validEntries.length;
    };

    const currentBounceRateAvg = averageRateMetric(currentPeriodData, 'bounce_rate');
    const previousBounceRateAvg = averageRateMetric(previousPeriodData, 'bounce_rate');
    const currentSessionDurationAvg = averageRateMetric(currentPeriodData, 'avg_session_duration');
    const previousSessionDurationAvg = averageRateMetric(previousPeriodData, 'avg_session_duration');

    const calculateTrendPercentage = (current: number, previous: number, minimumBase = 0) => {
      if (previous < minimumBase && !(previous === 0 && current === 0)) {
        return undefined;
      }
      if (previous === 0) {
        return current === 0 ? 0 : undefined;
      }
      const change = calculatePercentChange(current, previous);
      return Math.max(-100, Math.min(1000, Math.round(change)));
    };

    const canShowSessionBasedTrend = previousSumSessions >= MIN_PREVIOUS_SESSIONS_FOR_TREND;

    return {
      visitors: calculateTrendPercentage(currentSumVisitors, previousSumVisitors, MIN_PREVIOUS_VISITORS_FOR_TREND),
      sessions: calculateTrendPercentage(currentSumSessions, previousSumSessions, MIN_PREVIOUS_SESSIONS_FOR_TREND),
      pageviews: calculateTrendPercentage(currentSumPageviews, previousSumPageviews, MIN_PREVIOUS_PAGEVIEWS_FOR_TREND),
      pages_per_session: canShowSessionBasedTrend
        ? calculateTrendPercentage(currentPagesPerSession, previousPagesPerSession)
        : undefined,
      bounce_rate: canShowSessionBasedTrend
        ? calculateTrendPercentage(currentBounceRateAvg, previousBounceRateAvg)
        : undefined,
      session_duration: canShowSessionBasedTrend
        ? calculateTrendPercentage(currentSessionDurationAvg, previousSessionDurationAvg)
        : undefined,
    };
  }, [analytics.events_by_date]);

  const processedDeviceData = useMemo(() => {
    const deviceData = analytics.device_types || [];
    // Transform data to match expected structure
    const transformedData = deviceData.map((item: any) => ({
      device_type: item.name,
      visitors: item.visitors,
      pageviews: item.pageviews
    }));
    return processDeviceData(transformedData);
  }, [analytics.device_types]);

  const processedBrowserData = useMemo(() => {
    const browserData = analytics.browser_versions || [];
    // Transform data to match expected structure
    const transformedData = browserData.map((item: any) => ({
      browser: item.name,
      visitors: item.visitors,
      pageviews: item.pageviews
    }));
    return processBrowserData(transformedData);
  }, [analytics.browser_versions]);

  const processedOSData = useMemo(() => {
    const deviceData = analytics.device_types || [];
    const browserData = analytics.browser_versions || [];
    // Transform data to match expected structure
    const transformedDeviceData = deviceData.map((item: any) => ({
      device_type: item.name,
      visitors: item.visitors,
      pageviews: item.pageviews
    }));
    const transformedBrowserData = browserData.map((item: any) => ({
      browser: item.name,
      visitors: item.visitors,
      pageviews: item.pageviews
    }));
    return inferOperatingSystems(transformedDeviceData, transformedBrowserData);
  }, [analytics.device_types, analytics.browser_versions]);

  const [expandedProperties, setExpandedProperties] = useState<Set<string>>(new Set());

  const togglePropertyExpansion = (propertyId: string) => {
    const newExpanded = new Set(expandedProperties);
    if (newExpanded.has(propertyId)) {
      newExpanded.delete(propertyId);
    } else {
      newExpanded.add(propertyId);
    }
    setExpandedProperties(newExpanded);
  };

  const processedCustomEventsData = useMemo(() => {

    if (!customEventsData?.custom_events?.length) {
      return [];
    }

    const customEvents = customEventsData.custom_events;
    const eventDetails = customEventsData.custom_event_details || [];

    const totalEvents = customEvents.reduce((sum: number, event: any) => sum + (event.total_events || 0), 0);

    return customEvents.map((event: any) => {
      // Find all detail records for this event
      const eventDetailRecords = eventDetails.filter((detail: any) => detail.event_name === event.name);

      // Group property values by key
      const propertyBreakdown: Record<string, Record<string, number>> = {};

      eventDetailRecords.forEach((record: any) => {
        if (record.properties && typeof record.properties === 'object') {
          Object.entries(record.properties).forEach(([key, value]) => {
            if (key && value !== null && value !== undefined) {
              if (!propertyBreakdown[key]) propertyBreakdown[key] = {};
              const stringValue = String(value);
              propertyBreakdown[key][stringValue] = (propertyBreakdown[key][stringValue] || 0) + 1;
            }
          });
        }
      });

      // Create property categories for sub-rows
      const propertyCategories = Object.entries(propertyBreakdown).map(([propertyKey, values]) => {
        const propertyTotal = Object.values(values).reduce((sum, count) => sum + count, 0);

        const propertyValues = Object.entries(values).map(([propertyValue, count]) => ({
          value: propertyValue,
          count,
          percentage: propertyTotal > 0 ? Math.round((count / propertyTotal) * 100) : 0
        })).sort((a, b) => b.count - a.count);

        return {
          key: propertyKey,
          total: propertyTotal,
          values: propertyValues
        };
      }).sort((a, b) => b.total - a.total);

      return {
        ...event,
        percentage: totalEvents > 0 ? Math.round((event.total_events / totalEvents) * 100) : 0,
        last_occurrence_formatted: event.last_occurrence ?
          new Date(event.last_occurrence).toLocaleDateString() : 'N/A',
        first_occurrence_formatted: event.first_occurrence ?
          new Date(event.first_occurrence).toLocaleDateString() : 'N/A',
        propertyCategories: propertyCategories
      };
    });
  }, [customEventsData]);

  const deviceColumns = useMemo(() => [
    {
      id: 'name',
      accessorKey: 'name',
      header: 'Device Type',
      cell: (info: any) => {
        const entry = info.row.original;
        return (
          <div className="flex items-center gap-3">
            <TechnologyIcon entry={entry} size="md" />
            <span className="font-medium">{entry.name}</span>
          </div>
        );
      }
    },
    {
      id: 'visitors',
      accessorKey: 'visitors',
      header: 'Visitors',
    },
    {
      id: 'percentage',
      accessorKey: 'percentage',
      header: 'Share',
      cell: (info: any) => {
        const percentage = info.getValue() as number;
        return <PercentageBadge percentage={percentage} />;
      },
    },
  ], []);

  const browserColumns = useMemo(() => [
    {
      id: 'name',
      accessorKey: 'name',
      header: 'Browser',
      cell: (info: any) => {
        const entry = info.row.original;
        return (
          <div className="flex items-center gap-3">
            <TechnologyIcon entry={entry} size="md" />
            <span className="font-medium">{entry.name}</span>
          </div>
        );
      }
    },
    {
      id: 'visitors',
      accessorKey: 'visitors',
      header: 'Visitors',
    },
    {
      id: 'percentage',
      accessorKey: 'percentage',
      header: 'Share',
      cell: (info: any) => {
        const percentage = info.getValue() as number;
        return <PercentageBadge percentage={percentage} />;
      },
    },
  ], []);

  const osColumns = useMemo(() => [
    {
      id: 'name',
      accessorKey: 'name',
      header: 'Operating System',
      cell: (info: any) => {
        const entry = info.row.original;
        return (
          <div className="flex items-center gap-3">
            <TechnologyIcon entry={entry} size="md" />
            <span className="font-medium">{entry.name}</span>
          </div>
        );
      }
    },
    {
      id: 'visitors',
      accessorKey: 'visitors',
      header: 'Visitors',
    },
    {
      id: 'percentage',
      accessorKey: 'percentage',
      header: 'Share',
      cell: (info: any) => {
        const percentage = info.getValue() as number;
        return <PercentageBadge percentage={percentage} />;
      },
    },
  ], []);

  const customEventsColumns = useMemo(() => [
    {
      id: 'name',
      accessorKey: 'name',
      header: 'Event Name',
      cell: (info: any) => {
        const eventName = info.getValue() as string;
        return (
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
            <span className="font-medium text-foreground">{eventName}</span>
          </div>
        );
      }
    },
    {
      id: 'total_events',
      accessorKey: 'total_events',
      header: 'Events',
      cell: (info: any) => (
        <div>
          <div className="font-medium text-foreground">{info.getValue()?.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">total</div>
        </div>
      )
    },
    {
      id: 'unique_users',
      accessorKey: 'unique_users',
      header: 'Users',
      cell: (info: any) => (
        <div>
          <div className="font-medium text-foreground">{info.getValue()?.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">unique</div>
        </div>
      )
    },
    {
      id: 'percentage',
      accessorKey: 'percentage',
      header: 'Share',
      cell: (info: any) => {
        const percentage = info.getValue() as number;
        return <PercentageBadge percentage={percentage} />;
      }
    },
  ], []);

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <StatCard
          title="UNIQUE VISITORS"
          value={analytics.summary?.unique_visitors || 0}
          icon={Users}
          description={`${analytics.today?.visitors || 0} today`}
          isLoading={isLoading}
          variant="default"
          trend={calculateTrends.visitors}
          trendLabel={calculateTrends.visitors !== undefined ? "vs previous period" : undefined}
          className="h-full"
          chartData={miniChartData.visitors}
          showChart={true}
          id="visitors-chart"
        />
        <StatCard
          title="SESSIONS"
          value={analytics.summary?.sessions || 0}
          icon={BarChart}
          description={`${analytics.today?.sessions || 0} today`}
          isLoading={isLoading}
          variant="default"
          trend={calculateTrends.sessions}
          trendLabel={calculateTrends.sessions !== undefined ? "vs previous period" : undefined}
          className="h-full"
          chartData={miniChartData.sessions}
          showChart={true}
          id="sessions-chart"
        />
        <StatCard
          title="PAGEVIEWS"
          value={analytics.summary?.pageviews || 0}
          icon={Globe}
          description={`${analytics.today?.pageviews || 0} today`}
          isLoading={isLoading}
          variant="default"
          trend={calculateTrends.pageviews}
          trendLabel={calculateTrends.pageviews !== undefined ? "vs previous period" : undefined}
          className="h-full"
          chartData={miniChartData.pageviews}
          showChart={true}
          id="pageviews-chart"
        />
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
          className="h-full"
          chartData={miniChartData.pagesPerSession}
          showChart={true}
          id="pages-per-session-chart"
        />
        <StatCard
          title="BOUNCE RATE"
          value={analytics.summary?.bounce_rate_pct || '0%'}
          icon={MousePointer}
          isLoading={isLoading}
          trend={calculateTrends.bounce_rate}
          trendLabel={calculateTrends.bounce_rate !== undefined ? "vs previous period" : undefined}
          variant={getColorVariant(analytics.summary?.bounce_rate || 0, 70, 50)}
          invertTrend={true}
          className="h-full"
          chartData={miniChartData.bounceRate}
          showChart={true}
          id="bounce-rate-chart"
        />
        <StatCard
          title="SESSION DURATION"
          value={analytics.summary?.avg_session_duration_formatted || '0s'}
          icon={Timer}
          isLoading={isLoading}
          variant="default"
          trend={calculateTrends.session_duration}
          trendLabel={calculateTrends.session_duration !== undefined ? "vs previous period" : undefined}
          className="h-full"
          chartData={miniChartData.sessionDuration}
          showChart={true}
          id="session-duration-chart"
        />
      </div>

      {/* Chart */}
      <div className="rounded border shadow-sm">
        <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-start gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Traffic Trends</h2>
            <p className="text-sm text-muted-foreground">
              {dateRange.granularity === 'hourly' ? 'Hourly' : 'Daily'} traffic data
            </p>
            {dateRange.granularity === 'hourly' && dateDiff > 7 && (
              <div className="mt-1 flex items-center text-amber-600 gap-1 text-xs">
                <AlertTriangle className="h-3 w-3" />
                <span>Large date ranges may affect performance</span>
              </div>
            )}
          </div>

          <MetricToggles
            metrics={visibleMetrics}
            onToggle={toggleMetric}
            colors={metricColors}
          />
        </div>
        <div>
          <MetricsChart
            data={chartData}
            isLoading={isLoading}
            height={350}
            currentTime={currentTime}
          />
        </div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DataTable
          tabs={referrerTabs}
          title="Traffic Sources"
          description="Referrers and campaign data"
          isLoading={isLoading}
          initialPageSize={7}
          minHeight={230}
        />

        <DataTable
          tabs={pagesTabs}
          title="Pages"
          description="Top pages and entry/exit points"
          isLoading={isLoading}
          initialPageSize={7}
          minHeight={230}
        />
      </div>

      {/* Custom Events Table */}
      <DataTable
        data={processedCustomEventsData}
        columns={customEventsColumns}
        title="Custom Events"
        description="User-defined events and interactions with property breakdowns"
        isLoading={isLoading}
        initialPageSize={8}
        minHeight={200}
        emptyMessage="No custom events tracked yet"
        expandable={true}
        getSubRows={(row: any) => row.propertyCategories}
        renderSubRow={(subRow: any, parentRow: any, index: number) => {
          const propertyKey = subRow.key;
          const propertyTotal = subRow.total;
          const propertyValues = subRow.values;
          const propertyId = `${parentRow.name}-${propertyKey}`;
          const isPropertyExpanded = expandedProperties.has(propertyId);

          return (
            <div className="ml-4">
              {/* Property Category Row - Clickable */}
              <button
                onClick={() => togglePropertyExpansion(propertyId)}
                className="w-full flex items-center justify-between py-2 px-3 bg-muted/20 hover:bg-muted/40 transition-colors duration-200 rounded border border-border/30"
              >
                <div className="flex items-center gap-2">
                  {isPropertyExpanded ? (
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium text-foreground">{propertyKey}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium text-foreground">
                    {propertyTotal.toLocaleString()}
                  </div>
                  <div className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">
                    {propertyValues.length} {propertyValues.length === 1 ? 'value' : 'values'}
                  </div>
                </div>
              </button>

              {/* Property Values - Collapsible */}
              {isPropertyExpanded && (
                <div className="mt-1 max-h-48 overflow-y-auto border border-border/20 rounded">
                  {propertyValues.map((valueItem: any, valueIndex: number) => (
                    <div
                      key={`${propertyKey}-${valueItem.value}-${valueIndex}`}
                      className="flex items-center justify-between py-2 px-3 hover:bg-muted/20 transition-colors duration-150 border-b border-border/10 last:border-b-0"
                    >
                      <span className="text-sm text-foreground truncate font-mono" title={valueItem.value}>
                        {valueItem.value}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {valueItem.count.toLocaleString()}
                        </span>
                        <div className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded font-medium min-w-[2.5rem] text-center">
                          {valueItem.percentage}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        }}
      />

      {/* Technology */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <DataTable
          data={processedDeviceData}
          columns={deviceColumns}
          title="Devices"
          description="Device breakdown"
          isLoading={isLoading}
          initialPageSize={8}
          minHeight={200}
          showSearch={false}
        />

        <DataTable
          data={processedBrowserData}
          columns={browserColumns}
          title="Browsers"
          description="Browser breakdown"
          isLoading={isLoading}
          initialPageSize={8}
          minHeight={200}
          showSearch={false}
        />

        <DataTable
          data={processedOSData}
          columns={osColumns}
          title="Operating Systems"
          description="OS breakdown"
          isLoading={isLoading}
          initialPageSize={8}
          minHeight={200}
          showSearch={false}
        />
      </div>
    </div>
  );
} 