"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, Database, Settings } from "lucide-react";
import { RevenueOverviewTab } from "./tabs/overview-tab";
import { RevenueAnalyticsTab } from "./tabs/analytics-tab";
import { RevenueSettingsTab } from "./tabs/settings-tab";
import { useRevenueConfig } from "../hooks/use-revenue-config";

export function RevenuePageLayout() {
    const [activeTab, setActiveTab] = useState('overview');
    const revenueConfig = useRevenueConfig();

    return (
        <div className="p-3 sm:p-4 max-w-[1600px] mx-auto">
            <header className="border-b pb-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900/20">
                        <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Revenue Analytics</h1>
                        <p className="text-muted-foreground">Track payments, refunds, and revenue metrics</p>
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
                            revenueConfig.setWebhookSecret(data.webhookSecret);
                            revenueConfig.setIsLiveMode(data.isLiveMode);
                        }}
                        isSaving={revenueConfig.isCreating}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
} 