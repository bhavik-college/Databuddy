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
            <div className="space-y-8 animate-in fade-in-50 duration-500">
                {/* Loading Summary Stats */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="h-5 w-5 bg-muted animate-pulse rounded"></div>
                        <div className="h-5 w-40 bg-muted animate-pulse rounded"></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="p-6 border rounded-xl bg-card animate-pulse">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="h-4 w-4 bg-muted rounded"></div>
                                    <div className="h-6 w-16 bg-muted rounded"></div>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-4 w-20 bg-muted rounded"></div>
                                    <div className="h-3 w-32 bg-muted rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Loading Funnel Flow */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="h-5 w-5 bg-muted animate-pulse rounded"></div>
                        <div className="h-5 w-24 bg-muted animate-pulse rounded"></div>
                    </div>
                    <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 border rounded-xl bg-card animate-pulse">
                                <div className="w-6 h-6 bg-muted rounded-full"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-32 bg-muted rounded"></div>
                                    <div className="h-3 w-48 bg-muted rounded"></div>
                                </div>
                                <div className="h-4 w-4 bg-muted rounded"></div>
                                <div className="h-4 w-16 bg-muted rounded"></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Loading indicator */}
                <div className="flex items-center justify-center py-8">
                    <div className="relative">
                        <div className="w-8 h-8 rounded-full border-2 border-muted"></div>
                        <div className="absolute top-0 left-0 w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                    </div>
                    <div className="ml-3 text-sm text-muted-foreground">
                        Analyzing funnel performance...
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-8">
                <div className="flex flex-col items-center text-center space-y-3">
                    <div className="p-3 rounded-full bg-destructive/10 border border-destructive/20">
                        <TrendDownIcon size={16} weight="duotone" className="h-6 w-6 text-destructive" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-destructive">Error loading analytics</h4>
                        <p className="text-muted-foreground text-sm mt-1">{error.message}</p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onRetry}
                        className="gap-2 rounded"
                    >
                        <ArrowClockwiseIcon size={16} weight="fill" className="h-4 w-4" />
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
        <div className="space-y-8">
            {/* Summary Stats */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <ChartBarIcon size={16} weight="duotone" className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">Performance Overview</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Users Entered"
                        value={summaryStats.totalUsers.toLocaleString()}
                        icon={UsersIcon}
                        isLoading={false}
                        description="Started the funnel journey"
                    />
                    <StatCard
                        title="Overall Conversion"
                        value={`${summaryStats.overallConversion.toFixed(1)}%`}
                        icon={TargetIcon}
                        isLoading={false}
                        description="Completed entire funnel"
                    />
                    <StatCard
                        title="Avg Completion Time"
                        value={formatCompletionTime(summaryStats.avgCompletionTime)}
                        icon={ClockIcon}
                        isLoading={false}
                        description="Time to complete funnel"
                    />
                    <StatCard
                        title="Biggest Drop-off Rate"
                        value={`${summaryStats.biggestDropoffRate.toFixed(1)}%`}
                        icon={TrendDownIcon}
                        isLoading={false}
                        description="Worst performing step"
                    />
                </div>
            </div>

            {/* Performance Insights */}
            {(summaryStats.overallConversion < 10 || summaryStats.overallConversion > 50) && (
                <div className="space-y-3">
                    {summaryStats.overallConversion < 10 && (
                        <ClosableAlert
                            id={`low-conversion-${funnelId}`}
                            title="Low Conversion Alert"
                            description="This funnel has a low conversion rate. Consider optimizing steps with high drop-offs to improve user flow and increase conversions."
                            icon={WarningIcon}
                            variant="warning"
                        >
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-medium">
                                    Current rate: {summaryStats.overallConversion.toFixed(1)}%
                                </span>
                                <Badge variant="destructive" className="text-xs">
                                    Needs attention
                                </Badge>
                            </div>
                        </ClosableAlert>
                    )}

                    {summaryStats.overallConversion > 50 && (
                        <ClosableAlert
                            id={`high-performance-${funnelId}`}
                            title="High Performance Funnel"
                            description="This funnel is performing excellently with a high conversion rate. Great work on optimizing the user experience!"
                            icon={CheckCircleIcon}
                            variant="success"
                        >
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-medium">
                                    Current rate: {summaryStats.overallConversion.toFixed(1)}%
                                </span>
                                <Badge variant="default" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                    Excellent
                                </Badge>
                            </div>
                        </ClosableAlert>
                    )}
                </div>
            )}

            {/* Funnel Flow */}
            <FunnelFlow
                steps={data.data.steps_analytics}
                totalUsers={summaryStats.totalUsers}
                formatCompletionTime={formatCompletionTime}
            />
        </div>
    );
} 