import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SkeletonChart } from "./skeleton-chart";
import { ChartLineIcon, BrainCircuitIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LineChart } from "lucide-react";

// Custom tooltip component for dark mode compatibility
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-border p-2 rounded-md shadow-md text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={`item-${index}`} className="flex items-center gap-1 py-0.5">
          <div 
            className="w-2 h-2 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">
            {entry.name}: 
          </span>
          <span className="font-medium text-foreground">
            {entry.name === 'Bounce Rate' 
              ? `${entry.value.toFixed(1)}%` 
              : entry.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
};

interface MetricsChartProps {
  data: Array<{
    date: string;
    pageviews?: number;
    visitors?: number;
    sessions?: number;
    bounce_rate?: number;
  }> | undefined;
  isLoading: boolean;
  height?: number;
  title?: string;
  description?: string;
  className?: string;
  noData?: boolean;
}

export function MetricsChart({ 
  data, 
  isLoading, 
  height = 300, 
  title = "Traffic Overview",
  description = "Pageviews, visitors and sessions over time",
  className,
  noData
}: MetricsChartProps) {
  const chartData = useMemo(() => {
    if (!data) return [];
    return data;
  }, [data]);

  // Custom formatter for values
  const valueFormatter = (value: number): string => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toString();
  };

  if (isLoading) {
    return <SkeletonChart height={height} title={title} className="w-full" />;
  }

  if (!data?.length) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-0.5 pt-3 px-3">
          <CardTitle className="text-xs font-medium">{title}</CardTitle>
          <CardDescription className="text-xs">No data available</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex flex-col items-center justify-center h-[280px] text-center">
            <div className="bg-muted/30 p-3 rounded-full mb-3">
              <LineChart className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-medium mb-1">Waiting for data</h3>
            <p className="text-xs text-muted-foreground max-w-xs mb-3">
              This chart will display metrics once visitors begin interacting with your website. 
              Make sure you've added the tracking code to collect data.
            </p>
            {/* <div className="flex items-center gap-2 mt-1">
              <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                <a href="/settings">Check installation</a>
              </Button>
              <Button variant="link" size="sm" className="h-7 text-xs" asChild>
                <a href="/docs/metrics" target="_blank" rel="noopener noreferrer">Learn about metrics</a>
              </Button>
            </div> */}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Determine which metrics are present in the data
  const hasPageviews = data.some(item => 'pageviews' in item);
  const hasVisitors = data.some(item => 'visitors' in item);
  const hasSessions = data.some(item => 'sessions' in item);
  const hasBounceRate = data.some(item => 'bounce_rate' in item);

  return (
    <Card className="w-full">
      <CardHeader className="pb-0.5 pt-3 px-3">
        <CardTitle className="text-xs font-medium">{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="px-0 pb-1 pt-0">
        <div style={{ width: '100%', height }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
            >
              <defs>
                <linearGradient id="colorPageviews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorBounceRate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: 'var(--border)' }}
                dy={5}
              />
              <YAxis 
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                width={30}
                tickFormatter={valueFormatter}
                // Add a secondary right axis for bounce rate if needed
                yAxisId="left"
              />
              {hasBounceRate && (
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  width={30}
                  tickFormatter={(value) => `${value}%`}
                  domain={[0, 100]}
                />
              )}
              <Tooltip content={<CustomTooltip />} wrapperStyle={{ outline: 'none' }} />
              <Legend 
                wrapperStyle={{ fontSize: '11px', paddingTop: '5px' }} 
                iconSize={8}
                iconType="circle"
                formatter={(value) => {
                  // Capitalize first letter
                  return value.charAt(0).toUpperCase() + value.slice(1);
                }}
              />
              {hasPageviews && (
                <Area 
                  type="monotone" 
                  dataKey="pageviews" 
                  stroke="#6366f1" 
                  fillOpacity={1} 
                  fill="url(#colorPageviews)" 
                  strokeWidth={1.5}
                  activeDot={{ r: 4 }}
                  name="Pageviews"
                  yAxisId="left"
                />
              )}
              {hasVisitors && (
                <Area 
                  type="monotone" 
                  dataKey="visitors" 
                  stroke="#10b981" 
                  fillOpacity={1} 
                  fill="url(#colorVisitors)" 
                  strokeWidth={1.5} 
                  activeDot={{ r: 4 }}
                  name="Visitors"
                  yAxisId="left"
                />
              )}
              {hasSessions && (
                <Area 
                  type="monotone" 
                  dataKey="sessions" 
                  stroke="#f59e0b" 
                  fillOpacity={1} 
                  fill="url(#colorSessions)" 
                  strokeWidth={1.5}
                  activeDot={{ r: 4 }}
                  name="Sessions"
                  yAxisId="left"
                />
              )}
              {hasBounceRate && (
                <Area 
                  type="monotone" 
                  dataKey="bounce_rate" 
                  stroke="#ef4444" 
                  fillOpacity={1} 
                  fill="url(#colorBounceRate)" 
                  strokeWidth={1.5}
                  activeDot={{ r: 4 }}
                  name="Bounce Rate"
                  yAxisId="right"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 