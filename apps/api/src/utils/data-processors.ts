/**
 * Data Processing Utilities
 * 
 * Reusable functions for processing analytics data
 */

import { formatTime, formatCleanPath } from './analytics-helpers';

/**
 * Generic function to group data by a key and aggregate values
 */
export function groupAndAggregate<T>(
  data: T[], 
  keyFn: (item: T) => string, 
  aggregateFn: (existing: any, item: T) => any,
  initialValue: (item: T) => any
) {
  const map = new Map();
  
  for (const item of data) {
    const key = keyFn(item);
    if (!key) continue;
    
    if (map.has(key)) {
      const existing = map.get(key);
      map.set(key, aggregateFn(existing, item));
    } else {
      map.set(key, initialValue(item));
    }
  }
  
  return Array.from(map.values());
}

/**
 * Sort and limit data by a numeric field
 */
export function sortAndLimit<T>(
  data: T[],
  sortField: string,
  limit: number,
  descending = true
): T[] {
  return data
    .sort((a, b) => {
      const aVal = (a as any)[sortField];
      const bVal = (b as any)[sortField];
      return descending ? bVal - aVal : aVal - bVal;
    })
    .slice(0, limit);
}

/**
 * Filter and map data with type safety
 */
export function filterAndMap<T, R>(
  data: T[],
  filterFn: (item: T) => boolean,
  mapFn: (item: T) => R
): R[] {
  return data.filter(filterFn).map(mapFn);
}

/**
 * Process pages data from enhanced pages builder
 */
export function processPages(pagesData: any[]): any[] {
  // Create a map to merge duplicate paths
  const pathMap = new Map();
  
  pagesData.forEach(page => {
    const cleanPath = formatCleanPath(page.path) || '/';
    
    if (pathMap.has(cleanPath)) {
      // Merge with existing entry
      const existing = pathMap.get(cleanPath);
      existing.pageviews += page.pageviews || 0;
      existing.visitors += page.visitors || 0;
      
      // For avg_time_on_page, we need to calculate weighted average
      const existingTime = existing.avg_time_on_page || 0;
      const newTime = page.avg_time_on_page || 0;
      const existingViews = existing.pageviews - (page.pageviews || 0);
      const newViews = page.pageviews || 0;
      const totalViews = existingViews + newViews;
      
      if (totalViews > 0) {
        existing.avg_time_on_page = ((existingTime * existingViews) + (newTime * newViews)) / totalViews;
      }
    } else {
      // Create new entry
      pathMap.set(cleanPath, {
        path: cleanPath,
        title: page.title || cleanPath,
        pageviews: page.pageviews || 0,
        visitors: page.visitors || 0,
        avg_time_on_page: page.avg_time_on_page,
        avg_time_on_page_formatted: formatTime(page.avg_time_on_page)
      });
    }
  });
  
  // Convert map back to array and sort by pageviews
  return Array.from(pathMap.values())
    .sort((a, b) => b.pageviews - a.pageviews)
    .map(page => ({
      ...page,
      avg_time_on_page_formatted: formatTime(page.avg_time_on_page)
    }));
}

/**
 * Process device info data
 */
export function processDeviceInfo(deviceInfoData: any[]) {
  const deviceTypes = groupAndAggregate(
    deviceInfoData,
    item => `${item.device_type}-${item.device_brand}-${item.device_model}`,
    (existing, item) => ({
      ...existing,
      visitors: existing.visitors + item.visitors,
      pageviews: existing.pageviews + item.pageviews
    }),
    item => ({
      device_type: item.device_type,
      device_brand: item.device_brand,
      device_model: item.device_model,
      visitors: item.visitors,
      pageviews: item.pageviews
    })
  );

  const browserVersions = groupAndAggregate(
    filterAndMap(
      deviceInfoData,
      item => item.browser_name && item.browser_name !== 'Unknown',
      item => item
    ),
    item => `${item.browser_name}-${item.browser_version}`,
    (existing, item) => ({
      ...existing,
      visitors: existing.visitors + item.visitors,
      count: existing.count + item.pageviews
    }),
    item => ({
      browser: item.browser_name,
      version: item.browser_version,
      os: item.os_name,
      os_version: item.os_version,
      count: item.pageviews,
      visitors: item.visitors
    })
  );

  const screenResolutions = groupAndAggregate(
    filterAndMap(
      deviceInfoData,
      item => item.screen_resolution && item.screen_resolution !== 'Unknown',
      item => item
    ),
    item => item.screen_resolution,
    (existing, item) => ({
      ...existing,
      visitors: existing.visitors + item.visitors,
      count: existing.count + item.pageviews
    }),
    item => ({
      resolution: item.screen_resolution,
      count: item.pageviews,
      visitors: item.visitors
    })
  );

  const connectionTypes = groupAndAggregate(
    filterAndMap(
      deviceInfoData,
      item => item.connection_type && item.connection_type !== 'Unknown',
      item => item
    ),
    item => item.connection_type,
    (existing, item) => ({
      ...existing,
      visitors: existing.visitors + item.visitors,
      pageviews: existing.pageviews + item.pageviews
    }),
    item => ({
      connection_type: item.connection_type,
      visitors: item.visitors,
      pageviews: item.pageviews
    })
  );

  return {
    device_types: sortAndLimit(deviceTypes, 'visitors', 100),
    browser_versions: sortAndLimit(browserVersions, 'visitors', 5),
    screen_resolutions: sortAndLimit(screenResolutions, 'visitors', 6),
    connection_types: sortAndLimit(connectionTypes, 'visitors', 5)
  };
}

/**
 * Process geographic info data
 */
export function processGeoInfo(geoInfoData: any[]) {
  const countries = groupAndAggregate(
    geoInfoData,
    item => item.country,
    (existing, item) => ({
      ...existing,
      visitors: existing.visitors + item.visitors,
      pageviews: existing.pageviews + item.pageviews
    }),
    item => ({
      country: item.country?.trim() ? item.country : 'Unknown',
      visitors: item.visitors,
      pageviews: item.pageviews
    })
  );

  const languages = groupAndAggregate(
    filterAndMap(
      geoInfoData,
      item => item.language && item.language !== 'Unknown',
      item => item
    ),
    item => item.language,
    (existing, item) => ({
      ...existing,
      visitors: existing.visitors + item.visitors,
      pageviews: existing.pageviews + item.pageviews
    }),
    item => ({
      language: item.language,
      visitors: item.visitors,
      pageviews: item.pageviews
    })
  );

  const timezones = groupAndAggregate(
    filterAndMap(
      geoInfoData,
      item => item.timezone && item.timezone !== 'Unknown',
      item => item
    ),
    item => item.timezone,
    (existing, item) => ({
      ...existing,
      visitors: existing.visitors + item.visitors,
      pageviews: existing.pageviews + item.pageviews
    }),
    item => ({
      timezone: item.timezone,
      visitors: item.visitors,
      pageviews: item.pageviews
    })
  );

  return {
    countries: sortAndLimit(countries, 'visitors', 5),
    languages: sortAndLimit(languages, 'visitors', 5),
    timezones: sortAndLimit(timezones, 'visitors', 5)
  };
}

/**
 * Process UTM data
 */
export function processUTMData(utmData: any[]) {
  const utmSources = groupAndAggregate(
    filterAndMap(
      utmData,
      item => item.utm_source && item.utm_source.trim() !== '',
      item => item
    ),
    item => item.utm_source,
    (existing, item) => ({
      ...existing,
      visitors: existing.visitors + item.visitors,
      pageviews: existing.pageviews + (item.visits || item.pageviews || 0)
    }),
    item => ({
      utm_source: item.utm_source,
      visitors: item.visitors,
      pageviews: item.visits || item.pageviews || 0
    })
  );

  const utmMediums = groupAndAggregate(
    filterAndMap(
      utmData,
      item => item.utm_medium && item.utm_medium.trim() !== '',
      item => item
    ),
    item => item.utm_medium,
    (existing, item) => ({
      ...existing,
      visitors: existing.visitors + item.visitors,
      pageviews: existing.pageviews + (item.visits || item.pageviews || 0)
    }),
    item => ({
      utm_medium: item.utm_medium,
      visitors: item.visitors,
      pageviews: item.visits || item.pageviews || 0
    })
  );

  const utmCampaigns = groupAndAggregate(
    filterAndMap(
      utmData,
      item => item.utm_campaign && item.utm_campaign.trim() !== '',
      item => item
    ),
    item => item.utm_campaign,
    (existing, item) => ({
      ...existing,
      visitors: existing.visitors + item.visitors,
      pageviews: existing.pageviews + (item.visits || item.pageviews || 0)
    }),
    item => ({
      utm_campaign: item.utm_campaign,
      visitors: item.visitors,
      pageviews: item.visits || item.pageviews || 0
    })
  );

  return {
    utm_sources: sortAndLimit(utmSources, 'visitors', 10),
    utm_mediums: sortAndLimit(utmMediums, 'visitors', 10),
    utm_campaigns: sortAndLimit(utmCampaigns, 'visitors', 10)
  };
}

/**
 * Process referrers data
 */
export function processReferrers(referrersData: any[], website: any, parseReferrers: any, isInternalReferrer: any) {
  const processedReferrers = parseReferrers(
    referrersData,
    true,
    (referrer: string) => isInternalReferrer(referrer, website.domain),
    website.domain
  );

  const referrerMap = new Map();
  for (const ref of processedReferrers.filter((ref: any) => ref.referrer !== 'direct')) {
    const name = ref.name || ref.domain || '';
    if (!name) continue;
    
    if (referrerMap.has(name)) {
      const existing = referrerMap.get(name);
      existing.visitors += ref.visitors;
      existing.pageviews += ref.pageviews;
    } else {
      referrerMap.set(name, {
        referrer: ref.referrer,
        visitors: ref.visitors,
        pageviews: ref.pageviews,
        type: ref.type,
        name: ref.name,
        domain: ref.domain
      });
    }
  }
  
  return sortAndLimit(Array.from(referrerMap.values()), 'visitors', 100);
}

/**
 * Process entry pages data
 */
export function processEntryPages(entryPagesData: any[]): any[] {
  if (!entryPagesData?.length) return [];
  
  const totalEntries = entryPagesData.reduce((sum, page) => sum + (page.entries || 0), 0);
  
  return entryPagesData.map(page => ({
    path: page.path,
    entries: page.entries || 0,
    visitors: page.visitors || 0,
    percentage: totalEntries > 0 ? Math.round((page.entries / totalEntries) * 100) : 0
  }));
}

/**
 * Process exit pages data
 */
export function processExitPages(exitPagesData: any[]): any[] {
  if (!exitPagesData?.length) return [];
  
  const totalExits = exitPagesData.reduce((sum, page) => sum + (page.exits || 0), 0);
  
  return exitPagesData.map(page => ({
    path: page.path,
    exits: page.exits || 0,
    visitors: page.visitors || 0,
    percentage: totalExits > 0 ? Math.round((page.exits / totalExits) * 100) : 0
  }));
} 