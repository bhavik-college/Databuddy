"use client";

import { useState, useEffect } from "react";
import { useApiClient } from "@/lib/hooks/use-api-client";

export function useWebsiteStats(websiteId: string, trackingId: string, period: string = "30") {
  const { client, isReady } = useApiClient(trackingId);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!isReady) {
        return;
      }

      try {
        setIsLoading(true);
        
        // Calculate date range based on period
        const now = new Date();
        const fromDate = new Date();
        
        if (period === "7") {
          fromDate.setDate(now.getDate() - 7);
        } else if (period === "30") {
          fromDate.setDate(now.getDate() - 30);
        } else if (period === "90") {
          fromDate.setDate(now.getDate() - 90);
        } else {
          // Default to 30 days
          fromDate.setDate(now.getDate() - 30);
        }
        
        const from = fromDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        const to = now.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        
        // Use the API client to fetch stats
        const data = await client.getWebsiteStats(websiteId, from, to);
        setStats(data);
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching website stats:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch website statistics");
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [websiteId, period, client, isReady]);

  return { stats, isLoading, error };
}

export function useWebsiteStatsWithDateRange(websiteId: string, trackingId: string, from: Date, to: Date) {
  const { client, isReady } = useApiClient(trackingId);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!isReady) {
        return;
      }

      try {
        setIsLoading(true);
        
        // Format dates as YYYY-MM-DD
        const fromStr = from.toISOString().split('T')[0];
        const toStr = to.toISOString().split('T')[0];
        
        // Use the API client to fetch stats
        const data = await client.getWebsiteStats(websiteId, fromStr, toStr);
        setStats(data);
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching website stats:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch website statistics");
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [websiteId, from, to, client, isReady]);

  return { stats, isLoading, error };
} 