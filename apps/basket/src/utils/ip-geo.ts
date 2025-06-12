import { cacheable } from '@databuddy/redis';
import { z } from 'zod';
import { logger } from '../lib/logger';
import { createHash } from 'node:crypto';


const GeoLocationSchema = z.object({
  ip: z.string(),
  region: z.string().optional(),
  country: z.string().optional(),
  timezone: z.string().optional(),
});

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
    return DEFAULT_GEO;
  }

  try {
    const url = urlConstructor(ip);
    const response = await fetch(url, {
      signal: AbortSignal.timeout(4000),
    });

    if (!response.ok) {
      // 404 is expected for unknown IPs, don't warn
      if (response.status === 404) {
        logger.debug(`IP not found in geo database: ${ip}`);
      } else {
        logger.warn(new Error(`Failed to fetch geo location: ${response.status}`));
      }
      return DEFAULT_GEO;
    }

    const data = await response.json();
    const parsed = GeoLocationSchema.safeParse(data);

    if (!parsed.success) {
        logger.warn({ message: `Invalid geo location data: ${parsed.error}` });
        return DEFAULT_GEO;
    }

    return parsed.data;
  } catch (error) {
    logger.error({ message: `Error fetching geo location: ${error}` });
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

// Helper to get client IP from request
export function getClientIp(req: Request): string | undefined {
  return req.headers.get('cf-connecting-ip') || undefined;
}

// Main function to get geo location from request
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

