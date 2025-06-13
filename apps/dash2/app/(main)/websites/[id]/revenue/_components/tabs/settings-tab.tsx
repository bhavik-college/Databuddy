"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Zap, Settings, Copy, RefreshCw, Trash2, ExternalLink, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { OnboardingFlow } from "../onboarding/onboarding-flow";
import { ConfigurationSummary } from "../onboarding/configuration-summary";
import { toast } from "sonner";
import type { OnboardingStep } from "../../utils/types";

interface SettingsTabProps {
    onboardingStep: OnboardingStep;
    setOnboardingStep: (step: OnboardingStep) => void;
    webhookToken: string;
    webhookSecret: string;
    isLiveMode: boolean;
    copied: boolean;
    copyToClipboard: (text: string, label: string) => void;
    webhookUrl: string;
    onSave: (data: { webhookSecret: string; isLiveMode: boolean }) => void;
    isSaving?: boolean;
    onRegenerateToken?: () => void;
    onDeleteConfig?: () => void;
    isRegeneratingToken?: boolean;
    isDeleting?: boolean;
}

export function RevenueSettingsTab({
    onboardingStep,
    setOnboardingStep,
    webhookToken,
    webhookSecret,
    isLiveMode,
    copied,
    copyToClipboard,
    webhookUrl,
    onSave,
    isSaving = false,
    onRegenerateToken,
    onDeleteConfig,
    isRegeneratingToken = false,
    isDeleting = false,
}: SettingsTabProps) {
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [localWebhookSecret, setLocalWebhookSecret] = useState(webhookSecret);
    const [localIsLiveMode, setLocalIsLiveMode] = useState(isLiveMode);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Sync local state with props when they change
    useEffect(() => {
        setLocalWebhookSecret(webhookSecret);
        setLocalIsLiveMode(isLiveMode);
        setHasUnsavedChanges(false);
    }, [webhookSecret, isLiveMode]);

    // Determine current status
    const isWebhookConfigured = !!(webhookToken);
    const isSecretConfigured = !!(webhookSecret);
    const isSetupComplete = isWebhookConfigured && isSecretConfigured;

    const handleSecretChange = (value: string) => {
        setLocalWebhookSecret(value);
        setHasUnsavedChanges(value !== webhookSecret || localIsLiveMode !== isLiveMode);
    };

    const handleLiveModeChange = (value: boolean) => {
        setLocalIsLiveMode(value);
        setHasUnsavedChanges(localWebhookSecret !== webhookSecret || value !== isLiveMode);
    };

    const handleSave = () => {
        onSave({
            webhookSecret: localWebhookSecret,
            isLiveMode: localIsLiveMode
        });
        setHasUnsavedChanges(false);
    };

    const handleReset = () => {
        setLocalWebhookSecret(webhookSecret);
        setLocalIsLiveMode(isLiveMode);
        setHasUnsavedChanges(false);
    };

    const handleDeleteConfig = () => {
        if (window.confirm('Are you sure you want to reset your integration? This will remove all configuration and cannot be undone.')) {
            onDeleteConfig?.();
            // Reset local state after deletion
            setLocalWebhookSecret('');
            setLocalIsLiveMode(false);
            setHasUnsavedChanges(false);
        }
    };

    if (showOnboarding) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold">Setup Wizard</h2>
                        <p className="text-sm text-muted-foreground">
                            Follow the step-by-step guide to configure your Stripe integration
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => setShowOnboarding(false)}
                    >
                        Exit Wizard
                    </Button>
                </div>

                <Card>
                    <CardContent className="pt-6">
                        <OnboardingFlow
                            currentStep={onboardingStep}
                            setCurrentStep={setOnboardingStep}
                            webhookSecret={webhookSecret}
                            isLiveMode={isLiveMode}
                            copied={copied}
                            copyToClipboard={copyToClipboard}
                            webhookUrl={webhookUrl}
                            onSave={onSave}
                            isSaving={isSaving}
                        />
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Status Overview */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isSetupComplete
                                ? 'bg-green-100 dark:bg-green-900/20'
                                : 'bg-orange-100 dark:bg-orange-900/20'
                                }`}>
                                {isSetupComplete ? (
                                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                                ) : (
                                    <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                )}
                            </div>
                            <div>
                                <CardTitle className="text-lg">
                                    {isSetupComplete ? 'Integration Active' : 'Setup Required'}
                                </CardTitle>
                                <CardDescription>
                                    {isSetupComplete
                                        ? 'Your Stripe integration is configured and tracking revenue'
                                        : 'Complete the setup to start tracking revenue analytics'
                                    }
                                </CardDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant={isSetupComplete ? "default" : "secondary"}>
                                {isLiveMode ? 'Live Mode' : 'Test Mode'}
                            </Badge>
                            {!isSetupComplete && (
                                <Button
                                    onClick={() => setShowOnboarding(true)}
                                    size="sm"
                                >
                                    Start Setup
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Quick Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Configuration
                    </CardTitle>
                    <CardDescription>
                        Manage your Stripe integration settings
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Webhook Configuration */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-base font-medium">Webhook Endpoint</Label>
                            {webhookToken && (
                                <Badge variant="outline" className="text-xs">
                                    Token: {webhookToken.slice(0, 8)}...
                                </Badge>
                            )}
                        </div>

                        {webhookUrl ? (
                            <div className="flex items-center gap-2">
                                <Input
                                    value={webhookUrl}
                                    readOnly
                                    className="font-mono text-sm"
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => copyToClipboard(webhookUrl, 'Webhook URL')}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open('https://dashboard.stripe.com/webhooks', '_blank')}
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <div className="p-4 border border-dashed rounded-lg text-center text-muted-foreground">
                                <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                                <p className="text-sm">No webhook endpoint configured</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-2"
                                    onClick={() => setShowOnboarding(true)}
                                >
                                    Configure Now
                                </Button>
                            </div>
                        )}
                    </div>

                    <Separator />

                    {/* Webhook Secret */}
                    <div className="space-y-4">
                        <Label htmlFor="webhook-secret" className="text-base font-medium">
                            Webhook Secret
                        </Label>
                        <div className="space-y-2">
                            <Input
                                id="webhook-secret"
                                type="password"
                                placeholder="whsec_..."
                                value={localWebhookSecret}
                                onChange={(e) => handleSecretChange(e.target.value)}
                                className="font-mono"
                            />
                            <p className="text-xs text-muted-foreground">
                                Get this from your Stripe webhook endpoint settings
                            </p>
                        </div>
                    </div>

                    <Separator />

                    {/* Live Mode Toggle */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <Label className="text-base font-medium">Live Mode</Label>
                                <p className="text-sm text-muted-foreground">
                                    {localIsLiveMode
                                        ? 'Processing real payments and transactions'
                                        : 'Using test data for development and testing'
                                    }
                                </p>
                            </div>
                            <Switch
                                checked={localIsLiveMode}
                                onCheckedChange={handleLiveModeChange}
                            />
                        </div>
                        {localIsLiveMode && (
                            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                                <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                                    <AlertCircle className="h-4 w-4" />
                                    <span className="text-sm font-medium">Live Mode Active</span>
                                </div>
                                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                    Real payments will be processed. Ensure your webhook endpoint is secure.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 pt-4">
                        <Button
                            onClick={handleSave}
                            disabled={!hasUnsavedChanges || isSaving}
                            className="flex-1"
                        >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                        {hasUnsavedChanges && (
                            <Button
                                variant="outline"
                                onClick={handleReset}
                            >
                                Reset
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Advanced Actions */}
            {isSetupComplete && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Advanced Actions</CardTitle>
                        <CardDescription>
                            Manage your integration settings
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                                <h4 className="font-medium">Regenerate Webhook Token</h4>
                                <p className="text-sm text-muted-foreground">
                                    Generate a new webhook endpoint URL for security
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onRegenerateToken}
                                disabled={isRegeneratingToken || !onRegenerateToken}
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${isRegeneratingToken ? 'animate-spin' : ''}`} />
                                {isRegeneratingToken ? 'Regenerating...' : 'Regenerate'}
                            </Button>
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                                <h4 className="font-medium">Setup Wizard</h4>
                                <p className="text-sm text-muted-foreground">
                                    Re-run the guided setup process
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowOnboarding(true)}
                            >
                                <Zap className="h-4 w-4 mr-2" />
                                Open Wizard
                            </Button>
                        </div>

                        <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-800 rounded-lg">
                            <div>
                                <h4 className="font-medium text-red-700 dark:text-red-400">Reset Integration</h4>
                                <p className="text-sm text-muted-foreground">
                                    Remove all configuration and start over
                                </p>
                            </div>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleDeleteConfig}
                                disabled={isDeleting || !onDeleteConfig}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {isDeleting ? 'Resetting...' : 'Reset'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Configuration Summary */}
            {isSetupComplete && (
                <ConfigurationSummary
                    webhookToken={webhookToken}
                    isLiveMode={isLiveMode}
                    webhookUrl={webhookUrl}
                />
            )}
        </div>
    );
} 