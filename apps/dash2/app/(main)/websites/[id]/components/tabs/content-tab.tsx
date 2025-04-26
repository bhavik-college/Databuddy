"use client";

import { useState, useEffect } from "react";
import { FileText, Globe, BarChart, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useWebsiteAnalytics } from "@/hooks/use-analytics";
import type { RefreshableTabProps } from "../utils/types";
import { EmptyState } from "../utils/ui-components";

export function WebsiteContentTab({
  websiteId,
  dateRange,
  isRefreshing,
  setIsRefreshing
}: RefreshableTabProps) {
  const {
    analytics,
    loading,
    error,
    refetch
  } = useWebsiteAnalytics(websiteId, dateRange);

  // Handle refresh
  useEffect(() => {
    let isMounted = true;
    
    if (isRefreshing) {
      const doRefresh = async () => {
        try {
          await refetch();
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
  }, [isRefreshing, refetch, setIsRefreshing]);

  // Combine loading states
  const isLoading = loading.summary || isRefreshing;

  // Only show error state when there's a real error with summary data and not loading
  if (error?.summary && !isLoading) {
    return (
      <div className="pt-6">
        <EmptyState
          icon={<AlertCircle className="h-10 w-10" />}
          title="Error loading content data"
          description="Unable to load content metrics for this website."
          action={null}
        />
      </div>
    );
  }

  // Only show empty state when we're not loading and have no data
  if (!isLoading && (!analytics.top_pages || analytics.top_pages.length === 0)) {
    return (
      <div className="pt-6">
        <EmptyState
          icon={<FileText className="h-10 w-10" />}
          title="No content data available"
          description="We haven't collected any content metrics for this website yet. Data will appear as users visit your pages."
          action={null}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      <div className="grid gap-3 grid-cols-1 lg:grid-cols-2">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">Top Pages</h3>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-4">
            {analytics.top_pages?.map((page) => (
              <div key={page.path} className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{page.path}</p>
                  <p className="text-xs text-muted-foreground">
                    {page.pageviews} views • {page.avg_time_on_page_formatted} avg
                  </p>
                </div>
                <div className="text-sm font-medium">
                  {((page.pageviews / (analytics.summary?.pageviews || 1)) * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">Content Engagement</h3>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Average Time on Page</p>
                <p className="text-xs text-muted-foreground">How long users stay on each page</p>
              </div>
              <div className="text-sm font-medium">
                {analytics.top_pages?.[0]?.avg_time_on_page_formatted || '0s'}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Bounce Rate</p>
                <p className="text-xs text-muted-foreground">Users who leave without interaction</p>
              </div>
              <div className="text-sm font-medium">
                {analytics.summary?.bounce_rate_pct || '0%'}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Pages per Session</p>
                <p className="text-xs text-muted-foreground">Average pages viewed per visit</p>
              </div>
              <div className="text-sm font-medium">
                {((analytics.summary?.pageviews || 0) / (analytics.summary?.sessions || 1)).toFixed(1)}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
} 