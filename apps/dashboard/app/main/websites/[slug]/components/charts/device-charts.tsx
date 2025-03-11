"use client";

import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Laptop, Monitor, Smartphone } from "lucide-react";
import { EmptyState } from "@/app/(app)/dashboard/components/empty-state";

interface DeviceData {
  type: string;
  count: number;
  percentage: number;
}

interface ScreenSizeData {
  size: string;
  count: number;
  percentage: number;
}

interface ResolutionData {
  resolution: string;
  count: number;
  percentage: number;
}

interface DeviceChartsProps {
  deviceData: DeviceData[];
  screenSizeData: ScreenSizeData[];
  resolutionData: ResolutionData[];
  isLoading?: boolean;
}

export function DeviceCharts({ 
  deviceData, 
  screenSizeData, 
  resolutionData, 
  isLoading = false 
}: DeviceChartsProps) {
  const isDeviceEmpty = !isLoading && (!deviceData.length || deviceData.every(item => item.count === 0));
  const isScreenSizeEmpty = !isLoading && (!screenSizeData.length || screenSizeData.every(item => item.count === 0));
  const isResolutionEmpty = !isLoading && (!resolutionData.length || resolutionData.every(item => item.count === 0));
  
  // Colors for the charts
  const DEVICE_COLORS = ['#38bdf8', '#f59e0b', '#a855f7'];
  const SCREEN_COLORS = ['#818cf8', '#10b981', '#f43f5e', '#f59e0b'];
  
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="bg-slate-900/80 border-slate-800/80 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-white flex items-center gap-2 text-base">
            <Laptop className="h-4 w-4 text-sky-400" />
            Device Types
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs">
            Distribution of visitors by device type
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[200px] flex items-center justify-center">
              <div className="animate-pulse bg-slate-800 rounded-md w-full h-[170px]" />
            </div>
          ) : isDeviceEmpty ? (
            <div className="h-[200px]">
              <EmptyState 
                icon={<Laptop className="h-8 w-8 text-slate-500" />}
                title="No device data"
                description="There is no device data recorded for this period."
              />
            </div>
          ) : (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="count"
                  >
                    {deviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={DEVICE_COLORS[index % DEVICE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.375rem' }}
                    labelStyle={{ color: '#e2e8f0' }}
                    formatter={(value: number, name: string, props: any) => {
                      const { payload } = props;
                      return [`${value.toLocaleString()} (${payload.percentage}%)`, payload.type];
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
          )}
        </CardContent>
      </Card>
      
      <Card className="bg-slate-900/80 border-slate-800/80 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-white flex items-center gap-2 text-base">
            <Monitor className="h-4 w-4 text-indigo-400" />
            Screen Sizes
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs">
            Distribution of visitors by screen size
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[200px] flex items-center justify-center">
              <div className="animate-pulse bg-slate-800 rounded-md w-full h-[170px]" />
            </div>
          ) : isScreenSizeEmpty ? (
            <div className="h-[200px]">
              <EmptyState 
                icon={<Monitor className="h-8 w-8 text-slate-500" />}
                title="No screen size data"
                description="There is no screen size data recorded for this period."
              />
            </div>
          ) : (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={screenSizeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="count"
                  >
                    {screenSizeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={SCREEN_COLORS[index % SCREEN_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.375rem' }}
                    labelStyle={{ color: '#e2e8f0' }}
                    formatter={(value: number, name: string, props: any) => {
                      const { payload } = props;
                      return [`${value.toLocaleString()} (${payload.percentage}%)`, payload.size];
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
          )}
        </CardContent>
      </Card>
      
      <Card className="bg-slate-900/80 border-slate-800/80 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-white flex items-center gap-2 text-base">
            <Smartphone className="h-4 w-4 text-rose-400" />
            Screen Resolutions
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs">
            Common screen resolutions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[200px] flex items-center justify-center">
              <div className="animate-pulse bg-slate-800 rounded-md w-full h-[170px]" />
            </div>
          ) : isResolutionEmpty ? (
            <div className="h-[200px]">
              <EmptyState 
                icon={<Smartphone className="h-8 w-8 text-slate-500" />}
                title="No resolution data"
                description="There is no resolution data recorded for this period."
              />
            </div>
          ) : (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={resolutionData.slice(0, 5)}
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
                    dataKey="resolution" 
                    tick={{ fill: '#94a3b8', fontSize: 10 }} 
                    axisLine={{ stroke: '#334155' }}
                    tickLine={false}
                    width={60}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.375rem' }}
                    labelStyle={{ color: '#e2e8f0' }}
                    formatter={(value: number) => [value.toLocaleString(), 'Count']}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#f43f5e" 
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 