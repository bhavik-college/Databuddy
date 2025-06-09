import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { db, eq, domains } from '@databuddy/db';
import { redis } from '@databuddy/redis';
import type { AppVariables } from '../../types';
import { authMiddleware } from '../../middleware/auth';
import { logger } from '../../lib/logger';

const OPR_API_KEY = process.env.OPR_API_KEY;
const OPR_API_URL = 'https://openpagerank.com/api/v1.0/getPageRank';
const OPR_HISTORY_URL = 'https://openpagerank.com/openpagerank/get_rank_history';
const OPR_DISTRIBUTION_URL = 'https://openpagerank.com/openpagerank/get_rank_distribution';
const CACHE_TTL = 3600; // 1 hour
const HISTORY_CACHE_TTL = 86400; // 24 hours (history changes less frequently)
const CACHE_PREFIX = 'domain-rank:';
const HISTORY_CACHE_PREFIX = 'domain-history:';
const DISTRIBUTION_CACHE_PREFIX = 'domain-distribution:';
const RATE_LIMIT_PREFIX = 'opr-rate-limit:';
const RATE_LIMIT_WINDOW = 3600; // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 1000; // Adjust based on your OPR plan

const domainRankSchema = z.object({
  status_code: z.number(),
  error: z.string(),
  page_rank_integer: z.coerce.number(),
  page_rank_decimal: z.coerce.number(),
  rank: z.string().nullable(),
  domain: z.string(),
});

const oprResponseSchema = z.object({
  status_code: z.number(),
  response: z.array(domainRankSchema),
  last_updated: z.string(),
});

const historyEntrySchema = z.object({
  date: z.string(),
  pagerank: z.number(),
});

const historyResponseSchema = z.object({
  url: z.string(),
  rank_history: z.array(historyEntrySchema),
});

const distributionResponseSchema = z.object({
  rank_distribution: z.record(z.string(), z.number()),
});

type DomainRank = z.infer<typeof domainRankSchema>;
type HistoryEntry = z.infer<typeof historyEntrySchema>;
type HistoryResponse = z.infer<typeof historyResponseSchema>;
type DistributionResponse = z.infer<typeof distributionResponseSchema>;

// Rate limiting helper
async function checkRateLimit(): Promise<boolean> {
  if (!OPR_API_KEY) return false;
  
  const key = `${RATE_LIMIT_PREFIX}requests`;
  const current = await redis.get(key);
  
  if (!current) {
    await redis.setex(key, RATE_LIMIT_WINDOW, '1');
    return true;
  }
  
  const count = Number.parseInt(current, 10);
  if (count >= RATE_LIMIT_MAX_REQUESTS) {
    logger.warn('OPR API rate limit exceeded', { current_count: count });
    return false;
  }
  
  await redis.incr(key);
  return true;
}

// Enhanced error handling wrapper for API calls
async function safeApiCall<T>(
  apiCall: () => Promise<T>, 
  fallback: T,
  context: string
): Promise<T> {
  if (!await checkRateLimit()) {
    logger.warn(`Skipping ${context} due to rate limit`);
    return fallback;
  }
  
  try {
    return await apiCall();
  } catch (error) {
    logger.error(`${context} failed`, { error });
    return fallback;
  }
}

async function fetchFromOPR(domains: string[]): Promise<DomainRank[]> {
  if (!OPR_API_KEY || domains.length === 0) return [];

  try {
    const params = new URLSearchParams();
    for (const domain of domains) {
      params.append('domains[]', domain);
    }
    
    const response = await fetch(`${OPR_API_URL}?${params.toString()}`, {
      headers: { 'API-OPR': OPR_API_KEY },
    });

    if (!response.ok) {
      logger.error('OPR API failed', { status: response.status });
      return [];
    }

    const data = oprResponseSchema.parse(await response.json());

    return data.response.map(item => ({
      ...item,
      page_rank_decimal: item.page_rank_decimal * 10
    }));
  } catch (error) {
    logger.error('OPR API error', { error });
    return [];
  }
}

async function getDomainRanks(domainList: string[]): Promise<Record<string, DomainRank | null>> {
    if (domainList.length === 0) return {};
  
    const results: Record<string, DomainRank | null> = {};
    const uncachedDomains: string[] = [];
    
    if (domainList.length > 0) {
      const cacheKeys = domainList.map(d => `${CACHE_PREFIX}${d}`);
      const cached = await redis.mget(cacheKeys);
      
      cached.forEach((value, index) => {
        const domain = domainList[index];
        if (value) {
          results[domain] = JSON.parse(value);
        } else {
          uncachedDomains.push(domain);
        }
      });
    }
  
    if (uncachedDomains.length > 0) {
      const freshData = await fetchFromOPR(uncachedDomains);
      const pipeline = redis.pipeline();
  
      const foundDomains = new Set(freshData.map(d => d.domain));
      
      for (const rank of freshData) {
        results[rank.domain] = rank;
        pipeline.setex(`${CACHE_PREFIX}${rank.domain}`, CACHE_TTL, JSON.stringify(rank));
      }
  
      for (const domain of uncachedDomains) {
        if (!foundDomains.has(domain)) {
          results[domain] = null;
        }
      }
  
      await pipeline.exec();
    }
  
    return results;
  }

export const domainInfoRouter = new Hono<{ Variables: AppVariables }>();
domainInfoRouter.use('*', authMiddleware);

domainInfoRouter.get('/:domain_id', 
  zValidator('param', z.object({ domain_id: z.string().min(1) })), 
  async (c) => {
    const { domain_id } = c.req.valid('param');
    const user = c.get('user');

    try {
      const domain = await db.query.domains.findFirst({
        where: eq(domains.id, domain_id),
      });

      if (!domain || domain.userId !== user.id) {
        return c.json({ success: false, error: 'Domain not found' }, 404);
      }
      
      const rankData = await getDomainRanks([domain.name]);
      const result = rankData[domain.name];

      if (!result) {
        return c.json({ success: false, error: 'Could not retrieve domain rank' }, 500);
      }

      return c.json({ success: true, data: result });
    } catch (error) {
      logger.error('Domain rank fetch failed', { error, domain_id, userId: user.id });
      return c.json({ success: false, error: 'Internal error' }, 500);
    }
  }
);

domainInfoRouter.get('/batch/all', async (c) => {
  const user = c.get('user');

  try {
    const userDomains = await db.query.domains.findMany({
      where: eq(domains.userId, user.id),
    });

    if (userDomains.length === 0) {
      return c.json({ success: true, data: {} });
    }

    const domainNames = userDomains.map(d => d.name);
    const rankData = await getDomainRanks(domainNames);

    const result = userDomains.reduce((acc, domain) => {
      acc[domain.id] = rankData[domain.name] || null;
      return acc;
    }, {} as Record<string, DomainRank | null>);

    return c.json({ success: true, data: result });
  } catch (error) {
    logger.error('Batch domain ranks failed', { error, userId: user.id });
    return c.json({ success: false, error: 'Internal error' }, 500);
  }
});

export default domainInfoRouter; 