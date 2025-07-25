// Real-time analytics types

export interface ActiveStatsData {
  active_users: number;
}

export interface LatestEventData {
  [key: string]: any;
}

export interface TodayMetricsData {
  visitors: number;
  sessions: number;
  pageviews: number;
}

export interface EventsByDateData {
  date: string;
  pageviews: number;
  visitors: number;
  unique_visitors: number;
  sessions: number;
  bounce_rate: number;
  avg_session_duration: number;
  revenue_by_currency: any;
  revenue_by_card_brand: any;

  active_stats: ActiveStatsData;
  latest_events: LatestEventData;
}
