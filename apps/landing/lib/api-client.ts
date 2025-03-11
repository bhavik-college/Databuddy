"use client";

/**
 * API client for making calls to the external analytics API
 */
export class AnalyticsApiClient {
  private baseUrl: string;
  private sessionToken: string | null;
  private trackingId: string | null;

  constructor(sessionToken: string | null = null, trackingId: string | null = null) {
    this.baseUrl = "https://api.databuddy.cc";
    this.sessionToken = sessionToken;
    this.trackingId = trackingId;
  }

  /**
   * Set the session token for authentication
   */
  setSessionToken(token: string) {
    this.sessionToken = token;
  }

  /**
   * Set the tracking ID for the website
   */
  setTrackingId(trackingId: string) {
    this.trackingId = trackingId;
  }

  /**
   * Get headers for API requests
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json"
    };

    if (this.sessionToken) {
      headers["Authorization"] = `Bearer ${this.sessionToken}`;
    }

    if (this.trackingId) {
      headers["X-Tracking-ID"] = this.trackingId;
    }

    return headers;
  }

  /**
   * Make a GET request to the API
   */
  async get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    // Build query string
    const queryString = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join("&");

    const url = `${this.baseUrl}${path}${queryString ? `?${queryString}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Make a POST request to the API
   */
  async post<T>(path: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get website statistics
   */
  async getWebsiteStats(websiteId: string, from: string, to: string) {
    return this.get(`/analytics/dashboard/websites/${websiteId}/stats`, { from, to });
  }

  /**
   * Get website summary
   */
  async getWebsiteSummary(websiteId: string) {
    return this.get(`/analytics/dashboard/websites/${websiteId}/summary`);
  }

  /**
   * Get dashboard summary for all websites
   */
  async getDashboardSummary(from: string, to: string) {
    return this.get("/analytics/dashboard/summary", { from, to });
  }

  /**
   * Get dashboard charts data
   */
  async getDashboardCharts(from: string, to: string) {
    return this.get("/analytics/dashboard/charts", { from, to });
  }
}

/**
 * Create an API client instance with the given session token and tracking ID
 */
export function createApiClient(sessionToken: string | null = null, trackingId: string | null = null) {
  return new AnalyticsApiClient(sessionToken, trackingId);
} 