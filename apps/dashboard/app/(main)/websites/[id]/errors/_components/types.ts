export interface ErrorDetail {
  error_message: string;
  error_stack?: string;
  page_url: string;
  anonymous_id: string;
  session_id: string;
  time: string;
  browser_name: string;
  os_name: string;
  device_type: string;
  country: string;
  region?: string;
  city?: string;
}

export interface ErrorSummary {
  totalErrors: number;
  uniqueErrorTypes: number;
  affectedUsers: number;
  affectedSessions: number;
  errorRate: number;
}

export interface ProcessedError {
  error_type: string;
  category: string;
  severity: "high" | "medium" | "low";
  error_message: string;
  count: number;
  unique_sessions: number;
  sessions: Set<string>;
  last_occurrence: string;
  sample_error: ErrorDetail;
}

export interface ErrorTab {
  id: string;
  label: string;
  data: any[];
  columns: any[];
}
