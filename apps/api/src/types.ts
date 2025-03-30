import { WebsiteStatus } from '@databuddy/db';

export interface TrackingEvent {
  type: 'track' | 'alias' | 'increment' | 'decrement';
  payload: {
    name?: string;
    anonymousId?: string;
    profileId?: string;
    properties?: Record<string, any>;
    property?: string;
    value?: number;
  };
}

export interface EnrichedData {
  userAgent: {
    browser?: string;
    os?: string;
    device?: 'desktop' | 'mobile' | 'tablet' | 'unknown';
    bot?: {
      isBot: boolean;
      name?: string;
      type?: string;
    };
    raw: string;
  };
  geo: {
    ip?: string;
    city?: string;
    region?: string;
    country?: string;
    timezone?: string;
  };
  referrer: {
    type: string;
    name: string;
    url: string;
    domain: string;
  };
}

export interface AppVariables {
  event?: TrackingEvent;
  website?: {
    status: WebsiteStatus;
    name: string | null;
    id: string;
    domain: string;
    userId: string | null;
    projectId: string | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  };
  enriched?: EnrichedData;
} 