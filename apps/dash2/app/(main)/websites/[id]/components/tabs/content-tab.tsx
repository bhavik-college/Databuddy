"use client";

import { useMemo, useEffect } from "react";
import { FileText, Globe, BarChart, Link2, Users, Clock } from "lucide-react";
import { DataTable } from "@/components/analytics/data-table";
import { useWebsiteAnalytics } from "@/hooks/use-analytics";
import type { FullTabProps } from "../utils/types";
import { EmptyState, ExternalLinkButton } from "../utils/ui-components";
import { formatDomainLink } from "../utils/analytics-helpers";

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
      accessorKey: 'path',
      header: 'Page Path',
      cell: (value: string) => {
        const link = formatDomainLink(value, websiteData?.domain);
        return <ExternalLinkButton href={link.href} label={link.display} title={link.title} showTooltip={true} className="font-medium hover:text-primary hover:underline truncate max-w-[300px] flex items-center gap-1"/>;
      }
    },
    {
      accessorKey: 'pageviews',
      header: 'Views',
      className: 'text-right',
    },
    {
      accessorKey: 'visitors',
      header: 'Visitors',
      className: 'text-right',
      cell: (value: number | undefined) => value ?? 'N/A'
    },
    {
      accessorKey: 'avg_time_on_page_formatted',
      header: 'Avg. Time',
      className: 'text-right',
      cell: (value: string | null | undefined) => value || 'N/A'
    },
    {
        accessorKey: 'percentage_of_total',
        header: '% Total Views',
        className: 'text-right',
        cell: (value: number | undefined) => value ? `${value.toFixed(1)}%` : 'N/A'
    }
  ], [websiteData?.domain]);

  const topPagesData = useMemo(() => {
    if (!analytics.top_pages?.length) return [];
    const totalSiteViews = analytics.summary?.pageviews || 1;
    return analytics.top_pages.map((page: TopPageEntry) => ({
      ...page,
      percentage_of_total: (page.pageviews / totalSiteViews) * 100
    })).slice(0, 10);
  }, [analytics.top_pages, analytics.summary?.pageviews]);

  const topReferrersColumns = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Source',
      cell: (value: string, row: TopReferrerEntry) => (
        <span className="font-medium">
          {value || row.domain || row.referrer || 'Direct'}
        </span>
      )
    },
    {
        accessorKey: 'type',
        header: 'Type',
        cell: (value: string | undefined) => value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Unknown'
    },
    {
      accessorKey: 'visitors',
      header: 'Visitors',
      className: 'text-right',
    },
    {
      accessorKey: 'pageviews',
      header: 'Pageviews',
      className: 'text-right',
    },
  ], []);

  const topReferrersData = useMemo(() => {
      return analytics.top_referrers?.slice(0, 10) || [];
  }, [analytics.top_referrers]);

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

  if (!isLoading && !topPagesData.length && !topReferrersData.length) {
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
      <div className="rounded-xl border shadow-sm p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Content Engagement</h3>
          <BarChart className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-background flex flex-col justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Avg. Session Duration</p>
              <p className="text-2xl font-semibold">
                {analytics.summary?.avg_session_duration_formatted || '0s'}
              </p>
            </div>
            <Clock className="h-4 w-4 text-muted-foreground self-end mt-2" />
          </div>
          <div className="p-4 rounded-lg bg-background flex flex-col justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Bounce Rate</p>
              <p className="text-2xl font-semibold">
                {analytics.summary?.bounce_rate_pct || '0%'}
              </p>
            </div>
            <Users className="h-4 w-4 text-muted-foreground self-end mt-2" />
          </div>
          <div className="p-4 rounded-lg bg-background flex flex-col justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Pages per Session</p>
              <p className="text-2xl font-semibold">
                {analytics.summary?.sessions && analytics.summary.sessions > 0 ? 
                  ( (analytics.summary.pageviews || 0) / analytics.summary.sessions).toFixed(1) : 
                  '0.0'
                }
              </p>
            </div>
            <FileText className="h-4 w-4 text-muted-foreground self-end mt-2" />
          </div>
        </div>
      </div>

      {topPagesData.length > 0 && (
        <div className="rounded-xl border shadow-sm">
          <DataTable
            data={topPagesData}
            columns={topPagesColumns}
            title="Top Pages"
            description="Most viewed pages on your website."
            isLoading={isLoading}
          />
        </div>
      )}

      {topReferrersData.length > 0 && (
        <div className="rounded-xl border shadow-sm">
          <DataTable
            data={topReferrersData}
            columns={topReferrersColumns}
            title="Top Referrers"
            description="Where your website traffic is coming from."
            isLoading={isLoading}
          />
        </div>
      )}
    </div>
  );
} 