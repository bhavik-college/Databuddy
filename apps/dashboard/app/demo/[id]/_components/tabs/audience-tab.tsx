"use client";

import type { CellContext, ColumnDef } from "@tanstack/react-table";
import {
  Clock,
  Globe,
  HelpCircle,
  Languages,
  Laptop,
  MapPin,
  Monitor,
  Smartphone,
  Tablet,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useCallback, useEffect, useMemo } from "react";
import { DataTable } from "@/components/analytics/data-table";
import { BrowserIcon, OSIcon } from "@/components/icon";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useBatchDynamicQuery } from "@/hooks/use-dynamic-query";
import { PercentageBadge, type TechnologyTableEntry } from "../utils/technology-helpers";
import type { FullTabProps } from "../utils/types";

// Define types for geographic data with percentage
interface GeographicEntry {
  name: string;
  visitors: number;
  pageviews: number;
  percentage: number;
}

interface ConnectionEntry extends TechnologyTableEntry {
  category: "connection";
  iconComponent: React.ReactNode;
}

interface BrowserVersion {
  version: string;
  visitors: number;
  pageviews: number;
  sessions: number;
}

interface BrowserEntry {
  name: string;
  browserName: string;
  visitors: number;
  pageviews: number;
  sessions: number;
  percentage: number;
  versions: BrowserVersion[];
}

interface RawBrowserData {
  name?: string;
  browser_name?: string;
  browser_version?: string;
  visitors?: number;
  pageviews?: number;
  sessions?: number;
  versions?: BrowserVersion[];
}

interface ScreenResolutionEntry {
  name: string;
  visitors: number;
  pageviews?: number;
}

interface DeviceData {
  device_type: any[];
  browser_name: any[];
  os_name: any[];
  screen_resolution: ScreenResolutionEntry[];
  connection_type: any[];
}

interface ProcessedData {
  geographic: {
    countries: GeographicEntry[];
    regions: GeographicEntry[];
    timezones: GeographicEntry[];
    languages: GeographicEntry[];
  };
  device: DeviceData;
  browsers: RawBrowserData[];
}

// Helper function to get connection icon
const getConnectionIcon = (connection: string): React.ReactNode => {
  const connectionLower = connection.toLowerCase();
  if (!connection || connection === "Unknown")
    return <HelpCircle className="h-4 w-4 text-muted-foreground" />;
  if (connectionLower.includes("wifi")) return <Wifi className="h-4 w-4 text-green-500" />;
  if (connectionLower.includes("4g")) return <Smartphone className="h-4 w-4 text-blue-500" />;
  if (connectionLower.includes("5g")) return <Smartphone className="h-4 w-4 text-purple-500" />;
  if (connectionLower.includes("3g")) return <Smartphone className="h-4 w-4 text-yellow-500" />;
  if (connectionLower.includes("2g")) return <Smartphone className="h-4 w-4 text-orange-500" />;
  if (connectionLower.includes("ethernet")) return <Laptop className="h-4 w-4 text-blue-400" />;
  if (connectionLower.includes("cellular")) return <Smartphone className="h-4 w-4 text-blue-500" />;
  if (connectionLower.includes("offline")) return <WifiOff className="h-4 w-4 text-red-500" />;
  return <Globe className="h-4 w-4 text-primary" />;
};

// Normalize data like performance tab
const normalizeData = (data: any[]): GeographicEntry[] =>
  data?.map((item: any) => ({
    name: item.name || "Unknown",
    visitors: item.visitors || 0,
    pageviews: item.pageviews || 0,
    percentage: 0, // Will be calculated later
  })) || [];

const addPercentages = (data: GeographicEntry[]): GeographicEntry[] => {
  if (!data?.length) return [];
  const total = data.reduce((sum: number, item: GeographicEntry) => sum + item.visitors, 0);
  return data.map((item: GeographicEntry) => ({
    ...item,
    percentage: total > 0 ? Math.round((item.visitors / total) * 100) : 0,
  }));
};

const createNameColumn = (header: string, renderIcon?: (name: string) => React.ReactNode) => ({
  id: "name",
  accessorKey: "name",
  header,
  cell: (info: CellContext<any, any>) => {
    const name = info.getValue() as string;
    return (
      <div className="flex items-center gap-2">
        {renderIcon?.(name)}
        <span className="font-medium">{name}</span>
      </div>
    );
  },
});

const audienceColumns = [
  {
    id: "visitors",
    accessorKey: "visitors",
    header: "Visitors",
  },
  {
    id: "pageviews",
    accessorKey: "pageviews",
    header: "Pageviews",
  },
  {
    id: "percentage",
    accessorKey: "percentage",
    header: "Share",
    cell: (info: CellContext<any, any>) => {
      const percentage = info.getValue() as number;
      return <PercentageBadge percentage={percentage} />;
    },
  },
];

export function WebsiteAudienceTab({
  websiteId,
  dateRange,
  websiteData,
  isRefreshing,
  setIsRefreshing,
}: FullTabProps) {
  // Consolidate all dynamic queries into a single batch request
  const batchQueries = useMemo(
    () => [
      {
        id: "geographic-data",
        parameters: ["country", "region", "timezone", "language"],
        limit: 100,
      },
      {
        id: "device-data",
        parameters: [
          "device_type",
          "browser_name",
          "os_name",
          "screen_resolution",
          "connection_type",
        ],
        limit: 50,
      },
      {
        id: "browsers-grouped",
        parameters: ["browsers_grouped"],
        limit: 50,
      },
    ],
    []
  ); // Empty dependency array since these queries don't change

  const {
    results: batchResults,
    isLoading: isBatchLoading,
    refetch: refetchBatch,
    error: batchError,
  } = useBatchDynamicQuery(websiteId, dateRange, batchQueries);

  // Debug: Check if we have any data at all
  const testResult = batchResults?.find((r) => r.queryId === "test-data");
  console.log("Test data result:", testResult);
  console.log("Date range being used:", dateRange);

  // Memoized refresh function to prevent unnecessary re-renders
  const handleRefresh = useCallback(async () => {
    if (!isRefreshing) return;

    try {
      // Execute batch refetch operation
      await refetchBatch();
    } catch (error) {
      console.error("Failed to refresh audience data:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, refetchBatch, setIsRefreshing]);

  // Handle refresh with improved logic
  useEffect(() => {
    if (isRefreshing) {
      handleRefresh();
    }
  }, [isRefreshing, handleRefresh]);

  // Process batch results into organized data
  const processedData = useMemo((): ProcessedData => {
    if (!batchResults?.length) {
      return {
        geographic: { countries: [], regions: [], timezones: [], languages: [] },
        device: {
          device_type: [],
          browser_name: [],
          os_name: [],
          screen_resolution: [],
          connection_type: [],
        },
        browsers: [],
      };
    }

    const geographicResult = batchResults.find((r) => r.queryId === "geographic-data");
    const deviceResult = batchResults.find((r) => r.queryId === "device-data");
    const browsersResult = batchResults.find((r) => r.queryId === "browsers-grouped");

    return {
      geographic: {
        countries: addPercentages(normalizeData(geographicResult?.data?.country || [])),
        regions: addPercentages(normalizeData(geographicResult?.data?.region || [])),
        timezones: addPercentages(normalizeData(geographicResult?.data?.timezone || [])),
        languages: addPercentages(normalizeData(geographicResult?.data?.language || [])),
      },
      device: {
        device_type: deviceResult?.data?.device_type || [],
        browser_name: deviceResult?.data?.browser_name || [],
        os_name: deviceResult?.data?.os_name || [],
        screen_resolution: deviceResult?.data?.screen_resolution || [],
        connection_type: deviceResult?.data?.connection_type || [],
      },
      browsers: browsersResult?.data?.browsers_grouped || [],
    };
  }, [batchResults]);

  // Process browser data (simplified)
  const processedBrowserData = useMemo((): BrowserEntry[] => {
    const rawData = processedData.browsers;
    if (!rawData?.length) return [];

    // If already grouped with versions, use directly
    if (rawData.length > 0 && rawData[0].versions) {
      const totalVisitors = rawData.reduce(
        (sum: number, browser: RawBrowserData) => sum + (browser.visitors || 0),
        0
      );

      return rawData
        .map(
          (browser: RawBrowserData) =>
            ({
              ...browser,
              name: browser.name || "Unknown",
              browserName: browser.name || "Unknown",
              visitors: browser.visitors || 0,
              pageviews: browser.pageviews || 0,
              sessions: browser.sessions || 0,
              percentage:
                totalVisitors > 0 ? Math.round(((browser.visitors || 0) / totalVisitors) * 100) : 0,
              versions:
                browser.versions?.sort(
                  (a: BrowserVersion, b: BrowserVersion) => (b.visitors || 0) - (a.visitors || 0)
                ) || [],
            }) as BrowserEntry
        )
        .sort((a: BrowserEntry, b: BrowserEntry) => (b.visitors || 0) - (a.visitors || 0));
    }

    // Group browsers by name
    const browserGroups: Record<string, BrowserEntry> = rawData.reduce(
      (acc: Record<string, BrowserEntry>, browser: RawBrowserData) => {
        const browserName = browser.browser_name || "Unknown";
        if (!acc[browserName]) {
          acc[browserName] = {
            name: browserName,
            browserName,
            visitors: 0,
            pageviews: 0,
            sessions: 0,
            percentage: 0,
            versions: [],
          };
        }

        acc[browserName].visitors += browser.visitors || 0;
        acc[browserName].pageviews += browser.pageviews || 0;
        acc[browserName].sessions += browser.sessions || 0;
        acc[browserName].versions.push({
          version: browser.browser_version || "Unknown",
          visitors: browser.visitors || 0,
          pageviews: browser.pageviews || 0,
          sessions: browser.sessions || 0,
        });

        return acc;
      },
      {}
    );

    const browserArray = Object.values(browserGroups) as BrowserEntry[];
    const totalVisitors = browserArray.reduce(
      (sum: number, browser: BrowserEntry) => sum + (browser.visitors || 0),
      0
    );

    return browserArray
      .map((browser: BrowserEntry) => ({
        ...browser,
        percentage: totalVisitors > 0 ? Math.round((browser.visitors / totalVisitors) * 100) : 0,
        versions:
          browser.versions?.sort(
            (a: BrowserVersion, b: BrowserVersion) => (b.visitors || 0) - (a.visitors || 0)
          ) || [],
      }))
      .sort((a: BrowserEntry, b: BrowserEntry) => (b.visitors || 0) - (a.visitors || 0));
  }, [processedData.browsers]);

  // Process connection data
  const processedConnectionData = useMemo((): ConnectionEntry[] => {
    const connectionData = processedData.device.connection_type;
    if (!connectionData?.length) return [];

    const totalVisitors = connectionData.reduce((sum: number, item: any) => sum + item.visitors, 0);

    return connectionData
      .map((item: any) => ({
        name: item.name || "Unknown",
        visitors: item.visitors,
        pageviews: item.pageviews || 0,
        percentage: totalVisitors > 0 ? Math.round((item.visitors / totalVisitors) * 100) : 0,
        iconComponent: getConnectionIcon(item.name || ""),
        category: "connection" as const,
      }))
      .sort((a: ConnectionEntry, b: ConnectionEntry) => b.visitors - a.visitors);
  }, [processedData.device.connection_type]);

  // Combine loading states
  const isLoading = isBatchLoading || isRefreshing;

  // Browser table columns with expandable functionality
  const browserColumns = useMemo(
    (): ColumnDef<BrowserEntry>[] => [
      {
        id: "browserName",
        accessorKey: "browserName",
        header: "Browser",
        cell: (info: CellContext<BrowserEntry, any>) => {
          const browserName = info.getValue() as string;
          const row = info.row.original;
          return (
            <div className="flex items-center gap-3">
              <BrowserIcon
                fallback={
                  <div className="flex h-5 w-5 items-center justify-center rounded bg-muted font-medium text-muted-foreground text-xs">
                    {browserName.charAt(0).toUpperCase()}
                  </div>
                }
                name={browserName}
                size="md"
              />
              <div>
                <div className="font-semibold text-foreground">{browserName}</div>
                <div className="text-muted-foreground text-xs">
                  {row.versions?.length || 0} versions detected
                </div>
              </div>
            </div>
          );
        },
      },
      {
        id: "visitors",
        accessorKey: "visitors",
        header: "Visitors",
        cell: (info: CellContext<BrowserEntry, any>) => (
          <div>
            <div className="font-medium">{info.getValue()?.toLocaleString()}</div>
            <div className="text-muted-foreground text-xs">unique users</div>
          </div>
        ),
      },
      {
        id: "pageviews",
        accessorKey: "pageviews",
        header: "Pageviews",
        cell: (info: CellContext<BrowserEntry, any>) => (
          <div>
            <div className="font-medium">{info.getValue()?.toLocaleString()}</div>
            <div className="text-muted-foreground text-xs">total views</div>
          </div>
        ),
      },
      {
        id: "percentage",
        accessorKey: "percentage",
        header: "Share",
        cell: (info: CellContext<BrowserEntry, any>) => {
          const percentage = info.getValue() as number;
          return <PercentageBadge percentage={percentage} />;
        },
      },
    ],
    []
  );

  const connectionColumns = useMemo(
    (): ColumnDef<ConnectionEntry>[] => [
      {
        id: "name",
        accessorKey: "name",
        header: "Connection Type",
        cell: (info: CellContext<ConnectionEntry, any>) => {
          const entry = info.row.original;
          return (
            <div className="flex items-center gap-3">
              {entry.iconComponent}
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
        cell: (info: CellContext<ConnectionEntry, any>) => {
          const percentage = info.getValue() as number;
          return <PercentageBadge percentage={percentage} />;
        },
      },
    ],
    []
  );

  // Geographic columns with percentage support
  const geographicColumns = useMemo(
    (): ColumnDef<GeographicEntry>[] => [
      {
        id: "name",
        accessorKey: "name",
        header: "Location",
        cell: (info: CellContext<GeographicEntry, any>) => {
          const name = info.getValue() as string;
          return (
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <span className="font-medium">{name}</span>
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
        id: "pageviews",
        accessorKey: "pageviews",
        header: "Pageviews",
      },
      {
        id: "percentage",
        accessorKey: "percentage",
        header: "Share",
        cell: (info: CellContext<GeographicEntry, any>) => {
          const percentage = info.getValue() as number;
          return <PercentageBadge percentage={percentage} />;
        },
      },
    ],
    []
  );

  // Country specific columns with flag support
  const countryColumns = useMemo(
    (): ColumnDef<GeographicEntry>[] => [
      {
        id: "name",
        accessorKey: "name",
        header: "Country",
        cell: (info: CellContext<GeographicEntry, any>) => {
          const countryCode = info.getValue() as string;
          return (
            <div className="flex items-center gap-2">
              {countryCode && countryCode !== "Unknown" ? (
                <div className="relative h-4 w-5 overflow-hidden rounded-sm bg-muted">
                  <img
                    alt={countryCode}
                    className="absolute inset-0 h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                      const parent = (e.target as HTMLImageElement).parentElement;
                      if (parent) {
                        const helpCircle = parent.querySelector(".fallback-icon");
                        if (helpCircle) (helpCircle as HTMLElement).style.display = "flex";
                      }
                    }}
                    src={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${countryCode.toUpperCase()}.svg`}
                  />
                  <div
                    className="fallback-icon h-4 w-5 items-center justify-center rounded-sm bg-muted"
                    style={{ display: "none" }}
                  >
                    <Globe className="h-3 w-3 text-muted-foreground" />
                  </div>
                </div>
              ) : (
                <div className="flex h-4 w-5 items-center justify-center rounded-sm bg-muted">
                  <Globe className="h-3 w-3 text-muted-foreground" />
                </div>
              )}
              <span className="font-medium">{countryCode || "Unknown"}</span>
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
        id: "pageviews",
        accessorKey: "pageviews",
        header: "Pageviews",
      },
      {
        id: "percentage",
        accessorKey: "percentage",
        header: "Share",
        cell: (info: CellContext<GeographicEntry, any>) => {
          const percentage = info.getValue() as number;
          return <PercentageBadge percentage={percentage} />;
        },
      },
    ],
    []
  );

  // Timezone specific columns with icon and current time
  const timezoneColumns = useMemo(
    (): ColumnDef<GeographicEntry>[] => [
      {
        id: "name",
        accessorKey: "name",
        header: "Timezone",
        cell: (info: CellContext<GeographicEntry, any>) => {
          const entry = info.row.original;
          const timezone = entry.name;
          const currentTime = (entry as any).current_time;
          return (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <div>
                <div className="font-medium">{timezone}</div>
                {currentTime && <div className="text-muted-foreground text-xs">{currentTime}</div>}
              </div>
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
        id: "pageviews",
        accessorKey: "pageviews",
        header: "Pageviews",
      },
      {
        id: "percentage",
        accessorKey: "percentage",
        header: "Share",
        cell: (info: CellContext<GeographicEntry, any>) => {
          const percentage = info.getValue() as number;
          return <PercentageBadge percentage={percentage} />;
        },
      },
    ],
    []
  );

  // Language specific columns with icon and code
  const languageColumns = useMemo(
    (): ColumnDef<GeographicEntry>[] => [
      {
        id: "name",
        accessorKey: "name",
        header: "Language",
        cell: (info: CellContext<GeographicEntry, any>) => {
          const entry = info.row.original;
          const language = entry.name;
          const code = (entry as any).code;
          return (
            <div className="flex items-center gap-2">
              <Languages className="h-4 w-4 text-primary" />
              <div>
                <div className="font-medium">{language}</div>
                {code && code !== language && (
                  <div className="text-muted-foreground text-xs">{code}</div>
                )}
              </div>
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
        id: "pageviews",
        accessorKey: "pageviews",
        header: "Pageviews",
      },
      {
        id: "percentage",
        accessorKey: "percentage",
        header: "Share",
        cell: (info: CellContext<GeographicEntry, any>) => {
          const percentage = info.getValue() as number;
          return <PercentageBadge percentage={percentage} />;
        },
      },
    ],
    []
  );

  // Prepare tabs for enhanced geographic data with unique keys
  const geographicTabs = useMemo(
    () => [
      {
        id: "countries",
        label: "Countries",
        data: processedData.geographic.countries.map((item, index) => ({
          ...item,
          _uniqueKey: `country-${item.name}-${index}`, // Ensure unique row keys
        })),
        columns: countryColumns,
      },
      {
        id: "regions",
        label: "Regions",
        data: processedData.geographic.regions.map((item, index) => ({
          ...item,
          _uniqueKey: `region-${item.name}-${index}`, // Ensure unique row keys
        })),
        columns: geographicColumns,
      },
      {
        id: "timezones",
        label: "Timezones",
        data: processedData.geographic.timezones.map((item, index) => ({
          ...item,
          _uniqueKey: `timezone-${item.name}-${index}`, // Ensure unique row keys
        })),
        columns: timezoneColumns,
      },
      {
        id: "languages",
        label: "Languages",
        data: processedData.geographic.languages.map((item, index) => ({
          ...item,
          _uniqueKey: `language-${item.name}-${index}`, // Ensure unique row keys
        })),
        columns: languageColumns,
      },
    ],
    [
      processedData.geographic.countries,
      processedData.geographic.regions,
      processedData.geographic.timezones,
      processedData.geographic.languages,
      countryColumns,
      geographicColumns,
      timezoneColumns,
      languageColumns,
    ]
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 font-semibold text-lg">Audience Insights</h2>
        <p className="text-muted-foreground text-sm">
          Detailed information about your website visitors
        </p>
      </div>

      {/* Technology Breakdown */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DataTable
          columns={browserColumns}
          data={processedBrowserData}
          description="Expandable browser breakdown showing all versions per browser"
          expandable={true}
          getSubRows={(row: any) => row.versions}
          initialPageSize={8}
          isLoading={isLoading}
          minHeight={200}
          renderSubRow={(subRow: any, parentRow: any, index: number) => {
            const percentage = Math.round(
              ((subRow.visitors || 0) / (parentRow.visitors || 1)) * 100
            );
            const gradientConfig =
              percentage >= 40
                ? {
                    bg: "linear-gradient(90deg, rgba(34, 197, 94, 0.12) 0%, rgba(34, 197, 94, 0.06) 100%)",
                    border: "rgba(34, 197, 94, 0.2)",
                  }
                : percentage >= 25
                  ? {
                      bg: "linear-gradient(90deg, rgba(59, 130, 246, 0.12) 0%, rgba(59, 130, 246, 0.06) 100%)",
                      border: "rgba(59, 130, 246, 0.2)",
                    }
                  : percentage >= 10
                    ? {
                        bg: "linear-gradient(90deg, rgba(245, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0.06) 100%)",
                        border: "rgba(245, 158, 11, 0.2)",
                      }
                    : {
                        bg: "linear-gradient(90deg, rgba(107, 114, 128, 0.08) 0%, rgba(107, 114, 128, 0.04) 100%)",
                        border: "rgba(107, 114, 128, 0.15)",
                      };

            return (
              <div
                className="grid grid-cols-4 gap-3 border-l-2 px-4 py-1.5 text-sm transition-all duration-200"
                style={{
                  background: gradientConfig.bg,
                  borderLeftColor: gradientConfig.border,
                }}
              >
                <div className="flex items-center gap-1.5">
                  <div className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                  <span className="font-medium">{subRow.version || "Unknown"}</span>
                </div>
                <div className="text-right font-medium">{subRow.visitors?.toLocaleString()}</div>
                <div className="text-right font-medium">{subRow.pageviews?.toLocaleString()}</div>
                <div className="text-right">
                  <PercentageBadge percentage={percentage} />
                </div>
              </div>
            );
          }}
          showSearch={false}
          title="Browser Versions"
        />

        <DataTable
          columns={connectionColumns}
          data={processedConnectionData}
          description="Visitors by network connection"
          initialPageSize={8}
          isLoading={isLoading}
          minHeight={200}
          showSearch={false}
          title="Connection Types"
        />
      </div>

      {/* Enhanced Geographic Data */}
      <div className="grid grid-cols-1 gap-4">
        <DataTable
          description="Visitors by location, timezone, and language (limit: 100 per category)"
          initialPageSize={8}
          isLoading={isLoading}
          minHeight={400}
          tabs={geographicTabs}
          title="Geographic Distribution"
        />
      </div>

      {/* Screen Resolutions */}
      <Card className="w-full overflow-hidden border bg-card/50 shadow-sm backdrop-blur-sm">
        <CardHeader className="px-3 pb-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold text-foreground text-sm">Screen Resolutions</h3>
              <p className="mt-0.5 line-clamp-2 text-muted-foreground text-xs">
                Visitors by screen size and device type
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="overflow-hidden px-3 pb-2">
          {isLoading ? (
            <div className="animate-pulse space-y-3" style={{ minHeight: 400 }}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    className="space-y-3 rounded-lg bg-muted/20 p-4"
                    key={`skeleton-resolution-card-${index + 1}`}
                  >
                    <Skeleton className="h-4 w-24 rounded-md" />
                    <Skeleton className="h-32 w-full rounded-lg" />
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Skeleton className="h-3 w-16 rounded-sm" />
                        <Skeleton className="h-3 w-8 rounded-sm" />
                      </div>
                      <Skeleton className="h-2 w-full rounded-full" />
                      <Skeleton className="ml-auto h-3 w-12 rounded-sm" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : processedData.device.screen_resolution?.length ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {processedData.device.screen_resolution
                  ?.slice(0, 6)
                  .map((item: ScreenResolutionEntry) => {
                    const resolution = item.name;
                    if (!resolution) return null;
                    const [width, height] = resolution.split("x").map(Number);
                    const isValid = !(Number.isNaN(width) || Number.isNaN(height));

                    const totalVisitors =
                      processedData.device.screen_resolution?.reduce(
                        (sum: number, resItem: ScreenResolutionEntry) => sum + resItem.visitors,
                        0
                      ) || 1;
                    const percentage = Math.round((item.visitors / totalVisitors) * 100);

                    let deviceType = "Unknown";
                    let deviceIcon = <Monitor className="h-4 w-4 text-muted-foreground" />;

                    if (isValid) {
                      if (width <= 480) {
                        deviceType = "Mobile";
                        deviceIcon = <Smartphone className="h-4 w-4 text-blue-500" />;
                      } else if (width <= 1024) {
                        deviceType = "Tablet";
                        deviceIcon = <Tablet className="h-4 w-4 text-purple-500" />;
                      } else if (width <= 1440) {
                        deviceType = "Laptop";
                        deviceIcon = <Laptop className="h-4 w-4 text-green-500" />;
                      } else {
                        deviceType = "Desktop";
                        deviceIcon = <Monitor className="h-4 w-4 text-primary" />;
                      }
                    }

                    // Create aspect ratio-correct box
                    const aspectRatio = isValid ? width / height : 16 / 9;

                    return (
                      <div
                        className="flex flex-col rounded-lg border border-border/50 bg-background/50 p-4 transition-all duration-200 hover:bg-background/80"
                        key={`resolution-${resolution}-${item.visitors}`}
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {deviceIcon}
                            <div>
                              <div className="font-medium text-sm">{resolution}</div>
                              <div className="text-muted-foreground text-xs">{deviceType}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-sm">{percentage}%</div>
                          </div>
                        </div>

                        {/* Enhanced Screen visualization with perspective */}
                        <div className="perspective relative mb-4 flex h-32 justify-center">
                          <div
                            className="relative flex transform-gpu items-center justify-center rounded-lg border-2 border-primary/20 bg-gradient-to-br from-primary/8 to-primary/12 shadow-lg transition-all duration-300 hover:shadow-xl"
                            style={{
                              width: `${Math.min(200, 100 * Math.sqrt(aspectRatio))}px`,
                              height: `${Math.min(160, 100 / Math.sqrt(aspectRatio))}px`,
                              transformStyle: "preserve-3d",
                              transform: "rotateY(-8deg) rotateX(3deg)",
                              margin: "auto",
                            }}
                          >
                            {isValid && (
                              <div
                                className="transform-gpu font-mono font-semibold text-primary text-xs"
                                style={{ transform: "translateZ(5px)" }}
                              >
                                {width} × {height}
                              </div>
                            )}

                            {/* Enhanced Screen content simulation */}
                            <div
                              className="absolute inset-2 rounded bg-background/20"
                              style={{ transform: "translateZ(2px)" }}
                            />

                            {/* Browser-like UI elements */}
                            <div
                              className="absolute top-2 right-2 left-2 h-1.5 rounded-full bg-primary/30"
                              style={{ transform: "translateZ(3px)" }}
                            />
                            <div
                              className="absolute top-5 left-2 h-1 w-1/2 rounded-full bg-primary/20"
                              style={{ transform: "translateZ(3px)" }}
                            />
                            <div
                              className="absolute inset-x-2 bottom-4 grid grid-cols-3 gap-1"
                              style={{ transform: "translateZ(3px)" }}
                            >
                              <div className="h-1 rounded-full bg-primary/15" />
                              <div className="h-1 rounded-full bg-primary/20" />
                              <div className="h-1 rounded-full bg-primary/15" />
                            </div>
                          </div>

                          {/* Stand or base for desktop/laptop */}
                          {(deviceType === "Desktop" || deviceType === "Laptop") && (
                            <div
                              className="absolute bottom-0 mx-auto h-3 w-1/4 rounded-b-md bg-muted/60"
                              style={{
                                left: "50%",
                                transform: "translateX(-50%)",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                              }}
                            />
                          )}
                        </div>

                        <div className="mt-auto space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">
                              {item.visitors.toLocaleString()} visitors
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-muted/40">
                            <div
                              className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-muted-foreground text-xs">
                            <span>{item.pageviews?.toLocaleString() || "0"} pageviews</span>
                            <span>{percentage}% share</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {processedData.device.screen_resolution &&
                processedData.device.screen_resolution.length > 6 && (
                  <div className="border-border/30 border-t pt-2 text-center text-muted-foreground text-xs">
                    Showing top 6 of {processedData.device.screen_resolution.length} screen
                    resolutions
                  </div>
                )}
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center py-16 text-center"
              style={{ minHeight: 400 }}
            >
              <div className="mb-4">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/20">
                  <Monitor className="h-7 w-7 text-muted-foreground/50" />
                </div>
              </div>
              <h4 className="mb-2 font-medium text-base text-foreground">
                No screen resolution data available
              </h4>
              <p className="max-w-[280px] text-muted-foreground text-sm">
                Resolution data will appear here when visitors start using your website.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
