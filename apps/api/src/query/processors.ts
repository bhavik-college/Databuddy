import { getLanguageName } from '@databuddy/shared'
import { parseReferrer } from '../utils/referrer'

export const processLanguageData = (data: any[]) => 
  data.map(item => ({
    ...item,
    name: getLanguageName(item.name) !== 'Unknown' ? getLanguageName(item.name) : item.name,
    code: item.name
  }))

// Data processing functions
export const processCountryData = (data: any[]) => 
  data.map(item => ({
    ...item,
    name: item.name === 'IL' ? 'PS' : item.name,
    country: item.country === 'IL' ? 'PS' : item.country
  }))

export const processPageData = (data: any[]) => {
  // First, clean and process each item
  const processedData = data.map(item => {
    let cleanPath = item.name || item.path || '/';
    
    try {
      if (cleanPath.startsWith('http')) {
        const url = new URL(cleanPath);
        // Only use pathname, strip query parameters and hash for cleaner display
        cleanPath = url.pathname;
      } else {
        // For relative paths, strip query parameters
        const questionMarkIndex = cleanPath.indexOf('?');
        if (questionMarkIndex !== -1) {
          cleanPath = cleanPath.substring(0, questionMarkIndex);
        }
        // Also strip hash fragments
        const hashIndex = cleanPath.indexOf('#');
        if (hashIndex !== -1) {
          cleanPath = cleanPath.substring(0, hashIndex);
        }
      }
    } catch (e) {
      // If URL parsing fails, still try to clean query params manually
      const questionMarkIndex = cleanPath.indexOf('?');
      if (questionMarkIndex !== -1) {
        cleanPath = cleanPath.substring(0, questionMarkIndex);
      }
      const hashIndex = cleanPath.indexOf('#');
      if (hashIndex !== -1) {
        cleanPath = cleanPath.substring(0, hashIndex);
      }
    }
    
    cleanPath = cleanPath || '/';
    
    return {
      ...item,
      name: cleanPath,
      path: cleanPath
    };
  });

  // Now aggregate duplicates
  const pathMap = new Map();
  
  processedData.forEach(item => {
    const path = item.path;
    
    if (pathMap.has(path)) {
      // Merge with existing entry
      const existing = pathMap.get(path);
      existing.pageviews = (existing.pageviews || 0) + (item.pageviews || 0);
      existing.visitors = (existing.visitors || 0) + (item.visitors || 0);
      existing.sessions = (existing.sessions || 0) + (item.sessions || 0);
      existing.entries = (existing.entries || 0) + (item.entries || 0);
      existing.exits = (existing.exits || 0) + (item.exits || 0);
    } else {
      // Create new entry
      pathMap.set(path, { ...item });
    }
  });
  
  // Convert map back to array and sort by pageviews (or entries/exits depending on data)
  return Array.from(pathMap.values())
    .sort((a, b) => {
      const aValue = a.pageviews || a.entries || a.exits || 0;
      const bValue = b.pageviews || b.entries || b.exits || 0;
      return bValue - aValue;
    });
}

export const processCustomEventsData = (data: any[]) => 
  data.map(item => {
    const { property_keys_arrays, ...rest } = item;
    let property_keys: string[] = [];

    if (property_keys_arrays) {
      const allKeys = (property_keys_arrays as any[]).flat();
      const filteredKeys = allKeys.filter((key: string) => 
        !key.startsWith('__') && 
        !['sessionId', 'sessionStartTime'].includes(key)
      );
      property_keys = [...new Set(filteredKeys)];
    }

    return {
      ...rest,
      property_keys,
      country: item.country === 'IL' ? 'PS' : item.country,
      event_types: typeof item.event_types === 'string' ? 
        JSON.parse(item.event_types) : item.event_types,
      last_occurrence: item.last_occurrence ? new Date(item.last_occurrence).toISOString() : null,
      first_occurrence: item.first_occurrence ? new Date(item.first_occurrence).toISOString() : null,
      last_event_time: item.last_event_time ? new Date(item.last_event_time).toISOString() : null,
      first_event_time: item.first_event_time ? new Date(item.first_event_time).toISOString() : null,
    };
  })

export const processCustomEventDetailsData = (data: any[]) => 
  data.map(item => {
    let properties: Record<string, any> = {};
    let propertyKeys: string[] = [];
    
    if (item.properties_json) {
      try {
        properties = JSON.parse(item.properties_json);
        propertyKeys = Object.keys(properties).filter(key => 
          !key.startsWith('__') && 
          !['sessionId', 'sessionStartTime'].includes(key)
        );
      } catch {
        // If parsing fails, keep empty
      }
    }
    
    return {
      ...item,
      country: item.country === 'IL' ? 'PS' : item.country,
      time: new Date(item.time).toISOString(),
      properties,
      custom_property_keys: propertyKeys,
      _subRows: propertyKeys.map(key => ({
        name: key,
        value: properties[key],
        type: typeof properties[key],
        _isProperty: true
      }))
    };
  })

// Helper function to group browser version data
export function processBrowserGroupedData(rawData: any[]): any[] {
  const browserGroups: Record<string, any> = {}
  
  for (const item of rawData) {
    const browserName = item.browser_name
    const version = {
      name: String(item.browser_version || ''),
      version: String(item.browser_version || ''),
      visitors: Number(item.visitors) || 0,
      pageviews: Number(item.pageviews) || 0,
      sessions: Number(item.sessions) || 0
    }
    
    if (!browserGroups[browserName]) {
      browserGroups[browserName] = {
        name: browserName,
        visitors: 0,
        pageviews: 0,
        sessions: 0,
        versions: []
      }
    }
    
    browserGroups[browserName].visitors += version.visitors
    browserGroups[browserName].pageviews += version.pageviews
    browserGroups[browserName].sessions += version.sessions
    browserGroups[browserName].versions.push(version)
  }
  
  // Convert to array and sort
  return Object.values(browserGroups)
    .map((browser: any) => ({
      ...browser,
      versions: browser.versions.sort((a: any, b: any) => b.visitors - a.visitors)
    }))
    .sort((a: any, b: any) => b.visitors - a.visitors)
}

export const processReferrerData = (data: any[], websiteDomain?: string) => {
  const aggregatedReferrers: Record<string, { type: string; name: string; visitors: number; pageviews: number; sessions: number, domain: string }> = {}

  for (const row of data) {
    const { name: referrerUrl, visitors, pageviews, sessions } = row
    const parsed = parseReferrer(referrerUrl, websiteDomain)

    // Skip same-domain referrers entirely
    if (websiteDomain && referrerUrl && referrerUrl !== 'direct') {
      try {
        const url = new URL(referrerUrl.startsWith('http') ? referrerUrl : `http://${referrerUrl}`)
        const hostname = url.hostname
        
        // Check if the referrer hostname matches the website domain
        if (hostname === websiteDomain || hostname.endsWith(`.${websiteDomain}`) || 
            (websiteDomain.startsWith('www.') && hostname === websiteDomain.substring(4)) ||
            (hostname.startsWith('www.') && websiteDomain === hostname.substring(4))) {
          continue // Skip same-domain referrers
        }
      } catch (e) {
        // If URL parsing fails, continue with the original logic
      }
    }

    const key = parsed.name

    if (!aggregatedReferrers[key]) {
      aggregatedReferrers[key] = {
        type: parsed.type,
        name: key,
        domain: parsed.domain,
        visitors: 0,
        pageviews: 0,
        sessions: 0,
      }
    }

    aggregatedReferrers[key].visitors += Number(visitors) || 0
    aggregatedReferrers[key].pageviews += Number(pageviews) || 0
    aggregatedReferrers[key].sessions += Number(sessions) || 0
  }

  return Object.values(aggregatedReferrers).sort((a, b) => b.visitors - a.visitors)
}

// Helper function to process timezone data
export function processTimezoneData(rawData: any[]): any[] {
  return rawData.map(item => {
    const tz = item.name
    let displayName = tz
    
    // Common timezone mappings
    const timezoneNames: Record<string, string> = {
      'UTC': 'UTC (Coordinated Universal Time)',
      'GMT': 'GMT (Greenwich Mean Time)',
      'America/New_York': 'Eastern Time (US & Canada)',
      'America/Chicago': 'Central Time (US & Canada)',
      'America/Denver': 'Mountain Time (US & Canada)',
      'America/Los_Angeles': 'Pacific Time (US & Canada)',
      'America/Anchorage': 'Alaska Time',
      'Pacific/Honolulu': 'Hawaii Time',
      'Europe/London': 'Greenwich Mean Time (UK)',
      'Europe/Paris': 'Central European Time',
      'Europe/Berlin': 'Central European Time',
      'Europe/Rome': 'Central European Time',
      'Europe/Madrid': 'Central European Time',
      'Europe/Amsterdam': 'Central European Time',
      'Europe/Helsinki': 'Eastern European Time',
      'Europe/Athens': 'Eastern European Time',
      'Europe/Moscow': 'Moscow Standard Time',
      'Asia/Tokyo': 'Japan Standard Time',
      'Asia/Shanghai': 'China Standard Time',
      'Asia/Beijing': 'China Standard Time',
      'Asia/Kolkata': 'India Standard Time',
      'Asia/Mumbai': 'India Standard Time',
      'Asia/Dubai': 'Gulf Standard Time',
      'Australia/Sydney': 'Australian Eastern Time',
      'Australia/Melbourne': 'Australian Eastern Time',
      'Australia/Perth': 'Australian Western Time',
      'Pacific/Auckland': 'New Zealand Standard Time',
      'America/Sao_Paulo': 'Brasília Time',
      'America/Argentina/Buenos_Aires': 'Argentina Time',
      'Africa/Cairo': 'Eastern European Time',
      'Africa/Johannesburg': 'South Africa Standard Time'
    }
    
    displayName = timezoneNames[tz] || tz.replace(/_/g, ' ').replace('/', ' / ')
    
    // Try to get current time in timezone
    let currentTime = ''
    try {
      const now = new Date()
      currentTime = now.toLocaleTimeString('en-US', { 
        timeZone: tz,
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      // If timezone is invalid, skip time display
    }
    
    return {
      ...item,
      name: displayName,
      code: tz,
      current_time: currentTime
    }
  })
}

// ====================================================================
// REVENUE ANALYTICS PROCESSORS
// ====================================================================

export const processRevenueSummary = (data: any[]) => {
  if (!data || data.length === 0) {
    return {
      total_revenue: 0,
      total_transactions: 0,
      total_refunds: 0,
      avg_order_value: 0,
      success_rate: 0,
    };
  }

  const summary = data[0];
  const total_transactions = Number(summary.total_transactions) || 0;
  const successful_transactions = Number(summary.successful_transactions) || 0;
  
  return {
    total_revenue: Number(summary.total_revenue) || 0,
    total_transactions,
    total_refunds: Number(summary.total_refunds) || 0,
    avg_order_value: Number(summary.avg_order_value) || 0,
    success_rate: total_transactions > 0 ? (successful_transactions / total_transactions) * 100 : 0,
  };
};

export const processRevenueTrends = (data: any[]) => {
  return data.map(item => ({
    time: new Date(item.time).toISOString(),
    revenue: Number(item.total_revenue) || 0,
    transactions: Number(item.total_transactions) || 0,
    avg_order_value: Number(item.avg_order_value) || 0,
    success_rate: Number(item.success_rate) || 0,
  }));
};

export const processRecentTransactions = (data: any[]) => {
  return data.map(item => ({
    id: item.id,
    created: new Date(item.created).toISOString(),
    status: item.status,
    currency: item.currency,
    amount: Number(item.amount) || 0,
    card_brand: item.card_brand,
    session_id: item.session_id,
  }));
};

export const processRecentRefunds = (data: any[]) => {
  return data.map(item => ({
    id: item.id,
    created: new Date(item.created).toISOString(),
    status: item.status,
    reason: item.reason,
    currency: item.currency,
    amount: Number(item.amount) || 0,
    payment_intent_id: item.payment_intent_id,
    session_id: item.session_id,
  }));
}; 