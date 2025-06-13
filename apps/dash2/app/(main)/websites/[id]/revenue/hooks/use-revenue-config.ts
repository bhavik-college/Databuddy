"use client";

import { useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { useRevenueConfig as useRevenueConfigAPI } from "@/hooks/use-revenue-config";
import type { OnboardingStep } from "../utils/types";

export function useRevenueConfig() {
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('overview');
  const [copied, setCopied] = useState(false);
  
  // Use the real API hook
  const {
    config,
    isLoading,
    createOrUpdateConfig,
    regenerateWebhookToken,
    isCreating,
    isRegeneratingToken
  } = useRevenueConfigAPI();

  // Derived values from config
  const webhookToken = config?.webhookToken || '';
  const webhookSecret = config?.webhookSecret || '';
  const isLiveMode = config?.isLiveMode || false;
  
  const webhookUrl = useMemo(() => {
    return webhookToken ? `https://basket.databuddy.cc/stripe/webhook/${webhookToken}` : '';
  }, [webhookToken]);

  const copyToClipboard = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const setWebhookSecret = useCallback((secret: string) => {
    createOrUpdateConfig({
      webhookSecret: secret,
      isLiveMode,
      isActive: true
    });
  }, [createOrUpdateConfig, isLiveMode]);

  const setIsLiveMode = useCallback((mode: boolean) => {
    createOrUpdateConfig({
      webhookSecret,
      isLiveMode: mode,
      isActive: true
    });
  }, [createOrUpdateConfig, webhookSecret]);

  // Computed states for setup completion
  const isWebhookConfigured = !!(webhookSecret && webhookToken);
  const isSetupComplete = isWebhookConfigured;
  const setupProgress = isWebhookConfigured ? 100 : webhookSecret ? 50 : 0;

  return {
    // State
    onboardingStep,
    webhookToken,
    webhookSecret,
    isLiveMode,
    copied,
    webhookUrl,
    
    // Setup status
    isWebhookConfigured,
    isSetupComplete,
    setupProgress,
    
    // Actions
    setOnboardingStep,
    setWebhookSecret,
    setIsLiveMode,
    copyToClipboard,
    
    // API states
    isLoading,
    isCreating,
    isRegeneratingToken,
    
    // API actions
    regenerateWebhookToken,
  };
} 