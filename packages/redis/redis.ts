import { SuperJSON } from 'superjson';
import type { RedisOptions } from 'ioredis';
import Redis from 'ioredis';
import { createLogger } from '@databuddy/logger';

// Initialize logger
const logger = createLogger('redis');

const getSuperJson = SuperJSON.parse;
const setSuperJson = SuperJSON.stringify;

const options: RedisOptions = {
  connectTimeout: 10000,
  retryStrategy: (times) => {
    const delay = Math.min(times * 100, 3000);
    logger.debug(`Redis connection retry attempt ${times}, delay: ${delay}ms`);
    return delay;
  },
  maxRetriesPerRequest: 3
};

export { Redis };

interface ExtendedRedis extends Redis {
  getJson: <T = any>(key: string) => Promise<T | null>;
  setJson: <T = any>(
    key: string,
    expireInSec: number,
    value: T,
  ) => Promise<void>;
}

const createRedisClient = (
  url: string,
  overrides: RedisOptions = {},
): ExtendedRedis => {
  logger.debug(`Creating Redis client with URL: ${url.replace(/(redis:\/\/[^:]+:)([^@]+)(@.+)/, '$1****$3')}`);
  
  const client = new Redis(url, {
    ...options,
    ...overrides,
  }) as ExtendedRedis;

  client.on('error', (error) => {
    logger.error('Redis Client Error:', error);
  });

  client.on('connect', () => {
    logger.debug('Redis client connected');
  });

  client.on('ready', () => {
    logger.debug('Redis client ready');
  });

  client.on('reconnecting', () => {
    logger.debug('Redis client reconnecting');
  });

  client.getJson = async <T = any>(key: string): Promise<T | null> => {
    const value = await client.get(key);
    if (value) {
      const res = getSuperJson(value) as T;
      if (res && Array.isArray(res) && res.length === 0) {
        return null;
      }

      if (res && typeof res === 'object' && Object.keys(res).length === 0) {
        return null;
      }

      if (res) {
        return res;
      }
    }
    return null;
  };

  client.setJson = async <T = any>(
    key: string,
    expireInSec: number,
    value: T,
  ): Promise<void> => {
    await client.setex(key, expireInSec, setSuperJson(value));
  };

  return client;
};

let redisCache: ExtendedRedis;
export function getRedisCache() {
  if (!redisCache) {
    // Access environment variables properly in both Node.js and Cloudflare Workers
    const redisUrl = process.env.REDIS_URL || 
                     (typeof globalThis.process !== 'undefined' ? globalThis.process.env?.REDIS_URL : null) || 
                     (typeof globalThis !== 'undefined' && 'REDIS_URL' in globalThis ? (globalThis as Record<string, any>).REDIS_URL : null);
    
    if (!redisUrl) {
      logger.error('REDIS_URL environment variable is not set');
      throw new Error('REDIS_URL environment variable is required');
    }
    redisCache = createRedisClient(redisUrl, options);
  }

  return redisCache;
}

let redisSub: ExtendedRedis;
export function getRedisSub() {
  if (!redisSub) {
    // Access environment variables properly in both Node.js and Cloudflare Workers
    const redisUrl = process.env.REDIS_URL || 
                     (typeof globalThis.process !== 'undefined' ? globalThis.process.env?.REDIS_URL : null) || 
                     (typeof globalThis !== 'undefined' && 'REDIS_URL' in globalThis ? (globalThis as Record<string, any>).REDIS_URL : null);
    
    if (!redisUrl) {
      logger.error('REDIS_URL environment variable is not set');
      throw new Error('REDIS_URL environment variable is required');
    }
    redisSub = createRedisClient(redisUrl, options);
  }

  return redisSub;
}

let redisPub: ExtendedRedis;
export async function getRedisPub() {
  if (!redisPub) {
    // Access environment variables properly in both Node.js and Cloudflare Workers
    const redisUrl = process.env.REDIS_URL || 
                     (typeof globalThis.process !== 'undefined' ? globalThis.process.env?.REDIS_URL : null) || 
                     (typeof globalThis !== 'undefined' && 'REDIS_URL' in globalThis ? (globalThis as Record<string, any>).REDIS_URL : null);
    
    if (!redisUrl) {
      logger.error('REDIS_URL environment variable is not set');
      throw new Error('REDIS_URL environment variable is required');
    }
    redisPub = createRedisClient(redisUrl, options);
  }

  return redisPub;
}

let redisQueue: ExtendedRedis;
export async function getRedisQueue() {
  if (!redisQueue) {
    // Access environment variables properly in both Node.js and Cloudflare Workers
    const queueRedisUrl = process.env.QUEUE_REDIS_URL || 
                         (typeof globalThis.process !== 'undefined' ? globalThis.process.env?.QUEUE_REDIS_URL : null) || 
                         (typeof globalThis !== 'undefined' && 'QUEUE_REDIS_URL' in globalThis ? (globalThis as Record<string, any>).QUEUE_REDIS_URL : null) || 
                         process.env.REDIS_URL || 
                         (typeof globalThis.process !== 'undefined' ? globalThis.process.env?.REDIS_URL : null) || 
                         (typeof globalThis !== 'undefined' && 'REDIS_URL' in globalThis ? (globalThis as Record<string, any>).REDIS_URL : null);
    
    if (!queueRedisUrl) {
      logger.error('Neither QUEUE_REDIS_URL nor REDIS_URL environment variable is set');
      throw new Error('Either QUEUE_REDIS_URL or REDIS_URL environment variable is required');
    }
    
    logger.debug('Creating Redis queue client');
    redisQueue = createRedisClient(
      queueRedisUrl,
      {
        ...options,
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
        enableOfflineQueue: true,
        reconnectOnError: (err) => {
          const targetErrors = ['READONLY', 'ETIMEDOUT', 'ECONNREFUSED', 'ECONNRESET'];
          const shouldReconnect = targetErrors.some(targetError => 
            err.message.includes(targetError)
          );
          
          if (shouldReconnect) {
            logger.warn(`Redis error encountered, reconnecting: ${err.message}`);
            return 1; // Reconnect for specific errors
          }
          
          logger.error(`Redis error encountered, not reconnecting: ${err.message}`);
          return false; // Don't reconnect for other errors
        }
      },
    );
  }

  return redisQueue;
}

export async function getLock(key: string, value: string, timeout: number) {
  const lock = await getRedisCache().set(key, value, 'PX', timeout, 'NX');
  return lock === 'OK';
}