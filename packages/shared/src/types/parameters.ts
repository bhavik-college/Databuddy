// Parameter and query-related types

export interface ParametersResponse {
	success: boolean;
	parameters: string[];
	categories: {
		device: string[];
		geography: string[];
		pages: string[];
		utm: string[];
		referrers: string[];
		performance: string[];
		errors: string[];
		web_vitals: string[];
		custom_events: string[];
		user_journeys: string[];
		funnel_analysis: string[];
		revenue: string[];
		real_time: string[];
	};
}

export interface QueryOptionsResponse {
	success: boolean;
	types: string[];
	configs: Record<
		string,
		{ allowedFilters: string[]; customizable: boolean; defaultLimit?: number }
	>;
}

// Base interface for common parameter structure
export interface BaseParameterData {
	name: string;
	visitors: number;
	pageviews: number;
}

export interface LlmOverviewKpiRow {
	total_calls: number;
	total_cost: number;
	total_tokens: number;
	input_tokens: number;
	output_tokens: number;
	avg_duration_ms: number;
	p75_duration_ms: number;
	error_count: number;
	error_rate: number;
	cache_hit_rate: number;
	tool_use_rate: number;
	web_search_rate: number;
}

export interface LlmTimeSeriesRow {
	date: string;
	total_calls: number;
	total_cost: number;
	total_tokens: number;
	avg_duration_ms: number;
	p75_duration_ms: number;
}

export interface LlmBreakdownRow {
	name: string;
	provider?: string;
	model?: string;
	calls: number;
	total_cost?: number;
	total_tokens?: number;
	avg_duration_ms?: number;
	p75_duration_ms?: number;
	error_rate?: number;
}

export interface LlmFinishReasonRow {
	name: string;
	finish_reason: string;
	calls: number;
}

export interface LlmErrorBreakdownRow {
	name: string;
	error_name: string;
	sample_message: string;
	error_count: number;
}

export interface LlmCostSeriesRow {
	date: string;
	provider?: string;
	model?: string;
	total_cost: number;
}

export interface LlmLatencySeriesRow {
	date: string;
	avg_duration_ms: number;
	p75_duration_ms: number;
	p95_duration_ms: number;
}

export interface LlmLatencyBreakdownRow {
	name: string;
	provider?: string;
	model?: string;
	calls: number;
	avg_duration_ms: number;
	p50_duration_ms: number;
	p75_duration_ms: number;
	p95_duration_ms: number;
}

export interface LlmSlowCallRow {
	timestamp: string;
	provider: string;
	model: string;
	total_tokens: number;
	duration_ms: number;
	finish_reason?: string;
	error_name?: string;
	trace_id?: string;
}

export interface LlmErrorRateSeriesRow {
	date: string;
	error_count: number;
	error_rate: number;
}

export interface LlmHttpStatusRow {
	name: string;
	http_status: number;
	calls: number;
}

export interface LlmRecentErrorRow {
	timestamp: string;
	error_name: string;
	error_message: string;
	model: string;
	provider: string;
	http_status?: number;
	duration_ms: number;
}

export interface LlmToolUseSeriesRow {
	date: string;
	tool_use_rate: number;
	avg_tool_calls: number;
	avg_tool_results: number;
}

export interface LlmToolNameRow {
	name: string;
	tool_name: string;
	calls: number;
}

export interface LlmTraceSummaryRow {
	name: string;
	trace_id: string;
	user_id: string;
	website_id?: string;
	calls: number;
	total_tokens: number;
	total_cost: number;
	errors: number;
	avg_duration_ms: number;
	p75_duration_ms: number;
}

export interface LlmRecentCallRow {
	timestamp: string;
	trace_id?: string;
	user_id?: string;
	provider: string;
	model: string;
	total_tokens: number;
	total_token_cost_usd: number;
	duration_ms: number;
	finish_reason?: string;
	error_name?: string;
}

interface GenericParameterRow {
	[key: string]: string | number | boolean | null | undefined;
}

// Parameter type mapping for better type safety
export interface ParameterDataMap {
	device_type: GenericParameterRow;
	browser_name: GenericParameterRow;
	browsers_grouped: GenericParameterRow;
	os_name: GenericParameterRow;
	screen_resolution: GenericParameterRow;
	connection_type: GenericParameterRow;
	country: GenericParameterRow;
	region: GenericParameterRow;
	city: GenericParameterRow;
	timezone: GenericParameterRow;
	language: GenericParameterRow;
	top_pages: GenericParameterRow;
	exit_page: GenericParameterRow;
	utm_source: GenericParameterRow;
	utm_medium: GenericParameterRow;
	utm_campaign: GenericParameterRow;
	referrer: GenericParameterRow;
	slow_pages: GenericParameterRow;
	performance_by_country: GenericParameterRow;
	performance_by_device: GenericParameterRow;
	performance_by_browser: GenericParameterRow;
	performance_by_os: GenericParameterRow;
	performance_by_region: GenericParameterRow;
	// Error-related parameters
	recent_errors: GenericParameterRow;
	error_types: GenericParameterRow;
	errors_breakdown: GenericParameterRow;
	error_trends: GenericParameterRow;
	sessions_summary: GenericParameterRow;
	// Custom Events parameters
	custom_events: GenericParameterRow;
	custom_event_details: GenericParameterRow;
	custom_events_by_page: GenericParameterRow;
	custom_events_by_user: GenericParameterRow;
	custom_event_properties: GenericParameterRow;
	custom_event_property_values: {
		name: string;
		total_events: number;
		unique_users: number;
	};
	// Summary and overview parameters
	summary_metrics: GenericParameterRow;
	today_metrics: GenericParameterRow;
	events_by_date: GenericParameterRow;
	entry_pages: GenericParameterRow;
	exit_pages: GenericParameterRow;
	top_referrers: GenericParameterRow;
	utm_sources: GenericParameterRow;
	utm_mediums: GenericParameterRow;
	utm_campaigns: GenericParameterRow;
	device_types: GenericParameterRow;
	browser_versions: GenericParameterRow;
	// Revenue parameters
	revenue_summary: GenericParameterRow;
	revenue_trends: GenericParameterRow;
	recent_transactions: GenericParameterRow;
	recent_refunds: GenericParameterRow;
	revenue_by_country: GenericParameterRow;
	revenue_by_currency: GenericParameterRow;
	revenue_by_card_brand: GenericParameterRow;
	// Real-time
	active_stats: GenericParameterRow;
	latest_events: GenericParameterRow;
	// Sessions
	session_list: GenericParameterRow;
	// Profiles
	profile_list: GenericParameterRow;
	// Retention
	retention_cohorts: GenericParameterRow;
	retention_rate: GenericParameterRow;
	llm_overview_kpis: LlmOverviewKpiRow;
	llm_time_series: LlmTimeSeriesRow;
	llm_provider_breakdown: LlmBreakdownRow;
	llm_model_breakdown: LlmBreakdownRow;
	llm_finish_reason_breakdown: LlmFinishReasonRow;
	llm_error_breakdown: LlmErrorBreakdownRow;
	llm_cost_by_provider_time_series: LlmCostSeriesRow;
	llm_cost_by_model_time_series: LlmCostSeriesRow;
	llm_latency_time_series: LlmLatencySeriesRow;
	llm_latency_by_model: LlmLatencyBreakdownRow;
	llm_latency_by_provider: LlmLatencyBreakdownRow;
	llm_slowest_calls: LlmSlowCallRow;
	llm_error_rate_time_series: LlmErrorRateSeriesRow;
	llm_http_status_breakdown: LlmHttpStatusRow;
	llm_recent_errors: LlmRecentErrorRow;
	llm_tool_use_time_series: LlmToolUseSeriesRow;
	llm_tool_name_breakdown: LlmToolNameRow;
	llm_trace_summary: LlmTraceSummaryRow;
	llm_recent_calls: LlmRecentCallRow;
}

// Helper type to extract data types from parameters
export type ExtractDataTypes<T extends (keyof ParameterDataMap)[]> = {
	[K in T[number]]: ParameterDataMap[K][];
};
