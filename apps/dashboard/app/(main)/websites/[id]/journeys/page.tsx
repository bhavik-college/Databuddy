"use client";

import { useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import { RefreshCw, TrendingUp, TrendingDown, Users, MousePointer, ArrowRight, ChevronRight, ExternalLink, Timer, Target, Route } from "lucide-react";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/analytics/data-table";
import { StatCard } from "@/components/analytics/stat-card";
import { ClosableAlert } from "@/components/ui/closable-alert";
import { useJourneyAnalytics, type JourneyTransition, type JourneyPath, type JourneyDropoff, type JourneyEntryPoint } from "@/hooks/use-dynamic-query";
import { useWebsite } from "@/hooks/use-websites";
import { useAtom } from "jotai";
import {
    dateRangeAtom,
    timeGranularityAtom,
    formattedDateRangeAtom,
} from "@/stores/jotai/filterAtoms";
import type { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function JourneysPage() {
    const { id } = useParams();
    const websiteId = id as string;
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [currentDateRange] = useAtom(dateRangeAtom);
    const [currentGranularity] = useAtom(timeGranularityAtom);
    const [formattedDateRangeState] = useAtom(formattedDateRangeAtom);

    const memoizedDateRangeForTabs = useMemo(() => ({
        start_date: formattedDateRangeState.startDate,
        end_date: formattedDateRangeState.endDate,
        granularity: currentGranularity,
    }), [formattedDateRangeState, currentGranularity]);

    const { data: websiteData } = useWebsite(websiteId);

    // Use the new simplified journey analytics hook
    const {
        journeyData,
        summaryStats,
        isLoading: isBatchLoading,
        error: batchError,
        refetch: refetchBatch,
        debugInfo,
        hasJourneyData,
        hasPathData,
        hasDropoffData,
        hasEntryPointData
    } = useJourneyAnalytics(websiteId, memoizedDateRangeForTabs);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        try {
            await refetchBatch();
        } catch (error) {
            console.error("Failed to refresh journey data:", error);
        } finally {
            setIsRefreshing(false);
        }
    }, [refetchBatch]);

    // Helper function to create better page display
    const formatPagePath = (url: string) => {
        if (!url) return '/';
        try {
            let path = url.startsWith('http') ? new URL(url).pathname : url;
            if (!path.startsWith('/')) path = `/${path}`;
            return path;
        } catch {
            return url.startsWith('/') ? url : `/${url}`;
        }
    };

    // Helper to get page name from path
    const getPageDisplayName = (path: string) => {
        const cleanPath = formatPagePath(path);
        if (cleanPath === '/') return 'Home';
        return cleanPath.split('/').filter(Boolean).join(' › ') || 'Home';
    };

    // Enhanced page column with better design - simplified
    const createEnhancedPageColumn = (header: string, accessorKey: string) => ({
        id: accessorKey,
        accessorKey,
        header,
        cell: (info: any) => {
            const url = info.getValue() as string;
            const displayName = getPageDisplayName(url);

            return (
                <div className="min-w-0">
                    <div className="font-medium text-sm text-foreground truncate" title={displayName}>
                        {displayName}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono truncate" title={formatPagePath(url)}>
                        {formatPagePath(url)}
                    </div>
                </div>
            );
        },
        minSize: 200,
        size: 250,
    });

    // Journey Flow Columns - clean and sortable with visual elements
    const journeyFlowColumns = useMemo(() => [
        {
            ...createEnhancedPageColumn("From Page", "from_page"),
            size: 200,
        },
        {
            id: "flow_indicator",
            header: "",
            cell: ({ row }: any) => {
                const transitions = row.original.transitions;
                return (
                    <div>
                        <div>
                            <ArrowRight className="h-4 w-4 text-blue-500" />
                            <span className="text-xs text-muted-foreground font-mono">
                                {transitions.toLocaleString()}
                            </span>
                        </div>
                    </div>
                );
            },
            enableSorting: false,
            size: 80,
        },
        {
            ...createEnhancedPageColumn("To Page", "to_page"),
            size: 200,
        },
        {
            id: "users",
            accessorKey: "users",
            header: "Users",
            cell: (info: any) => (
                <div>
                    <div>
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{(info.getValue() as number)?.toLocaleString()}</span>
                    </div>
                </div>
            ),
        },
        {
            id: "sessions",
            accessorKey: "sessions",
            header: "Sessions",
            cell: (info: any) => (
                <div>
                    <div className="font-medium">{(info.getValue() as number)?.toLocaleString()}</div>
                </div>
            ),
        },
        {
            id: "avg_step_in_journey",
            accessorKey: "avg_step_in_journey",
            header: "Journey Step",
            cell: (info: any) => (
                <div>
                    <Badge variant="outline" className="font-mono text-xs">
                        Step {info.getValue()}
                    </Badge>
                </div>
            ),
        },
    ], []);

    // Journey Paths - with better visualization
    const journeyPathsColumns = useMemo(() => [
        {
            id: "journey_path",
            accessorKey: "name",
            header: "Journey Path",
            cell: (info: any) => {
                const pathString = info.getValue() as string;
                const pages = pathString.split(' → ').map(p => p.trim());

                return (
                    <div className="space-y-2 min-w-0">
                        <div className="flex items-center gap-1 flex-wrap">
                            {pages.slice(0, 3).map((page, index) => (
                                <div key={index} className="flex items-center gap-1">
                                    <div className="bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-xs font-medium border border-blue-200 dark:border-blue-800 truncate max-w-[100px]" title={page}>
                                        {getPageDisplayName(page)}
                                    </div>
                                    {index < Math.min(pages.length - 1, 2) && (
                                        <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                    )}
                                </div>
                            ))}
                            {pages.length > 3 && (
                                <span className="text-xs text-muted-foreground">+{pages.length - 3} more</span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Target className="h-3 w-3" />
                            <span>{pages.length} pages</span>
                        </div>
                    </div>
                );
            },
            size: 300,
        },
        {
            id: "frequency",
            accessorKey: "frequency",
            header: "Frequency",
            cell: (info: any) => (
                <div>
                    <div className="font-bold text-blue-600">{(info.getValue() as number)?.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">occurrences</div>
                </div>
            ),
        },
        {
            id: "unique_users",
            accessorKey: "unique_users",
            header: "Users",
            cell: (info: any) => (
                <div>
                    <div className="font-medium text-green-600">{(info.getValue() as number)?.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">unique</div>
                </div>
            ),
        },
        {
            id: "avg_pages_in_path",
            accessorKey: "avg_pages_in_path",
            header: "Avg Pages",
            cell: (info: any) => (
                <div>
                    <div>
                        <span className="font-medium">{info.getValue()}</span>
                        <span className="text-xs text-muted-foreground">pages</span>
                    </div>
                </div>
            ),
        },
        {
            id: "avg_duration_minutes",
            accessorKey: "avg_duration_minutes",
            header: "Duration",
            cell: (info: any) => (
                <div>
                    <div className="flex justify-center gap-1">
                        <Timer className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{info.getValue()}m</span>
                    </div>
                </div>
            ),
        },
    ], []);

    // Drop-offs - with visual indicators
    const dropoffColumns = useMemo(() => [
        {
            ...createEnhancedPageColumn("Page", "name"),
            size: 200,
        },
        {
            id: "total_visits",
            accessorKey: "total_visits",
            header: "Total Visits",
            cell: (info: any) => (
                <div>
                    <div className="font-medium">{(info.getValue() as number)?.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">visits</div>
                </div>
            ),
        },
        {
            id: "exits",
            accessorKey: "exits",
            header: "Exits",
            cell: (info: any) => (
                <div>
                    <div>
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="font-medium text-red-600">{(info.getValue() as number)?.toLocaleString()}</span>
                    </div>
                </div>
            ),
        },
        {
            id: "exit_rate",
            accessorKey: "exit_rate",
            header: "Exit Rate",
            cell: (info: any) => {
                const rate = info.getValue() as number;
                return (
                    <div>
                        <div>
                            <Badge variant={rate > 70 ? "destructive" : rate > 40 ? "secondary" : "default"}>
                                {rate}%
                            </Badge>
                            {rate > 70 && <TrendingDown className="h-3 w-3 text-red-500" />}
                        </div>
                    </div>
                );
            },
        },
        {
            id: "continuations",
            accessorKey: "continuations",
            header: "Continuations",
            cell: (info: any) => (
                <div>
                    <div>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="font-medium text-green-600">{(info.getValue() as number)?.toLocaleString()}</span>
                    </div>
                </div>
            ),
        },
        {
            id: "continuation_rate",
            accessorKey: "continuation_rate",
            header: "Continue Rate",
            cell: (info: any) => {
                const rate = info.getValue() as number;
                return (
                    <div>
                        <div>
                            <Badge variant={rate > 60 ? "default" : rate > 30 ? "secondary" : "destructive"}>
                                {rate}%
                            </Badge>
                            {rate > 60 && <TrendingUp className="h-3 w-3 text-green-500" />}
                        </div>
                    </div>
                );
            },
        },
    ], []);

    // Entry Points - with visual enhancements
    const entryPointsColumns = useMemo(() => [
        {
            ...createEnhancedPageColumn("Entry Page", "name"),
            size: 200,
        },
        {
            id: "entries",
            accessorKey: "entries",
            header: "Entries",
            cell: (info: any) => (
                <div>
                    <div className="font-bold text-blue-600">{(info.getValue() as number)?.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">entries</div>
                </div>
            ),
        },
        {
            id: "users",
            accessorKey: "users",
            header: "Users",
            cell: (info: any) => (
                <div>
                    <div>
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{(info.getValue() as number)?.toLocaleString()}</span>
                    </div>
                </div>
            ),
        },
        {
            id: "sessions",
            accessorKey: "sessions",
            header: "Sessions",
            cell: (info: any) => (
                <div>
                    <div className="font-medium text-purple-600">{(info.getValue() as number)?.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">sessions</div>
                </div>
            ),
        },
        {
            id: "bounce_rate",
            accessorKey: "bounce_rate",
            header: "Bounce Rate",
            cell: (info: any) => {
                const rate = info.getValue() as number;
                const safeRate = typeof rate === 'number' && !isNaN(rate) ? rate : 0;
                return (
                    <div>
                        <Badge variant={safeRate > 70 ? "destructive" : safeRate > 40 ? "secondary" : "default"}>
                            {safeRate.toFixed(1)}%
                        </Badge>
                    </div>
                );
            },
        },
        {
            id: "avg_pages_per_session",
            accessorKey: "avg_pages_per_session",
            header: "Pages/Session",
            cell: (info: any) => {
                const value = info.getValue() as number;
                const safeValue = typeof value === 'number' && !isNaN(value) ? value : 0;
                return (
                    <div>
                        <div>
                            <Target className="h-3 w-3 text-muted-foreground" />
                            <span className="font-medium">{safeValue.toFixed(1)}</span>
                        </div>
                    </div>
                );
            },
        },
    ], []);

    // Create tabs structure for DataTable with better organization
    const tabs = useMemo(() => [
        {
            id: 'flow',
            label: 'Page Flow',
            description: 'Track direct page-to-page navigation patterns and user flow directions',
            data: journeyData.transitions.map((item, i) => ({ ...item, _uniqueKey: `flow-${i}` })) as any,
            columns: journeyFlowColumns as any,
        },
        {
            id: 'paths',
            label: 'Journey Paths',
            description: 'View complete sequences of pages users visit in order (up to 5 pages)',
            data: journeyData.paths.map((item, i) => ({ ...item, _uniqueKey: `path-${i}` })) as any,
            columns: journeyPathsColumns as any,
        },
        {
            id: 'dropoffs',
            label: 'Drop-off Analysis',
            description: 'Find pages with high exit rates where users leave your website',
            data: journeyData.dropoffs.map((item, i) => ({ ...item, _uniqueKey: `dropoff-${i}` })) as any,
            columns: dropoffColumns as any,
        },
        {
            id: 'entries',
            label: 'Entry Points',
            description: 'Analyze landing pages and their bounce rates (first page = exit)',
            data: journeyData.entryPoints.map((item, i) => ({ ...item, _uniqueKey: `entry-${i}` })) as any,
            columns: entryPointsColumns as any,
        },
    ] as any, [journeyData, journeyFlowColumns, journeyPathsColumns, dropoffColumns, entryPointsColumns]);

    const isLoading = isBatchLoading || isRefreshing;

    if (batchError) {
        return (
            <div className="p-6 max-w-[1600px] mx-auto">
                <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 rounded-xl">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center space-y-3">
                            <div className="p-3 rounded-full bg-destructive/10 border border-destructive/20">
                                <TrendingDown className="h-6 w-6 text-destructive" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-destructive">Error loading journey data</h4>
                                <p className="text-destructive/80 text-sm mt-1">{batchError.message}</p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRefresh}
                                className="gap-2 rounded-lg"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Retry
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-3 sm:p-4 lg:p-6 max-w-[1600px] mx-auto space-y-6">
            {/* Header */}
            <div className="border-b bg-gradient-to-r from-background via-background to-muted/20 -mx-3 sm:-mx-4 lg:-mx-6 px-3 sm:px-4 lg:px-6 pb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                                <Route className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">User Journeys</h1>
                                <p className="text-muted-foreground text-sm sm:text-base">
                                    Analyze user navigation patterns and identify optimization opportunities
                                </p>
                            </div>
                        </div>
                    </div>
                    <Button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        variant="outline"
                        size="default"
                        className="gap-2 rounded-lg px-4 py-2 font-medium border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
                    >
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Refresh Data
                    </Button>
                </div>
            </div>

            {/* Enhanced Summary Stats */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <MousePointer className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold text-foreground">Journey Overview</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Total Page Transitions"
                        value={summaryStats.totalTransitions.toLocaleString()}
                        icon={MousePointer}
                        isLoading={isLoading}
                        description="Times users navigated from one page to another"
                    />
                    <StatCard
                        title="Multi-Page Users"
                        value={summaryStats.totalUsers.toLocaleString()}
                        icon={Users}
                        isLoading={isLoading}
                        description="Users who visited more than one page (excludes bounces)"
                    />
                    <StatCard
                        title="Avg Journey Position"
                        value={summaryStats.avgStepInJourney.toString()}
                        icon={ChevronRight}
                        isLoading={isLoading}
                        description="Average step number when users make page transitions"
                    />
                    <StatCard
                        title="Avg Page Exit Rate"
                        value={`${summaryStats.avgExitRate}%`}
                        icon={TrendingDown}
                        isLoading={isLoading}
                        description="Average % of visitors who leave from each page (not bounces)"
                    />
                </div>
            </div>

            {/* Quick Insights Cards */}
            {!isLoading && (hasJourneyData || hasPathData || hasDropoffData || hasEntryPointData) && (
                <div className="space-y-4">
                    <div className="space-y-3">
                        {/* Drop-off Alert */}
                        {journeyData.dropoffs.length > 0 && journeyData.dropoffs[0].exit_rate > 70 && (
                            <ClosableAlert
                                id={`high-dropoff-${journeyData.dropoffs[0].name}`}
                                title="High Drop-off Page Alert"
                                description={`The page "${getPageDisplayName(journeyData.dropoffs[0].name)}" has an unusually high exit rate. Many users leave your site from here instead of continuing their journey.`}
                                icon={TrendingDown}
                                variant="error"
                            >
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-medium">
                                            Page: {getPageDisplayName(journeyData.dropoffs[0].name)}
                                        </span>
                                        <Badge variant="destructive" className="text-xs">
                                            {journeyData.dropoffs[0].exit_rate}% exit rate
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground">
                                            {journeyData.dropoffs[0].exits.toLocaleString()} exits
                                        </span>
                                        <span className="text-muted-foreground">
                                            {journeyData.dropoffs[0].total_visits.toLocaleString()} total visits
                                        </span>
                                    </div>
                                </div>
                            </ClosableAlert>
                        )}
                    </div>
                </div>
            )}

            <div className="space-y-4">
                <DataTable
                    tabs={tabs}
                    title="Journey Analysis"
                    description="Detailed breakdown of user navigation patterns"
                    isLoading={isLoading}
                    initialPageSize={15}
                    minHeight={400}
                />
            </div>
        </div>
    );
} 