export interface WebsiteEventCounts {
  totalEvents: number;
  totalSessions: number;
  eventsLast24h: number;
  eventsLast7d: number;
  eventsLast30d: number;
}

export interface WebsiteWithUser {
  id: string;
  name: string | null;
  domain: string | null;
  status: string;
  createdAt: Date | string;
  userId: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  eventCounts: WebsiteEventCounts;
}

export interface WebsiteAnalyticsSummary {
  totalEvents: number;
  totalSessions: number;
  eventsLast24h: number;
  totalWebsites: number;
} 