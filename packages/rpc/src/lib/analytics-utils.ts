import { chQuery } from "@databuddy/db";
import { referrers } from "@databuddy/shared/lists/referrers";
import { ORPCError } from "@orpc/server";

// Types
export type AnalyticsStep = {
	step_number: number;
	name: string;
	type: "PAGE_VIEW" | "EVENT";
	target: string;
};

export type StepAnalytics = {
	step_number: number;
	step_name: string;
	users: number;
	total_users: number;
	conversion_rate: number;
	dropoffs: number;
	dropoff_rate: number;
	avg_time_to_complete: number;
};

export type FunnelTimeSeriesPoint = {
	date: string;
	users: number;
	conversions: number;
	conversion_rate: number;
	dropoffs: number;
	avg_time: number;
};

export type FunnelAnalytics = {
	overall_conversion_rate: number;
	total_users_entered: number;
	total_users_completed: number;
	avg_completion_time: number;
	avg_completion_time_formatted: string;
	biggest_dropoff_step: number;
	biggest_dropoff_rate: number;
	steps_analytics: StepAnalytics[];
	time_series: FunnelTimeSeriesPoint[];
};

export type ReferrerAnalytics = {
	referrer: string;
	referrer_parsed: { name: string; type: string; domain: string; url: string };
	total_users: number;
	completed_users: number;
	conversion_rate: number;
};

// Keep ProcessedAnalytics for backwards compatibility
export type ProcessedAnalytics = Omit<FunnelAnalytics, "biggest_dropoff_step" | "biggest_dropoff_rate" | "time_series">;

type VisitorEvent = {
	step_number: number;
	step_name: string;
	first_occurrence: number;
	referrer?: string;
};

type Filter = { field: string; operator: string; value: string | string[] };

// Helpers
const formatDuration = (seconds: number): string => {
	if (!seconds || !Number.isFinite(seconds) || seconds <= 0) return "—";
	if (seconds < 60) return `${Math.round(seconds)}s`;
	if (seconds < 3600) {
		const m = Math.floor(seconds / 60);
		const s = Math.round(seconds % 60);
		return s > 0 ? `${m}m ${s}s` : `${m}m`;
	}
	const h = Math.floor(seconds / 3600);
	const m = Math.round((seconds % 3600) / 60);
	return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const safeAvg = (arr: number[]): number =>
	arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) || 0 : 0;

const pct = (a: number, b: number): number =>
	b > 0 ? Math.round((a / b) * 10000) / 100 : 0;

const parseReferrer = (referrer: string) => {
	if (!referrer || referrer === "Direct" || referrer.toLowerCase() === "(direct)") {
		return { name: "Direct", type: "direct", domain: "", url: "" };
	}
	try {
		const fullUrl = referrer.startsWith("http://") || referrer.startsWith("https://")
			? referrer
			: `https://${referrer}`;
		const url = new URL(fullUrl);
		const hostname = url.hostname.toLowerCase();
		const hostnameWithoutWww = hostname.startsWith("www.") ? hostname.slice(4) : hostname;

		if (referrers[hostname]) {
			return {
				name: referrers[hostname].name,
				type: referrers[hostname].type,
				domain: hostnameWithoutWww,
				url: referrer,
			};
		}

		return { name: hostnameWithoutWww, type: "referrer", domain: hostnameWithoutWww, url: referrer };
	} catch {
		return { name: referrer, type: "referrer", domain: "", url: referrer };
	}
};

// Filter building
const ALLOWED_FIELDS = new Set([
	"event_name", "path", "referrer", "user_agent", "country", "city",
	"device_type", "browser_name", "os_name", "screen_resolution", "language",
	"utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
]);

const ALLOWED_OPS = new Set([
	"equals", "not_equals", "contains", "not_contains", "starts_with",
	"ends_with", "in", "not_in", "is_null", "is_not_null",
]);

export const buildFilterConditions = (
	filters: Filter[],
	prefix: string,
	params: Record<string, unknown>
): { conditions: string; errors: string[] } => {
	const conditions: string[] = [];
	const errors: string[] = [];

	for (const f of filters) {
		if (!ALLOWED_FIELDS.has(f.field)) {
			errors.push(`Invalid field: ${f.field}`);
			continue;
		}
		if (!ALLOWED_OPS.has(f.operator)) {
			errors.push(`Invalid operator: ${f.operator}`);
			continue;
		}

		const key = `${prefix}_${f.field}_${f.operator}`;
		const { field, operator, value } = f;

		if (operator === "is_null") {
			conditions.push(`${field} IS NULL`);
		} else if (operator === "is_not_null") {
			conditions.push(`${field} IS NOT NULL`);
		} else if (Array.isArray(value)) {
			params[key] = value;
			conditions.push(
				operator === "in"
					? `${field} IN {${key}:Array(String)}`
					: `${field} NOT IN {${key}:Array(String)}`
			);
		} else {
			const escaped = (value as string).replace(/[%_]/g, "\\$&");
			if (operator === "contains") {
				params[key] = `%${escaped}%`;
				conditions.push(`${field} LIKE {${key}:String}`);
			} else if (operator === "not_contains") {
				params[key] = `%${escaped}%`;
				conditions.push(`${field} NOT LIKE {${key}:String}`);
			} else if (operator === "starts_with") {
				params[key] = `${escaped}%`;
				conditions.push(`${field} LIKE {${key}:String}`);
			} else if (operator === "ends_with") {
				params[key] = `%${escaped}`;
				conditions.push(`${field} LIKE {${key}:String}`);
			} else {
				params[key] = escaped;
				conditions.push(
					operator === "equals"
						? `${field} = {${key}:String}`
						: `${field} != {${key}:String}`
				);
			}
		}
	}

	return {
		conditions: conditions.length > 0 ? ` AND ${conditions.join(" AND ")}` : "",
		errors,
	};
};

// Query building
const buildStepQuery = (
	step: AnalyticsStep,
	idx: number,
	filterCond: string,
	params: Record<string, unknown>,
	includeReferrer = false
): string => {
	const nameKey = `step_name_${idx}`;
	const targetKey = `target_${idx}`;
	params[nameKey] = step.name;
	params[targetKey] = step.target;

	const refSelect = includeReferrer ? ", any(referrer) as referrer" : "";

	if (step.type === "PAGE_VIEW") {
		params[`${targetKey}_like`] = `%${step.target}%`;
		return `
			SELECT ${idx + 1} as step_number, {${nameKey}:String} as step_name, any(session_id) as session_id,
				anonymous_id, MIN(time) as first_occurrence${refSelect}
			FROM analytics.events
			WHERE client_id = {websiteId:String}
				AND time >= parseDateTimeBestEffort({startDate:String})
				AND time <= parseDateTimeBestEffort({endDate:String})
				AND event_name = 'screen_view'
				AND (path = {${targetKey}:String} OR path LIKE {${targetKey}_like:String})${filterCond}
			GROUP BY anonymous_id`;
	}

	// EVENT type - query both tables
	const refJoin = includeReferrer
		? `LEFT JOIN (
			SELECT anonymous_id, argMin(referrer, time) as visitor_referrer
			FROM analytics.events
			WHERE client_id = {websiteId:String}
				AND time >= parseDateTimeBestEffort({startDate:String})
				AND time <= parseDateTimeBestEffort({endDate:String})
				AND event_name = 'screen_view' AND referrer != ''
			GROUP BY anonymous_id
		) vr ON e.anonymous_id = vr.anonymous_id`
		: "";

	return `
		SELECT ${idx + 1} as step_number, {${nameKey}:String} as step_name, any(session_id) as session_id,
			e.anonymous_id as anonymous_id, MIN(first_occurrence) as first_occurrence${includeReferrer ? ", COALESCE(vr.visitor_referrer, '') as referrer" : ""}
		FROM (
			SELECT anonymous_id, session_id, time as first_occurrence
			FROM analytics.events
			WHERE client_id = {websiteId:String}
				AND time >= parseDateTimeBestEffort({startDate:String})
				AND time <= parseDateTimeBestEffort({endDate:String})
				AND event_name = {${targetKey}:String}${filterCond}
			UNION ALL
			SELECT anonymous_id, session_id, timestamp as first_occurrence
			FROM analytics.custom_events
			WHERE client_id = {websiteId:String}
				AND timestamp >= parseDateTimeBestEffort({startDate:String})
				AND timestamp <= parseDateTimeBestEffort({endDate:String})
				AND event_name = {${targetKey}:String}
		) e ${refJoin}
		GROUP BY e.anonymous_id${includeReferrer ? ", vr.visitor_referrer" : ""}`;
};

// Core processing
const processVisitorEvents = (
	rawResults: Array<{
		step_number: number;
		step_name: string;
		session_id: string;
		anonymous_id: string;
		first_occurrence: number;
		referrer?: string;
	}>
): Map<string, VisitorEvent[]> => {
	const map = new Map<string, VisitorEvent[]>();
	for (const e of rawResults) {
		const events = map.get(e.anonymous_id) || [];
		events.push({
			step_number: e.step_number,
			step_name: e.step_name,
			first_occurrence: e.first_occurrence,
			referrer: e.referrer,
		});
		map.set(e.anonymous_id, events);
	}
	return map;
};

const calculateStepCounts = (
	visitorEvents: Map<string, VisitorEvent[]>,
	visitorFilter?: Set<string>
): Map<number, Set<string>> => {
	const counts = new Map<number, Set<string>>();

	for (const [visitorId, events] of visitorEvents) {
		if (visitorFilter && !visitorFilter.has(visitorId)) continue;

		events.sort((a, b) => a.first_occurrence - b.first_occurrence);
		let step = 1;
		for (const e of events) {
			if (e.step_number === step) {
				const set = counts.get(step) || new Set();
				set.add(visitorId);
				counts.set(step, set);
				step++;
			}
		}
	}
	return counts;
};

// Main funnel analytics
export const processFunnelAnalytics = async (
	steps: AnalyticsStep[],
	filters: Filter[],
	params: Record<string, unknown>
): Promise<FunnelAnalytics> => {
	const { conditions, errors } = buildFilterConditions(filters, "f", params);
	if (errors.length > 0) {
		throw new ORPCError("BAD_REQUEST", { message: `Invalid filters: ${errors.join(", ")}` });
	}

	const stepQueries = steps.map((s, i) => buildStepQuery(s, i, conditions, params));
	const query = `
		WITH all_step_events AS (${stepQueries.join("\nUNION ALL\n")})
		SELECT DISTINCT step_number, step_name, session_id, anonymous_id, first_occurrence
		FROM all_step_events ORDER BY anonymous_id, first_occurrence`;

	const rawResults = await chQuery<{
		step_number: number;
		step_name: string;
		session_id: string;
		anonymous_id: string;
		first_occurrence: number;
	}>(query, params);

	const visitorEvents = processVisitorEvents(rawResults);
	const stepCounts = calculateStepCounts(visitorEvents);
	const totalSteps = steps.length;

	// Calculate timings
	const completionTimes: number[] = [];
	const stepTimings = new Map<number, number[]>();

	for (const [, events] of visitorEvents) {
		events.sort((a, b) => a.first_occurrence - b.first_occurrence);
		let currentStep = 1;
		let firstTime = 0;
		let prevTime = 0;

		for (const e of events) {
			if (e.step_number === currentStep) {
				if (currentStep === 1) {
					firstTime = prevTime = e.first_occurrence;
				} else {
					const arr = stepTimings.get(currentStep) || [];
					arr.push(e.first_occurrence - prevTime);
					stepTimings.set(currentStep, arr);
					prevTime = e.first_occurrence;
				}
				if (currentStep === totalSteps) {
					completionTimes.push(e.first_occurrence - firstTime);
				}
				currentStep++;
			}
		}
	}

	const avgCompletionTime = safeAvg(completionTimes);
	const totalUsers = stepCounts.get(1)?.size || 0;

	const stepsAnalytics: StepAnalytics[] = steps.map((s, i) => {
		const stepNum = i + 1;
		const users = stepCounts.get(stepNum)?.size || 0;
		const prevUsers = i > 0 ? stepCounts.get(i)?.size || 0 : users;
		const dropoffs = i > 0 ? prevUsers - users : 0;

		return {
			step_number: stepNum,
			step_name: s.name,
			users,
			total_users: totalUsers,
			conversion_rate: i > 0 ? pct(users, prevUsers) : 100,
			dropoffs,
			dropoff_rate: i > 0 ? pct(dropoffs, prevUsers) : 0,
			avg_time_to_complete: safeAvg(stepTimings.get(stepNum) || []),
		};
	});

	const lastStep = stepsAnalytics.at(-1);
	const biggestDropoff = stepsAnalytics.slice(1).reduce(
		(max, s) => (s.dropoff_rate > max.dropoff_rate ? s : max),
		stepsAnalytics[1] || stepsAnalytics[0]
	);

	// Time series query
	let timeSeries: FunnelTimeSeriesPoint[] = [];
	try {
		const tsQuery = `
			WITH all_step_events AS (${stepQueries.join("\nUNION ALL\n")}),
			daily_first AS (
				SELECT toDate(first_occurrence) as date, anonymous_id, MIN(first_occurrence) as first_time
				FROM all_step_events WHERE step_number = 1 GROUP BY date, anonymous_id
			),
			daily_last AS (
				SELECT toDate(first_occurrence) as date, anonymous_id, MAX(first_occurrence) as last_time
				FROM all_step_events WHERE step_number = ${totalSteps} GROUP BY date, anonymous_id
			)
			SELECT toString(f.date) as date, COUNT(DISTINCT f.anonymous_id) as users,
				COUNT(DISTINCT l.anonymous_id) as conversions,
				AVG(IF(l.last_time IS NOT NULL, dateDiff('second', f.first_time, l.last_time), 0)) as avg_time
			FROM daily_first f
			LEFT JOIN daily_last l ON f.anonymous_id = l.anonymous_id AND f.date = l.date
			GROUP BY f.date ORDER BY f.date`;

		const tsResults = await chQuery<{ date: string; users: number; conversions: number; avg_time: number }>(tsQuery, params);
		timeSeries = tsResults.map((r) => ({
			date: r.date,
			users: r.users || 0,
			conversions: r.conversions || 0,
			conversion_rate: pct(r.conversions || 0, r.users || 0),
			dropoffs: (r.users || 0) - (r.conversions || 0),
			avg_time: Math.round(r.avg_time || 0) || 0,
		}));
	} catch (err) {
		console.error("Time-series query failed:", err);
	}

	return {
		overall_conversion_rate: pct(lastStep?.users || 0, totalUsers),
		total_users_entered: totalUsers,
		total_users_completed: lastStep?.users || 0,
		avg_completion_time: avgCompletionTime,
		avg_completion_time_formatted: formatDuration(avgCompletionTime),
		biggest_dropoff_step: biggestDropoff?.step_number || 1,
		biggest_dropoff_rate: biggestDropoff?.dropoff_rate || 0,
		steps_analytics: stepsAnalytics,
		time_series: timeSeries,
	};
};

// Goal analytics (single step)
export const processGoalAnalytics = async (
	steps: AnalyticsStep[],
	filters: Filter[],
	params: Record<string, unknown>,
	totalWebsiteUsers: number
): Promise<ProcessedAnalytics> => {
	const { conditions, errors } = buildFilterConditions(filters, "f", params);
	if (errors.length > 0) {
		throw new ORPCError("BAD_REQUEST", { message: `Invalid filters: ${errors.join(", ")}` });
	}

	const step = steps[0];
	const query = `
		WITH step_events AS (${buildStepQuery(step, 0, conditions, params)})
		SELECT DISTINCT step_number, step_name, session_id, anonymous_id, first_occurrence
		FROM step_events ORDER BY anonymous_id, first_occurrence`;

	const rawResults = await chQuery<{
		step_number: number;
		step_name: string;
		session_id: string;
		anonymous_id: string;
		first_occurrence: number;
	}>(query, params);

	const visitorEvents = processVisitorEvents(rawResults);
	const completions = calculateStepCounts(visitorEvents).get(1)?.size || 0;

	return {
		overall_conversion_rate: pct(completions, totalWebsiteUsers),
		total_users_entered: totalWebsiteUsers,
		total_users_completed: completions,
		avg_completion_time: 0,
		avg_completion_time_formatted: "—",
		steps_analytics: [{
			step_number: 1,
			step_name: step.name,
			users: completions,
			total_users: totalWebsiteUsers,
			conversion_rate: pct(completions, totalWebsiteUsers),
			dropoffs: 0,
			dropoff_rate: 0,
			avg_time_to_complete: 0,
		}],
	};
};

// Referrer analytics
export const processFunnelAnalyticsByReferrer = async (
	steps: AnalyticsStep[],
	filters: Filter[],
	params: Record<string, unknown>
): Promise<{ referrer_analytics: ReferrerAnalytics[] }> => {
	const { conditions, errors } = buildFilterConditions(filters, "f", params);
	if (errors.length > 0) {
		throw new ORPCError("BAD_REQUEST", { message: `Invalid filters: ${errors.join(", ")}` });
	}

	const stepQueries = steps.map((s, i) => buildStepQuery(s, i, conditions, params, true));
	const query = `
		WITH all_step_events AS (${stepQueries.join("\nUNION ALL\n")})
		SELECT DISTINCT step_number, step_name, session_id, anonymous_id, first_occurrence, referrer
		FROM all_step_events ORDER BY anonymous_id, first_occurrence`;

	const rawResults = await chQuery<{
		step_number: number;
		step_name: string;
		session_id: string;
		anonymous_id: string;
		first_occurrence: number;
		referrer: string;
	}>(query, params);

	const visitorEvents = processVisitorEvents(rawResults);

	// Group by referrer
	const groups = new Map<string, { parsed: ReturnType<typeof parseReferrer>; visitors: Set<string> }>();
	for (const [visitorId, events] of visitorEvents) {
		if (events.length === 0) continue;
		const ref = events[0].referrer || "Direct";
		const parsed = parseReferrer(ref);
		const key = parsed.domain?.toLowerCase() || "direct";

		if (!groups.has(key)) {
			groups.set(key, { parsed, visitors: new Set() });
		}
		groups.get(key)?.visitors.add(visitorId);
	}

	// Calculate per-referrer stats
	const analytics: ReferrerAnalytics[] = [];
	for (const [key, group] of groups) {
		const counts = calculateStepCounts(visitorEvents, group.visitors);
		const total = counts.get(1)?.size || 0;
		if (total === 0) continue;

		const completed = counts.get(steps.length)?.size || 0;
		analytics.push({
			referrer: key,
			referrer_parsed: group.parsed,
			total_users: total,
			completed_users: completed,
			conversion_rate: pct(completed, total),
		});
	}

	return { referrer_analytics: analytics.sort((a, b) => b.total_users - a.total_users) };
};

// Utility export
export const getTotalWebsiteUsers = async (
	websiteId: string,
	startDate: string,
	endDate: string
): Promise<number> => {
	const result = await chQuery<{ total_users: number }>(
		`SELECT COUNT(DISTINCT anonymous_id) as total_users FROM analytics.events
		 WHERE client_id = {websiteId:String}
			AND time >= parseDateTimeBestEffort({startDate:String})
			AND time <= parseDateTimeBestEffort({endDate:String})
			AND event_name = 'screen_view'`,
		{ websiteId, startDate, endDate: `${endDate} 23:59:59` }
	);
	return result[0]?.total_users ?? 0;
};
