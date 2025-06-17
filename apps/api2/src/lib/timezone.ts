/**
 * Timezone utilities for handling user timezone detection and date conversions
 */

export interface TimezoneInfo {
  timezone: string;
  detected: boolean;
  source: 'explicit' | 'header' | 'cloudflare' | 'accept-language' | 'default';
}

/**
 * Detect user timezone from various sources
 */
export function detectUserTimezone(headers: Headers, explicitTimezone?: string): TimezoneInfo {
  // Use explicit timezone if provided and valid
  if (explicitTimezone) {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: explicitTimezone });
      return {
        timezone: explicitTimezone,
        detected: true,
        source: 'explicit'
      };
    } catch {
      // Invalid timezone, fall through to header detection
    }
  }

  // Try to get timezone from various headers
  const timezoneHeader = headers.get('x-timezone') || 
                        headers.get('timezone') || 
                        headers.get('x-user-timezone');
  
  if (timezoneHeader) {
    try {
      // Validate timezone
      Intl.DateTimeFormat(undefined, { timeZone: timezoneHeader });
      return {
        timezone: timezoneHeader,
        detected: true,
        source: 'header'
      };
    } catch {
      // Invalid timezone, fall through to other methods
    }
  }

  // Try to infer from CloudFlare headers (if using CloudFlare)
  const cfTimezone = headers.get('cf-timezone');
  if (cfTimezone) {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: cfTimezone });
      return {
        timezone: cfTimezone,
        detected: true,
        source: 'cloudflare'
      };
    } catch {
      // Invalid timezone
    }
  }

  // Try to extract from Accept-Language header
  const acceptLanguage = headers.get('accept-language');
  if (acceptLanguage) {
    // Look for timezone info in accept-language (some browsers include it)
    const timezoneMatch = acceptLanguage.match(/timezone=([^,;]+)/i);
    if (timezoneMatch) {
      try {
        Intl.DateTimeFormat(undefined, { timeZone: timezoneMatch[1] });
        return {
          timezone: timezoneMatch[1],
          detected: true,
          source: 'accept-language'
        };
      } catch {
        // Invalid timezone
      }
    }
  }

  // Default to UTC if no timezone detected
  return {
    timezone: 'UTC',
    detected: false,
    source: 'default'
  };
}

/**
 * Convert date to user's timezone
 */
export function convertToUserTimezone(date: string, timezone: string): string {
  try {
    const utcDate = new Date(`${date}T00:00:00Z`);
    const userDate = new Date(utcDate.toLocaleString('en-US', { timeZone: timezone }));
    return userDate.toISOString().split('T')[0];
  } catch {
    // If timezone conversion fails, return original date
    return date;
  }
}

/**
 * Adjust date range for user timezone to ensure we capture all relevant data
 */
export function adjustDateRangeForTimezone(
  startDate: string, 
  endDate: string, 
  timezone: string
): { startDate: string, endDate: string } {
  if (timezone === 'UTC') {
    return { startDate, endDate };
  }

  try {
    // Convert start date to user timezone (might need to go back a day)
    const startUTC = new Date(`${startDate}T00:00:00Z`);
    const startInUserTZ = new Date(startUTC.toLocaleString('en-US', { timeZone: timezone }));
    
    // Convert end date to user timezone (might need to go forward a day)
    const endUTC = new Date(`${endDate}T23:59:59Z`);
    const endInUserTZ = new Date(endUTC.toLocaleString('en-US', { timeZone: timezone }));

    // Adjust the range to ensure we capture all data for the user's timezone
    const adjustedStart = new Date(startInUserTZ.getTime() - 24 * 60 * 60 * 1000); // Go back 1 day
    const adjustedEnd = new Date(endInUserTZ.getTime() + 24 * 60 * 60 * 1000); // Go forward 1 day

    return {
      startDate: adjustedStart.toISOString().split('T')[0],
      endDate: adjustedEnd.toISOString().split('T')[0]
    };
  } catch {
    // If timezone conversion fails, return original dates
    return { startDate, endDate };
  }
}

/**
 * Validate timezone string
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get current date in user's timezone
 */
export function getCurrentDateInTimezone(timezone: string): string {
  try {
    const now = new Date();
    const userDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    return userDate.toISOString().split('T')[0];
  } catch {
    // If timezone conversion fails, return UTC date
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Convert timestamp to user's timezone
 */
export function convertTimestampToUserTimezone(timestamp: number, timezone: string): Date {
  try {
    const utcDate = new Date(timestamp);
    return new Date(utcDate.toLocaleString('en-US', { timeZone: timezone }));
  } catch {
    // If timezone conversion fails, return original date
    return new Date(timestamp);
  }
}
