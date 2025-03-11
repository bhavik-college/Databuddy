"use client";

import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ArrowRight, Search } from "lucide-react";
import { EmptyState } from "@/app/(app)/dashboard/components/empty-state";
import { useState } from "react";

interface PageData {
  path: string;
  views: number;
  visitors: number;
  bounceRate: number;
  avgTime: number;
  percentage: number;
}

interface PageAnalyticsChartProps {
  data: PageData[];
  isLoading?: boolean;
}

export function PageAnalyticsChart({ data, isLoading = false }: PageAnalyticsChartProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  const isEmpty = !isLoading && (!data.length);
  
  // Filter data based on search term
  const filteredData = searchTerm 
    ? data.filter(page => page.path.toLowerCase().includes(searchTerm.toLowerCase()))
    : data;
  
  // Sort data by views (descending)
  const sortedData = [...filteredData].sort((a, b) => b.views - a.views);
  
  // Prepare data for the chart (top 10 pages)
  const chartData = sortedData.slice(0, 10).map(page => ({
    ...page,
    name: page.path.length > 20 ? page.path.substring(0, 17) + '...' : page.path
  }));
  
  return (
    <div className="grid gap-4 md:grid-cols-1">
      <Card className="bg-slate-900/80 border-slate-800/80 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-emerald-400" />
              Top Pages
            </CardTitle>
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search pages..."
                className="h-8 w-48 rounded-md bg-slate-950/50 border border-slate-800 text-xs pl-8 pr-2 text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <CardDescription className="text-slate-400 text-xs">
            Most visited pages in the selected period
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
                icon={<FileText className="h-8 w-8 text-slate-500" />}
                title="No page data"
                description="There is no page data recorded for this period."
              />
            </div>
          ) : (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                  <XAxis 
                    type="number" 
                    tick={{ fill: '#94a3b8', fontSize: 10 }} 
                    axisLine={{ stroke: '#334155' }}
                    tickLine={false}
                  />
                  <YAxis 
                    type="category"
                    dataKey="name" 
                    tick={{ fill: '#94a3b8', fontSize: 10 }} 
                    axisLine={{ stroke: '#334155' }}
                    tickLine={false}
                    width={100}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.375rem' }}
                    labelStyle={{ color: '#e2e8f0' }}
                    formatter={(value: number) => [value.toLocaleString(), 'Page Views']}
                  />
                  <Bar 
                    dataKey="views" 
                    fill="#10b981" 
                    radius={[0, 4, 4, 0]}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`rgba(16, 185, 129, ${1 - (index * 0.07)})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="bg-slate-900/80 border-slate-800/80 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-emerald-400" />
              Page Details
            </CardTitle>
            <Button variant="link" size="sm">
              Export Data <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
          <CardDescription className="text-slate-400 text-xs">
            Detailed metrics for all pages
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
          ) : isEmpty ? (
            <div className="py-8">
              <EmptyState 
                icon={<FileText className="h-8 w-8 text-slate-500" />}
                title="No page data"
                description="There is no page data recorded for this period."
              />
            </div>
          ) : (
            <div className="space-y-1">
              <div className="grid grid-cols-12 gap-2 py-2 border-b border-slate-800/50 text-xs text-slate-500">
                <div className="col-span-5">Page</div>
                <div className="col-span-2 text-right">Views</div>
                <div className="col-span-2 text-right">Visitors</div>
                <div className="col-span-2 text-right">Bounce Rate</div>
                <div className="col-span-1 text-right">Avg. Time</div>
              </div>
              
              {sortedData.map((page, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 py-2 border-b border-slate-800/50 last:border-0 hover:bg-slate-800/20 transition-colors">
                  <div className="col-span-5 text-xs font-medium text-slate-300 truncate">{page.path}</div>
                  <div className="col-span-2 text-xs text-slate-400 text-right">{page.views.toLocaleString()}</div>
                  <div className="col-span-2 text-xs text-slate-400 text-right">{page.visitors.toLocaleString()}</div>
                  <div className="col-span-2 text-xs text-slate-400 text-right">{page.bounceRate}%</div>
                  <div className="col-span-1 text-xs text-slate-400 text-right">{formatTime(page.avgTime)}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to format time in seconds to mm:ss
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function Button({ 
  children, 
  variant = "default", 
  size = "default",
  ...props
}: { 
  children: React.ReactNode; 
  variant?: "default" | "link"; 
  size?: "default" | "sm";
  [key: string]: any;
}) {
  const baseClasses = "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50";
  
  const variantClasses = {
    default: "bg-sky-600 text-white hover:bg-sky-700",
    link: "text-sky-400 hover:text-sky-500 p-0 h-auto"
  };
  
  const sizeClasses = {
    default: "h-9 px-4 py-2 text-sm",
    sm: "h-8 px-3 text-xs"
  };
  
  const className = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`;
  
  return (
    <button className={className} {...props}>
      {children}
    </button>
  );
} 