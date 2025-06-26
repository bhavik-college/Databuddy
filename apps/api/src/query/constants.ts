export const PARAMETER_CATEGORIES = {
  summary: ['summary_metrics', 'today_metrics', 'events_by_date', 'sessions_summary'],
  device: ['device_type', 'device_types', 'browser_name', 'browsers_grouped', 'browser_versions', 'os_name', 'screen_resolution', 'connection_type'],
  geography: ['country', 'region', 'timezone', 'language'],
  pages: ['top_pages', 'entry_pages', 'exit_page', 'exit_pages'],
  utm: ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_sources', 'utm_mediums', 'utm_campaigns'],
  referrers: ['referrer', 'top_referrers'],
  performance: ['slow_pages', 'performance_by_country', 'performance_by_device', 'performance_by_browser', 'performance_by_os', 'performance_by_region'],
  errors: ['recent_errors', 'error_types', 'errors_by_page', 'errors_by_browser', 'errors_by_os', 'errors_by_country', 'errors_by_device', 'error_trends'],
  web_vitals: ['web_vitals_overview', 'web_vitals_by_page', 'web_vitals_by_device', 'web_vitals_trends'],
  custom_events: ['custom_events', 'custom_event_details', 'custom_events_by_page', 'custom_events_by_user', 'custom_event_properties', 'custom_event_property_values'],
  user_journeys: ['user_journeys', 'journey_paths', 'journey_dropoffs', 'journey_entry_points'],
  funnel_analysis: ['funnel_analysis', 'funnel_performance', 'funnel_steps_breakdown', 'funnel_user_segments'],
  revenue: ['revenue_summary', 'revenue_trends', 'recent_transactions', 'recent_refunds', 'revenue_by_country', 'revenue_by_currency', 'revenue_by_card_brand'],
  real_time: ['active_stats', 'latest_events']
} as const 