import { memo, ElementType } from 'react';
import dayjs from "dayjs";
import type { LucideIcon } from "lucide-react";
import {
  Card,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import { formatMetricNumber } from "@/lib/formatters";
import TrendArrow from "@/components/atomic/TrendArrow";
import TrendPercentage from "@/components/atomic/TrendPercentage";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

interface MiniChartDataPoint {
  date: string;
  value: number;
}

interface Trend {
  change?: number;
  current: number;
  previous: number;
  currentPeriod: { start: string; end: string };
  previousPeriod: { start: string; end: string };
}

interface StatCardProps {
  title: string;
  titleExtra?: React.ReactNode;
  value: string | number;
  description?: string;
  icon?: ElementType | LucideIcon;
  trend?: Trend | number;
  trendLabel?: string;
  isLoading?: boolean;
  className?: string;
  variant?: "default" | "success" | "info" | "warning" | "danger";
  // Flag to indicate if decreasing values are positive (e.g., bounce rate, page load time)
  invertTrend?: boolean;
  id?: string;
  // Mini chart data
  chartData?: MiniChartDataPoint[];
  showChart?: boolean;
  formatValue?: (value: number) => string;
}

const formatTrendValue = (value: string | number, formatter?: (v: number) => string) => {
  if (typeof value === 'number') {
    if (formatter) {
      return formatter(value);
    }
    // Show 1 decimal place for non-integers, otherwise format as a whole number.
    return Number.isInteger(value) ? formatMetricNumber(value) : value.toFixed(1);
  }
  // It's a pre-formatted string like "1m 23s" or "50%", so return as is.
  return value;
};

// Memoized mini chart component
const MiniChart = memo(({ data, id }: { data: MiniChartDataPoint[]; id: string }) => {
  const hasData = data && data.length > 0;
  const hasVariation = hasData && data.some(d => d.value !== data[0].value);

  if (!hasData) {
    return (
      <div className="h-7 flex items-center justify-center">
        <div className="text-xs text-muted-foreground">No data</div>
      </div>
    );
  }

  if (!hasVariation) {
    return (
      <div className="h-7 flex items-center">
        <div className="w-full h-0.5 bg-primary/20 rounded-full" />
      </div>
    );
  }

  return (
    <div className="chart-container group/chart">
      <ResponsiveContainer width="100%" height={28}>
        <AreaChart data={data} margin={{ top: 2, right: 1, left: 1, bottom: 2 }}>
          <defs>
            <linearGradient id={`gradient-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-color)" stopOpacity={0.8} />
              <stop offset="50%" stopColor="var(--chart-color)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="var(--chart-color)" stopOpacity={0.05} />
            </linearGradient>
            <filter id={`glow-${id}`}>
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <XAxis dataKey="date" hide />
          <YAxis hide domain={['dataMin - 10%', 'dataMax + 10%']} />
          <Tooltip
            content={({ active, payload, label }) =>
              active && payload?.[0] && typeof payload[0].value === 'number' ? (
                <div className="bg-background/95 backdrop-blur-sm border border-border/50 rounded-lg shadow-xl p-3 text-xs">
                  <p className="font-medium text-foreground mb-1">
                    {new Date(label).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: data.length > 30 ? 'numeric' : undefined
                    })}
                  </p>
                  <p className="text-primary font-semibold">{formatMetricNumber(payload[0].value)}</p>
                </div>
              ) : null
            }
            cursor={{ stroke: 'var(--chart-color)', strokeWidth: 1, strokeOpacity: 0.3 }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--chart-color)"
            fill={`url(#gradient-${id})`}
            strokeWidth={2}
            dot={false}
            activeDot={{
              r: 3,
              fill: 'var(--chart-color)',
              stroke: 'var(--background)',
              strokeWidth: 2,
              filter: `url(#glow-${id})`
            }}
            className="transition-all duration-300 group-hover/chart:drop-shadow-sm"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});

MiniChart.displayName = 'MiniChart';

export function StatCard({
  title,
  titleExtra,
  value,
  description,
  icon: Icon,
  trend,
  trendLabel,
  isLoading = false,
  className,
  variant = "default",
  invertTrend = false,
  id,
  chartData,
  showChart = false,
  formatValue,
}: StatCardProps) {
  // Determine color based on variant
  const getVariantClasses = () => {
    switch (variant) {
      case "success":
        return "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900";
      case "info":
        return "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900";
      case "warning":
        return "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900";
      case "danger":
        return "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900";
      default:
        return "";
    }
  };

  // Determine if trend is a number or detailed Trend object
  const trendValue = typeof trend === 'object' && trend !== null ? trend.change : trend;

  if (isLoading) {
    return (
      <Card className={cn(
        "overflow-hidden border",
        "bg-card",
        className
      )} id={id}>
        <div className="p-3 sm:p-4">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <Skeleton className="h-2.5 sm:h-3 w-16 sm:w-20 rounded" />
            {Icon && (
              <div className="p-1 rounded-md bg-muted/20">
                <Skeleton className="h-3 w-3 sm:h-4 sm:w-4 rounded" />
              </div>
            )}
          </div>
          <Skeleton className="h-5 sm:h-6 md:h-8 w-20 sm:w-24 mb-1.5 sm:mb-2 rounded" />
          <Skeleton className="h-3 sm:h-4 w-12 sm:w-16 mb-1.5 sm:mb-2 rounded" />
          {showChart && <Skeleton className="h-7 sm:h-9 w-full rounded" />}
        </div>
      </Card>
    );
  }

  // Check if value is a time string (like "1.75s", "500ms")
  const isTimeValue = typeof value === 'string' && /\d+(\.\d+)?(s|ms)$/.test(value);

  // Use formatMetricNumber for value display, unless it's a pre-formatted string (like time or already has %)
  const displayValue = (typeof value === 'string' && (value.endsWith('%') || isTimeValue)) || typeof value !== 'number'
    ? value.toString()
    : formatMetricNumber(value);

  const hasValidChartData = showChart && chartData && chartData.length > 0;

  const cardContent = (
    <Card className={cn(
      "group overflow-hidden transition-all duration-300 ease-out pt-0",
      "hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5",
      "border-border/50 hover:border-primary/20",
      "bg-card",
      getVariantClasses(),
      className
    )} id={id}>
      <div className="p-3 sm:p-4 relative">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="relative z-10 space-y-1.5 sm:space-y-2">
          {/* Header with title and icon */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[9px] sm:text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider line-clamp-1">
                  {title}
                </p>
                {titleExtra}
              </div>
              <div className={cn(
                "font-bold leading-tight text-foreground group-hover:text-primary transition-colors duration-300",
                isTimeValue ? "text-base sm:text-lg md:text-xl" : "text-lg sm:text-xl md:text-2xl",
                typeof value === 'string' && value.length > 8 ? "text-base sm:text-lg md:text-xl" : ""
              )}>
                {displayValue}
              </div>
            </div>
            {Icon && (
              <div className="p-1 sm:p-1.5 rounded-lg bg-primary/5 group-hover:bg-primary/10 transition-colors duration-300 ml-1.5 sm:ml-2 flex-shrink-0">
                <Icon className="h-3 w-3 sm:h-4 sm:w-4 text-primary/70 group-hover:text-primary transition-colors duration-300" />
              </div>
            )}
          </div>

          {/* Trend and description row */}
          <div className="flex items-center justify-between text-[9px] sm:text-[10px] md:text-xs">
            <div className="flex items-center min-h-[12px] sm:min-h-[14px]">
              {trendValue !== undefined && !Number.isNaN(trendValue) && (
                <div className="flex items-center">
                  <TrendArrow value={trendValue} invertColor={invertTrend} />
                  <TrendPercentage value={trendValue} invertColor={invertTrend} className="ml-0.5" />
                </div>
              )}
              {description && (trendValue === undefined || Number.isNaN(trendValue)) && (
                <span className="text-muted-foreground font-medium">
                  {description}
                </span>
              )}
            </div>
            {trendLabel && trendValue !== undefined && !Number.isNaN(trendValue) && (
              <span className="text-muted-foreground font-medium text-right hidden md:block">
                {trendLabel}
              </span>
            )}
          </div>

          {/* Chart */}
          {hasValidChartData && (
            <div className="[--chart-color:theme(colors.primary.DEFAULT)] group-hover:[--chart-color:theme(colors.primary.500)] transition-colors duration-300 -mb-0.5 sm:-mb-1">
              <MiniChart data={chartData} id={id || `chart-${Math.random()}`} />
            </div>
          )}
        </div>
      </div>
    </Card>
  );

  return typeof trend === 'object' && trend !== null && trend.currentPeriod && trend.previousPeriod ? (
    <HoverCard>
      <HoverCardTrigger asChild>
        {cardContent}
      </HoverCardTrigger>
      <HoverCardContent className="w-80" sideOffset={10}>
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            {Icon && <Icon className="h-4 w-4 text-primary" />}
            <h4 className="font-semibold text-foreground">{title}</h4>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Previous</p>
              <p className="text-xs text-muted-foreground/80">
                {dayjs(trend.previousPeriod.start).format("MMM D")} - {dayjs(trend.previousPeriod.end).format("MMM D")}
              </p>
              <p className="font-bold text-lg text-foreground">{formatTrendValue(trend.previous, formatValue)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Current</p>
              <p className="text-xs text-muted-foreground/80">
                {dayjs(trend.currentPeriod.start).format("MMM D")} - {dayjs(trend.currentPeriod.end).format("MMM D")}
              </p>
              <p className="font-bold text-lg text-foreground">{formatTrendValue(trend.current, formatValue)}</p>
            </div>
          </div>
          <div className="border-t border-border/50 pt-3">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">Change</div>
              <div className="flex items-center font-bold text-base">
                <TrendArrow value={trend.change || 0} invertColor={invertTrend} />
                <TrendPercentage value={trend.change || 0} invertColor={invertTrend} className="ml-1" />
              </div>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  ) : cardContent;
} 