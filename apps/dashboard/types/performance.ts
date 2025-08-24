export interface PerformanceEntry {
	name: string;
	visitors: number;
	// Load time metrics
	avg_load_time: number;
	p50_load_time?: number;
	p75_load_time?: number;
	p90_load_time?: number;
	p95_load_time?: number;
	p99_load_time?: number;
	// TTFB metrics
	avg_ttfb?: number;
	p95_ttfb?: number;
	p99_ttfb?: number;
	// Other timing metrics
	avg_dom_ready_time?: number;
	avg_render_time?: number;
	// Core Web Vitals - FCP (First Contentful Paint)
	avg_fcp?: number;
	p50_fcp?: number;
	p75_fcp?: number;
	p90_fcp?: number;
	p95_fcp?: number;
	p99_fcp?: number;
	// Core Web Vitals - LCP (Largest Contentful Paint)
	avg_lcp?: number;
	p50_lcp?: number;
	p75_lcp?: number;
	p90_lcp?: number;
	p95_lcp?: number;
	p99_lcp?: number;
	// Core Web Vitals - CLS (Cumulative Layout Shift)
	avg_cls?: number;
	p50_cls?: number;
	p75_cls?: number;
	p90_cls?: number;
	p95_cls?: number;
	p99_cls?: number;
	// Core Web Vitals - FID (First Input Delay)
	avg_fid?: number;
	p95_fid?: number;
	p99_fid?: number;
	// Core Web Vitals - INP (Interaction to Next Paint)
	avg_inp?: number;
	p95_inp?: number;
	p99_inp?: number;
	// Additional fields
	pageviews?: number;
	measurements?: number;
	country_code?: string;
	country_name?: string;
	_uniqueKey?: string;
}

export interface PerformanceSummary {
	avgLoadTime: number;
	p95LoadTime?: number;
	p99LoadTime?: number;
	fastPages: number;
	slowPages: number;
	totalPages: number;
	performanceScore: number;
	// Core Web Vitals summary
	avgFCP?: number;
	p95FCP?: number;
	avgLCP?: number;
	p95LCP?: number;
	avgCLS?: number;
	p95CLS?: number;
	avgFID?: number;
	p95FID?: number;
	avgINP?: number;
	p95INP?: number;
}
