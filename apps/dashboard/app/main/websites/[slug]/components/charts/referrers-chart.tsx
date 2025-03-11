"use client";

import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, ArrowRight } from "lucide-react";
import { EmptyState } from "@/app/(app)/dashboard/components/empty-state";

interface ReferrerData {
  source: string;
  visitors: number;
  percentage: number;
}

interface ReferrersChartProps {
  data: ReferrerData[];
  isLoading?: boolean;
}

export function ReferrersChart({ data, isLoading = false }: ReferrersChartProps) {
  const isEmpty = !isLoading && (!data.length || data.every(item => item.visitors === 0));
  
  // Sort data by visitors (descending)
  const sortedData = [...data].sort((a, b) => b.visitors - a.visitors);
  
  // Colors for the pie chart
  const COLORS = ['#38bdf8', '#818cf8', '#10b981', '#f59e0b', '#f43f5e', '#a855f7', '#ec4899'];
  
  return (
    <Card className="bg-slate-900/80 border-slate-800/80 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2 text-base">
            <Globe className="h-4 w-4 text-sky-400" />
            Top Referrers
          </CardTitle>
          <Button variant="link" size="sm">
            View All <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
        <CardDescription className="text-slate-400 text-xs">
          Where your visitors are coming from
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[250px] flex items-center justify-center">
            <div className="animate-pulse bg-slate-800 rounded-md w-full h-[220px]" />
          </div>
        ) : isEmpty ? (
          <div className="h-[250px]">
            <EmptyState 
              icon={<Globe className="h-8 w-8 text-slate-500" />}
              title="No referrer data"
              description="There is no referrer data recorded for this period."
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sortedData.slice(0, 7)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="visitors"
                  >
                    {sortedData.slice(0, 7).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.375rem' }}
                    labelStyle={{ color: '#e2e8f0' }}
                    formatter={(value: number, name: string, props: any) => {
                      const { payload } = props;
                      return [`${value.toLocaleString()} (${payload.percentage}%)`, payload.source];
                    }}
                  />
                  <Legend 
                    layout="vertical" 
                    verticalAlign="middle" 
                    align="right"
                    wrapperStyle={{ fontSize: '10px', color: '#94a3b8' }}
                    formatter={(value, entry, index) => {
                      return <span className="text-xs text-slate-300">{value}</span>;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-1">
              <div className="grid grid-cols-12 gap-2 py-2 border-b border-slate-800/50 text-xs text-slate-500">
                <div className="col-span-6">Source</div>
                <div className="col-span-3 text-right">Visitors</div>
                <div className="col-span-3 text-right">%</div>
              </div>
              
              {sortedData.slice(0, 10).map((referrer, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 py-2 border-b border-slate-800/50 last:border-0 hover:bg-slate-800/20 transition-colors">
                  <div className="col-span-6 text-xs font-medium text-slate-300 truncate">{referrer.source}</div>
                  <div className="col-span-3 text-xs text-slate-400 text-right">{referrer.visitors.toLocaleString()}</div>
                  <div className="col-span-3 text-xs text-slate-400 text-right">{referrer.percentage}%</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
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