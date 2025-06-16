"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
    CopyIcon,
    KeyIcon,
    GearSixIcon,
    GlobeIcon,
    TestTubeIcon,
    LightningIcon,
    TrashIcon,
    ArrowClockwiseIcon,
    ArrowSquareOutIcon,
} from "@phosphor-icons/react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useRevenueConfig } from "../../hooks/use-revenue-config";

export function RevenueSettingsTab({ revenueConfig }: { revenueConfig: ReturnType<typeof useRevenueConfig> }) {
    const [webhookSecret, setWebhookSecret] = useState("");
    const [isLiveMode, setIsLiveMode] = useState(revenueConfig.isLiveMode || false);

    // Check if the webhook secret is masked (contains asterisks)
    const isMaskedSecret = (secret: string) => secret.includes('*');

    // Initialize webhook secret only if it's not masked
    useEffect(() => {
        const currentSecret = revenueConfig.webhookSecret || "";
        if (!isMaskedSecret(currentSecret)) {
            setWebhookSecret(currentSecret);
        }
    }, [revenueConfig.webhookSecret]);

    const handleSave = async () => {
        // Only update webhook secret if user has entered a new one
        const updateData: { webhookSecret?: string; isLiveMode: boolean } = {
            isLiveMode,
        };

        // Only include webhook secret if user has entered a new value
        if (webhookSecret.trim()) {
            updateData.webhookSecret = webhookSecret;
        }

        await revenueConfig.updateConfig(updateData);
    };

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`);
    };

    if (revenueConfig.isLoading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-muted rounded w-1/3"></div>
                    <div className="h-32 bg-muted rounded"></div>
                    <div className="h-32 bg-muted rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Revenue Settings</h2>
                <p className="text-muted-foreground">
                    Configure your Stripe webhook integration for revenue tracking
                </p>
            </div>

            {/* Webhook Configuration */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <KeyIcon size={20} weight="duotone" className="h-5 w-5" />
                        Webhook Configuration
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Webhook URL */}
                    <div className="space-y-2">
                        <Label htmlFor="webhook-url">Webhook URL</Label>
                        <div className="flex gap-2">
                            <Input
                                id="webhook-url"
                                value={revenueConfig.webhookUrl}
                                readOnly
                                className="font-mono text-sm"
                            />
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleCopy(revenueConfig.webhookUrl, "Webhook URL")}
                            >
                                <CopyIcon size={16} weight="duotone" className="h-4 w-4" />
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Add this URL to your Stripe webhook endpoints
                        </p>
                    </div>

                    {/* Webhook Token */}
                    <div className="space-y-2">
                        <Label htmlFor="webhook-token">Webhook Token</Label>
                        <div className="flex gap-2">
                            <Input
                                id="webhook-token"
                                value={revenueConfig.webhookToken}
                                readOnly
                                className="font-mono text-sm"
                            />
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleCopy(revenueConfig.webhookToken, "Webhook Token")}
                            >
                                <CopyIcon size={16} weight="duotone" className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => revenueConfig.regenerateWebhookToken()}
                                disabled={revenueConfig.isRegeneratingToken}
                            >
                                <ArrowClockwiseIcon size={16} weight="fill" className={`h-4 w-4 ${revenueConfig.isRegeneratingToken ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            This token authenticates webhook requests from Stripe
                        </p>
                    </div>

                    {/* Webhook Secret */}
                    <div className="space-y-2">
                        <Label htmlFor="webhook-secret">Webhook Secret</Label>
                        <div className="relative">
                            <Input
                                id="webhook-secret"
                                type="password"
                                placeholder={
                                    isMaskedSecret(revenueConfig.webhookSecret || "")
                                        ? "Enter new webhook secret to update..."
                                        : "whsec_..."
                                }
                                value={webhookSecret}
                                onChange={(e) => setWebhookSecret(e.target.value)}
                                className="font-mono text-sm"
                            />
                            {isMaskedSecret(revenueConfig.webhookSecret || "") && (
                                <div className="absolute inset-y-0 right-3 flex items-center">
                                    <span className="text-xs text-muted-foreground font-mono">
                                        {revenueConfig.webhookSecret}
                                    </span>
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {isMaskedSecret(revenueConfig.webhookSecret || "")
                                ? "Current secret is hidden for security. Enter a new secret to update it."
                                : "Get this from your Stripe webhook endpoint settings"
                            }
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Mode Configuration */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <GearSixIcon size={20} weight="duotone" className="h-5 w-5" />
                        Mode Configuration
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                                <Label htmlFor="live-mode">Live Mode</Label>
                                <Badge variant={isLiveMode ? "default" : "secondary"} className="text-xs">
                                    {isLiveMode ? (
                                        <>
                                            <GlobeIcon size={12} weight="duotone" className="h-3 w-3 mr-1" />
                                            Live
                                        </>
                                    ) : (
                                        <>
                                            <TestTubeIcon size={12} weight="duotone" className="h-3 w-3 mr-1" />
                                            Test
                                        </>
                                    )}
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {isLiveMode
                                    ? "Track real payments from live Stripe events"
                                    : "Track test payments for development and testing"
                                }
                            </p>
                        </div>
                        <Switch
                            id="live-mode"
                            checked={isLiveMode}
                            onCheckedChange={setIsLiveMode}
                        />
                    </div>

                    {!isLiveMode && (
                        <div className="rounded-md bg-blue-50 dark:bg-blue-950/20 p-3 text-blue-700 dark:text-blue-400 text-sm">
                            <div className="flex items-start gap-2">
                                <TestTubeIcon size={16} weight="duotone" className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium">Test Mode Active</p>
                                    <p className="text-xs mt-1">
                                        Only test payments will be tracked. Switch to live mode for production.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Setup Instructions */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <LightningIcon size={20} weight="duotone" className="h-5 w-5" />
                        Setup Instructions
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                                1
                            </div>
                            <div>
                                <p className="font-medium">Create Stripe Webhook</p>
                                <p className="text-sm text-muted-foreground">
                                    Go to your Stripe Dashboard → Webhooks → Add endpoint
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                                2
                            </div>
                            <div>
                                <p className="font-medium">Add Webhook URL</p>
                                <p className="text-sm text-muted-foreground">
                                    Copy the webhook URL above and paste it into Stripe
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                                3
                            </div>
                            <div>
                                <p className="font-medium">Configure Events</p>
                                <p className="text-sm text-muted-foreground">
                                    Select events: payment_intent.succeeded, payment_intent.payment_failed
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                                4
                            </div>
                            <div>
                                <p className="font-medium">Copy Webhook Secret</p>
                                <p className="text-sm text-muted-foreground">
                                    Copy the webhook secret from Stripe and paste it above
                                </p>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <a
                                href="https://dashboard.stripe.com/webhooks"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <ArrowSquareOutIcon size={16} weight="duotone" className="h-4 w-4 mr-2" />
                                Open Stripe Dashboard
                            </a>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                            <TrashIcon size={16} weight="duotone" className="h-4 w-4 mr-2" />
                            Delete Configuration
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Revenue Configuration</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to delete your revenue configuration? This will stop all revenue tracking and cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => revenueConfig.deleteConfig()}
                                disabled={revenueConfig.isDeleting}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                {revenueConfig.isDeleting ? "Deleting..." : "Delete"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <Button
                    onClick={handleSave}
                    disabled={revenueConfig.isCreating}
                >
                    {revenueConfig.isCreating ? "Saving..." : "Save Configuration"}
                </Button>
            </div>
        </div>
    );
} 