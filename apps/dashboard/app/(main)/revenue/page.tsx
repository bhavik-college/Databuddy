"use client";

import { useState } from "react";
import { GearSixIcon, CheckCircleIcon, ClockIcon, GlobeIcon, ArrowRightIcon, LightningIcon, WarningCircleIcon, ChartBarIcon, CurrencyDollarIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuickSettingsModal } from "./_components/quick-settings-modal";
import { RevenueSettingsTab } from "./_components/tabs/settings-tab";
import { RevenueOverviewTab } from "./_components/tabs/overview-tab";
import { useRevenueConfig } from "./hooks/use-revenue-config";
import { useWebsites } from "@/hooks/use-websites";
import Link from "next/link";

export default function RevenuePage() {
    const [activeTab, setActiveTab] = useState('overview');
    const revenueConfig = useRevenueConfig();
    const { websites, isLoading: websitesLoading } = useWebsites();

    if (revenueConfig.isLoading) {
        return (
            <div className="p-3 sm:p-4 max-w-[1200px] mx-auto">
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-3 sm:p-4 max-w-[1200px] mx-auto space-y-6">
            {/* Header */}
            <div className="border-b bg-gradient-to-r from-background via-background to-muted/20 -mx-3 sm:-mx-4 px-3 sm:px-4 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-green-100 to-green-50 rounded-xl border border-green-200 dark:from-green-900/20 dark:to-green-950/20 dark:border-green-800/50">
                            <CurrencyDollarIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Revenue Settings</h1>
                            <p className="text-muted-foreground">
                                Configure Stripe integration and manage revenue tracking
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {revenueConfig.isSetupComplete ? (
                            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-950/20 rounded-full border border-green-200 dark:border-green-800">
                                <CheckCircleIcon weight="fill" size={16} className="h-4 w-4 text-green-500" />
                                <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                                    {revenueConfig.isLiveMode ? 'Live Mode' : 'Test Mode'}
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 dark:bg-orange-950/20 rounded-full border border-orange-200 dark:border-orange-800">
                                <ClockIcon size={16} className="h-4 w-4 text-orange-500" />
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
            </div>

            {/* Setup Required Banner */}
            {!revenueConfig.isSetupComplete && (
                <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800/50">
                    <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                <WarningCircleIcon size={24} weight="duotone" className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-100 mb-2">
                                    Revenue Tracking Not Configured
                                </h3>
                                <p className="text-orange-700 dark:text-orange-200 mb-4">
                                    Set up your Stripe webhook to start tracking revenue across all your websites. This is a one-time setup that works for all your sites.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Button size="sm" className="gap-2">
                                        <LightningIcon size={16} weight="duotone" className="h-4 w-4" />
                                        Configure Stripe Integration
                                    </Button>
                                    <Button size="sm" variant="outline">
                                        View Setup Guide
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <div className="border-b">
                    <TabsList className="h-10 bg-transparent p-0 w-full justify-start overflow-x-auto">
                        <TabsTrigger
                            value="overview"
                            className="text-xs sm:text-sm h-10 px-4 rounded-none hover:bg-muted/50 relative transition-colors whitespace-nowrap"
                        >
                            <ChartBarIcon size={16} weight="duotone" className="h-4 w-4 mr-2" />
                            Overview
                            {activeTab === 'overview' && (
                                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary" />
                            )}
                        </TabsTrigger>
                        <TabsTrigger
                            value="settings"
                            className="text-xs sm:text-sm h-10 px-4 rounded-none hover:bg-muted/50 relative transition-colors whitespace-nowrap"
                        >
                            <GearSixIcon size={16} weight="duotone" className="h-4 w-4 mr-2" />
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

                <TabsContent value="overview" className="space-y-6">
                    {/* Global Revenue Overview */}
                    {revenueConfig.isSetupComplete && (
                        <RevenueOverviewTab
                            onSetupClick={() => setActiveTab('settings')}
                            isSetupComplete={revenueConfig.isSetupComplete}
                            setupProgress={revenueConfig.setupProgress}
                            isLiveMode={revenueConfig.isLiveMode}
                        />
                    )}

                    {/* Website Revenue Pages */}
                    {revenueConfig.isSetupComplete && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold">Individual Website Analytics</h2>
                                <Badge variant="secondary" className="text-xs">
                                    {websites?.length || 0} website{(websites?.length || 0) !== 1 ? 's' : ''}
                                </Badge>
                            </div>

                            {websitesLoading ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {[1, 2, 3].map((i) => (
                                        <Card key={i} className="animate-pulse">
                                            <CardHeader>
                                                <div className="h-4 bg-muted rounded w-3/4"></div>
                                                <div className="h-3 bg-muted rounded w-1/2"></div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="h-8 bg-muted rounded mb-2"></div>
                                                <div className="h-3 bg-muted rounded w-2/3"></div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : websites && websites.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {websites.map((website: any) => (
                                        <Link key={website.id} href={`/revenue/${website.id}`}>
                                            <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-l-4 border-l-primary/20 hover:border-l-primary">
                                                <CardHeader className="pb-3">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                                            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 group-hover:bg-primary/20 transition-colors">
                                                                <GlobeIcon size={16} weight="duotone" className="h-4 w-4 text-primary" />
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                                                                    {website.name}
                                                                </h3>
                                                                <p className="text-xs text-muted-foreground truncate">{website.domain}</p>
                                                            </div>
                                                        </div>
                                                        <ArrowRightIcon className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="pt-0">
                                                    <div className="flex items-center justify-center py-6 text-muted-foreground">
                                                        <div className="text-center">
                                                            <CurrencyDollarIcon size={32} weight="duotone" className="h-8 w-8 mx-auto mb-2 opacity-50 group-hover:opacity-70 transition-opacity" />
                                                            <p className="text-sm font-medium">View Revenue Analytics</p>
                                                            <p className="text-xs text-muted-foreground">Payments, trends & insights</p>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <Card className="border-dashed">
                                    <CardContent className="p-8 text-center">
                                        <GlobeIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                                        <h3 className="font-semibold mb-2">No Websites Found</h3>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Add websites to start tracking revenue analytics.
                                        </p>
                                        <Button asChild>
                                            <Link href="/websites">
                                                Add Your First Website
                                            </Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="settings" className="space-y-6">
                    <RevenueSettingsTab
                        revenueConfig={revenueConfig}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}