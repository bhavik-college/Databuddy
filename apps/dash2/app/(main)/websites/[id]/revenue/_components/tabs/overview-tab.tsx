"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CreditCard, CheckCircle, Clock, Settings, AlertCircle, TrendingUp, DollarSign, BarChart3, PieChart } from "lucide-react";
import { RevenueSummaryCards } from "../revenue-summary-cards";
import { QuickSettingsModal } from "../quick-settings-modal";
import { useRevenueAnalytics } from "../../hooks/use-revenue-analytics";
import { useRevenueConfig } from "../../hooks/use-revenue-config";
import { useAtom } from 'jotai';
import { formattedDateRangeAtom } from '@/stores/jotai/filterAtoms';
import { useMemo } from 'react';
import { MetricsChart } from "@/components/charts/metrics-chart";
import { DistributionChart } from "@/components/charts/distribution-chart";
import { VersatileAIChart } from "@/components/charts/versatile-ai-chart";

interface OverviewTabProps {
    onSetupClick: () => void;
    isSetupComplete: boolean;
    setupProgress: number;
    isLiveMode: boolean;
}

// Process revenue trend data for charts
function processRevenueTrendData(trends: any[]) {
    if (!trends || trends.length === 0) return [];

    return trends.map(item => ({
        date: item.date,
        revenue: item.revenue || 0,
        transactions: item.transactions || 0
    }));
}

// Process distribution data
function processDistributionData(data: any[], valueKey: string = 'total_revenue', nameKey: string = 'name') {
    if (!data || data.length === 0) return [];

    return data.slice(0, 5).map(item => ({
        name: item[nameKey] || 'Unknown',
        value: item[valueKey] || 0
    }));
}

export function RevenueOverviewTab({
    onSetupClick,
    isSetupComplete,
    setupProgress,
    isLiveMode
}: OverviewTabProps) {
    const [formattedDateRange] = useAtom(formattedDateRangeAtom);
    const revenueConfig = useRevenueConfig();

    // Convert the formatted date range to the expected format
    const dateRange = useMemo(() => ({
        start_date: formattedDateRange.startDate,
        end_date: formattedDateRange.endDate,
        granularity: 'daily' as const,
        timezone: 'UTC'
    }), [formattedDateRange]);

    const {
        formattedData,
        isLoading,
        isError,
        isEmpty
    } = useRevenueAnalytics(dateRange);

    if (!isSetupComplete) {
        return (
            <div className="space-y-6">
                {/* Setup Status Card */}
                <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            Setup In Progress
                        </CardTitle>
                        <CardDescription>
                            Complete your Stripe integration to start tracking revenue analytics.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Setup Progress</span>
                                <span>{setupProgress}%</span>
                            </div>
                            <Progress value={setupProgress} className="h-2" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                                {setupProgress >= 50 ? (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                    <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                                )}
                                <span>Webhook endpoint configured</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                {setupProgress >= 100 ? (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                    <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                                )}
                                <span>Webhook secret configured</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={onSetupClick} className="flex-1">
                                <Settings className="h-4 w-4 mr-2" />
                                Continue Setup
                            </Button>
                            <QuickSettingsModal
                                webhookToken={revenueConfig.webhookToken}
                                webhookSecret={revenueConfig.webhookSecret}
                                isLiveMode={revenueConfig.isLiveMode}
                                webhookUrl={revenueConfig.webhookUrl}
                                onSave={(data) => {
                                    revenueConfig.updateConfig({
                                        webhookSecret: data.webhookSecret,
                                        isLiveMode: data.isLiveMode
                                    });
                                }}
                                onRegenerateToken={revenueConfig.regenerateWebhookToken}
                                copyToClipboard={revenueConfig.copyToClipboard}
                                isSaving={revenueConfig.isCreating}
                                isRegeneratingToken={revenueConfig.isRegeneratingToken}
                                trigger={
                                    <Button variant="outline" size="sm">
                                        Quick Setup
                                    </Button>
                                }
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Preview Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5" />
                            Revenue Overview
                        </CardTitle>
                        <CardDescription>
                            Your revenue analytics will appear here once setup is complete
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-12">
                            <div className="relative">
                                <BarChart3 className="h-16 w-16 text-muted-foreground/20 mx-auto" strokeWidth={1.5} />
                                <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent rounded-full blur-xl" />
                            </div>
                            <h3 className="text-lg font-semibold mt-6 mb-2">No revenue data yet</h3>
                            <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
                                Complete the Stripe integration to start tracking comprehensive revenue metrics and insights
                            </p>
                            <div className="mt-6 p-4 bg-muted/50 rounded-lg max-w-md mx-auto">
                                <p className="text-sm text-muted-foreground">
                                    Once configured, you'll see revenue trends, transaction analytics, and geographic insights
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Process chart data
    const chartData = processRevenueTrendData(formattedData?.trends || []);
    const countryDistribution = processDistributionData(formattedData?.byCountry || []);
    const currencyDistribution = processDistributionData(formattedData?.byCurrency || []);

    return (
        <div className="space-y-6">
            {/* Integration Status */}
            <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        Integration Active
                    </CardTitle>
                    <CardDescription>
                        Your Stripe integration is configured and ready to track revenue.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Mode:</span>
                        <Badge variant={isLiveMode ? "default" : "secondary"}>
                            {isLiveMode ? "Production" : "Test"}
                        </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Webhook:</span>
                        <Badge variant="outline" className="font-mono text-xs">
                            Active
                        </Badge>
                    </div>
                    <Button onClick={onSetupClick} variant="outline" className="w-full">
                        <Settings className="h-4 w-4 mr-2" />
                        Manage Settings
                    </Button>
                </CardContent>
            </Card>

            {/* Revenue Metrics */}
            <RevenueSummaryCards />

            {/* Revenue Chart */}
            {!isEmpty && !isError && (
                <div className="rounded border shadow-sm">
                    <div className="p-4 border-b">
                        <div>
                            <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Revenue Trends
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Daily revenue and transaction performance
                            </p>
                        </div>
                    </div>
                    <div>
                        <MetricsChart
                            data={chartData}
                            isLoading={isLoading}
                            height={320}
                        />
                    </div>
                </div>
            )}

            {/* Distribution Charts */}
            {!isEmpty && !isError && (
                <div className="grid gap-4 md:grid-cols-2">
                    <DistributionChart
                        data={countryDistribution}
                        isLoading={isLoading}
                        title="Revenue by Country"
                        description="Top performing countries"
                        height={250}
                    />
                    <DistributionChart
                        data={currencyDistribution}
                        isLoading={isLoading}
                        title="Revenue by Currency"
                        description="Currency breakdown"
                        height={250}
                    />
                </div>
            )}

            {/* Empty State for Revenue Data */}
            {isEmpty && !isLoading && !isError && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Revenue Over Time
                        </CardTitle>
                        <CardDescription>
                            Revenue trends and analytics
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-12">
                            <div className="relative">
                                <BarChart3 className="h-16 w-16 text-muted-foreground/20 mx-auto" strokeWidth={1.5} />
                                <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent rounded-full blur-xl" />
                            </div>
                            <h3 className="text-lg font-semibold mt-6 mb-2">No revenue data yet</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto">
                                Revenue analytics will appear here once you start receiving payments through your Stripe integration
                            </p>
                            <div className="mt-6 p-4 bg-muted/50 rounded-lg max-w-md mx-auto">
                                <p className="text-sm text-muted-foreground">
                                    Make sure your Stripe webhook is properly configured and receiving events
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Error State */}
            {isError && (
                <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                            Error Loading Revenue Data
                        </CardTitle>
                        <CardDescription>
                            There was an issue loading your revenue analytics
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            Please check your Stripe integration settings or try refreshing the page.
                        </p>
                        <Button onClick={onSetupClick} variant="outline">
                            <Settings className="h-4 w-4 mr-2" />
                            Check Settings
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
} 