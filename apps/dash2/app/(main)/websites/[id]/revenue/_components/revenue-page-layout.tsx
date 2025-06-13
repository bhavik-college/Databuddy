"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, Database, Settings, CheckCircle, Clock } from "lucide-react";
import { RevenueOverviewTab } from "./tabs/overview-tab";
import { RevenueAnalyticsTab } from "./tabs/analytics-tab";
import { RevenueSettingsTab } from "./tabs/settings-tab";
import { QuickSettingsModal } from "./quick-settings-modal";
import { useRevenueConfig } from "../hooks/use-revenue-config";

export function RevenuePageLayout() {
    const [activeTab, setActiveTab] = useState('overview');
    const revenueConfig = useRevenueConfig();

    if (revenueConfig.isLoading) {
        return (
            <div className="p-3 sm:p-4 max-w-[1600px] mx-auto">
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-3 sm:p-4 max-w-[1600px] mx-auto">
            <header className="border-b pb-4 mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900/20">
                            <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Revenue Analytics</h1>
                            <p className="text-muted-foreground">
                                {revenueConfig.isSetupComplete
                                    ? "Track payments, refunds, and revenue metrics"
                                    : "Set up Stripe integration to start tracking revenue"
                                }
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {revenueConfig.isSetupComplete ? (
                            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-950/20 rounded-full border border-green-200 dark:border-green-800">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="text-sm text-green-600 dark:text-green-400 font-medium">Active</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 px-3 py-1 bg-orange-50 dark:bg-orange-950/20 rounded-full border border-orange-200 dark:border-orange-800">
                                <Clock className="h-4 w-4 text-orange-500" />
                                <span className="text-sm text-orange-600 dark:text-orange-400 font-medium">Setup Required</span>
                            </div>
                        )}
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
                        />
                    </div>
                </div>
            </header>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <div className="border-b relative">
                    <TabsList className="h-10 bg-transparent p-0 w-full justify-start overflow-x-auto">
                        <TabsTrigger
                            value="overview"
                            className="text-xs sm:text-sm h-10 px-2 sm:px-4 rounded-none touch-manipulation hover:bg-muted/50 relative transition-colors whitespace-nowrap cursor-pointer"
                        >
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Overview
                            {activeTab === 'overview' && (
                                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary" />
                            )}
                        </TabsTrigger>
                        <TabsTrigger
                            value="analytics"
                            className="text-xs sm:text-sm h-10 px-2 sm:px-4 rounded-none touch-manipulation hover:bg-muted/50 relative transition-colors whitespace-nowrap cursor-pointer"
                        >
                            <Database className="h-4 w-4 mr-2" />
                            Analytics
                            {activeTab === 'analytics' && (
                                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary" />
                            )}
                        </TabsTrigger>
                        <TabsTrigger
                            value="settings"
                            className="text-xs sm:text-sm h-10 px-2 sm:px-4 rounded-none touch-manipulation hover:bg-muted/50 relative transition-colors whitespace-nowrap cursor-pointer"
                        >
                            <Settings className="h-4 w-4 mr-2" />
                            Settings
                            {!revenueConfig.isSetupComplete && (
                                <div className="ml-1 w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                            )}
                            {activeTab === 'settings' && (
                                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary" />
                            )}
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="overview" className="space-y-6 transition-all duration-200 animate-fadeIn">
                    <RevenueOverviewTab
                        onSetupClick={() => setActiveTab('settings')}
                        isSetupComplete={revenueConfig.isSetupComplete}
                        setupProgress={revenueConfig.setupProgress}
                        isLiveMode={revenueConfig.isLiveMode}
                    />
                </TabsContent>

                <TabsContent value="analytics" className="space-y-6 transition-all duration-200 animate-fadeIn">
                    <RevenueAnalyticsTab />
                </TabsContent>

                <TabsContent value="settings" className="space-y-6 transition-all duration-200 animate-fadeIn">
                    <RevenueSettingsTab
                        onboardingStep={revenueConfig.onboardingStep}
                        setOnboardingStep={revenueConfig.setOnboardingStep}
                        webhookToken={revenueConfig.webhookToken}
                        webhookSecret={revenueConfig.webhookSecret}
                        isLiveMode={revenueConfig.isLiveMode}
                        copied={revenueConfig.copied}
                        copyToClipboard={revenueConfig.copyToClipboard}
                        webhookUrl={revenueConfig.webhookUrl}
                        onSave={(data) => {
                            revenueConfig.updateConfig({
                                webhookSecret: data.webhookSecret,
                                isLiveMode: data.isLiveMode
                            });
                        }}
                        isSaving={revenueConfig.isCreating}
                        onRegenerateToken={revenueConfig.regenerateWebhookToken}
                        onDeleteConfig={revenueConfig.deleteConfig}
                        isRegeneratingToken={revenueConfig.isRegeneratingToken}
                        isDeleting={revenueConfig.isDeleting}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
} 