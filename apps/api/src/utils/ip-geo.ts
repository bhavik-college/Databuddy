import { cacheable } from '../lib/redis';
import { createLogger } from '../lib/logger';
import { z } from 'zod';

const logger = createLogger('ip-geo');

// Helper function to access environment variables in both Node.js and Cloudflare Workers
function getEnv(key: string) {
  return process.env[key] || 
         (typeof globalThis.process !== 'undefined' ? globalThis.process.env?.[key] : null) || 
         (typeof globalThis !== 'undefined' && key in globalThis ? (globalThis as Record<string, any>)[key] : null);
}

const GeoLocationSchema = z.object({
  ip: z.string(),
  city: z.string().optional(),
  region: z.string().optional(),
  country: z.string().optional(),
  loc: z.string().optional(),
  org: z.string().optional(),
  timezone: z.string().optional(),
});

type GeoLocation = z.infer<typeof GeoLocationSchema>;

const DEFAULT_GEO: GeoLocation = {
  ip: '',
  city: undefined,
  region: undefined,
  country: undefined,
  loc: undefined,
  org: undefined,
  timezone: undefined,
};

const ignore = ['127.0.0.1', '::1'];

function urlConstructor(ip: string) {
  return `https://ipinfo.io/${ip}?token=${getEnv('IPINFO_TOKEN')}`;
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
      logger.warn('Failed to fetch geo location', { status: response.status });
      return DEFAULT_GEO;
    }

    const data = await response.json();
    const parsed = GeoLocationSchema.safeParse(data);

    if (!parsed.success) {
      logger.warn('Invalid geo location data', { error: parsed.error });
      return DEFAULT_GEO;
    }

    return parsed.data;
  } catch (error) {
    logger.error('Error fetching geo location', { error });
    return DEFAULT_GEO;
  }
}

// Cache geo location data for 24 hours
export const getGeoLocation = cacheable(fetchIpGeo, {
  expireInSec: 60 * 60 * 24,
  prefix: 'geo',
  staleWhileRevalidate: true,
  staleTime: 60 * 60 * 12, // Start revalidating after 12 hours
});

// Helper to get client IP from request
export function getClientIp(req: Request): string | undefined {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip') || undefined;
}

// Main function to get geo location from request
export async function parseIp(req: Request): Promise<GeoLocation> {
  const ip = getClientIp(req);
  return getGeoLocation(ip || '');
}

/**
 * Anonymizes an IP address by removing the last octet for IPv4 
 * or the last 80 bits for IPv6
 */
export function anonymizeIp(ip: string): string {
  if (!ip) {
    return '';
  }

  // Check if it's IPv4
  if (ip.includes('.')) {
    // Replace last octet with zeros
    return ip.replace(/\.\d+$/, '.0');
  } 
  // Handle IPv6
  else if (ip.includes(':')) {
    // Keep first 48 bits (first 3 groups), zero out the rest
    const parts = ip.split(':');
    const anonymized = parts.slice(0, 3).concat(Array(parts.length - 3).fill('0000')).join(':');
    return anonymized;
  }
  
  return ip;
}

export async function getGeoData(ip: string): Promise<GeoLocation> {
  const geo = await getGeoLocation(ip);
  return {
    ip: geo.ip,
    city: geo.city,
    region: geo.region,
    country: geo.country,
    loc: geo.loc,
    org: geo.org,
    timezone: geo.timezone,
  };
}

