import type { SimpleQueryConfig } from '../types';

export const CustomEventsBuilders: Record<string, SimpleQueryConfig> = {
  custom_events: {
    table: 'analytics.events',
    fields: [
      'event_name as name',
      'COUNT(*) as total_events',
      'COUNT(DISTINCT anonymous_id) as unique_users',
      'COUNT(DISTINCT session_id) as unique_sessions',
      'MAX(time) as last_occurrence',
      'MIN(time) as first_occurrence',
      'COUNT(DISTINCT path) as unique_pages',
      'ROUND((COUNT(*) / SUM(COUNT(*)) OVER()) * 100, 2) as percentage',
    ],
    where: [
      "event_name NOT IN ('screen_view', 'page_exit', 'error', 'web_vitals', 'link_out')",
      "event_name != ''",
    ],
    groupBy: ['event_name'],
    orderBy: 'total_events DESC',
    limit: 100,
    timeField: 'time',
    allowedFilters: ['event_name', 'path', 'device_type', 'browser_name'],
    customizable: true,
  },

  custom_event_details: {
    table: 'analytics.events',
    fields: [
      'event_name',
      'time',
      'path',
      'anonymous_id',
      'session_id',
      'country',
      'region',
      'device_type',
      'browser_name',
      'os_name',
      'properties',
    ],
    where: [
      "event_name NOT IN ('screen_view', 'page_exit', 'error', 'web_vitals', 'link_out')",
      "event_name != ''",
    ],
    orderBy: 'time DESC',
    timeField: 'time',
    allowedFilters: ['event_name', 'path', 'device_type'],
    customizable: true,
  },

  custom_event_trends: {
    table: 'analytics.events',
    fields: [
      'toDate(time) as date',
      'event_name',
      'COUNT(*) as events',
      'COUNT(DISTINCT anonymous_id) as users',
    ],
    where: [
      "event_name NOT IN ('screen_view', 'page_exit', 'error', 'web_vitals', 'link_out')",
      "event_name != ''",
    ],
    groupBy: ['toDate(time)', 'event_name'],
    orderBy: 'date ASC, events DESC',
    timeField: 'time',
    allowedFilters: ['event_name', 'path', 'device_type'],
    customizable: true,
  },

  custom_event_by_page: {
    table: 'analytics.events',
    fields: [
      'path(path) as name',
      'event_name',
      'COUNT(*) as events',
      'COUNT(DISTINCT anonymous_id) as users',
    ],
    where: ["event_name != ''", "path != ''"],
    groupBy: ['path(path)', 'event_name'],
    orderBy: 'events DESC',
    limit: 50,
    timeField: 'time',
    allowedFilters: ['path', 'event_name', 'device_type'],
    customizable: true,
  },
};
