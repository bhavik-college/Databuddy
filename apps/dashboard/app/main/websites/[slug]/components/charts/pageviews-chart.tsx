"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, ResponsiveContainer, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

interface PageViewsChartProps {
  data: any[];
  height?: number;
}

export function PageViewsChart({ data, height = 300 }: PageViewsChartProps) {
  // Format data for the chart
  const chartData = data.map(day => ({
    date: day.date,
    pageViews: day.pageviews || 0
  }));

  return (
    <Card className="bg-slate-900/80 border-slate-800/80 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-base">Page Views</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis 
                dataKey="date" 
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                tickLine={{ stroke: "#1e293b" }}
                axisLine={{ stroke: "#1e293b" }}
              />
              <YAxis 
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                tickLine={{ stroke: "#1e293b" }}
                axisLine={{ stroke: "#1e293b" }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "#0f172a", 
                  border: "1px solid #1e293b",
                  borderRadius: "4px",
                  color: "#e2e8f0"
                }}
                labelStyle={{ color: "#f8fafc", fontWeight: "bold", marginBottom: "4px" }}
              />
              <Bar 
                dataKey="pageViews" 
                fill="#10b981" 
                radius={[4, 4, 0, 0]}
                stroke="#10b981"
                strokeWidth={1}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 