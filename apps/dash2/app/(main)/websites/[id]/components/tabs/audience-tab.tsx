"use client";

import { useMemo } from "react";

import { DistributionChart } from "@/components/charts/distribution-chart";
import { DataTable } from "@/components/analytics/data-table";
import { useWebsiteAnalytics } from "@/hooks/use-analytics";
import { formatDistributionData, groupBrowserData } from "../utils/analytics-helpers";
import { BaseTabProps } from "../utils/types";

export function WebsiteAudienceTab({
  websiteId,
  dateRange
}: BaseTabProps) {
  // Fetch analytics data
  const {
    analytics,
    loading
  } = useWebsiteAnalytics(websiteId, dateRange);

  // Prepare device data
  const deviceData = useMemo(() => 
    formatDistributionData(analytics.device_types, 'device_type'), 
    [analytics.device_types]
  );

  // Prepare browser data
  const browserData = useMemo(() => 
    groupBrowserData(analytics.browser_versions), 
    [analytics.browser_versions]
  );

  // Prepare connection types data
  const connectionData = useMemo(() => 
    formatDistributionData(analytics.connection_types, 'connection_type'), 
    [analytics.connection_types]
  );

  // Prepare language data
  const languageData = useMemo(() => 
    formatDistributionData(analytics.languages, 'language'), 
    [analytics.languages]
  );

  return (
    <div className="pt-2 space-y-3">
      <h2 className="text-lg font-semibold mb-2">Audience Insights</h2>
      
      {/* First row - Device and browser info */}
      <div className="grid gap-2 grid-cols-2">
        <div className="rounded-2xl border shadow-sm overflow-hidden">
          <DistributionChart 
            data={deviceData} 
            isLoading={loading.summary}
            title="Device Types"
            description="Visitors by device type"
            height={280}
          />
        </div>
        
        <div className="rounded-2xl border shadow-sm overflow-hidden">
          <DistributionChart 
            data={browserData} 
            isLoading={loading.summary}
            title="Browsers"
            description="Visitors by browser"
            height={280}
          />
        </div>
      </div>
      
      {/* Second row - Connection type and language data */}
      <div className="grid gap-2 grid-cols-2">
        <div className="rounded-2xl border shadow-sm overflow-hidden">
          <DistributionChart 
            data={connectionData} 
            isLoading={loading.summary}
            title="Connection Types"
            description="Visitors by network connection"
            height={250}
          />
        </div>
        
        <div className="rounded-2xl border shadow-sm overflow-hidden">
          <DistributionChart 
            data={languageData} 
            isLoading={loading.summary}
            title="Languages"
            description="Visitors by preferred language"
            height={250}
          />
        </div>
      </div>
      
      {/* Timezones */}
      <div className="rounded-2xl border shadow-sm overflow-hidden">
        <DataTable 
          data={analytics.timezones?.map(item => ({
            timezone: item.timezone, 
            visitors: item.visitors, 
            pageviews: item.pageviews
          })) || []}
          columns={[
            {
              accessorKey: 'timezone',
              header: 'Timezone',
              cell: (value: string) => (
                <span className="font-medium">
                  {value || 'Unknown'}
                </span>
              )
            },
            {
              accessorKey: 'visitors',
              header: 'Visitors',
              className: 'text-right'
            },
            {
              accessorKey: 'pageviews',
              header: 'Pageviews',
              className: 'text-right'
            }
          ]}
          title="Timezones"
          description="Visitors by timezone"
          isLoading={loading.summary}
          limit={10}
        />
      </div>
      
      {/* Countries */}
      <div className="rounded-2xl border shadow-sm overflow-hidden">
        <DataTable 
          data={analytics.countries}
          columns={[
            {
              accessorKey: 'country',
              header: 'Country',
              cell: (value: string) => (
                <span className="font-medium">
                  {value || 'Unknown'}
                </span>
              )
            },
            {
              accessorKey: 'visitors',
              header: 'Visitors',
              className: 'text-right'
            },
            {
              accessorKey: 'pageviews',
              header: 'Pageviews',
              className: 'text-right'
            }
          ]}
          title="Geographic Distribution"
          description="Visitors by location"
          isLoading={loading.summary}
        />
      </div>
      
      {/* Screen resolutions */}
      <div className="rounded-2xl border shadow-sm overflow-hidden">
        <DataTable 
          data={analytics.screen_resolutions}
          columns={[
            {
              accessorKey: 'screen_resolution',
              header: 'Resolution',
              cell: (value: string) => (
                <span className="font-medium">
                  {value || 'Unknown'}
                </span>
              )
            },
            {
              accessorKey: 'visitors',
              header: 'Visitors',
              className: 'text-right'
            },
            {
              accessorKey: 'count',
              header: 'Count',
              className: 'text-right'
            }
          ]}
          title="Screen Resolutions"
          description="Visitors by screen size"
          isLoading={loading.summary}
        />
      </div>
    </div>
  );
} 