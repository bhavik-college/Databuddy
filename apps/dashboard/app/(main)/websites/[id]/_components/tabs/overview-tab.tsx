"use client";

import {
  CaretDownIcon,
  CaretRightIcon,
  ChartLineIcon,
  CursorIcon,
  GlobeIcon,
  LayoutIcon,
  TimerIcon,
  UsersIcon,
  WarningIcon,
} from "@phosphor-icons/react";
import { differenceInDays } from "date-fns";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/analytics/data-table";
import { StatCard } from "@/components/analytics/stat-card";
import {
  ReferrerSourceCell,
  type ReferrerSourceCellData,
} from "@/components/atomic/ReferrerSourceCell";
import { MetricsChart } from "@/components/charts/metrics-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useBatchDynamicQuery, useDynamicQuery, useRealTimeStats } from "@/hooks/use-dynamic-query";
import {
  calculatePercentChange,
  formatDateByGranularity,
  getColorVariant,
} from "../utils/analytics-helpers";
import {
  inferOperatingSystems,
  PercentageBadge,
  processBrowserData,
  processDeviceData,
  TechnologyIcon,
} from "../utils/technology-helpers";
import type { FullTabProps, MetricPoint } from "../utils/types";
import { MetricToggles } from "../utils/ui-components";

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

function LiveUserIndicator({ websiteId }: { websiteId: string }) {
  const { activeUsers: count } = useRealTimeStats(websiteId);
  const [prevCount, setPrevCount] = useState(count);
  const [change, setChange] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    if (count > prevCount) {
      setChange("up");
    } else if (count < prevCount) {
      setChange("down");
    }
    const timer = setTimeout(() => setChange(null), 1000);
    setPrevCount(count);
    return () => clearTimeout(timer);
  }, [count, prevCount]);

  if (count <= 0) {
    return null;
  }

  const getChangeColor = () => {
    if (change === "up") return "text-green-500";
    if (change === "down") return "text-red-500";
    return "text-foreground";
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2.5 rounded border bg-card px-3.5 py-2 font-medium text-sm shadow-sm">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
        </span>
        <span className={getChangeColor()}>
          {count} {count === 1 ? "user" : "users"} live
        </span>
      </div>
    </div>
  );
}

function UnauthorizedAccessError() {
  const router = useRouter();

  return (
    <Card className="mx-auto my-8 w-full max-w-lg border-red-200 bg-red-50 dark:border-red-800/50 dark:bg-red-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-red-100 p-2.5 dark:bg-red-900/30">
            <WarningIcon
              className="h-6 w-6 text-red-600 dark:text-red-400"
              size={24}
              weight="fill"
            />
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
        <p className="mb-5 text-muted-foreground text-sm">
          Contact the website owner if you think this is an error.
        </p>
        <Button
          className="w-full sm:w-auto"
          onClick={() => router.push("/websites")}
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
  const queries = useMemo(
    () => [
      {
        id: "overview-summary",
        parameters: ["summary_metrics", "today_metrics", "events_by_date"],
        limit: 100,
        granularity: dateRange.granularity,
      },
      {
        id: "overview-pages",
        parameters: ["top_pages", "entry_pages", "exit_pages"],
        limit: 100,
        granularity: dateRange.granularity,
      },
      {
        id: "overview-traffic",
        parameters: ["top_referrers", "utm_sources", "utm_mediums", "utm_campaigns"],
        limit: 100,
        granularity: dateRange.granularity,
      },
      {
        id: "overview-tech",
        parameters: ["device_types", "browsers"],
        limit: 100,
        granularity: dateRange.granularity,
      },
      {
        id: "overview-custom-events",
        parameters: ["custom_events", "custom_event_details"],
        limit: 100,
        granularity: dateRange.granularity,
      },
    ],
    [dateRange.granularity]
  );

  // Fetch all overview data in a single batch query
  const {
    results,
    isLoading: batchLoading,
    error: batchError,
    refetch: refetchBatch,
    getDataForQuery,
  } = useBatchDynamicQuery(websiteId, dateRange, queries);

  // Combine all data into analytics object for backward compatibility
  const analytics = useMemo(
    () => ({
      summary: getDataForQuery("overview-summary", "summary_metrics")?.[0] || null,
      today: getDataForQuery("overview-summary", "today_metrics")?.[0] || null,
      events_by_date: getDataForQuery("overview-summary", "events_by_date") || [],
      top_pages: getDataForQuery("overview-pages", "top_pages") || [],
      entry_pages: getDataForQuery("overview-pages", "entry_pages") || [],
      exit_pages: getDataForQuery("overview-pages", "exit_pages") || [],
      top_referrers: getDataForQuery("overview-traffic", "top_referrers") || [],
      utm_sources: getDataForQuery("overview-traffic", "utm_sources") || [],
      utm_mediums: getDataForQuery("overview-traffic", "utm_mediums") || [],
      utm_campaigns: getDataForQuery("overview-traffic", "utm_campaigns") || [],
      device_types: getDataForQuery("overview-tech", "device_types") || [],
      browser_versions: getDataForQuery("overview-tech", "browsers") || [],
    }),
    [getDataForQuery]
  );

  // Extract custom events data
  const customEventsData = useMemo(
    () => ({
      custom_events: getDataForQuery("overview-custom-events", "custom_events") || [],
      custom_event_details: getDataForQuery("overview-custom-events", "custom_event_details") || [],
    }),
    [getDataForQuery]
  );

  const loading = {
    summary: batchLoading || isRefreshing,
  };

  const error = batchError;

  const [visibleMetrics, setVisibleMetrics] = useState<Record<string, boolean>>({
    pageviews: true,
    visitors: true,
    sessions: false,
  });

  const toggleMetric = useCallback((metric: string) => {
    setVisibleMetrics((prev) => ({ ...prev, [metric]: !prev[metric] }));
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

  if (error instanceof Error && error.message === "UNAUTHORIZED_ACCESS") {
    return <UnauthorizedAccessError />;
  }

  const referrerCustomCell = useCallback((info: any) => {
    const cellData: ReferrerSourceCellData = info.row.original;
    return <ReferrerSourceCell {...cellData} />;
  }, []);

  const chartData = useMemo(() => {
    if (!analytics.events_by_date?.length) return [];

    const now = dayjs().utc();
    const endOfToday = dayjs().utc().endOf('day');

    return analytics.events_by_date
      .filter((event: any) => {
        const eventDate = dayjs(event.date);
        // Only include dates that are in the past or today, never future dates
        return eventDate.isBefore(endOfToday) || eventDate.isSame(endOfToday, 'day');
      })
      .map((event: any): ChartDataPoint => {
        const filtered: ChartDataPoint = {
          date: formatDateByGranularity(event.date, dateRange.granularity),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analytics.events_by_date, visibleMetrics, dateRange.granularity]);

  const miniChartData = useMemo(() => {
    if (!analytics.events_by_date?.length) return {};

    const now = dayjs().utc();
    const endOfToday = dayjs().utc().endOf('day');

    // Filter out future data points, same as main chart
    const filteredEvents = analytics.events_by_date.filter((event: any) => {
      const eventDate = dayjs(event.date);
      // Only include dates that are in the past or today, never future dates
      return eventDate.isBefore(endOfToday) || eventDate.isSame(endOfToday, 'day');
    });

    const visitors = filteredEvents.map((event: any) => ({
      date: event.date,
      value: event.visitors || 0,
    }));

    const sessions = filteredEvents.map((event: any) => ({
      date: event.date,
      value: event.sessions || 0,
    }));

    const pageviews = filteredEvents.map((event: any) => ({
      date: event.date,
      value: event.pageviews || 0,
    }));

    const pagesPerSession = filteredEvents.map((event: any) => ({
      date: event.date,
      value: event.sessions > 0 ? (event.pageviews || 0) / event.sessions : 0,
    }));

    const bounceRate = filteredEvents.map((event: any) => ({
      date: event.date,
      value: event.bounce_rate || 0,
    }));

    const sessionDuration = filteredEvents.map((event: any) => ({
      date: event.date,
      value: event.avg_session_duration || 0,
    }));

    return {
      visitors,
      sessions,
      pageviews,
      pagesPerSession,
      bounceRate,
      sessionDuration,
    };
  }, [analytics.events_by_date]);

  const processedTopPages = useMemo(() => {
    if (!analytics.top_pages?.length) return [];

    const totalPageviews = analytics.top_pages.reduce(
      (sum: number, page: any) => sum + (page.pageviews || 0),
      0
    );

    return analytics.top_pages.map((page: any) => ({
      ...page,
      percentage: totalPageviews > 0 ? Math.round((page.pageviews / totalPageviews) * 100) : 0,
    }));
  }, [analytics.top_pages]);

  const processedEntryPages = useMemo(() => {
    if (!analytics.entry_pages?.length) return [];

    return analytics.entry_pages.map((page: any) => ({
      ...page,
      pageviews: page.entries,
      visitors: page.visitors,
    }));
  }, [analytics.entry_pages]);

  const processedExitPages = useMemo(() => {
    if (!analytics.exit_pages?.length) return [];

    return analytics.exit_pages.map((page: any) => ({
      ...page,
      pageviews: page.exits,
      visitors: page.visitors || page.sessions, // fallback to sessions if visitors not available
    }));
  }, [analytics.exit_pages]);

  const referrerTabs = useTableTabs({
    referrers: {
      data: analytics.top_referrers || [],
      label: "Referrers",
      primaryField: "name",
      primaryHeader: "Source",
      customCell: referrerCustomCell,
    },
    utm_sources: {
      data: analytics.utm_sources || [],
      label: "UTM Sources",
      primaryField: "name",
      primaryHeader: "Source",
    },
    utm_mediums: {
      data: analytics.utm_mediums || [],
      label: "UTM Mediums",
      primaryField: "name",
      primaryHeader: "Medium",
    },
    utm_campaigns: {
      data: analytics.utm_campaigns || [],
      label: "UTM Campaigns",
      primaryField: "name",
      primaryHeader: "Campaign",
    },
  });

  const pagesTabs = useTableTabs({
    top_pages: {
      data: processedTopPages,
      label: "Top Pages",
      primaryField: "name",
      primaryHeader: "Page",
    },
    entry_pages: {
      data: processedEntryPages,
      label: "Entry Pages",
      primaryField: "name",
      primaryHeader: "Page",
    },
    exit_pages: {
      data: processedExitPages,
      label: "Exit Pages",
      primaryField: "name",
      primaryHeader: "Page",
    },
  });

  const dateFrom = useMemo(() => new Date(dateRange.start_date), [dateRange.start_date]);
  const dateTo = useMemo(() => new Date(dateRange.end_date), [dateRange.end_date]);
  const dateDiff = useMemo(() => differenceInDays(dateTo, dateFrom), [dateTo, dateFrom]);

  const metricColors = {
    pageviews: "blue-500",
    visitors: "green-500",
    sessions: "purple-500",
  };

  const calculateTrends = useMemo(() => {
    if (!analytics.events_by_date?.length || analytics.events_by_date.length < 2) {
      return {};
    }

    const events = [...analytics.events_by_date].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const midpoint = Math.floor(events.length / 2);
    const previousPeriodData = events.slice(0, midpoint);
    const currentPeriodData = events.slice(midpoint);

    if (previousPeriodData.length === 0 || currentPeriodData.length === 0) {
      return {};
    }

    const sumCountMetric = (
      period: MetricPoint[],
      field: keyof Pick<MetricPoint, "pageviews" | "visitors" | "sessions">
    ) => period.reduce((acc, item) => acc + (Number(item[field]) || 0), 0);

    const currentSumVisitors = sumCountMetric(currentPeriodData, "visitors");
    const currentSumSessions = sumCountMetric(currentPeriodData, "sessions");
    const currentSumPageviews = sumCountMetric(currentPeriodData, "pageviews");
    const currentPagesPerSession =
      currentSumSessions > 0 ? currentSumPageviews / currentSumSessions : 0;

    const previousSumVisitors = sumCountMetric(previousPeriodData, "visitors");
    const previousSumSessions = sumCountMetric(previousPeriodData, "sessions");
    const previousSumPageviews = sumCountMetric(previousPeriodData, "pageviews");
    const previousPagesPerSession =
      previousSumSessions > 0 ? previousSumPageviews / previousSumSessions : 0;

    const averageRateMetric = (
      period: MetricPoint[],
      field: keyof Pick<MetricPoint, "bounce_rate" | "avg_session_duration">
    ) => {
      const validEntries = period
        .map((item) => Number(item[field]))
        .filter((value) => !Number.isNaN(value) && value > 0);
      if (validEntries.length === 0) return 0;
      return validEntries.reduce((acc, value) => acc + value, 0) / validEntries.length;
    };

    const currentBounceRateAvg = averageRateMetric(currentPeriodData, "bounce_rate");
    const previousBounceRateAvg = averageRateMetric(previousPeriodData, "bounce_rate");
    const currentSessionDurationAvg = averageRateMetric(currentPeriodData, "avg_session_duration");
    const previousSessionDurationAvg = averageRateMetric(
      previousPeriodData,
      "avg_session_duration"
    );

    const calculateTrendPercentage = (current: number, previous: number, minimumBase = 0) => {
      if (previous < minimumBase && !(previous === 0 && current === 0)) {
        return;
      }
      if (previous === 0) {
        return current === 0 ? 0 : undefined;
      }
      const change = calculatePercentChange(current, previous);
      return Math.max(-100, Math.min(1000, Math.round(change)));
    };

    const canShowSessionBasedTrend = previousSumSessions >= MIN_PREVIOUS_SESSIONS_FOR_TREND;

    // Get period start and end dates
    const previousPeriodStart = previousPeriodData[0]?.date;
    const previousPeriodEnd = previousPeriodData[previousPeriodData.length - 1]?.date;
    const currentPeriodStart = currentPeriodData[0]?.date;
    const currentPeriodEnd = currentPeriodData[currentPeriodData.length - 1]?.date;

    const createDetailedTrend = (current: number, previous: number, minimumBase = 0) => {
      const change = calculateTrendPercentage(current, previous, minimumBase);
      if (change === undefined) return change;

      return {
        change,
        current,
        previous,
        currentPeriod: { start: currentPeriodStart, end: currentPeriodEnd },
        previousPeriod: { start: previousPeriodStart, end: previousPeriodEnd },
      };
    };

    return {
      visitors: createDetailedTrend(
        currentSumVisitors,
        previousSumVisitors,
        MIN_PREVIOUS_VISITORS_FOR_TREND
      ),
      sessions: createDetailedTrend(
        currentSumSessions,
        previousSumSessions,
        MIN_PREVIOUS_SESSIONS_FOR_TREND
      ),
      pageviews: createDetailedTrend(
        currentSumPageviews,
        previousSumPageviews,
        MIN_PREVIOUS_PAGEVIEWS_FOR_TREND
      ),
      pages_per_session: canShowSessionBasedTrend
        ? createDetailedTrend(currentPagesPerSession, previousPagesPerSession)
        : undefined,
      bounce_rate: canShowSessionBasedTrend
        ? createDetailedTrend(currentBounceRateAvg, previousBounceRateAvg)
        : undefined,
      session_duration: canShowSessionBasedTrend
        ? createDetailedTrend(currentSessionDurationAvg, previousSessionDurationAvg)
        : undefined,
    };
  }, [analytics.events_by_date]);

  const processedDeviceData = useMemo(() => {
    const deviceData = analytics.device_types || [];
    // Transform data to match expected structure
    const transformedData = deviceData.map((item: any) => ({
      device_type: item.name,
      visitors: item.visitors,
      pageviews: item.pageviews,
    }));
    return processDeviceData(transformedData);
  }, [analytics.device_types]);

  const processedBrowserData = useMemo(() => {
    const browserData = analytics.browser_versions || [];
    // Transform data to match expected structure
    const transformedData = browserData.map((item: any) => ({
      browser: item.name,
      visitors: item.visitors,
      pageviews: item.pageviews,
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
      pageviews: item.pageviews,
    }));
    const transformedBrowserData = browserData.map((item: any) => ({
      browser: item.name,
      visitors: item.visitors,
      pageviews: item.pageviews,
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

    const totalEvents = customEvents.reduce(
      (sum: number, event: any) => sum + (event.total_events || 0),
      0
    );

    return customEvents.map((event: any) => {
      // Find all detail records for this event
      const eventDetailRecords = eventDetails.filter(
        (detail: any) => detail.event_name === event.name
      );

      // Group property values by key
      const propertyBreakdown: Record<string, Record<string, number>> = {};

      for (const record of eventDetailRecords) {
        if (record.properties && typeof record.properties === "object") {
          for (const [key, value] of Object.entries(record.properties)) {
            if (key && value !== null && value !== undefined) {
              if (!propertyBreakdown[key]) propertyBreakdown[key] = {};
              const stringValue = String(value);
              propertyBreakdown[key][stringValue] = (propertyBreakdown[key][stringValue] || 0) + 1;
            }
          }
        }
      }

      // Create property categories for sub-rows
      const propertyCategories = Object.entries(propertyBreakdown)
        .map(([propertyKey, values]) => {
          const propertyTotal = Object.values(values).reduce((sum, count) => sum + count, 0);

          const propertyValues = Object.entries(values)
            .map(([propertyValue, count]) => ({
              value: propertyValue,
              count,
              percentage: propertyTotal > 0 ? Math.round((count / propertyTotal) * 100) : 0,
            }))
            .sort((a, b) => b.count - a.count);

          return {
            key: propertyKey,
            total: propertyTotal,
            values: propertyValues,
          };
        })
        .sort((a, b) => b.total - a.total);

      return {
        ...event,
        percentage: totalEvents > 0 ? Math.round((event.total_events / totalEvents) * 100) : 0,
        last_occurrence_formatted: event.last_occurrence
          ? new Date(event.last_occurrence).toLocaleDateString()
          : "N/A",
        first_occurrence_formatted: event.first_occurrence
          ? new Date(event.first_occurrence).toLocaleDateString()
          : "N/A",
        propertyCategories,
      };
    });
  }, [customEventsData]);

  const deviceColumns = useMemo(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: "Device Type",
        cell: (info: any) => {
          const entry = info.row.original;
          return (
            <div className="flex items-center gap-3">
              <TechnologyIcon entry={entry} size="md" />
              <span className="font-medium">{entry.name}</span>
            </div>
          );
        },
      },
      {
        id: "visitors",
        accessorKey: "visitors",
        header: "Visitors",
      },
      {
        id: "percentage",
        accessorKey: "percentage",
        header: "Share",
        cell: (info: any) => {
          const percentage = info.getValue() as number;
          return <PercentageBadge percentage={percentage} />;
        },
      },
    ],
    []
  );

  const browserColumns = useMemo(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: "Browser",
        cell: (info: any) => {
          const entry = info.row.original;
          return (
            <div className="flex items-center gap-3">
              <TechnologyIcon entry={entry} size="md" />
              <span className="font-medium">{entry.name}</span>
            </div>
          );
        },
      },
      {
        id: "visitors",
        accessorKey: "visitors",
        header: "Visitors",
      },
      {
        id: "percentage",
        accessorKey: "percentage",
        header: "Share",
        cell: (info: any) => {
          const percentage = info.getValue() as number;
          return <PercentageBadge percentage={percentage} />;
        },
      },
    ],
    []
  );

  const osColumns = useMemo(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: "Operating System",
        cell: (info: any) => {
          const entry = info.row.original;
          return (
            <div className="flex items-center gap-3">
              <TechnologyIcon entry={entry} size="md" />
              <span className="font-medium">{entry.name}</span>
            </div>
          );
        },
      },
      {
        id: "visitors",
        accessorKey: "visitors",
        header: "Visitors",
      },
      {
        id: "percentage",
        accessorKey: "percentage",
        header: "Share",
        cell: (info: any) => {
          const percentage = info.getValue() as number;
          return <PercentageBadge percentage={percentage} />;
        },
      },
    ],
    []
  );

  const customEventsColumns = useMemo(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: "Event Name",
        cell: (info: any) => {
          const eventName = info.getValue() as string;
          return (
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
              <span className="font-medium text-foreground">{eventName}</span>
            </div>
          );
        },
      },
      {
        id: "total_events",
        accessorKey: "total_events",
        header: "Events",
        cell: (info: any) => (
          <div>
            <div className="font-medium text-foreground">{info.getValue()?.toLocaleString()}</div>
            <div className="text-muted-foreground text-xs">total</div>
          </div>
        ),
      },
      {
        id: "unique_users",
        accessorKey: "unique_users",
        header: "Users",
        cell: (info: any) => (
          <div>
            <div className="font-medium text-foreground">{info.getValue()?.toLocaleString()}</div>
            <div className="text-muted-foreground text-xs">unique</div>
          </div>
        ),
      },
      {
        id: "percentage",
        accessorKey: "percentage",
        header: "Share",
        cell: (info: any) => {
          const percentage = info.getValue() as number;
          return <PercentageBadge percentage={percentage} />;
        },
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard
          chartData={isLoading ? undefined : miniChartData.visitors}
          className="h-full"
          description={`${analytics.today?.visitors || 0} today`}
          icon={UsersIcon}
          id="visitors-chart"
          isLoading={isLoading}
          showChart={true}
          title="UNIQUE VISITORS"
          trend={calculateTrends.visitors}
          trendLabel={calculateTrends.visitors !== undefined ? "vs previous period" : undefined}
          value={analytics.summary?.unique_visitors || 0}
          variant="default"
        />
        <StatCard
          chartData={isLoading ? undefined : miniChartData.sessions}
          className="h-full"
          description={`${analytics.today?.sessions || 0} today`}
          icon={ChartLineIcon}
          id="sessions-chart"
          isLoading={isLoading}
          showChart={true}
          title="SESSIONS"
          trend={calculateTrends.sessions}
          trendLabel={calculateTrends.sessions !== undefined ? "vs previous period" : undefined}
          value={analytics.summary?.sessions || 0}
          variant="default"
        />
        <StatCard
          chartData={isLoading ? undefined : miniChartData.pageviews}
          className="h-full"
          description={`${analytics.today?.pageviews || 0} today`}
          icon={GlobeIcon}
          id="pageviews-chart"
          isLoading={isLoading}
          showChart={true}
          title="PAGEVIEWS"
          trend={calculateTrends.pageviews}
          trendLabel={calculateTrends.pageviews !== undefined ? "vs previous period" : undefined}
          value={analytics.summary?.pageviews || 0}
          variant="default"
        />
        <StatCard
          chartData={isLoading ? undefined : miniChartData.pagesPerSession}
          className="h-full"
          formatValue={(value) => value.toFixed(1)}
          icon={LayoutIcon}
          id="pages-per-session-chart"
          isLoading={isLoading}
          showChart={true}
          title="PAGES/SESSION"
          trend={calculateTrends.pages_per_session}
          trendLabel={
            calculateTrends.pages_per_session !== undefined ? "vs previous period" : undefined
          }
          value={
            analytics.summary
              ? analytics.summary.sessions > 0
                ? (analytics.summary.pageviews / analytics.summary.sessions).toFixed(1)
                : "0"
              : "0"
          }
          variant="default"
        />
        <StatCard
          chartData={isLoading ? undefined : miniChartData.bounceRate}
          className="h-full"
          formatValue={(value) => `${value.toFixed(1)}%`}
          icon={CursorIcon}
          id="bounce-rate-chart"
          invertTrend={true}
          isLoading={isLoading}
          showChart={true}
          title="BOUNCE RATE"
          trend={calculateTrends.bounce_rate}
          trendLabel={calculateTrends.bounce_rate !== undefined ? "vs previous period" : undefined}
          value={analytics.summary?.bounce_rate ? `${analytics.summary.bounce_rate.toFixed(1)}%` : "0%"}
          variant={getColorVariant(analytics.summary?.bounce_rate || 0, 70, 50)}
        />
        <StatCard
          chartData={isLoading ? undefined : miniChartData.sessionDuration}
          className="h-full"
          formatValue={(value) => {
            if (value < 60) return `${value.toFixed(1)}s`;
            const minutes = Math.floor(value / 60);
            const seconds = Math.round(value % 60);
            return `${minutes}m ${seconds}s`;
          }}
          icon={TimerIcon}
          id="session-duration-chart"
          isLoading={isLoading}
          showChart={true}
          title="SESSION DURATION"
          trend={calculateTrends.session_duration}
          trendLabel={
            calculateTrends.session_duration !== undefined ? "vs previous period" : undefined
          }
          value={(() => {
            const duration = analytics.summary?.avg_session_duration;
            if (!duration) return "0s";
            if (duration < 60) return `${duration.toFixed(1)}s`;
            const minutes = Math.floor(duration / 60);
            const seconds = Math.round(duration % 60);
            return `${minutes}m ${seconds}s`;
          })()}
          variant="default"
        />
      </div>

      {/* Chart */}
      <div className="rounded border bg-card shadow-sm">
        <div className="flex flex-col items-start justify-between gap-3 border-b p-4 sm:flex-row">
          <div>
            <h2 className="font-semibold text-lg tracking-tight">Traffic Trends</h2>
            <p className="text-muted-foreground text-sm">
              {dateRange.granularity === "hourly" ? "Hourly" : "Daily"} traffic data
            </p>
            {dateRange.granularity === "hourly" && dateDiff > 7 && (
              <div className="mt-1 flex items-center gap-1 text-amber-600 text-xs">
                <WarningIcon size={16} weight="fill" />
                <span>Large date ranges may affect performance</span>
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-3 sm:flex-row sm:items-center">
            <LiveUserIndicator websiteId={websiteId} />
            <MetricToggles colors={metricColors} metrics={visibleMetrics} onToggle={toggleMetric} />
          </div>
        </div>
        <div>
          <MetricsChart
            data={chartData}
            height={350}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DataTable
          description="Referrers and campaign data"
          isLoading={isLoading}
          minHeight={350}
          tabs={referrerTabs}
          title="Traffic Sources"
        />

        <DataTable
          description="Top pages and entry/exit points"
          isLoading={isLoading}
          minHeight={350}
          tabs={pagesTabs}
          title="Pages"
        />
      </div>

      {/* Custom Events Table */}
      <DataTable
        columns={customEventsColumns}
        data={processedCustomEventsData}
        description="User-defined events and interactions with property breakdowns"
        emptyMessage="No custom events tracked yet"
        expandable={true}
        getSubRows={(row: any) => row.propertyCategories}
        initialPageSize={8}
        isLoading={isLoading}
        minHeight={350}
        renderSubRow={(subRow: any, parentRow: any, index: number) => {
          const propertyKey = subRow.key;
          const propertyTotal = subRow.total;
          const propertyValues = subRow.values;
          const propertyId = `${parentRow.name}-${propertyKey}`;
          const isPropertyExpanded = expandedProperties.has(propertyId);

          return (
            <div className="ml-4">
              <button
                className="flex w-full items-center justify-between rounded border border-border/30 bg-muted/20 px-3 py-2 hover:bg-muted/40"
                onClick={() => togglePropertyExpansion(propertyId)}
                type="button"
              >
                <div className="flex items-center gap-2">
                  {isPropertyExpanded ? (
                    <CaretDownIcon
                      className="h-3 w-3 text-muted-foreground"
                      size={16}
                      weight="fill"
                    />
                  ) : (
                    <CaretRightIcon
                      className="h-3 w-3 text-muted-foreground"
                      size={16}
                      weight="fill"
                    />
                  )}
                  <span className="font-medium text-foreground text-sm">{propertyKey}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="font-medium text-foreground text-sm">
                    {propertyTotal.toLocaleString()}
                  </div>
                  <div className="rounded bg-primary/10 px-2 py-0.5 font-medium text-primary text-xs">
                    {propertyValues.length} {propertyValues.length === 1 ? "value" : "values"}
                  </div>
                </div>
              </button>

              {isPropertyExpanded && (
                <div className="mt-1 max-h-48 overflow-y-auto rounded border border-border/20">
                  {propertyValues.map((valueItem: any, valueIndex: number) => (
                    <div
                      className="flex items-center justify-between border-border/10 border-b px-3 py-2 last:border-b-0 hover:bg-muted/20"
                      key={`${propertyKey}-${valueItem.value}-${valueIndex}`}
                    >
                      <span
                        className="truncate font-mono text-foreground text-sm"
                        title={valueItem.value}
                      >
                        {valueItem.value}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground text-sm">
                          {valueItem.count.toLocaleString()}
                        </span>
                        <div className="min-w-[2.5rem] rounded bg-muted px-2 py-0.5 text-center font-medium text-muted-foreground text-xs">
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
        title="Custom Events"
      />

      {/* Technology */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <DataTable
          columns={deviceColumns}
          data={processedDeviceData}
          description="Device breakdown"
          initialPageSize={8}
          isLoading={isLoading}
          minHeight={200}
          showSearch={false}
          title="Devices"
        />

        <DataTable
          columns={browserColumns}
          data={processedBrowserData}
          description="Browser breakdown"
          initialPageSize={8}
          isLoading={isLoading}
          minHeight={200}
          showSearch={false}
          title="Browsers"
        />

        <DataTable
          columns={osColumns}
          data={processedOSData}
          description="OS breakdown"
          initialPageSize={8}
          isLoading={isLoading}
          minHeight={200}
          showSearch={false}
          title="Operating Systems"
        />
      </div>
    </div>
  );
}
