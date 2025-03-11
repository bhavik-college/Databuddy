"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { TimeSeriesData } from "../../hooks/use-analytics-data";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { MousePointerClick } from "lucide-react";
import { EmptyState } from "../../app/components/empty-state";

interface PageViewsChartProps {
  data: TimeSeriesData[];
  isLoading?: boolean;
}

export function PageViewsChart({ data, isLoading = false }: PageViewsChartProps) {
  const [timeRange, setTimeRange] = useState<"7d" | "14d" | "30d">("7d");
  
  // Filter data based on selected time range
  const filteredData = data.slice(-getTimeRangeDays(timeRange));
  
  // Calculate some stats
  const latestValue = filteredData.length > 0 ? filteredData[filteredData.length - 1].value : 0;
  const previousValue = filteredData.length > 1 ? filteredData[0].value : 0;
  const percentChange = previousValue === 0 
    ? 0 
    : ((latestValue - previousValue) / previousValue) * 100;
  
  const trend = percentChange >= 0 
    ? `+${percentChange.toFixed(1)}%` 
    : `${percentChange.toFixed(1)}%`;
  
  // Format dates for display
  const formattedData = filteredData.map(item => ({
    ...item,
    date: formatDate(item.date, timeRange)
  }));

  const isEmpty = !isLoading && (!data.length || data.every(item => item.value === 0));
  
  return (
    <Card className="bg-slate-900/80 border-slate-800/80 backdrop-blur-sm overflow-hidden transition-all hover:shadow-md hover:shadow-sky-500/5 hover:border-sky-500/30">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-lg">Page Views</CardTitle>
          <div className="flex items-center space-x-1">
            <Button 
              variant={timeRange === "7d" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setTimeRange("7d")}
              className={timeRange === "7d" 
                ? "bg-sky-600 hover:bg-sky-700 text-white" 
                : "border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800"
              }
            >
              7d
              <VisuallyHidden>7 Days</VisuallyHidden>
            </Button>
            <Button 
              variant={timeRange === "14d" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setTimeRange("14d")}
              className={timeRange === "14d" 
                ? "bg-sky-600 hover:bg-sky-700 text-white" 
                : "border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800"
              }
            >
              14d
              <VisuallyHidden>14 Days</VisuallyHidden>
            </Button>
            <Button 
              variant={timeRange === "30d" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setTimeRange("30d")}
              className={timeRange === "30d" 
                ? "bg-sky-600 hover:bg-sky-700 text-white" 
                : "border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800"
              }
            >
              30d
              <VisuallyHidden>30 Days</VisuallyHidden>
            </Button>
          </div>
        </div>
        <div className="flex items-baseline gap-2 mt-2">
          <p className="text-2xl font-bold text-white">{latestValue.toLocaleString()}</p>
          <span className={`text-xs font-medium ${percentChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {trend}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0 h-48">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-pulse bg-slate-800 rounded-md w-full h-32" />
          </div>
        ) : isEmpty ? (
          <EmptyState 
            icon={<MousePointerClick className="h-8 w-8 text-slate-500" />}
            title="No page view data"
            description="There are no page views recorded for this period."
          />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="color-pageviews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis 
                dataKey="date" 
                tick={{ fill: '#94a3b8', fontSize: 10 }} 
                axisLine={{ stroke: '#334155' }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fill: '#94a3b8', fontSize: 10 }} 
                axisLine={{ stroke: '#334155' }}
                tickLine={false}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.375rem' }}
                labelStyle={{ color: '#e2e8f0' }}
                itemStyle={{ color: '#818cf8' }}
                formatter={(value: number) => [value.toLocaleString(), 'Page Views']}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#818cf8" 
                fillOpacity={1}
                fill="url(#color-pageviews)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

// Helper functions
function getTimeRangeDays(range: "7d" | "14d" | "30d"): number {
  switch (range) {
    case "7d": return 7;
    case "14d": return 14;
    case "30d": return 30;
    default: return 7;
  }
}

function formatDate(dateString: string, range: "7d" | "14d" | "30d"): string {
  const date = new Date(dateString);
  
  if (range === "7d") {
    // For 7 days, show day of week (Mon, Tue, etc.)
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  } else if (range === "14d") {
    // For 14 days, show day and month (Jan 1, Jan 2, etc.)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } else {
    // For 30 days, show month and day with less frequency
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
} 