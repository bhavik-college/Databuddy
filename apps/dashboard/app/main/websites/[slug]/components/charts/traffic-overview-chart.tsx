"use client";

import { useState } from "react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart2 } from "lucide-react";
import { EmptyState } from "@/app/(app)/dashboard/components/empty-state";

interface DailyStats {
  date: string;
  visitors: number;
  pageViews: number;
  bounceRate: number;
}

interface TrafficOverviewChartProps {
  data: DailyStats[];
  isLoading?: boolean;
}

export function TrafficOverviewChart({ data, isLoading = false }: TrafficOverviewChartProps) {
  // Format dates for display
  const formattedData = data.map(item => ({
    ...item,
    date: formatDate(item.date)
  }));

  const isEmpty = !isLoading && (!data.length || (data.every(item => item.visitors === 0) && data.every(item => item.pageViews === 0)));
  
  return (
    <Card className="bg-slate-900/80 border-slate-800/80 backdrop-blur-sm col-span-2 row-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-white flex items-center gap-2 text-base">
          <BarChart2 className="h-4 w-4 text-sky-400" />
          Traffic Overview
        </CardTitle>
        <CardDescription className="text-slate-400 text-xs">
          Visitors and page views for the selected period
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[280px] flex items-center justify-center">
            <div className="animate-pulse bg-slate-800 rounded-md w-full h-[240px]" />
          </div>
        ) : isEmpty ? (
          <div className="h-[280px]">
            <EmptyState 
              icon={<BarChart2 className="h-8 w-8 text-slate-500" />}
              title="No traffic data"
              description="There is no traffic data recorded for this period."
            />
          </div>
        ) : (
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPageViews" x1="0" y1="0" x2="0" y2="1">
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
                  formatter={(value: number, name: string) => {
                    return [value.toLocaleString(), name === "visitors" ? "Visitors" : "Page Views"];
                  }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  formatter={(value) => {
                    return <span className="text-xs text-slate-300">{value === "visitors" ? "Visitors" : "Page Views"}</span>;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="visitors" 
                  stroke="#38bdf8" 
                  fillOpacity={1}
                  fill="url(#colorVisitors)" 
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="pageViews" 
                  stroke="#818cf8" 
                  fillOpacity={1}
                  fill="url(#colorPageViews)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper function to format date
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
} 