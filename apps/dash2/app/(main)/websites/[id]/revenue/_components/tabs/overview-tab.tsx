"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CreditCard, CheckCircle, Clock, Settings, AlertCircle, TrendingUp, DollarSign } from "lucide-react";

interface OverviewTabProps {
    onSetupClick: () => void;
    isSetupComplete: boolean;
    setupProgress: number;
    isLiveMode: boolean;
}

export function RevenueOverviewTab({
    onSetupClick,
    isSetupComplete,
    setupProgress,
    isLiveMode
}: OverviewTabProps) {
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
                        <Button onClick={onSetupClick} className="w-full">
                            <Settings className="h-4 w-4 mr-2" />
                            Continue Setup
                        </Button>
                    </CardContent>
                </Card>

                {/* Preview Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Revenue Overview</CardTitle>
                        <CardDescription>
                            Your revenue analytics will appear here once setup is complete
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-12">
                            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium mb-2">No revenue data yet</h3>
                            <p className="text-muted-foreground mb-4">
                                Complete the Stripe integration to start tracking revenue metrics
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

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

            {/* Revenue Metrics Placeholder */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$0.00</div>
                        <p className="text-xs text-muted-foreground">
                            Revenue data will appear here
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                        <p className="text-xs text-muted-foreground">
                            Transaction count will appear here
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$0.00</div>
                        <p className="text-xs text-muted-foreground">
                            Average order value will appear here
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0%</div>
                        <p className="text-xs text-muted-foreground">
                            Success rate will appear here
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Revenue Chart Placeholder */}
            <Card>
                <CardHeader>
                    <CardTitle>Revenue Over Time</CardTitle>
                    <CardDescription>
                        Revenue trends will be displayed here once data is available
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
                        <div className="text-center">
                            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">Revenue chart will appear here</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 