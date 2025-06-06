"use client";

import { useMemo, useEffect } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/analytics/data-table";
import { useWebsiteAnalytics } from "@/hooks/use-analytics";
import { useEnhancedGeographicData } from "@/hooks/use-dynamic-query";
import type { FullTabProps } from "../utils/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Globe, Laptop, Smartphone, Tablet, Monitor, HelpCircle, Languages, Wifi, WifiOff, MapPin, Clock } from 'lucide-react';
import { getLanguageName } from "@databuddy/shared";
import { 
  processDeviceData, 
  processBrowserData, 
  TechnologyIcon,
  PercentageBadge,
  type TechnologyTableEntry,
} from "../utils/technology-helpers";

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

interface LanguageEntry extends TechnologyTableEntry {
  category: 'language';
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
const addPercentages = (data: any[], totalField: 'visitors' | 'pageviews' = 'visitors'): GeographicEntry[] => {
  if (!data?.length) return [];
  
  const total = data.reduce((sum, item) => sum + (item[totalField] || 0), 0);
  
  return data.map(item => ({
    name: item.name || 'Unknown',
    visitors: item.visitors || 0,
    pageviews: item.pageviews || 0,
    percentage: total > 0 ? Math.round((item[totalField] / total) * 100) : 0,
  }));
};

export function WebsiteAudienceTab({
  websiteId,
  dateRange,
  websiteData,
  isRefreshing,
  setIsRefreshing
}: FullTabProps) {
  // Fetch analytics data for legacy components
  const {
    analytics,
    loading,
    refetch: refetchAnalytics
  } = useWebsiteAnalytics(websiteId, dateRange);

  // Fetch enhanced geographic data using batch queries
  const {
    results: geographicResults,
    isLoading: isLoadingGeographic,
    refetch: refetchGeographic,
    error: geographicError
  } = useEnhancedGeographicData(websiteId, dateRange);

  // Handle refresh - coordinate both data sources
  useEffect(() => {
    let isMounted = true;
    
    if (isRefreshing) {
      const doRefresh = async () => {
        try {
          // Refresh both data sources simultaneously
          const [analyticsResult, geographicResult] = await Promise.allSettled([
            refetchAnalytics(),
            refetchGeographic()
          ]);
          
          // Log any specific failures for debugging
          if (analyticsResult.status === 'rejected') {
            console.error("Failed to refresh analytics data:", analyticsResult.reason);
          }
          if (geographicResult.status === 'rejected') {
            console.error("Failed to refresh geographic data:", geographicResult.reason);
          }
        } catch (error) {
          console.error("Failed to refresh data:", error);
        } finally {
          if (isMounted) {
            setIsRefreshing(false);
          }
        }
      };
      
      doRefresh();
    }
    
    return () => {
      isMounted = false;
    };
  }, [isRefreshing, refetchAnalytics, refetchGeographic, setIsRefreshing]);

  // Technology data processing using the same helpers as overview
  const processedDeviceData = useMemo(() => 
    processDeviceData(analytics.device_types || []), 
    [analytics.device_types]
  );

  const processedBrowserData = useMemo(() => 
    processBrowserData(analytics.browser_versions || []), 
    [analytics.browser_versions]
  );

  // Process connection types data with percentages
  const processedConnectionData = useMemo((): ConnectionEntry[] => {
    if (!analytics.connection_types?.length) return [];
    
    const totalVisitors = analytics.connection_types.reduce((sum, item) => sum + item.visitors, 0);
    
    return analytics.connection_types.map(item => ({
      name: item.connection_type || 'Unknown',
      visitors: item.visitors,
      percentage: totalVisitors > 0 ? Math.round((item.visitors / totalVisitors) * 100) : 0,
      iconComponent: getConnectionIcon(item.connection_type || ''),
      category: 'connection' as const
    })).sort((a, b) => b.visitors - a.visitors);
  }, [analytics.connection_types]);

  // Process language data with percentages
  const processedLanguageData = useMemo((): TechnologyTableEntry[] => {
    if (!analytics.languages?.length) return [];
    
    // Group languages by base language code (before the hyphen)
    const languageGroups: Record<string, number> = {};
    
    for (const item of analytics.languages) {
      if (!item.language) continue; // Skip items with undefined language
      const baseLanguage = item.language.split('-')[0]; // Get 'en' from 'en-US'
      languageGroups[baseLanguage] = (languageGroups[baseLanguage] || 0) + (item.visitors || 0);
    }
    
    const totalVisitors = Object.values(languageGroups).reduce((sum, count) => sum + count, 0);
    
    return Object.entries(languageGroups)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([baseLanguage, visitors]) => {
        const languageName = getLanguageName(baseLanguage);
        
        return {
          name: languageName !== 'Unknown' ? languageName : baseLanguage.toUpperCase(),
          visitors,
          percentage: totalVisitors > 0 ? Math.round((visitors / totalVisitors) * 100) : 0,
          iconComponent: <Languages className="h-4 w-4 text-primary" />,
          category: 'language'
        };
      });
  }, [analytics.languages]);

  // Process geographic data from batch query results
  const processedGeographicData = useMemo(() => {
    if (!geographicResults?.length) {
      return {
        countries: [],
        regions: [],
        cities: [],
        timezones: [],
        languages: []
      };
    }

    const countriesResult = geographicResults.find(r => r.queryId === 'countries');
    const regionsResult = geographicResults.find(r => r.queryId === 'regions');
    const timezonesResult = geographicResults.find(r => r.queryId === 'timezones');
    const languagesResult = geographicResults.find(r => r.queryId === 'languages');

    return {
      countries: addPercentages(countriesResult?.data?.country || []),
      regions: addPercentages(regionsResult?.data?.region || []),
      timezones: addPercentages(timezonesResult?.data?.timezone || []),
      languages: addPercentages(languagesResult?.data?.language || []),
    };
  }, [geographicResults]);

  // Combine loading states - ensure all data sources are synchronized
  const isLoading = loading.summary || isLoadingGeographic || isRefreshing;

  // Technology table columns using modern approach
  const technologyColumns = useMemo((): ColumnDef<TechnologyTableEntry, unknown>[] => [
    {
      id: 'name',
      accessorKey: 'name',
      header: 'Name',
      cell: (info) => {
        const entry = info.row.original;
        return (
          <div className="flex items-center gap-3">
            <TechnologyIcon entry={entry} size="md" />
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
      data: processedGeographicData.countries.map((item, index) => ({
        ...item,
        _uniqueKey: `country-${item.name}-${index}` // Ensure unique row keys
      })),
      columns: countryColumns,
    },
    {
      id: 'regions',
      label: 'Regions',
      data: processedGeographicData.regions.map((item, index) => ({
        ...item,
        _uniqueKey: `region-${item.name}-${index}` // Ensure unique row keys
      })),
      columns: geographicColumns,
    },
    {
      id: 'timezones',
      label: 'Timezones',
      data: processedGeographicData.timezones.map((item, index) => ({
        ...item,
        _uniqueKey: `timezone-${item.name}-${index}` // Ensure unique row keys
      })),
      columns: timezoneColumns,
    },
    {
      id: 'languages',
      label: 'Languages',
      data: processedGeographicData.languages.map((item, index) => ({
        ...item,
        _uniqueKey: `language-${item.name}-${index}` // Ensure unique row keys
      })),
      columns: languageColumns,
    },
  ], [
    processedGeographicData.countries,
    processedGeographicData.regions,
    processedGeographicData.timezones,
    processedGeographicData.languages,
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
          data={processedDeviceData}
          columns={technologyColumns}
          title="Device Types"
          description="Visitors by device type"
          isLoading={isLoading}
          initialPageSize={8}
          minHeight={200}
          showSearch={false}
        />
        
        <DataTable 
          data={processedBrowserData}
          columns={technologyColumns}
          title="Browsers"
          description="Visitors by browser"
          isLoading={isLoading}
          initialPageSize={8}
          minHeight={200}
          showSearch={false}
        />
      </div>
      
      {/* Connection and Language */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
        
        <DataTable 
          data={processedLanguageData}
          columns={technologyColumns}
          title="Languages"
          description="Visitors by preferred language"
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
          ) : !analytics.screen_resolutions?.length ? (
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
                {analytics.screen_resolutions?.slice(0, 6).map((item) => {
                  const resolution = (item as any).resolution || item.screen_resolution;
                  if (!resolution) return null;
                  const [width, height] = resolution.split('x').map(Number);
                  const isValid = !Number.isNaN(width) && !Number.isNaN(height);
                  
                  const totalVisitors = analytics.screen_resolutions?.reduce(
                    (sum, item) => sum + item.visitors, 0) || 1;
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
                          <span>{item.count?.toLocaleString() || '0'} pageviews</span>
                          <span>{percentage}% share</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {analytics.screen_resolutions && analytics.screen_resolutions.length > 6 && (
                <div className="text-xs text-center text-muted-foreground pt-2 border-t border-border/30">
                  Showing top 6 of {analytics.screen_resolutions.length} screen resolutions
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 