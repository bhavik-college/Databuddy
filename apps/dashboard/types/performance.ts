export interface PerformanceEntry {
  name: string;
  visitors: number;
  avg_load_time: number;
  avg_ttfb?: number;
  avg_dom_ready_time?: number;
  avg_render_time?: number;
  avg_fcp?: number;
  avg_lcp?: number;
  avg_cls?: number;
  _uniqueKey?: string;
}

export interface PerformanceSummary {
  avgLoadTime: number;
  fastPages: number;
  slowPages: number;
  totalPages: number;
  performanceScore: number;
}
