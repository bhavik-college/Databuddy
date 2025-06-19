import type { ParameterBuilder } from '../types'
import { createQueryBuilder, METRICS } from '../utils'

export const performanceBuilders: Record<string, ParameterBuilder> = {
  slow_pages: createQueryBuilder({
    metricSet: METRICS.performance,
    nameColumn: 'cutQueryString(path)',
    groupByColumns: ['cutQueryString(path)'],
    extraWhere: "load_time > 0 AND path != ''",
    orderBy: 'avg_load_time DESC'
  }),

  performance_by_country: createQueryBuilder({
    metricSet: METRICS.performance,
    nameColumn: 'country',
    groupByColumns: ['country'],
    extraWhere: "load_time > 0 AND country != ''",
    orderBy: 'avg_load_time DESC'
  }),

  performance_by_device: createQueryBuilder({
    metricSet: METRICS.performance,
    nameColumn: 'device_type',
    groupByColumns: ['device_type'],
    extraWhere: "load_time > 0 AND device_type != ''",
    orderBy: 'avg_load_time DESC'
  }),

  performance_by_browser: createQueryBuilder({
    metricSet: METRICS.performance,
    nameColumn: "CONCAT(browser_name, ' ', browser_version)",
    groupByColumns: ['browser_name', 'browser_version'],
    extraWhere: "load_time > 0 AND browser_name != '' AND browser_version IS NOT NULL AND browser_version != ''",
    orderBy: 'avg_load_time DESC'
  }),

  performance_by_os: createQueryBuilder({
    metricSet: METRICS.performance,
    nameColumn: 'os_name',
    groupByColumns: ['os_name'],
    extraWhere: "load_time > 0 AND os_name != ''",
    orderBy: 'avg_load_time DESC'
  }),

  performance_by_region: createQueryBuilder({
    metricSet: METRICS.performance,
    nameColumn: "CONCAT(region, ', ', country)",
    groupByColumns: ['region', 'country'],
    extraWhere: "load_time > 0 AND region != ''",
    orderBy: 'avg_load_time DESC'
  }),
} 