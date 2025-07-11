import type { SQL } from 'drizzle-orm'

export type QueryWithParams = {
  query: string
  params: Record<string, unknown>
}

export type Granularity = 'hourly' | 'daily'

export interface QueryDateRange {
  from: string
  to: string
}

export interface QueryFilters {
  [key: string]: string | number | string[] | number[]
}

export type QueryBuilder = (
  websiteId: string,
  dateRange: QueryDateRange,
  filters?: QueryFilters,
  limit?: number,
  offset?: number,
  granularity?: Granularity,
) => QueryWithParams

export interface QueryBuilderGroup {
  [key: string]: QueryBuilder
}

export interface BuilderConfig {
  metricSet: string;
  nameColumn: string;
  groupByColumns: string[];
  eventName?: string;
  extraWhere?: string;
  orderBy: string;
} 