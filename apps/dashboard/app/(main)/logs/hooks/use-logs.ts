import {
  type UseMutationOptions,
  type UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { usePreferences } from "../../../../hooks/use-preferences";

// Log Event Types
export interface LogEvent {
  id: string;
  timestamp: string;
  level: "debug" | "info" | "warn" | "error";
  message: string;
  service_name?: string;
  service_version?: string;
  environment?: string;
  platform?: string;
  release?: string;
  hostname?: string;
  client_id: string;
  request_id?: string;
  user_id?: string;
  session_id?: string;
  trace_id?: string;
  span_id?: string;
  filename?: string;
  function_name?: string;
  line_number?: number;
  thread_id?: string;
  process_id?: string;
  tags?: string[];
  labels?: Record<string, string>;
  metadata?: Record<string, any>;
  error_type?: string;
  error_code?: string;
  error_message?: string;
  stack_trace?: string;
  duration_ms?: number;
  memory_usage?: number;
  cpu_usage?: number;
  ip?: string;
  user_agent?: string;
}

// API Request Types
export interface LogsQueryParams {
  client_id?: string;
  page?: number;
  limit?: number;
  levels?: string[];
  services?: string[];
  platforms?: string[];
  environments?: string[];
  search?: string;
  error_types?: string[];
  request_id?: string;
  user_id?: string;
  session_id?: string;
  trace_id?: string;
  start_time?: string;
  end_time?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  fields?: string[];
}

export interface LogsStatsParams {
  client_id?: string;
  start_time?: string;
  end_time?: string;
  group_by?: "level" | "service" | "platform" | "error_type" | "hour" | "day";
}

export interface LogsErrorsParams {
  client_id?: string;
  start_time?: string;
  end_time?: string;
  limit?: number;
}

// API Response Types
export interface LogsQueryResponse {
  logs: LogEvent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    client_id?: string;
    levels: string[];
    services: string[];
    platforms: string[];
    environments: string[];
    search?: string;
    error_types: string[];
    time_range: {
      start: Date;
      end: Date;
    };
  };
}

export interface LogsStatsResponse {
  stats: LogStatsData[];
  group_by: string;
  time_range: {
    start: Date;
    end: Date;
  };
  total_groups: number;
}

export interface LogsErrorsResponse {
  errors: LogErrorData[];
  time_range: {
    start: Date;
    end: Date;
  };
}

export interface LogHealthResponse {
  status: "healthy" | "unhealthy";
  timestamp: string;
  stats?: {
    total_logs: number;
    latest_log: string | null;
    unique_clients: number;
  };
  error?: string;
}

// Data Types for Stats
export interface LogStatsData {
  time_bucket?: string;
  group_key?: string;
  log_count: number;
  error_count?: number;
  warn_count?: number;
  info_count?: number;
  debug_count?: number;
  avg_duration?: number;
  max_duration?: number;
  unique_sessions?: number;
  unique_users?: number;
}

export interface LogErrorData {
  error_type: string;
  error_code?: string;
  message: string;
  frequency: number;
  latest_occurrence: string;
  first_occurrence: string;
}

// Ingestion Types
export interface LogIngestData {
  level: string;
  message: string;
  service_name?: string;
  service_version?: string;
  environment?: string;
  platform?: string;
  release?: string;
  hostname?: string;
  client_id: string;
  timestamp?: string;
  request_id?: string;
  user_id?: string;
  session_id?: string;
  trace_id?: string;
  span_id?: string;
  filename?: string;
  function_name?: string;
  line_number?: number;
  thread_id?: string;
  process_id?: string;
  tags?: string[];
  labels?: Record<string, string>;
  metadata?: Record<string, any>;
  error_type?: string;
  error_code?: string;
  error_message?: string;
  stack_trace?: string;
  duration_ms?: number;
  memory_usage?: number;
  cpu_usage?: number;
  ip?: string;
  user_agent?: string;
}

export interface BulkLogIngestData {
  logs: LogIngestData[];
}

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001";
const BASKET_URL = process.env.NEXT_PUBLIC_BASKET_URL || "http://localhost:4001";

// Common query options
const defaultQueryOptions = {
  staleTime: 2 * 60 * 1000, // 2 minutes for logs (fresher than analytics)
  gcTime: 10 * 60 * 1000, // 10 minutes
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchInterval: 30 * 1000, // Refresh every 30 seconds for logs
  retry: (failureCount: number, error: Error) => {
    if (error instanceof DOMException && error.name === "AbortError") {
      return false;
    }
    return failureCount < 2;
  },
  networkMode: "online" as const,
  refetchIntervalInBackground: false,
};

/**
 * Hook to get the user's effective timezone
 */
function useUserTimezone(): string {
  const { preferences } = usePreferences();

  // Get browser timezone as fallback
  const browserTimezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return "UTC";
    }
  }, []);

  // Return user's preferred timezone or browser timezone if 'auto'
  if (!preferences) return browserTimezone;

  return preferences.timezone === "auto" ? browserTimezone : preferences.timezone;
}

// Base params builder
function buildLogsParams(params?: LogsQueryParams): URLSearchParams {
  const urlParams = new URLSearchParams();

  if (!params) return urlParams;

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        urlParams.append(key, value.join(","));
      } else {
        urlParams.append(key, value.toString());
      }
    }
  });

  // Remove cache busting to prevent infinite queries
  // urlParams.append('_t', Date.now().toString());

  return urlParams;
}

// Base fetcher function for logs API
async function fetchLogsData<T>(
  endpoint: string,
  params?: LogsQueryParams | LogsStatsParams | LogsErrorsParams,
  signal?: AbortSignal
): Promise<T> {
  const urlParams = buildLogsParams(params as LogsQueryParams);
  const url = `${API_BASE_URL}/v1/logs${endpoint}?${urlParams}`;

  const response = await fetch(url, {
    credentials: "include",
    signal,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch logs data from ${endpoint}: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error);
  }

  return data;
}

// Ingestion fetcher
async function ingestLogs(
  data: LogIngestData | BulkLogIngestData,
  signal?: AbortSignal
): Promise<{ success: boolean; message?: string }> {
  const isBulk = "logs" in data;
  const endpoint = isBulk ? "/logs/bulk" : "/logs/ingest";

  // Format data according to basket service expectations
  let formattedData: any;

  if (isBulk) {
    // For bulk logs, send as-is since the /bulk endpoint expects { logs: [...] }
    formattedData = data;
  } else {
    // For single logs, wrap in the expected structure
    const logData = data as LogIngestData;
    formattedData = {
      type: logData.level === "error" ? "error_log" : "log",
      payload: {
        ...logData,
        timestamp: logData.timestamp ? new Date(logData.timestamp).getTime() : Date.now(),
      },
    };
  }

  const url = `${BASKET_URL}${endpoint}?client_id=${encodeURIComponent(formattedData.payload?.client_id || (data as BulkLogIngestData).logs?.[0]?.client_id || "")}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    signal,
    body: JSON.stringify(formattedData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to ingest logs (${response.status}): ${errorText}`);
  }

  const result = await response.json();

  if (result.status !== "success") {
    throw new Error(result.message || result.error || "Failed to ingest logs");
  }

  return { success: true, message: result.message };
}

/**
 * Hook to query logs with filtering and pagination
 */
export function useLogsQuery(
  params?: LogsQueryParams,
  options?: Partial<UseQueryOptions<LogsQueryResponse>>
) {
  const userTimezone = useUserTimezone();

  const fetchData = useCallback(
    async ({ signal }: { signal?: AbortSignal }) => {
      return fetchLogsData<LogsQueryResponse>("/query", params, signal);
    },
    [JSON.stringify(params)]
  );

  const query = useQuery({
    queryKey: ["logs-query", JSON.stringify(params), userTimezone],
    queryFn: fetchData,
    ...defaultQueryOptions,
    ...options,
  });

  // Enhanced data processing
  const processedData = useMemo(() => {
    if (!query.data) return null;

    return {
      ...query.data,
      logs: query.data.logs.map((log) => ({
        ...log,
        timestamp: new Date(log.timestamp),
        parsedMetadata: log.metadata
          ? typeof log.metadata === "string"
            ? JSON.parse(log.metadata)
            : log.metadata
          : undefined,
        parsedLabels: log.labels
          ? typeof log.labels === "string"
            ? JSON.parse(log.labels)
            : log.labels
          : undefined,
      })),
    };
  }, [query.data]);

  return {
    ...query,
    data: processedData,
    logs: processedData?.logs || [],
    pagination: processedData?.pagination,
    filters: processedData?.filters,
  };
}

/**
 * Hook to get logs statistics and aggregations
 */
export function useLogsStats(
  params?: LogsStatsParams,
  options?: Partial<UseQueryOptions<LogsStatsResponse>>
) {
  const userTimezone = useUserTimezone();

  const fetchData = useCallback(
    async ({ signal }: { signal?: AbortSignal }) => {
      return fetchLogsData<LogsStatsResponse>("/stats", params, signal);
    },
    [params]
  );

  return useQuery({
    queryKey: ["logs-stats", params, userTimezone],
    queryFn: fetchData,
    ...defaultQueryOptions,
    staleTime: 5 * 60 * 1000, // 5 minutes for stats
    ...options,
  });
}

/**
 * Hook to get error analysis
 */
export function useLogsErrors(
  params?: LogsErrorsParams,
  options?: Partial<UseQueryOptions<LogsErrorsResponse>>
) {
  const userTimezone = useUserTimezone();

  const fetchData = useCallback(
    async ({ signal }: { signal?: AbortSignal }) => {
      return fetchLogsData<LogsErrorsResponse>("/errors", params, signal);
    },
    [params]
  );

  return useQuery({
    queryKey: ["logs-errors", params, userTimezone],
    queryFn: fetchData,
    ...defaultQueryOptions,
    ...options,
  });
}

/**
 * Hook to get a specific log by ID
 */
export function useLogById(
  id: string,
  clientId?: string,
  options?: Partial<UseQueryOptions<{ log: LogEvent }>>
) {
  const fetchData = useCallback(
    async ({ signal }: { signal?: AbortSignal }) => {
      const params = clientId ? { client_id: clientId } : undefined;
      return fetchLogsData<{ log: LogEvent }>(`/${id}`, params, signal);
    },
    [id, clientId]
  );

  return useQuery({
    queryKey: ["log-by-id", id, clientId],
    queryFn: fetchData,
    ...defaultQueryOptions,
    ...options,
    enabled: options?.enabled !== false && !!id,
  });
}

/**
 * Hook to check logs service health
 */
export function useLogsHealth(options?: Partial<UseQueryOptions<LogHealthResponse>>) {
  const fetchData = useCallback(async ({ signal }: { signal?: AbortSignal }) => {
    return fetchLogsData<LogHealthResponse>("/health", undefined, signal);
  }, []);

  return useQuery({
    queryKey: ["logs-health"],
    queryFn: fetchData,
    ...defaultQueryOptions,
    staleTime: 30 * 1000, // 30 seconds for health checks
    refetchInterval: 60 * 1000, // Check every minute
    ...options,
  });
}

/**
 * Mutation hook to ingest a single log
 */
export function useLogIngest(
  options?: UseMutationOptions<{ success: boolean; message?: string }, Error, LogIngestData>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LogIngestData) => ingestLogs(data),
    onSuccess: () => {
      // Invalidate logs queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["logs-query"] });
      queryClient.invalidateQueries({ queryKey: ["logs-stats"] });
      queryClient.invalidateQueries({ queryKey: ["logs-errors"] });
      queryClient.invalidateQueries({ queryKey: ["logs-health"] });
    },
    ...options,
  });
}

/**
 * Mutation hook to ingest multiple logs in bulk
 */
export function useBulkLogIngest(
  options?: UseMutationOptions<{ success: boolean; message?: string }, Error, BulkLogIngestData>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkLogIngestData) => ingestLogs(data),
    onSuccess: () => {
      // Invalidate logs queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["logs-query"] });
      queryClient.invalidateQueries({ queryKey: ["logs-stats"] });
      queryClient.invalidateQueries({ queryKey: ["logs-errors"] });
      queryClient.invalidateQueries({ queryKey: ["logs-health"] });
    },
    ...options,
  });
}

/**
 * Convenience hook for recent logs with sensible defaults
 */
export function useRecentLogs(
  clientId?: string,
  options?: Partial<UseQueryOptions<LogsQueryResponse>>
) {
  const params = useMemo(
    (): LogsQueryParams => ({
      client_id: clientId,
      limit: 50,
      sort_by: "timestamp",
      sort_order: "desc",
      start_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Last 24 hours
      end_time: new Date().toISOString(),
    }),
    [clientId]
  );

  return useLogsQuery(params, {
    refetchInterval: false, // Disable automatic refetch to prevent infinite loops
    ...options,
  });
}

/**
 * Convenience hook for error logs only
 */
export function useErrorLogs(
  clientId?: string,
  options?: Partial<UseQueryOptions<LogsQueryResponse>>
) {
  const params = useMemo(
    (): LogsQueryParams => ({
      client_id: clientId,
      levels: ["error"],
      limit: 100,
      sort_by: "timestamp",
      sort_order: "desc",
      start_time: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Last 7 days
      end_time: new Date().toISOString(),
    }),
    [clientId]
  );

  return useLogsQuery(params, options);
}

/**
 * Convenience hook for logs by service
 */
export function useLogsByService(
  serviceName: string,
  clientId?: string,
  options?: Partial<UseQueryOptions<LogsQueryResponse>>
) {
  const params = useMemo(
    (): LogsQueryParams => ({
      client_id: clientId,
      services: [serviceName],
      limit: 100,
      sort_by: "timestamp",
      sort_order: "desc",
      start_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Last 24 hours
      end_time: new Date().toISOString(),
    }),
    [clientId, serviceName]
  );

  return useLogsQuery(params, {
    enabled: !!serviceName,
    ...options,
  });
}

/**
 * Convenience hook for logs by trace ID (distributed tracing)
 */
export function useLogsByTrace(
  traceId: string,
  options?: Partial<UseQueryOptions<LogsQueryResponse>>
) {
  const params: LogsQueryParams = {
    trace_id: traceId,
    limit: 1000, // Get all logs for a trace
    sort_by: "timestamp",
    sort_order: "asc", // Chronological order for traces
  };

  return useLogsQuery(params, {
    enabled: !!traceId,
    ...options,
  });
}

/**
 * Hook for real-time logs with automatic refresh
 */
export function useRealTimeLogs(
  clientId?: string,
  refreshInterval = 5000,
  options?: Partial<UseQueryOptions<LogsQueryResponse>>
) {
  const params = useMemo(
    (): LogsQueryParams => ({
      client_id: clientId,
      limit: 25,
      sort_by: "timestamp",
      sort_order: "desc",
      start_time: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // Last hour
      end_time: new Date().toISOString(),
    }),
    [clientId]
  );

  return useLogsQuery(params, {
    refetchInterval: refreshInterval,
    refetchIntervalInBackground: true,
    ...options,
  });
}
