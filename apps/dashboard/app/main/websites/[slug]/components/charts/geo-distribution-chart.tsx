"use client";

import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, ArrowRight } from "lucide-react";
import { EmptyState } from "@/app/(app)/dashboard/components/empty-state";

interface CountryData {
  country: string;
  code: string;
  visitors: number;
  percentage: number;
}

interface GeoDistributionChartProps {
  data: CountryData[];
  isLoading?: boolean;
}

export function GeoDistributionChart({ data, isLoading = false }: GeoDistributionChartProps) {
  const isEmpty = !isLoading && (!data.length || data.every(item => item.visitors === 0));
  
  // Sort data by visitors (descending)
  const sortedData = [...data].sort((a, b) => b.visitors - a.visitors);
  
  // Prepare data for the chart (top 10 countries)
  const chartData = sortedData.slice(0, 10);
  
  return (
    <Card className="bg-slate-900/80 border-slate-800/80 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4 text-rose-400" />
            Geographic Distribution
          </CardTitle>
          <Button variant="link" size="sm">
            View All <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
        <CardDescription className="text-slate-400 text-xs">
          Visitor locations by country
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
              icon={<MapPin className="h-8 w-8 text-slate-500" />}
              title="No location data"
              description="There is no geographic data recorded for this period."
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="h-[250px]">
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
                    dataKey="country" 
                    tick={{ fill: '#94a3b8', fontSize: 10 }} 
                    axisLine={{ stroke: '#334155' }}
                    tickLine={false}
                    width={80}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.375rem' }}
                    labelStyle={{ color: '#e2e8f0' }}
                    formatter={(value: number) => [value.toLocaleString(), 'Visitors']}
                  />
                  <Bar 
                    dataKey="visitors" 
                    fill="#f43f5e" 
                    radius={[0, 4, 4, 0]}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`rgba(244, 63, 94, ${1 - (index * 0.07)})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-1">
              <div className="grid grid-cols-12 gap-2 py-2 border-b border-slate-800/50 text-xs text-slate-500">
                <div className="col-span-6">Country</div>
                <div className="col-span-3 text-right">Visitors</div>
                <div className="col-span-3 text-right">%</div>
              </div>
              
              {sortedData.slice(0, 10).map((country, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 py-2 border-b border-slate-800/50 last:border-0 hover:bg-slate-800/20 transition-colors">
                  <div className="col-span-6 text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <span className="inline-block w-4">{getCountryFlag(country.code)}</span>
                    <span>{country.country}</span>
                  </div>
                  <div className="col-span-3 text-xs text-slate-400 text-right">{country.visitors.toLocaleString()}</div>
                  <div className="col-span-3 text-xs text-slate-400 text-right">{country.percentage}%</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper function to get country flag emoji from country code
function getCountryFlag(countryCode: string): string {
  if (!countryCode) return '🌐';
  
  // Convert country code to flag emoji
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  
  return String.fromCodePoint(...codePoints);
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