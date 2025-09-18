export interface ChartDataPoint {
	date: string;
	pageviews?: number;
	visitors?: number;
	sessions?: number;
	bounce_rate?: number;
	avg_session_duration?: number;
	[key: string]: unknown;
}

export interface TechnologyRow {
	name: string;
	visitors: number;
	pageviews?: number;
	percentage: number;
	icon?: string;
	category?: string;
}

export interface ReferrerRow {
	name: string;
	visitors: number;
	pageviews?: number;
	percentage?: number;
	referrer?: string;
}

export interface PageRow {
	name: string;
	visitors: number;
	pageviews?: number;
	percentage?: number;
}

export interface CellInfo<T> {
	getValue: () => unknown;
	row: { original: T };
}
