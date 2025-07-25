import { Analytics } from '../../types/tables';
import type { SimpleQueryConfig } from '../types';

export const GeoBuilders: Record<string, SimpleQueryConfig> = {
  country: {
    table: Analytics.events,
    fields: [
      'country as name',
      'COUNT(*) as pageviews',
      'COUNT(DISTINCT anonymous_id) as visitors',
      'ROUND((COUNT(*) / SUM(COUNT(*)) OVER()) * 100, 2) as percentage',
    ],
    where: ["country != ''", "event_name = 'screen_view'"],
    groupBy: ['country'],
    orderBy: 'pageviews DESC',
    limit: 100,
    timeField: 'time',
    allowedFilters: ['path', 'device_type', 'browser_name'],
    customizable: true,
    plugins: { normalizeGeo: true, deduplicateGeo: true },
  },

  region: {
    table: Analytics.events,
    fields: [
      'region as name',
      'COUNT(*) as pageviews',
      'COUNT(DISTINCT anonymous_id) as visitors',
      'ROUND((COUNT(*) / SUM(COUNT(*)) OVER()) * 100, 2) as percentage',
    ],
    where: ["region != ''", "event_name = 'screen_view'"],
    groupBy: ['region'],
    orderBy: 'pageviews DESC',
    limit: 100,
    timeField: 'time',
    allowedFilters: ['country', 'path', 'device_type'],
    customizable: true,
  },

  timezone: {
    table: Analytics.events,
    fields: [
      'timezone as name',
      'COUNT(*) as pageviews',
      'COUNT(DISTINCT anonymous_id) as visitors',
      'ROUND((COUNT(*) / SUM(COUNT(*)) OVER()) * 100, 2) as percentage',
    ],
    where: ["timezone != ''", "event_name = 'screen_view'"],
    groupBy: ['timezone'],
    orderBy: 'pageviews DESC',
    limit: 100,
    timeField: 'time',
    allowedFilters: ['country', 'path', 'device_type'],
    customizable: true,
  },

  language: {
    table: Analytics.events,
    fields: [
      'language as name',
      'COUNT(*) as pageviews',
      'COUNT(DISTINCT anonymous_id) as visitors',
      'ROUND((COUNT(*) / SUM(COUNT(*)) OVER()) * 100, 2) as percentage',
    ],
    where: ["language != ''", "event_name = 'screen_view'"],
    groupBy: ['language'],
    orderBy: 'pageviews DESC',
    limit: 100,
    timeField: 'time',
    allowedFilters: ['country', 'path', 'device_type'],
    customizable: true,
  },

  city: {
    table: Analytics.events,
    fields: [
      'city as name',
      'COUNT(*) as pageviews',
      'COUNT(DISTINCT anonymous_id) as visitors',
      'ROUND((COUNT(*) / SUM(COUNT(*)) OVER()) * 100, 2) as percentage',
    ],
    where: ["city != ''", "event_name = 'screen_view'"],
    groupBy: ['city'],
    orderBy: 'pageviews DESC',
    limit: 100,
    timeField: 'time',
    allowedFilters: ['country', 'path', 'device_type'],
    customizable: true,
  },
};
