"use client";

import { useParams } from "next/navigation";
import { useState, useMemo } from "react";
import { format, subDays } from "date-fns";
import { DateRange } from "react-day-picker";
import { 
  CalendarIcon, 
  Users, 
  Globe, 
  BarChart3, 
  Clock, 
  Smartphone, 
  Monitor,
  Filter,
  UserRound,
  ArrowUpRight,
  BarChart
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useAnalyticsProfiles, useAnalyticsSessions } from "@/hooks/use-analytics";
import { DataTable } from "@/components/analytics/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ErrorBoundary } from "@/components/error-boundary";

// Extended ProfileData interface with additional properties
interface ExtendedProfileData {
  visitor_id: string;
  sessions: number;
  pageviews: number;
  first_seen?: string;
  last_seen?: string;
  country?: string;
  city?: string;
  device_type?: string;
  browser?: string;
  [key: string]: any;
}

// Session data for profile's sessions view
interface ProfileSessionData {
  session_id: string;
  visitor_id: string;
  started_at?: string;
  duration?: number;
  pageviews?: number;
  device_type?: string;
  browser?: string;
  country?: string;
  city?: string;
  [key: string]: any;
}

export default function ProfilesPage() {
  const { id } = useParams();
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  
  // Convert selected date range to string format
  const dateRange = useMemo(() => ({
    start_date: date?.from ? format(date.from, 'yyyy-MM-dd') : format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end_date: date?.to ? format(date.to, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
  }), [date]);

  // Fetch profiles data
  const { data: profilesData, isLoading } = useAnalyticsProfiles(
    id as string, 
    dateRange
  );
  
  // Additional state
  const [activeTab, setActiveTab] = useState("all");
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  
  // Fetch sessions for the selected profile (if any)
  const { data: profileSessionsData, isLoading: isLoadingProfileSessions } = useAnalyticsSessions(
    id as string, 
    dateRange,
    100
  );

  // Filter sessions for the selected profile
  const filteredProfileSessions = useMemo(() => {
    if (!profileSessionsData?.sessions || !selectedProfileId) return [];
    return profileSessionsData.sessions.filter(
      session => session.visitor_id === selectedProfileId
    );
  }, [profileSessionsData?.sessions, selectedProfileId]);

  // Profiles table columns
  const profileColumns = useMemo(() => [
    {
      accessorKey: 'visitor_id',
      header: 'Visitor ID',
      cell: (value: string) => (
        <span className="font-mono text-xs truncate block max-w-[150px]" title={value}>
          {value || '-'}
        </span>
      )
    },
    {
      accessorKey: 'first_seen',
      header: 'First Seen',
      cell: (value: string) => {
        if (!value) return <span>-</span>;
        try {
          const date = new Date(value);
          return (
            <span className="whitespace-nowrap">
              {isNaN(date.getTime()) ? '-' : format(date, 'MMM d, yyyy')}
            </span>
          );
        } catch (error) {
          return <span>-</span>;
        }
      }
    },
    {
      accessorKey: 'last_seen',
      header: 'Last Seen',
      cell: (value: string) => {
        if (!value) return <span>-</span>;
        try {
          const date = new Date(value);
          return (
            <span className="whitespace-nowrap">
              {isNaN(date.getTime()) ? '-' : format(date, 'MMM d, yyyy')}
            </span>
          );
        } catch (error) {
          return <span>-</span>;
        }
      }
    },
    {
      accessorKey: 'sessions',
      header: 'Sessions',
      cell: (value: any) => {
        if (typeof value === 'object') return <span>-</span>;
        return <span className="text-right">{value || 0}</span>;
      },
      className: 'text-right',
    },
    {
      accessorKey: 'pageviews',
      header: 'Pageviews',
      cell: (value: any) => {
        if (typeof value === 'object') return <span>-</span>;
        return <span className="text-right">{value || 0}</span>;
      },
      className: 'text-right',
    },
    {
      accessorKey: 'country',
      header: 'Country',
      cell: (value: any) => {
        if (typeof value === 'object') return <span>-</span>;
        return <span>{value || 'Unknown'}</span>;
      }
    },
    {
      accessorKey: 'device_type',
      header: 'Device',
      cell: (value: any) => {
        if (typeof value === 'object') return <span>-</span>;
        return <span>{value || 'Unknown'}</span>;
      }
    },
  ], []);
  
  // Profile sessions table columns (for profile details)
  const profileSessionsColumns = useMemo(() => [
    {
      accessorKey: 'session_id',
      header: 'Session ID',
      cell: (value: string) => (
        <span className="font-mono text-xs truncate block max-w-[150px]" title={value}>
          {value || '-'}
        </span>
      )
    },
    {
      accessorKey: 'started_at',
      header: 'Date',
      cell: (value: string) => {
        if (!value) return <span>-</span>;
        try {
          const date = new Date(value);
          return (
            <span className="whitespace-nowrap">
              {isNaN(date.getTime()) ? '-' : format(date, 'MMM d, yyyy HH:mm')}
            </span>
          );
        } catch (error) {
          return <span>-</span>;
        }
      }
    },
    {
      accessorKey: 'duration',
      header: 'Duration',
      cell: (value: any) => {
        if (typeof value !== 'number') return <span>-</span>;
        return <span>{Math.floor(value / 60)}m {value % 60}s</span>;
      }
    },
    {
      accessorKey: 'pageviews',
      header: 'Pages',
      cell: (value: any) => {
        if (typeof value === 'object') return <span>-</span>;
        return <span className="text-right">{value || 0}</span>;
      },
      className: 'text-right',
    },
    {
      accessorKey: 'device_type',
      header: 'Device',
      cell: (value: any) => {
        if (typeof value === 'object') return <span>-</span>;
        return <span>{value || 'Unknown'}</span>;
      }
    },
    {
      accessorKey: 'browser',
      header: 'Browser',
      cell: (value: any) => {
        if (typeof value === 'object') return <span>-</span>;
        return <span>{value || 'Unknown'}</span>;
      }
    },
  ], []);

  // Filter profiles based on active tab
  const filteredProfiles = useMemo(() => {
    if (!profilesData?.profiles || activeTab === 'all') {
      return profilesData?.profiles || [];
    }
    
    // Cast to the extended type to access the properties safely
    const profiles = profilesData.profiles as unknown as ExtendedProfileData[];
    
    switch (activeTab) {
      case 'returning':
        return profiles.filter(profile => 
          (typeof profile.sessions === 'number' && profile.sessions > 1)
        );
      case 'new':
        return profiles.filter(profile => 
          (typeof profile.sessions === 'number' && profile.sessions === 1)
        );
      case 'active':
        return profiles.filter(profile => {
          // Consider profiles with more than 5 sessions or 20 pageviews as "active"
          return (
            (typeof profile.sessions === 'number' && profile.sessions > 5) || 
            (typeof profile.pageviews === 'number' && profile.pageviews > 20)
          );
        });
      default:
        return profiles;
    }
  }, [activeTab, profilesData?.profiles]);
  
  // Summary metrics
  const metrics = useMemo(() => {
    if (!profilesData?.profiles) return {
      total: 0,
      returning: 0,
      new: 0,
      active: 0,
      avgPageviews: 0
    };
    
    // Cast to the extended type to access the properties safely
    const profiles = profilesData.profiles as unknown as ExtendedProfileData[];
    
    const totalPageviews = profiles.reduce((sum, p) => {
      const pageviews = typeof p.pageviews === 'number' ? p.pageviews : 0;
      return sum + pageviews;
    }, 0);
    
    return {
      total: profiles.length,
      returning: profiles.filter(p => typeof p.sessions === 'number' && p.sessions > 1).length,
      new: profiles.filter(p => typeof p.sessions === 'number' && p.sessions === 1).length,
      active: profiles.filter(p => {
        return (
          (typeof p.sessions === 'number' && p.sessions > 5) ||
          (typeof p.pageviews === 'number' && p.pageviews > 20)
        );
      }).length,
      avgPageviews: profiles.length > 0 ? Math.round(totalPageviews / profiles.length) : 0
    };
  }, [profilesData?.profiles]);
  
  // Handle profile row click to show details
  const handleProfileRowClick = (visitorId: string) => {
    setSelectedProfileId(visitorId);
  };
  
  // Handle close profile details dialog
  const handleCloseProfileDialog = () => {
    setSelectedProfileId(null);
  };
  
  // Find the selected profile details
  const selectedProfile = useMemo(() => {
    if (!selectedProfileId || !profilesData?.profiles) return null;
    const profile = profilesData.profiles.find(p => p.visitor_id === selectedProfileId);
    return profile as unknown as ExtendedProfileData | null;
  }, [selectedProfileId, profilesData?.profiles]);

  return (
    <ErrorBoundary>
      <div className="p-6 space-y-6 bg-background">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">User Profiles</h1>
            <p className="text-muted-foreground text-sm mt-1">
              View visitor profiles and behavior data
            </p>
          </div>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="md:min-w-[240px] justify-start text-left font-normal shadow-sm">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "LLL dd, y")} -{" "}
                      {format(date.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(date.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 shadow-md" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="shadow-sm border overflow-hidden">
            <CardHeader className="pb-2 pt-5">
              <CardTitle className="text-sm font-medium flex items-center">
                <Users className="h-4 w-4 mr-2 text-primary" />
                Total Visitors
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                <div className="text-2xl font-bold">{metrics.total.toLocaleString()}</div>
              )}
            </CardContent>
          </Card>
          
          <Card className="shadow-sm border overflow-hidden">
            <CardHeader className="pb-2 pt-5">
              <CardTitle className="text-sm font-medium flex items-center">
                <UserRound className="h-4 w-4 mr-2 text-blue-500" />
                New Visitors
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                <div className="text-2xl font-bold">{metrics.new.toLocaleString()}</div>
              )}
            </CardContent>
          </Card>
          
          <Card className="shadow-sm border overflow-hidden">
            <CardHeader className="pb-2 pt-5">
              <CardTitle className="text-sm font-medium flex items-center">
                <ArrowUpRight className="h-4 w-4 mr-2 text-indigo-500" />
                Returning Visitors
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                <div className="text-2xl font-bold">{metrics.returning.toLocaleString()}</div>
              )}
            </CardContent>
          </Card>
          
          <Card className="shadow-sm border overflow-hidden">
            <CardHeader className="pb-2 pt-5">
              <CardTitle className="text-sm font-medium flex items-center">
                <BarChart className="h-4 w-4 mr-2 text-green-500" />
                Active Visitors
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                <div className="text-2xl font-bold">{metrics.active.toLocaleString()}</div>
              )}
            </CardContent>
          </Card>
          
          <Card className="shadow-sm border overflow-hidden">
            <CardHeader className="pb-2 pt-5">
              <CardTitle className="text-sm font-medium flex items-center">
                <BarChart3 className="h-4 w-4 mr-2 text-amber-500" />
                Avg. Pageviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                <div className="text-2xl font-bold">{metrics.avgPageviews.toLocaleString()}</div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Tabs */}
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full mt-8">
          <TabsList className="grid grid-cols-4 md:w-fit mb-4 rounded-lg p-1 shadow-sm">
            <TabsTrigger value="all" className="rounded-md">All Visitors</TabsTrigger>
            <TabsTrigger value="new" className="rounded-md">New</TabsTrigger>
            <TabsTrigger value="returning" className="rounded-md">Returning</TabsTrigger>
            <TabsTrigger value="active" className="rounded-md">Active</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-0">
            <Card className="border shadow-sm">
              <DataTable 
                columns={profileColumns}
                data={filteredProfiles}
                isLoading={isLoading}
                title="All Visitors"
                limit={25}
                emptyMessage="No visitor data recorded yet"
                onRowClick={(row) => handleProfileRowClick(row.visitor_id)}
              />
            </Card>
          </TabsContent>
          
          <TabsContent value="new" className="mt-0">
            <Card className="border shadow-sm">
              <DataTable 
                columns={profileColumns}
                data={filteredProfiles}
                isLoading={isLoading}
                title="New Visitors"
                limit={25}
                emptyMessage="No new visitors recorded yet"
                onRowClick={(row) => handleProfileRowClick(row.visitor_id)}
              />
            </Card>
          </TabsContent>
          
          <TabsContent value="returning" className="mt-0">
            <Card className="border shadow-sm">
              <DataTable 
                columns={profileColumns}
                data={filteredProfiles}
                isLoading={isLoading}
                title="Returning Visitors"
                limit={25}
                emptyMessage="No returning visitors recorded yet"
                onRowClick={(row) => handleProfileRowClick(row.visitor_id)}
              />
            </Card>
          </TabsContent>
          
          <TabsContent value="active" className="mt-0">
            <Card className="border shadow-sm">
              <DataTable 
                columns={profileColumns}
                data={filteredProfiles}
                isLoading={isLoading}
                title="Active Visitors"
                limit={25}
                emptyMessage="No active visitors recorded yet"
                onRowClick={(row) => handleProfileRowClick(row.visitor_id)}
              />
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Profile Details Dialog */}
        <Dialog open={!!selectedProfileId} onOpenChange={handleCloseProfileDialog}>
          <DialogContent className="max-w-5xl p-0 overflow-hidden rounded-lg shadow-xl">
            <DialogHeader className="px-6 py-4 border-b sticky top-0 bg-background z-10">
              <DialogTitle className="text-xl">Visitor Profile</DialogTitle>
            </DialogHeader>
            
            {selectedProfile ? (
              <div className="px-6 py-5 space-y-8 max-h-[80vh] overflow-y-auto">
                {/* Profile Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Card className="border shadow-sm hover:shadow-md transition-all duration-200">
                    <CardHeader className="pb-2 pt-5 bg-muted/20">
                      <CardTitle className="text-sm font-medium">Visitor Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Visitor ID</p>
                        <div className="font-mono text-xs truncate px-2 py-1 bg-muted/30 rounded" title={selectedProfile.visitor_id}>
                          {selectedProfile.visitor_id}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">First Seen</p>
                          <div className="text-sm font-medium">
                            {selectedProfile.first_seen ? format(new Date(selectedProfile.first_seen), 'MMM d, yyyy') : '-'}
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Last Seen</p>
                          <div className="text-sm font-medium">
                            {selectedProfile.last_seen ? format(new Date(selectedProfile.last_seen), 'MMM d, yyyy') : '-'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1 bg-primary/5 p-3 rounded-lg">
                          <p className="text-xs text-muted-foreground">Total Sessions</p>
                          <div className="text-2xl font-bold">{selectedProfile.sessions}</div>
                        </div>
                        
                        <div className="space-y-1 bg-indigo-500/5 p-3 rounded-lg">
                          <p className="text-xs text-muted-foreground">Pageviews</p>
                          <div className="text-2xl font-bold">{selectedProfile.pageviews}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border shadow-sm hover:shadow-md transition-all duration-200">
                    <CardHeader className="pb-2 pt-5 bg-muted/20">
                      <CardTitle className="text-sm font-medium">Location & Device</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-4">
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Location</p>
                        <div className="flex items-center gap-2 bg-muted/20 p-3 rounded-lg">
                          <Globe className="h-5 w-5 text-green-500" />
                          <div className="text-sm">
                            <div className="font-medium">{selectedProfile.country || 'Unknown'}</div>
                            <span className="text-muted-foreground text-xs">{selectedProfile.city || 'Unknown location'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Device</p>
                        <div className="flex items-center gap-3 bg-muted/20 p-3 rounded-lg">
                          {selectedProfile.device_type?.toLowerCase().includes('mobile') ? (
                            <Smartphone className="h-5 w-5 text-indigo-500" />
                          ) : (
                            <Monitor className="h-5 w-5 text-blue-500" />
                          )}
                          <div>
                            <div className="text-sm font-medium">{selectedProfile.device_type || 'Unknown device'}</div>
                            <span className="text-muted-foreground text-xs">{selectedProfile.browser || 'Unknown browser'}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Sessions */}
                <div>
                  <h3 className="text-lg font-medium mb-4 pl-1">Visitor Sessions</h3>
                  <Card className="border shadow-sm">
                    <DataTable 
                      columns={profileSessionsColumns}
                      data={filteredProfileSessions}
                      isLoading={isLoadingProfileSessions}
                      title="Recent Sessions"
                      limit={10}
                      emptyMessage="No sessions recorded for this visitor"
                    />
                  </Card>
                </div>
              </div>
            ) : (
              <div className="py-12 flex justify-center">
                <Skeleton className="h-[400px] w-full max-w-3xl rounded-lg" />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ErrorBoundary>
  );
} 