"use client";

import {
  AlertTriangle,
  CheckCircle,
  MapPin,
  Monitor,
  Smartphone,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useEffect, useMemo } from "react";
import { DataTable } from "@/components/analytics/data-table";
import { CountryFlag } from "@/components/analytics/icons/CountryFlag";
import { BrowserIcon, OSIcon } from "@/components/icon";
import { useEnhancedPerformanceData } from "@/hooks/use-dynamic-query";
import type { FullTabProps } from "../utils/types";

interface PerformanceEntry {
  name: string;
  visitors: number;
  avg_load_time: number;
  avg_ttfb?: number;
  avg_dom_ready_time?: number;
  avg_render_time?: number;
  avg_fcp?: number;
  avg_lcp?: number;
  avg_cls?: number;
  _uniqueKey?: string;
}

interface PerformanceSummary {
  avgLoadTime: number;
  fastPages: number;
  slowPages: number;
  totalPages: number;
  performanceScore: number;
}

function PerformanceMetricCell({
  value,
  type = "time",
}: {
  value?: number;
  type?: "time" | "cls";
}) {
  if (!value || value === 0) {
    return <span className="text-muted-foreground">N/A</span>;
  }

  let formatted: string;
  let colorClass: string;
  let showIcon = false;

  if (type === "cls") {
    // CLS is a score (0-1, lower is better)
    formatted = value.toFixed(3);
    colorClass = value < 0.1 ? "text-green-600" : value < 0.25 ? "text-yellow-600" : "text-red-400";
    showIcon = value < 0.1 || value >= 0.25;
  } else {
    // Time-based metrics
    formatted = value < 1000 ? `${Math.round(value)}ms` : `${(value / 1000).toFixed(2)}s`;
    colorClass =
      value < 1000 ? "text-green-600" : value < 3000 ? "text-yellow-600" : "text-red-400";
    showIcon = value < 1000 || value >= 3000;
  }

  return (
    <div className="flex items-center gap-1">
      <span className={colorClass}>{formatted}</span>
      {showIcon && value < (type === "cls" ? 0.1 : 1000) && (
        <CheckCircle className="h-3 w-3 text-green-600" />
      )}
      {showIcon && value >= (type === "cls" ? 0.25 : 3000) && (
        <AlertTriangle className="h-3 w-3 text-red-400" />
      )}
    </div>
  );
}

function PerformanceSummaryCard({ summary }: { summary: PerformanceSummary }) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 70) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 border-red-600";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <TrendingUp className="h-4 w-4" />;
    if (score >= 70) return <Zap className="h-4 w-4" />;
    return <TrendingDown className="h-4 w-4" />;
  };

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <div className="rounded-lg border bg-background p-4">
        <div className="mb-2 flex items-center gap-2">
          {getScoreIcon(summary.performanceScore)}
          <span className="font-medium text-muted-foreground text-sm">Performance Score</span>
        </div>
        <div className="font-bold text-2xl">{summary.performanceScore}/100</div>
      </div>

      <div className="rounded-lg border bg-background p-4">
        <div className="mb-2 flex items-center gap-2">
          <Zap className="h-4 w-4 text-blue-500" />
          <span className="font-medium text-muted-foreground text-sm">Avg Load Time</span>
        </div>
        <div className="font-bold text-2xl">
          {summary.avgLoadTime < 1000
            ? `${Math.round(summary.avgLoadTime)}ms`
            : `${(summary.avgLoadTime / 1000).toFixed(1)}s`}
        </div>
      </div>

      <div className="rounded-lg border bg-background p-4">
        <div className="mb-2 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className="font-medium text-muted-foreground text-sm">Fast Pages</span>
        </div>
        <div className="font-bold text-2xl text-green-600">
          {summary.fastPages}
          <span className="ml-1 text-muted-foreground text-sm">
            ({Math.round((summary.fastPages / summary.totalPages) * 100)}%)
          </span>
        </div>
      </div>

      <div className="rounded-lg border bg-background p-4">
        <div className="mb-2 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <span className="font-medium text-muted-foreground text-sm">Slow Pages</span>
        </div>
        <div className="font-bold text-2xl text-red-600">
          {summary.slowPages}
          <span className="ml-1 text-muted-foreground text-sm">
            ({Math.round((summary.slowPages / summary.totalPages) * 100)}%)
          </span>
        </div>
      </div>
    </div>
  );
}

const normalizeData = (data: any[]): PerformanceEntry[] =>
  data?.map((item) => ({
    name: item.name || "Unknown",
    visitors: item.visitors || 0,
    avg_load_time: item.avg_load_time || 0,
    avg_ttfb: item.avg_ttfb,
    avg_dom_ready_time: item.avg_dom_ready_time,
    avg_render_time: item.avg_render_time,
    avg_fcp: item.avg_fcp,
    avg_lcp: item.avg_lcp,
    avg_cls: item.avg_cls,
  })) || [];

const createNameColumn = (
  header: string,
  renderIcon?: (name: string) => React.ReactNode,
  formatText?: (name: string) => string
) => ({
  id: "name",
  accessorKey: "name",
  header,
  cell: (info: any) => {
    const name = info.getValue() as string;
    const displayText = formatText ? formatText(name) : name;
    return (
      <div className="flex items-center gap-2">
        {renderIcon?.(name)}
        <div className="max-w-xs truncate font-medium" title={name}>
          {displayText}
        </div>
      </div>
    );
  },
});

const performanceColumns = [
  {
    id: "visitors",
    accessorKey: "visitors",
    header: "Visitors",
    cell: (info: any) => (info.getValue() as number)?.toLocaleString(),
  },
  {
    id: "avg_load_time",
    accessorKey: "avg_load_time",
    header: "Load Time",
    cell: (info: any) => <PerformanceMetricCell value={info.getValue()} />,
  },
  // {
  //   id: 'avg_fcp',
  //   accessorKey: 'avg_fcp',
  //   header: 'FCP',
  //   cell: (info: any) => <PerformanceMetricCell value={info.getValue()} />,
  // },
  // {
  //   id: 'avg_lcp',
  //   accessorKey: 'avg_lcp',
  //   header: 'LCP',
  //   cell: (info: any) => <PerformanceMetricCell value={info.getValue()} />,
  // },
  // {
  //   id: 'avg_cls',
  //   accessorKey: 'avg_cls',
  //   header: 'CLS',
  //   cell: (info: any) => <PerformanceMetricCell value={info.getValue()} type="cls" />,
  // },
  {
    id: "avg_ttfb",
    accessorKey: "avg_ttfb",
    header: "TTFB",
    cell: (info: any) => <PerformanceMetricCell value={info.getValue()} />,
  },
  {
    id: "avg_dom_ready_time",
    accessorKey: "avg_dom_ready_time",
    header: "DOM Ready",
    cell: (info: any) => <PerformanceMetricCell value={info.getValue()} />,
  },
];

export function WebsitePerformanceTab({
  websiteId,
  dateRange,
  isRefreshing,
  setIsRefreshing,
}: FullTabProps) {
  const {
    results: performanceResults,
    isLoading,
    refetch,
    error,
  } = useEnhancedPerformanceData(websiteId, dateRange);

  useEffect(() => {
    if (isRefreshing) {
      refetch().finally(() => setIsRefreshing(false));
    }
  }, [isRefreshing, refetch, setIsRefreshing]);

  const processedData = useMemo(() => {
    if (!performanceResults?.length) {
      return {
        pages: [],
        countries: [],
        devices: [],
        browsers: [],
        operating_systems: [],
        regions: [],
      };
    }

    return {
      pages: normalizeData(
        performanceResults.find((r) => r.queryId === "pages")?.data?.slow_pages
      )?.sort((a, b) => a.avg_load_time - b.avg_load_time), // Sort by fastest first
      countries: normalizeData(
        performanceResults.find((r) => r.queryId === "countries")?.data?.performance_by_country
      )?.sort((a, b) => a.avg_load_time - b.avg_load_time),
      devices: normalizeData(
        performanceResults.find((r) => r.queryId === "devices")?.data?.performance_by_device
      )?.sort((a, b) => a.avg_load_time - b.avg_load_time),
      browsers: normalizeData(
        performanceResults.find((r) => r.queryId === "browsers")?.data?.performance_by_browser
      )?.sort((a, b) => a.avg_load_time - b.avg_load_time),
      operating_systems: normalizeData(
        performanceResults.find((r) => r.queryId === "operating_systems")?.data?.performance_by_os
      )?.sort((a, b) => a.avg_load_time - b.avg_load_time),
      regions: normalizeData(
        performanceResults.find((r) => r.queryId === "regions")?.data?.performance_by_region
      )?.sort((a, b) => a.avg_load_time - b.avg_load_time),
    };
  }, [performanceResults]);

  // Calculate performance summary
  const performanceSummary = useMemo((): PerformanceSummary => {
    const pages = processedData.pages;
    if (!pages.length) {
      return { avgLoadTime: 0, fastPages: 0, slowPages: 0, totalPages: 0, performanceScore: 0 };
    }

    const totalLoadTime = pages.reduce(
      (sum: number, page: PerformanceEntry) => sum + page.avg_load_time,
      0
    );
    const avgLoadTime = totalLoadTime / pages.length;
    const fastPages = pages.filter((page) => page.avg_load_time < 1000).length;
    const slowPages = pages.filter((page) => page.avg_load_time > 3000).length;

    // Calculate performance score (0-100)
    const fastPercentage = fastPages / pages.length;
    const slowPercentage = slowPages / pages.length;
    const performanceScore = Math.round(fastPercentage * 100 - slowPercentage * 50);

    return {
      avgLoadTime,
      fastPages,
      slowPages,
      totalPages: pages.length,
      performanceScore: Math.max(0, Math.min(100, performanceScore)),
    };
  }, [processedData.pages]);

  const tabs = useMemo(
    () => [
      {
        id: "pages",
        label: "Pages",
        data: processedData.pages.map((item, i) => ({ ...item, _uniqueKey: `page-${i}` })),
        columns: [
          createNameColumn("Page", undefined, (name) => {
            try {
              return name.startsWith("http") ? new URL(name).pathname : name;
            } catch {
              return name.startsWith("/") ? name : `/${name}`;
            }
          }),
          ...performanceColumns,
        ],
      },
      {
        id: "countries",
        label: "Countries",
        data: processedData.countries.map((item, i) => ({ ...item, _uniqueKey: `country-${i}` })),
        columns: [
          createNameColumn("Country", (name) => <CountryFlag country={name} size={16} />),
          ...performanceColumns,
        ],
      },
      {
        id: "regions",
        label: "Regions",
        data: processedData.regions.map((item, i) => ({ ...item, _uniqueKey: `region-${i}` })),
        columns: [
          createNameColumn("Region", () => <MapPin className="h-4 w-4 text-primary" />),
          ...performanceColumns,
        ],
      },
      {
        id: "devices",
        label: "Device Types",
        data: processedData.devices.map((item, i) => ({ ...item, _uniqueKey: `device-${i}` })),
        columns: [
          createNameColumn("Device Type", (name) => {
            const device = name.toLowerCase();
            return device.includes("mobile") || device.includes("phone") ? (
              <Smartphone className="h-4 w-4 text-blue-500" />
            ) : device.includes("tablet") ? (
              <Monitor className="h-4 w-4 text-purple-500" />
            ) : (
              <Monitor className="h-4 w-4 text-gray-500" />
            );
          }),
          ...performanceColumns,
        ],
      },
      {
        id: "browsers",
        label: "Browsers",
        data: processedData.browsers.map((item, i) => ({ ...item, _uniqueKey: `browser-${i}` })),
        columns: [
          createNameColumn("Browser", (name) => <BrowserIcon name={name} size="sm" />),
          ...performanceColumns,
        ],
      },
      {
        id: "operating_systems",
        label: "Operating Systems",
        data: processedData.operating_systems.map((item, i) => ({
          ...item,
          _uniqueKey: `os-${i}`,
        })),
        columns: [
          createNameColumn("Operating System", (name) => <OSIcon name={name} size="sm" />),
          ...performanceColumns,
        ],
      },
    ],
    [processedData]
  );

  return (
    <div className="space-y-4">
      <div className="rounded border bg-muted/20 p-4">
        <div className="mb-4 flex items-start gap-2">
          <Zap className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
          <div>
            <p className="mb-1 font-medium text-foreground">Performance Overview</p>
            <p className="text-muted-foreground text-xs">
              Core Web Vitals and performance metrics.
              <span className="font-medium text-green-600">Good</span>,
              <span className="ml-1 font-medium text-yellow-600">Needs Improvement</span>,
              <span className="ml-1 font-medium text-red-600">Poor</span> ratings.
            </p>
          </div>
        </div>

        {!isLoading && processedData.pages.length > 0 && (
          <PerformanceSummaryCard summary={performanceSummary} />
        )}
      </div>

      <DataTable
        description="Detailed performance metrics across pages, locations, devices, and browsers"
        initialPageSize={15}
        isLoading={isLoading || isRefreshing}
        minHeight={400}
        tabs={tabs}
        title="Performance Analysis"
      />

      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/20">
          <p className="text-red-600 text-sm dark:text-red-400">
            Failed to load performance data. Please try refreshing.
          </p>
        </div>
      )}
    </div>
  );
}
