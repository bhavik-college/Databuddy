"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { ArrowCounterClockwiseIcon, BugIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { ErrorChartTooltip } from "./error-chart-tooltip";
import { CartesianGrid, XAxis, YAxis, Tooltip, Legend, Area } from "recharts";

// Dynamically import chart components for better performance
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
const AreaChart = dynamic(() => import('recharts').then(mod => mod.AreaChart), { ssr: false });
const Brush = dynamic(() => import('recharts').then(mod => mod.Brush), { ssr: false });



interface ErrorTrendsChartProps {
    errorChartData: Array<{
        date: string;
        'Total Errors': number;
        'Affected Users': number;
    }>;
}

export const ErrorTrendsChart = ({ errorChartData }: ErrorTrendsChartProps) => {
    const [zoomDomain, setZoomDomain] = useState<{ startIndex?: number; endIndex?: number }>({});
    const [isZoomed, setIsZoomed] = useState(false);

    const resetZoom = useCallback(() => {
        setZoomDomain({});
        setIsZoomed(false);
    }, []);

    const handleBrushChange = useCallback((brushData: any) => {
        if (brushData && brushData.startIndex !== undefined && brushData.endIndex !== undefined) {
            setZoomDomain({
                startIndex: brushData.startIndex,
                endIndex: brushData.endIndex
            });
            setIsZoomed(true);
        }
    }, []);

    if (!errorChartData.length) {
        return (
            <div className="rounded-lg border shadow-sm h-full flex items-center justify-center p-6 bg-muted/20">
                <div className="text-center">
                    <BugIcon size={16} weight="duotone" className="mx-auto h-8 w-8 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-medium text-muted-foreground">No error trend data</h3>
                    <p className="mt-1 text-xs text-muted-foreground">Not enough data to display a trend chart.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-lg border shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
                <div>
                    <h3 className="text-base font-semibold">Error Trends</h3>
                    <p className="text-xs text-muted-foreground">
                        Error occurrences and impact over time
                    </p>
                </div>
                {errorChartData.length > 5 && (
                    <div className="flex items-center gap-2">
                        {isZoomed && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={resetZoom}
                                className="h-7 px-2 text-xs"
                            >
                                <ArrowCounterClockwiseIcon size={16} weight="duotone" className="h-3 w-3 mr-1" />
                                Reset Zoom
                            </Button>
                        )}
                        <div className="text-xs text-muted-foreground">
                            Drag to zoom
                        </div>
                    </div>
                )}
            </div>
            <div className="p-2 flex-1">
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={errorChartData}
                            margin={{ top: 10, right: 10, left: 0, bottom: errorChartData.length > 5 ? 35 : 5 }}
                        >
                            <defs>
                                <linearGradient id="colorTotalErrors" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
                                </linearGradient>
                                <linearGradient id="colorAffectedUsers" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} dy={5} />
                            <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} width={30} tickFormatter={(value) => {
                                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                                if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
                                return value.toString();
                            }} />
                            <Tooltip content={<ErrorChartTooltip />} wrapperStyle={{ outline: 'none' }} />
                            <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '5px', bottom: errorChartData.length > 5 ? 20 : 0 }} iconType="circle" iconSize={8} />
                            <Area type="monotone" dataKey="Total Errors" stroke="#ef4444" fillOpacity={1} fill="url(#colorTotalErrors)" strokeWidth={2} name="Total Errors" />
                            <Area type="monotone" dataKey="Affected Users" stroke="#f59e0b" fillOpacity={1} fill="url(#colorAffectedUsers)" strokeWidth={2} name="Affected Users" />
                            {errorChartData.length > 5 && (
                                <Brush dataKey="date" padding={{ top: 5, bottom: 5 }} height={25} stroke="var(--border)" fill="var(--muted)" fillOpacity={0.1} onChange={handleBrushChange} startIndex={zoomDomain.startIndex} endIndex={zoomDomain.endIndex} />
                            )}
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}; 