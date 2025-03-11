"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";

interface Website {
  id: string;
  name: string;
  url: string;
  slug: string;
  trackingId: string;
  visitors: number;
  pageViews: number;
  bounceRate: number;
  trend: string;
  averageTime: number;
}

export function useWebsiteData(slug: string) {
  const { data: session } = useSession();
  const [website, setWebsite] = useState<Website | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWebsite = async () => {
      if (!session) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // First get the website from the database
        const dbResponse = await fetch(`/api/websites/${slug}`);
        
        if (!dbResponse.ok) {
          throw new Error(`Failed to fetch website: ${dbResponse.status}`);
        }
        
        const websiteData = await dbResponse.json();
        
        // Then fetch analytics data from the API
        const analyticsResponse = await fetch(`/api/analytics/websites/${websiteData.id}/stats`);
        
        if (!analyticsResponse.ok) {
          // If analytics API fails, return website with default analytics values
          setWebsite({
            ...websiteData,
            visitors: 0,
            pageViews: 0,
            bounceRate: 0,
            trend: "+0%",
            averageTime: 0
          });
          setIsLoading(false);
          return;
        }
        
        const analyticsData = await analyticsResponse.json();
        
        // Merge website with analytics data
        setWebsite({
          ...websiteData,
          visitors: analyticsData.totals?.uniqueVisitors || 0,
          pageViews: analyticsData.totals?.pageviews || 0,
          bounceRate: Math.round((analyticsData.totals?.bounceRate || 0) * 100),
          trend: formatTrend(analyticsData.trends?.visitors || 0),
          averageTime: analyticsData.totals?.avgSessionDuration || 0
        });
        
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching website:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch website data");
        setIsLoading(false);
      }
    };

    fetchWebsite();
  }, [slug, session]);

  return { website, isLoading, error };
}

/**
 * Formats a trend value as a percentage string with + or - prefix
 */
function formatTrend(value: number): string {
  const prefix = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${prefix}${Math.abs(Math.round(value * 100))}%`;
} 