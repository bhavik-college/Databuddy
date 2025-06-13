"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Key, CheckCircle, AlertCircle } from "lucide-react";
import type { ConfigurationSummaryProps } from "../../utils/types";

export function ConfigurationSummary({
    webhookToken,
    isLiveMode,
    webhookUrl,
}: ConfigurationSummaryProps) {
    const isConfigured = !!(webhookToken && webhookUrl);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    {isConfigured ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                        <AlertCircle className="h-5 w-5 text-orange-500" />
                    )}
                    Configuration Summary
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <Label className="text-xs text-muted-foreground">Webhook Token</Label>
                        <div className="flex items-center gap-2">
                            <p className="font-mono">{webhookToken || 'Not configured'}</p>
                            {webhookToken && <Badge variant="outline" className="text-xs">Active</Badge>}
                        </div>
                    </div>
                    <div>
                        <Label className="text-xs text-muted-foreground">Mode</Label>
                        <div className="flex items-center gap-2">
                            <p>{isLiveMode ? 'Production' : 'Test'}</p>
                            <Badge variant={isLiveMode ? "default" : "secondary"} className="text-xs">
                                {isLiveMode ? 'Live' : 'Test'}
                            </Badge>
                        </div>
                    </div>
                    <div className="md:col-span-2">
                        <Label className="text-xs text-muted-foreground">Webhook URL</Label>
                        <p className="font-mono text-xs break-all">{webhookUrl || 'Not configured'}</p>
                    </div>
                </div>

                {isConfigured && (
                    <div className="pt-2 border-t">
                        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                            <CheckCircle className="h-4 w-4" />
                            <span>Integration is active and ready to receive webhooks</span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
} 