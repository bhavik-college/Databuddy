"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, ResponsiveContainer, Pie, Cell, Legend, Tooltip } from "recharts";

interface DevicesChartProps {
  data: Record<string, number>;
  height?: number;
}

export function DevicesChart({ data, height = 300 }: DevicesChartProps) {
  // Format data for the chart
  const chartData = Object.entries(data).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  // Colors for different device types
  const COLORS = {
    desktop: "#3b82f6", // blue
    mobile: "#10b981",  // green
    tablet: "#f59e0b",  // amber
    other: "#6366f1"    // indigo
  };

  return (
    <Card className="bg-slate-900/80 border-slate-800/80 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-base">Device Types</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS] || "#6366f1"} 
                  />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "#0f172a", 
                  border: "1px solid #1e293b",
                  borderRadius: "4px",
                  color: "#e2e8f0"
                }}
                formatter={(value: number) => [`${value} visits`, "Visits"]}
              />
              <Legend 
                layout="vertical" 
                verticalAlign="middle" 
                align="right"
                wrapperStyle={{ fontSize: 12, color: "#94a3b8" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 