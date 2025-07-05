import { cacheable } from '@databuddy/redis';
import { z } from 'zod';
import { logger } from '../lib/logger';
import { createHash } from 'node:crypto';


const GeoLocationSchema = z.object({
  ip: z.string().optional(),
  region: z.string().optional(),
  country: z.string().optional(),
  timezone: z.string().optional(),
  city: z.string().optional(),
  org: z.string().optional(),
  postal: z.string().optional(),
  loc: z.string().optional(),
}).transform((data) => ({
  ip: data.ip || '',
  region: data.region,
  country: data.country,
  timezone: data.timezone,
}));

type GeoLocation = z.infer<typeof GeoLocationSchema>;

const DEFAULT_GEO: GeoLocation = {
  ip: '',
  region: undefined,
  country: undefined,
  timezone: undefined,
};

const ignore = ['127.0.0.1', '::1'];

const IPINFO_TOKEN = process.env.IPINFO_TOKEN;

function urlConstructor(ip: string) {
  return `https://ipinfo.io/${ip}?token=${IPINFO_TOKEN}`;
}

async function fetchIpGeo(ip: string): Promise<GeoLocation> {
  if (!ip || ignore.includes(ip)) {
    logger.debug(`Skipping geo lookup for empty or localhost IP: ${ip}`);
    return DEFAULT_GEO;
  }

  // Check if IPINFO_TOKEN is configured
  if (!IPINFO_TOKEN) {
    logger.warn(new Error('IPINFO_TOKEN not configured - geo location will be unknown'));
    return DEFAULT_GEO;
  }

  try {
    const url = urlConstructor(ip);
    logger.debug(`Fetching geo location for IP: ${ip.substring(0, 8)}...`);

    const response = await fetch(url, {
      signal: AbortSignal.timeout(4000),
    });

    if (!response.ok) {
      // 404 is expected for unknown IPs, don't warn
      if (response.status === 404) {
        logger.debug(`IP not found in geo database: ${ip.substring(0, 8)}...`);
      } else if (response.status === 429) {
        logger.warn(new Error(`Rate limited by IPInfo API: ${response.status}`));
      } else if (response.status === 401) {
        logger.error(new Error(`Invalid IPINFO_TOKEN: ${response.status}`));
      } else {
        logger.warn(new Error(`Failed to fetch geo location: ${response.status} for IP ${ip.substring(0, 8)}...`));
      }
      return DEFAULT_GEO;
    }

    const data = await response.json();
    logger.debug(`Received geo data for IP ${ip.substring(0, 8)}...:`, {
      country: (data as any)?.country,
      region: (data as any)?.region
    });

    const parsed = GeoLocationSchema.safeParse(data);

    if (!parsed.success) {
      logger.warn(new Error(`Invalid geo location data: ${parsed.error.message}`));
      return DEFAULT_GEO;
    }

    return parsed.data;
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      logger.warn(new Error(`Geo location API timeout for IP ${ip.substring(0, 8)}...`));
    } else {
      logger.error(new Error(`Error fetching geo location for IP ${ip.substring(0, 8)}...: ${error}`));
    }
    return DEFAULT_GEO;
  }
}

// Cache geo location data for 24 hours with Redis fallback
export const getGeoLocation = async (ip: string): Promise<GeoLocation> => {
  try {
    // Try with caching first
    const cachedFn = cacheable(fetchIpGeo, {
      expireInSec: 60 * 60 * 24,
      prefix: 'geo',
      staleWhileRevalidate: true,
      staleTime: 60 * 60 * 12,
    });
    return await cachedFn(ip);
  } catch (error) {
    // If caching fails, fall back to direct function call
    logger.warn(new Error(`Redis caching failed for geo lookup, falling back to direct call: ${error instanceof Error ? error.message : String(error)}`));
    return await fetchIpGeo(ip);
  }
};

export function getClientIp(req: Request): string | undefined {
  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp;

  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0]?.trim();
    if (firstIp) return firstIp;
  }

  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp;

  return undefined;
}

export async function parseIp(req: Request): Promise<GeoLocation> {
  const ip = getClientIp(req);
  return getGeoLocation(ip || '');
}

/**
 * Anonymizes an IP address using a one-way hash function
 * This ensures IP addresses cannot be reverse-engineered
 */
export function anonymizeIp(ip: string): string {
  if (!ip) {
    return '';
  }

  // Use a static salt for consistent hashing across requests
  const salt = process.env.IP_HASH_SALT || 'databuddy-ip-anonymization-salt-2024';

  try {
    // Hash the full IP with salt for complete anonymization
    const hash = createHash('sha256');
    hash.update(`${ip}${salt}`);

    // Return first 12 characters of hash for storage efficiency
    return hash.digest('hex').substring(0, 12);
  } catch (error) {
    // Fallback to empty string if hashing fails
    return '';
  }
}

export async function getGeoData(ip: string): Promise<GeoLocation> {
  const geo = await getGeoLocation(ip);
  return {
    ip: anonymizeIp(geo.ip),
    region: geo.region,
    country: geo.country,
    timezone: geo.timezone,
  };
}

/**
 * Extract IP address from request headers with proper fallback chain
 */
export function extractIpFromRequest(request: Request): string {
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();

  const forwardedFor = request.headers.get('x-forwarded-for');
  const firstIp = forwardedFor?.split(',')[0]?.trim();
  if (firstIp) return firstIp;

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  return '';
}

/**
 * Simple function to get anonymized IP, country, and region
 */
export async function getGeo(ip: string): Promise<{ anonymizedIP: string; country?: string; region?: string }> {
  const geo = await getGeoLocation(ip);
  return {
    anonymizedIP: anonymizeIp(ip),
    country: geo.country,
    region: geo.region,
  };
}

