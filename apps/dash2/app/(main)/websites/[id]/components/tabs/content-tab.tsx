"use client";

import { useMemo } from "react";

import { DataTable } from "@/components/analytics/data-table";
import { useWebsiteAnalytics } from "@/hooks/use-analytics";
import { formatDomainLink } from "../utils/analytics-helpers";
import { ExternalLinkButton } from "../utils/ui-components";
import { WebsiteDataTabProps } from "../utils/types";

export function WebsiteContentTab({
  websiteId,
  dateRange,
  websiteData
}: WebsiteDataTabProps) {
  // Fetch analytics data
  const {
    analytics,
    loading
  } = useWebsiteAnalytics(websiteId, dateRange);

  const topPagesColumns = useMemo(() => [
    {
      accessorKey: 'path',
      header: 'Page',
      cell: (value: string) => {
        const link = formatDomainLink(value, websiteData?.domain);
        return <ExternalLinkButton href={link.href} label={link.display} title={link.title} />;
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
    },
  ], [websiteData?.domain]);

  const referrerColumns = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Source',
      cell: (value: string, row: any) => (
        <span className="font-medium">
          {value || row.referrer || 'Direct'}
        </span>
      )
    },
    {
      accessorKey: 'visitors',
      header: 'Visitors',
      className: 'text-right',
    },
    {
      accessorKey: 'pageviews',
      header: 'Views',
      className: 'text-right',
    },
  ], []);

  return (
    <div className="pt-2 space-y-3">
      <h2 className="text-lg font-semibold mb-2">Content Performance</h2>
      
      {/* Top pages full table */}
      <div className="rounded-2xl border shadow-sm overflow-hidden">
        <DataTable 
          data={analytics.top_pages}
          columns={topPagesColumns}
          title="Top Pages"
          description="Most viewed content"
          isLoading={loading.summary}
          limit={10}
        />
      </div>
      
      {/* Top referrers full table */}
      <div className="rounded-2xl border shadow-sm overflow-hidden">
        <DataTable 
          data={analytics.top_referrers}
          columns={referrerColumns}
          title="Traffic Sources"
          description="Where your visitors come from"
          isLoading={loading.summary}
          limit={10}
        />
      </div>
    </div>
  );
} 