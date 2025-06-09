"use client";

import { useEffect, useMemo } from "react";
import { Monitor, Smartphone, Zap, MapPin, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";
import { DataTable } from "@/components/analytics/data-table";
import { useEnhancedPerformanceData } from "@/hooks/use-dynamic-query";
import type { FullTabProps } from "../utils/types";
import { BrowserIcon, OSIcon } from "@/components/icon";
import { CountryFlag } from "@/components/analytics/icons/CountryFlag";

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

function PerformanceMetricCell({ value, type = 'time' }: { value?: number; type?: 'time' | 'cls' }) {
  if (!value || value === 0) {
    return <span className="text-muted-foreground">N/A</span>;
  }
  
  let formatted: string;
  let colorClass: string;
  let showIcon = false;
  
  if (type === 'cls') {
    // CLS is a score (0-1, lower is better)
    formatted = value.toFixed(3);
    colorClass = value < 0.1 ? "text-green-600" : value < 0.25 ? "text-yellow-600" : "text-red-400";
    showIcon = value < 0.1 || value >= 0.25;
  } else {
    // Time-based metrics
    formatted = value < 1000 ? `${Math.round(value)}ms` : `${(value / 1000).toFixed(2)}s`;
    colorClass = value < 1000 ? "text-green-600" : value < 3000 ? "text-yellow-600" : "text-red-400";
    showIcon = value < 1000 || value >= 3000;
  }
  
  return (
    <div className="flex items-center gap-1">
      <span className={colorClass}>{formatted}</span>
      {showIcon && value < (type === 'cls' ? 0.1 : 1000) && <CheckCircle className="h-3 w-3 text-green-600" />}
      {showIcon && value >= (type === 'cls' ? 0.25 : 3000) && <AlertTriangle className="h-3 w-3 text-red-400" />}
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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="p-4 rounded-lg border bg-background">
        <div className="flex items-center gap-2 mb-2">
          {getScoreIcon(summary.performanceScore)}
          <span className="text-sm font-medium text-muted-foreground">Performance Score</span>
        </div>
        <div className="text-2xl font-bold">{summary.performanceScore}/100</div>
      </div>
      
      <div className="p-4 rounded-lg border bg-background">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium text-muted-foreground">Avg Load Time</span>
        </div>
        <div className="text-2xl font-bold">
          {summary.avgLoadTime < 1000 
            ? `${Math.round(summary.avgLoadTime)}ms` 
            : `${(summary.avgLoadTime / 1000).toFixed(1)}s`
          }
        </div>
      </div>
      
      <div className="p-4 rounded-lg border bg-background">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className="text-sm font-medium text-muted-foreground">Fast Pages</span>
        </div>
        <div className="text-2xl font-bold text-green-600">
          {summary.fastPages}
          <span className="text-sm text-muted-foreground ml-1">
            ({Math.round((summary.fastPages / summary.totalPages) * 100)}%)
          </span>
        </div>
      </div>
      
      <div className="p-4 rounded-lg border bg-background">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <span className="text-sm font-medium text-muted-foreground">Slow Pages</span>
        </div>
        <div className="text-2xl font-bold text-red-600">
          {summary.slowPages}
          <span className="text-sm text-muted-foreground ml-1">
            ({Math.round((summary.slowPages / summary.totalPages) * 100)}%)
          </span>
        </div>
      </div>
    </div>
  );
}

const normalizeData = (data: any[]): PerformanceEntry[] => 
  data?.map((item) => ({
    name: item.name || 'Unknown',
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
  id: 'name',
  accessorKey: 'name',
  header,
  cell: (info: any) => {
    const name = info.getValue() as string;
    const displayText = formatText ? formatText(name) : name;
    return (
      <div className="flex items-center gap-2">
        {renderIcon?.(name)}
        <div className="font-medium max-w-xs truncate" title={name}>
          {displayText}
        </div>
      </div>
    );
  }
});

const performanceColumns = [
  {
    id: 'visitors',
    accessorKey: 'visitors',
    header: 'Visitors',
    cell: (info: any) => (info.getValue() as number)?.toLocaleString(),
  },
  {
    id: 'avg_load_time',
    accessorKey: 'avg_load_time',
    header: 'Load Time',
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
    id: 'avg_ttfb',
    accessorKey: 'avg_ttfb',
    header: 'TTFB',
    cell: (info: any) => <PerformanceMetricCell value={info.getValue()} />,
  },
  {
    id: 'avg_dom_ready_time',
    accessorKey: 'avg_dom_ready_time',
    header: 'DOM Ready',
    cell: (info: any) => <PerformanceMetricCell value={info.getValue()} />,
  },
];

export function WebsitePerformanceTab({
  websiteId,
  dateRange,
  isRefreshing,
  setIsRefreshing
}: FullTabProps) {
  
  const {
    results: performanceResults,
    isLoading,
    refetch,
    error
  } = useEnhancedPerformanceData(websiteId, dateRange);

  useEffect(() => {
    if (isRefreshing) {
      refetch().finally(() => setIsRefreshing(false));
    }
  }, [isRefreshing, refetch, setIsRefreshing]);

  const processedData = useMemo(() => {
    if (!performanceResults?.length) {
      return { pages: [], countries: [], devices: [], browsers: [], operating_systems: [], regions: [] };
    }

    return {
      pages: normalizeData(performanceResults.find(r => r.queryId === 'pages')?.data?.slow_pages)
        ?.sort((a, b) => a.avg_load_time - b.avg_load_time), // Sort by fastest first
      countries: normalizeData(performanceResults.find(r => r.queryId === 'countries')?.data?.performance_by_country)
        ?.sort((a, b) => a.avg_load_time - b.avg_load_time),
      devices: normalizeData(performanceResults.find(r => r.queryId === 'devices')?.data?.performance_by_device)
        ?.sort((a, b) => a.avg_load_time - b.avg_load_time),
      browsers: normalizeData(performanceResults.find(r => r.queryId === 'browsers')?.data?.performance_by_browser)
        ?.sort((a, b) => a.avg_load_time - b.avg_load_time),
      operating_systems: normalizeData(performanceResults.find(r => r.queryId === 'operating_systems')?.data?.performance_by_os)
        ?.sort((a, b) => a.avg_load_time - b.avg_load_time),
      regions: normalizeData(performanceResults.find(r => r.queryId === 'regions')?.data?.performance_by_region)
        ?.sort((a, b) => a.avg_load_time - b.avg_load_time),
    };
  }, [performanceResults]);

  // Calculate performance summary
  const performanceSummary = useMemo((): PerformanceSummary => {
    const pages = processedData.pages;
    if (!pages.length) {
      return { avgLoadTime: 0, fastPages: 0, slowPages: 0, totalPages: 0, performanceScore: 0 };
    }

    const totalLoadTime = pages.reduce((sum: number, page: PerformanceEntry) => sum + page.avg_load_time, 0);
    const avgLoadTime = totalLoadTime / pages.length;
    const fastPages = pages.filter(page => page.avg_load_time < 1000).length;
    const slowPages = pages.filter(page => page.avg_load_time > 3000).length;
    
    // Calculate performance score (0-100)
    const fastPercentage = fastPages / pages.length;
    const slowPercentage = slowPages / pages.length;
    const performanceScore = Math.round((fastPercentage * 100) - (slowPercentage * 50));

    return {
      avgLoadTime,
      fastPages,
      slowPages,
      totalPages: pages.length,
      performanceScore: Math.max(0, Math.min(100, performanceScore))
    };
  }, [processedData.pages]);

  const tabs = useMemo(() => [
    {
      id: 'pages',
      label: 'Pages',
      data: processedData.pages.map((item, i) => ({ ...item, _uniqueKey: `page-${i}` })),
      columns: [
        createNameColumn('Page', undefined, (name) => {
          try {
            return name.startsWith('http') ? new URL(name).pathname : name;
          } catch {
            return name.startsWith('/') ? name : `/${name}`;
          }
        }),
        ...performanceColumns
      ],
    },
    {
      id: 'countries',
      label: 'Countries',
      data: processedData.countries.map((item, i) => ({ ...item, _uniqueKey: `country-${i}` })),
      columns: [
        createNameColumn('Country', (name) => <CountryFlag country={name} size={16} />),
        ...performanceColumns
      ],
    },
    {
      id: 'regions',
      label: 'Regions',
      data: processedData.regions.map((item, i) => ({ ...item, _uniqueKey: `region-${i}` })),
      columns: [
        createNameColumn('Region', () => <MapPin className="h-4 w-4 text-primary" />),
        ...performanceColumns
      ],
    },
    {
      id: 'devices',
      label: 'Device Types',
      data: processedData.devices.map((item, i) => ({ ...item, _uniqueKey: `device-${i}` })),
      columns: [
        createNameColumn('Device Type', (name) => {
          const device = name.toLowerCase();
          return device.includes('mobile') || device.includes('phone') ? 
            <Smartphone className="h-4 w-4 text-blue-500" /> :
            device.includes('tablet') ?
            <Monitor className="h-4 w-4 text-purple-500" /> :
            <Monitor className="h-4 w-4 text-gray-500" />;
        }),
        ...performanceColumns
      ],
    },
    {
      id: 'browsers',
      label: 'Browsers',
      data: processedData.browsers.map((item, i) => ({ ...item, _uniqueKey: `browser-${i}` })),
      columns: [
        createNameColumn('Browser', (name) => <BrowserIcon name={name} size="sm" />),
        ...performanceColumns
      ],
    },
    {
      id: 'operating_systems',
      label: 'Operating Systems',
      data: processedData.operating_systems.map((item, i) => ({ ...item, _uniqueKey: `os-${i}` })),
      columns: [
        createNameColumn('Operating System', (name) => <OSIcon name={name} size="sm" />),
        ...performanceColumns
      ],
    },
  ], [processedData]);

  return (
    <div className="space-y-4">
      <div className="p-4 bg-muted/20 rounded border">
        <div className="flex gap-2 items-start mb-4">
          <Zap className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
          <div>
            <p className="font-medium text-foreground mb-1">Performance Overview</p>
            <p className="text-xs text-muted-foreground">
              Core Web Vitals and performance metrics. 
              <span className="text-green-600 font-medium">Good</span>, 
              <span className="text-yellow-600 font-medium ml-1">Needs Improvement</span>, 
              <span className="text-red-600 font-medium ml-1">Poor</span> ratings.
            </p>
          </div>
        </div>
        
        {!isLoading && processedData.pages.length > 0 && (
          <PerformanceSummaryCard summary={performanceSummary} />
        )}
      </div>

      <DataTable 
        tabs={tabs}
        title="Performance Analysis"
        description="Detailed performance metrics across pages, locations, devices, and browsers"
        isLoading={isLoading || isRefreshing}
        initialPageSize={15}
        minHeight={400}
      />

      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-600 dark:text-red-400">
            Failed to load performance data. Please try refreshing.
          </p>
        </div>
      )}
    </div>
  );
} 