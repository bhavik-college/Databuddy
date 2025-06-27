import {
  Eye,
  LineChart,
  MousePointer,
  RotateCcw,
  TrendingUp,
  Users,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Brush,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SkeletonChart } from "./skeleton-chart";

// Enhanced color palette with gradients
const METRIC_COLORS = {
  pageviews: {
    primary: "#3b82f6",
    secondary: "#1d4ed8",
    light: "#dbeafe",
    gradient: "from-blue-500/20 to-blue-600/5",
  },
  visitors: {
    primary: "#10b981",
    secondary: "#059669",
    light: "#d1fae5",
    gradient: "from-emerald-500/20 to-emerald-600/5",
  },
  sessions: {
    primary: "#8b5cf6",
    secondary: "#7c3aed",
    light: "#ede9fe",
    gradient: "from-violet-500/20 to-violet-600/5",
  },
  bounce_rate: {
    primary: "#f59e0b",
    secondary: "#d97706",
    light: "#fef3c7",
    gradient: "from-amber-500/20 to-amber-600/5",
  },
  session_duration: {
    primary: "#ef4444",
    secondary: "#dc2626",
    light: "#fee2e2",
    gradient: "from-red-500/20 to-red-600/5",
  },
};

// Enhanced tooltip with glass morphism effect
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!(active && payload && payload.length)) return null;

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    let result = "";
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0 || hours > 0) result += `${minutes}m `;
    if (remainingSeconds > 0 || (hours === 0 && minutes === 0)) result += `${remainingSeconds}s`;

    return result.trim();
  };

  const getMetricIcon = (name: string) => {
    if (name.toLowerCase().includes("pageview")) return <Eye className="h-3 w-3" />;
    if (name.toLowerCase().includes("visitor")) return <Users className="h-3 w-3" />;
    if (name.toLowerCase().includes("session") && !name.toLowerCase().includes("duration"))
      return <TrendingUp className="h-3 w-3" />;
    if (name.toLowerCase().includes("bounce")) return <MousePointer className="h-3 w-3" />;
    return <TrendingUp className="h-3 w-3" />;
  };

  return (
    <div className="min-w-[200px] rounded-xl border border-border/50 bg-card p-4 shadow-2xl backdrop-blur-md">
      <div className="mb-3 flex items-center gap-2 border-border/30 border-b pb-2">
        <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
        <p className="font-semibold text-foreground text-sm">{label}</p>
      </div>
      <div className="space-y-2.5">
        {payload.map((entry: any, index: number) => {
          const dataPoint = entry.payload;

          let displayValue: string;
          if (entry.name.toLowerCase().includes("bounce rate")) {
            displayValue = `${entry.value.toFixed(1)}%`;
          } else if (entry.name.toLowerCase().includes("session duration")) {
            displayValue = dataPoint.avg_session_duration_formatted || formatDuration(entry.value);
          } else {
            displayValue = entry.value.toLocaleString();
          }

          return (
            <div
              className="group flex items-center justify-between gap-3"
              key={`item-${entry.name}`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="h-3 w-3 rounded-full shadow-sm ring-2 ring-background"
                  style={{ backgroundColor: entry.color }}
                />
                <div className="flex items-center gap-1.5">
                  {getMetricIcon(entry.name)}
                  <span className="font-medium text-muted-foreground text-xs">{entry.name}</span>
                </div>
              </div>
              <span className="font-bold text-foreground text-sm transition-colors group-hover:text-primary">
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
  data:
    | Array<{
        date: string;
        pageviews?: number;
        visitors?: number;
        unique_visitors?: number;
        sessions?: number;
        bounce_rate?: number;
        avg_session_duration?: number;
        [key: string]: any;
      }>
    | undefined;
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
  currentTime,
}: MetricsChartProps) {
  const chartData = useMemo(() => data || [], [data]);

  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);

  const valueFormatter = (value: number): string => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
    return value.toString();
  };

  const durationFormatter = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
  };

  if (isLoading) {
    return <SkeletonChart className="w-full" height={height} title={title} />;
  }

  if (!chartData.length) {
    return (
      <Card
        className={cn(
          "w-full border-0 bg-gradient-to-br from-background to-muted/20 shadow-lg",
          className
        )}
      >
        <CardHeader className="px-6 py-6">
          <CardTitle className="flex items-center gap-2 font-semibold text-lg">
            <LineChart className="h-5 w-5 text-primary" />
            {title}
          </CardTitle>
          {description && <CardDescription className="text-sm">{description}</CardDescription>}
        </CardHeader>
        <CardContent className="flex items-center justify-center p-8">
          <div className="py-12 text-center">
            <div className="relative">
              <LineChart className="mx-auto h-16 w-16 text-muted-foreground/20" strokeWidth={1.5} />
              <div className="absolute inset-0 rounded-full bg-gradient-to-t from-primary/10 to-transparent blur-xl" />
            </div>
            <p className="mt-6 font-semibold text-foreground text-lg">No data available</p>
            <p className="mx-auto mt-2 max-w-sm text-muted-foreground text-sm">
              Your analytics data will appear here as visitors interact with your website
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasPageviews = chartData.some(
    (item) => "pageviews" in item && item.pageviews !== undefined
  );
  const hasVisitors = chartData.some((item) => "visitors" in item && item.visitors !== undefined);
  const hasSessions = chartData.some((item) => "sessions" in item && item.sessions !== undefined);
  const hasBounceRate = chartData.some(
    (item) => "bounce_rate" in item && item.bounce_rate !== undefined
  );
  const hasAvgSessionDuration = chartData.some(
    (item) => "avg_session_duration" in item && item.avg_session_duration !== undefined
  );

  return (
    <Card
      className={cn(
        "w-full overflow-hidden border-0 bg-gradient-to-br from-background via-background to-muted/10 shadow-lg",
        className
      )}
    >
      <CardContent className="p-0">
        <div className="relative" style={{ width: "100%", height: height + 20 }}>
          {/* Background gradient overlay */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-muted/5" />

          <ResponsiveContainer height="100%" width="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 30, right: 30, left: 20, bottom: chartData.length > 5 ? 60 : 20 }}
            >
              <defs>
                {Object.entries(METRIC_COLORS).map(([key, colors]) => (
                  <linearGradient id={`gradient-${key}`} key={key} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={colors.primary} stopOpacity={0.3} />
                    <stop offset="50%" stopColor={colors.primary} stopOpacity={0.1} />
                    <stop offset="100%" stopColor={colors.primary} stopOpacity={0.02} />
                  </linearGradient>
                ))}

                {/* Glow effects */}
                {Object.entries(METRIC_COLORS).map(([key, colors]) => (
                  <filter id={`glow-${key}`} key={`glow-${key}`}>
                    <feGaussianBlur result="coloredBlur" stdDeviation="3" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                ))}
              </defs>

              <CartesianGrid
                className="animate-pulse"
                stroke="var(--border)"
                strokeDasharray="2 4"
                strokeOpacity={0.3}
                vertical={false}
              />

              <XAxis
                axisLine={{ stroke: "var(--border)", strokeOpacity: 0.5 }}
                dataKey="date"
                dy={10}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)", fontWeight: 500 }}
                tickLine={false}
              />

              <YAxis
                axisLine={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)", fontWeight: 500 }}
                tickFormatter={valueFormatter}
                tickLine={false}
                width={45}
                yAxisId="left"
              />

              {hasBounceRate && (
                <YAxis
                  axisLine={false}
                  domain={[0, 100]}
                  orientation="right"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)", fontWeight: 500 }}
                  tickFormatter={(value) => `${value}%`}
                  tickLine={false}
                  width={45}
                  yAxisId="right"
                />
              )}

              {hasAvgSessionDuration && (
                <YAxis
                  axisLine={false}
                  orientation="right"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)", fontWeight: 500 }}
                  tickFormatter={durationFormatter}
                  tickLine={false}
                  width={50}
                  yAxisId="duration"
                />
              )}

              <Tooltip
                animationDuration={200}
                content={<CustomTooltip />}
                cursor={{
                  stroke: "var(--primary)",
                  strokeWidth: 1,
                  strokeOpacity: 0.5,
                  strokeDasharray: "4 4",
                }}
                wrapperStyle={{ outline: "none" }}
              />

              <Legend
                formatter={(value, entry: any) => (
                  <span
                    className={cn(
                      "cursor-pointer font-medium text-xs transition-all duration-200",
                      hoveredMetric === value
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    onMouseEnter={() => setHoveredMetric(value)}
                    onMouseLeave={() => setHoveredMetric(null)}
                  >
                    {value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, " ")}
                  </span>
                )}
                iconSize={10}
                iconType="circle"
                wrapperStyle={{
                  fontSize: "12px",
                  paddingTop: "20px",
                  bottom: chartData.length > 5 ? 35 : 5,
                  fontWeight: 500,
                }}
              />

              {hasPageviews && (
                <Area
                  activeDot={{
                    r: 6,
                    strokeWidth: 3,
                    stroke: METRIC_COLORS.pageviews.primary,
                    fill: "var(--background)",
                    filter: "url(#glow-pageviews)",
                  }}
                  className="transition-all duration-300"
                  dataKey="pageviews"
                  dot={{ r: 0 }}
                  fill="url(#gradient-pageviews)"
                  fillOpacity={1}
                  name="Pageviews"
                  stroke={METRIC_COLORS.pageviews.primary}
                  strokeWidth={2.5}
                  type="monotone"
                  yAxisId="left"
                />
              )}

              {hasVisitors && (
                <Area
                  activeDot={{
                    r: 6,
                    strokeWidth: 3,
                    stroke: METRIC_COLORS.visitors.primary,
                    fill: "var(--background)",
                    filter: "url(#glow-visitors)",
                  }}
                  className="transition-all duration-300"
                  dataKey="visitors"
                  dot={{ r: 0 }}
                  fill="url(#gradient-visitors)"
                  fillOpacity={1}
                  name="Visitors"
                  stroke={METRIC_COLORS.visitors.primary}
                  strokeWidth={2.5}
                  type="monotone"
                  yAxisId="left"
                />
              )}

              {hasSessions && (
                <Area
                  activeDot={{
                    r: 6,
                    strokeWidth: 3,
                    stroke: METRIC_COLORS.sessions.primary,
                    fill: "var(--background)",
                    filter: "url(#glow-sessions)",
                  }}
                  className="transition-all duration-300"
                  dataKey="sessions"
                  dot={{ r: 0 }}
                  fill="url(#gradient-sessions)"
                  fillOpacity={1}
                  name="Sessions"
                  stroke={METRIC_COLORS.sessions.primary}
                  strokeWidth={2.5}
                  type="monotone"
                  yAxisId="left"
                />
              )}

              {/* Current Time Reference Line */}
              {currentTime && (
                <ReferenceLine
                  label={{
                    value: "Now",
                    position: "top",
                    style: {
                      fontSize: "11px",
                      fontWeight: 600,
                      fill: "#ef4444",
                      textAnchor: "middle",
                    },
                  }}
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  x={currentTime}
                  yAxisId="left"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
