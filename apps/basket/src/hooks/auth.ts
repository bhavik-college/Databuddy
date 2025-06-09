/**
 * Website Authentication Hook for Analytics
 * 
 * This hook provides authentication for website tracking by validating 
 * client IDs and origins against registered websites.
 */

import type { MiddlewareHandler } from 'hono';
import { db, eq, websites } from '@databuddy/db';
import { cacheable } from '@databuddy/redis';
import type { AppVariables } from '../types';
import { logger } from '../lib/logger';

// Cache the website lookup
export const getWebsiteById = cacheable(
  async (id: string): Promise<any> => {
    logger.debug('Fetching website from database', { id }); // Stays, context not passed here
    return db.query.websites.findFirst({
      where: eq(websites.id, id)
    });
  },
  {
    expireInSec: 300, 
    prefix: 'website_by_id',
    staleWhileRevalidate: true,
    staleTime: 60
  }
);

/**
 * Validates if an origin header matches or is a subdomain of the allowed domain
 * 
 * @param originHeader - The Origin header value from the request
 * @param allowedDomain - The domain to validate against (can include protocol, port, www prefix)
 * @returns true if origin is valid, false otherwise
 * 
 * @example
 * isValidOrigin('https://app.example.com', 'example.com') // true
 * isValidOrigin('https://example.com', 'https://www.example.com:3000') // true  
 * isValidOrigin('https://malicious.com', 'example.com') // false
 * isValidOrigin('http://localhost:3000', 'localhost') // true
 */
export function isValidOrigin(originHeader: string, allowedDomain: string): boolean {
  // Allow requests without Origin header (same-origin requests, some mobile apps, etc.)
  if (!originHeader?.trim()) {
    return true;
  }

  // Validate inputs
  if (!allowedDomain?.trim()) {
    logger.warn(new Error('[isValidOrigin] No allowed domain provided'));
    return false;
  }

  try {
    const normalizedAllowedDomain = normalizeDomain(allowedDomain.trim());
    const originUrl = new URL(originHeader.trim());
    const normalizedOriginDomain = normalizeDomain(originUrl.hostname);

    // Exact match
    if (normalizedOriginDomain === normalizedAllowedDomain) {
      return true;
    }

    // Subdomain match - ensure we're checking against the root domain
    if (isSubdomain(normalizedOriginDomain, normalizedAllowedDomain)) {
      return true;
    }

    return false;
  } catch (error) {
    // Log detailed error information for debugging
    logger.error(new Error(`[isValidOrigin] Validation failed: ${error instanceof Error ? error.message : String(error)}`));
    
    // Fail closed - reject invalid origins for security
    return false;
  }
}

/**
 * Normalizes a domain by removing protocol, port, and www prefix
 * 
 * @param domain - Domain string to normalize
 * @returns Normalized domain string
 */
function normalizeDomain(domain: string): string {
  let normalized = domain.toLowerCase();

  // Remove protocol if present
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    normalized = new URL(normalized).hostname;
  } else {
    // Handle domain:port format by splitting on colon
    normalized = normalized.split(':')[0];
  }

  // Remove www prefix
  normalized = normalized.replace(/^www\./, '');

  // Validate the result is a reasonable domain
  if (!isValidDomainFormat(normalized)) {
    throw new Error(`Invalid domain format after normalization: ${normalized}`);
  }

  return normalized;
}

/**
 * Checks if originDomain is a subdomain of allowedDomain
 * 
 * @param originDomain - The origin domain to check
 * @param allowedDomain - The allowed parent domain
 * @returns true if originDomain is a subdomain of allowedDomain
 */
function isSubdomain(originDomain: string, allowedDomain: string): boolean {
  // Prevent subdomain bypass attacks like "evilexample.com" matching "example.com"
  return originDomain.endsWith(`.${allowedDomain}`) && 
         originDomain.length > allowedDomain.length + 1;
}

/**
 * Basic domain format validation
 * 
 * @param domain - Domain to validate
 * @returns true if domain appears to be valid format
 */
function isValidDomainFormat(domain: string): boolean {
  // Basic checks - not exhaustive but catches obvious issues
  return domain.length > 0 && 
         domain.length <= 253 && // RFC limit
         !domain.startsWith('.') && 
         !domain.endsWith('.') &&
         !domain.includes('..') &&
         /^[a-zA-Z0-9.-]+$/.test(domain);
}

// Enhanced version with additional security features
export function isValidOriginSecure(
  originHeader: string, 
  allowedDomain: string,
  options: {
    allowLocalhost?: boolean;
    allowedSubdomains?: string[];
    blockedSubdomains?: string[];
    requireHttps?: boolean;
  } = {}
): boolean {
  const {
    allowLocalhost = false,
    allowedSubdomains = [],
    blockedSubdomains = [],
    requireHttps = false
  } = options;

  if (!originHeader?.trim()) {
    return true;
  }

  if (!allowedDomain?.trim()) {
    return false;
  }

  try {
    const originUrl = new URL(originHeader.trim());
    
    // HTTPS requirement check
    if (requireHttps && originUrl.protocol !== 'https:') {
      return false;
    }

    // Localhost handling
    if (isLocalhost(originUrl.hostname)) {
      return allowLocalhost;
    }

    const normalizedAllowedDomain = normalizeDomain(allowedDomain.trim());
    const normalizedOriginDomain = normalizeDomain(originUrl.hostname);

    // Exact match
    if (normalizedOriginDomain === normalizedAllowedDomain) {
      return true;
    }

    // Subdomain checks
    if (isSubdomain(normalizedOriginDomain, normalizedAllowedDomain)) {
      const subdomain = normalizedOriginDomain.replace(`.${normalizedAllowedDomain}`, '');
      
      // Check blocked subdomains
      if (blockedSubdomains.includes(subdomain)) {
        return false;
      }
      
      // Check allowed subdomains (if specified, only these are allowed)
      if (allowedSubdomains.length > 0) {
        return allowedSubdomains.includes(subdomain);
      }
      
      return true;
    }

    return false;
  } catch (error) {
    logger.error(new Error(`[isValidOriginSecure] Validation failed: ${error instanceof Error ? error.message : String(error)}`));
    
    return false;
  }
}

/**
 * Checks if a hostname is localhost
 */
function isLocalhost(hostname: string): boolean {
  const localhostPatterns = [
    'localhost',
    '127.0.0.1',
    '::1',
    '0.0.0.0'
  ];
  
  return localhostPatterns.includes(hostname.toLowerCase()) ||
         hostname.match(/^127\.\d+\.\d+\.\d+$/) !== null ||
         hostname.match(/^192\.168\.\d+\.\d+$/) !== null ||
         hostname.match(/^10\.\d+\.\d+\.\d+$/) !== null ||
         hostname.match(/^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/) !== null;
}

export const websiteAuthHook = (): MiddlewareHandler<{
  Variables: AppVariables;
}> => {
  return async (c, next) => {
    if (c.req.method === 'OPTIONS') {
      await next();
      return;
    }

    const requestOrigin = c.req.header('origin') || '';
    const clientId = c.req.header('databuddy-client-id') || c.req.query('client_id') || '';

    if (!clientId) {
      logger.warn('[AuthHook] Missing client ID', { url: c.req.url, origin: requestOrigin });
      return c.json({ error: 'Missing or invalid client ID' }, 401);
    }

    try {
      const website = await getWebsiteById(clientId);

      if (!website) {
        logger.warn('[AuthHook] Unknown website ID', { clientId, origin: requestOrigin });
        return c.json({ error: 'Invalid client ID' }, 401);
      }

      if (website.status !== 'ACTIVE') {
        logger.warn('[AuthHook] Inactive website', { clientId, status: website.status, origin: requestOrigin });
        return c.json({ error: 'Website is not active' }, 403);
      }

      if (requestOrigin && !isValidOrigin(requestOrigin, website.domain)) {
        logger.warn('[AuthHook] Origin mismatch', {
          clientId,
          requestOrigin,
          expectedDbDomain: website.domain
        });
        return c.json({ error: 'Origin not authorized for this client ID' }, 403);
      }

      c.set('website', website as any);
      await next();
    } catch (error) {
      logger.error({ message: `[AuthHook] Error validating website: ${error instanceof Error ? error.message : String(error)}`, 
        clientId, 
        origin: requestOrigin, 
        error: error instanceof Error ? error.message : String(error) 
      });
      return c.json({ error: 'Authentication error' }, 500);
    }
  };
}; 