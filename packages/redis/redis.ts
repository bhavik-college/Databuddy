import { SuperJSON } from 'superjson';
import type { RedisOptions } from 'ioredis';
import Redis from 'ioredis';

// Initialize logger
const logger = console;

// Helper function to access environment variables in both Node.js and Cloudflare Workers
function getEnv(key: string) {
  return process.env[key] || 
         (typeof globalThis.process !== 'undefined' ? globalThis.process.env?.[key] : null) || 
         (typeof globalThis !== 'undefined' && key in globalThis ? (globalThis as Record<string, any>)[key] : null);
}

const options: RedisOptions = {
  connectTimeout: 10000,
  retryStrategy: (times) => {
    const delay = Math.min(times * 100, 3000);
    return delay;
  },
  maxRetriesPerRequest: 3
};

export { Redis };

interface ExtendedRedis extends Redis {
  getJson: <T = any>(key: string) => Promise<T | null>;
  setJson: <T = any>(
    key: string,
    value: T,
    expireInSec: number,
  ) => Promise<void>;
}

const createRedisClient = (
  url: string,
  overrides: RedisOptions = {},
): ExtendedRedis => {
  
  const client = new Redis(url, {
    ...options,
    ...overrides,
  }) as ExtendedRedis;

  client.on('error', (error) => {
    logger.error('Redis Client Error:', error);
  });

  client.on('connect', () => {
    // logger.debug('Redis client connected');
  });

  client.on('ready', () => {
    // logger.debug('Redis client ready');
  });

  client.on('reconnecting', () => {
    // logger.debug('Redis client reconnecting');
  });

  client.getJson = async <T = any>(key: string): Promise<T | null> => {
    const value = await client.get(key);
    if (!value) return null;
    
    try {
      const res = SuperJSON.parse(value) as T;
      
      // Check for empty collections
      if ((Array.isArray(res) && res.length === 0) || 
          (res && typeof res === 'object' && Object.keys(res).length === 0)) {
        return null;
      }
      
      return res;
    } catch (err) {
      logger.error(`Error parsing JSON for key ${key}:`, err);
      return null;
    }
  };

  client.setJson = async <T = any>(
    key: string,
    value: T,
    expireInSec: number,
  ): Promise<void> => {
    await client.setex(key, expireInSec, SuperJSON.stringify(value));
  };

  return client;
};

let redisCache: ExtendedRedis;
let isConnecting = false;

export function getRedisCache() {
  if (!redisCache && !isConnecting) {
    const redisUrl = getEnv('REDIS_URL');
    if (!redisUrl) {
      logger.error('REDIS_URL environment variable is not set');
      throw new Error('REDIS_URL environment variable is required');
    }
    
    isConnecting = true;
    redisCache = createRedisClient(redisUrl, options);
    isConnecting = false;
  }

  return redisCache;
}

export async function getLock(key: string, value: string, timeout: number) {
  const lock = await getRedisCache().set(key, value, 'PX', timeout, 'NX');
  return lock === 'OK';
}