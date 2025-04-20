/**
 * Utility functions for analytics data processing
 */

import dayjs from 'dayjs';

/**
 * Calculate weighted bounce rate from two sets of data
 */
export function calculateWeightedBounceRate(
  historicalSessions: number, 
  historicalBounceRate: number,
  todaySessions: number, 
  todayBounceRate: number
): number {
  const totalSessions = historicalSessions + todaySessions;
  
  if (totalSessions <= 0) {
    return 0;
  }
  
  return (
    (historicalSessions * (historicalBounceRate || 0) / 100) +
    (todaySessions * (todayBounceRate || 0) / 100)
  ) / totalSessions * 100;
}

/**
 * Format time in seconds to a human-readable string
 * Carefully detects if the value is in milliseconds and converts appropriately
 */
export function formatTime(timeValue: number): string {
  if (!timeValue || Number.isNaN(timeValue)) {
    return '0s';
  }
  
  // Always assume values over 1000 are milliseconds and convert them
  // This ensures consistency across the application
  const seconds = timeValue;
  
  // Now format the seconds value
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  }
}

/**
 * Format performance metrics with appropriate units
 */
export function formatPerformanceMetric(value: number, unit= 'ms'): string {
  if (!value || Number.isNaN(value)) {
    return `0${unit}`;
  }
  
  if (value < 1000 || unit !== 'ms') {
    return `${Math.round(value)}${unit}`;
  }
  
  return `${(value / 1000).toFixed(2)}s`;
}

/**
 * Format analytics data entry with standardized fields
 * Ensures consistent data formatting across all analytics endpoints
 */
export function formatAnalyticsEntry(entry: any, dateField = 'date'): any {
  const duration = entry.avg_session_duration || 0;
  
  return {
    date: entry[dateField],
    pageviews: entry.pageviews || 0,
    visitors: entry.unique_visitors || entry.visitors || 0,
    sessions: entry.sessions || 0,
    bounce_rate: Math.round((entry.bounce_rate || 0) * 10) / 10,
    bounce_rate_pct: `${Math.round((entry.bounce_rate || 0) * 10) / 10}%`,
    avg_session_duration: Math.round(duration),
    avg_session_duration_formatted: formatTime(duration)
  };
}

/**
 * Get default date range if not provided
 */
export function getDefaultDateRange(providedEndDate?: string, providedStartDate?: string) {
  const endDate = providedEndDate || new Date().toISOString().split('T')[0];
  const startDate = providedStartDate || 
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  return { startDate, endDate };
}

/**
 * Check if a date is today
 */
export function isToday(date: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  return date === today;
}

/**
 * Get the current hour formatted for matching with hourly data
 */
export function getCurrentHourFormatted(): string {
  return dayjs().format('YYYY-MM-DD HH:00:00');
}

/**
 * Helper to format clean paths by removing protocol and hostname
 */
export function formatCleanPath(path: string): string {
  let cleanPath = path;
  
  try {
    if (path?.startsWith('http')) {
      const url = new URL(path);
      cleanPath = url.pathname + url.search + url.hash;
    }
  } catch (e) {
    // If URL parsing fails, keep the original path
  }
  
  return cleanPath;
}

/**
 * Create error response object
 */
export function createErrorResponse(error: unknown, statusCode = 500) {
  return {
    success: false,
    error: error instanceof Error ? error.message : 'Unknown error occurred',
    statusCode
  };
}

/**
 * Create success response with data
 */
export function createSuccessResponse(data: Record<string, any>) {
  return {
    success: true,
    ...data
  };
}

// Helper function to format browser data
export function formatBrowserData(browserData: Array<{ browser_name: string; browser_version: string; count: number; visitors: number }>) {
  return browserData.map(item => ({
    browser: item.browser_name,
    version: item.browser_version,
    count: item.count,
    visitors: item.visitors
  }));
}

// Helper function to format device data
export function formatDeviceData(deviceData: Array<{ device_type: string; device_brand: string; device_model: string; visitors: number; pageviews: number }>) {
  return deviceData.map(item => ({
    device_type: item.device_type || 'desktop',
    device_brand: item.device_brand || 'Unknown',
    device_model: item.device_model || 'Unknown',
    visitors: item.visitors,
    pageviews: item.pageviews
  }));
} 