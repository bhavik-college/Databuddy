// src/types/analytics.ts
export type EventBase = {
  // Unique event ID (UUID or hash)
  eventId: string;

  // Event type (only page_view)
  type: "page_view";

  // Timestamp in ISO format
  timestamp: string;

  // Anonymous user ID (hashed or UUID)
  userId: string;

  // Session ID for grouping user actions
  sessionId: string;
  
  // Website ID for tracking which website the event belongs to
  websiteId: string;
  
  // Tracking ID for validation
  trackingId: string;

  // Device information (avoiding unique fingerprints)
  device: {
    type: "desktop" | "mobile" | "tablet" | "other";
    os: "Windows" | "macOS" | "Linux" | "Android" | "iOS" | "Other";
    browser: "Chrome" | "Firefox" | "Safari" | "Edge" | "Opera" | "Other";
    screen: {
      width: number;
      height: number;
    };
    touchSupport?: boolean; // Whether the device has touch capabilities
    details?: {
      osVersion?: string;
      browserVersion?: string;
      deviceVendor?: string;
      deviceModel?: string;
      engineName?: string;
    };
  };

  // Geolocation (approximate, non-identifiable)
  location?: {
    country?: string;    // ISO 3166-1 alpha-2 code (e.g., "US", "DE")
    region?: string;     // General region or state
    city?: string;       // General city (not precise)
    timezone?: string;   // IANA timezone (e.g., "America/New_York")
  };

  // Context information
  context: {
    page: string;          // URL path or identifier
    referrer?: string;     // Previous page URL (if available)
    title: string;         // Page title
    language: string;      // User's browser language
    utm?: Record<string, string>; // UTM parameters
    queryParams?: Record<string, string>; // All query parameters
  };

  // Consent and privacy preferences
  privacy: {
    consentGiven: boolean;      // Has the user consented to tracking?
    doNotTrack: boolean;        // DNT flag from browser
  };
};

// Page view event type
export type PageViewEvent = EventBase;

// Union type for all events (currently only page_view)
export type AnalyticsEvent = PageViewEvent;

// User type for context
export interface UserInfo {
  id: string;
  name?: string;
  email: string;
  role: string;
}

// Session type for context
export interface SessionInfo {
  id: string;
  role: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  ipAddress?: string;
  userAgent?: string;
}
