"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Zap } from "lucide-react";
import { OnboardingFlow } from "../onboarding/onboarding-flow";
import { ConfigurationSummary } from "../onboarding/configuration-summary";
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
}: SettingsTabProps) {
    // Determine current status
    const isWebhookConfigured = !!(webhookToken);
    const isSecretConfigured = !!(webhookSecret);
    const isSetupComplete = isWebhookConfigured && isSecretConfigured;

    return (
        <div className="space-y-6">
            {/* Integration Status Alert */}
            {!isSetupComplete ? (
                <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            Setup Required
                        </CardTitle>
                        <CardDescription>
                            {!isWebhookConfigured
                                ? "Setting up your webhook endpoint..."
                                : !isSecretConfigured
                                    ? "Add your webhook secret to complete the integration"
                                    : "Complete your Stripe integration to start tracking revenue analytics."
                            }
                        </CardDescription>
                    </CardHeader>
                </Card>
            ) : (
                <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Zap className="w-5 h-5 text-green-600" />
                            Integration Complete
                        </CardTitle>
                        <CardDescription>
                            Your Stripe integration is active and ready to track revenue analytics.
                        </CardDescription>
                    </CardHeader>
                </Card>
            )}

            {/* Onboarding Flow */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-blue-500" />
                        DataBuddy Stripe Integration
                    </CardTitle>
                    <CardDescription>
                        {isSetupComplete
                            ? "Manage your Stripe integration settings"
                            : "Connect your Stripe account to track revenue analytics automatically"
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
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

            {/* Configuration Summary */}
            {onboardingStep !== 'overview' && (
                <ConfigurationSummary
                    webhookToken={webhookToken}
                    isLiveMode={isLiveMode}
                    webhookUrl={webhookUrl}
                />
            )}
        </div>
    );
} 