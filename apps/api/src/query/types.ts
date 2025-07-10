export type QueryWithParams = {
  query: string
  params: Record<string, unknown>
}

export type ParameterBuilder = (
  websiteId: string,
  startDate: string,
  endDate: string,
  limit: number,
  offset: number,
  granularity?: 'hourly' | 'daily',
  timezone?: string,
  filters?: any[],
  groupBy?: string,
) => string | QueryWithParams

export interface BuilderConfig {
  metricSet: string;
  nameColumn: string;
  groupByColumns: string[];
  eventName?: string;
  extraWhere?: string;
  orderBy: string;
}

export interface Website {
  id: string;
  domain: string;
}

export type AnalyticsContext = {
  Variables: {
    website: Website;
    user: any;
  };
};

export interface FilterRequest {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in' | 'contains' | 'starts_with';
  value: string | number | Array<string | number>;
}

export interface QueryRequest {
  id?: string;
  startDate: string;
  endDate: string;
  timeZone: string;
  parameters: string[];
  limit: number;
  page: number;
  filters: FilterRequest[];
  granularity: 'hourly' | 'daily';
} 