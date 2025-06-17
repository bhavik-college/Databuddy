"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowClockwiseIcon, PlusIcon, TrendDownIcon, TargetIcon } from "@phosphor-icons/react";

interface PageHeaderProps {
    websiteName?: string;
    funnelsCount: number;
    isRefreshing: boolean;
    isLoading: boolean;
    hasError: boolean;
    onRefresh: () => void;
    onCreateFunnel: () => void;
}

export function PageHeader({
    websiteName,
    funnelsCount,
    isRefreshing,
    isLoading,
    hasError,
    onRefresh,
    onCreateFunnel
}: PageHeaderProps) {
    return (
        <div className="space-y-6">
            {/* Header - matching journeys design */}
            <div className="border-b bg-muted/20 rounded py-2 -mx-3 sm:-mx-4 lg:-mx-6 px-3 sm:px-4 lg:px-6 pb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                                <TargetIcon size={16} weight="duotone" className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Conversion Funnels</h1>
                                <p className="text-muted-foreground text-sm sm:text-base">
                                    Track user journeys and optimize conversion drop-off points
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={onRefresh}
                            disabled={isRefreshing}
                            variant="outline"
                            size="default"
                            className="gap-2 rounded-lg px-4 py-2 font-medium border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
                        >
                            <ArrowClockwiseIcon size={16} weight="fill" className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            Refresh Data
                        </Button>
                        <Button
                            onClick={onCreateFunnel}
                            className="gap-2 rounded-lg px-4 py-2 font-medium bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transition-all duration-300 group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                            <PlusIcon size={16} className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300 relative z-10" />
                            <span className="relative z-10">Create Funnel</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Error State */}
            {hasError && (
                <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 rounded-xl">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center space-y-3">
                            <div className="p-3 rounded-full bg-destructive/10 border border-destructive/20">
                                <TrendDownIcon size={16} weight="duotone" className="h-6 w-6 text-destructive" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-destructive">Error loading funnel data</h4>
                                <p className="text-destructive/80 text-sm mt-1">
                                    There was an issue loading your funnels. Please try refreshing the page.
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onRefresh}
                                className="gap-2 rounded-lg"
                            >
                                <ArrowClockwiseIcon size={16} weight="fill" className="h-4 w-4" />
                                Retry
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Funnels Grid Header */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Your Funnels</h2>
                    <div className="text-sm text-muted-foreground">
                        {isLoading ? (
                            <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
                        ) : (
                            `${funnelsCount} funnel${funnelsCount !== 1 ? 's' : ''}`
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
} 