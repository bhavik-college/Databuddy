"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";

import { DataTable } from "@/components/analytics/data-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAnalyticsSessions, useAnalyticsSessionDetails } from "@/hooks/use-analytics";
import { DateRange } from "@/hooks/use-analytics";

// Define the component props type
interface WebsiteSessionsTabProps {
  websiteId: string;
  dateRange: DateRange & { granularity?: 'daily' | 'hourly' };
  isRefreshing: boolean;
  setIsRefreshing: (value: boolean) => void;
}

export function WebsiteSessionsTab({
  websiteId,
  dateRange,
  isRefreshing,
  setIsRefreshing
}: WebsiteSessionsTabProps) {
  // Session details dialog state
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  
  // Fetch sessions data
  const { 
    data: sessionsData, 
    isLoading: isLoadingSessions,
    refetch: sessionsRefetch 
  } = useAnalyticsSessions(
    websiteId, 
    { start_date: dateRange.start_date, end_date: dateRange.end_date },
    50
  );
  
  // Fetch session details when a session is selected
  const { data: sessionDetails, isLoading: isLoadingSessionDetails } = useAnalyticsSessionDetails(
    websiteId,
    selectedSessionId || '',
    !!selectedSessionId
  );
  
  // Format session events for display
  const formattedEvents = useMemo(() => {
    if (!sessionDetails?.session?.events) return [];
    
    return sessionDetails.session.events.map(event => ({
      id: event.event_id,
      time: format(new Date(event.time), 'HH:mm:ss'),
      event: event.event_name,
      path: event.path,
      title: event.title || '-',
      time_on_page: event.time_on_page ? `${Math.round(event.time_on_page)}s` : '-',
      device_info: [event.browser, event.os, event.device_type]
        .filter(Boolean)
        .join(' / ') || 'Unknown'
    }));
  }, [sessionDetails]);

  // Session handlers
  const handleSessionRowClick = useCallback((sessionId: string) => {
    setSelectedSessionId(sessionId);
  }, []);
  
  const handleCloseSessionDialog = useCallback(() => {
    setSelectedSessionId(null);
  }, []);

  // Handle refresh
  useEffect(() => {
    if (isRefreshing) {
      sessionsRefetch()
        .then(() => {
          // Success will be handled by the parent component
        })
        .catch(() => {
          toast.error("Failed to refresh session data");
        })
        .finally(() => {
          // Finalization will be handled by the parent component
          // which will set isRefreshing to false
        });
    }
  }, [isRefreshing, sessionsRefetch]);

  return (
    <div className="pt-2 space-y-3">
      <h2 className="text-lg font-semibold mb-2">Visitor Sessions</h2>
      
      <div className="rounded-lg border shadow-sm overflow-hidden">
        <DataTable
          data={sessionsData?.sessions || []}
          columns={[
            {
              accessorKey: 'session_name',
              header: 'Session',
              cell: (value: string, row: any) => (
                <div className="font-medium flex items-center">
                  {value}
                  {row.is_returning_visitor && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
                      Returning
                    </span>
                  )}
                </div>
              )
            },
            {
              accessorKey: 'first_visit',
              header: 'Time',
              cell: (value: string) => (
                <div>
                  {value ? format(new Date(value), 'MMM d, yyyy HH:mm:ss') : '-'}
                </div>
              )
            },
            {
              accessorKey: 'country',
              header: 'Location',
              cell: (value: string) => (
                <div className="whitespace-nowrap">
                  {value || 'Unknown'}
                </div>
              )
            },
            {
              accessorKey: 'device',
              header: 'Device',
              cell: (value: string) => value || 'Unknown'
            },
            {
              accessorKey: 'page_views',
              header: 'Pages',
              className: 'text-right',
              cell: (value: number) => value || 0
            },
            {
              accessorKey: 'duration_formatted',
              header: 'Duration',
              className: 'text-right',
              cell: (value: string) => value || '0s'
            },
            {
              accessorKey: 'referrer_parsed',
              header: 'Source',
              cell: (value: { type: string; name: string; domain: string } | undefined) => (
                <div className="max-w-[200px] truncate">
                  {value?.name || 'Direct'}
                </div>
              )
            }
          ]}
          title="Recent Sessions"
          description="List of visitor sessions on your website"
          isLoading={isLoadingSessions}
          emptyMessage="No session data available for the selected period"
          onRowClick={(row: { session_id: string }) => handleSessionRowClick(row.session_id)}
        />
      </div>
      
      {sessionsData && (
        <div className="text-sm text-muted-foreground mt-2">
          Showing {sessionsData.sessions.length} sessions from {sessionsData.unique_visitors} unique visitors in the selected period.
        </div>
      )}

      {/* Session Details Dialog */}
      <Dialog open={!!selectedSessionId} onOpenChange={(open) => {
        if (!open) handleCloseSessionDialog();
      }}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {sessionDetails?.session?.session_name || 'Session Details'}
              {sessionDetails?.session?.is_returning_visitor && (
                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
                  Returning Visitor
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              {sessionDetails?.session ? (
                <div className="grid grid-cols-2 gap-4 mt-2 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium">Started:</span> {format(new Date(sessionDetails.session.first_visit), 'MMM d, yyyy HH:mm:ss')}
                  </div>
                  <div>
                    <span className="font-medium">Duration:</span> {sessionDetails.session.duration_formatted}
                  </div>
                  <div>
                    <span className="font-medium">Device:</span> {sessionDetails.session.device || 'Unknown'}
                  </div>
                  <div>
                    <span className="font-medium">Browser:</span> {sessionDetails.session.browser || 'Unknown'}
                  </div>
                  <div>
                    <span className="font-medium">Country:</span> {sessionDetails.session.country || 'Unknown'}
                  </div>
                  <div>
                    <span className="font-medium">Pages viewed:</span> {sessionDetails.session.page_views}
                  </div>
                  <div>
                    <span className="font-medium">Visitor ID:</span> {sessionDetails.session.visitor_id?.substring(0, 8) || 'Unknown'}
                    {sessionDetails.session.is_returning_visitor && (
                      <span className="ml-2 text-xs">
                        (Session {sessionDetails.session.visitor_session_count} of this visitor)
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="font-medium">Referrer:</span> {sessionDetails.session.referrer_parsed?.name || 'Direct'}
                    {sessionDetails.session.referrer && (
                      <span className="text-xs ml-2 opacity-70">({sessionDetails.session.referrer})</span>
                    )}
                  </div>
                </div>
              ) : (
                <p>Loading session information...</p>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Session Events</h3>
            {isLoadingSessionDetails ? (
              <div className="text-center py-8">Loading session events...</div>
            ) : (
              <div className="rounded-lg border shadow-sm overflow-hidden">
                <DataTable
                  data={formattedEvents}
                  columns={[
                    {
                      accessorKey: 'time',
                      header: 'Time',
                      cell: (value: string) => <div className="font-medium">{value}</div>
                    },
                    {
                      accessorKey: 'event',
                      header: 'Event'
                    },
                    {
                      accessorKey: 'path',
                      header: 'Path',
                      cell: (value: string) => (
                        <div className="max-w-[250px] truncate">
                          {value}
                        </div>
                      )
                    },
                    {
                      accessorKey: 'device_info',
                      header: 'Device Info',
                      cell: (value: string) => (
                        <div className="max-w-[200px] truncate">
                          {value}
                        </div>
                      )
                    },
                    {
                      accessorKey: 'time_on_page',
                      header: 'Time on Page',
                      className: 'text-right'
                    }
                  ]}
                  title="Session Timeline"
                  description="Chronological list of events during this session"
                  isLoading={isLoadingSessionDetails}
                  emptyMessage="No events recorded for this session"
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 