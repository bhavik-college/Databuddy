// Error-related types

export interface ErrorData {
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

export interface ErrorTypeData {
  name: string; // error message
  total_occurrences: number;
  affected_users: number;
  affected_sessions: number;
  last_occurrence: string;
  first_occurrence: string;
}

export interface ErrorBreakdownData {
  name: string; // page, browser, os, country, device
  total_errors: number;
  unique_error_types: number;
  affected_users: number;
  affected_sessions: number;
}

export interface ErrorTrendData {
  date: string;
  total_errors: number;
  unique_error_types: number;
  affected_users: number;
  affected_sessions: number;
}
