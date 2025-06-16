"use client";

import { useState, useMemo, useEffect, useCallback, use } from "react";
import { format, parseISO, isValid } from "date-fns";
import { toast } from "sonner";
import {
  Bug,
  AlertTriangle,
  Monitor,
  Smartphone,
  Calendar,
  MapPin,
  User,
  RotateCcw,
  Laptop,
  Tablet,
  Network,
  FileCode,
  Terminal,
  AlertCircle,
  Code,
  RefreshCw,
  ArrowLeft,
  Clock,
  Users,
  Globe,
  Activity,
  TrendingUp,
  Server,
  X
} from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Brush } from "recharts";
import { StatCard } from "@/components/analytics/stat-card";
import { DataTable } from "@/components/analytics/data-table";
import { AnimatedLoading } from "@/components/analytics/animated-loading";
import { BrowserIcon, OSIcon } from "@/components/icon";
import { CountryFlag } from "@/components/analytics/icons/CountryFlag";
import { useEnhancedErrorData } from "@/hooks/use-dynamic-query";
import type { DateRange } from "@/hooks/use-analytics";
import { EmptyState } from "../_components/utils/ui-components";
import type { DynamicQueryFilter } from "@/hooks/use-dynamic-query";

interface ErrorDetail {
  error_message: string;
  error_stack?: string;
  page_url: string;
  anonymous_id: string;
  session_id: string;
  time: string;
  browser_name: string;
  os_name: string;
  device_type: string;
  country: string;
  region?: string;
  city?: string;
}

interface ErrorSummary {
  totalErrors: number;
  uniqueErrorTypes: number;
  affectedUsers: number;
  affectedSessions: number;
  errorRate: number;
}

// Helper function to safely parse dates
const safeDateParse = (dateString: string): Date => {
  if (!dateString) return new Date();

  let date = parseISO(dateString);
  if (isValid(date)) return date;

  const isoString = dateString.replace(' ', 'T');
  date = parseISO(isoString);
  if (isValid(date)) return date;

  date = new Date(dateString);
  if (isValid(date)) return date;

  console.warn('Failed to parse date:', dateString);
  return new Date();
};

const safeFormatDate = (dateString: string, formatString: string): string => {
  try {
    const date = safeDateParse(dateString);
    return format(date, formatString);
  } catch (error) {
    console.warn('Failed to format date:', dateString, error);
    return dateString;
  }
};

// Helper function to categorize errors
const categorizeError = (errorMessage: string): { type: string; category: string; severity: 'high' | 'medium' | 'low' } => {
  if (!errorMessage) {
    return { type: 'Unknown Error', category: 'Other', severity: 'low' };
  }

  const message = errorMessage.toLowerCase();

  if (message.includes('react error #185') || message.includes('react error #418') || message.includes('react error #419')) {
    return { type: 'React Error', category: 'React', severity: 'high' };
  }
  if (message.includes('script error')) {
    return { type: 'Script Error', category: 'JavaScript', severity: 'medium' };
  }
  if (message.includes('network')) {
    return { type: 'Network Error', category: 'Network', severity: 'medium' };
  }
  if (message.includes('syntax')) {
    return { type: 'Syntax Error', category: 'JavaScript', severity: 'high' };
  }
  if (message.includes('reference')) {
    return { type: 'Reference Error', category: 'JavaScript', severity: 'high' };
  }
  if (message.includes('type')) {
    return { type: 'Type Error', category: 'JavaScript', severity: 'medium' };
  }

  return { type: 'Unknown Error', category: 'Other', severity: 'low' };
};

const getSeverityColor = (severity: 'high' | 'medium' | 'low') => {
  switch (severity) {
    case 'high': return 'bg-red-100 text-red-800 border-red-200';
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

// Get icon for error type
const getErrorTypeIcon = (type: string) => {
  if (!type) return <Bug className="h-4 w-4" />;

  const lowerType = type.toLowerCase();
  if (lowerType.includes('react')) return <Code className="h-4 w-4" />;
  if (lowerType.includes('network')) return <Network className="h-4 w-4" />;
  if (lowerType.includes('script')) return <FileCode className="h-4 w-4" />;
  if (lowerType.includes('syntax')) return <Terminal className="h-4 w-4" />;
  return <Bug className="h-4 w-4" />;
};

// Get device icon
const getDeviceIcon = (deviceType: string) => {
  if (!deviceType) return <Monitor className="h-4 w-4" />;

  switch (deviceType.toLowerCase()) {
    case 'mobile': return <Smartphone className="h-4 w-4" />;
    case 'tablet': return <Tablet className="h-4 w-4" />;
    case 'desktop': return <Laptop className="h-4 w-4" />;
    default: return <Monitor className="h-4 w-4" />;
  }
};

// Enhanced Custom Tooltip for Error Chart
const ErrorChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-background border border-border rounded-lg p-3 shadow-lg text-xs">
      <p className="font-semibold mb-2 text-foreground">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry: any) => (
          <div key={`tooltip-${entry.dataKey}-${entry.value}`} className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium text-foreground">{entry.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const normalizeData = (data: any[]): any[] =>
  data?.map((item) => ({
    ...item,
    name: item.name || 'Unknown',
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
    const safeName = name || 'Unknown';
    const displayText = formatText ? formatText(safeName) : safeName;
    return (
      <div className="flex items-center gap-2">
        {renderIcon?.(safeName)}
        <div className="font-medium max-w-xs truncate" title={safeName}>
          {displayText}
        </div>
      </div>
    );
  }
});

const errorColumns = [
  {
    id: 'total_errors',
    accessorKey: 'total_errors',
    header: 'Total Errors',
    cell: (info: any) => (info.getValue() as number)?.toLocaleString(),
  },
  {
    id: 'unique_error_types',
    accessorKey: 'unique_error_types',
    header: 'Error Types',
    cell: (info: any) => (info.getValue() as number)?.toLocaleString(),
  },
  {
    id: 'affected_users',
    accessorKey: 'affected_users',
    header: 'Affected Users',
    cell: (info: any) => (info.getValue() as number)?.toLocaleString(),
  },
  {
    id: 'affected_sessions',
    accessorKey: 'affected_sessions',
    header: 'Affected Sessions',
    cell: (info: any) => (info.getValue() as number)?.toLocaleString(),
  },
];

export default function ErrorsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const websiteId = resolvedParams.id;

  // Default to last 7 days
  const dateRange: DateRange = {
    start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    granularity: 'daily'
  };

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);

  // Chart zoom state
  const [zoomDomain, setZoomDomain] = useState<{ startIndex?: number; endIndex?: number }>({});
  const [isZoomed, setIsZoomed] = useState(false);

  // Filters state
  const [activeFilters, setActiveFilters] = useState<DynamicQueryFilter[]>([]);

  // Add a new filter
  const addFilter = (field: string, value: string | number) => {
    // Prevent adding duplicate filters
    if (activeFilters.some(f => f.field === field && f.value === value)) return;

    const newFilter: DynamicQueryFilter = { field, operator: 'eq', value };
    setActiveFilters(prev => [...prev, newFilter]);
  };

  // Remove a filter
  const removeFilter = (filterToRemove: DynamicQueryFilter) => {
    setActiveFilters(prev => prev.filter(f => !(f.field === filterToRemove.field && f.value === filterToRemove.value)));
  };

  // Clear all filters
  const clearFilters = () => {
    setActiveFilters([]);
  };

  // Fetch errors data using the enhanced hook
  const {
    results: errorResults,
    isLoading,
    refetch,
    error
  } = useEnhancedErrorData(websiteId, dateRange, {
    filters: activeFilters,
    // Ensure the query re-runs when filters change
    queryKey: ['enhancedErrorData', websiteId, dateRange, activeFilters],
  });

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success("Error data refreshed");
    } catch (error) {
      console.error("Failed to refresh data:", error);
      toast.error("Failed to refresh error data.");
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  // Reset zoom function
  const resetZoom = useCallback(() => {
    setZoomDomain({});
    setIsZoomed(false);
  }, []);

  // Handle brush change for zoom
  const handleBrushChange = useCallback((brushData: any) => {
    if (brushData && brushData.startIndex !== undefined && brushData.endIndex !== undefined) {
      setZoomDomain({
        startIndex: brushData.startIndex,
        endIndex: brushData.endIndex
      });
      setIsZoomed(true);
    }
  }, []);

  // Process all error data
  const processedData = useMemo(() => {
    if (isLoading || !errorResults || errorResults.length === 0) {
      return {
        recent_errors: [], error_types: [], errors_by_page: [], errors_by_browser: [],
        errors_by_os: [], errors_by_country: [], errors_by_device: [], error_trends: [],
        sessions_summary: []
      };
    }

    const extractData = (queryId: string) => {
      const result = errorResults.find((r: any) => r.queryId === queryId);
      if (!result) {
        return [];
      }

      const dataObject = result.data;

      if (!dataObject || typeof dataObject !== 'object' || Array.isArray(dataObject)) {
        return [];
      }

      const finalData = dataObject[queryId];

      if (!Array.isArray(finalData)) {
        return [];
      }

      return normalizeData(finalData);
    };

    const data = {
      recent_errors: extractData('recent_errors'),
      error_types: extractData('error_types'),
      errors_by_page: extractData('errors_by_page'),
      errors_by_browser: extractData('errors_by_browser'),
      errors_by_os: extractData('errors_by_os'),
      errors_by_country: extractData('errors_by_country'),
      errors_by_device: extractData('errors_by_device'),
      error_trends: extractData('error_trends'),
      sessions_summary: extractData('sessions_summary'),
    };

    return data;
  }, [errorResults, isLoading]);

  // Calculate error summary
  const errorSummary = useMemo((): ErrorSummary => {
    const recentErrors = processedData.recent_errors;
    const errorTypes = processedData.error_types;

    const summaryData = processedData.sessions_summary?.[0] || { total_sessions: 0, total_users: 0 };

    if (!recentErrors.length && !errorTypes.length) {
      return { totalErrors: 0, uniqueErrorTypes: 0, affectedUsers: 0, affectedSessions: 0, errorRate: 0 };
    }

    const totalErrors = errorTypes.reduce((sum: number, type: any) => sum + (type.total_occurrences || 0), 0);
    const uniqueErrorTypes = errorTypes.length;
    const affectedUsers = errorTypes.reduce((sum: number, type: any) => sum + (type.affected_users || 0), 0);
    const affectedSessions = errorTypes.reduce((sum: number, type: any) => sum + (type.affected_sessions || 0), 0);

    const errorRate = summaryData.total_sessions > 0
      ? (affectedSessions / summaryData.total_sessions) * 100
      : 0;

    return {
      totalErrors,
      uniqueErrorTypes,
      affectedUsers,
      affectedSessions,
      errorRate
    };
  }, [processedData]);

  // Find the top error
  const topError = useMemo(() => {
    if (!processedData.error_types?.length) return null;

    return processedData.error_types.reduce((max, error) =>
      (error.total_occurrences > max.total_occurrences) ? error : max,
      processedData.error_types[0]
    );
  }, [processedData.error_types]);

  // Chart data for error trends
  const errorChartData = useMemo(() => {
    if (!processedData.error_trends?.length) return [];

    return processedData.error_trends.map((point: any) => ({
      date: safeFormatDate(point.date, 'MMM d'),
      'Total Errors': point.total_errors || 0,
      'Affected Users': point.affected_users || 0,
    }));
  }, [processedData.error_trends]);

  // Process recent errors for display
  const processedRecentErrors = useMemo(() => {
    if (!processedData.recent_errors?.length) return [];

    const errorMap = new Map();

    for (const error of processedData.recent_errors) {
      // Add null check for error_message
      if (!error || !error.error_message) continue;

      const { type, category, severity } = categorizeError(error.error_message);
      const key = `${type}-${error.error_message}`;

      if (errorMap.has(key)) {
        const existing = errorMap.get(key);
        existing.count += 1;
        existing.sessions.add(error.session_id);
        if (new Date(error.time) > new Date(existing.last_occurrence)) {
          existing.last_occurrence = error.time;
        }
      } else {
        errorMap.set(key, {
          error_type: type,
          category,
          severity,
          error_message: error.error_message,
          count: 1,
          unique_sessions: 1,
          sessions: new Set([error.session_id]),
          last_occurrence: error.time,
          sample_error: error
        });
      }
    }

    return Array.from(errorMap.values())
      .map(error => ({
        ...error,
        unique_sessions: error.sessions.size
      }))
      .sort((a, b) => b.count - a.count);
  }, [processedData.recent_errors]);

  // Define tabs for data tables
  const errorTabs = useMemo(() => [
    {
      id: 'error_types',
      label: 'Error Types',
      data: processedData.error_types.map((item: any, i: number) => ({ ...item, _uniqueKey: `error-type-${i}` })),
      columns: [
        {
          id: 'name',
          accessorKey: 'name',
          header: 'Error Message',
          cell: (info: any) => {
            const message = info.getValue() as string;
            if (!message) {
              return (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Bug className="h-4 w-4" />
                    <Badge className="bg-gray-100 text-gray-800 border-gray-200">
                      Unknown Error
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">No error message available</p>
                </div>
              );
            }

            const { type, severity } = categorizeError(message);
            return (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  {getErrorTypeIcon(type)}
                  <Badge className={getSeverityColor(severity)}>
                    {type}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 max-w-md" title={message}>
                  {message}
                </p>
              </div>
            );
          }
        },
        {
          id: 'total_occurrences',
          accessorKey: 'total_occurrences',
          header: 'Occurrences',
          cell: (info: any) => (info.getValue() as number)?.toLocaleString(),
        },
        {
          id: 'affected_users',
          accessorKey: 'affected_users',
          header: 'Users',
          cell: (info: any) => (info.getValue() as number)?.toLocaleString(),
        },
        {
          id: 'affected_sessions',
          accessorKey: 'affected_sessions',
          header: 'Sessions',
          cell: (info: any) => (info.getValue() as number)?.toLocaleString(),
        },
        {
          id: 'last_occurrence',
          accessorKey: 'last_occurrence',
          header: 'Last Seen',
          cell: (info: any) => safeFormatDate(info.getValue(), 'MMM d, HH:mm'),
        },
      ],
    },
    {
      id: 'errors_by_page',
      label: 'By Page',
      data: processedData.errors_by_page.map((item: any, i: number) => ({ ...item, _uniqueKey: `page-${i}` })),
      columns: [
        createNameColumn('Page', undefined, (name) => {
          try {
            return name.startsWith('http') ? new URL(name).pathname : name;
          } catch {
            return name.startsWith('/') ? name : `/${name}`;
          }
        }),
        ...errorColumns
      ],
    },
    {
      id: 'errors_by_browser',
      label: 'By Browser',
      data: processedData.errors_by_browser.map((item: any, i: number) => ({ ...item, _uniqueKey: `browser-${i}` })),
      columns: [
        createNameColumn('Browser', (name) => <BrowserIcon name={name} size="sm" />),
        ...errorColumns
      ],
    },
    {
      id: 'errors_by_os',
      label: 'By OS',
      data: processedData.errors_by_os.map((item: any, i: number) => ({ ...item, _uniqueKey: `os-${i}` })),
      columns: [
        createNameColumn('Operating System', (name) => <OSIcon name={name} size="sm" />),
        ...errorColumns
      ],
    },
    {
      id: 'errors_by_country',
      label: 'By Country',
      data: processedData.errors_by_country.map((item: any, i: number) => ({ ...item, _uniqueKey: `country-${i}` })),
      columns: [
        createNameColumn('Country', (name) => <CountryFlag country={name} size={16} />),
        ...errorColumns
      ],
    },
    {
      id: 'errors_by_device',
      label: 'By Device',
      data: processedData.errors_by_device.map((item: any, i: number) => ({ ...item, _uniqueKey: `device-${i}` })),
      columns: [
        createNameColumn('Device Type', (name) => {
          if (!name) return <Monitor className="h-4 w-4 text-gray-500" />;

          const device = name.toLowerCase();
          return device.includes('mobile') || device.includes('phone') ?
            <Smartphone className="h-4 w-4 text-blue-500" /> :
            device.includes('tablet') ?
              <Tablet className="h-4 w-4 text-purple-500" /> :
              <Monitor className="h-4 w-4 text-gray-500" />;
        }),
        ...errorColumns
      ],
    },
  ], [processedData]);

  // Handle loading progress animation
  useEffect(() => {
    if (isLoading) {
      const intervals = [
        { target: 20, duration: 800 },
        { target: 45, duration: 1300 },
        { target: 70, duration: 1800 },
        { target: 90, duration: 2000 }
      ];

      const cleanup: NodeJS.Timeout[] = [];

      intervals.forEach((interval, index) => {
        const timeout = setTimeout(() => {
          setLoadingProgress(interval.target);
        }, interval.duration * (index === 0 ? 1 : index));

        cleanup.push(timeout);
      });

      return () => {
        for (const timeout of cleanup) {
          clearTimeout(timeout);
        }
      };
    }

    setLoadingProgress(100);
    const timeout = setTimeout(() => {
      setLoadingProgress(0);
    }, 1000);

    return () => clearTimeout(timeout);
  }, [isLoading]);

  // Show error state
  if (error && !isLoading) {
    return (
      <div className="p-3 sm:p-4 lg:p-6 max-w-[1600px] mx-auto space-y-6">
        <div className="border-b bg-gradient-to-r from-background via-background to-muted/20 -mx-3 sm:-mx-4 lg:-mx-6 px-3 sm:px-4 lg:px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.back()}
                  className="p-2 rounded-lg hover:bg-muted/50"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                  <Bug className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Error Analytics</h1>
                  <p className="text-muted-foreground text-sm sm:text-base">Monitor and analyze errors affecting your website</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center text-center space-y-3">
          <div className="p-3 rounded-full bg-destructive/10 border border-destructive/20">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <h4 className="font-semibold text-destructive">Error loading error data</h4>
            <p className="text-destructive/80 text-sm mt-1">Unable to load error analytics for this website.</p>
          </div>
          <Button
            onClick={() => router.back()}
            variant="outline"
            size="sm"
            className="gap-2 rounded-lg"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Show empty state
  if (!isLoading && (!processedData.recent_errors?.length && !processedData.error_types?.length)) {
    return (
      <div className="p-3 sm:p-4 lg:p-6 max-w-[1600px] mx-auto space-y-6">
        <div className="border-b bg-gradient-to-r from-background via-background to-muted/20 -mx-3 sm:-mx-4 lg:-mx-6 px-3 sm:px-4 lg:px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.back()}
                  className="p-2 rounded-lg hover:bg-muted/50"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                  <Bug className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Error Analytics</h1>
                  <p className="text-muted-foreground text-sm sm:text-base">Monitor and analyze errors affecting your website</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <EmptyState
          icon={<Bug className="h-10 w-10" />}
          title="No errors detected"
          description="We haven't detected any errors on your website during this time period."
          action={
            <Button onClick={handleRefresh} variant="outline" className="gap-2 rounded-lg">
              <RefreshCw className="h-4 w-4" />
              Refresh Data
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-background via-background to-muted/20 -mx-3 sm:-mx-4 lg:-mx-6 px-3 sm:px-4 lg:px-6 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="p-2 rounded-lg hover:bg-muted/50"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                <Bug className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Error Analytics</h1>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Monitor and analyze errors affecting your website
                </p>
              </div>
            </div>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
            variant="outline"
            size="default"
            className="gap-2 rounded-lg px-4 py-2 font-medium border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Active Filters Display */}
      {activeFilters.length > 0 && (
        <div className="p-3 bg-muted/50 rounded-lg border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">Active Filters:</span>
              {activeFilters.map((filter) => (
                <Badge key={filter.field} variant="secondary" className="flex items-center gap-1">
                  <span className="font-normal">{filter.field}:</span>
                  <span>{filter.value}</span>
                  <button type="button" onClick={() => removeFilter(filter)} className="ml-1 p-0.5 rounded-full hover:bg-muted-foreground/20">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">Clear All</Button>
          </div>
        </div>
      )}

      {isLoading && !processedData.error_types?.length ? (
        <AnimatedLoading type="errors" progress={loadingProgress} />
      ) : (
        <>
          {/* Summary Stats & Chart */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Error Overview</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Left Column: Error Trends Chart */}
              <div className="lg:col-span-2">
                {errorChartData.length > 0 ? (
                  <div className="rounded-lg border shadow-sm h-full flex flex-col">
                    <div className="p-3 border-b flex flex-col sm:flex-row justify-between items-start gap-2">
                      <div>
                        <h3 className="text-base font-semibold">Error Trends</h3>
                        <p className="text-xs text-muted-foreground">
                          Error occurrences and impact over time
                        </p>
                      </div>
                      {errorChartData.length > 5 && (
                        <div className="flex items-center gap-2">
                          {isZoomed && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={resetZoom}
                              className="h-7 px-2 text-xs"
                            >
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Reset Zoom
                            </Button>
                          )}
                          <div className="text-xs text-muted-foreground">
                            Drag to zoom
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-2 flex-1">
                      <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={errorChartData}
                            margin={{ top: 10, right: 10, left: 0, bottom: errorChartData.length > 5 ? 35 : 5 }}
                          >
                            <defs>
                              <linearGradient id="colorTotalErrors" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
                              </linearGradient>
                              <linearGradient id="colorAffectedUsers" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} dy={5} />
                            <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} width={30} tickFormatter={(value) => {
                              if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                              if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
                              return value.toString();
                            }} />
                            <Tooltip content={<ErrorChartTooltip />} wrapperStyle={{ outline: 'none' }} />
                            <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '5px', bottom: errorChartData.length > 5 ? 20 : 0 }} iconType="circle" iconSize={8} />
                            <Area type="monotone" dataKey="Total Errors" stroke="#ef4444" fillOpacity={1} fill="url(#colorTotalErrors)" strokeWidth={2} name="Total Errors" />
                            <Area type="monotone" dataKey="Affected Users" stroke="#f59e0b" fillOpacity={1} fill="url(#colorAffectedUsers)" strokeWidth={2} name="Affected Users" />
                            {errorChartData.length > 5 && (
                              <Brush dataKey="date" padding={{ top: 5, bottom: 5 }} height={25} stroke="var(--border)" fill="var(--muted)" fillOpacity={0.1} onChange={handleBrushChange} startIndex={zoomDomain.startIndex} endIndex={zoomDomain.endIndex} />
                            )}
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border shadow-sm h-full flex items-center justify-center p-6 bg-muted/20">
                    <div className="text-center">
                      <Bug className="mx-auto h-8 w-8 text-muted-foreground" />
                      <h3 className="mt-2 text-sm font-medium text-muted-foreground">No error trend data</h3>
                      <p className="mt-1 text-xs text-muted-foreground">Not enough data to display a trend chart.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: KPIs and Top Error */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <StatCard
                    title="Total Errors"
                    value={errorSummary.totalErrors.toLocaleString()}
                    icon={AlertTriangle}
                    isLoading={isLoading}
                    variant="danger"
                    description="All error occurrences"
                  />
                  <StatCard
                    title="Error Rate"
                    value={`${errorSummary.errorRate.toFixed(2)}%`}
                    icon={TrendingUp}
                    isLoading={isLoading}
                    variant="danger"
                    description="Error sessions"
                  />
                  <StatCard
                    title="Affected Users"
                    value={errorSummary.affectedUsers.toLocaleString()}
                    icon={Users}
                    isLoading={isLoading}
                    variant="warning"
                    description="Unique users with errors"
                  />
                  <StatCard
                    title="Affected Sessions"
                    value={errorSummary.affectedSessions.toLocaleString()}
                    icon={Activity}
                    isLoading={isLoading}
                    variant="warning"
                    description="Unique sessions with errors"
                  />
                </div>

                {topError && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Bug className="h-5 w-5 text-yellow-500" />
                        Most Frequent Error
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm font-medium line-clamp-2" title={topError.name}>{topError.name}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-3">
                        <span className="flex items-center gap-1 font-semibold">
                          <AlertCircle className="h-3 w-3" />
                          {topError.total_occurrences.toLocaleString()} times
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {topError.affected_users.toLocaleString()} users
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>

          {/* Recent Errors List */}
          {processedRecentErrors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Error Types</CardTitle>
                <CardDescription>Latest error occurrences grouped by type. Click to see details.</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {processedRecentErrors.slice(0, 15).map((error, index) => (
                    <AccordionItem value={`item-${index}`} key={`${error.error_message}-${index}`}>
                      <AccordionTrigger className="p-3 text-left hover:bg-muted/50 transition-colors rounded-md">
                        <div className="flex items-start gap-3 w-full">
                          <div className="mt-1">
                            {getErrorTypeIcon(error.error_type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={getSeverityColor(error.severity)}>
                                {error.error_type}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {error.category}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {error.error_message}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                {error.count}
                              </span>
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {error.unique_sessions}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {safeFormatDate(error.last_occurrence, 'MMM d, HH:mm')}
                              </span>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-sm font-semibold">{error.count}</div>
                            <div className="text-xs text-muted-foreground">errors</div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 p-4 border-t">
                          {/* Error Message */}
                          <Card className="p-3">
                            <h4 className="font-medium mb-2 flex items-center gap-2 text-sm">
                              <Code className="h-4 w-4" />
                              Full Error Message
                            </h4>
                            <div className="bg-muted/50 p-3 rounded-md">
                              <p className="text-sm font-mono break-words">{error.sample_error?.error_message || 'No error message available'}</p>
                            </div>
                          </Card>

                          {/* Stack Trace */}
                          {error.sample_error?.error_stack && (
                            <Card className="p-3">
                              <h4 className="font-medium mb-2 flex items-center gap-2 text-sm">
                                <Terminal className="h-4 w-4" />
                                Stack Trace
                              </h4>
                              <div className="bg-muted/50 p-3 rounded-md max-h-60 overflow-y-auto">
                                <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                                  {error.sample_error?.error_stack || 'No stack trace available'}
                                </pre>
                              </div>
                            </Card>
                          )}

                          {/* Error Overview */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Card className="p-3">
                              <h4 className="font-medium mb-2 flex items-center gap-2 text-sm">
                                <AlertTriangle className="h-4 w-4" />
                                Context
                              </h4>
                              <div className="space-y-2">
                                <div>
                                  <div className="text-xs font-medium text-muted-foreground mb-0.5">Last Seen</div>
                                  <p className="text-sm">{safeFormatDate(error.sample_error?.time || '', 'MMM d, yyyy HH:mm:ss')}</p>
                                </div>
                                <div>
                                  <div className="text-xs font-medium text-muted-foreground mb-0.5">Page URL</div>
                                  <p className="text-sm break-all">{error.sample_error?.page_url || 'Unknown'}</p>
                                </div>
                              </div>
                            </Card>

                            <Card className="p-3">
                              <h4 className="font-medium mb-2 flex items-center gap-2 text-sm">
                                <User className="h-4 w-4" />
                                User & Device
                              </h4>
                              <div className="space-y-2">
                                <div>
                                  <div className="text-xs font-medium text-muted-foreground mb-0.5">User ID</div>
                                  <p className="text-sm font-mono">{error.sample_error?.anonymous_id || 'Unknown'}</p>
                                </div>
                                <div>
                                  <div className="text-xs font-medium text-muted-foreground mb-0.5">Device</div>
                                  <p className="text-sm flex items-center gap-1">
                                    {getDeviceIcon(error.sample_error?.device_type)}
                                    {error.sample_error?.device_type || 'Unknown'} • {error.sample_error?.browser_name || 'Unknown'} • {error.sample_error?.os_name || 'Unknown'}
                                  </p>
                                </div>
                                <div>
                                  <div className="text-xs font-medium text-muted-foreground mb-0.5">Location</div>
                                  <p className="text-sm flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {error.sample_error?.city && error.sample_error?.country
                                      ? `${error.sample_error?.city}, ${error.sample_error?.country}`
                                      : error.sample_error?.country || 'Unknown'
                                    }
                                  </p>
                                </div>
                              </div>
                            </Card>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          )}

          {/* Error Analysis Tables */}
          <DataTable
            tabs={errorTabs}
            title="Error Analysis"
            description="Comprehensive error breakdown across different dimensions"
            isLoading={isLoading || isRefreshing}
            initialPageSize={15}
            minHeight={400}
            onRowClick={(field, value) => addFilter(field, value)}
          />
        </>
      )}
    </div>
  );
} 