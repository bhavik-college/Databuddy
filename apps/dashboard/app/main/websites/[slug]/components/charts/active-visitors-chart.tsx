"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap } from "lucide-react";
import { useRealtimeData } from "../../hooks";

interface ActiveVisitorsChartProps {
  websiteId: string;
  isLoading?: boolean;
}

export function ActiveVisitorsChart({ websiteId, isLoading = false }: ActiveVisitorsChartProps) {
  const { realtimeData, isLoading: dataLoading } = useRealtimeData(websiteId);
  const loading = isLoading || dataLoading;
  
  return (
    <Card className="bg-slate-900/80 border-slate-800/80 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-white flex items-center gap-2 text-base">
          <Zap className="h-4 w-4 text-amber-400" />
          Active Now
        </CardTitle>
        <CardDescription className="text-slate-400 text-xs">
          Current active visitors
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[120px]">
            <div className="animate-pulse bg-slate-800 rounded-full w-16 h-16 mb-2" />
            <div className="animate-pulse bg-slate-800 rounded-md w-24 h-4" />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[120px]">
            <div className="text-3xl font-bold text-white">{realtimeData.activeVisitors}</div>
            <div className="text-xs text-slate-400">
              active {realtimeData.activeVisitors === 1 ? 'visitor' : 'visitors'}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 