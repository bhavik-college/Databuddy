import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SkeletonChart } from "./skeleton-chart";
import { ChartLineIcon, BrainCircuitIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LineChart } from "lucide-react";

// Custom tooltip component with enhanced styling
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="bg-background border border-border/70 p-3 rounded-lg shadow-md text-xs">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center gap-2 py-0.5">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">
              {entry.name}: 
            </span>
            <span className="font-medium text-foreground">
              {entry.name.toLowerCase().includes('bounce rate') 
                ? `${entry.value.toFixed(1)}%` 
                : entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
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
    [key: string]: any;
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
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
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

  // Colors and gradients for metrics
  const metricColors = {
    pageviews: "#6366f1", // Indigo
    visitors: "#10b981", // Emerald
    sessions: "#f59e0b", // Amber
    bounce_rate: "#ef4444", // Red
  };

  return (
    <div className="w-full rounded-lg p-0 pb-1">
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 20, right: 20, left: 8, bottom: 20 }}
          >
            <defs>
              {/* Pageviews gradient */}
              <linearGradient id="colorPageviews" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={metricColors.pageviews} stopOpacity={0.3} />
                <stop offset="95%" stopColor={metricColors.pageviews} stopOpacity={0.05} />
              </linearGradient>
              
              {/* Visitors gradient */}
              <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={metricColors.visitors} stopOpacity={0.3} />
                <stop offset="95%" stopColor={metricColors.visitors} stopOpacity={0.05} />
              </linearGradient>
              
              {/* Sessions gradient */}
              <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={metricColors.sessions} stopOpacity={0.3} />
                <stop offset="95%" stopColor={metricColors.sessions} stopOpacity={0.05} />
              </linearGradient>
              
              {/* Bounce rate gradient */}
              <linearGradient id="colorBounceRate" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={metricColors.bounce_rate} stopOpacity={0.3} />
                <stop offset="95%" stopColor={metricColors.bounce_rate} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false} 
              stroke="var(--border)" 
              strokeOpacity={0.5} 
              strokeWidth={0.8}
            />
            
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
              dy={8}
              tickMargin={8}
            />
            
            <YAxis 
              tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
              tickLine={false}
              axisLine={false}
              width={30}
              tickFormatter={valueFormatter}
              yAxisId="left"
            />
            
            {hasBounceRate && (
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
                width={35}
                tickFormatter={(value) => `${value}%`}
                domain={[0, 100]}
              />
            )}
            
            <Tooltip 
              content={<CustomTooltip />} 
              wrapperStyle={{ outline: 'none' }} 
              cursor={{ stroke: 'var(--muted-foreground)', strokeWidth: 1, strokeOpacity: 0.5 }}
            />
            
            <Legend 
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} 
              iconSize={8}
              iconType="circle"
              formatter={(value) => {
                return value.charAt(0).toUpperCase() + value.slice(1).replace('_', ' ');
              }}
            />
            
            {/* Plot areas for each metric */}
            {hasPageviews && (
              <Area 
                type="monotone" 
                dataKey="pageviews" 
                stroke={metricColors.pageviews} 
                fillOpacity={1} 
                fill="url(#colorPageviews)" 
                strokeWidth={2}
                activeDot={{ r: 6, strokeWidth: 1, stroke: '#fff' }}
                name="Pageviews"
                yAxisId="left"
              />
            )}
            
            {hasVisitors && (
              <Area 
                type="monotone" 
                dataKey="visitors" 
                stroke={metricColors.visitors} 
                fillOpacity={1} 
                fill="url(#colorVisitors)" 
                strokeWidth={2}
                activeDot={{ r: 6, strokeWidth: 1, stroke: '#fff' }}
                name="Visitors"
                yAxisId="left"
              />
            )}
            
            {hasSessions && (
              <Area 
                type="monotone" 
                dataKey="sessions" 
                stroke={metricColors.sessions} 
                fillOpacity={1} 
                fill="url(#colorSessions)" 
                strokeWidth={2}
                activeDot={{ r: 6, strokeWidth: 1, stroke: '#fff' }}
                name="Sessions"
                yAxisId="left"
              />
            )}
            
            {hasBounceRate && (
              <Area 
                type="monotone" 
                dataKey="bounce_rate" 
                stroke={metricColors.bounce_rate} 
                fillOpacity={1} 
                fill="url(#colorBounceRate)" 
                strokeWidth={2}
                activeDot={{ r: 6, strokeWidth: 1, stroke: '#fff' }}
                name="Bounce Rate"
                yAxisId="right"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 