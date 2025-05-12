"use client";

import { useState, Suspense, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapComponent } from "@/components/analytics/map-component";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useWebsitesStore } from "@/stores/use-websites-store";
import { useWebsites } from "@/hooks/use-websites";
import { useParams } from "next/navigation";
import { useAnalyticsLocations } from "@/hooks/use-analytics";
import { CalendarDateRangePicker } from "@/components/date-range-picker";
import { HelpCircle } from "lucide-react";
import type { DateRange } from "react-day-picker";

function WebsiteMapPage() {
  const { id } = useParams<{ id: string }>();
  const { websites } = useWebsites();
  const { setSelectedWebsite } = useWebsitesStore();
  const [mode, setMode] = useState<"total" | "perCapita">("total");
  
  // Default to last 7 days if no date range is set
  const today = new Date();
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(today.getDate() - 7);
  
  const [dateRange, setDateRange] = useState({
    start_date: oneWeekAgo.toISOString().split('T')[0],
    end_date: today.toISOString().split('T')[0]
  });

  // Set the selected website based on URL params
  useEffect(() => {
    if (id && websites) {
      const website = websites.find((site: any) => site.id === id);
      if (website) {
        setSelectedWebsite(website);
      }
    }
  }, [id, websites, setSelectedWebsite]);
  
  // Pass the date range to the analytics hook to get real data
  const { data: locationData, isLoading } = useAnalyticsLocations(
    id,
    dateRange
  );

  const topCountries = locationData?.countries?.slice(0, 5) || [];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Geographic Distribution</h1>
          <p className="text-muted-foreground mt-1">
            View visitor distribution by country and region
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center">
          <CalendarDateRangePicker
            onUpdate={(value: DateRange | undefined) => {
              if (value?.from && value?.to) {
                setDateRange({
                  start_date: value.from.toISOString().split('T')[0],
                  end_date: value.to.toISOString().split('T')[0]
                });
              }
            }}
          />
          
          <Tabs 
            defaultValue="total" 
            className="w-[240px]"
            onValueChange={(value) => setMode(value as "total" | "perCapita")}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="total">Total Visits</TabsTrigger>
              <TabsTrigger value="perCapita">Per Capita</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-4 flex-1 overflow-hidden">
        <Card className="lg:col-span-3 flex flex-col overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle>Visitor Map</CardTitle>
            <CardDescription>
              {mode === "total" 
                ? "Showing total visitor count by location" 
                : "Showing visitors per million people"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden">
            <div className="h-full">
              <MapComponent height="100%" mode={mode} />
            </div>
          </CardContent>
        </Card>
        
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Top Countries</CardTitle>
              <CardDescription>Most visitors by country</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {['a', 'b', 'c', 'd', 'e'].map((id) => (
                    <div key={`skeleton-${id}`} className="h-6 bg-muted animate-pulse rounded-md" />
                  ))}
                </div>
              ) : topCountries.length > 0 ? (
                <div className="space-y-2">
                  {topCountries.map((country) => (
                    <div key={country.country || "unknown"} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {country.country ? (
                          <div className="w-5 h-4 relative overflow-hidden rounded-sm bg-muted">
                            <img 
                              src={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${country.country.toUpperCase()}.svg`}
                              alt={country.country}
                              className="absolute inset-0 w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-5 h-4 flex items-center justify-center rounded-sm bg-muted">
                            <HelpCircle className="h-3 w-3 text-muted-foreground" />
                          </div>
                        )}
                        <span>{country.country ? country.country : "Unknown"}</span>
                      </div>
                      <span className="font-semibold">{country.visitors.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>About This View</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-2">
                <p>The map shows geographic distribution of your website's visitors.</p>
                <p><strong>Total Visits</strong>: Shows the absolute number of visitors.</p>
                <p><strong>Per Capita</strong>: Shows visitors normalized by population.</p>
                {/* <p className="text-muted-foreground">Zoom in to see regional details. Click on a region to filter analytics by that location.</p> */}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 flex items-center justify-center h-[calc(100vh-4rem)]">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 rounded-full border-2 border-accent-400 border-t-transparent animate-spin" />
        <span className="text-sm text-neutral-300">Loading map data...</span>
      </div>
    </div>}>
      <WebsiteMapPage />
    </Suspense>
  );
} 