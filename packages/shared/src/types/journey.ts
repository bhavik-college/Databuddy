export interface JourneyTransition {
  from_page: string;
  to_page: string;
  transitions: number;
  sessions: number;
  users: number;
  avg_step_in_journey: number;
}

export interface JourneyPath {
  name: string;
  entry_page: string;
  exit_page: string;
  frequency: number;
  unique_users: number;
  avg_pages_in_path: number;
  avg_duration_seconds: number;
  avg_duration_minutes: number;
}

export interface JourneyDropoff {
  name: string;
  total_visits: number;
  total_sessions: number;
  total_users: number;
  exits: number;
  continuations: number;
  exit_rate: number;
  continuation_rate: number;
}

export interface JourneyEntryPoint {
  name: string;
  entries: number;
  sessions: number;
  users: number;
  bounce_rate: number;
  avg_pages_per_session: number;
}
