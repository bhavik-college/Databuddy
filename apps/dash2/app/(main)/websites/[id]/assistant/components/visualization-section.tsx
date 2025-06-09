"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, LineChart, PieChart, TrendingUp, Database, Sparkles, AreaChart, BarChart as BarChartIcon } from "lucide-react";
import type { WebsiteDataTabProps } from "../../_components/utils/types";
import type { Message } from "../types/message";
import { VersatileAIChart, type VersatileChartType } from '@/components/charts/versatile-ai-chart';
import { DataTable } from "@/components/analytics/data-table";
import type { ColumnDef } from "@tanstack/react-table";

interface VisualizationSectionProps extends WebsiteDataTabProps {
  latestVisualization?: Message;
  onQuickInsight?: (prompt: string) => void;
  currentMessage: Message | undefined;
  hasVisualization?: boolean;
}


const getChartIcon = (chartType: string) => {
  switch (chartType?.toLowerCase()) {
    case 'bar': return <BarChartIcon className="h-3 w-3" />;
    case 'line': return <LineChart className="h-3 w-3" />;
    case 'pie': return <PieChart className="h-3 w-3" />;
    case 'area': return <AreaChart className="h-3 w-3" />;
    case 'stacked_bar': return <BarChartIcon className="h-3 w-3" />;
    case 'multi_line': return <LineChart className="h-3 w-3" />;
    default: return <BarChart3 className="h-3 w-3" />;
  }
};

export function VisualizationSkeleton() {
  return (
    <div className="flex flex-col h-full bg-background border rounded shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 p-3 border-b bg-muted/30 flex-shrink-0">
        <Skeleton className="w-8 h-8 rounded" />
        <div className="flex-1">
          <Skeleton className="h-5 w-32 mb-1" />
        </div>
        <Skeleton className="h-6 w-24 rounded-md" /> 
      </div>
      <div className="flex-1 p-3 space-y-4 overflow-y-auto">
        <Skeleton className="w-full h-56 rounded-lg" />
        <div>
          <Skeleton className="h-4 w-1/4 mb-2" />
          <Skeleton className="w-full h-32 rounded-lg" />
        </div>
      </div>
      <div className="p-3 border-t bg-muted/20 flex-shrink-0">
        <Skeleton className="h-4 w-24 mb-1.5" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
          <Skeleton className="h-7 w-full rounded" />
          <Skeleton className="h-7 w-full rounded" />
        </div>
      </div>
    </div>
  );
}

interface TransformResult {
  chartData: any[];
  xAxisKey: string;
}

export default function VisualizationSection({ 
  latestVisualization,
  hasVisualization = false
}: VisualizationSectionProps) {
  const rawAiData = useMemo(() => {
    if (!latestVisualization?.data || latestVisualization.data.length === 0) return [];
    return latestVisualization.data;
  }, [latestVisualization]);

  const chartDisplayConfig = useMemo(() => {
    if (!rawAiData || rawAiData.length === 0) return { chartDataForDisplay: [], finalXAxisKey: 'date' };
    const chartType = latestVisualization?.chartType;
    
    // For bar charts, use the raw data directly if it's already in the right format
    if (chartType === 'bar' && rawAiData.length > 0) {
      const firstRow = rawAiData[0];
      const keys = Object.keys(firstRow);
      
      // Find the categorical key (string) and metric key (number)
      const categoryKey = keys.find(k => typeof firstRow[k] === 'string') || keys[0];
      const metricKey = keys.find(k => typeof firstRow[k] === 'number') || keys[1];
      
      if (categoryKey && metricKey) {
        // Create properly formatted data for the chart
        const formattedData = rawAiData.map(item => ({
          [categoryKey]: String(item[categoryKey]),
          [metricKey]: Number(item[metricKey]) || 0
        }));
        
        // Sort by the metric value in descending order
        formattedData.sort((a, b) => (Number(b[metricKey]) || 0) - (Number(a[metricKey]) || 0));
        
        const MAX_CHART_ITEMS = 10; // Show up to 10 items for "Top 10" queries
        const finalData = formattedData.slice(0, MAX_CHART_ITEMS);
        
        return { 
          chartDataForDisplay: finalData, 
          finalXAxisKey: categoryKey,
          metricKey: metricKey 
        };
      }
    }
    
    // Fall back to the original transformation for other chart types
    const { chartData: transformedDataFromFunc, xAxisKey: xAxisKeyFromFunc } = 
      transformDataForMetricsChart(rawAiData, chartType);

    let workingData = transformedDataFromFunc; 

    if (chartType === 'bar' && xAxisKeyFromFunc === 'date' && workingData.length > 0 && workingData[0]) {
      const metricKeyForAggregation = 'pageviews' in workingData[0] ? 'pageviews' : 
                                      Object.keys(workingData[0]).find(k => typeof workingData[0][k] === 'number' && k !== xAxisKeyFromFunc);
      
      if (metricKeyForAggregation) {
        const aggregatedMap = new Map<string, number>();
        for (const item of workingData) {
          const displayName = String(item[xAxisKeyFromFunc]);
          const metricValue = Number(item[metricKeyForAggregation]) || 0;
          aggregatedMap.set(displayName, (aggregatedMap.get(displayName) || 0) + metricValue);
        }
        workingData = Array.from(aggregatedMap, ([name, value]) => ({
          [xAxisKeyFromFunc]: name,
          [metricKeyForAggregation]: value
        }));
      }
    }
    
    let finalChartData = workingData; 
    const MAX_CHART_ITEMS = 7;

    if ((chartType === 'bar' || chartType === 'pie') && workingData.length > MAX_CHART_ITEMS) {
      const primaryMetricKeyForSorting = workingData[0] && 'pageviews' in workingData[0] ? 'pageviews' : 
                                     workingData[0] ? Object.keys(workingData[0]).find(k => typeof workingData[0][k] === 'number' && k !== xAxisKeyFromFunc) : undefined;
      
      if (primaryMetricKeyForSorting) {
        const sortableData = [...workingData];
        sortableData.sort((a, b) => (Number(b[primaryMetricKeyForSorting]) || 0) - (Number(a[primaryMetricKeyForSorting]) || 0));
        finalChartData = sortableData.slice(0, MAX_CHART_ITEMS);
      } else {
        finalChartData = workingData.slice(0, MAX_CHART_ITEMS);
      }
    }
    return { chartDataForDisplay: finalChartData, finalXAxisKey: xAxisKeyFromFunc };
  }, [rawAiData, latestVisualization?.chartType]);

  const columnsForTable = useMemo(() => {
    if (!rawAiData || rawAiData.length === 0) return [];
    return generateColumns(rawAiData);
  }, [rawAiData]);

  const renderChartContent = () => {
    if (!hasVisualization || !rawAiData || rawAiData.length === 0 || !latestVisualization?.chartType) {
      return (
        <div className={`flex flex-col items-center justify-center h-full text-muted-foreground py-6 text-center min-h-[200px] transition-all duration-300 ${hasVisualization ? 'animate-pulse' : 'animate-in fade-in-0 slide-in-from-bottom-2'}`}>
          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-3 transition-all duration-300">
            <Database className="h-6 w-6 opacity-50" />
          </div>
          <h3 className="font-medium mb-1 text-sm transition-all duration-300">
            {hasVisualization ? 'Loading Visualization...' : 'No Visualization Available'}
          </h3>
          <p className="text-xs max-w-xs px-4 transition-all duration-300">
            {hasVisualization 
              ? 'Processing your data query...'
              : 'Ask a question that needs a chart or table to see your data visualized here. For single metrics or general questions, check the chat area.'
            }
          </p>
        </div>
      );
    }

    const { chartType: aiChartType } = latestVisualization;
    const showMetricsChart = ['line', 'bar', 'area', 'multi_line', 'stacked_bar'].includes(aiChartType?.toLowerCase() || '');

    return (
      <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
        {showMetricsChart && chartDisplayConfig.chartDataForDisplay.length > 0 && (
          <div className="bg-muted/30 p-2 rounded-lg shadow-sm animate-in fade-in-0 slide-in-from-top-1 duration-700 delay-100">
            <VersatileAIChart
              chartType={aiChartType ? aiChartType as VersatileChartType : 'area'}
              data={chartDisplayConfig.chartDataForDisplay} 
              isLoading={false}
              title={getChartTypeDescription(aiChartType) || "Chart"}
              description={"Chart based on your query"}
              height={260}
              xAxisDataKey={chartDisplayConfig.finalXAxisKey}
            />
          </div>
        )}
        
        <div className="animate-in fade-in-0 slide-in-from-bottom-1 duration-700 delay-200">
          <DataTable
            columns={columnsForTable}
            data={rawAiData}
            title="Detailed Data"
            description={`Full data (${rawAiData.length} rows). Click headers to sort.`}
            showSearch={rawAiData.length > 7}
            initialPageSize={7}
            minHeight={150}
            emptyMessage="No data to display in table."
            className="bg-background/70 backdrop-blur-sm"
          />
        </div>
      </div>
    );
  };
  
  const getChartTypeDescription = (chartType?: string) => {
    if (!chartType) return "Data";
    switch (chartType.toLowerCase()) {
      case 'multi_line': return 'Multi-Series Line Chart';
      case 'stacked_bar': return 'Stacked Bar Chart';
      case 'area': return 'Area Chart';
      case 'line': return 'Line Chart';
      case 'bar': return 'Bar Chart';
      case 'pie': return 'Pie Chart';
      default: return chartType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-background border rounded shadow-sm overflow-hidden min-h-0 transition-all duration-300">
      <div className={`flex items-center gap-2 p-3 border-b flex-shrink-0 transition-all duration-300 ${hasVisualization ? 'bg-muted/30' : 'bg-muted/10'}`}>
        <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 transition-all duration-300 ${hasVisualization ? 'bg-primary/10' : 'bg-muted/20'}`}>
          <TrendingUp className={`h-4 w-4 transition-all duration-300 ${hasVisualization ? 'text-primary' : 'text-muted-foreground/60'}`} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className={`font-semibold text-base truncate transition-all duration-300 ${hasVisualization ? 'text-foreground' : 'text-muted-foreground/80'}`}>
            Data Visualization
          </h2>
        </div>
        {latestVisualization?.chartType && hasVisualization && (
          <Badge variant="outline" className="gap-1 text-xs py-1 px-2 whitespace-nowrap animate-in fade-in-0 slide-in-from-right-1 duration-300">
            {getChartIcon(latestVisualization.chartType)}
            {getChartTypeDescription(latestVisualization.chartType)}
            {rawAiData && rawAiData.length > 0 && ` (${rawAiData.length})`}
          </Badge>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto min-h-0">
        <ScrollArea className="h-full">
          <div className={`p-3 transition-all duration-300 ${hasVisualization ? 'opacity-100' : 'opacity-90'}`}>
            {renderChartContent()}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

const REFERRER_NAME_MAP: Record<string, string> = {
  'google.com': 'Google',
  'www.google.com': 'Google',
  'm.google.com': 'Google',
  't.co': 'Twitter / X',
  'twitter.com': 'Twitter / X',
  'x.com': 'Twitter / X',
  'facebook.com': 'Facebook',
  'www.facebook.com': 'Facebook',
  'm.facebook.com': 'Facebook',
  'linkedin.com': 'LinkedIn',
  'www.linkedin.com': 'LinkedIn',
  'bing.com': 'Bing',
  'www.bing.com': 'Bing',
  'duckduckgo.com': 'DuckDuckGo',
  'yahoo.com': 'Yahoo',
  'yandex.com': 'Yandex',
  'baidu.com': 'Baidu',
  'github.com': 'GitHub',
  'producthunt.com': 'Product Hunt',
  'reddit.com': 'Reddit',
  'www.reddit.com': 'Reddit',
  'dev.to': 'DEV Community',
  'medium.com': 'Medium',
  'stackoverflow.com': 'Stack Overflow',
  'slack.com': 'Slack',
  'localhost': 'Localhost',
};

function getReferrerDisplayName(referrer: string | unknown): string {
  if (referrer === null || referrer === '' || (typeof referrer === 'string' && referrer.toLowerCase() === '(direct)')) {
    return 'Direct';
  }
  if (typeof referrer !== 'string' || !referrer.trim()) { 
    return 'Unknown';
  }

  const trimmedReferrer = referrer.trim();

  try {
    const fullUrl = trimmedReferrer.startsWith('http://') || trimmedReferrer.startsWith('https://') 
      ? trimmedReferrer 
      : `http://${trimmedReferrer}`;
    const url = new URL(fullUrl);
    const hostname = url.hostname;

    const baseHostname = hostname.startsWith('www.') ? hostname.substring(4) : hostname;

    if (REFERRER_NAME_MAP[hostname]) {
      return REFERRER_NAME_MAP[hostname];
    }
    if (hostname !== baseHostname && REFERRER_NAME_MAP[baseHostname]) {
      return REFERRER_NAME_MAP[baseHostname];
    }
    
    return baseHostname.charAt(0).toUpperCase() + baseHostname.slice(1);
  } catch (e) {
    return trimmedReferrer.charAt(0).toUpperCase() + trimmedReferrer.slice(1);
  }
}

const generateColumns = (data: any[]): ColumnDef<any, any>[] => {
  if (!data || data.length === 0 || !data[0]) return [];
  const firstItemKeys = Object.keys(data[0]);
  
  return firstItemKeys.map((key) => ({
    accessorKey: key,
    header: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    cell: ({ row }) => {
      const value = row.getValue(key);
      if (typeof value === 'number') {
        return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
      }
      if (typeof value === 'string' && (key.toLowerCase().includes('referrer') || key.toLowerCase().includes('source'))) {
        return getReferrerDisplayName(value);
      }
      return String(value);
    },
  }));
};

// Moved TIME_KEYS to be globally accessible if needed by future helpers or for clarity.
const TIME_KEYS = ['date', 'time', 'hour', 'day', 'week', 'month', 'timestamp'];

const transformDataForMetricsChart = (
  rawData: any[], 
  chartTypeInput?: string
  // aiQuery parameter removed as it was unused
): TransformResult => {
  if (!rawData || rawData.length === 0 || !rawData[0]) return { chartData: [], xAxisKey: 'date' }; 

  let determinedXAxisKey = 'date';
  const chartType = chartTypeInput?.toLowerCase();
  // TIME_KEYS is now global. Other constants remain local as they are only used within this function scope.
  const DATE_ALIASES = ['date', 'time', 'day', 'timestamp', 'category', 'label', 'name', 'month', 'year', 'hour', 'period', 'referrer', 'source'];
  const PRIMARY_METRIC_ALIASES = ['pageviews', 'page_views', 'page views', 'count', 'visits', 'value', 'sessions', 'users', 'total', 'metric', 'records', 'events', 'avg_load_time', 'load_time'];
  const SECONDARY_METRIC_ALIASES = ['visitors', 'unique_visitors', 'unique visitors', 'users', 'distinct_users', 'uniques'];


  if (chartType === 'multi_line') {
    const firstItemKeys = Object.keys(rawData[0]);
    const timeCol = firstItemKeys.find((k: string) => k.toLowerCase() === 'date' || k.toLowerCase() === 'hour');
    let categoryCol: string | undefined;
    let metricCol: string | undefined;

    if (timeCol) {
      categoryCol = firstItemKeys.find((k: string) => k !== timeCol && typeof rawData[0][k] === 'string');
      metricCol = firstItemKeys.find((k: string) => k !== timeCol && typeof rawData[0][k] === 'number');
    }

    if (timeCol && categoryCol && metricCol) {
      determinedXAxisKey = timeCol;
      const pivotedData: { [key: string]: any } = {};
      const _timeCol = timeCol;
      const _categoryCol = categoryCol;
      const _metricCol = metricCol;

      for (const item of rawData) {
        const timeVal = String(item[_timeCol]);
        let categoryVal = String(item[_categoryCol]);
        const metricVal = Number(item[_metricCol]);

        if (_categoryCol.toLowerCase().includes('path')) {
          categoryVal = categoryVal.startsWith('/') && categoryVal.length > 1 ? categoryVal.substring(1) : categoryVal;
          categoryVal = categoryVal.split('?')[0] || 'Home';
          if (categoryVal.length > 20) categoryVal = `${categoryVal.substring(0, 17)}...`;
        }
        if (!pivotedData[timeVal]) {
          pivotedData[timeVal] = { [_timeCol]: timeVal };
        }
        pivotedData[timeVal][categoryVal] = metricVal;
      }

      const allCategoryKeys = new Set<string>();
      for (const item of rawData) {
        let categoryVal = String(item[_categoryCol]);
         if (_categoryCol.toLowerCase().includes('path')) {
          categoryVal = categoryVal.startsWith('/') && categoryVal.length > 1 ? categoryVal.substring(1) : categoryVal;
          categoryVal = categoryVal.split('?')[0] || 'Home';
          if (categoryVal.length > 20) categoryVal = `${categoryVal.substring(0, 17)}...`;
        }
        allCategoryKeys.add(categoryVal);
      }
      
      const result = Object.values(pivotedData).map((dataPoint: any) => {
        const completeDataPoint = { ...dataPoint };
        for (const catKey of allCategoryKeys) {
          if (!Object.prototype.hasOwnProperty.call(completeDataPoint, catKey)) {
            completeDataPoint[catKey] = null;
          }
        }
        return completeDataPoint;
      });

      if (TIME_KEYS.includes(_timeCol.toLowerCase())) {
        try {
          result.sort((a, b) => new Date(a[_timeCol]).getTime() - new Date(b[_timeCol]).getTime());
        } catch (e) { /* ignore sort error for non-standard time keys */ }
      }
      return { chartData: result, xAxisKey: determinedXAxisKey };
    }
  }

  const firstItemKeys = Object.keys(rawData[0]);
  const identifiedTimeKeyForSingleSeries = firstItemKeys.find((key: string) => TIME_KEYS.includes(key.toLowerCase()));
  const identifiedMetricKey = firstItemKeys.find((key: string) => key !== identifiedTimeKeyForSingleSeries && typeof rawData[0][key] === 'number');
  
  determinedXAxisKey = 'date'; 

  const transformedChartData = rawData.map(item => {
    const transformed: any = {};
    const originalKeys = Object.keys(item);
    const usedOriginalKeys = new Set<string>();
    const dateField = determinedXAxisKey;

    let categoryValueToSet: string | number | Date | undefined | null = undefined;
    let foundDateKeyActual: string | undefined = identifiedTimeKeyForSingleSeries;

    if (foundDateKeyActual && originalKeys.includes(foundDateKeyActual)) {
      categoryValueToSet = item[foundDateKeyActual];
      usedOriginalKeys.add(foundDateKeyActual);
    } else {
      // DATE_ALIASES is defined locally
      foundDateKeyActual = originalKeys.find((k: string) => DATE_ALIASES.includes(k.toLowerCase()));
      if (foundDateKeyActual) {
        categoryValueToSet = item[foundDateKeyActual];
        usedOriginalKeys.add(foundDateKeyActual);
      }
    }
    
    if (categoryValueToSet === undefined && (chartType === 'bar' || chartType === 'pie')) {
      const stringKey = originalKeys.find((k: string) => typeof item[k] === 'string' && !usedOriginalKeys.has(k));
      if (stringKey) {
        categoryValueToSet = item[stringKey];
        foundDateKeyActual = stringKey;
        usedOriginalKeys.add(stringKey);
      }
    }

    if (categoryValueToSet === undefined && originalKeys.length > 0) {
      const firstNonUsedKey = originalKeys.find((k: string) => !usedOriginalKeys.has(k));
      if (firstNonUsedKey) {
         categoryValueToSet = String(item[firstNonUsedKey]);
         foundDateKeyActual = firstNonUsedKey; 
         usedOriginalKeys.add(firstNonUsedKey);
      }
    }

    if (chartType === 'bar' && typeof categoryValueToSet === 'string') {
      const keyUsedForCategoryIsReferrer = (foundDateKeyActual || '').toLowerCase().includes('referrer') || (foundDateKeyActual || '').toLowerCase().includes('source');
      const potentialReferrerIndicators = ['/', '.com', '.net', '.org', 'http', 'www'];
      // Corrected based on previous partial application: removed categoryValueToSet && and ! from categoryValueToSet.toLowerCase()
      if (keyUsedForCategoryIsReferrer || potentialReferrerIndicators.some(indicator => categoryValueToSet.toLowerCase().includes(indicator))) {
        transformed[dateField] = getReferrerDisplayName(categoryValueToSet);
      } else {
        transformed[dateField] = categoryValueToSet;
      }
    } else if (typeof categoryValueToSet === 'object' && categoryValueToSet !== null && categoryValueToSet instanceof Date) {
      transformed[dateField] = categoryValueToSet.toISOString().split('T')[0];
    } else {
      transformed[dateField] = String(categoryValueToSet ?? 'Unknown');
    }

    const primaryMetricField = identifiedMetricKey || 'pageviews';
    transformed[primaryMetricField] = null;

    // PRIMARY_METRIC_ALIASES is defined locally
    const currentPrimaryMetricAliases = [...PRIMARY_METRIC_ALIASES];
    if (identifiedMetricKey && !currentPrimaryMetricAliases.includes(identifiedMetricKey.toLowerCase())) {
      currentPrimaryMetricAliases.push(identifiedMetricKey.toLowerCase());
    }

    let foundPrimaryMetricKey = originalKeys.find((k: string) =>
      currentPrimaryMetricAliases.includes(k.toLowerCase()) && !usedOriginalKeys.has(k) &&
      k !== foundDateKeyActual && typeof item[k] === 'number'
    );

    if (!foundPrimaryMetricKey) { 
        foundPrimaryMetricKey = identifiedMetricKey && !usedOriginalKeys.has(identifiedMetricKey) && typeof item[identifiedMetricKey] === 'number' ? identifiedMetricKey : 
                                originalKeys.find((k: string) => typeof item[k] === 'number' && !usedOriginalKeys.has(k) && k !== foundDateKeyActual);
    }
    
    if (foundPrimaryMetricKey && item[foundPrimaryMetricKey] !== undefined) {
      transformed[primaryMetricField] = Number(item[foundPrimaryMetricKey]) || 0;
      usedOriginalKeys.add(foundPrimaryMetricKey);
    } else if (Object.keys(transformed).length === 1 && identifiedMetricKey && item[identifiedMetricKey] !== undefined) {
      transformed[identifiedMetricKey] = Number(item[identifiedMetricKey]) || 0;
      usedOriginalKeys.add(identifiedMetricKey);
    }

    if (chartType === 'line' || chartType === 'area') { 
        const visitorsMetricName = 'visitors';
        // SECONDARY_METRIC_ALIASES is defined locally
        const foundSecondaryMetricKey = originalKeys.find((k: string) =>
            SECONDARY_METRIC_ALIASES.includes(k.toLowerCase()) && !usedOriginalKeys.has(k) &&
            k !== foundDateKeyActual && k !== foundPrimaryMetricKey && typeof item[k] === 'number'
        );
        if (foundSecondaryMetricKey && item[foundSecondaryMetricKey] !== undefined) {
            transformed[visitorsMetricName] = Number(item[foundSecondaryMetricKey]) || 0;
            usedOriginalKeys.add(foundSecondaryMetricKey);
        }
    }
    
    for (const key of originalKeys) {
      if (typeof item[key] === 'number' && !usedOriginalKeys.has(key) && key !== foundDateKeyActual) {
        const sanitizedKey = key.replace(/[^a-zA-Z0-9_]/g, '_');
        if (!Object.prototype.hasOwnProperty.call(transformed, sanitizedKey)) {
             transformed[sanitizedKey] = Number(item[key]) || 0;
        }
      }
    }
    return transformed;
  });
  return { chartData: transformedChartData, xAxisKey: determinedXAxisKey };
}; 