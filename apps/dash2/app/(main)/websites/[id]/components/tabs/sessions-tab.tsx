"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { ExternalLink, ActivitySquare, RefreshCw, Users, Eye, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

import { DataTable } from "@/components/analytics/data-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAnalyticsSessions, useAnalyticsSessionDetails } from "@/hooks/use-analytics";
import type { DateRange } from "@/hooks/use-analytics";
import { AnimatedLoading } from "@/components/analytics/animated-loading";
import { StatCard } from "@/components/analytics/stat-card";

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
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  
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

  // Simulate loading progress
  useEffect(() => {
    if (isLoadingSessions) {
      const intervals = [
        { target: 30, duration: 1000 },
        { target: 65, duration: 2000 },
        { target: 85, duration: 1500 },
        { target: 95, duration: 1500 }
      ];
      
      const cleanup: NodeJS.Timeout[] = [];
      
      intervals.forEach((interval, index) => {
        const timeout = setTimeout(() => {
          setLoadingProgress(interval.target);
        }, interval.duration * (index === 0 ? 1 : index));
        
        cleanup.push(timeout);
      });
      
      return () => {
        for (const timeout of cleanup) {
          clearTimeout(timeout);
        }
      };
    }
    
    // Reset progress when loading is complete
    setLoadingProgress(100);
    
      // After animation completes, reset to 0
      const timeout = setTimeout(() => {
        setLoadingProgress(0);
      }, 1000);
      
    return () => clearTimeout(timeout);
  }, [isLoadingSessions]);

  // Calculate summary stats for StatCards
  const totalSessions = useMemo(() => sessionsData?.sessions?.length || 0, [sessionsData?.sessions]);
  const uniqueVisitors = useMemo(() => sessionsData?.unique_visitors || 0, [sessionsData?.unique_visitors]);
  
  const avgPagesPerSession = useMemo(() => {
    if (!sessionsData?.sessions || sessionsData.sessions.length === 0) return 0;
    const totalPageViews = sessionsData.sessions.reduce((sum, session) => sum + (session.page_views || 0), 0);
    return totalPageViews / sessionsData.sessions.length;
  }, [sessionsData?.sessions]);

  const avgSessionDurationFormatted = useMemo(() => {
    if (!sessionsData?.sessions || sessionsData.sessions.length === 0) return '0s';
    const totalDurationSeconds = sessionsData.sessions.reduce((sum, session) => sum + (session.duration || 0), 0);
    const avgSeconds = totalDurationSeconds / sessionsData.sessions.length;
    const hours = Math.floor(avgSeconds / 3600);
    const minutes = Math.floor((avgSeconds % 3600) / 60);
    const seconds = Math.floor(avgSeconds % 60);
    let formatted = '';
    if (hours > 0) formatted += `${hours}h `;
    if (minutes > 0 || hours > 0) formatted += `${minutes}m `;
    formatted += `${seconds}s`;
    return formatted || '0s';
  }, [sessionsData?.sessions]);

  return (
    <div className="pt-2 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Session Analytics</h2>
        {/* Potentially add filters or other controls here */}
      </div>

      {/* Summary StatCards */}
      {!isLoadingSessions && sessionsData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <StatCard
            title="Total Sessions"
            value={totalSessions.toLocaleString()}
            icon={ActivitySquare}
            isLoading={isLoadingSessions}
            description="Number of distinct sessions"
            className="shadow-sm"
          />
          <StatCard
            title="Unique Visitors"
            value={uniqueVisitors.toLocaleString()}
            icon={Users}
            isLoading={isLoadingSessions}
            description="Number of unique users"
            className="shadow-sm"
          />
          <StatCard
            title="Avg. Pages/Session"
            value={avgPagesPerSession.toFixed(1)}
            icon={Eye}
            isLoading={isLoadingSessions}
            description="Average pages viewed per session"
            className="shadow-sm"
          />
          <StatCard
            title="Avg. Session Duration"
            value={avgSessionDurationFormatted}
            icon={Clock}
            isLoading={isLoadingSessions}
            description="Average length of a session"
            className="shadow-sm"
          />
        </div>
      )}
      
      {/* Show animated loading component when loading */}
      {isLoadingSessions ? (
        <AnimatedLoading type="sessions" progress={loadingProgress} />
      ) : sessionsData ? (
        <>
          {/* Sessions list table */}
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
                  cell: (value: string, row: any) => {
                    const deviceInfo = [
                        row.device || 'Unknown Device',
                        row.browser || 'Unknown Browser',
                        row.os || 'Unknown OS'
                    ].join(' - ');
                    return <div className="whitespace-nowrap">{deviceInfo}</div>;
                  }
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
        </>
      ) : (
        <div className="rounded-lg border shadow-sm p-8 text-center">
          <div className="flex flex-col items-center">
            <ActivitySquare className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No session data</h3>
            <p className="text-muted-foreground mb-4">
              No session data is available for the selected time period.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setIsRefreshing(true);
                sessionsRefetch()
                  .then(() => {
                    toast.success("Session data refreshed");
                  })
                  .catch(() => {
                    toast.error("Failed to refresh session data");
                  })
                  .finally(() => {
                    setIsRefreshing(false);
                  });
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
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
            <div className="text-sm text-muted-foreground mt-2">
              {sessionDetails?.session ? (
                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
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
                <div>Loading session information...</div>
              )}
            </div>
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