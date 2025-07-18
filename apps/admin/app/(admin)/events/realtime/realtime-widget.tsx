"use client";

import { useEffect, useState } from "react";
import { fetchEventsPerSecond, type EventsPerSecondData } from "../actions";
import { Skeleton } from "@/components/ui/skeleton";

export function RealTimeEventsWidget() {
    const [data, setData] = useState<EventsPerSecondData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const fetchData = async () => {
            try {
                const d = await fetchEventsPerSecond();
                if (mounted) setData(d);
            } catch (error) {
                // Only log if needed
            } finally {
                if (mounted) setLoading(false);
            }
        };
        fetchData();
        const interval = setInterval(fetchData, 1000);
        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, []);

    const last = data.at(-1)?.count ?? 0;
    const prev = data.at(-2)?.count ?? 0;
    const current = Math.max(0, last - prev);
    const avg = data.length > 1 ? Math.round(data.reduce((s, d) => s + d.count, 0) / data.length) : 0;
    const max = data.length ? Math.max(...data.map(d => d.count)) : 0;
    const min = data.length ? Math.min(...data.map(d => d.count)) : 0;
    const points = data.length;

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </div>
                <Skeleton className="h-48 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Metrics */}
            <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded bg-muted/60 border">
                    <div className="text-2xl font-bold text-primary">{current}</div>
                    <div className="text-xs text-muted-foreground">Current/sec</div>
                </div>
                <div className="text-center p-3 rounded bg-muted/60 border">
                    <div className="text-2xl font-bold text-primary">{avg}</div>
                    <div className="text-xs text-muted-foreground">Avg/sec</div>
                </div>
            </div>

            {/* Live Chart */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm">Live Activity</h3>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                        <span className="text-xs text-muted-foreground">Live</span>
                    </div>
                </div>
                <div className="h-32 border rounded p-3 bg-background">
                    {data.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data yet…</div>
                    ) : (
                        <div className="h-full flex items-end justify-between gap-0.5">
                            {data.slice(-30).map((d, i) => {
                                const maxC = Math.max(...data.map(x => x.count), 1);
                                const h = Math.max(4, (d.count / maxC) * 100);
                                const isRecent = i >= data.length - 5;
                                return (
                                    <div
                                        key={d.timestamp}
                                        className={`flex-1 rounded transition-all duration-300 ${isRecent ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                                        style={{ height: `${h}%` }}
                                        title={`${d.count} events at ${new Date(d.timestamp).toLocaleTimeString()}`}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>
                <div className="text-center">
                    <span className="text-xs text-muted-foreground">Last 30s • Updates every second</span>
                </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-2">
                <div className="p-2 rounded bg-muted/40 text-center">
                    <div className="text-sm font-bold text-primary">{points}</div>
                    <div className="text-xs text-muted-foreground">Points</div>
                </div>
                <div className="p-2 rounded bg-muted/40 text-center">
                    <div className="text-sm font-bold text-primary">{max}</div>
                    <div className="text-xs text-muted-foreground">Peak</div>
                </div>
                <div className="p-2 rounded bg-muted/40 text-center">
                    <div className="text-sm font-bold text-primary">{min}</div>
                    <div className="text-xs text-muted-foreground">Min</div>
                </div>
            </div>
        </div>
    );
} 