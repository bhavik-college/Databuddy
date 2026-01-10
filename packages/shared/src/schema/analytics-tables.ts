/**
 * ClickHouse Analytics Schema Definitions
 * Used by both frontend (query builder UI) and backend (SQL validation)
 */

export type ColumnType = "string" | "number" | "datetime" | "boolean" | "array";

export interface TableColumn {
	name: string;
	type: ColumnType;
	nullable: boolean;
	label: string;
	description?: string;
	/** Can use SUM, AVG, MAX, MIN on this field */
	aggregatable: boolean;
	/** Can use in WHERE clause */
	filterable: boolean;
}

export interface TableDefinition {
	name: string;
	database: "analytics" | "uptime" | "observability";
	label: string;
	description: string;
	columns: TableColumn[];
	/** Field used for date range filtering */
	primaryTimeField: string;
	/** Field used for website scoping */
	clientIdField: string;
}

// Helper to create columns with common defaults
function col(
	name: string,
	type: ColumnType,
	label: string,
	options?: Partial<Pick<TableColumn, "nullable" | "description" | "aggregatable" | "filterable">>
): TableColumn {
	return {
		name,
		type,
		label,
		nullable: options?.nullable ?? false,
		description: options?.description,
		aggregatable: options?.aggregatable ?? (type === "number"),
		filterable: options?.filterable ?? true,
	};
}

/**
 * Events table - main analytics data
 */
const EVENTS_TABLE: TableDefinition = {
	name: "events",
	database: "analytics",
	label: "Events",
	description: "Page views, sessions, and user interactions",
	primaryTimeField: "time",
	clientIdField: "client_id",
	columns: [
		col("id", "string", "Event ID", { filterable: false }),
		col("client_id", "string", "Website ID", { filterable: false }),
		col("event_name", "string", "Event Name", { description: "Type of event (screen_view, etc.)" }),
		col("anonymous_id", "string", "Anonymous ID", { description: "Unique visitor identifier" }),
		col("time", "datetime", "Event Time"),
		col("session_id", "string", "Session ID"),
		col("event_type", "string", "Event Type", { description: "track, error, or web_vitals" }),
		col("referrer", "string", "Referrer", { nullable: true }),
		col("url", "string", "URL"),
		col("path", "string", "Path"),
		col("title", "string", "Page Title", { nullable: true }),
		col("ip", "string", "IP Address", { filterable: false }),
		col("user_agent", "string", "User Agent", { filterable: false }),
		col("browser_name", "string", "Browser", { nullable: true }),
		col("browser_version", "string", "Browser Version", { nullable: true }),
		col("os_name", "string", "Operating System", { nullable: true }),
		col("os_version", "string", "OS Version", { nullable: true }),
		col("device_type", "string", "Device Type", { nullable: true, description: "desktop, mobile, tablet" }),
		col("device_brand", "string", "Device Brand", { nullable: true }),
		col("device_model", "string", "Device Model", { nullable: true }),
		col("country", "string", "Country", { nullable: true }),
		col("region", "string", "Region", { nullable: true }),
		col("city", "string", "City", { nullable: true }),
		col("screen_resolution", "string", "Screen Resolution", { nullable: true }),
		col("viewport_size", "string", "Viewport Size", { nullable: true }),
		col("language", "string", "Language", { nullable: true }),
		col("timezone", "string", "Timezone", { nullable: true }),
		col("connection_type", "string", "Connection Type", { nullable: true }),
		col("rtt", "number", "Round Trip Time (ms)", { nullable: true }),
		col("downlink", "number", "Downlink Speed", { nullable: true }),
		col("time_on_page", "number", "Time on Page (s)", { nullable: true }),
		col("scroll_depth", "number", "Scroll Depth (%)", { nullable: true }),
		col("interaction_count", "number", "Interaction Count", { nullable: true }),
		col("page_count", "number", "Page Count"),
		col("utm_source", "string", "UTM Source", { nullable: true }),
		col("utm_medium", "string", "UTM Medium", { nullable: true }),
		col("utm_campaign", "string", "UTM Campaign", { nullable: true }),
		col("utm_term", "string", "UTM Term", { nullable: true }),
		col("utm_content", "string", "UTM Content", { nullable: true }),
		col("load_time", "number", "Load Time (ms)", { nullable: true }),
		col("dom_ready_time", "number", "DOM Ready Time (ms)", { nullable: true }),
		col("dom_interactive", "number", "DOM Interactive (ms)", { nullable: true }),
		col("ttfb", "number", "Time to First Byte (ms)", { nullable: true }),
		col("connection_time", "number", "Connection Time (ms)", { nullable: true }),
		col("render_time", "number", "Render Time (ms)", { nullable: true }),
		col("redirect_time", "number", "Redirect Time (ms)", { nullable: true }),
		col("domain_lookup_time", "number", "DNS Lookup Time (ms)", { nullable: true }),
	],
};

/**
 * Error spans table - JavaScript errors
 */
const ERROR_SPANS_TABLE: TableDefinition = {
	name: "error_spans",
	database: "analytics",
	label: "Errors",
	description: "JavaScript errors and exceptions",
	primaryTimeField: "timestamp",
	clientIdField: "client_id",
	columns: [
		col("client_id", "string", "Website ID", { filterable: false }),
		col("anonymous_id", "string", "Anonymous ID"),
		col("session_id", "string", "Session ID"),
		col("timestamp", "datetime", "Timestamp"),
		col("path", "string", "Path"),
		col("message", "string", "Error Message"),
		col("filename", "string", "Filename", { nullable: true }),
		col("lineno", "number", "Line Number", { nullable: true, aggregatable: false }),
		col("colno", "number", "Column Number", { nullable: true, aggregatable: false }),
		col("stack", "string", "Stack Trace", { nullable: true, filterable: false }),
		col("error_type", "string", "Error Type"),
	],
};

/**
 * Web Vitals spans table - performance metrics
 */
const WEB_VITALS_SPANS_TABLE: TableDefinition = {
	name: "web_vitals_spans",
	database: "analytics",
	label: "Web Vitals",
	description: "Core Web Vitals performance metrics",
	primaryTimeField: "timestamp",
	clientIdField: "client_id",
	columns: [
		col("client_id", "string", "Website ID", { filterable: false }),
		col("anonymous_id", "string", "Anonymous ID"),
		col("session_id", "string", "Session ID"),
		col("timestamp", "datetime", "Timestamp"),
		col("path", "string", "Path"),
		col("metric_name", "string", "Metric Name", { description: "FCP, LCP, CLS, INP, TTFB, FPS" }),
		col("metric_value", "number", "Metric Value"),
	],
};

/**
 * Custom event spans table - user-defined events
 */
const CUSTOM_EVENT_SPANS_TABLE: TableDefinition = {
	name: "custom_event_spans",
	database: "analytics",
	label: "Custom Events",
	description: "User-defined custom events",
	primaryTimeField: "timestamp",
	clientIdField: "client_id",
	columns: [
		col("client_id", "string", "Website ID", { filterable: false }),
		col("anonymous_id", "string", "Anonymous ID"),
		col("session_id", "string", "Session ID"),
		col("timestamp", "datetime", "Timestamp"),
		col("path", "string", "Path"),
		col("event_name", "string", "Event Name"),
		col("properties", "string", "Properties JSON", { filterable: false, aggregatable: false }),
	],
};

/**
 * Outgoing links table - external link clicks
 */
const OUTGOING_LINKS_TABLE: TableDefinition = {
	name: "outgoing_links",
	database: "analytics",
	label: "Outgoing Links",
	description: "External link clicks",
	primaryTimeField: "timestamp",
	clientIdField: "client_id",
	columns: [
		col("id", "string", "ID", { filterable: false }),
		col("client_id", "string", "Website ID", { filterable: false }),
		col("anonymous_id", "string", "Anonymous ID"),
		col("session_id", "string", "Session ID"),
		col("href", "string", "Link URL"),
		col("text", "string", "Link Text", { nullable: true }),
		col("properties", "string", "Properties JSON", { filterable: false, aggregatable: false }),
		col("timestamp", "datetime", "Timestamp"),
	],
};

/**
 * Daily pageviews aggregated table
 */
const DAILY_PAGEVIEWS_TABLE: TableDefinition = {
	name: "daily_pageviews",
	database: "analytics",
	label: "Daily Pageviews",
	description: "Pre-aggregated daily pageview counts",
	primaryTimeField: "date",
	clientIdField: "client_id",
	columns: [
		col("client_id", "string", "Website ID", { filterable: false }),
		col("date", "datetime", "Date"),
		col("pageviews", "number", "Pageviews"),
	],
};

/**
 * All analytics tables available for custom queries
 */
export const ANALYTICS_TABLES: TableDefinition[] = [
	EVENTS_TABLE,
	ERROR_SPANS_TABLE,
	WEB_VITALS_SPANS_TABLE,
	CUSTOM_EVENT_SPANS_TABLE,
	OUTGOING_LINKS_TABLE,
	DAILY_PAGEVIEWS_TABLE,
];

/**
 * Get a table definition by name
 */
export function getTableDefinition(tableName: string): TableDefinition | undefined {
	return ANALYTICS_TABLES.find((t) => t.name === tableName);
}

/**
 * Get a column definition from a table
 */
export function getColumnDefinition(tableName: string, columnName: string): TableColumn | undefined {
	const table = getTableDefinition(tableName);
	return table?.columns.find((c) => c.name === columnName);
}

/**
 * Validate that a table name is allowed
 */
export function isValidTable(tableName: string): boolean {
	return ANALYTICS_TABLES.some((t) => t.name === tableName);
}

/**
 * Validate that a column exists in a table
 */
export function isValidColumn(tableName: string, columnName: string): boolean {
	const table = getTableDefinition(tableName);
	return table?.columns.some((c) => c.name === columnName) ?? false;
}

/**
 * Get filterable columns for a table
 */
export function getFilterableColumns(tableName: string): TableColumn[] {
	const table = getTableDefinition(tableName);
	return table?.columns.filter((c) => c.filterable) ?? [];
}

/**
 * Get aggregatable columns for a table
 */
export function getAggregatableColumns(tableName: string): TableColumn[] {
	const table = getTableDefinition(tableName);
	return table?.columns.filter((c) => c.aggregatable) ?? [];
}
