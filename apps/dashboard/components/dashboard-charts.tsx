"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, LineChart, PieChart } from "@/components/ui/charts";
import { useEffect, useState } from "react";
import { useApiClient } from "@/lib/hooks/use-api-client";
import { Loader2 } from "lucide-react";

export function DashboardCharts() {
  const { client, isReady } = useApiClient();
  const [chartData, setChartData] = useState({
    visitors: { labels: [] as string[], data: [] as number[] },
    pageViews: { labels: [] as string[], data: [] as number[] },
    devices: { labels: [] as string[], data: [] as number[] },
    browsers: { labels: [] as string[], data: [] as number[] },
    countries: { labels: [] as string[], data: [] as number[] }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChartData = async () => {
      if (!isReady) {
        return;
      }

      try {
        setIsLoading(true);
        
        // Get the current date and 30 days ago for the date range
        const now = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        
        const fromDate = thirtyDaysAgo.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        const toDate = now.toISOString().split('T')[0]; // Format as YYYY-MM-DD

        // Fetch chart data from the API
        const data = await client.getDashboardCharts(fromDate, toDate);
        
        // Format the data for the charts
        setChartData({
          visitors: {
            labels: ((data as any).dailyStats || []).map((day: any) => day.date),
            data: ((data as any).dailyStats || []).map((day: any) => day.uniqueVisitors || 0)
          },
          pageViews: {
            labels: ((data as any).dailyStats || []).map((day: any) => day.date),
            data: ((data as any).dailyStats || []).map((day: any) => day.pageviews || 0)
          },
          devices: {
            labels: Object.keys((data as any).devices || {}),
            data: Object.values((data as any).devices || {}) as number[]
          },
          browsers: {
            labels: Object.keys((data as any).browsers || {}),
            data: Object.values((data as any).browsers || {}) as number[]
          },
          countries: {
            labels: ((data as any).countries || []).map((country: any) => country.country),
            data: ((data as any).countries || []).map((country: any) => country.visits)
          }
        });
        
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to fetch dashboard charts:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch chart data");
        setIsLoading(false);
      }
    };

    fetchChartData();
  }, [client, isReady]);

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
        <h3 className="font-semibold mb-1">Error Loading Charts</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <Tabs defaultValue="visitors" className="w-full">
      <div className="flex justify-between items-center mb-4">
        <TabsList>
          <TabsTrigger value="visitors">Visitors</TabsTrigger>
          <TabsTrigger value="pageViews">Page Views</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="browsers">Browsers</TabsTrigger>
          <TabsTrigger value="countries">Countries</TabsTrigger>
        </TabsList>
      </div>
      
      <TabsContent value="visitors" className="mt-0">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Visitors Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <LineChart 
                data={chartData.visitors.data} 
                labels={chartData.visitors.labels} 
                colors={["#3b82f6"]}
                yAxisWidth={40}
                showLegend={false}
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="pageViews" className="mt-0">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Page Views Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <BarChart 
                data={chartData.pageViews.data} 
                labels={chartData.pageViews.labels} 
                colors={["#10b981"]}
                yAxisWidth={40}
                showLegend={false}
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="devices" className="mt-0">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Device Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <PieChart 
                data={chartData.devices.data} 
                labels={chartData.devices.labels} 
                colors={["#3b82f6", "#10b981", "#f59e0b", "#6366f1"]}
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="browsers" className="mt-0">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Browser Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <PieChart 
                data={chartData.browsers.data} 
                labels={chartData.browsers.labels} 
                colors={["#3b82f6", "#10b981", "#f59e0b", "#6366f1", "#ec4899"]}
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="countries" className="mt-0">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Top Countries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <BarChart 
                data={chartData.countries.data} 
                labels={chartData.countries.labels} 
                colors={["#6366f1"]}
                layout="horizontal"
                yAxisWidth={60}
                showLegend={false}
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
} 