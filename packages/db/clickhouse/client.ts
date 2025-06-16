import type { LogParams, ErrorLogParams, WarnLogParams, Logger, ResponseJSON } from '@clickhouse/client';
import { ClickHouseLogLevel, createClient } from '@clickhouse/client';
import type { NodeClickHouseClientConfigOptions } from '@clickhouse/client/dist/config';

export { createClient };

/**
 * ClickHouse table names used throughout the application
 */
export const TABLE_NAMES = {
  events: 'analytics.events',
};

const logger = console;

  export const CLICKHOUSE_OPTIONS: NodeClickHouseClientConfigOptions = {
    max_open_connections: 30,
    request_timeout: 30000,
    keep_alive: {
      enabled: true,
      idle_socket_ttl: 8000,
    },
    compression: {
      request: true,
      response: true,
    },
  };

  export const clickHouseOG = createClient({
    url: process.env.CLICKHOUSE_URL,
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

  export async function chQueryWithMeta<T extends Record<string, any>>(
    query: string,
  ): Promise<ResponseJSON<T>> {
    const start = Date.now();
    const res = await clickHouse.query({
      query,
    });
    const beforeParse = Date.now();
    const json = await res.json<T>();
    const afterParse = Date.now();
    const keys = Object.keys(json.data[0] || {});
    const response = {
      ...json,
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
    };
  
    logger.info('query info', {
      // query: cleanQuery(query),
      rows: json.rows,
      stats: response.statistics,
      beforeParse: beforeParse - start,
      afterParse: afterParse - beforeParse,
      elapsed: Date.now() - start,
    });
  
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