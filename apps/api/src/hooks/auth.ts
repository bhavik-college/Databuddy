/**
 * Website Authentication Hook for Analytics
 * 
 * This hook provides authentication for website tracking by validating 
 * client IDs and origins against registered websites.
 */

import { MiddlewareHandler } from 'hono';
import { createLogger } from '@databuddy/logger';
import { prisma, WebsiteStatus, Website } from '@databuddy/db';
import { cacheable } from '@databuddy/redis';
import { AppVariables } from '../types';

// Initialize logger
const logger = createLogger('website-auth');

// Cache the website lookup for 5 minutes
export const getWebsiteById = cacheable(
  async (id: string): Promise<Website | null> => {
    logger.debug('Fetching website from database', { id });
    return prisma.website.findUnique({
      where: { id }
    });
  },
  {
    expireInSec: 300, // 5 minutes
    prefix: 'website_by_id',
    staleWhileRevalidate: true,
    staleTime: 60 // Refresh if less than 60 seconds TTL remains
  }
);

// Helper function to check if a URL origin is valid for a domain
export function isValidOrigin(origin: string, domain: string): boolean {
  // If no origin provided, don't validate
  if (!origin) return true;
  
  try {
    // Try to parse the domain as a URL if it looks like one
    let domainHostname = domain;
    if (domain.startsWith('http://') || domain.startsWith('https://')) {
      domainHostname = new URL(domain).hostname;
    }
    
    // Get hostname from origin
    const hostname = new URL(origin).hostname;
    
    // Check exact domain match
    if (hostname === domainHostname) return true;
    
    // Check if hostname is a subdomain of the registered domain
    // e.g., app.example.com should be valid for example.com
    const domainParts = domainHostname.split('.');
    const hostnameParts = hostname.split('.');
    
    if (hostnameParts.length >= domainParts.length) {
      const hostnameSuffix = hostnameParts.slice(-domainParts.length).join('.');
      return hostnameSuffix === domainHostname;
    }
    
    return false;
  } catch (error) {
    logger.error('Invalid origin format', { origin, domain, error });
    return false;
  }
}

// Create website authentication middleware with proper typing
export const websiteAuthHook = (): MiddlewareHandler<{
  Variables: AppVariables;
}> => {
  return async (c, next) => {
    const clientId = c.req.header('databuddy-client-id');
    const origin = c.req.header('origin') || '';
    
    // Handle the case where clientId is literally the string "undefined"
    if (!clientId || clientId === 'undefined') {
      return c.json({ error: 'Missing or invalid client ID' }, 401);
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
      if (website.status !== WebsiteStatus.ACTIVE) {
        logger.warn('Inactive website', { clientId, status: website.status });
        return c.json({ error: 'Website is not active' }, 403);
      }
      
      // Validate origin against domain if origin header is present
      if (origin && !isValidOrigin(origin, website.domain)) {
        logger.warn('Origin mismatch', { 
          clientId, 
          origin, 
          expectedDomain: website.domain 
        });
        return c.json({ error: 'Origin not authorized for this client ID' }, 403);
      }
      
      // Add website to context for later use
      c.set('website', website);
      
      await next();
    } catch (error) {
      logger.error('Error validating website', { clientId, error });
      return c.json({ error: 'Authentication error', details: error }, 500);
    }
  };
}; 