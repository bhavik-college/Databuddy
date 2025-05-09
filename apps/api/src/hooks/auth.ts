/**
 * Website Authentication Hook for Analytics
 * 
 * This hook provides authentication for website tracking by validating 
 * client IDs and origins against registered websites.
 */

import type { MiddlewareHandler } from 'hono';
import { db, eq, websites } from '@databuddy/db';
import type { websiteStatus } from '@databuddy/db';
import { cacheable } from '@databuddy/redis';
import type { AppVariables } from '../types';
import { logger } from '../lib/logger';

// Define WebsiteStatus type from the enum values
type WebsiteStatus = typeof websiteStatus.enumValues[number];

// Cache the website lookup for 5 minutes
export const getWebsiteById = cacheable(
  async (id: string): Promise<any> => {
    logger.debug('Fetching website from database', { id });
    return db.query.websites.findFirst({
      where: eq(websites.id, id)
    });
  },
  {
    expireInSec: 300, // 5 minutes
    prefix: 'website_by_id',
    staleWhileRevalidate: true,
    staleTime: 60 // Refresh if less than 60 seconds TTL remains
  }
);

// Helper function to check if domain is localhost
export function isLocalhost(domain: string): boolean {
  const hostnamePattern = /^localhost(:\d+)?$|^127\.0\.0\.1(:\d+)?$/i;
  
  try {
    // Check if domain is a URL
    if (domain.startsWith('http://') || domain.startsWith('https://')) {
      const hostname = new URL(domain).hostname;
      return hostnamePattern.test(hostname);
    }
    
    // Check domain directly
    return hostnamePattern.test(domain);
  } catch (error) {
    logger.error('Error checking if domain is localhost', { domain, error });
    return false;
  }
}

// Helper function to check if a URL origin is valid for a domain
export function isValidOrigin(origin: string, domain: string): boolean {
  // If no origin provided, don't validate
  if (!origin) return true;
  
  try {
    // Normalize domain by removing protocol if present and handling ports, then www.
    let domainHostname = domain;
    if (domain.startsWith('http://') || domain.startsWith('https://')) {
      const domainUrl = new URL(domain);
      domainHostname = domainUrl.hostname + (domainUrl.port ? `:${domainUrl.port}` : '');
    }
    domainHostname = domainHostname.replace(/^www\./, '');
    
    // Get hostname and port from origin, then remove www.
    const originUrl = new URL(origin);
    let hostname = originUrl.hostname + (originUrl.port ? `:${originUrl.port}` : '');
    hostname = hostname.replace(/^www\./, '');
    
    logger.debug('isValidOrigin check', {
      originalOrigin: origin,
      normalizedOriginHostname: hostname,
      originalDbDomain: domain,
      normalizedDbDomainHostname: domainHostname
    });

    // Check exact domain match
    if (hostname === domainHostname) return true;
    
    // Check if hostname is a subdomain of the registered domain
    // e.g., app.example.com should be valid for example.com
    // This check needs to be against the normalized domainHostname
    if (hostname.endsWith(`.${domainHostname}`)) return true;
    
    return false;
  } catch (error) {
    logger.error('Invalid origin format for isValidOrigin', { origin, domain, error });
    return false;
  }
}

// Create website authentication middleware with proper typing
export const websiteAuthHook = (): MiddlewareHandler<{
  Variables: AppVariables;
}> => {
  return async (c, next) => {
    // First try to get client ID from header
    let clientId = c.req.header('databuddy-client-id');
    const origin = c.req.header('origin') || '';

    
    // If no header, try to get from URL parameters (for beacon API compatibility)
    if (!clientId || clientId === 'undefined') {
      const url = new URL(c.req.url);
      clientId = url.searchParams.get('client_id') || '';
      
      
      // If still no client ID, return 401
      if (!clientId) {
        logger.warn('Missing client ID', { url: c.req.url });
        return c.json({ error: 'Missing or invalid client ID' }, 401);
      }
    }
    
    // For beacon requests also get SDK info from URL if not in headers
    let sdkName = c.req.header('databuddy-sdk-name');
    let sdkVersion = c.req.header('databuddy-sdk-version');
    
    if (!sdkName) {
      const url = new URL(c.req.url);
      sdkName = url.searchParams.get('sdk_name') || 'web';
    }
    
    if (!sdkVersion) {
      const url = new URL(c.req.url);
      sdkVersion = url.searchParams.get('sdk_version') || '1.0.0';
    }
    
    try {
      // Look up website in Redis cache, falling back to database
      const website = await getWebsiteById(clientId);
      
      // If website doesn't exist, reject
      if (!website) {
        logger.warn('Unknown website ID', { clientId });
        return c.json({ error: 'Invalid client ID' }, 401);
      }
      
      // If website is inactive, reject
      if (website.status !== 'ACTIVE') {
        logger.warn('Inactive website', { clientId, status: website.status });
        return c.json({ error: 'Website is not active' }, 403);
      }
      
      // Validate origin against domain if origin header is present
      if (origin && !isValidOrigin(origin, website.domain)) {
        logger.warn('Origin mismatch', { 
          name: 'websiteAuthHook',
          clientId, 
          origin, 
          expectedDomain: website.domain 
        });
        return c.json({ error: 'Origin not authorized for this client ID' }, 403);
      }
      
      // Set the website in the context
      c.set('website', {
        id: website.id,
        name: website.name,
        domain: website.domain,
        status: website.status as WebsiteStatus,
        userId: website.userId,
        projectId: website.projectId,
        createdAt: website.createdAt,
        updatedAt: website.updatedAt,
        deletedAt: website.deletedAt
      });
      
      await next();
    } catch (error) {
      logger.error('Error validating website', { clientId, origin, error: error instanceof Error ? error.message : String(error) });
      return c.json({ error: 'Authentication error', message: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  };
}; 