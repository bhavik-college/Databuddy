import { createHash } from 'node:crypto';
import type { City } from '@maxmind/geoip2-node';
import {
  AddressNotFoundError,
  BadMethodCallError,
  Reader,
} from '@maxmind/geoip2-node';

interface GeoIPReader extends Reader {
  city(ip: string): City;
}

// Database configuration
const CDN_URL = 'https://cdn.databuddy.cc/GeoLite2-City.mmdb';

let reader: GeoIPReader | null = null;
let isLoading = false;
let loadPromise: Promise<void> | null = null;
let loadError: Error | null = null;

async function loadDatabaseFromCdn(): Promise<Buffer> {
  try {
    const response = await fetch(CDN_URL);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch database from CDN: ${response.status} ${response.statusText}`
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const dbBuffer = Buffer.from(arrayBuffer);

    // Validate that we got a reasonable file size (should be ~50-100MB)
    if (dbBuffer.length < 1_000_000) {
      // Less than 1MB
      throw new Error(
        `Database file seems too small: ${dbBuffer.length} bytes`
      );
    }

    return dbBuffer;
  } catch (error) {
    console.error('Failed to load database from CDN:', error);
    throw error;
  }
}

async function loadDatabase() {
  if (loadError) {
    throw loadError;
  }

  if (isLoading && loadPromise) {
    return loadPromise;
  }

  if (reader) {
    return;
  }

  isLoading = true;
  loadPromise = (async () => {
    try {
      const dbBuffer = await loadDatabaseFromCdn();

      // Add a small delay to prevent overwhelming the system
      await new Promise((resolve) => setTimeout(resolve, 100));

      reader = Reader.openBuffer(dbBuffer) as GeoIPReader;
    } catch (error) {
      console.error('Failed to load GeoIP database:', error);
      loadError = error as Error;
      reader = null;
    } finally {
      isLoading = false;
    }
  })();

  return loadPromise;
}

// Don't initialize on module load - wait for first use
const ignore = ['127.0.0.1', '::1'];

// Helper function to validate IP address format
function isValidIp(ip: string): boolean {
  if (!ip) return false;

  // Check for IPv4 format
  const ipv4Regex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  if (ipv4Regex.test(ip)) return true;

  // Check for IPv6 format (basic check)
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  if (ipv6Regex.test(ip)) return true;

  return false;
}

export async function getGeoLocation(ip: string) {
  if (!ip || ignore.includes(ip) || !isValidIp(ip)) {
    return { country: undefined, region: undefined, city: undefined };
  }

  // Lazy load database on first use
  if (!(reader || isLoading || loadError)) {
    try {
      await loadDatabase();
    } catch (error) {
      console.error('Failed to load database for IP lookup:', error);
      return { country: undefined, region: undefined, city: undefined };
    }
  }

  if (!reader) {
    return { country: undefined, region: undefined, city: undefined };
  }

  try {
    const response = reader.city(ip);

    // Extract region and city data
    const region = response.subdivisions?.[0]?.names?.en;
    const city = response.city?.names?.en;

    return {
      country: response.country?.names?.en,
      region,
      city,
    };
  } catch (error) {
    // Handle AddressNotFoundError specifically (IP not in database)
    if (error instanceof AddressNotFoundError) {
      return { country: undefined, region: undefined, city: undefined };
    }

    // Handle BadMethodCallError (wrong database type)
    if (error instanceof BadMethodCallError) {
      console.error(
        'Database type mismatch - using city() method with ipinfo database'
      );
      return { country: undefined, region: undefined, city: undefined };
    }

    // Handle other errors
    console.error('Error looking up IP:', ip, error);
    return { country: undefined, region: undefined, city: undefined };
  }
}

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

  return;
}

export async function parseIp(req: Request) {
  const ip = getClientIp(req);
  return getGeoLocation(ip || '');
}

export function anonymizeIp(ip: string): string {
  if (!ip) return '';

  const salt = process.env.IP_HASH_SALT || 'databuddy-ip-salt';
  const hash = createHash('sha256');
  hash.update(`${ip}${salt}`);
  return hash.digest('hex').substring(0, 12);
}

export async function getGeo(ip: string) {
  const geo = await getGeoLocation(ip);
  return {
    anonymizedIP: anonymizeIp(ip),
    country: geo.country,
    region: geo.region,
    city: geo.city,
  };
}

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
