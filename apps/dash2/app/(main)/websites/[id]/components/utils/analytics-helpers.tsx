import { format, formatDistanceToNow, parseISO, isValid } from "date-fns";
import { toast } from "sonner";
import { DateRange } from "@/hooks/use-analytics";

type Granularity = 'daily' | 'hourly';

interface DataItem {
  [key: string]: any;
}

interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

// Helper to handle generic data refresh
export const handleDataRefresh = async (
  isRefreshing: boolean,
  refetchFn: () => Promise<any>,
  setIsRefreshing: (value: boolean) => void,
  successMessage = "Data has been updated"
): Promise<void> => {
  if (!isRefreshing) return;
  
  try {
    await refetchFn();
    // toast(successMessage);
  } catch (error) {
    toast.error("Failed to refresh data");
    console.error(error);
  } finally {
    setIsRefreshing(false);
  }
};

// Safe date parsing with fallback
export const safeParseDate = (date: string | Date | null | undefined): Date => {
  if (!date) return new Date();
  
  if (typeof date === 'object' && date instanceof Date) {
    return isValid(date) ? date : new Date();
  }
  
  try {
    const parsed = parseISO(date.toString());
    return isValid(parsed) ? parsed : new Date();
  } catch {
    return new Date();
  }
};

// Format date for display based on granularity
export const formatDateByGranularity = (
  date: string | Date, 
  granularity: Granularity = 'daily'
): string => {
  const dateObj = safeParseDate(date);
  return granularity === 'hourly' 
    ? format(dateObj, 'MMM d, hh:mm a')
    : format(dateObj, 'MMM d');
};

// Create metric visibility toggles state
export const createMetricToggles = <T extends string>(initialMetrics: T[]): Record<T, boolean> => {
  const initialState = {} as Record<T, boolean>;
  for (const metric of initialMetrics) {
    initialState[metric] = true;
  }
  return initialState;
};

// Format data for distribution charts
export const formatDistributionData = <T extends DataItem>(
  data: T[] | undefined,
  nameField: keyof T,
  valueField: keyof T = 'visitors' as keyof T
): ChartDataPoint[] => {
  if (!data?.length) return [];
  
  return data.map((item) => ({
    name: typeof item[nameField] === 'string' 
      ? (item[nameField] as string)?.charAt(0).toUpperCase() + (item[nameField] as string)?.slice(1) || 'Unknown'
      : String(item[nameField] || 'Unknown'),
    value: Number(item[valueField]) || 0
  }));
};

// Group browser data by name
export const groupBrowserData = (browserVersions: Array<{ browser: string; visitors: number }> | undefined): ChartDataPoint[] => {
  if (!browserVersions?.length) return [];
  
  const browserCounts = browserVersions.reduce((acc, item) => {
    const browserName = item.browser;
    if (!acc[browserName]) {
      acc[browserName] = { visitors: 0 };
    }
    acc[browserName].visitors += item.visitors;
    return acc;
  }, {} as Record<string, { visitors: number }>);
  
  return Object.entries(browserCounts as Record<string, { visitors: number }>).map(([browser, data]) => ({
    name: browser,
    value: data.visitors
  }));
};

// Get color variant based on threshold values
export const getColorVariant = (
  value: number,
  dangerThreshold: number,
  warningThreshold: number
): "danger" | "warning" | "success" => {
  if (value > dangerThreshold) return "danger";
  if (value > warningThreshold) return "warning";
  return "success";
};

// Format domain links
export const formatDomainLink = (
  path: string,
  domain?: string,
  maxLength = 30
): { href: string; display: string; title: string } => {
  const displayPath = path.length > maxLength 
    ? `${path.slice(0, maxLength - 3)}...` 
    : path;
  
  return {
    href: domain ? `${domain}${path}` : `#${path}`,
    display: displayPath,
    title: domain ? `${domain}${path}` : path
  };
};

// Format relative time (e.g., "2 hours ago")
export const formatRelativeTime = (date: string | Date): string => {
  const dateObj = safeParseDate(date);
  return formatDistanceToNow(dateObj, { addSuffix: true });
};

// Format number with metric prefix (K, M, B)
export const formatMetricNumber = (num: number): string => {
  if (num === undefined || num === null) return '0';
  
  if (num >= 1000000000) {
    return `${(num / 1000000000).toFixed(1)}B`;
  }
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

// Calculate percentage change
export const calculatePercentChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

// Format percentage change with + or - sign
export const formatPercentChange = (change: number): string => {
  const sign = change > 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
};

// Performance Metrics Thresholds
export const PERFORMANCE_THRESHOLDS = {
  load_time: { good: 1500, average: 3000, unit: 'ms' },
  ttfb: { good: 500, average: 1000, unit: 'ms' },
  dom_ready: { good: 1000, average: 2000, unit: 'ms' },
  render_time: { good: 1000, average: 2000, unit: 'ms' },
  fcp: { good: 1800, average: 3000, unit: 'ms' },
  lcp: { good: 2500, average: 4000, unit: 'ms' },
  cls: { good: 0.1, average: 0.25, unit: '' }
}; 