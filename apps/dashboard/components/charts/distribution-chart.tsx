import { useMemo, useCallback, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, Sector } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SkeletonChart } from "./skeleton-chart";
import { PieChartIcon } from "lucide-react";

// Simple color palette
const COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#ec4899'  // Pink
];

interface ChartDataItem {
  name: string;
  value: number;
  color?: string;
}

interface DistributionChartProps {
  data: ChartDataItem[] | undefined;
  isLoading: boolean;
  title: string;
  description?: string;
  height?: number;
}

// Simple tooltip
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;
  
  const data = payload[0];
  return (
    <div className="bg-background border border-border p-2 rounded-md shadow-md text-xs">
      <p className="font-semibold">{data.name}</p>
      <p>
        <span className="text-muted-foreground">Count: </span>
        <span className="font-medium">{data.value.toLocaleString()}</span>
      </p>
      {data.payload.percent && (
        <p>
          <span className="text-muted-foreground">Percentage: </span>
          <span className="font-medium">{(data.payload.percent * 100).toFixed(1)}%</span>
        </p>
      )}
    </div>
  );
};

// Active shape renderer
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 3}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
};

export function DistributionChart({ 
  data, 
  isLoading, 
  title, 
  description,
  height = 190
}: DistributionChartProps) {
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  
  // Process chart data
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Sort by value
    const sortedData = [...data].sort((a, b) => b.value - a.value);
    const total = sortedData.reduce((sum, item) => sum + item.value, 0);
    
    // Add colors and percentages
    return sortedData.map((item, index) => ({
      ...item,
      color: item.color || COLORS[index % COLORS.length],
      percent: total > 0 ? item.value / total : 0
    }));
  }, [data]);
  
  // Event handlers
  const onPieEnter = useCallback((_: unknown, index: number) => {
    setActiveIndex(index);
  }, []);
  
  const onPieLeave = useCallback(() => {
    setActiveIndex(-1);
  }, []);

  if (isLoading) {
    return <SkeletonChart height={height} title={title} />;
  }

  if (!chartData.length) {
    return (
      <Card className="w-full">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {description && <CardDescription className="text-xs">{description}</CardDescription>}
        </CardHeader>
        <CardContent className="flex items-center justify-center p-4">
          <div className="text-center py-6">
            <PieChartIcon className="mx-auto h-8 w-8 text-muted-foreground/40" strokeWidth={1.5} />
            <p className="mt-2 text-sm font-medium">No data available</p>
            <p className="text-xs text-muted-foreground mt-1">Data will appear as it's collected</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {description && <CardDescription className="text-xs">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="pt-0 pb-4 px-0">
        <div style={{ width: '100%', height: height - 50 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                innerRadius={40}
                outerRadius={60}
                paddingAngle={2}
                dataKey="value"
                onMouseEnter={onPieEnter}
                onMouseLeave={onPieLeave}
              >
                {chartData.map((entry) => (
                  <Cell 
                    key={`cell-${entry.name}`} 
                    fill={entry.color} 
                    stroke="var(--background)"
                    strokeWidth={1}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} wrapperStyle={{ outline: 'none' }} />
              <Legend 
                layout="horizontal" 
                verticalAlign="bottom" 
                align="center"
                formatter={(value: string, entry: any) => {
                  const item = entry.payload;
                  const percentage = item.percent ? ` (${(item.percent * 100).toFixed(0)}%)` : '';
                  return <span className="text-xs">{value}{percentage}</span>;
                }}
                wrapperStyle={{ fontSize: '10px', bottom: 0 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 