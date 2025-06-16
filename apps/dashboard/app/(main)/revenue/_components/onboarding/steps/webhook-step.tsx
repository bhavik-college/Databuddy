"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Copy, ExternalLink, AlertCircle, Check, Save } from "lucide-react";

interface WebhookStepProps {
    webhookSecret: string;
    isLiveMode: boolean;
    copied: boolean;
    copyToClipboard: (text: string, label: string) => void;
    webhookUrl: string;
    onBack: () => void;
    onNext: () => void;
    onSave: (data: { webhookSecret: string; isLiveMode: boolean }) => void;
    isSaving?: boolean;
}

export function WebhookStep({
    webhookSecret,
    isLiveMode,
    copied,
    copyToClipboard,
    webhookUrl,
    onBack,
    onNext,
    onSave,
    isSaving = false,
}: WebhookStepProps) {
    // Local state for form inputs
    const [localWebhookSecret, setLocalWebhookSecret] = useState(webhookSecret);
    const [localIsLiveMode, setLocalIsLiveMode] = useState(isLiveMode);
    const [hasChanges, setHasChanges] = useState(false);

    // Update local state when props change
    useEffect(() => {
        setLocalWebhookSecret(webhookSecret);
        setLocalIsLiveMode(isLiveMode);
        setHasChanges(false);
    }, [webhookSecret, isLiveMode]);

    // Track changes
    useEffect(() => {
        const changed = localWebhookSecret !== webhookSecret || localIsLiveMode !== isLiveMode;
        setHasChanges(changed);
    }, [localWebhookSecret, localIsLiveMode, webhookSecret, isLiveMode]);

    const handleSave = () => {
        onSave({
            webhookSecret: localWebhookSecret,
            isLiveMode: localIsLiveMode,
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="font-medium mb-3">Step 1: Configure Stripe Webhook</h3>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="webhook-url">Webhook Endpoint URL</Label>
                        <div className="flex gap-2 mt-1">
                            <Input
                                id="webhook-url"
                                value={webhookUrl}
                                readOnly
                                className="font-mono text-sm"
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(webhookUrl, 'Webhook URL')}
                            >
                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Add this URL to your Stripe webhook endpoints
                        </p>
                    </div>

                    <div>
                        <Label htmlFor="webhook-secret">Webhook Signing Secret</Label>
                        <div className="mt-1">
                            <Input
                                id="webhook-secret"
                                value={localWebhookSecret}
                                placeholder="whsec_..."
                                className="font-mono text-sm"
                                onChange={(e) => setLocalWebhookSecret(e.target.value)}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Get this from your Stripe webhook endpoint settings after creating the webhook
                        </p>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Switch
                            id="live-mode"
                            checked={localIsLiveMode}
                            onCheckedChange={setLocalIsLiveMode}
                        />
                        <Label htmlFor="live-mode">Live Mode</Label>
                        <Badge variant={localIsLiveMode ? "default" : "secondary"}>
                            {localIsLiveMode ? "Production" : "Test"}
                        </Badge>
                    </div>

                    {hasChanges && (
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex items-center gap-2"
                            >
                                <Save className="h-4 w-4" />
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <Separator />

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 dark:bg-amber-950/20 dark:border-amber-800">
                <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div>
                        <h4 className="font-medium text-amber-900 dark:text-amber-100">Stripe Dashboard Setup</h4>
                        <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                            You'll need to add this webhook URL in your Stripe Dashboard under
                            Developers → Webhooks → Add endpoint
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => window.open('https://dashboard.stripe.com/webhooks', '_blank')}
                        >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open Stripe Dashboard
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex gap-2">
                <Button
                    variant="outline"
                    onClick={onBack}
                >
                    Back
                </Button>
                <Button
                    onClick={onNext}
                    disabled={!localWebhookSecret || hasChanges}
                    className="flex-1"
                >
                    Continue to Testing
                </Button>
            </div>
        </div>
    );
} 