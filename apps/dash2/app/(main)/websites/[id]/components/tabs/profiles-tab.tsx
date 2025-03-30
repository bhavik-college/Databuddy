"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

import { DataTable } from "@/components/analytics/data-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAnalyticsProfiles } from "@/hooks/use-analytics";
import { DateRange } from "@/hooks/use-analytics";
import { AnimatedLoading } from "@/components/analytics/animated-loading";
import { RefreshCw, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  
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

  // Simulate loading progress
  useEffect(() => {
    if (isLoadingProfiles) {
      const intervals = [
        { target: 25, duration: 800 },
        { target: 50, duration: 1500 },
        { target: 75, duration: 2000 },
        { target: 90, duration: 1800 }
      ];
      
      let cleanup: NodeJS.Timeout[] = [];
      
      intervals.forEach((interval, index) => {
        const timeout = setTimeout(() => {
          setLoadingProgress(interval.target);
        }, interval.duration * (index === 0 ? 1 : index));
        
        cleanup.push(timeout);
      });
      
      return () => {
        cleanup.forEach(timeout => clearTimeout(timeout));
      };
    } else {
      // Reset progress when loading is complete
      setLoadingProgress(100);
      
      // After animation completes, reset to 0
      const timeout = setTimeout(() => {
        setLoadingProgress(0);
      }, 1000);
      
      return () => clearTimeout(timeout);
    }
  }, [isLoadingProfiles]);

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
      
      {isLoadingProfiles ? (
        <AnimatedLoading type="profiles" progress={loadingProgress} />
      ) : profilesData && profilesData.profiles.length > 0 ? (
        <>
          <div className="rounded-lg border shadow-sm overflow-hidden">
            <DataTable
              data={profilesData?.profiles || []}
              columns={[
                {
                  accessorKey: 'visitor_id',
                  header: 'Visitor ID',
                  cell: (value: string) => <div className="font-mono text-xs">{value.substring(0, 8)}...</div>
                },
                {
                  accessorKey: 'last_visit',
                  header: 'Last Visit',
                  cell: (value: string) => format(new Date(value), 'MMM d, yyyy HH:mm')
                },
                {
                  accessorKey: 'total_sessions',
                  header: 'Sessions',
                  className: 'text-right'
                },
                {
                  accessorKey: 'total_pageviews',
                  header: 'Pageviews',
                  className: 'text-right'
                },
                {
                  accessorKey: 'country',
                  header: 'Country',
                  cell: (value: string) => value || '-'
                },
                {
                  accessorKey: 'device',
                  header: 'Device',
                  cell: (value: string) => value || '-'
                },
                {
                  accessorKey: 'total_duration_formatted',
                  header: 'Time Spent',
                  className: 'text-right'
                }
              ]}
              title="Visitor Profiles"
              description="Overview of visitors to your website"
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
        </>
      ) : (
        <div className="rounded-lg border shadow-sm p-8 text-center">
          <div className="flex flex-col items-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No visitor profiles</h3>
            <p className="text-muted-foreground mb-4">
              No visitor profile data is available for the selected time period.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setIsRefreshing(true);
                profilesRefetch()
                  .then(() => {
                    toast.success("Profile data refreshed");
                  })
                  .catch(() => {
                    toast.error("Failed to refresh profile data");
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