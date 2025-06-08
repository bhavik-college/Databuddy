"use client";

import { useState, Suspense } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapComponent } from "@/components/analytics/map-component";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useParams } from "next/navigation";
import { useAnalyticsLocations } from "@/hooks/use-analytics";
import { AlertCircle, Globe, HelpCircle, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function WebsiteMapPage() {
  const { id } = useParams<{ id: string }>();
  const [mode, setMode] = useState<"total" | "perCapita">("total");
  
  if (!id) {
    return <div>No website ID</div>;
  }
  
  const { data: locationData, isLoading } = useAnalyticsLocations(id);
  const topCountries = locationData?.countries?.filter(c => c.country && c.country.trim() !== "").slice(0, 8) || [];
  const totalVisitors = locationData?.countries?.reduce((sum, country) => sum + country.visitors, 0) || 0;
  const unknownVisitors = locationData?.countries?.find(c => !c.country || c.country.trim() === "")?.visitors || 0;

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col space-y-4 p-4">
      {/* Header with proper spacing */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Geographic Data</h1>
            {!isLoading && totalVisitors > 0 && (
              <p className="text-sm text-muted-foreground">
                {totalVisitors.toLocaleString()} visitors across {topCountries.length} countries
              </p>
            )}
          </div>
        </div>

        <Tabs value={mode} onValueChange={(value) => setMode(value as "total" | "perCapita")}>
          <div className="border-b relative">
            <TabsList className="h-10 bg-transparent p-0 w-full justify-start overflow-x-auto">
              <TabsTrigger 
                value="total"
                className="text-xs sm:text-sm h-10 px-2 sm:px-4 rounded-none touch-manipulation hover:bg-muted/50 relative transition-colors whitespace-nowrap cursor-pointer"
              >
                Total Visitors
                {mode === "total" && (
                  <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary" />
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="perCapita"
                className="text-xs sm:text-sm h-10 px-2 sm:px-4 rounded-none touch-manipulation hover:bg-muted/50 relative transition-colors whitespace-nowrap cursor-pointer"
              >
                Per Capita
                {mode === "perCapita" && (
                  <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary" />
                )}
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden min-h-0">
        {/* Map */}
        <Card className="flex-1 flex flex-col overflow-hidden min-h-0 rounded">
          <CardHeader className="pb-3 flex-shrink-0">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                World Map
              </span>
              <Badge variant="secondary" className="text-xs">
                Hover to explore
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 min-h-0">
            <MapComponent height="100%" mode={mode} locationData={locationData} isLoading={isLoading} />
          </CardContent>
        </Card>
        
        {/* Countries List */}
        <Card className="md:w-72 flex-1 md:flex-none flex flex-col overflow-hidden min-h-0 rounded">
          <CardHeader className="pb-3 flex-shrink-0">
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Top Countries
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden min-h-0">
            {isLoading ? (
              <div className="space-y-2 p-4">
                {Array(6).fill(0).map((_, i) => (
                  <div key={`country-skeleton-${i + 1}`} className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-4 w-6 rounded" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-y-auto max-h-full">
                {topCountries.length > 0 && (
                  <div>
                    {topCountries.map((country, index) => {
                      const percentage = totalVisitors > 0 ? (country.visitors / totalVisitors) * 100 : 0;
                      return (
                        <div 
                          key={country.country} 
                          className={cn(
                            "flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer transition-colors border-b border-border/20 last:border-b-0",
                            index === 0 && "bg-primary/5"
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-6 h-4 relative overflow-hidden rounded shadow-sm flex-shrink-0">
                              <img 
                                src={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${country.country.toUpperCase()}.svg`}
                                alt={country.country}
                                className="absolute inset-0 w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium truncate">
                                {country.country}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {percentage.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className={cn(
                              "text-sm font-semibold",
                              index === 0 && "text-primary"
                            )}>
                              {country.visitors.toLocaleString()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {country.pageviews.toLocaleString()} views
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {/* Unknown Location */}
                {unknownVisitors > 0 && (
                  <div className="border-t bg-muted/10">
                    <div className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-6 h-4 flex items-center justify-center rounded bg-muted flex-shrink-0">
                          <HelpCircle className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium">Unknown</div>
                          <div className="text-xs text-muted-foreground">
                            {totalVisitors > 0 ? ((unknownVisitors / totalVisitors) * 100).toFixed(1) : 0}%
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-semibold">
                          {unknownVisitors.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {topCountries.length === 0 && unknownVisitors === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <AlertCircle className="h-8 w-8 text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">No geographic data available</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full">
        <div className="h-6 w-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    }>
      <WebsiteMapPage />
    </Suspense>
  );
} 