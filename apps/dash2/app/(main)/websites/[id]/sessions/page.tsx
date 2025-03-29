"use client";

import { useParams } from "next/navigation";
import { useState, useMemo } from "react";
import { format, subDays } from "date-fns";
import { DateRange } from "react-day-picker";
import { 
  CalendarIcon, 
  Clock, 
  Globe, 
  Smartphone, 
  Monitor, 
  BarChart3,
  Users,
  MousePointerClick,
  LayoutDashboard
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useAnalyticsSessions, useAnalyticsSessionDetails } from "@/hooks/use-analytics";
import { DataTable } from "@/components/analytics/data-table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBoundary } from "@/components/error-boundary";

// Add interface definitions for session data types
interface SessionData {
  session_id: string;
  visitor_id: string;
  started_at: string;
  duration: number;
  pageviews: number;
  country?: string;
  city?: string;
  device_type?: string;
  browser?: string;
  os?: string;
  is_returning_visitor?: boolean;
  [key: string]: any;
}

interface SessionEventData {
  event_id: string;
  time: string;
  event_name: string;
  path: string;
  title?: string;
  time_on_page?: number;
  device_type?: string;
  browser?: string;
  os?: string;
  [key: string]: any;
}

interface SessionWithEvents extends SessionData {
  events: SessionEventData[];
}

export default function SessionsPage() {
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

  // Session details dialog state
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  
  // Fetch sessions data
  const { data: sessionsData, isLoading } = useAnalyticsSessions(
    id as string, 
    dateRange,
    100
  );
  
  // Fetch session details when a session is selected
  const { data: sessionDetails, isLoading: isLoadingSessionDetails } = useAnalyticsSessionDetails(
    id as string,
    selectedSessionId || '',
    !!selectedSessionId
  );

  // Session table columns
  const sessionColumns = useMemo(() => [
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
      accessorKey: 'visitor_id',
      header: 'Visitor ID',
      cell: (value: string) => (
        <span className="font-mono text-xs truncate block max-w-[150px]" title={value}>
          {value || '-'}
        </span>
      )
    },
    {
      accessorKey: 'started_at',
      header: 'Started',
      cell: (value: string) => {
        if (!value) return <span>-</span>;
        try {
          const date = new Date(value);
          return (
            <span className="whitespace-nowrap">
              {isNaN(date.getTime()) ? '-' : format(date, 'MMM d, yyyy HH:mm:ss')}
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
    {
      accessorKey: 'browser',
      header: 'Browser',
      cell: (value: any) => {
        if (typeof value === 'object') return <span>-</span>;
        return <span>{value || 'Unknown'}</span>;
      }
    },
  ], []);

  // Session events table columns (for session details)
  const sessionEventsColumns = useMemo(() => [
    {
      accessorKey: 'time',
      header: 'Time',
      cell: (value: string) => (
        <span className="whitespace-nowrap font-mono text-xs">
          {value}
        </span>
      )
    },
    {
      accessorKey: 'event',
      header: 'Event',
      cell: (value: string) => (
        <span className="font-medium">
          {value}
        </span>
      )
    },
    {
      accessorKey: 'path',
      header: 'Path',
      cell: (value: string) => (
        <span className="truncate block max-w-[200px]" title={value}>
          {value || '/'}
        </span>
      )
    },
    {
      accessorKey: 'title',
      header: 'Page Title',
      cell: (value: string) => (
        <span className="truncate block max-w-[200px]" title={value}>
          {value || '-'}
        </span>
      )
    },
    {
      accessorKey: 'time_on_page',
      header: 'Time on Page',
      cell: (value: string) => (
        <span>
          {value || '-'}
        </span>
      )
    },
  ], []);

  // Filter sessions based on active tab
  const filteredSessions = useMemo(() => {
    if (!sessionsData?.sessions || activeTab === 'all') {
      return sessionsData?.sessions || [];
    }
    
    // Cast to the defined SessionData type to access properties safely
    const sessions = sessionsData.sessions as unknown as SessionData[];
    
    switch (activeTab) {
      case 'desktop':
        return sessions.filter(session => 
          session.device_type?.toLowerCase() === 'desktop' || 
          session.device_type?.toLowerCase() === 'laptop'
        );
      case 'mobile':
        return sessions.filter(session => 
          session.device_type?.toLowerCase() === 'mobile' || 
          session.device_type?.toLowerCase() === 'tablet'
        );
      case 'returning':
        return sessions.filter(session => 
          session.is_returning_visitor === true
        );
      default:
        return sessions;
    }
  }, [activeTab, sessionsData?.sessions]);
  
  // Summary metrics
  const metrics = useMemo(() => {
    if (!sessionsData?.sessions) return {
      total: 0,
      desktop: 0,
      mobile: 0,
      returning: 0,
      avgDuration: 0
    };
    
    // Cast to the defined SessionData type to access properties safely
    const sessions = sessionsData.sessions as unknown as SessionData[];
    const totalDuration = sessions.reduce((sum, s) => sum + (typeof s.duration === 'number' ? s.duration : 0), 0);
    
    return {
      total: sessions.length,
      desktop: sessions.filter(s => s.device_type?.toLowerCase() === 'desktop' || s.device_type?.toLowerCase() === 'laptop').length,
      mobile: sessions.filter(s => s.device_type?.toLowerCase() === 'mobile' || s.device_type?.toLowerCase() === 'tablet').length,
      returning: sessions.filter(s => s.is_returning_visitor === true).length,
      avgDuration: sessions.length > 0 ? Math.round(totalDuration / sessions.length) : 0
    };
  }, [sessionsData?.sessions]);
  
  const handleSessionRowClick = (sessionId: string) => {
    setSelectedSessionId(sessionId);
  };

  const handleCloseSessionDialog = () => {
    setSelectedSessionId(null);
  };

  // Format session events for display in details dialog
  const formattedEvents = useMemo(() => {
    if (!sessionDetails?.session?.events) return [];
    
    return sessionDetails.session.events.map(event => ({
      id: event.event_id,
      time: event.time ? format(new Date(event.time), 'HH:mm:ss') : '-',
      event: event.event_name,
      path: event.path,
      title: event.title || '-',
      time_on_page: event.time_on_page ? `${Math.round(event.time_on_page)}s` : '-',
      device_info: [event.browser, event.os, event.device_type]
        .filter(Boolean)
        .join(' / ') || 'Unknown'
    }));
  }, [sessionDetails]);

  return (
    <ErrorBoundary>
      <div className="p-6 space-y-6 bg-background">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Sessions</h1>
            <p className="text-muted-foreground text-sm mt-1">
              View detailed session data for your website
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
                <LayoutDashboard className="h-4 w-4 mr-2 text-primary" />
                Total Sessions
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
                <Monitor className="h-4 w-4 mr-2 text-blue-500" />
                Desktop Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                <div className="text-2xl font-bold">{metrics.desktop.toLocaleString()}</div>
              )}
            </CardContent>
          </Card>
          
          <Card className="shadow-sm border overflow-hidden">
            <CardHeader className="pb-2 pt-5">
              <CardTitle className="text-sm font-medium flex items-center">
                <Smartphone className="h-4 w-4 mr-2 text-indigo-500" />
                Mobile Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                <div className="text-2xl font-bold">{metrics.mobile.toLocaleString()}</div>
              )}
            </CardContent>
          </Card>
          
          <Card className="shadow-sm border overflow-hidden">
            <CardHeader className="pb-2 pt-5">
              <CardTitle className="text-sm font-medium flex items-center">
                <Users className="h-4 w-4 mr-2 text-green-500" />
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
                <Clock className="h-4 w-4 mr-2 text-amber-500" />
                Avg. Duration
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {Math.floor(metrics.avgDuration / 60)}m {metrics.avgDuration % 60}s
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Tabs */}
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full mt-8">
          <TabsList className="grid grid-cols-4 md:w-fit mb-4 rounded-lg p-1 shadow-sm">
            <TabsTrigger value="all" className="rounded-md">All Sessions</TabsTrigger>
            <TabsTrigger value="desktop" className="rounded-md">Desktop</TabsTrigger>
            <TabsTrigger value="mobile" className="rounded-md">Mobile</TabsTrigger>
            <TabsTrigger value="returning" className="rounded-md">Returning</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-0">
            <Card className="border shadow-sm">
              <DataTable 
                columns={sessionColumns}
                data={filteredSessions}
                isLoading={isLoading}
                onRowClick={(row) => handleSessionRowClick(row.session_id)}
                title="All Sessions"
                limit={25}
                emptyMessage="No sessions recorded yet"
              />
            </Card>
          </TabsContent>
          
          <TabsContent value="desktop" className="mt-0">
            <Card className="border shadow-sm">
              <DataTable 
                columns={sessionColumns}
                data={filteredSessions}
                isLoading={isLoading}
                onRowClick={(row) => handleSessionRowClick(row.session_id)}
                title="Desktop Sessions"
                limit={25}
                emptyMessage="No desktop sessions recorded yet"
              />
            </Card>
          </TabsContent>
          
          <TabsContent value="mobile" className="mt-0">
            <Card className="border shadow-sm">
              <DataTable 
                columns={sessionColumns}
                data={filteredSessions}
                isLoading={isLoading}
                onRowClick={(row) => handleSessionRowClick(row.session_id)}
                title="Mobile Sessions"
                limit={25}
                emptyMessage="No mobile sessions recorded yet"
              />
            </Card>
          </TabsContent>
          
          <TabsContent value="returning" className="mt-0">
            <Card className="border shadow-sm">
              <DataTable 
                columns={sessionColumns}
                data={filteredSessions}
                isLoading={isLoading}
                onRowClick={(row) => handleSessionRowClick(row.session_id)}
                title="Returning Visitor Sessions"
                limit={25}
                emptyMessage="No returning visitor sessions recorded yet"
              />
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Session Details Dialog */}
        <Dialog open={!!selectedSessionId} onOpenChange={handleCloseSessionDialog}>
          <DialogContent className="max-w-5xl p-0 overflow-hidden rounded-lg shadow-xl">
            <DialogHeader className="px-6 py-4 border-b sticky top-0 bg-background z-10">
              <DialogTitle className="text-xl">Session Details</DialogTitle>
            </DialogHeader>
            
            {isLoadingSessionDetails ? (
              <div className="space-y-4 p-6">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : sessionDetails?.session ? (
              <div className="px-6 py-5 space-y-8 max-h-[80vh] overflow-y-auto">
                {/* Session Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <Card className="border shadow-sm hover:shadow-md transition-all duration-200">
                    <CardHeader className="pb-2 pt-5 bg-muted/20">
                      <CardTitle className="text-sm font-medium">Visitor</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm pt-4">
                      <div className="font-mono truncate text-xs" title={sessionDetails.session.visitor_id}>
                        ID: {sessionDetails.session.visitor_id}
                      </div>
                      <div className="flex items-center gap-1.5 mt-3">
                        <span className={cn(
                          "h-2.5 w-2.5 rounded-full",
                          sessionDetails.session.is_returning_visitor ? "bg-green-500" : "bg-blue-500"
                        )} />
                        <span className="text-sm">{sessionDetails.session.is_returning_visitor ? "Returning" : "New"} visitor</span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border shadow-sm hover:shadow-md transition-all duration-200">
                    <CardHeader className="pb-2 pt-5 bg-muted/20">
                      <CardTitle className="text-sm font-medium">Device</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2 pt-4">
                      <div className="flex items-center gap-2">
                        {/* Cast session to SessionWithEvents type to access device_type safely */}
                        {(sessionDetails.session as unknown as SessionWithEvents).device_type?.toLowerCase() === 'mobile' ? (
                          <Smartphone className="h-4 w-4 text-indigo-500" />
                        ) : (
                          <Monitor className="h-4 w-4 text-blue-500" />
                        )}
                        <span>{(sessionDetails.session as unknown as SessionWithEvents).device_type || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Browser:</span>
                        <span>{sessionDetails.session.browser || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">OS:</span>
                        <span>{sessionDetails.session.os || 'Unknown'}</span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border shadow-sm hover:shadow-md transition-all duration-200">
                    <CardHeader className="pb-2 pt-5 bg-muted/20">
                      <CardTitle className="text-sm font-medium">Location</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2 pt-4">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-green-500" />
                        <span>{sessionDetails.session.country || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-2 pl-6">
                        <span>{sessionDetails.session.city || 'Unknown location'}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Session Events */}
                <div>
                  <h3 className="text-lg font-medium mb-4 pl-1">Session Timeline</h3>
                  <Card className="border shadow-sm">
                    <DataTable 
                      columns={sessionEventsColumns}
                      data={formattedEvents}
                      title="Page Views & Events"
                      emptyMessage="No events recorded for this session"
                    />
                  </Card>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <p>Session details not available</p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ErrorBoundary>
  );
} 