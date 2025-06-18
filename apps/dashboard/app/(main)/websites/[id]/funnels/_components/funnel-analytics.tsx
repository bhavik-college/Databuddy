"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/analytics/stat-card";
import { ClosableAlert } from "@/components/ui/closable-alert";
import {
    ArrowClockwiseIcon,
    TrendDownIcon,
    UsersIcon,
    TargetIcon,
    ClockIcon,
    ChartBarIcon,
    WarningIcon,
    CheckCircleIcon
} from "@phosphor-icons/react";
import { FunnelFlow } from "./funnel-flow";

interface SummaryStats {
    totalUsers: number;
    overallConversion: number;
    avgCompletionTime: number;
    biggestDropoffRate: number;
}

interface FunnelAnalyticsProps {
    isLoading: boolean;
    error: Error | null;
    data: any;
    summaryStats: SummaryStats;
    funnelId: string;
    onRetry: () => void;
    formatCompletionTime: (seconds: number) => string;
}

export function FunnelAnalytics({
    isLoading,
    error,
    data,
    summaryStats,
    funnelId,
    onRetry,
    formatCompletionTime
}: FunnelAnalyticsProps) {
    if (isLoading) {
        return (
            <div className="space-y-4 animate-in fade-in-50 duration-500">
                {/* Loading Summary Stats */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
                        <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="p-3 border rounded bg-card animate-pulse">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="h-3 w-3 bg-muted rounded"></div>
                                    <div className="h-3 w-12 bg-muted rounded"></div>
                                </div>
                                <div className="h-4 w-16 bg-muted rounded"></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Loading Funnel Flow */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
                        <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
                    </div>
                    <div className="space-y-2">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="space-y-1 animate-pulse">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 bg-muted rounded-full"></div>
                                        <div className="h-3 w-24 bg-muted rounded"></div>
                                    </div>
                                    <div className="h-4 w-12 bg-muted rounded"></div>
                                </div>
                                <div className="h-6 bg-muted rounded"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-4">
                <div className="flex items-center justify-between p-3 border rounded bg-destructive/5">
                    <div className="flex items-center gap-2">
                        <TrendDownIcon size={14} weight="duotone" className="h-4 w-4 text-destructive" />
                        <div>
                            <div className="text-sm font-medium text-destructive">Error loading analytics</div>
                            <div className="text-xs text-muted-foreground">{error.message}</div>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onRetry}
                        className="gap-1 rounded h-7"
                    >
                        <ArrowClockwiseIcon size={12} weight="fill" className="h-3 w-3" />
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    if (!data?.data?.steps_analytics) {
        return null;
    }

    return (
        <div className="space-y-4">
            {/* Summary Stats */}
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <ChartBarIcon size={14} weight="duotone" className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">Performance</h3>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    <div className="p-3 border rounded bg-card">
                        <div className="flex items-center gap-2 mb-1">
                            <UsersIcon size={12} className="text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Users</span>
                        </div>
                        <div className="font-semibold text-sm">{summaryStats.totalUsers.toLocaleString()}</div>
                    </div>
                    <div className="p-3 border rounded bg-card">
                        <div className="flex items-center gap-2 mb-1">
                            <TargetIcon size={12} className="text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Conversion</span>
                        </div>
                        <div className="font-semibold text-sm text-primary">{summaryStats.overallConversion.toFixed(1)}%</div>
                    </div>
                    <div className="p-3 border rounded bg-card">
                        <div className="flex items-center gap-2 mb-1">
                            <ClockIcon size={12} className="text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Avg Time</span>
                        </div>
                        <div className="font-semibold text-sm">{formatCompletionTime(summaryStats.avgCompletionTime)}</div>
                    </div>
                    <div className="p-3 border rounded bg-card">
                        <div className="flex items-center gap-2 mb-1">
                            <TrendDownIcon size={12} className="text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Drop-off</span>
                        </div>
                        <div className="font-semibold text-sm text-destructive">{summaryStats.biggestDropoffRate.toFixed(1)}%</div>
                    </div>
                </div>
            </div>

            {/* Funnel Flow */}
            <FunnelFlow
                steps={data.data.steps_analytics}
                totalUsers={summaryStats.totalUsers}
                formatCompletionTime={formatCompletionTime}
            />
        </div>
    );
} 