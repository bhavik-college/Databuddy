import { useMemo, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Brush, ReferenceLine } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkeletonChart } from "./skeleton-chart";
import { LineChart, TrendingUp, Eye, Users, MousePointer, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

// Enhanced color palette with gradients
const METRIC_COLORS = {
  pageviews: {
    primary: "#3b82f6",
    secondary: "#1d4ed8",
    light: "#dbeafe",
    gradient: "from-blue-500/20 to-blue-600/5"
  },
  visitors: {
    primary: "#10b981",
    secondary: "#059669",
    light: "#d1fae5",
    gradient: "from-emerald-500/20 to-emerald-600/5"
  },
  sessions: {
    primary: "#8b5cf6",
    secondary: "#7c3aed",
    light: "#ede9fe",
    gradient: "from-violet-500/20 to-violet-600/5"
  },
  bounce_rate: {
    primary: "#f59e0b",
    secondary: "#d97706",
    light: "#fef3c7",
    gradient: "from-amber-500/20 to-amber-600/5"
  },
  session_duration: {
    primary: "#ef4444",
    secondary: "#dc2626",
    light: "#fee2e2",
    gradient: "from-red-500/20 to-red-600/5"
  }
};

// Enhanced tooltip with glass morphism effect
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    let result = '';
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0 || hours > 0) result += `${minutes}m `;
    if (remainingSeconds > 0 || (hours === 0 && minutes === 0)) result += `${remainingSeconds}s`;

    return result.trim();
  };

  const getMetricIcon = (name: string) => {
    if (name.toLowerCase().includes('pageview')) return <Eye className="h-3 w-3" />;
    if (name.toLowerCase().includes('visitor')) return <Users className="h-3 w-3" />;
    if (name.toLowerCase().includes('session') && !name.toLowerCase().includes('duration')) return <TrendingUp className="h-3 w-3" />;
    if (name.toLowerCase().includes('bounce')) return <MousePointer className="h-3 w-3" />;
    return <TrendingUp className="h-3 w-3" />;
  };

  return (
    <div className="bg-card backdrop-blur-md border border-border/50 rounded-xl shadow-2xl p-4 min-w-[200px]">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/30">
        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        <p className="font-semibold text-sm text-foreground">{label}</p>
      </div>
      <div className="space-y-2.5">
        {payload.map((entry: any, index: number) => {
          const dataPoint = entry.payload;

          let displayValue: string;
          if (entry.name.toLowerCase().includes('bounce rate')) {
            displayValue = `${entry.value.toFixed(1)}%`;
          } else if (entry.name.toLowerCase().includes('session duration')) {
            displayValue = dataPoint.avg_session_duration_formatted || formatDuration(entry.value);
          } else {
            displayValue = entry.value.toLocaleString();
          }

          return (
            <div key={`item-${entry.name}`} className="flex items-center justify-between gap-3 group">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-3 h-3 rounded-full shadow-sm ring-2 ring-background"
                  style={{ backgroundColor: entry.color }}
                />
                <div className="flex items-center gap-1.5">
                  {getMetricIcon(entry.name)}
                  <span className="text-muted-foreground text-xs font-medium">{entry.name}</span>
                </div>
              </div>
              <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                {displayValue}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface MetricsChartProps {
  data: Array<{
    date: string;
    pageviews?: number;
    visitors?: number;
    unique_visitors?: number;
    sessions?: number;
    bounce_rate?: number;
    avg_session_duration?: number;
    [key: string]: any;
  }> | undefined;
  isLoading: boolean;
  height?: number;
  title?: string;
  description?: string;
  className?: string;
  currentTime?: string;
}

export function MetricsChart({
  data,
  isLoading,
  height = 550,
  title,
  description,
  className,
  currentTime
}: MetricsChartProps) {
  const chartData = useMemo(() => data || [], [data]);



  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);

  const valueFormatter = (value: number): string => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
    return value.toString();
  };

  const durationFormatter = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
  };

  if (isLoading) {
    return <SkeletonChart height={height} title={title} className="w-full" />;
  }

  if (!chartData.length) {
    return (
      <Card className={cn("w-full border-0 shadow-lg bg-gradient-to-br from-background to-muted/20", className)}>
        <CardHeader className="py-6 px-6">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <LineChart className="h-5 w-5 text-primary" />
            {title}
          </CardTitle>
          {description && <CardDescription className="text-sm">{description}</CardDescription>}
        </CardHeader>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center py-12">
            <div className="relative">
              <LineChart className="mx-auto h-16 w-16 text-muted-foreground/20" strokeWidth={1.5} />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent rounded-full blur-xl" />
            </div>
            <p className="mt-6 text-lg font-semibold text-foreground">No data available</p>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
              Your analytics data will appear here as visitors interact with your website
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasPageviews = chartData.some(item => 'pageviews' in item && item.pageviews !== undefined);
  const hasVisitors = chartData.some(item => 'visitors' in item && item.visitors !== undefined);
  const hasSessions = chartData.some(item => 'sessions' in item && item.sessions !== undefined);
  const hasBounceRate = chartData.some(item => 'bounce_rate' in item && item.bounce_rate !== undefined);
  const hasAvgSessionDuration = chartData.some(item => 'avg_session_duration' in item && item.avg_session_duration !== undefined);

  return (
    <Card className={cn("w-full border-0 shadow-lg bg-gradient-to-br from-background via-background to-muted/10 overflow-hidden", className)}>

      <CardContent className="p-0">
        <div style={{ width: '100%', height: height + 20 }} className="relative">
          {/* Background gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-muted/5 pointer-events-none" />

          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 30, right: 30, left: 20, bottom: chartData.length > 5 ? 60 : 20 }}
            >
              <defs>
                {Object.entries(METRIC_COLORS).map(([key, colors]) => (
                  <linearGradient key={key} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={colors.primary} stopOpacity={0.3} />
                    <stop offset="50%" stopColor={colors.primary} stopOpacity={0.1} />
                    <stop offset="100%" stopColor={colors.primary} stopOpacity={0.02} />
                  </linearGradient>
                ))}

                {/* Glow effects */}
                {Object.entries(METRIC_COLORS).map(([key, colors]) => (
                  <filter key={`glow-${key}`} id={`glow-${key}`}>
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                ))}
              </defs>

              <CartesianGrid
                strokeDasharray="2 4"
                vertical={false}
                stroke="var(--border)"
                strokeOpacity={0.3}
                className="animate-pulse"
              />

              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)', fontWeight: 500 }}
                tickLine={false}
                axisLine={{ stroke: 'var(--border)', strokeOpacity: 0.5 }}
                dy={10}
              />

              <YAxis
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)', fontWeight: 500 }}
                tickLine={false}
                axisLine={false}
                width={45}
                tickFormatter={valueFormatter}
                yAxisId="left"
              />

              {hasBounceRate && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)', fontWeight: 500 }}
                  tickLine={false}
                  axisLine={false}
                  width={45}
                  tickFormatter={(value) => `${value}%`}
                  domain={[0, 100]}
                />
              )}

              {hasAvgSessionDuration && (
                <YAxis
                  yAxisId="duration"
                  orientation="right"
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)', fontWeight: 500 }}
                  tickLine={false}
                  axisLine={false}
                  width={50}
                  tickFormatter={durationFormatter}
                />
              )}

              <Tooltip
                content={<CustomTooltip />}
                wrapperStyle={{ outline: 'none' }}
                animationDuration={200}
                cursor={{
                  stroke: 'var(--primary)',
                  strokeWidth: 1,
                  strokeOpacity: 0.5,
                  strokeDasharray: '4 4'
                }}
              />

              <Legend
                wrapperStyle={{
                  fontSize: '12px',
                  paddingTop: '20px',
                  bottom: chartData.length > 5 ? 35 : 5,
                  fontWeight: 500
                }}
                formatter={(value, entry: any) => (
                  <span
                    className={cn(
                      "text-xs font-medium transition-all duration-200 cursor-pointer",
                      hoveredMetric === value ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                    onMouseEnter={() => setHoveredMetric(value)}
                    onMouseLeave={() => setHoveredMetric(null)}
                  >
                    {value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' ')}
                  </span>
                )}
                iconType="circle"
                iconSize={10}
              />

              {hasPageviews && (
                <Area
                  type="monotone"
                  dataKey="pageviews"
                  stroke={METRIC_COLORS.pageviews.primary}
                  fillOpacity={1}
                  fill="url(#gradient-pageviews)"
                  strokeWidth={2.5}
                  activeDot={{
                    r: 6,
                    strokeWidth: 3,
                    stroke: METRIC_COLORS.pageviews.primary,
                    fill: 'var(--background)',
                    filter: 'url(#glow-pageviews)'
                  }}
                  dot={{ r: 0 }}
                  name="Pageviews"
                  yAxisId="left"
                  className="transition-all duration-300"
                />
              )}

              {hasVisitors && (
                <Area
                  type="monotone"
                  dataKey="visitors"
                  stroke={METRIC_COLORS.visitors.primary}
                  fillOpacity={1}
                  fill="url(#gradient-visitors)"
                  strokeWidth={2.5}
                  activeDot={{
                    r: 6,
                    strokeWidth: 3,
                    stroke: METRIC_COLORS.visitors.primary,
                    fill: 'var(--background)',
                    filter: 'url(#glow-visitors)'
                  }}
                  dot={{ r: 0 }}
                  name="Visitors"
                  yAxisId="left"
                  className="transition-all duration-300"
                />
              )}

              {hasSessions && (
                <Area
                  type="monotone"
                  dataKey="sessions"
                  stroke={METRIC_COLORS.sessions.primary}
                  fillOpacity={1}
                  fill="url(#gradient-sessions)"
                  strokeWidth={2.5}
                  activeDot={{
                    r: 6,
                    strokeWidth: 3,
                    stroke: METRIC_COLORS.sessions.primary,
                    fill: 'var(--background)',
                    filter: 'url(#glow-sessions)'
                  }}
                  dot={{ r: 0 }}
                  name="Sessions"
                  yAxisId="left"
                  className="transition-all duration-300"
                />
              )}

              {/* Current Time Reference Line */}
              {currentTime && (
                <ReferenceLine
                  x={currentTime}
                  stroke="#ef4444"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  yAxisId="left"
                  label={{
                    value: "Now",
                    position: "top",
                    style: {
                      fontSize: '11px',
                      fontWeight: 600,
                      fill: '#ef4444',
                      textAnchor: 'middle'
                    }
                  }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 