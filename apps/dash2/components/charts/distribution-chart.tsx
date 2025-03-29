import { useMemo, useCallback, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, Sector } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SkeletonChart } from "./skeleton-chart";
import { PieChartIcon, SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

// Custom tooltip component for dark mode compatibility
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const data = payload[0];
  return (
    <div className="bg-white dark:bg-gray-800 border border-border p-2 rounded-md shadow-md text-xs">
      <p className="font-semibold text-foreground mb-1">{data.name}</p>
      <div className="flex items-center gap-1">
        <div 
          className="w-2 h-2 rounded-full" 
          style={{ backgroundColor: data.payload.color }}
        />
        <span className="text-muted-foreground">Count: </span>
        <span className="font-medium text-foreground">
          {data.value.toLocaleString()}
        </span>
      </div>
      {data.payload && data.payload.percent && (
        <div className="text-foreground mt-0.5">
          <span className="text-muted-foreground">Percentage: </span>
          <span className="font-medium">
            {(data.payload.percent * 100).toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
};

interface DistributionChartProps {
  data: Array<{
    name: string;
    value: number;
    color?: string;
  }> | undefined;
  isLoading: boolean;
  title: string;
  description?: string;
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  colors?: string[];
}

// Enhanced color palette with more vibrant colors
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function DistributionChart({ 
  data, 
  isLoading, 
  title, 
  description,
  height = 240, 
  innerRadius = 50,
  outerRadius = 70,
  colors = COLORS 
}: DistributionChartProps) {
  // Track active index for hover animations
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  
  // Memoize chart data for better performance
  const chartData = useMemo(() => {
    if (!data) return [];
    
    // Sort by value descending for better visualization
    return [...data]
      .sort((a, b) => b.value - a.value)
      .map((item, index) => ({
        ...item,
        color: item.color || colors[index % colors.length]
      }));
  }, [data, colors]);
  
  // Calculate total once for all calculations
  const total = useMemo(() => 
    chartData.reduce((sum, item) => sum + item.value, 0), 
    [chartData]
  );
  
  // Add percent to each item for the tooltip
  const chartDataWithPercent = useMemo(() => {
    if (total === 0) return chartData;
    return chartData.map(item => ({
      ...item,
      percent: item.value / total
    }));
  }, [chartData, total]);
  
  // Optimize event handlers with useCallback
  const handlePieEnter = useCallback((_: any, index: number) => {
    setActiveIndex(index);
  }, []);
  
  const handlePieLeave = useCallback(() => {
    setActiveIndex(-1);
  }, []);
  
  // Memoize custom label renderer
  const renderCustomizedLabel = useCallback(
    ({ name, percent }: { name: string; percent: number }) => {
      // For small slices, don't show labels to avoid overlap
      if (percent < 0.05) return null;
      const displayName = name.length > 10 ? `${name.substring(0, 6)}...` : name;
      return `${displayName} (${(percent * 100).toFixed(0)}%)`;
    }, 
    []
  );
  
  // Memoize active shape renderer
  const renderActiveShape = useCallback((props: any) => {
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
          filter="drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.1))"
        />
      </g>
    );
  }, []);
  
  // Memoize legend formatter
  const legendFormatter = useCallback((value: string) => {
    // Truncate long names
    return value.length > 12 ? `${value.substring(0, 10)}...` : value;
  }, []);

  if (isLoading) {
    return <SkeletonChart height={height} title={title} className="w-full" />;
  }

  if (!data?.length) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-0.5 pt-3 px-3">
          <CardTitle className="text-xs font-medium">{title}</CardTitle>
          {description && <CardDescription className="text-xs">{description}</CardDescription>}
        </CardHeader>
        <CardContent className="h-[180px] flex flex-col items-center justify-center text-muted-foreground p-4">
          <div className="relative mb-3">
            <PieChartIcon className="h-10 w-10 text-muted-foreground/40" strokeWidth={1} />
            <SparklesIcon className="h-4 w-4 text-primary absolute -bottom-1 -right-1" />
          </div>
          <p className="text-sm font-medium text-center mb-1">No data available yet</p>
          <p className="text-xs text-center max-w-[240px] mb-3">
            This chart will populate as visitors interact with your website. Make sure you've added the tracking code to your site.
          </p>
          {/* <div className="mt-2 flex items-center gap-2 text-xs">
            <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
              <a href="/settings">Check installation</a>
            </Button>
            <Button variant="link" size="sm" className="h-7 text-xs px-2" asChild>
              <a href="/docs/getting-started" target="_blank" rel="noopener noreferrer">
                Read the docs
              </a>
            </Button>
          </div> */}
        </CardContent>
      </Card>
    );
  }

  // Calculate dimensions for chart
  const legendHeight = 35; // Approximate height of the legend
  const effectiveChartHeight = height - legendHeight;
  const effectiveOuterRadius = Math.min(outerRadius, effectiveChartHeight * 0.3);

  return (
    <Card className="w-full">
      <CardHeader className="pb-0.5 pt-2 px-3">
        <CardTitle className="text-xs font-medium">{title}</CardTitle>
        {description && <CardDescription className="text-xs">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="pb-2 pt-0 px-1">
        <div style={{ width: '100%', height: effectiveChartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 10, right: 10, bottom: 30, left: 10 }}>
              <Pie
                data={chartDataWithPercent}
                cx="50%"
                cy="50%"
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                innerRadius={Math.min(innerRadius, effectiveOuterRadius * 0.65)}
                outerRadius={effectiveOuterRadius}
                dataKey="value"
                nameKey="name"
                paddingAngle={1}
                label={renderCustomizedLabel}
                labelLine={false}
                onMouseEnter={handlePieEnter}
                onMouseLeave={handlePieLeave}
                animationBegin={0}
                animationDuration={800}
                isAnimationActive={true}
              >
                {chartDataWithPercent.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color} 
                    stroke="var(--background)"
                    strokeWidth={0.5}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} wrapperStyle={{ outline: 'none' }} />
              <Legend 
                layout="horizontal" 
                verticalAlign="bottom" 
                align="center"
                wrapperStyle={{ 
                  fontSize: '10px', 
                  paddingTop: '8px',
                  width: '100%',
                  bottom: 0
                }}
                formatter={legendFormatter}
                iconSize={8}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 