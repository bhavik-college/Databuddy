/**
 * Analytics-specific timezone utilities
 */

import { convertToUserTimezone } from "./timezone";

export interface AnalyticsEntry {
	date: string;
	pageviews: number;
	unique_visitors?: number;
	visitors?: number;
	sessions: number;
	bounce_rate: number;
	avg_session_duration?: number;
	[key: string]: any;
}

/**
 * Process events data to user's timezone by grouping and aggregating
 */
export function processEventsForTimezone(
	events: AnalyticsEntry[],
	timezone: string,
): AnalyticsEntry[] {
	if (timezone === "UTC") {
		return events;
	}

	try {
		// Group events by user's local date
		const groupedEvents = new Map<string, AnalyticsEntry>();

		for (const event of events) {
			const userDate = convertToUserTimezone(event.date, timezone);

			if (groupedEvents.has(userDate)) {
				const existing = groupedEvents.get(userDate);
				if (existing) {
					existing.pageviews += event.pageviews;
					existing.unique_visitors =
						(existing.unique_visitors || 0) + (event.unique_visitors || 0);
					existing.visitors = (existing.visitors || 0) + (event.visitors || 0);
					existing.sessions += event.sessions;

					// Recalculate averages
					const totalSessions = existing.sessions;
					if (totalSessions > 0) {
						existing.bounce_rate =
							(existing.bounce_rate * (totalSessions - event.sessions) +
								event.bounce_rate * event.sessions) /
							totalSessions;
						existing.avg_session_duration =
							((existing.avg_session_duration || 0) *
								(totalSessions - event.sessions) +
								(event.avg_session_duration || 0) * event.sessions) /
							totalSessions;
					}
				}
			} else {
				groupedEvents.set(userDate, {
					...event,
					date: userDate,
				});
			}
		}

		return Array.from(groupedEvents.values()).sort((a, b) =>
			a.date.localeCompare(b.date),
		);
	} catch {
		// If timezone processing fails, return original events
		return events;
	}
}

/**
 * Filter events to only include dates within the user's timezone date range
 */
export function filterEventsForTimezone(
	events: AnalyticsEntry[],
	startDate: string,
	endDate: string,
	timezone: string,
): AnalyticsEntry[] {
	if (timezone === "UTC") {
		return events.filter(
			(event) => event.date >= startDate && event.date <= endDate,
		);
	}

	try {
		return events.filter((event) => {
			const userDate = convertToUserTimezone(event.date, timezone);
			return userDate >= startDate && userDate <= endDate;
		});
	} catch {
		// If timezone processing fails, return original filtered events
		return events.filter(
			(event) => event.date >= startDate && event.date <= endDate,
		);
	}
}

/**
 * Convert analytics summary data to user timezone context
 */
export function processSummaryForTimezone(
	summary: any,
	timezone: string,
	originalStartDate: string,
	originalEndDate: string,
): any {
	if (timezone === "UTC") {
		return summary;
	}

	// For summary data, we don't need to convert dates since it's aggregated
	// But we can add timezone context information
	return {
		...summary,
		timezone_context: {
			timezone,
			original_date_range: {
				start: originalStartDate,
				end: originalEndDate,
			},
		},
	};
}

/**
 * Adjust "today" data based on user's timezone
 */
export function adjustTodayDataForTimezone(
	todayData: any,
	timezone: string,
): any {
	if (timezone === "UTC") {
		return todayData;
	}

	try {
		// Get current date in user's timezone
		const now = new Date();
		const userDate = new Date(
			now.toLocaleString("en-US", { timeZone: timezone }),
		);
		const userDateStr = userDate.toISOString().split("T")[0];
		const utcDateStr = new Date().toISOString().split("T")[0];

		// If user's date is different from UTC date, we might need to adjust
		if (userDateStr !== utcDateStr) {
			return {
				...todayData,
				timezone_adjusted: true,
				user_date: userDateStr,
				utc_date: utcDateStr,
			};
		}

		return todayData;
	} catch {
		return todayData;
	}
}
