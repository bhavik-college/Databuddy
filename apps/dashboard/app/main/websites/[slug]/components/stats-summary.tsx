"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users, MousePointerClick, ArrowUpRight, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { useApiClient } from "@/lib/hooks/use-api-client";

interface StatsSummaryProps {
  visitors: number;
  pageViews: number;
  bounceRate: number;
  averageTime: number;
  websiteId?: string;
  trackingId?: string;
}

export function StatsSummary({ 
  visitors: initialVisitors = 0, 
  pageViews: initialPageViews = 0, 
  bounceRate: initialBounceRate = 0, 
  averageTime: initialAverageTime = 0,
  websiteId,
  trackingId
}: StatsSummaryProps) {
  const { client, isReady } = useApiClient(trackingId);
  const [visitors, setVisitors] = useState(initialVisitors);
  const [pageViews, setPageViews] = useState(initialPageViews);
  const [bounceRate, setBounceRate] = useState(initialBounceRate);
  const [averageTime, setAverageTime] = useState(initialAverageTime);
  
  // If websiteId is provided, fetch real-time stats
  useEffect(() => {
    if (!websiteId || !isReady) return;
    
    const fetchStats = async () => {
      try {
        // Calculate date range (last 30 days)
        const now = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        
        const from = thirtyDaysAgo.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        const to = now.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        
        // Use the API client to fetch stats
        const data = await client.getWebsiteStats(websiteId, from, to);
        
        if (data && typeof data === 'object' && 'totals' in data && data.totals) {
          const totals = data.totals as any;
          setVisitors(totals.uniqueVisitors || 0);
          setPageViews(totals.pageviews || 0);
          setBounceRate(Math.round((totals.bounceRate || 0) * 100));
          setAverageTime(totals.avgSessionDuration || 0);
        }
      } catch (error) {
        console.error("Failed to fetch stats summary:", error);
      }
    };
    
    fetchStats();
  }, [websiteId, client, isReady]);
  
  // Format time in minutes and seconds
  const formatTime = (seconds: number): string => {
    if (!seconds) return "0m 0s";
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="grid gap-4 md:grid-cols-4 mt-6">
      <Card className="bg-slate-900/80 border-slate-800/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1 flex items-center">
                <Users className="h-3.5 w-3.5 mr-1" />
                Visitors
              </p>
              <p className="text-2xl font-semibold text-white">{visitors.toLocaleString()}</p>
            </div>
            <span className="text-xs text-emerald-400 flex items-center">
              +0% 
              <ArrowUpRight className="h-3 w-3 ml-0.5" />
            </span>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-slate-900/80 border-slate-800/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1 flex items-center">
                <MousePointerClick className="h-3.5 w-3.5 mr-1" />
                Page Views
              </p>
              <p className="text-2xl font-semibold text-white">{pageViews.toLocaleString()}</p>
            </div>
            <span className="text-xs text-emerald-400 flex items-center">
              +0% 
              <ArrowUpRight className="h-3 w-3 ml-0.5" />
            </span>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-slate-900/80 border-slate-800/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1 flex items-center">
                <ArrowUpRight className="h-3.5 w-3.5 mr-1" />
                Bounce Rate
              </p>
              <p className="text-2xl font-semibold text-white">{bounceRate}%</p>
            </div>
            <span className="text-xs text-emerald-400 flex items-center">
              -0% 
              <ArrowUpRight className="h-3 w-3 ml-0.5 rotate-180" />
            </span>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-slate-900/80 border-slate-800/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1 flex items-center">
                <Clock className="h-3.5 w-3.5 mr-1" />
                Avg. Time
              </p>
              <p className="text-2xl font-semibold text-white">{formatTime(averageTime)}</p>
            </div>
            <span className="text-xs text-emerald-400 flex items-center">
              +0% 
              <ArrowUpRight className="h-3 w-3 ml-0.5" />
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 