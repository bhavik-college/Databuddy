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

export interface ErrorTab {
  id: string;
  label: string;
  data: any[];
  columns: any[];
}
