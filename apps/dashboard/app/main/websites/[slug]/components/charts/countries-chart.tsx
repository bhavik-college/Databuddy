"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, ResponsiveContainer, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

interface CountriesChartProps {
  data: Array<{ country: string; visits: number }>;
  height?: number;
}

export function CountriesChart({ data, height = 300 }: CountriesChartProps) {
  // Sort data by visits (descending) and take top 10
  const chartData = [...data]
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 10);

  return (
    <Card className="bg-slate-900/80 border-slate-800/80 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-base">Top Countries</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 10, right: 10, left: 40, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis 
                type="number"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                tickLine={{ stroke: "#1e293b" }}
                axisLine={{ stroke: "#1e293b" }}
              />
              <YAxis 
                dataKey="country"
                type="category"
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
                formatter={(value: number) => [`${value} visits`, "Visits"]}
              />
              <Bar 
                dataKey="visits" 
                fill="#6366f1" 
                radius={[0, 4, 4, 0]}
                stroke="#6366f1"
                strokeWidth={1}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 