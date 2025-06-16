"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Settings, Copy, RefreshCw, ExternalLink, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface QuickSettingsModalProps {
    webhookToken: string;
    webhookSecret: string;
    isLiveMode: boolean;
    webhookUrl: string;
    onSave: (data: { webhookSecret: string; isLiveMode: boolean }) => void;
    onRegenerateToken?: () => void;
    copyToClipboard: (text: string, label: string) => void;
    isSaving?: boolean;
    isRegeneratingToken?: boolean;
    trigger?: React.ReactNode;
}

export function QuickSettingsModal({
    webhookToken,
    webhookSecret,
    isLiveMode,
    webhookUrl,
    onSave,
    onRegenerateToken,
    copyToClipboard,
    isSaving = false,
    isRegeneratingToken = false,
    trigger
}: QuickSettingsModalProps) {
    const [open, setOpen] = useState(false);
    const [localWebhookSecret, setLocalWebhookSecret] = useState(webhookSecret);
    const [localIsLiveMode, setLocalIsLiveMode] = useState(isLiveMode);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Sync local state with props when they change
    useEffect(() => {
        setLocalWebhookSecret(webhookSecret);
        setLocalIsLiveMode(isLiveMode);
        setHasUnsavedChanges(false);
    }, [webhookSecret, isLiveMode]);

    const isSetupComplete = !!(webhookToken && webhookSecret);

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
        toast.success("Settings saved successfully");
    };

    const handleReset = () => {
        setLocalWebhookSecret(webhookSecret);
        setLocalIsLiveMode(isLiveMode);
        setHasUnsavedChanges(false);
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen && hasUnsavedChanges) {
            if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
                handleReset();
                setOpen(false);
            }
        } else {
            setOpen(newOpen);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Quick Settings
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Revenue Settings
                    </DialogTitle>
                    <DialogDescription>
                        Quickly adjust your Stripe integration settings
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Status */}
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                            {isSetupComplete ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                                <AlertCircle className="h-4 w-4 text-orange-500" />
                            )}
                            <span className="text-sm font-medium">
                                {isSetupComplete ? 'Integration Active' : 'Setup Required'}
                            </span>
                        </div>
                        <Badge variant={localIsLiveMode ? "default" : "secondary"}>
                            {localIsLiveMode ? 'Live Mode' : 'Test Mode'}
                        </Badge>
                    </div>

                    {/* Webhook URL */}
                    {webhookUrl && (
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Webhook Endpoint</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    value={webhookUrl}
                                    readOnly
                                    className="font-mono text-xs"
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
                        </div>
                    )}

                    <Separator />

                    {/* Webhook Secret */}
                    <div className="space-y-2">
                        <Label htmlFor="webhook-secret" className="text-sm font-medium">
                            Webhook Secret
                        </Label>
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

                    <Separator />

                    {/* Live Mode Toggle */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <Label className="text-sm font-medium">Live Mode</Label>
                                <p className="text-xs text-muted-foreground">
                                    {localIsLiveMode
                                        ? 'Processing real payments'
                                        : 'Using test data'
                                    }
                                </p>
                            </div>
                            <Switch
                                checked={localIsLiveMode}
                                onCheckedChange={handleLiveModeChange}
                            />
                        </div>
                        {localIsLiveMode && (
                            <div className="p-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-600 dark:text-red-400">
                                ⚠️ Live mode active - real payments will be processed
                            </div>
                        )}
                    </div>

                    <Separator />

                    {/* Actions */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={handleSave}
                                disabled={!hasUnsavedChanges || isSaving}
                                className="flex-1"
                                size="sm"
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </Button>
                            {hasUnsavedChanges && (
                                <Button
                                    variant="outline"
                                    onClick={handleReset}
                                    size="sm"
                                >
                                    Reset
                                </Button>
                            )}
                        </div>

                        {isSetupComplete && onRegenerateToken && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onRegenerateToken}
                                disabled={isRegeneratingToken}
                                className="w-full"
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${isRegeneratingToken ? 'animate-spin' : ''}`} />
                                {isRegeneratingToken ? 'Regenerating Token...' : 'Regenerate Webhook Token'}
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
} 