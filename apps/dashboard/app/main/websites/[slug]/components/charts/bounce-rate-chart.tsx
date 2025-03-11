"use client";

import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { EmptyState } from "@/app/(app)/dashboard/components/empty-state";

interface DailyStats {
  date: string;
  visitors: number;
  pageViews: number;
  bounceRate: number;
}

interface BounceRateChartProps {
  data: DailyStats[];
  isLoading?: boolean;
}

export function BounceRateWebsiteChart({ data, isLoading = false }: BounceRateChartProps) {
  // Format dates for display
  const formattedData = data.map(item => ({
    ...item,
    date: formatDate(item.date)
  }));

  const isEmpty = !isLoading && (!data.length || data.every(item => item.bounceRate === 0));
  
  // Calculate average bounce rate
  const averageBounceRate = isEmpty ? 0 : 
    Math.round(data.reduce((sum, item) => sum + item.bounceRate, 0) / data.length);
  
  return (
    <Card className="bg-slate-900/80 border-slate-800/80 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-white flex items-center gap-2 text-base">
          <Clock className="h-4 w-4 text-indigo-400" />
          Bounce Rate
        </CardTitle>
        <CardDescription className="text-slate-400 text-xs">
          Average bounce rate: {averageBounceRate}%
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[120px] flex items-center justify-center">
            <div className="animate-pulse bg-slate-800 rounded-md w-full h-[100px]" />
          </div>
        ) : isEmpty ? (
          <div className="h-[120px]">
            <EmptyState 
              icon={<Clock className="h-8 w-8 text-slate-500" />}
              title="No bounce rate data"
              description="There is no bounce rate data recorded for this period."
            />
          </div>
        ) : (
          <div className="h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formattedData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
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
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.375rem' }}
                  labelStyle={{ color: '#e2e8f0' }}
                  formatter={(value: number) => [`${value}%`, 'Bounce Rate']}
                />
                <Line 
                  type="monotone" 
                  dataKey="bounceRate" 
                  stroke="#fbbf24" 
                  strokeWidth={2}
                  dot={{ fill: '#fbbf24', r: 3 }}
                  activeDot={{ fill: '#fbbf24', r: 5, strokeWidth: 2 }}
                />
              </LineChart>
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