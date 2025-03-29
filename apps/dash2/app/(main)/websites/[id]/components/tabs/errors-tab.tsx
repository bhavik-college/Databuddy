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
  ExternalLink
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { useWebsiteErrors } from "@/hooks/use-analytics";
import { DateRange, ErrorDetail } from "@/hooks/use-analytics";

// Define the component props type
interface WebsiteErrorsTabProps {
  websiteId: string;
  dateRange: DateRange & { granularity?: 'daily' | 'hourly' };
  isRefreshing: boolean;
  setIsRefreshing: (value: boolean) => void;
}

export function WebsiteErrorsTab({
  websiteId,
  dateRange,
  isRefreshing,
  setIsRefreshing
}: WebsiteErrorsTabProps) {
  // State for errors tab
  const [errorPage, setErrorPage] = useState<number>(1);
  const [selectedError, setSelectedError] = useState<ErrorDetail | null>(null);
  const [visibleErrorMetrics, setVisibleErrorMetrics] = useState<Record<string, boolean>>({
    all: true
  });

  // Fetch errors data
  const { 
    data: errorsData, 
    isLoading: isLoadingErrors,
    refetch: errorsRefetch 
  } = useWebsiteErrors(
    websiteId, 
    { start_date: dateRange.start_date, end_date: dateRange.end_date },
    50,
    errorPage
  );

  // Handler for toggling error metrics visibility
  const toggleErrorMetric = useCallback((metric: string) => {
    setVisibleErrorMetrics(prev => ({
      ...prev,
      [metric]: !prev[metric]
    }));
  }, []);

  // Prepare data for the error chart
  const errorChartData = useMemo(() => {
    if (!errorsData?.errors_over_time?.length) return [];
    
    return errorsData.errors_over_time.map(dataPoint => {
      // Create a filtered object with only the visible metrics
      const filtered: any = {
        date: dataPoint.date,
      };
      
      // Add visible metrics
      Object.keys(dataPoint).forEach(key => {
        if (key !== 'date' && visibleErrorMetrics[key]) {
          filtered[key] = dataPoint[key];
        }
      });
      
      // Format the date
      const date = new Date(dataPoint.date);
      filtered.date = format(date, 'MMM d');
      
      return filtered;
    });
  }, [errorsData?.errors_over_time, visibleErrorMetrics]);

  // Handle refresh
  useEffect(() => {
    if (isRefreshing) {
      errorsRefetch()
        .then(() => {
          // Success will be handled by the parent component
        })
        .catch(() => {
          toast.error("Failed to refresh error data");
        })
        .finally(() => {
          // Finalization will be handled by the parent component
        });
    }
  }, [isRefreshing, errorsRefetch]);

  return (
    <div className="pt-2 space-y-3">
      <h2 className="text-lg font-semibold mb-2">Error Tracking</h2>
      
      {isLoadingErrors ? (
        <div className="space-y-3">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
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
                          <div className={`w-3 h-3 rounded-full bg-red-${300 + (index * 100)}`}></div>
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
                    errorsData.error_types.map((error, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium whitespace-nowrap">
                          <span className="flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                            {error.error_type}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-[300px] truncate">
                          {error.error_message}
                        </TableCell>
                        <TableCell className="text-right">{error.count}</TableCell>
                        <TableCell className="text-right">{error.unique_users}</TableCell>
                        <TableCell>{error.last_occurrence ? format(new Date(error.last_occurrence), 'MMM d, yyyy HH:mm:ss') : '-'}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        No errors recorded in the selected time period
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          
          {/* Error details with pagination */}
          <div className="rounded-lg border shadow-sm overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h3 className="text-base font-medium">Recent Error Details</h3>
                <p className="text-sm text-muted-foreground">
                  Detailed error information to help with debugging
                </p>
              </div>
              
              {/* Pagination UI */}
              {errorsData.total_pages > 1 && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setErrorPage(Math.max(1, errorPage - 1))}
                    disabled={errorPage === 1 || isLoadingErrors}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground mx-2">
                    Page {errorPage} of {errorsData.total_pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setErrorPage(Math.min(errorsData.total_pages, errorPage + 1))}
                    disabled={errorPage === errorsData.total_pages || isLoadingErrors}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Error Type</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead className="w-[50px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {errorsData.recent_errors && errorsData.recent_errors.length > 0 ? (
                    errorsData.recent_errors.map((error, index) => (
                      <TableRow key={index} className="group cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-medium whitespace-nowrap">
                          <span className="flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                            {error.error_type}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-[250px] truncate">
                          {error.error_message}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          <a 
                            href={error.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {error.path}
                            <ExternalLink className="h-3 w-3 opacity-70" />
                          </a>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(error.time), 'MMM d, yyyy HH:mm:ss')}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {`${error.browser} / ${error.os}`}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 invisible group-hover:visible"
                            onClick={() => setSelectedError(error)}
                          >
                            <Code className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        No detailed error data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination controls at bottom */}
            {errorsData.total_pages > 1 && (
              <div className="p-2 border-t flex items-center justify-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => setErrorPage(1)}
                  disabled={errorPage === 1 || isLoadingErrors}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <ChevronLeft className="h-3.5 w-3.5 -ml-2" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => setErrorPage(Math.max(1, errorPage - 1))}
                  disabled={errorPage === 1 || isLoadingErrors}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, errorsData.total_pages) }, (_, i) => {
                  // Calculate visible page numbers with current page in the middle
                  let pageNum;
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
                      className="h-7 w-7 p-0"
                      onClick={() => setErrorPage(pageNum)}
                      disabled={isLoadingErrors}
                    >
                      <span className="text-xs">{pageNum}</span>
                    </Button>
                  );
                })}
                
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => setErrorPage(Math.min(errorsData.total_pages, errorPage + 1))}
                  disabled={errorPage === errorsData.total_pages || isLoadingErrors}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => setErrorPage(errorsData.total_pages)}
                  disabled={errorPage === errorsData.total_pages || isLoadingErrors}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                  <ChevronRight className="h-3.5 w-3.5 -ml-2" />
                </Button>
              </div>
            )}
          </div>
          
          {/* Total error count */}
          <div className="text-sm text-muted-foreground">
            Showing {errorsData.recent_errors?.length || 0} of {errorsData.total_errors || 0} errors
          </div>
        </>
      ) : (
        <div className="rounded-lg border shadow-sm overflow-hidden p-6 flex flex-col items-center justify-center">
          <div className="text-amber-500 mb-3">
            <AlertTriangle className="h-12 w-12" />
          </div>
          <h3 className="text-lg font-medium mb-1">Error data unavailable</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md mb-3">
            There was an issue retrieving error data. Try refreshing the page or try again later.
          </p>
          <Button onClick={() => errorsRefetch()} variant="outline" size="sm">
            <RefreshCw className="h-3.5 w-3.5 mr-2" /> Retry
          </Button>
        </div>
      )}

      {/* Error Detail Dialog */}
      <Dialog open={!!selectedError} onOpenChange={(open) => {
        if (!open) setSelectedError(null);
      }}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                {selectedError?.error_type || 'Error Details'}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2">
                {selectedError?.time && format(new Date(selectedError.time), 'MMM d, yyyy HH:mm:ss')}
                
                {/* Always render these spans but conditionally apply visibility */}
                <span className={`ml-3 flex items-center gap-1 text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded-full ${!(selectedError?.count && selectedError.count > 1) && 'hidden'}`}>
                  {selectedError?.count} occurrences
                </span>
                
                <span className={`ml-2 flex items-center gap-1 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full ${!(selectedError?.unique_users && selectedError.unique_users > 1) && 'hidden'}`}>
                  {selectedError?.unique_users} users affected
                </span>
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setSelectedError(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          
          <div className="mt-4 space-y-4">
            {/* Error overview */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">URL:</p>
                <a 
                  href={selectedError?.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  {selectedError?.url}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div>
                <p className="font-medium">Visitor ID:</p>
                <p>{selectedError?.visitor_id}</p>
              </div>
              <div>
                <p className="font-medium">Browser:</p>
                <p>{selectedError?.browser} / {selectedError?.os}</p>
              </div>
              <div>
                <p className="font-medium">Device:</p>
                <p>{selectedError?.device_type}</p>
              </div>
            </div>
            
            {/* Error message */}
            <div>
              <p className="font-medium mb-1">Error Message:</p>
              <div className="rounded-md bg-red-50 p-3 border border-red-200 text-red-800">
                {selectedError?.error_message}
              </div>
            </div>
            
            {/* Stack trace */}
            {selectedError?.stack_trace && (
              <div>
                <p className="font-medium mb-1">Stack Trace:</p>
                <pre className="rounded-md bg-gray-900 text-gray-100 p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                  {selectedError.stack_trace}
                </pre>
              </div>
            )}
          </div>
          
          <div className="mt-4 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (selectedError) {
                  navigator.clipboard.writeText(
                    `Error Type: ${selectedError.error_type}\n` +
                    `Message: ${selectedError.error_message}\n` +
                    `URL: ${selectedError.url}\n` +
                    `Time: ${selectedError.time}\n` +
                    `Stack Trace: ${selectedError.stack_trace || 'N/A'}`
                  );
                  toast("Error details copied to clipboard");
                }
              }}
            >
              Copy Details
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 