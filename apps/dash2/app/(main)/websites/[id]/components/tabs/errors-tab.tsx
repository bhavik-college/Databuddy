"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  Code,
  Bug,
  AlertCircle,
  AlertTriangle,
  X,
  ExternalLink,
  HelpCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { useWebsiteErrors } from "@/hooks/use-analytics";
import type { DateRange, ErrorDetail } from "@/hooks/use-analytics";
import { AnimatedLoading } from "@/components/analytics/animated-loading";
import { Card } from "@/components/ui/card";
import type { RefreshableTabProps } from "../utils/types";
import { EmptyState } from "../utils/ui-components";
import { StatCard } from "@/components/analytics/stat-card";

export function WebsiteErrorsTab({
  websiteId,
  dateRange,
  isRefreshing,
  setIsRefreshing
}: RefreshableTabProps) {
  // State for errors tab
  const [errorPage, setErrorPage] = useState<number>(1);
  const [selectedError, setSelectedError] = useState<ErrorDetail | null>(null);
  const [visibleErrorMetrics, setVisibleErrorMetrics] = useState<Record<string, boolean>>({
    all: true
  });
  const [loadingProgress, setLoadingProgress] = useState<number>(0);

  // Fetch errors data
  const { 
    data: errorsData, 
    isLoading: isLoadingErrors,
    error: errorsError,
    refetch: errorsRefetch 
  } = useWebsiteErrors(
    websiteId, 
    { start_date: dateRange.start_date, end_date: dateRange.end_date },
    50,
    errorPage
  );

  // Handle refresh
  useEffect(() => {
    let isMounted = true;
    
    if (isRefreshing) {
      const doRefresh = async () => {
        try {
          await errorsRefetch();
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
  }, [isRefreshing, errorsRefetch, setIsRefreshing]);

  // Combine loading states
  const isLoading = isLoadingErrors || isRefreshing;

  // Handler for toggling error metrics visibility
  const toggleErrorMetric = useCallback((metric: string) => {
    setVisibleErrorMetrics(prev => ({
      ...prev,
      [metric]: !prev[metric]
    }));
  }, []);

  // Memoize chart data
  const errorChartData = useMemo(() => {
    if (!errorsData?.errors_over_time) return [];
    
    return errorsData.errors_over_time.map(point => ({
      ...point,
      date: format(new Date(point.date), 'MMM d')
    }));
  }, [errorsData?.errors_over_time]);

  // Handle loading progress animation
  useEffect(() => {
    if (isLoadingErrors) {
      const intervals = [
        { target: 20, duration: 800 },
        { target: 45, duration: 1300 },
        { target: 70, duration: 1800 },
        { target: 90, duration: 2000 }
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
  }, [isLoadingErrors]);

  // Calculate summary stats for StatCards
  const totalErrorOccurrences = useMemo(() => {
    return errorsData?.error_types?.reduce((sum, type) => sum + type.count, 0) || 0;
  }, [errorsData?.error_types]);

  const uniqueErrorTypesCount = useMemo(() => {
    return errorsData?.error_types?.length || 0;
  }, [errorsData?.error_types]);

  // Only show error state when there's a real error with summary data and not loading
  if (errorsError && !isLoading) {
    return (
      <div className="pt-6">
        <EmptyState
          icon={<AlertCircle className="h-10 w-10" />}
          title="Error loading error data"
          description="Unable to load error metrics for this website."
          action={null}
        />
      </div>
    );
  }

  // Only show empty state when we're not loading and have no data
  if (!isLoading && (!errorsData?.error_types || errorsData.error_types.length === 0)) {
    return (
      <div className="pt-6">
        <EmptyState
          icon={<Bug className="h-10 w-10" />}
          title="No errors detected"
          description="We haven't detected any errors on your website during this time period."
          action={null}
        />
      </div>
    );
  }

  return (
    <div className="pt-2 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Error Tracking</h2>
        {/* Add refresh button or other controls here if needed later */}
      </div>
      
      {/* Summary StatCards */}
      {!isLoading && errorsData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          <StatCard
            title="Total Occurrences"
            value={totalErrorOccurrences.toLocaleString()}
            icon={AlertTriangle}
            isLoading={isLoading}
            variant="danger"
            description="Total count of all errors"
            className="shadow-sm"
          />
          <StatCard
            title="Unique Error Types"
            value={uniqueErrorTypesCount.toLocaleString()}
            icon={Bug}
            isLoading={isLoading}
            variant="default"
            description="Distinct types of errors recorded"
            className="shadow-sm"
          />
          {/* Placeholder for another potential stat, e.g., Users Affected */}
          {/* <StatCard title="Users Affected" value="-" icon={Users} isLoading={isLoading} /> */}
        </div>
      )}

      {isLoading && !errorsData ? (
        <AnimatedLoading type="errors" progress={loadingProgress} />
      ) : errorsData ? (
        <>
          {/* Error trends chart */}
          <div className="rounded-lg border shadow-sm overflow-hidden">
            <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-start gap-2">
              <div>
                <h3 className="text-base font-medium">Error Trends</h3>
                <p className="text-sm text-muted-foreground">
                  Error occurrence over time
                </p>
              </div>
              
              {/* Error type metrics toggles */}
              <div className="flex items-center gap-3 flex-wrap">
                {errorsData.errors_over_time && errorsData.errors_over_time.length > 0 && 
                  Object.keys(errorsData.errors_over_time[0] || {})
                    .filter(key => key !== 'date')
                    .map((errorType, index) => (
                      <div key={errorType} className="flex items-center space-x-2">
                        <Checkbox
                          id={`error-${errorType}`} 
                          checked={visibleErrorMetrics[errorType] || false}
                          onCheckedChange={() => toggleErrorMetric(errorType)}
                          className={`data-[state=checked]:bg-red-${300 + (index * 100)} data-[state=checked]:text-white`}
                        />
                        <Label htmlFor={`error-${errorType}`} className="text-xs cursor-pointer flex items-center gap-1">
                          <div className={`w-3 h-3 rounded-full bg-red-${300 + (index * 100)}`} />
                          {errorType.charAt(0).toUpperCase() + errorType.slice(1).replace(/_/g, ' ')}
                        </Label>
                      </div>
                    ))
                }
              </div>
            </div>
            
            {errorsData.errors_over_time && errorsData.errors_over_time.length > 0 ? (
              <div className="p-1 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={errorChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date"
                      stroke="#9ca3af"
                      fontSize={12}
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis 
                      stroke="#9ca3af"
                      fontSize={12}
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb' }}
                      width={25}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.375rem',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                        fontSize: '0.75rem'
                      }}
                      formatter={(value: any, name: any) => [
                        value, 
                        name === 'date' ? 'Date' : name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' ')
                      ]}
                    />
                    <Legend 
                      formatter={(value: any) => typeof value === 'string' ? value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' ') : value}
                      verticalAlign="top"
                      height={36}
                      iconType="circle"
                      iconSize={8}
                      fontSize={12}
                    />
                    
                    {Object.keys(errorsData.errors_over_time[0] || {})
                      .filter(key => key !== 'date' && visibleErrorMetrics[key])
                      .map((key, index) => (
                        <Line 
                          key={key}
                          type="monotone" 
                          dataKey={key} 
                          stroke={`hsl(${(index * 30) + 0}, 70%, 50%)`}
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 6 }}
                        />
                      ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Bug className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>No error trend data available for the selected period</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Error types summary */}
          <div className="rounded-lg border shadow-sm overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="text-base font-medium">Error Types Summary</h3>
              <p className="text-sm text-muted-foreground">
                Most common errors affecting your website
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Error Type</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                    <TableHead className="text-right">Unique Users</TableHead>
                    <TableHead>Last Occurrence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {errorsData.error_types && errorsData.error_types.length > 0 ? (
                    errorsData.error_types.map((error) => (
                      <TableRow key={error.error_type}>
                        <TableCell className="font-medium">{error.error_type}</TableCell>
                        <TableCell className="max-w-[300px] truncate">{error.error_message}</TableCell>
                        <TableCell className="text-right">{error.count}</TableCell>
                        <TableCell className="text-right">{error.unique_users}</TableCell>
                        <TableCell>{format(new Date(error.last_occurrence), 'MMM d, yyyy HH:mm')}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No error data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          
          {/* Pagination */}
          {errorsData.total_pages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Page {errorPage} of {errorsData.total_pages}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setErrorPage(1)}
                  disabled={errorPage === 1 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <ChevronLeft className="h-4 w-4 -ml-2" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setErrorPage(Math.max(1, errorPage - 1))}
                  disabled={errorPage === 1 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, errorsData.total_pages) }, (_, i) => {
                  // Calculate visible page numbers with current page in the middle
                  let pageNum: number;
                  if (errorsData.total_pages <= 5) {
                    pageNum = i + 1;
                  } else {
                    const offset = Math.min(
                      Math.max(0, errorPage - 3),
                      Math.max(0, errorsData.total_pages - 5)
                    );
                    pageNum = i + 1 + offset;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === errorPage ? "default" : "outline"}
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setErrorPage(pageNum)}
                      disabled={isLoading}
                    >
                      <span className="text-xs">{pageNum}</span>
                    </Button>
                  );
                })}
                
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setErrorPage(Math.min(errorsData.total_pages, errorPage + 1))}
                  disabled={errorPage === errorsData.total_pages || isLoading}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setErrorPage(errorsData.total_pages)}
                  disabled={errorPage === errorsData.total_pages || isLoading}
                >
                  <ChevronRight className="h-4 w-4" />
                  <ChevronRight className="h-4 w-4 -ml-2" />
                </Button>
              </div>
            </div>
          )}
          
          {/* Total error count */}
          <div className="text-sm text-muted-foreground">
            Showing {errorsData.recent_errors?.length || 0} of {errorsData.total_errors || 0} errors
          </div>
        </>
      ) : (
        <div className="rounded-lg border shadow-sm p-8 text-center">
          <div className="flex flex-col items-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No error data</h3>
            <p className="text-muted-foreground mb-4">
              No error data is available for the selected time period.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setIsRefreshing(true);
                errorsRefetch()
                  .then(() => {
                    toast.success("Error data refreshed");
                  })
                  .catch(() => {
                    toast.error("Failed to refresh error data");
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

      {/* Error Detail Dialog */}
      <Dialog open={!!selectedError} onOpenChange={(open) => {
        if (!open) setSelectedError(null);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Error Details</DialogTitle>
            <DialogDescription>
              Detailed information about this error occurrence
            </DialogDescription>
          </DialogHeader>
          
          {selectedError && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Error Type</h4>
                  <p className="text-sm text-muted-foreground">{selectedError.error_type}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Time</h4>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedError.time), 'MMM d, yyyy HH:mm:ss')}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">URL</h4>
                  <p className="text-sm text-muted-foreground">{selectedError.url}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Path</h4>
                  <p className="text-sm text-muted-foreground">{selectedError.path}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Browser</h4>
                  <p className="text-sm text-muted-foreground">{selectedError.browser}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">OS</h4>
                  <p className="text-sm text-muted-foreground">{selectedError.os}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Device</h4>
                  <p className="text-sm text-muted-foreground">{selectedError.device_type}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Visitor ID</h4>
                  <p className="text-sm text-muted-foreground">{selectedError.visitor_id}</p>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Error Message</h4>
                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                  {selectedError.error_message}
                </p>
              </div>
              
              {selectedError.stack_trace && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Stack Trace</h4>
                  <pre className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md overflow-x-auto">
                    {selectedError.stack_trace}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 