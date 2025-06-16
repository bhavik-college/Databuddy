"use client";

import { useTheme } from 'next-themes';
import { useMiniChartData } from '@/hooks/use-analytics';
import type { MiniChartDataPoint } from '@/hooks/use-analytics';
import { useState, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MiniChartProps {
  websiteId: string;
  className?: string;
  data?: MiniChartDataPoint[];
  isLoading?: boolean;
  isError?: boolean;
}

export function MiniChart({ 
  websiteId, 
  className = "",
  data,
  isLoading: externalLoading,
  isError: externalError
}: MiniChartProps) {
  const [activeBarIndex, setActiveBarIndex] = useState<number | null>(null);
  
  const { 
    data: chartData, 
    isLoading: internalLoading, 
    isError: internalError 
  } = useMiniChartData(websiteId, { 
    enabled: !data && !externalLoading && !externalError
  });

  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const displayData = data || chartData?.data;
  const isLoading = externalLoading !== undefined ? externalLoading : internalLoading;
  const isError = externalError !== undefined ? externalError : internalError;
  
  const total = useMemo(() => {
    if (!displayData || displayData.length === 0) return 0;
    return displayData.reduce((sum: number, item: any) => sum + item.value, 0);
  }, [displayData]);

  const trend = useMemo(() => {
    if (!displayData || displayData.length < 2) return 0;
    const halfLength = Math.floor(displayData.length / 2);
    if (halfLength === 0 && displayData.length === 1) return 0; 
    if (halfLength === 0) return displayData[0]?.value > 0 ? 100 : 0;

    const oldHalf = displayData.slice(0, halfLength);
    const newHalf = displayData.slice(halfLength);
    
    if (newHalf.length === 0 && oldHalf.length > 0) {
        const oldAvgSingle = oldHalf.reduce((sum: number, item: any) => sum + item.value, 0) / oldHalf.length;
        return oldAvgSingle > 0 ? 100 : (oldAvgSingle < 0 ? -100 : 0);
    }
    if (newHalf.length === 0 && oldHalf.length === 0) return 0;

          const oldAvg = oldHalf.reduce((sum: number, item: any) => sum + item.value, 0) / oldHalf.length;
      const newAvg = newHalf.reduce((sum: number, item: any) => sum + item.value, 0) / newHalf.length;
    
    if (oldAvg === 0) return newAvg > 0 ? 100 : (newAvg < 0 ? -100 : 0);
    return Math.round(((newAvg - oldAvg) / Math.abs(oldAvg)) * 100);
  }, [displayData]);
  
  const maxValue = useMemo(() => {
    return displayData && displayData.length > 0 
      ? Math.max(...displayData.map(d => d.value))
      : 0;
  }, [displayData]);
  
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return dateStr;
    }
  };
  
  if (isLoading) {
    return (
      <div className={`relative h-14 ${className}`}>
        <div className="w-full h-full bg-muted/30 animate-pulse rounded-md" />
      </div>
    );
  }
  
  if (isError || !displayData || displayData.length === 0) {
    return (
      <div className={`relative h-14 ${className}`}>
        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground rounded-md border border-dashed">
          No activity data
        </div>
      </div>
    );
  }
  
  const trendColor = trend > 0 ? 'text-green-500' : trend < 0 ? 'text-red-500' : 'text-muted-foreground';
  const TrendIconComponent = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  
  const getBarBackground = (index: number) => {
    if (activeBarIndex === index) {
      return isDark ? 'bg-primary/50' : 'bg-primary/50';
    }
    const intensityFactor = displayData.length > 1 ? index / (displayData.length - 1) : 0.5;
    const intensity = Math.round(intensityFactor * 100);
    return isDark
      ? `bg-gradient-to-t from-primary/10 to-primary/${Math.max(20, Math.min(80, 20 + intensity))}`
      : `bg-gradient-to-t from-primary/20 to-primary/${Math.max(30, Math.min(90, 30 + intensity))}`;
  };
  
  return (
    <div className={`relative h-14 ${className}`}>
      <div className="absolute inset-0 flex items-center justify-between px-1 z-10 pointer-events-none">
        <div className="flex flex-col justify-center h-full text-xs">
          <div className="font-medium">{total.toLocaleString()}</div>
          <div className={cn("text-[10px] flex items-center gap-0.5", trendColor)}>
            <TrendIconComponent className="h-3 w-3 inline mr-0.5" />
            <span>{trend > 0 ? '+' : ''}{trend}%</span>
          </div>
        </div>
        
        {activeBarIndex !== null && displayData[activeBarIndex] && (
          <div className={cn(
            "bg-background/90 backdrop-blur-sm px-2 py-1 rounded text-[10px]",
            "shadow-sm border border-border/40"
          )}>
            <div className="font-medium">{displayData[activeBarIndex].value.toLocaleString()}</div>
            <div className="opacity-75">{formatDate(displayData[activeBarIndex].date)}</div>
          </div>
        )}
      </div>
      
      <div className="absolute inset-0 flex items-end gap-[1px] z-0">
        {displayData.map((item, index) => {
          const height = maxValue === 0 ? 0 : Math.max(5, (item.value / maxValue) * 100);
          
          return (
            <div
              key={`${item.date}-${item.value}`}
              className={cn(
                "flex-1 rounded-sm transition-all duration-200",
                getBarBackground(index)
              )}
              style={{ 
                height: `${height}%`,
                transform: `scaleY(${activeBarIndex === index ? 1.05 : 1})`,
                zIndex: activeBarIndex === index ? 5 : 1
              }}
              onMouseEnter={() => setActiveBarIndex(index)}
              onMouseLeave={() => setActiveBarIndex(null)}
            />
          );
        })}
      </div>
    </div>
  );
} 