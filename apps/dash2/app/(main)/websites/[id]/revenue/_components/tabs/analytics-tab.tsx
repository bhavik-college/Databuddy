"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export function RevenueAnalyticsTab() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Revenue Analytics</CardTitle>
                <CardDescription>
                    Detailed revenue insights and trends
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-center py-12">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Analytics coming soon</h3>
                    <p className="text-muted-foreground">
                        Advanced revenue analytics will be available here
                    </p>
                </div>
            </CardContent>
        </Card>
    );
} 