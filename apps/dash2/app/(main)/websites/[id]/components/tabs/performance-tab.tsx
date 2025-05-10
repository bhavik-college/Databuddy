"use client";

import { useState, useEffect } from "react";
import { Zap, Monitor, AlertCircle, HelpCircle, BarChart } from "lucide-react";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StatCard } from "@/components/analytics/stat-card";
import { useWebsiteAnalytics } from "@/hooks/use-analytics";
import { getColorVariant, PERFORMANCE_THRESHOLDS } from "../utils/analytics-helpers";
import type { RefreshableTabProps } from "../utils/types";
import { EmptyState, MetricTooltip } from "../utils/ui-components";

export function WebsitePerformanceTab({
  websiteId,
  dateRange,
  isRefreshing,
  setIsRefreshing
}: RefreshableTabProps) {
  const [activeTab, setActiveTab] = useState<string>("core");
  
  // Fetch analytics data
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

  const hasPerformanceData = Boolean(analytics.performance && 
    Object.keys(analytics.performance).some(
      key => {
        const value = analytics.performance?.[key as keyof typeof analytics.performance];
        return typeof value === 'number' && value > 0;
      }
    )
  );

  // Combine loading states
  const isLoading = loading.summary || isRefreshing;

  // Only show error state when there's a real error with summary data and not loading
  if (error?.summary && !isLoading) {
    return (
      <div className="pt-6">
        <EmptyState
          icon={<AlertCircle className="h-10 w-10" />}
          title="Error loading performance data"
          description="Unable to load performance metrics for this website."
          action={null}
        />
      </div>
    );
  }

  // Only show empty state when we're not loading and have no data
  if (!isLoading && !hasPerformanceData) {
    return (
      <div className="pt-6">
        <EmptyState
          icon={<BarChart className="h-10 w-10" />}
          title="No performance data available"
          description="We haven't collected any performance metrics for this website yet. Data will appear as users visit your site."
          action={null}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Performance Metrics</h2>
          <TabsList className="bg-muted/60">
            <TabsTrigger value="core">Core Metrics</TabsTrigger>
            <TabsTrigger value="web-vitals">Web Vitals</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="core" className="pt-1">
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            <MetricTooltip metricKey="load_time" label="Page Load Time">
              <StatCard 
                title="Page Load Time"
                value={analytics.performance?.avg_load_time_formatted || '0 ms'}
                icon={Zap}
                isLoading={isLoading}
                variant={getColorVariant(analytics.performance?.avg_load_time || 0, PERFORMANCE_THRESHOLDS.load_time.average, PERFORMANCE_THRESHOLDS.load_time.good)}
                className="shadow-sm h-full"
                description="Total time to load the page"
              />
            </MetricTooltip>
            
            <MetricTooltip metricKey="ttfb" label="Time to First Byte">
              <StatCard 
                title="Time to First Byte"
                value={analytics.performance?.avg_ttfb_formatted || '0 ms'}
                icon={Zap}
                isLoading={isLoading}
                variant={getColorVariant(analytics.performance?.avg_ttfb || 0, PERFORMANCE_THRESHOLDS.ttfb.average, PERFORMANCE_THRESHOLDS.ttfb.good)}
                className="shadow-sm h-full"
                description="Server response time"
              />
            </MetricTooltip>
            
            <MetricTooltip metricKey="dom_ready" label="DOM Ready Time">
              <StatCard 
                title="DOM Ready"
                value={analytics.performance?.avg_dom_ready_time_formatted || '0 ms'}
                icon={Zap}
                isLoading={isLoading}
                variant={getColorVariant(analytics.performance?.avg_dom_ready_time || 0, PERFORMANCE_THRESHOLDS.dom_ready.average, PERFORMANCE_THRESHOLDS.dom_ready.good)}
                className="shadow-sm h-full"
                description="Time until DOM is ready"
              />
            </MetricTooltip>
            
            <MetricTooltip metricKey="render_time" label="Render Time">
              <StatCard 
                title="Render Time"
                value={analytics.performance?.avg_render_time_formatted || '0 ms'}
                icon={Zap}
                isLoading={isLoading}
                variant={getColorVariant(analytics.performance?.avg_render_time || 0, PERFORMANCE_THRESHOLDS.render_time.average, PERFORMANCE_THRESHOLDS.render_time.good)}
                className="shadow-sm h-full"
                description="Time until content renders"
              />
            </MetricTooltip>
          </div>
        </TabsContent>

        <TabsContent value="web-vitals" className="pt-1">
          <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <MetricTooltip metricKey="fcp" label="First Contentful Paint">
              <StatCard 
                title="First Contentful Paint"
                value={analytics.performance?.avg_fcp === null || analytics.performance?.avg_fcp === undefined 
                  ? 'N/A' 
                  : (analytics.performance?.avg_fcp_formatted || '0 ms')}
                icon={Monitor}
                isLoading={isLoading}
                variant={analytics.performance?.avg_fcp === null || analytics.performance?.avg_fcp === undefined 
                  ? 'default'
                  : getColorVariant(analytics.performance.avg_fcp, PERFORMANCE_THRESHOLDS.fcp.average, PERFORMANCE_THRESHOLDS.fcp.good)}
                className="shadow-sm h-full"
                description="When first content is painted"
              />
            </MetricTooltip>
            
            <MetricTooltip metricKey="lcp" label="Largest Contentful Paint">
              <StatCard 
                title="Largest Contentful Paint"
                value={analytics.performance?.avg_lcp === null || analytics.performance?.avg_lcp === undefined 
                  ? 'N/A' 
                  : (analytics.performance?.avg_lcp_formatted || '0 ms')}
                icon={Monitor}
                isLoading={isLoading}
                variant={analytics.performance?.avg_lcp === null || analytics.performance?.avg_lcp === undefined 
                  ? 'default'
                  : getColorVariant(analytics.performance.avg_lcp, PERFORMANCE_THRESHOLDS.lcp.average, PERFORMANCE_THRESHOLDS.lcp.good)}
                className="shadow-sm h-full"
                description="When largest content is painted"
              />
            </MetricTooltip>
            
            <MetricTooltip metricKey="cls" label="Cumulative Layout Shift">
              <StatCard 
                title="Cumulative Layout Shift"
                value={analytics.performance?.avg_cls === null || analytics.performance?.avg_cls === undefined 
                  ? 'N/A' 
                  : (analytics.performance?.avg_cls_formatted || '0')}
                icon={Monitor}
                isLoading={isLoading}
                variant={analytics.performance?.avg_cls === null || analytics.performance?.avg_cls === undefined 
                  ? 'default'
                  : getColorVariant(analytics.performance.avg_cls, PERFORMANCE_THRESHOLDS.cls.average, PERFORMANCE_THRESHOLDS.cls.good)}
                className="shadow-sm h-full"
                description="Visual stability"
              />
            </MetricTooltip>
          </div>
        </TabsContent>
      </Tabs>

      <Card className="p-4 text-sm text-muted-foreground border-muted bg-muted/10">
        <div className="flex gap-2 items-start">
          <HelpCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-foreground mb-1">About Performance Metrics</p>
            <p>These metrics show the average values across all visitors. Faster loading times improve user experience and SEO ranking. <span className="text-green-600 dark:text-green-400 font-medium">Green</span> indicates good performance, <span className="text-yellow-600 dark:text-yellow-400 font-medium">yellow</span> needs improvement, and <span className="text-red-600 dark:text-red-400 font-medium">red</span> indicates poor performance.</p>
          </div>
        </div>
      </Card>
    </div>
  );
} 