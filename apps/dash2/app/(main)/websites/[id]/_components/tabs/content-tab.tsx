"use client";

import { useMemo, useEffect, useCallback } from "react";
import { FileText, Globe, BarChart, Link2, Users, Clock } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/analytics/data-table";
import { useWebsiteAnalytics } from "@/hooks/use-analytics";
import type { FullTabProps } from "../utils/types";
import { EmptyState } from "../utils/ui-components";
import { formatDomainLink } from "../utils/analytics-helpers";
import { PageLinkCell, type PageLinkCellData } from "@/components/atomic/PageLinkCell";
import { ReferrerSourceCell, type ReferrerSourceCellData } from "@/components/atomic/ReferrerSourceCell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useTableTabs, type BaseTabItem } from "@/lib/table-tabs";
import { PercentageBadge } from "../utils/technology-helpers";

interface TopPageEntry {
  path: string;
  pageviews: number;
  visitors?: number;
  avg_time_on_page?: number | null;
  avg_time_on_page_formatted?: string;
}

interface TopReferrerEntry {
  referrer: string;
  name?: string;
  domain?: string;
  visitors: number;
  pageviews: number;
  type?: string;
}

interface TopPageEntryWithPercent extends TopPageEntry {
  percentage: number;
}

interface TopReferrerEntryWithPercent extends TopReferrerEntry {
  percentage: number;
}



export function WebsiteContentTab({
  websiteId,
  dateRange,
  isRefreshing,
  setIsRefreshing,
  websiteData
}: FullTabProps) {
  const {
    analytics,
    loading,
    error,
    refetch
  } = useWebsiteAnalytics(websiteId, dateRange);

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

  const isLoading = loading.summary || isRefreshing;

  const topPagesColumns = useMemo(() => [
    {
      id: 'path',
      accessorKey: 'path',
      header: 'Page',
      cell: (info: any) => (
        <PageLinkCell 
          path={info.getValue() as string} 
          websiteDomain={websiteData?.domain} 
        />
      )
    },
    {
      id: 'pageviews',
      accessorKey: 'pageviews',
      header: 'Views',
    },
    {
      id: 'visitors',
      accessorKey: 'visitors',
      header: 'Visitors',
    },
    {
      id: 'percentage',
      accessorKey: 'percentage',
      header: 'Share',
      cell: (info: any) => {
        const percentage = info.getValue() as number;
        return <PercentageBadge percentage={percentage} />;
      },
    },
  ], [websiteData?.domain]);

  const entryPagesColumns = useMemo(() => [
    {
      id: 'path',
      accessorKey: 'path',
      header: 'Page',
      cell: (info: any) => (
        <PageLinkCell 
          path={info.getValue() as string} 
          websiteDomain={websiteData?.domain} 
        />
      )
    },
    {
      id: 'entries',
      accessorKey: 'entries',
      header: 'Entries',
    },
    {
      id: 'visitors',
      accessorKey: 'visitors',
      header: 'Visitors',
    },
    {
      id: 'percentage',
      accessorKey: 'percentage',
      header: 'Share',
      cell: (info: any) => {
        const percentage = info.getValue() as number;
        return <PercentageBadge percentage={percentage} />;
      },
    },
  ], [websiteData?.domain]);

  const exitPagesColumns = useMemo(() => [
    {
      id: 'path',
      accessorKey: 'path',
      header: 'Page',
      cell: (info: any) => (
        <PageLinkCell 
          path={info.getValue() as string} 
          websiteDomain={websiteData?.domain} 
        />
      )
    },
    {
      id: 'exits',
      accessorKey: 'exits',
      header: 'Exits',
    },
    {
      id: 'visitors',
      accessorKey: 'visitors',
      header: 'Visitors',
    },
    {
      id: 'percentage',
      accessorKey: 'percentage',
      header: 'Share',
      cell: (info: any) => {
        const percentage = info.getValue() as number;
        return <PercentageBadge percentage={percentage} />;
      },
    },
  ], [websiteData?.domain]);

  const processedTopPages = useMemo(() => {
    if (!analytics.top_pages?.length) return [];
    
    const totalPageviews = analytics.top_pages.reduce((sum: number, page: any) => sum + (page.pageviews || 0), 0);
    
    return analytics.top_pages.map(page => ({
      ...page,
      percentage: totalPageviews > 0 ? Math.round((page.pageviews / totalPageviews) * 100) : 0
    }));
  }, [analytics.top_pages]);

  const processedEntryPages = useMemo(() => {
    if (!analytics.entry_pages?.length) return [];
    
    return analytics.entry_pages.map(page => ({
      ...page,
      pageviews: page.entries,
      visitors: page.visitors
    }));
  }, [analytics.entry_pages]);

  const processedExitPages = useMemo(() => {
    if (!analytics.exit_pages?.length) return [];
    
    return analytics.exit_pages.map(page => ({
      ...page,
      pageviews: page.exits,
      visitors: page.visitors
    }));
  }, [analytics.exit_pages]);

  const pagesTabs = useTableTabs({
    top_pages: {
      data: processedTopPages,
      label: 'Top Pages',
      primaryField: 'path',
      primaryHeader: 'Page'
    },
    entry_pages: {
      data: processedEntryPages,
      label: 'Entry Pages',
      primaryField: 'path',
      primaryHeader: 'Page'
    },
    exit_pages: {
      data: processedExitPages,
      label: 'Exit Pages', 
      primaryField: 'path',
      primaryHeader: 'Page'
    }
  });

  const referrerCustomCell = useCallback((info: any) => {
    const cellData: ReferrerSourceCellData = info.row.original;
    return <ReferrerSourceCell {...cellData} />;
  }, []);

  const referrerTabs = useTableTabs({
    referrers: {
      data: analytics.top_referrers || [],
      label: 'Referrers',
      primaryField: 'name',
      primaryHeader: 'Source',
      customCell: referrerCustomCell
    },
    utm_sources: {
      data: analytics.utm_sources || [],
      label: 'UTM Sources',
      primaryField: 'utm_source',
      primaryHeader: 'Source'
    },
    utm_mediums: {
      data: analytics.utm_mediums || [],
      label: 'UTM Mediums',
      primaryField: 'utm_medium',
      primaryHeader: 'Medium'
    },
    utm_campaigns: {
      data: analytics.utm_campaigns || [],
      label: 'UTM Campaigns',
      primaryField: 'utm_campaign',
      primaryHeader: 'Campaign'
    }
  });

  if (!isLoading && error?.summary) {
    return (
      <div className="pt-6">
        <EmptyState
          icon={<FileText className="h-10 w-10" />}
          title="Error Loading Content Data"
          description="There was an issue retrieving content analytics. Please try refreshing."
          action={null}
        />
      </div>
    );
  }

  if (!isLoading && !processedTopPages.length && !analytics.top_referrers?.length) {
    return (
      <div className="pt-6">
        <EmptyState
          icon={<FileText className="h-10 w-10" />}
          title="No Content Data Available"
          description="Content and referrer data will appear here once your website receives more traffic."
          action={null}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2">
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
                <CardTitle className="text-lg">Content Engagement</CardTitle>
                <CardDescription className="text-sm text-muted-foreground mt-0.5">Key metrics for user interaction with your content</CardDescription>
            </div>
            <BarChart className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-muted/50 flex flex-col justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Avg. Session Duration</p>
                <p className="text-xl font-semibold">
                  {analytics.summary?.avg_session_duration_formatted || '0s'}
                </p>
              </div>
              <Clock className="h-4 w-4 text-muted-foreground self-end mt-1" />
            </div>
            <div className="p-4 rounded-lg bg-muted/50 flex flex-col justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Bounce Rate</p>
                <p className="text-xl font-semibold">
                  {analytics.summary?.bounce_rate_pct || '0%'}
                </p>
              </div>
              <Users className="h-4 w-4 text-muted-foreground self-end mt-1" />
            </div>
            <div className="p-4 rounded-lg bg-muted/50 flex flex-col justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Pages per Session</p>
                <p className="text-xl font-semibold">
                  {analytics.summary?.sessions && analytics.summary.sessions > 0 ? 
                    ( (analytics.summary.pageviews || 0) / analytics.summary.sessions).toFixed(1) : 
                    '0.0'
                  }
                </p>
              </div>
              <FileText className="h-4 w-4 text-muted-foreground self-end mt-1" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pages (Top, Entry, Exit) */}
        <DataTable 
          tabs={pagesTabs}
          title="Pages"
          description="Page views, entry points, and exit points"
          isLoading={isLoading}
          initialPageSize={7}
          minHeight={280}
        />

        {/* Top Referrers */}
        <DataTable 
          tabs={referrerTabs}
          title="Traffic Sources"
          description="Sources of your traffic and UTM data"
          isLoading={isLoading}
          initialPageSize={7}
          minHeight={280}
        />
      </div>
    </div>
  );
} 