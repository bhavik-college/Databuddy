"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users, MousePointerClick, Activity, TrendingUp } from "lucide-react";

interface AnalyticsSummaryProps {
  analytics: {
    totalVisitors: number;
    totalPageViews: number;
    averageBounceRate: string;
    visitorsTrend: string;
    pageViewsTrend: string;
    bounceRateTrend: string;
  };
}

export function AnalyticsSummaryCards({ analytics }: AnalyticsSummaryProps) {
  return (
    <div className="grid gap-6 md:grid-cols-3 mb-8">
      <StatCard 
        label="Total Visitors" 
        value={analytics.totalVisitors.toLocaleString()} 
        trend={analytics.visitorsTrend} 
        icon={<Users className="h-5 w-5" />}
        color="sky"
      />
      <StatCard 
        label="Page Views" 
        value={analytics.totalPageViews.toLocaleString()} 
        trend={analytics.pageViewsTrend} 
        icon={<MousePointerClick className="h-5 w-5" />}
        color="indigo"
      />
      <StatCard 
        label="Avg. Bounce Rate" 
        value={analytics.averageBounceRate} 
        trend={analytics.bounceRateTrend} 
        icon={<Activity className="h-5 w-5" />}
        color="amber"
      />
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  trend: string;
  icon: React.ReactNode;
  color: "sky" | "indigo" | "amber";
}

function StatCard({ label, value, trend, icon, color }: StatCardProps) {
  const colorMap = {
    sky: "bg-sky-500/10 text-sky-400",
    indigo: "bg-indigo-500/10 text-indigo-400",
    amber: "bg-amber-500/10 text-amber-400",
  };
  
  return (
    <Card className="bg-slate-900/80 border-slate-800/80 backdrop-blur-sm overflow-hidden transition-all hover:shadow-md hover:shadow-sky-500/5 hover:border-sky-500/30">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400 mb-1">{label}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-white">{value}</p>
              <span className="text-xs font-medium text-emerald-400 flex items-center">
                {trend} <TrendingUp className="h-3 w-3 ml-0.5" />
              </span>
            </div>
          </div>
          <div className={`rounded-full p-3 ${colorMap[color]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 