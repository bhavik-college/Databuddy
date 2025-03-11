"use client";

import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Clock } from "lucide-react";
import { EmptyState } from "@/app/(app)/dashboard/components/empty-state";
import { useRealtimeData } from "../../hooks";
import { useEffect, useState } from "react";
import dayjs from "dayjs";

interface RealtimeVisitorsChartProps {
  websiteId: string;
}

export function RealtimeVisitorsChart({ websiteId }: RealtimeVisitorsChartProps) {
  const { realtimeData, isLoading } = useRealtimeData(websiteId);
  const [currentTime, setCurrentTime] = useState(dayjs().format('HH:mm:ss'));
  
  // Update the current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(dayjs().format('HH:mm:ss'));
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  const isEmpty = !isLoading && (!realtimeData.visitorHistory.length || realtimeData.visitorHistory.every(item => item.count === 0));
  
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="bg-slate-900/80 border-slate-800/80 backdrop-blur-sm col-span-2 row-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-white flex items-center gap-2 text-base">
            <Zap className="h-4 w-4 text-sky-400" />
            Realtime Activity
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs">
            Visitor activity in the last 30 minutes • Updated at {currentTime}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[280px] flex items-center justify-center">
              <div className="animate-pulse bg-slate-800 rounded-md w-full h-[240px]" />
            </div>
          ) : isEmpty ? (
            <div className="h-[280px]">
              <EmptyState 
                icon={<Zap className="h-8 w-8 text-slate-500" />}
                title="No realtime data"
                description="There is no visitor activity in the last 30 minutes."
              />
            </div>
          ) : (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={realtimeData.visitorHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis 
                    dataKey="timestamp" 
                    tick={{ fill: '#94a3b8', fontSize: 10 }} 
                    axisLine={{ stroke: '#334155' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fill: '#94a3b8', fontSize: 10 }} 
                    axisLine={{ stroke: '#334155' }}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.375rem' }}
                    labelStyle={{ color: '#e2e8f0' }}
                    formatter={(value: number) => [value, 'Active Visitors']}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#38bdf8" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
      
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
          {isLoading ? (
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
      
      <Card className="bg-slate-900/80 border-slate-800/80 backdrop-blur-sm col-span-3">
        <CardHeader className="pb-2">
          <CardTitle className="text-white flex items-center gap-2 text-base">
            <Clock className="h-4 w-4 text-indigo-400" />
            Current Page Views
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs">
            Pages currently being viewed
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-800/50 last:border-0">
                  <div className="animate-pulse bg-slate-800 rounded-md w-32 h-4" />
                  <div className="animate-pulse bg-slate-800 rounded-md w-16 h-4" />
                </div>
              ))}
            </div>
          ) : realtimeData.pagesBeingViewed.length === 0 ? (
            <div className="py-8">
              <EmptyState 
                icon={<Clock className="h-8 w-8 text-slate-500" />}
                title="No active page views"
                description="There are no pages currently being viewed."
              />
            </div>
          ) : (
            <div className="space-y-1">
              {realtimeData.pagesBeingViewed.map((page, i) => {
                const totalViews = realtimeData.pagesBeingViewed.reduce((sum, p) => sum + p.count, 0);
                const percentage = Math.round((page.count / totalViews) * 100);
                
                return (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-800/50 last:border-0">
                    <div className="flex items-center gap-2">
                      <div className="text-xs font-medium text-slate-300">{page.page}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-xs text-slate-400">{page.count} {page.count === 1 ? 'view' : 'views'}</div>
                      <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-sky-500 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="text-xs text-slate-400 w-8 text-right">{percentage}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 