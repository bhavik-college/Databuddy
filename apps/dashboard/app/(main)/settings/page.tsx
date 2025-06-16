"use client";

import { useState } from "react";
import { useQueryState } from "nuqs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  ShieldOff,
  User,
  Shield,
  Bell,
  Settings as SettingsIcon,
  Info,
  Sparkles
} from "lucide-react";
import dynamic from "next/dynamic";

const EmailForm = dynamic(() => import("./_components/email-form").then(mod => ({ default: mod.EmailForm })), {
  loading: () => <Skeleton className="h-32 w-full rounded" />,
  ssr: false
});

const PasswordForm = dynamic(() => import("./_components/password-form").then(mod => ({ default: mod.PasswordForm })), {
  loading: () => <Skeleton className="h-40 w-full rounded" />,
  ssr: false
});

const TwoFactorForm = dynamic(() => import("./_components/two-factor-form").then(mod => ({ default: mod.TwoFactorForm })), {
  loading: () => <Skeleton className="h-48 w-full rounded" />,
  ssr: false
});

const SessionsForm = dynamic(() => import("./_components/sessions-form").then(mod => ({ default: mod.SessionsForm })), {
  loading: () => <Skeleton className="h-64 w-full rounded" />,
  ssr: false
});

const AccountDeletion = dynamic(() => import("./_components/account-deletion").then(mod => ({ default: mod.AccountDeletion })), {
  loading: () => <Skeleton className="h-24 w-full rounded" />,
  ssr: false
});

const ProfileForm = dynamic(() => import("./_components/profile-form").then(mod => ({ default: mod.ProfileForm })), {
  loading: () => <Skeleton className="h-56 w-full rounded" />,
  ssr: false
});

const TimezonePreferences = dynamic(() => import("./_components/timezone-preferences").then(mod => ({ default: mod.TimezonePreferences })), {
  loading: () => <Skeleton className="h-20 w-full rounded" />,
  ssr: false
});

type SettingsTab = "profile" | "account" | "security" | "notifications";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useQueryState('tab', { defaultValue: 'profile' as SettingsTab });

  const tabs = [
    {
      id: "profile" as SettingsTab,
      label: "Profile",
      icon: User,
      description: "Manage your personal information and profile settings",
    },
    {
      id: "account" as SettingsTab,
      label: "Account",
      icon: SettingsIcon,
      description: "Manage your account settings and preferences",
    },
    {
      id: "security" as SettingsTab,
      label: "Security",
      icon: Shield,
      description: "Manage your security settings and authentication methods",
    },
    {
      id: "notifications" as SettingsTab,
      label: "Notifications",
      icon: Bell,
      description: "Configure your notification preferences",
      disabled: true,
    },
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  return (
    <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="border-b bg-gradient-to-r from-background via-background to-muted/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:px-6 sm:py-6 gap-3 sm:gap-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                <SettingsIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground truncate">
                  Settings
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base mt-1">
                  Manage your account and preferences
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="w-full p-4 sm:px-6 sm:pt-6 sm:pb-8">
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 max-w-none">
            <div className="xl:col-span-1">
              <div className="sticky top-6 space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      className={cn(
                        "w-full group relative overflow-hidden rounded-xl p-4 text-left transition-all duration-200",
                        "border border-transparent hover:border-border/50",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                          : "bg-card hover:bg-accent/50 hover:shadow-sm"
                      )}
                      onClick={() => setActiveTab(tab.id)}
                      disabled={tab.disabled}
                      data-track="settings-tab-click"
                      data-tab-id={tab.id}
                      data-tab-label={tab.label.toLowerCase().replace(/\s+/g, '-')}
                      data-section="settings-sidebar"
                    >
                      {isActive && (
                        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
                      )}

                      <div className="relative flex items-start gap-3">
                        <div className={cn(
                          "flex-shrink-0 p-2 rounded-lg transition-colors duration-200",
                          isActive
                            ? "bg-white/20"
                            : "bg-muted/50 group-hover:bg-muted"
                        )}>
                          <Icon className={cn(
                            "h-5 w-5 transition-colors duration-200",
                            isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground"
                          )} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn(
                              "font-medium text-sm truncate transition-colors duration-200",
                              isActive ? "text-white" : "text-foreground"
                            )}>
                              {tab.label}
                            </span>
                            {tab.disabled && (
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs flex-shrink-0 border-current",
                                  isActive ? "text-white/80 border-white/30" : ""
                                )}
                              >
                                Soon
                              </Badge>
                            )}
                          </div>
                          <p className={cn(
                            "text-xs leading-relaxed transition-colors duration-200",
                            isActive ? "text-white/80" : "text-muted-foreground"
                          )}>
                            {tab.description}
                          </p>
                        </div>
                      </div>

                      {!isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-primary rounded-r-full transition-all duration-200 group-hover:h-8" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="xl:col-span-4 space-y-8">
              {activeTabData && (
                <div className="flex items-center gap-4 pb-2">
                  <div className="p-3 rounded-xl bg-muted/50 border border-muted/50">
                    <activeTabData.icon className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">{activeTabData.label}</h2>
                    <p className="text-sm sm:text-base text-muted-foreground mt-1">{activeTabData.description}</p>
                  </div>
                </div>
              )}

              {activeTab === "profile" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <Alert className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertTitle>Profile Information</AlertTitle>
                    <AlertDescription>
                      Your profile information is used to personalize your experience and how others see you on the platform.
                      This information is visible to other users.
                    </AlertDescription>
                  </Alert>

                  <Card className="shadow-sm">
                    <CardHeader className="pb-6">
                      <CardTitle className="text-xl font-semibold tracking-tight">Personal Information</CardTitle>
                      <CardDescription className="text-base">
                        Update your personal information and profile picture
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <ProfileForm />
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === "account" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex flex-col gap-4">
                    <Card className="shadow-sm">
                      <CardHeader className="pb-6">
                        <CardTitle className="text-xl font-semibold tracking-tight">Email Address</CardTitle>
                        <CardDescription className="text-base">
                          Update your email address and manage email preferences
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <EmailForm />
                      </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                      <CardHeader className="pb-6">
                        <CardTitle className="text-xl font-semibold tracking-tight">Password</CardTitle>
                        <CardDescription className="text-base">
                          Change your password and manage password security
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <PasswordForm />
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="shadow-sm">
                    <CardHeader className="pb-6">
                      <CardTitle className="text-xl font-semibold tracking-tight">Timezone Preferences</CardTitle>
                      <CardDescription className="text-base">
                        Update your timezone preferences and date/time formats
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <TimezonePreferences />
                    </CardContent>
                  </Card>

                  <Card className="border-destructive shadow-sm">
                    <CardHeader className="pb-6">
                      <div className="flex items-center gap-3">
                        <ShieldOff className="h-6 w-6 text-destructive" />
                        <div>
                          <CardTitle className="text-xl font-semibold tracking-tight text-destructive">Danger Zone</CardTitle>
                          <CardDescription className="text-destructive/80 text-base mt-1">
                            Irreversible and destructive actions
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <AccountDeletion />
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === "security" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <Card className="shadow-sm">
                    <CardHeader className="pb-6">
                      <CardTitle className="text-xl font-semibold tracking-tight">Two-Factor Authentication</CardTitle>
                      <CardDescription className="text-base">
                        Add an extra layer of security to your account
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <TwoFactorForm />
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm">
                    <CardHeader className="pb-6">
                      <CardTitle className="text-xl font-semibold tracking-tight">Active Sessions</CardTitle>
                      <CardDescription className="text-base">
                        Manage and review your active sessions across devices
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <SessionsForm />
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === "notifications" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <Card className="shadow-sm">
                    <CardHeader className="pb-6">
                      <CardTitle className="text-xl font-semibold tracking-tight">Notification Preferences</CardTitle>
                      <CardDescription className="text-base">
                        Configure how you want to be notified
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                        <div className="relative mb-10">
                          <div className="rounded-full bg-muted/50 p-12 border-2 border-muted/50">
                            <Bell className="h-20 w-20 text-muted-foreground" />
                          </div>
                          <div className="absolute -top-3 -right-3 p-3 rounded-full bg-primary/10 border-2 border-primary/20">
                            <Sparkles className="h-8 w-8 text-primary" />
                          </div>
                        </div>

                        <h3 className="text-2xl font-semibold mb-6">Coming Soon</h3>
                        <p className="text-muted-foreground mb-10 max-w-lg leading-relaxed text-lg">
                          We're working on notification settings to help you stay informed about important updates and activities.
                        </p>

                        <div className="bg-muted/50 rounded-xl p-8 max-w-lg border border-muted/50">
                          <div className="flex items-start gap-4">
                            <div className="p-3 rounded-lg bg-primary/10">
                              <Sparkles className="h-6 w-6 text-primary" />
                            </div>
                            <div className="text-left">
                              <p className="font-semibold text-base mb-3">💡 What's coming</p>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                Email notifications, push notifications, and customizable alert preferences for your analytics data.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 