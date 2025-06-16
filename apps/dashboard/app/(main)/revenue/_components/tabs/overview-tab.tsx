"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Zap } from "lucide-react";

interface OverviewTabProps {
    onSetupClick: () => void;
    isSetupComplete: boolean;
    setupProgress: number;
    isLiveMode: boolean;
    websiteId?: string;
}

export function RevenueOverviewTab({
    onSetupClick,
    isSetupComplete,
}: OverviewTabProps) {
    if (!isSetupComplete) {
        return (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <div className="inline-block p-3 bg-orange-100 rounded-full dark:bg-orange-900/20">
                    <AlertCircle className="h-8 w-8 text-orange-500" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">Stripe Integration Not Configured</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                    You need to configure your Stripe webhook to start tracking revenue.
                </p>
                <div className="mt-6">
                    <Button onClick={onSetupClick}>
                        <Zap className="h-4 w-4 mr-2" />
                        Go to Setup
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Revenue Tracking Active</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        Your Stripe webhook is configured and ready to track revenue across all your websites.
                    </p>
                    <div className="mt-4">
                        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                            ✓ Active
                        </Badge>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 