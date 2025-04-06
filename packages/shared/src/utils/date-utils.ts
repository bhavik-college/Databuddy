// Import dayjs using require format
import * as dayjs from 'dayjs';
import * as utcPlugin from 'dayjs/plugin/utc';
import * as timezonePlugin from 'dayjs/plugin/timezone';
import { TIMEZONES } from '../lists/timezones';

// Initialize dayjs plugins
dayjs.extend(utcPlugin);
dayjs.extend(timezonePlugin);

/**
 * Format a date according to user's timezone and format preferences
 */
export function formatDate(
  date: Date | string | number,
  options?: {
    timezone?: string;
    dateFormat?: string;
    timeFormat?: string;
    showTime?: boolean;
    customFormat?: string;
  }
) {
  if (!date) return '';
  
  const timezone = options?.timezone || 'UTC';
  
  // If a custom format is provided, use it
  if (options?.customFormat) {
    return dayjs(date).tz(timezone).format(options.customFormat);
  }
  
  // Default formats
  const dateFormat = options?.dateFormat || 'MMM D, YYYY';
  const timeFormat = options?.timeFormat || 'h:mm A';
  
  // Combine formats if showTime is true
  const format = options?.showTime 
    ? `${dateFormat} ${timeFormat}` 
    : dateFormat;
    
  return dayjs(date).tz(timezone).format(format);
}

/**
 * Convert a date to a specific timezone
 */
export function convertToTimezone(
  date: Date | string | number,
  timezone = 'UTC'
) {
  return dayjs(date).tz(timezone).toDate();
}

/**
 * Get current browser timezone
 */
export function getBrowserTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Find timezone by region
 */
export function findTimezoneByRegion(region: string) {
  return TIMEZONES.find(tz => tz.region === region);
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string | number) {
  if (!date) return '';
  
  const now = dayjs();
  const past = dayjs(date);
  const diff = now.diff(past, 'second');
  
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} minute(s) ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hour(s) ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} day(s) ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)} month(s) ago`;
  
  return `${Math.floor(diff / 31536000)} year(s) ago`;
} 