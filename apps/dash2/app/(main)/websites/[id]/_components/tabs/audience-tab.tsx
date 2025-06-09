"use client";

import { useMemo, useEffect, useCallback } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/analytics/data-table";

import { useBatchDynamicQuery } from "@/hooks/use-dynamic-query";
import type { FullTabProps } from "../utils/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Globe, Laptop, Smartphone, Tablet, Monitor, HelpCircle, Languages, Wifi, WifiOff, MapPin, Clock } from 'lucide-react';
import { 

  PercentageBadge,
  type TechnologyTableEntry,
} from "../utils/technology-helpers";
import { BrowserIcon } from "@/components/icon";

// Define types for geographic data with percentage
interface GeographicEntry {
  name: string;
  visitors: number;
  pageviews: number;
  percentage: number;
}

interface ConnectionEntry extends TechnologyTableEntry {
  category: 'connection';
}

// Define types for raw data items
interface BaseDataItem {
  name: string;
  visitors: number;
  pageviews?: number;
}

interface ConnectionDataItem extends BaseDataItem {
  name: string;
  visitors: number;
}

interface BrowserDataItem {
  visitors: number;
  pageviews?: number;
  sessions?: number;
  browser_name?: string;
  browser_version?: string;
  name?: string;
  versions?: Array<{
    version: string;
    visitors: number;
    pageviews?: number;
    sessions?: number;
  }>;
}

interface ScreenResolutionItem {
  name: string;
  visitors: number;
  pageviews?: number;
}

interface ProcessedBrowserData {
  name: string;
  browserName: string;
  id?: string;
  visitors: number;
  pageviews?: number;
  percentage: number;
  marketShare?: string;
  sessions?: number;
  versions?: Array<{
    version: string;
    visitors: number;
    pageviews?: number;
    sessions?: number;
  }>;
}

// Helper function to get connection icon
const getConnectionIcon = (connection: string) => {
  const connectionLower = connection.toLowerCase();
  if (!connection || connection === 'Unknown') return <HelpCircle className="h-4 w-4 text-muted-foreground" />;
  if (connectionLower.includes('wifi')) return <Wifi className="h-4 w-4 text-green-500" />;
  if (connectionLower.includes('4g')) return <Smartphone className="h-4 w-4 text-blue-500" />;
  if (connectionLower.includes('5g')) return <Smartphone className="h-4 w-4 text-purple-500" />;
  if (connectionLower.includes('3g')) return <Smartphone className="h-4 w-4 text-yellow-500" />;
  if (connectionLower.includes('2g')) return <Smartphone className="h-4 w-4 text-orange-500" />;
  if (connectionLower.includes('ethernet')) return <Laptop className="h-4 w-4 text-blue-400" />;
  if (connectionLower.includes('cellular')) return <Smartphone className="h-4 w-4 text-blue-500" />;
  if (connectionLower.includes('offline')) return <WifiOff className="h-4 w-4 text-red-500" />;
  return <Globe className="h-4 w-4 text-primary" />;
};

// Helper function to calculate percentages
const addPercentages = (data: BaseDataItem[], totalField: 'visitors' | 'pageviews' = 'visitors'): GeographicEntry[] => {
  if (!data?.length) return [];
  
  const total = data.reduce((sum: number, item: BaseDataItem) => sum + (item[totalField] || 0), 0);
  
  return data.map((item: BaseDataItem) => ({
    name: item.name || 'Unknown',
    visitors: item.visitors || 0,
    pageviews: item.pageviews || 0,
    percentage: total > 0 ? Math.round(((item[totalField] || 0) / total) * 100) : 0,
  }));
};

export function WebsiteAudienceTab({
  websiteId,
  dateRange,
  websiteData,
  isRefreshing,
  setIsRefreshing
}: FullTabProps) {
  // Consolidate all dynamic queries into a single batch request
  const batchQueries = useMemo(() => [
    {
      id: 'geographic-data',
      parameters: ['country', 'region', 'timezone', 'language'],
      limit: 100,
    },
    {
      id: 'device-data',
      parameters: ['device_type', 'browser_name', 'os_name', 'screen_resolution', 'connection_type'],
      limit: 50,
    },
    {
      id: 'browsers-grouped',
      parameters: ['browsers_grouped'],
      limit: 50,
    },
  ], []); // Empty dependency array since these queries don't change

  const {
    results: batchResults,
    isLoading: isBatchLoading,
    refetch: refetchBatch,
    error: batchError
  } = useBatchDynamicQuery(websiteId, dateRange, batchQueries);

  // Debug: Check if we have any data at all
  const testResult = batchResults?.find(r => r.queryId === 'test-data');
  console.log('Test data result:', testResult);
  console.log('Date range being used:', dateRange);

  // Memoized refresh function to prevent unnecessary re-renders
  const handleRefresh = useCallback(async () => {
    if (!isRefreshing) return;
    
    try {
      // Execute batch refetch operation
      await refetchBatch();
    } catch (error) {
      console.error("Failed to refresh audience data:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, refetchBatch, setIsRefreshing]);

  // Handle refresh with improved logic
  useEffect(() => {
    if (isRefreshing) {
      handleRefresh();
    }
  }, [isRefreshing, handleRefresh]);

  // Process batch results into organized data
  const processedData = useMemo(() => {
    if (!batchResults?.length) {
      return {
        geographic: { countries: [], regions: [], timezones: [], languages: [] },
        device: { device_type: [], browser_name: [], os_name: [], screen_resolution: [], connection_type: [] },
        browsers: []
      };
    }

    const geographicResult = batchResults.find(r => r.queryId === 'geographic-data');
    const deviceResult = batchResults.find(r => r.queryId === 'device-data');
    const browsersResult = batchResults.find(r => r.queryId === 'browsers-grouped');

    return {
      geographic: {
        countries: addPercentages(geographicResult?.data?.country || []),
        regions: addPercentages(geographicResult?.data?.region || []),
        timezones: addPercentages(geographicResult?.data?.timezone || []),
        languages: addPercentages(geographicResult?.data?.language || []),
      },
      device: {
        device_type: deviceResult?.data?.device_type || [],
        browser_name: deviceResult?.data?.browser_name || [],
        os_name: deviceResult?.data?.os_name || [],
        screen_resolution: deviceResult?.data?.screen_resolution || [],
        connection_type: deviceResult?.data?.connection_type || [],
      },
      browsers: browsersResult?.data?.browsers_grouped || []
    };
  }, [batchResults]);

  // Process grouped browser data with versions for expandable table
  const processedBrowserData = useMemo(() => {
    const rawData: BrowserDataItem[] = processedData.browsers;
    
    // If the data is already grouped with versions (new format), use it directly
    if (rawData.length > 0 && rawData[0].versions) {
      const totalVisitors = rawData.reduce((sum: number, browser: BrowserDataItem) => sum + (browser.visitors || 0), 0);
      
      return rawData.map((browser: BrowserDataItem): ProcessedBrowserData => {
        const marketShare = totalVisitors > 0 
          ? Math.round((browser.visitors / totalVisitors) * 100)
          : 0;
        
        return {
          ...browser,
          name: browser.name || 'Unknown',
          browserName: browser.name || 'Unknown',
          id: browser.name || 'Unknown',
          percentage: marketShare,
          marketShare: marketShare.toString(),
          versions: browser.versions?.sort((a, b) => (b.visitors || 0) - (a.visitors || 0)) || []
        };
      }).sort((a, b) => (b.visitors || 0) - (a.visitors || 0));
    }
    
    // Fallback: Group browsers by name and aggregate versions (legacy format)
    const browserGroups = rawData.reduce((acc: Record<string, ProcessedBrowserData>, browser: BrowserDataItem) => {
      const browserName = browser.browser_name || 'Unknown';
      if (!acc[browserName]) {
        acc[browserName] = {
          name: browserName,
          browserName: browserName,
          visitors: 0,
          pageviews: 0,
          sessions: 0,
          percentage: 0,
          versions: []
        };
      }
      
      acc[browserName].visitors += browser.visitors || 0;
      acc[browserName].pageviews = (acc[browserName].pageviews || 0) + (browser.pageviews || 0);
      acc[browserName].sessions = (acc[browserName].sessions || 0) + (browser.sessions || 0);
      if (!acc[browserName].versions) {
        acc[browserName].versions = [];
      }
      acc[browserName].versions.push({
        version: browser.browser_version || 'Unknown',
        visitors: browser.visitors || 0,
        pageviews: browser.pageviews || 0,
        sessions: browser.sessions || 0
      });
      
      return acc;
    }, {});

    // Convert to array and add market share
          const browserArray = Object.values(browserGroups);
      const totalVisitors = browserArray.reduce((sum: number, browser: ProcessedBrowserData) => sum + (browser.visitors || 0), 0);
    
          return browserArray.map((browser: ProcessedBrowserData): ProcessedBrowserData => {
      const marketShare = totalVisitors > 0 
        ? Math.round((browser.visitors / totalVisitors) * 100)
        : 0;
      
              return {
          ...browser,
          name: browser.name || 'Unknown',
          browserName: browser.browserName || 'Unknown',
          id: browser.name || 'Unknown',
          percentage: marketShare,
          marketShare: marketShare.toString(),
          versions: browser.versions?.sort((a, b) => (b.visitors || 0) - (a.visitors || 0)) || []
        };
      }).sort((a, b) => (b.visitors || 0) - (a.visitors || 0));
  }, [processedData.browsers]);

  // Process connection types data with percentages
  const processedConnectionData = useMemo((): ConnectionEntry[] => {
    const connectionData: ConnectionDataItem[] = processedData.device.connection_type;
    if (!connectionData?.length) return [];
    
    const totalVisitors = connectionData.reduce((sum: number, item: ConnectionDataItem) => sum + item.visitors, 0);
    
    return connectionData.map((item: ConnectionDataItem) => ({
      name: item.name || 'Unknown',
      visitors: item.visitors,
      percentage: totalVisitors > 0 ? Math.round((item.visitors / totalVisitors) * 100) : 0,
      iconComponent: getConnectionIcon(item.name || ''),
      category: 'connection' as const
    })).sort((a, b) => b.visitors - a.visitors);
  }, [processedData.device.connection_type]);

  // Combine loading states
  const isLoading = isBatchLoading || isRefreshing;

  // Browser table columns with expandable functionality
  const browserColumns = useMemo((): ColumnDef<ProcessedBrowserData, unknown>[] => [
    {
      id: 'browserName',
      accessorKey: 'browserName',
      header: 'Browser',
      cell: (info) => {
        const browserName = info.getValue() as string;
        const row = info.row.original;
        return (
          <div className="flex items-center gap-3">
            <BrowserIcon 
              name={browserName}
              size="md"
              fallback={
                <div className="w-5 h-5 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs font-medium">
                  {browserName.charAt(0).toUpperCase()}
                </div>
              }
            />
            <div>
              <div className="font-semibold text-foreground">{browserName}</div>
              <div className="text-xs text-muted-foreground">
                {row.versions?.length || 0} versions detected
              </div>
            </div>
          </div>
        );
      },
    },
    {
      id: 'visitors',
      accessorKey: 'visitors',
      header: 'Visitors',
      cell: (info) => (
        <div>
          <div className="font-medium">{info.getValue()?.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">unique users</div>
        </div>
      ),
    },
    {
      id: 'pageviews',
      accessorKey: 'pageviews',
      header: 'Pageviews',
      cell: (info) => (
        <div>
          <div className="font-medium">{info.getValue()?.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">total views</div>
        </div>
      ),
    },
    {
      id: 'percentage',
      accessorKey: 'percentage',
      header: 'Share',
      cell: (info) => {
        const percentage = info.getValue() as number;
        return <PercentageBadge percentage={percentage} />;
      }
    },
  ], []);

  const connectionColumns = useMemo((): ColumnDef<ConnectionEntry, unknown>[] => [
    {
      id: 'name',
      accessorKey: 'name',
      header: 'Connection Type',
      cell: (info) => {
        const entry = info.row.original;
        return (
          <div className="flex items-center gap-3">
            {entry.iconComponent}
            <span className="font-medium">{entry.name}</span>
          </div>
        );
      }
    },
    {
      id: 'visitors',
      accessorKey: 'visitors',
      header: 'Visitors'
    },
    {
      id: 'percentage',
      accessorKey: 'percentage',
      header: 'Share',
      cell: (info) => {
        const percentage = info.getValue() as number;
        return <PercentageBadge percentage={percentage} />;
      }
    },
  ], []);

  // Geographic columns with percentage support
  const geographicColumns = useMemo((): ColumnDef<GeographicEntry, unknown>[] => [
    {
      id: 'name',
      accessorKey: 'name',
      header: 'Location',
      cell: (info) => {
        const name = info.getValue() as string;
        return (
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            <span className="font-medium">{name}</span>
          </div>
        );
      }
    },
    {
      id: 'visitors',
      accessorKey: 'visitors',
      header: 'Visitors'
    },
    {
      id: 'pageviews',
      accessorKey: 'pageviews',
      header: 'Pageviews'
    },
    {
      id: 'percentage',
      accessorKey: 'percentage',
      header: 'Share',
      cell: (info) => {
        const percentage = info.getValue() as number;
        return <PercentageBadge percentage={percentage} />;
      }
    },
  ], []);

  // Country specific columns with flag support
  const countryColumns = useMemo((): ColumnDef<GeographicEntry, unknown>[] => [
    {
      id: 'name',
      accessorKey: 'name',
      header: 'Country',
      cell: (info) => {
        const countryCode = info.getValue() as string;
        return (
          <div className="flex items-center gap-2">
            {countryCode && countryCode !== 'Unknown' ? (
              <div className="w-5 h-4 relative overflow-hidden rounded-sm bg-muted">
                <img 
                  src={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${countryCode.toUpperCase()}.svg`} 
                  alt={countryCode}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    const parent = (e.target as HTMLImageElement).parentElement;
                    if (parent) {
                      const helpCircle = parent.querySelector('.fallback-icon');
                      if (helpCircle) (helpCircle as HTMLElement).style.display = 'flex';
                    }
                  }}
                />
                <div className="fallback-icon w-5 h-4 items-center justify-center rounded-sm bg-muted" style={{display: 'none'}}>
                    <Globe className="h-3 w-3 text-muted-foreground" />
                </div>
              </div>
            ) : (
              <div className="w-5 h-4 flex items-center justify-center rounded-sm bg-muted">
                <Globe className="h-3 w-3 text-muted-foreground" />
              </div>
            )}
            <span className="font-medium">{countryCode || 'Unknown'}</span>
          </div>
        );
      }
    },
    {
      id: 'visitors',
      accessorKey: 'visitors',
      header: 'Visitors'
    },
    {
      id: 'pageviews',
      accessorKey: 'pageviews',
      header: 'Pageviews'
    },
    {
      id: 'percentage',
      accessorKey: 'percentage',
      header: 'Share',
      cell: (info) => {
        const percentage = info.getValue() as number;
        return <PercentageBadge percentage={percentage} />;
      }
    },
  ], []);

  // Timezone specific columns with icon and current time
  const timezoneColumns = useMemo((): ColumnDef<any, unknown>[] => [
    {
      id: 'name',
      accessorKey: 'name',
      header: 'Timezone',
      cell: (info) => {
        const entry = info.row.original;
        const timezone = entry.name;
        const currentTime = entry.current_time;
        return (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <div>
              <div className="font-medium">{timezone}</div>
              {currentTime && (
                <div className="text-xs text-muted-foreground">{currentTime}</div>
              )}
            </div>
          </div>
        );
      }
    },
    {
      id: 'visitors',
      accessorKey: 'visitors',
      header: 'Visitors'
    },
    {
      id: 'pageviews',
      accessorKey: 'pageviews',
      header: 'Pageviews'
    },
    {
      id: 'percentage',
      accessorKey: 'percentage',
      header: 'Share',
      cell: (info) => {
        const percentage = info.getValue() as number;
        return <PercentageBadge percentage={percentage} />;
      }
    },
  ], []);

  // Language specific columns with icon and code
  const languageColumns = useMemo((): ColumnDef<any, unknown>[] => [
    {
      id: 'name',
      accessorKey: 'name',
      header: 'Language',
      cell: (info) => {
        const entry = info.row.original;
        const language = entry.name;
        const code = entry.code;
        return (
          <div className="flex items-center gap-2">
            <Languages className="h-4 w-4 text-primary" />
            <div>
              <div className="font-medium">{language}</div>
              {code && code !== language && (
                <div className="text-xs text-muted-foreground">{code}</div>
              )}
            </div>
          </div>
        );
      }
    },
    {
      id: 'visitors',
      accessorKey: 'visitors',
      header: 'Visitors'
    },
    {
      id: 'pageviews',
      accessorKey: 'pageviews',
      header: 'Pageviews'
    },
    {
      id: 'percentage',
      accessorKey: 'percentage',
      header: 'Share',
      cell: (info) => {
        const percentage = info.getValue() as number;
        return <PercentageBadge percentage={percentage} />;
      }
    },
  ], []);

  // Prepare tabs for enhanced geographic data with unique keys
  const geographicTabs = useMemo(() => [
    {
      id: 'countries',
      label: 'Countries',
      data: processedData.geographic.countries.map((item, index) => ({
        ...item,
        _uniqueKey: `country-${item.name}-${index}` // Ensure unique row keys
      })),
      columns: countryColumns,
    },
    {
      id: 'regions',
      label: 'Regions',
      data: processedData.geographic.regions.map((item, index) => ({
        ...item,
        _uniqueKey: `region-${item.name}-${index}` // Ensure unique row keys
      })),
      columns: geographicColumns,
    },
    {
      id: 'timezones',
      label: 'Timezones',
      data: processedData.geographic.timezones.map((item, index) => ({
        ...item,
        _uniqueKey: `timezone-${item.name}-${index}` // Ensure unique row keys
      })),
      columns: timezoneColumns,
    },
    {
      id: 'languages',
      label: 'Languages',
      data: processedData.geographic.languages.map((item, index) => ({
        ...item,
        _uniqueKey: `language-${item.name}-${index}` // Ensure unique row keys
      })),
      columns: languageColumns,
    },
  ], [
    processedData.geographic.countries,
    processedData.geographic.regions,
    processedData.geographic.timezones,
    processedData.geographic.languages,
    countryColumns,
    geographicColumns,
    timezoneColumns,
    languageColumns,
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-2">Audience Insights</h2>
        <p className="text-sm text-muted-foreground">Detailed information about your website visitors</p>
      </div>
      
      {/* Technology Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DataTable 
          data={processedBrowserData}
          columns={browserColumns}
          title="Browser Versions"
          description="Expandable browser breakdown showing all versions per browser"
          isLoading={isLoading}
          initialPageSize={8}
          minHeight={200}
          showSearch={false}
          expandable={true}
          getSubRows={(row) => row.versions}
          renderSubRow={(subRow, parentRow, index) => {
            const percentage = Math.round(((subRow.visitors || 0) / (parentRow.visitors || 1)) * 100);
            const gradientConfig = percentage >= 40 ? {
              bg: 'linear-gradient(90deg, rgba(34, 197, 94, 0.12) 0%, rgba(34, 197, 94, 0.06) 100%)',
              border: 'rgba(34, 197, 94, 0.2)'
            } : percentage >= 25 ? {
              bg: 'linear-gradient(90deg, rgba(59, 130, 246, 0.12) 0%, rgba(59, 130, 246, 0.06) 100%)',
              border: 'rgba(59, 130, 246, 0.2)'
            } : percentage >= 10 ? {
              bg: 'linear-gradient(90deg, rgba(245, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0.06) 100%)',
              border: 'rgba(245, 158, 11, 0.2)'
            } : {
              bg: 'linear-gradient(90deg, rgba(107, 114, 128, 0.08) 0%, rgba(107, 114, 128, 0.04) 100%)',
              border: 'rgba(107, 114, 128, 0.15)'
            };
            
            return (
              <div 
                className="grid grid-cols-4 gap-3 py-1.5 px-4 text-sm border-l-2 transition-all duration-200"
                style={{ 
                  background: gradientConfig.bg,
                  borderLeftColor: gradientConfig.border
                }}
              >
                <div className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                  <span className="font-medium">{subRow.version || 'Unknown'}</span>
                </div>
                <div className="text-right font-medium">{subRow.visitors?.toLocaleString()}</div>
                <div className="text-right font-medium">{subRow.pageviews?.toLocaleString()}</div>
                <div className="text-right">
                  <PercentageBadge percentage={percentage} />
                </div>
              </div>
            );
          }}
        />
        
        <DataTable 
          data={processedConnectionData}
          columns={connectionColumns}
          title="Connection Types"
          description="Visitors by network connection"
          isLoading={isLoading}
          initialPageSize={8}
          minHeight={200}
          showSearch={false}
        />
      </div>
      
      {/* Enhanced Geographic Data */}
      <div className="grid grid-cols-1 gap-4">
        <DataTable 
          tabs={geographicTabs}
          title="Geographic Distribution"
          description="Visitors by location, timezone, and language (limit: 100 per category)"
          isLoading={isLoading}
          initialPageSize={8}
          minHeight={400}
        />
      </div>

      {/* Screen Resolutions */}
      <Card className="w-full border-0 shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="px-3 pb-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-sm truncate">
                Screen Resolutions
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                Visitors by screen size and device type
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="px-3 pb-2 overflow-hidden">
          {isLoading ? (
            <div className="space-y-3 animate-pulse" style={{ minHeight: 400 }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={`skeleton-resolution-card-${index+1}`} className="bg-muted/20 rounded-lg p-4 space-y-3">
                    <Skeleton className="h-4 w-24 rounded-md" />
                    <Skeleton className="h-32 w-full rounded-lg" />
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Skeleton className="h-3 w-16 rounded-sm" />
                        <Skeleton className="h-3 w-8 rounded-sm" />
                      </div>
                      <Skeleton className="h-2 w-full rounded-full" />
                      <Skeleton className="h-3 w-12 rounded-sm ml-auto" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : !processedData.device.screen_resolution?.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-center" style={{ minHeight: 400 }}>
              <div className="mb-4">
                <div className="w-16 h-16 rounded-2xl bg-muted/20 flex items-center justify-center mb-3 mx-auto">
                  <Monitor className="h-7 w-7 text-muted-foreground/50" />
                </div>
              </div>
              <h4 className="text-base font-medium text-foreground mb-2">
                No screen resolution data available
              </h4>
              <p className="text-sm text-muted-foreground max-w-[280px]">
                Resolution data will appear here when visitors start using your website.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {processedData.device.screen_resolution?.slice(0, 6).map((item: ScreenResolutionItem) => {
                  const resolution = item.name;
                  if (!resolution) return null;
                  const [width, height] = resolution.split('x').map(Number);
                  const isValid = !Number.isNaN(width) && !Number.isNaN(height);
                  
                  const totalVisitors = processedData.device.screen_resolution?.reduce(
                    (sum: number, resItem: ScreenResolutionItem) => sum + resItem.visitors, 0) || 1;
                  const percentage = Math.round((item.visitors / totalVisitors) * 100);
                  
                  let deviceType = "Unknown";
                  let deviceIcon = <Monitor className="h-4 w-4 text-muted-foreground" />;
                  
                  if (isValid) {
                    if (width <= 480) {
                      deviceType = "Mobile";
                      deviceIcon = <Smartphone className="h-4 w-4 text-blue-500" />;
                    } else if (width <= 1024) {
                      deviceType = "Tablet";
                      deviceIcon = <Tablet className="h-4 w-4 text-purple-500" />;
                    } else if (width <= 1440) {
                      deviceType = "Laptop";
                      deviceIcon = <Laptop className="h-4 w-4 text-green-500" />;
                    } else {
                      deviceType = "Desktop";
                      deviceIcon = <Monitor className="h-4 w-4 text-primary" />;
                    }
                  }
                  
                  // Create aspect ratio-correct box
                  const aspectRatio = isValid ? width / height : 16/9;
                  
                  return (
                    <div 
                      key={`resolution-${resolution}-${item.visitors}`}
                      className="border border-border/50 rounded-lg p-4 bg-background/50 hover:bg-background/80 transition-all duration-200 flex flex-col"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {deviceIcon}
                          <div>
                            <div className="font-medium text-sm">{resolution}</div>
                            <div className="text-xs text-muted-foreground">{deviceType}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{percentage}%</div>
                        </div>
                      </div>
                      
                      {/* Enhanced Screen visualization with perspective */}
                      <div className="flex justify-center mb-4 h-32 relative perspective">
                        <div 
                          className="relative bg-gradient-to-br from-primary/8 to-primary/12 border-2 border-primary/20 rounded-lg shadow-lg flex items-center justify-center transform-gpu hover:shadow-xl transition-all duration-300"
                          style={{
                            width: `${Math.min(200, 100 * Math.sqrt(aspectRatio))}px`,
                            height: `${Math.min(160, 100 / Math.sqrt(aspectRatio))}px`,
                            transformStyle: 'preserve-3d',
                            transform: 'rotateY(-8deg) rotateX(3deg)',
                            margin: 'auto'
                          }}
                        >
                          {isValid && (
                            <div 
                              className="text-xs font-mono text-primary font-semibold transform-gpu" 
                              style={{ transform: 'translateZ(5px)' }}
                            >
                              {width} × {height}
                            </div>
                          )}
                          
                          {/* Enhanced Screen content simulation */}
                          <div 
                            className="absolute inset-2 rounded bg-background/20"
                            style={{ transform: 'translateZ(2px)' }}
                          />
                          
                          {/* Browser-like UI elements */}
                          <div 
                            className="absolute top-2 left-2 right-2 h-1.5 bg-primary/30 rounded-full"
                            style={{ transform: 'translateZ(3px)' }}
                          />
                          <div 
                            className="absolute top-5 left-2 w-1/2 h-1 bg-primary/20 rounded-full"
                            style={{ transform: 'translateZ(3px)' }}
                          />
                          <div 
                            className="absolute bottom-4 inset-x-2 grid grid-cols-3 gap-1"
                            style={{ transform: 'translateZ(3px)' }}
                          >
                            <div className="h-1 bg-primary/15 rounded-full" />
                            <div className="h-1 bg-primary/20 rounded-full" />
                            <div className="h-1 bg-primary/15 rounded-full" />
                          </div>
                        </div>
                        
                        {/* Stand or base for desktop/laptop */}
                        {(deviceType === "Desktop" || deviceType === "Laptop") && (
                          <div 
                            className="absolute bottom-0 w-1/4 h-3 bg-muted/60 rounded-b-md mx-auto"
                            style={{
                              left: '50%',
                              transform: 'translateX(-50%)',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                          />
                        )}
                      </div>
                      
                      <div className="mt-auto space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium">{item.visitors.toLocaleString()} visitors</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-muted/40 overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span>{item.pageviews?.toLocaleString() || '0'} pageviews</span>
                          <span>{percentage}% share</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {processedData.device.screen_resolution && processedData.device.screen_resolution.length > 6 && (
                <div className="text-xs text-center text-muted-foreground pt-2 border-t border-border/30">
                  Showing top 6 of {processedData.device.screen_resolution.length} screen resolutions
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}