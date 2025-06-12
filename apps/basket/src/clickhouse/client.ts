import type { LogParams, ErrorLogParams, WarnLogParams, Logger, ResponseJSON } from '@clickhouse/client-web';
import { ClickHouseLogLevel, createClient } from '@clickhouse/client-web';
import type { WebClickHouseClientConfigOptions } from '@clickhouse/client-web/dist/config';

export interface SqlBuilderObject {
  where: Record<string, string>;
  having: Record<string, string>;
  select: Record<string, string>;
  groupBy: Record<string, string>;
  orderBy: Record<string, string>;
  from: string;
  limit: number | undefined;
  offset: number | undefined;
}

/**
 * Creates a SQL query builder for ClickHouse
 * @param tableName Optional table name to query (defaults to events table)
 */
export function createSqlBuilder(tableName?: keyof typeof TABLE_NAMES) {
  const join = (obj: Record<string, string> | string[], joiner: string) =>
    Object.values(obj).filter(Boolean).join(joiner);

  const sb: SqlBuilderObject = {
    where: {},
    from: tableName ? TABLE_NAMES[tableName] : TABLE_NAMES.events,
    select: {},
    groupBy: {},
    orderBy: {},
    having: {},
    limit: undefined,
    offset: undefined,
  };

  const getWhere = () =>
    Object.keys(sb.where).length ? `WHERE ${join(sb.where, ' AND ')}` : '';
  const getHaving = () =>
    Object.keys(sb.having).length ? `HAVING ${join(sb.having, ' AND ')}` : '';
  const getFrom = () => `FROM ${sb.from}`;
  const getSelect = () =>
    `SELECT ${Object.keys(sb.select).length ? join(sb.select, ', ') : '*'}`;
  const getGroupBy = () =>
    Object.keys(sb.groupBy).length ? `GROUP BY ${join(sb.groupBy, ', ')}` : '';
  const getOrderBy = () =>
    Object.keys(sb.orderBy).length ? `ORDER BY ${join(sb.orderBy, ', ')}` : '';
  const getLimit = () => (sb.limit ? `LIMIT ${sb.limit}` : '');
  const getOffset = () => (sb.offset ? `OFFSET ${sb.offset}` : '');

  return {
    sb,
    join,
    getWhere,
    getFrom,
    getSelect,
    getGroupBy,
    getOrderBy,
    getHaving,
    /**
     * Set the table to query
     * @param table The table name from TABLE_NAMES
     */
    setTable: (table: keyof typeof TABLE_NAMES) => {
      sb.from = TABLE_NAMES[table];
      return sb;
    },
    /**
     * Generates the complete SQL query string
     */
    getSql: () => {
      const sql = [
        getSelect(),
        getFrom(),
        getWhere(),
        getGroupBy(),
        getHaving(),
        getOrderBy(),
        getLimit(),
        getOffset(),
      ]
        .filter(Boolean)
        .join(' ');
      return sql;
    },
  };
}

export { createClient };

/**
 * ClickHouse table names used throughout the application
 */
export const TABLE_NAMES = {
  events: 'analytics.events',
  sessions: 'analytics.sessions',
  daily_stats: 'analytics.daily_stats',
  page_stats: 'analytics.page_stats',
  referrer_stats: 'analytics.referrer_stats',
  location_stats: 'analytics.location_stats',
  device_stats: 'analytics.device_stats',
  performance_stats: 'analytics.performance_stats'
};

// const logger = createLogger('clickhouse');
const logger = console;

class CustomLogger implements Logger {
    trace({ message, args }: LogParams) {
      logger.debug(message, args);
    }
    debug({ message, args }: LogParams) {
      if (message.includes('Query:') && args?.response_status === 200) {
        return;
      }
      logger.debug(message, args);
    }
    info({ message, args }: LogParams) {
      logger.info(message, args);
    }
    warn({ message, args }: WarnLogParams) {
      logger.warn(message, args);
    }
    error({ message, args, err }: ErrorLogParams) {
      logger.error(message, {
        ...args,
        error: err,
      });
    }
  }

  export const CLICKHOUSE_OPTIONS: WebClickHouseClientConfigOptions = {
    max_open_connections: 30,
    request_timeout: 60000,
    keep_alive: {
      enabled: true,
    },
    compression: {
      request: true,
    },
    clickhouse_settings: {
      date_time_input_format: 'best_effort',
    },
    // log: {
    //   LoggerClass: CustomLogger,
    //   level: ClickHouseLogLevel.DEBUG,
    // },
  };

  export const clickHouseOG = createClient({
    url: process.env.CLICKHOUSE_URL || 
         (typeof globalThis.process !== 'undefined' ? globalThis.process.env?.CLICKHOUSE_URL : null) || 
         (typeof globalThis !== 'undefined' && 'CLICKHOUSE_URL' in globalThis ? (globalThis as Record<string, any>).CLICKHOUSE_URL : null),
    ...CLICKHOUSE_OPTIONS,
  });

  async function withRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 500,
  ): Promise<T> {
    let lastError: Error | undefined;
  
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const res = await operation();
        if (attempt > 0) {
          logger.info('Retry operation succeeded', { attempt });
        }
        return res;
      } catch (error: any) {
        lastError = error;
  
        if (
          error.message.includes('Connect') ||
          error.message.includes('socket hang up') ||
          error.message.includes('Timeout error')
        ) {
          const delay = baseDelay * 2 ** attempt;
          logger.warn(
            `Attempt ${attempt + 1}/${maxRetries} failed, retrying in ${delay}ms`,
            {
              error: error.message,
            },
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
  
        throw error; // Non-retriable error
      }
    }
  
    throw lastError;
  }
  

  export const clickHouse = new Proxy(clickHouseOG, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
  
      if (property === 'insert') {
        return (...args: any[]) => withRetry(() => value.apply(target, args));
      }
  
      return value;
    },
  });

  const cleanQuery = (query?: string) =>
    typeof query === 'string'
      ? query.replace(/\n/g, "").replace(/\s+/g, " ").trim()
      : undefined;

  export async function chQueryWithMeta<T extends Record<string, any>>(
    query: string,
  ): Promise<ResponseJSON<T>> {
    const res = await clickHouse.query({ query });
    const json = (await res.json()) as ResponseJSON<T>;
    const keys = Object.keys(json.data[0] || {});
    const response: ResponseJSON<T> = {
      data: json.data.map((item) => {
        return keys.reduce((acc, key) => {
          const meta = json.meta?.find((m) => m.name === key);
          return Object.assign(acc, {
            [key]:
              item[key] && meta?.type.includes('Int')
                ? Number.parseFloat(item[key] as string)
                : item[key],
          });
        }, {} as T);
      }),
      meta: json.meta,
      statistics: json.statistics,
      rows: json.rows,
      rows_before_limit_at_least: json.rows_before_limit_at_least
    };
    return response;
  }
  
  export async function chQuery<T extends Record<string, any>>(
    query: string,
  ): Promise<T[]> {
    return (await chQueryWithMeta<T>(query)).data;
  }
  
  export function formatClickhouseDate(
    date: Date | string,
    skipTime = false,
  ): string {
    if (skipTime) {
      return new Date(date).toISOString().split('T')[0] ?? '';
    }
    return new Date(date).toISOString().replace('T', ' ').replace(/Z+$/, '');
  }
  
  export function toDate(str: string, interval?: string) {
    // If it does not match the regex it's a column name eg 'created_at'
    if (!interval || interval === 'minute' || interval === 'hour') {
      if (str.match(/\d{4}-\d{2}-\d{2}/)) {
        return escape(str);
      }
  
      return str;
    }
  
    if (str.match(/\d{4}-\d{2}-\d{2}/)) {
      return `toDate(${escape(str.split(' ')[0])})`;
    }
  
    return `toDate(${str})`;
  }
  
  export function convertClickhouseDateToJs(date: string) {
    return new Date(`${date.replace(' ', 'T')}Z`);
  }