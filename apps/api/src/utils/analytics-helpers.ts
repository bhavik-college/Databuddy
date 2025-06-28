/**
 * Utility functions for analytics data processing
 */

import dayjs from "dayjs";

/**
 * Calculate weighted bounce rate from two sets of data
 */
export function calculateWeightedBounceRate(
	historicalSessions: number,
	historicalBounceRate: number,
	todaySessions: number,
	todayBounceRate: number,
): number {
	const totalSessions = historicalSessions + todaySessions;

	if (totalSessions <= 0) {
		return 0;
	}

	return (
		(((historicalSessions * (historicalBounceRate || 0)) / 100 +
			(todaySessions * (todayBounceRate || 0)) / 100) /
			totalSessions) *
		100
	);
}

/**
 * Format time from seconds to a more readable string
 * @param seconds Time in seconds
 * @returns Formatted time string
 */
export function formatTime(seconds: number): string {
	if (!seconds || seconds < 0) {
		return "0s";
	}

	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const remainingSeconds = Math.floor(seconds % 60);

	let result = "";

	if (hours > 0) {
		result += `${hours}h `;
	}

	if (minutes > 0 || hours > 0) {
		result += `${minutes}m `;
	}

	result += `${remainingSeconds}s`;

	return result;
}

/**
 * Format average session duration from seconds to a readable string
 * This is a wrapper around formatTime that ensures consistent formatting
 * @param sessionDuration Time in seconds
 * @returns Formatted time string
 */
export function formatAvgSessionDuration(sessionDuration: number): string {
	return formatTime(sessionDuration || 0);
}

/**
 * Format performance metric value based on type
 * @param value Metric value in milliseconds
 * @param suffix Optional suffix to add (default is 'ms')
 * @returns Formatted metric string
 */
export function formatPerformanceMetric(value: number, suffix = "ms"): string {
	if (!value || Number.isNaN(value)) {
		return `0${suffix}`;
	}

	if (value < 1000 || suffix !== "ms") {
		return `${Math.round(value)}${suffix}`;
	}

	return `${(value / 1000).toFixed(2)}s`;
}

/**
 * Format analytics data entry with standardized fields
 * Ensures consistent data formatting across all analytics endpoints
 */
export function formatAnalyticsEntry(entry: any, dateField = "date"): any {
	const duration = entry.avg_session_duration || 0;

	return {
		date: entry[dateField],
		pageviews: entry.pageviews || 0,
		visitors: entry.unique_visitors || entry.visitors || 0,
		sessions: entry.sessions || 0,
		bounce_rate: Math.round((entry.bounce_rate || 0) * 10) / 10,
		bounce_rate_pct: `${Math.round((entry.bounce_rate || 0) * 10) / 10}%`,
		avg_session_duration: Math.round(duration),
		avg_session_duration_formatted: formatAvgSessionDuration(duration),
	};
}

/**
 * Get default date range if not provided
 */
export function getDefaultDateRange(
	providedEndDate?: string,
	providedStartDate?: string,
) {
	const endDate = providedEndDate || new Date().toISOString().split("T")[0];
	const startDate =
		providedStartDate ||
		new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

	return { startDate, endDate };
}

/**
 * Check if a date is today
 */
export function isToday(date: string): boolean {
	const today = new Date().toISOString().split("T")[0];
	return date === today;
}

/**
 * Get the current hour formatted for matching with hourly data
 */
export function getCurrentHourFormatted(): string {
	return dayjs().format("YYYY-MM-DD HH:00:00");
}

/**
 * Helper to format clean paths by removing protocol and hostname
 */
export function formatCleanPath(path: string): string {
	if (!path) return "/";

	let cleanPath = path;

	try {
		if (path.startsWith("http")) {
			const url = new URL(path);
			cleanPath = url.pathname + url.search + url.hash;
		}
	} catch (e) {
		// If URL parsing fails, keep the original path
		cleanPath = path;
	}

	// Ensure we always return at least "/"
	return cleanPath || "/";
}

/**
 * Create error response object
 */
export function createErrorResponse(error: unknown, statusCode = 500) {
	return {
		success: false,
		error: error instanceof Error ? error.message : "Unknown error occurred",
		statusCode,
	};
}

/**
 * Create success response with data
 */
export function createSuccessResponse(data: Record<string, any>) {
	return {
		success: true,
		...data,
	};
}

// Helper function to format browser data
export function formatBrowserData(
	browserData: Array<{
		browser_name: string;
		browser_version: string;
		count: number;
		visitors: number;
	}>,
) {
	return browserData.map((item) => ({
		browser: item.browser_name,
		version: item.browser_version,
		count: item.count,
		visitors: item.visitors,
	}));
}

// Helper function to format device data
export function formatDeviceData(
	deviceData: Array<{
		device_type: string;
		device_brand: string;
		device_model: string;
		visitors: number;
		pageviews: number;
	}>,
) {
	return deviceData.map((item) => ({
		device_type: item.device_type || "desktop",
		device_brand: item.device_brand || "Unknown",
		device_model: item.device_model || "Unknown",
		visitors: item.visitors,
		pageviews: item.pageviews,
	}));
}
