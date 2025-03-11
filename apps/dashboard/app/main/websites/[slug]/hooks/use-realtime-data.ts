"use client";

import { useState, useEffect } from "react";
import dayjs from "dayjs";

export interface RealtimeVisitor {
  id: string;
  page: string;
  referrer: string;
  country: string;
  device: string;
  browser: string;
  timestamp: string;
  duration: number;
}

export interface RealtimeStats {
  activeVisitors: number;
  pagesBeingViewed: { page: string; count: number }[];
  visitorHistory: { timestamp: string; count: number }[];
  recentVisitors: RealtimeVisitor[];
}

export function useRealtimeData(websiteId: string) {
  const [realtimeData, setRealtimeData] = useState<RealtimeStats>({
    activeVisitors: 0,
    pagesBeingViewed: [],
    visitorHistory: [],
    recentVisitors: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRealtimeData = async () => {
      try {
        setIsLoading(true);
        
        // In a real app, this would be an API call or WebSocket connection:
        // const response = await fetch(`/api/websites/${websiteId}/realtime`);
        // const data = await response.json();
        
        // For now, generate mock data
        const mockData = generateMockRealtimeData();
        setRealtimeData(mockData);
        setError(null);
      } catch (err) {
        console.error("Error fetching realtime data:", err);
        setError("Failed to load realtime data");
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchRealtimeData();
    
    // Set up polling every 5 seconds
    const intervalId = setInterval(fetchRealtimeData, 5000);
    
    return () => clearInterval(intervalId);
  }, [websiteId]);

  return { realtimeData, isLoading, error };
}

// Helper function to generate mock realtime data
function generateMockRealtimeData(): RealtimeStats {
  const now = dayjs();
  const activeVisitors = Math.floor(Math.random() * 10) + 1; // 1-10 active visitors
  
  // Generate visitor history for the last 30 minutes (one data point per minute)
  const visitorHistory = Array.from({ length: 30 }, (_, i) => {
    return {
      timestamp: now.subtract(29 - i, 'minute').format('HH:mm'),
      count: Math.floor(Math.random() * 10) + 1
    };
  });
  
  // Generate pages being viewed
  const pages = [
    { page: "/", count: Math.floor(Math.random() * 5) + 1 },
    { page: "/features", count: Math.floor(Math.random() * 3) + 1 },
    { page: "/pricing", count: Math.floor(Math.random() * 3) },
    { page: "/blog", count: Math.floor(Math.random() * 2) },
    { page: "/contact", count: Math.floor(Math.random() * 2) }
  ].filter(p => p.count > 0).sort((a, b) => b.count - a.count);
  
  // Generate recent visitors
  const devices = ["Desktop", "Mobile", "Tablet"];
  const browsers = ["Chrome", "Firefox", "Safari", "Edge"];
  const countries = ["United States", "United Kingdom", "Germany", "France", "Canada", "Japan", "Australia"];
  const referrers = ["Google", "Direct", "Twitter", "Facebook", "LinkedIn"];
  
  const recentVisitors = Array.from({ length: 5 }, (_, i) => {
    const visitTime = now.subtract(Math.floor(Math.random() * 10), 'minute');
    return {
      id: `visitor-${i}`,
      page: pages[Math.floor(Math.random() * pages.length)].page,
      referrer: referrers[Math.floor(Math.random() * referrers.length)],
      country: countries[Math.floor(Math.random() * countries.length)],
      device: devices[Math.floor(Math.random() * devices.length)],
      browser: browsers[Math.floor(Math.random() * browsers.length)],
      timestamp: visitTime.format('HH:mm'),
      duration: Math.floor(Math.random() * 300) // 0-300 seconds
    };
  });
  
  return {
    activeVisitors,
    pagesBeingViewed: pages,
    visitorHistory,
    recentVisitors
  };
} 