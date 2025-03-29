"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

import { DataTable } from "@/components/analytics/data-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAnalyticsProfiles } from "@/hooks/use-analytics";
import { DateRange } from "@/hooks/use-analytics";

// Define the component props type
interface WebsiteProfilesTabProps {
  websiteId: string;
  dateRange: DateRange & { granularity?: 'daily' | 'hourly' };
  isRefreshing: boolean;
  setIsRefreshing: (value: boolean) => void;
}

export function WebsiteProfilesTab({
  websiteId,
  dateRange,
  isRefreshing,
  setIsRefreshing
}: WebsiteProfilesTabProps) {
  // Add this for profile details dialog
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  
  // Fetch profiles data
  const { 
    data: profilesData, 
    isLoading: isLoadingProfiles,
    refetch: profilesRefetch
  } = useAnalyticsProfiles(
    websiteId, 
    { start_date: dateRange.start_date, end_date: dateRange.end_date },
    50
  );
  
  // Format the selected profile
  const selectedProfile = useMemo(() => {
    if (!selectedProfileId || !profilesData?.profiles) return null;
    return profilesData.profiles.find(profile => profile.visitor_id === selectedProfileId) || null;
  }, [selectedProfileId, profilesData]);
  
  // Format profile sessions for display
  const formattedProfileSessions = useMemo(() => {
    if (!selectedProfile?.sessions) return [];
    
    return selectedProfile.sessions.map(session => ({
      id: session.session_id,
      name: session.session_name,
      time: format(new Date(session.first_visit), 'MMM d, yyyy HH:mm:ss'),
      duration: session.duration_formatted,
      pages: session.page_views
    }));
  }, [selectedProfile]);

  // Profile handlers
  const handleProfileRowClick = useCallback((profileId: string) => {
    setSelectedProfileId(profileId);
  }, []);
  
  const handleCloseProfileDialog = useCallback(() => {
    setSelectedProfileId(null);
  }, []);

  // Handle refresh
  useEffect(() => {
    if (isRefreshing) {
      profilesRefetch()
        .then(() => {
          // Success will be handled by the parent component
        })
        .catch(() => {
          toast.error("Failed to refresh profile data");
        })
        .finally(() => {
          // Finalization will be handled by the parent component
        });
    }
  }, [isRefreshing, profilesRefetch]);

  // Handler for session row clicks 
  const handleSessionRowClick = (sessionId: string) => {
    // This would ideally open the session details in another dialog
    // or redirect to the sessions tab with this session selected
    // For now, we'll just log it
    console.log("Session selected:", sessionId);
    // Close the profile dialog
    setSelectedProfileId(null);
    
    // In a real implementation, we might dispatch an event or use a context
    // to communicate with the sessions tab to show this specific session
  };

  return (
    <div className="pt-2 space-y-3">
      <h2 className="text-lg font-semibold mb-2">Visitor Profiles</h2>
      
      <div className="rounded-lg border shadow-sm overflow-hidden">
        <DataTable
          data={profilesData?.profiles || []}
          columns={[
            {
              accessorKey: 'visitor_id',
              header: 'Visitor ID',
              cell: (value: string) => (
                <div className="font-medium">
                  {value.substring(0, 12)}...
                  {value && value.split('_').length > 1 && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
                      {value.split('_')[0]}
                    </span>
                  )}
                </div>
              )
            },
            {
              accessorKey: 'first_visit',
              header: 'First Visit',
              cell: (value: string) => (
                <div>
                  {value ? format(new Date(value), 'MMM d, yyyy HH:mm') : '-'}
                </div>
              )
            },
            {
              accessorKey: 'total_sessions',
              header: 'Sessions',
              className: 'text-right',
              cell: (value: number) => value || 0
            },
            {
              accessorKey: 'total_pageviews',
              header: 'Pageviews',
              className: 'text-right',
              cell: (value: number) => value || 0
            },
            {
              accessorKey: 'device',
              header: 'Device',
              cell: (value: string) => value || 'Unknown'
            },
            {
              accessorKey: 'browser',
              header: 'Browser',
              cell: (value: string) => value || 'Unknown'
            },
            {
              accessorKey: 'total_duration_formatted',
              header: 'Total Time',
              className: 'text-right',
              cell: (value: string) => value || '0s'
            }
          ]}
          title="Visitor Profiles"
          description="Detailed visitor information grouped by unique ID"
          isLoading={isLoadingProfiles}
          emptyMessage="No visitor data available for the selected period"
          onRowClick={(row: { visitor_id: string }) => handleProfileRowClick(row.visitor_id)}
        />
      </div>
      
      {profilesData && (
        <div className="text-sm text-muted-foreground mt-2">
          Showing {profilesData.profiles.length} of {profilesData.total_visitors} visitors ({profilesData.returning_visitors} returning) in the selected period.
        </div>
      )}

      {/* Profile Details Dialog */}
      <Dialog open={!!selectedProfileId} onOpenChange={(open) => {
        if (!open) handleCloseProfileDialog();
      }}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Visitor Profile {selectedProfile?.visitor_id.substring(0, 12)}...
              {selectedProfile && selectedProfile.total_sessions > 1 && (
                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
                  Returning Visitor
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedProfile ? (
                <div className="grid grid-cols-2 gap-4 mt-2 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium">First visit:</span> {format(new Date(selectedProfile.first_visit), 'MMM d, yyyy HH:mm:ss')}
                  </div>
                  <div>
                    <span className="font-medium">Last visit:</span> {format(new Date(selectedProfile.last_visit), 'MMM d, yyyy HH:mm:ss')}
                  </div>
                  <div>
                    <span className="font-medium">Total sessions:</span> {selectedProfile.total_sessions}
                  </div>
                  <div>
                    <span className="font-medium">Total pages viewed:</span> {selectedProfile.total_pageviews}
                  </div>
                  <div>
                    <span className="font-medium">Device:</span> {selectedProfile.device || 'Unknown'}
                  </div>
                  <div>
                    <span className="font-medium">Browser:</span> {selectedProfile.browser || 'Unknown'}
                  </div>
                  <div>
                    <span className="font-medium">Country:</span> {selectedProfile.country || 'Unknown'}
                  </div>
                  <div>
                    <span className="font-medium">Total time spent:</span> {selectedProfile.total_duration_formatted}
                  </div>
                </div>
              ) : (
                <p>Loading profile information...</p>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Sessions</h3>
            {isLoadingProfiles ? (
              <div className="text-center py-8">Loading sessions...</div>
            ) : (
              <div className="rounded-lg border shadow-sm overflow-hidden">
                <DataTable
                  data={formattedProfileSessions}
                  columns={[
                    {
                      accessorKey: 'name',
                      header: 'Session',
                      cell: (value: string) => <div className="font-medium">{value}</div>
                    },
                    {
                      accessorKey: 'time',
                      header: 'Time'
                    },
                    {
                      accessorKey: 'pages',
                      header: 'Pages',
                      className: 'text-right'
                    },
                    {
                      accessorKey: 'duration',
                      header: 'Duration',
                      className: 'text-right'
                    }
                  ]}
                  title="Session History"
                  description="This visitor's sessions in chronological order"
                  isLoading={isLoadingProfiles}
                  emptyMessage="No sessions recorded for this visitor"
                  onRowClick={(row: { id: string }) => handleSessionRowClick(row.id)}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 