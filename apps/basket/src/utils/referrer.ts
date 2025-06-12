/**
 * Referrer Analysis Utilities
 * 
 * Functions for analyzing referrer URLs to extract information about traffic sources.
 */

import referrers from '../lists/referrers';
import { parse } from 'tldts';

export interface ReferrerInfo {
  type: string;
  name: string;
  url: string;
  domain: string;
}

const SEARCH_PARAMS = ['q', 'query', 'search', 'p', 's', 'search_query', 'wd', 'text'];

// Ensures URL has a protocol for tldts parsing
function normalizeUrl(url: string): string {
  return url.startsWith('http') ? url : `https://${url}`;
}

export function parseReferrer(referrerUrl: string | null | undefined): ReferrerInfo {
  if (!referrerUrl) {
    return { type: 'direct', name: 'Direct', url: '', domain: '' };
  }

  try {
    const normalizedUrl = normalizeUrl(referrerUrl);
    const parsedResult = parse(normalizedUrl);

    // Extract hostname and domain, convert to lowercase for consistent matching
    // tldts should provide Punycode for IDNs in these fields.
    const tldtsHostname = parsedResult.hostname ? parsedResult.hostname.toLowerCase() : null;
    const tldtsDomain = parsedResult.domain ? parsedResult.domain.toLowerCase() : null;

    if (!tldtsHostname) {
      // If tldts cannot extract a hostname, treat as unknown with original URL string
      return { type: 'unknown', name: referrerUrl, url: referrerUrl, domain: referrerUrl };
    }

    // Special case for inputs like "example.com:" that tldts might "fix" to "example.com"
    // The tests expect the original string in these cases.
    const originalHostnamePart = referrerUrl.includes('://') 
      ? referrerUrl.substring(referrerUrl.indexOf('://') + 3)
      : referrerUrl;
    
    const isSimpleHostWithColon = originalHostnamePart.endsWith(':') && 
                                  !originalHostnamePart.substring(0, originalHostnamePart.length - 1).includes('/') && 
                                  !originalHostnamePart.substring(0, originalHostnamePart.length - 1).includes('?');

    if (isSimpleHostWithColon && tldtsHostname && !tldtsHostname.endsWith(':')) {
      return { type: 'unknown', name: referrerUrl, url: referrerUrl, domain: referrerUrl };
    }
    
    // Check if it's a known referrer (full hostname match takes precedence)
    if (tldtsHostname && tldtsHostname in referrers) {
      return { ...referrers[tldtsHostname], url: referrerUrl, domain: tldtsHostname };
    }
    // Check if it's a known referrer by base domain
    if (tldtsDomain && tldtsDomain in referrers) {
      return { ...referrers[tldtsDomain], url: referrerUrl, domain: tldtsHostname }; // Use full hostname for domain
    }
    
    // Check for search parameters in the original normalized URL
    const hasSearchParams = SEARCH_PARAMS.some(param => 
      normalizedUrl.toLowerCase().includes(`?${param.toLowerCase()}=`) || 
      normalizedUrl.toLowerCase().includes(`&${param.toLowerCase()}=`)
    );
    
    if (hasSearchParams) {
      return {
        type: 'search',
        name: tldtsHostname, // Full hostname for name
        url: referrerUrl,
        domain: tldtsDomain || tldtsHostname, // Base domain for search, fallback to full
      };
    }
    
    // Default to unknown
    return {
      type: 'unknown',
      name: tldtsHostname, // Full hostname for name
      url: referrerUrl,
      domain: tldtsDomain || tldtsHostname, // Base domain for unknown, fallback to full
    };
  } catch (e) {
    // Catch-all for any errors during parsing
    return { type: 'unknown', name: referrerUrl, url: referrerUrl, domain: referrerUrl };
  }
}

/**
 * Categorize referrer sources into main categories
 */
export function categorizeReferrer({ type }: ReferrerInfo): string {
  const categories: Record<string, string> = {
    search: 'Search Engine',
    social: 'Social Media',
    email: 'Email',
    ads: 'Advertising',
    direct: 'Direct'
  };
  
  return categories[type] || 'Other';
} 