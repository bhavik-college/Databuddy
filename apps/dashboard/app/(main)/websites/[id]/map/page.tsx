"use client";

import { AlertCircle, Globe, HelpCircle, MapPin } from "lucide-react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAnalyticsLocations } from "@/hooks/use-analytics";
import { cn } from "@/lib/utils";

// Dynamic import for MapComponent (heavy Leaflet/D3 dependencies)
const MapComponent = dynamic(
  () =>
    import("@/components/analytics/map-component").then((mod) => ({ default: mod.MapComponent })),
  {
    loading: () => (
      <div className="flex h-full items-center justify-center rounded bg-muted/20">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="font-medium text-muted-foreground text-sm">Loading map...</span>
        </div>
      </div>
    ),
    ssr: false,
  }
);

function WebsiteMapPage() {
  const { id } = useParams<{ id: string }>();
  const [mode, setMode] = useState<"total" | "perCapita">("total");

  if (!id) {
    return <div>No website ID</div>;
  }

  const { data: locationData, isLoading } = useAnalyticsLocations(id);
  const topCountries =
    locationData?.countries?.filter((c) => c.country && c.country.trim() !== "").slice(0, 8) || [];
  const totalVisitors =
    locationData?.countries?.reduce((sum, country) => sum + country.visitors, 0) || 0;
  const unknownVisitors =
    locationData?.countries?.find((c) => !c.country || c.country.trim() === "")?.visitors || 0;

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col space-y-4 p-4">
      {/* Header with proper spacing */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-semibold text-xl">Geographic Data</h1>
            {!isLoading && totalVisitors > 0 && (
              <p className="text-muted-foreground text-sm">
                {totalVisitors.toLocaleString()} visitors across {topCountries.length} countries
              </p>
            )}
          </div>
        </div>

        <Tabs onValueChange={(value) => setMode(value as "total" | "perCapita")} value={mode}>
          <div className="relative border-b">
            <TabsList className="h-10 w-full justify-start overflow-x-auto bg-transparent p-0">
              <TabsTrigger
                className="relative h-10 cursor-pointer touch-manipulation whitespace-nowrap rounded-none px-2 text-xs transition-colors hover:bg-muted/50 sm:px-4 sm:text-sm"
                value="total"
              >
                Total Visitors
                {mode === "total" && (
                  <div className="absolute bottom-0 left-0 h-[2px] w-full bg-primary" />
                )}
              </TabsTrigger>
              <TabsTrigger
                className="relative h-10 cursor-pointer touch-manipulation whitespace-nowrap rounded-none px-2 text-xs transition-colors hover:bg-muted/50 sm:px-4 sm:text-sm"
                value="perCapita"
              >
                Per Capita
                {mode === "perCapita" && (
                  <div className="absolute bottom-0 left-0 h-[2px] w-full bg-primary" />
                )}
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>
      </div>

      {/* Main Content */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden md:flex-row">
        {/* Map */}
        <Card className="flex min-h-0 flex-1 flex-col overflow-hidden rounded pt-4 pb-0">
          <CardHeader className="flex-shrink-0 pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                World Map
              </span>
              <Badge className="text-xs" variant="secondary">
                Hover to explore
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 p-0">
            <MapComponent
              height="100%"
              isLoading={isLoading}
              locationData={locationData}
              mode={mode}
            />
          </CardContent>
        </Card>

        {/* Countries List */}
        <Card className="flex min-h-0 flex-1 flex-col overflow-hidden rounded md:w-72 md:flex-none">
          <CardHeader className="flex-shrink-0 pb-3">
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Top Countries
            </CardTitle>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 overflow-hidden p-0">
            {isLoading ? (
              <div className="space-y-2 p-4">
                {Array(6)
                  .fill(0)
                  .map((_, i) => (
                    <div
                      className="flex items-center justify-between p-3"
                      key={`country-skeleton-${i + 1}`}
                    >
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-4 w-6 rounded" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                      <Skeleton className="h-4 w-12" />
                    </div>
                  ))}
              </div>
            ) : (
              <div className="max-h-full overflow-y-auto">
                {topCountries.length > 0 && (
                  <div>
                    {topCountries.map((country, index) => {
                      const percentage =
                        totalVisitors > 0 ? (country.visitors / totalVisitors) * 100 : 0;
                      return (
                        <div
                          className={cn(
                            "flex cursor-pointer items-center justify-between border-border/20 border-b p-3 transition-colors last:border-b-0 hover:bg-muted/50",
                            index === 0 && "bg-primary/5"
                          )}
                          key={country.country}
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            <div className="relative h-4 w-6 flex-shrink-0 overflow-hidden rounded shadow-sm">
                              <img
                                alt={country.country}
                                className="absolute inset-0 h-full w-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = "none";
                                }}
                                src={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${country.country.toUpperCase()}.svg`}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate font-medium text-sm">{country.country}</div>
                              <div className="text-muted-foreground text-xs">
                                {percentage.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <div
                              className={cn("font-semibold text-sm", index === 0 && "text-primary")}
                            >
                              {country.visitors.toLocaleString()}
                            </div>
                            <div className="text-muted-foreground text-xs">
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
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="flex h-4 w-6 flex-shrink-0 items-center justify-center rounded bg-muted">
                          <HelpCircle className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm">Unknown</div>
                          <div className="text-muted-foreground text-xs">
                            {totalVisitors > 0
                              ? ((unknownVisitors / totalVisitors) * 100).toFixed(1)
                              : 0}
                            %
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <div className="font-semibold text-sm">
                          {unknownVisitors.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {topCountries.length === 0 && unknownVisitors === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <AlertCircle className="mb-3 h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground text-sm">No geographic data available</p>
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
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        </div>
      }
    >
      <WebsiteMapPage />
    </Suspense>
  );
}
