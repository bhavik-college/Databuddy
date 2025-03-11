"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VisitorsChart } from "./charts/visitors-chart";
import { PageViewsChart } from "./charts/pageviews-chart";
import { DevicesChart } from "./charts/devices-chart";
import { BrowsersChart } from "./charts/browsers-chart";
import { CountriesChart } from "./charts/countries-chart";
import { TopPagesTable } from "./tables/top-pages-table";
import { TopReferrersTable } from "./tables/top-referrers-table";
import { DateRangePicker } from "./date-range-picker";
import { useDateRange } from "../hooks/use-date-range";
import { Loader2 } from "lucide-react";
import { useApiClient } from "@/lib/hooks/use-api-client";

interface AnalyticsTabsProps {
  trackingId: string;
  websiteUrl: string;
  websiteId: string;
}

export function AnalyticsTabs({ trackingId, websiteUrl, websiteId }: AnalyticsTabsProps) {
  const { client, isReady } = useApiClient(trackingId);
  const { dateRange, setDateRange } = useDateRange();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch stats when date range changes
  useEffect(() => {
    const fetchStats = async () => {
      if (!isReady) {
        return;
      }
      
      try {
        setIsLoading(true);
        
        // Format dates as YYYY-MM-DD
        const from = dateRange.from.toISOString().split('T')[0];
        const to = dateRange.to.toISOString().split('T')[0];
        
        // Use the API client to fetch stats
        const data = await client.getWebsiteStats(websiteId, from, to);
        setStats(data);
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching website stats:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch website statistics");
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [websiteId, dateRange, client, isReady]);
  
  // Handle date range change
  const handleDateRangeChange = async (range: { from: Date; to: Date }) => {
    setDateRange(range);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/30 text-rose-500 p-4 rounded-md my-6">
        <h3 className="font-semibold mb-1">Error Loading Analytics</h3>
        <p>{error}</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 mt-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-white">Analytics</h2>
        <DateRangePicker 
          dateRange={dateRange} 
          onDateRangeChange={handleDateRangeChange} 
        />
      </div>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="visitors">Visitors</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <VisitorsChart data={stats?.dailyStats || []} />
            <PageViewsChart data={stats?.dailyStats || []} />
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <DevicesChart data={stats?.devices || {}} />
            <BrowsersChart data={stats?.browsers || {}} />
            <CountriesChart data={stats?.countries || []} />
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            <TopPagesTable data={stats?.topPages || []} />
            <TopReferrersTable data={stats?.topReferrers || []} />
          </div>
        </TabsContent>
        
        <TabsContent value="visitors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Visitor Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <VisitorsChart data={stats?.dailyStats || []} height={400} />
              </div>
            </CardContent>
          </Card>
          
          <div className="grid gap-6 md:grid-cols-2">
            <CountriesChart data={stats?.countries || []} height={350} />
            <Card>
              <CardHeader>
                <CardTitle>Visitor Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Average Session Duration</p>
                    <p className="text-2xl font-semibold text-white">
                      {formatTime(stats?.totals?.avgSessionDuration || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Bounce Rate</p>
                    <p className="text-2xl font-semibold text-white">
                      {Math.round((stats?.totals?.bounceRate || 0) * 100)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="pages" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Page Views Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <PageViewsChart data={stats?.dailyStats || []} height={400} />
              </div>
            </CardContent>
          </Card>
          
          <TopPagesTable data={stats?.topPages || []} />
        </TabsContent>
        
        <TabsContent value="sources" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Traffic Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <TopReferrersTable data={stats?.topReferrers || []} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="devices" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Device Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <DevicesChart data={stats?.devices || {}} height={350} />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Browsers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <BrowsersChart data={stats?.browsers || {}} height={350} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper function to format time in minutes and seconds
function formatTime(seconds: number): string {
  if (!seconds) return "0m 0s";
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  
  return `${minutes}m ${remainingSeconds}s`;
} 