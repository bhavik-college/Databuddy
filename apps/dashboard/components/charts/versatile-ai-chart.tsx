import { useMemo, useState, useCallback } from "react";
import {
  AreaChart, Area,
  BarChart, Bar,
  LineChart as RechartsLineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Brush
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkeletonChart } from "./skeleton-chart";
import { LineChartIcon as LucideLineChartIcon, RotateCcw } from "lucide-react";

const METRIC_COLORS: Record<string, string> = {
  pageviews: "#3b82f6",
  visitors: "#22c55e",
  sessions: "#a855f7",
  desktop: "#3b82f6",
  mobile: "#22c55e",
  tablet: "#f97316",
  chrome: "#3b82f6",
  firefox: "#f97316",
  safari: "#22c55e",
  edge: "#a855f7",
  avg_load_time: "#ef4444",
  default: "#6b7280",
  count: "#ef4444",
  value: "#f97316",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  const formatDuration = (seconds: number): string => {
    if (seconds < 0 || Number.isNaN(seconds)) return 'N/A';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    let result = '';
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0 || hours > 0) result += `${minutes}m `;
    if (remainingSeconds >= 0 || (hours === 0 && minutes === 0)) result += `${remainingSeconds}s`;
    return result.trim() || '0s';
  };

  // Format the label for better display
  const formatLabel = (rawLabel: string): string => {
    // If it's a URL path, clean it up
    if (typeof rawLabel === 'string' && rawLabel.startsWith('/')) {
      if (rawLabel === '/') return 'Home';
      return rawLabel.substring(1); // Remove leading slash
    }
    return String(rawLabel);
  };

  return (
    <div className="bg-background border border-border p-3 shadow-md text-xs rounded-sm">
      <p className="font-semibold mb-2 text-foreground">{formatLabel(String(label))}</p>
      <div className="space-y-1.5">
        {payload.map((entry: any) => {
          const dataPoint = entry.payload;
          let displayValue: string;
          const entryNameLower = entry.name.toLowerCase();

          if (entryNameLower.includes('bounce rate')) {
            displayValue = `${Number(entry.value).toFixed(1)}%`;
          } else if (entryNameLower.includes('duration') || entryNameLower.includes('time')) {
            displayValue = dataPoint[`${entry.name}_formatted`] || formatDuration(Number(entry.value));
          } else {
            displayValue = typeof entry.value === 'number' ? entry.value.toLocaleString() : String(entry.value);
          }

          return (
            <div key={`item-${entry.name}-${entry.value}`} className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: entry.color || METRIC_COLORS[entryNameLower as keyof typeof METRIC_COLORS] || METRIC_COLORS.default }}
              />
              <span className="text-muted-foreground capitalize">
                {(() => {
                  const cleanName = entry.name.replace(/_/g, ' ').toLowerCase();
                  if (cleanName === 'count' || cleanName === 'pageviews') return 'Page Views';
                  if (cleanName === 'visitors' || cleanName === 'unique visitors') return 'Visitors';
                  if (cleanName === 'sessions') return 'Sessions';
                  if (cleanName === 'bounce rate') return 'Bounce Rate';
                  if (cleanName.includes('load time')) return 'Load Time';
                  if (cleanName.includes('duration')) return 'Duration';
                  return entry.name.replace(/_/g, ' ');
                })()}:
              </span>
              <span className="font-medium text-foreground">{displayValue}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export type VersatileChartType = 'line' | 'area' | 'bar' | 'pie' | 'multi_line' | 'stacked_bar';

interface VersatileAIChartProps {
  data: Array<{ [key: string]: any; }> | undefined;
  isLoading: boolean;
  height?: number;
  title?: string;
  description?: string;
  className?: string;
  chartType?: VersatileChartType;
  xAxisDataKey?: string;
}

interface BrushChangeEvent {
  startIndex?: number;
  endIndex?: number;
}

export function VersatileAIChart({
  data,
  isLoading,
  height = 260,
  title,
  description,
  className,
  chartType = 'area',
  xAxisDataKey = 'date'
}: VersatileAIChartProps) {
  const chartData = useMemo(() => data || [], [data]);
  const [zoomDomain, setZoomDomain] = useState<{ startIndex?: number; endIndex?: number }>({});
  const [isZoomed, setIsZoomed] = useState(false);

  const resetZoom = useCallback(() => {
    setZoomDomain({});
    setIsZoomed(false);
  }, []);

  const handleBrushChange = useCallback((brushData: BrushChangeEvent) => {
    if (brushData && brushData.startIndex !== undefined && brushData.endIndex !== undefined) {
      setZoomDomain({ startIndex: brushData.startIndex, endIndex: brushData.endIndex });
      setIsZoomed(true);
    }
  }, []);

  const valueFormatter = (value: number): string => {
    if (value === null || value === undefined || Number.isNaN(value)) return 'N/A';
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
    return Number.isInteger(value) ? value.toString() : value.toFixed(2);
  };

  if (isLoading) {
    return <SkeletonChart height={height} title={title} className={`w-full ${className || ''}`} />;
  }

  if (!chartData || chartData.length === 0) {
    return (
      <Card className={`w-full rounded-none border-none ${className || ''}`} style={{ height: `${height}px` }}>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-medium">{title || "Chart"}</CardTitle>
          {description && <CardDescription className="text-xs">{description}</CardDescription>}
        </CardHeader>
        <CardContent className="flex items-center justify-center p-4 flex-1">
          <div className="text-center py-6">
            <LucideLineChartIcon className="mx-auto h-8 w-8 text-muted-foreground/40" strokeWidth={1.5} />
            <p className="mt-2 text-sm font-medium">No data available</p>
            <p className="text-xs text-muted-foreground mt-1">Awaiting data or query did not return results.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const metricKeys = chartData.length > 0 ? Object.keys(chartData[0]).filter(key => key !== xAxisDataKey && typeof chartData[0][key] === 'number') : [];

  if (metricKeys.length === 0 && chartData.length > 0 && chartType !== 'pie') {
    // console.warn(`[VersatileAIChart] No numeric metric keys found in data besides '${xAxisDataKey}'. Chart may not render correctly. Chart Type: ${chartType}`, chartData[0]);
  }

  const chartSpecificMargin = {
    top: 20, right: 20, left: 8,
    bottom: chartData.length > 5 && (chartType === 'area' || chartType === 'line' || chartType === 'multi_line') ? 45 : (chartType === 'bar' || chartType === 'stacked_bar' ? 30 : 10)
  };

  const formatTickLabel = (value: any): string => {
    if (typeof value === 'string' && value.startsWith('/')) {
      if (value === '/') return 'Home';
      let cleaned = value.substring(1); // Remove leading slash
      if (cleaned.length > 15) {
        cleaned = cleaned.substring(0, 12) + '...';
      }
      return cleaned;
    }
    return String(value);
  };

  const commonXAxis = (
    <XAxis
      dataKey={xAxisDataKey}
      tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
      tickLine={false}
      axisLine={false}
      dy={8}
      domain={isZoomed && zoomDomain.startIndex !== undefined && zoomDomain.endIndex !== undefined && chartData[zoomDomain.startIndex] ? [chartData[zoomDomain.startIndex][xAxisDataKey], chartData[zoomDomain.endIndex][xAxisDataKey]] : undefined}
      interval={(chartType === 'bar' || chartType === 'stacked_bar') ? 0 : undefined}
      height={(chartType === 'bar' || chartType === 'stacked_bar') ? 50 : 30}
      angle={(chartType === 'bar' || chartType === 'stacked_bar') ? -30 : 0}
      textAnchor={(chartType === 'bar' || chartType === 'stacked_bar') ? 'end' : 'middle'}
      tickFormatter={(chartType === 'bar' || chartType === 'stacked_bar') ? formatTickLabel : undefined}
    />
  );
  const commonYAxis = (
    <YAxis
      tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
      tickLine={false}
      axisLine={false}
      width={35}
      tickFormatter={valueFormatter}
    />
  );
  const commonTooltip = <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--accent-foreground) / 0.05)' }} wrapperStyle={{ outline: 'none' }} />;
  const commonGrid = <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.5} />;
  const commonLegend = metricKeys.length > 1 || chartType === 'multi_line' || chartType === 'stacked_bar' ? (
    <Legend
      iconSize={8}
      iconType="circle"
      formatter={(value) => (
        <span className="text-xs capitalize">{value.replace(/_/g, ' ')}</span>
      )}
      wrapperStyle={{
        fontSize: '10px',
        paddingTop: '8px',
        marginLeft: '20px'
      }}
    />
  ) : null;
  const commonBrush = (chartType === 'line' || chartType === 'area' || chartType === 'multi_line') && chartData.length > 10 ? (
    <Brush
      dataKey={xAxisDataKey}
      height={30}
      stroke={'var(--border)'}
      fill={'var(--muted)'}
      fillOpacity={0.1}
      padding={{ top: 10, bottom: 10 }}
      tickFormatter={(value: string | number) => {
        const date = new Date(value);
        if (!Number.isNaN(date.getTime())) {
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
        return String(value).substring(0, 10);
      }}
      onChange={handleBrushChange}
      startIndex={zoomDomain.startIndex}
      endIndex={zoomDomain.endIndex}
    />
  ) : null;

  const renderAreaChart = () => (
    <AreaChart data={chartData} margin={chartSpecificMargin}>
      <defs>
        {metricKeys.map((key) => (
          <linearGradient key={`fill-${key}`} id={`fill-${key}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={METRIC_COLORS[key.toLowerCase() as keyof typeof METRIC_COLORS] || METRIC_COLORS.default} stopOpacity={0.25} />
            <stop offset="95%" stopColor={METRIC_COLORS[key.toLowerCase() as keyof typeof METRIC_COLORS] || METRIC_COLORS.default} stopOpacity={0.05} />
          </linearGradient>
        ))}
      </defs>
      {commonGrid}{commonXAxis}{commonYAxis}{commonTooltip}
      {metricKeys.map(key => (
        <Area key={key} type="monotone" dataKey={key}
          strokeWidth={1.5}
          stroke={METRIC_COLORS[key.toLowerCase() as keyof typeof METRIC_COLORS] || METRIC_COLORS.default}
          fillOpacity={1} fill={`url(#fill-${key})`}
          name={key}
          activeDot={{ r: 4, strokeWidth: 1 }}
        />
      ))}
      {commonLegend}
      {commonBrush}
    </AreaChart>
  );

  const renderLineOrMultiLineChart = () => (
    <RechartsLineChart data={chartData} margin={chartSpecificMargin}>
      {commonGrid}{commonXAxis}{commonYAxis}{commonTooltip}
      {metricKeys.map(key => (
        <Line key={key} type="monotone" dataKey={key}
          strokeWidth={1.5}
          stroke={METRIC_COLORS[key.toLowerCase() as keyof typeof METRIC_COLORS] || METRIC_COLORS.default}
          name={key}
          dot={{ r: 2, strokeWidth: 0.5 }}
          activeDot={{ r: 4, strokeWidth: 1 }}
        />
      ))}
      {commonLegend}
      {commonBrush}
    </RechartsLineChart>
  );

  const renderBarOrStackedBarChart = (isStacked: boolean) => (
    <BarChart data={chartData} margin={chartSpecificMargin} barCategoryGap={isStacked ? "10%" : "20%"}>
      {commonGrid}{commonXAxis}{commonYAxis}{commonTooltip}
      {metricKeys.map((key) => (
        <Bar key={key} dataKey={key}
          stackId={isStacked ? "stack" : undefined}
          fill={METRIC_COLORS[key.toLowerCase() as keyof typeof METRIC_COLORS] || METRIC_COLORS.default}
          name={key}
          radius={[3, 3, 0, 0]}
          barSize={metricKeys.length === 1 && !isStacked ? Math.min(35, Math.max(10, 250 / Math.max(1, chartData.length))) : undefined}
        />
      ))}
      {commonLegend}
    </BarChart>
  );

  let chartComponent: React.ReactNode;
  switch (chartType) {
    case 'line':
    case 'multi_line':
      chartComponent = renderLineOrMultiLineChart();
      break;
    case 'area':
      chartComponent = renderAreaChart();
      break;
    case 'bar':
      chartComponent = renderBarOrStackedBarChart(false);
      break;
    case 'stacked_bar':
      chartComponent = renderBarOrStackedBarChart(true);
      break;
    default:
      chartComponent = renderAreaChart();
  }

  return (
    <Card className={`w-full rounded-none border-none shadow-none ${className || ''}`}>
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium">{title || "Chart"}</CardTitle>
            {description && <CardDescription className="text-xs mt-0.5">{description}</CardDescription>}
          </div>
          {isZoomed && (
            <Button variant="ghost" size="sm" onClick={resetZoom} className="text-xs">
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset Zoom
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0 pr-2 pb-2">
        <ResponsiveContainer width="100%" height={height}>
          {chartComponent}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
} 