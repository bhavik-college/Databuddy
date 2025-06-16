"use client";

import { useState, useEffect, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Crown, RefreshCw, Activity, CreditCard, History, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import { BillingAlerts } from "./components/billing-alerts";
import { 
  subscriptionPlans, 
  usageData, 
  billingHistory, 
  paymentMethods,
  type SubscriptionPlan,
  type BillingAlert 
} from "./data/billing-data";

// Dynamic imports for tabs
const OverviewTab = lazy(() => import("./components/overview-tab").then(m => ({ default: m.OverviewTab })));
const PlansTab = lazy(() => import("./components/plans-tab").then(m => ({ default: m.PlansTab })));
const HistoryTab = lazy(() => import("./components/history-tab").then(m => ({ default: m.HistoryTab })));
const PaymentTab = lazy(() => import("./components/payment-tab").then(m => ({ default: m.PaymentTab })));
const BillingDialogs = lazy(() => import("./components/billing-dialogs").then(m => ({ default: m.BillingDialogs })));

function TabSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [billingAlerts, setBillingAlerts] = useState<BillingAlert[]>([]);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  const currentPlan = subscriptionPlans.find(p => p.current)?.name || "Starter";

  useEffect(() => {
    const alerts: BillingAlert[] = [];
    
    if (usageData.pageviews.limit && usageData.pageviews.current / usageData.pageviews.limit > 0.8) {
      alerts.push({
        id: "pageviews-warning",
        type: "warning",
        title: "Approaching pageview limit",
        message: `You've used ${Math.round((usageData.pageviews.current / usageData.pageviews.limit) * 100)}% of your monthly pageviews.`,
        action: { label: "Upgrade Plan", onClick: () => setActiveTab("plans") }
      });
    }

    const failedPayment = billingHistory.find(invoice => invoice.status === "failed");
    if (failedPayment) {
      alerts.push({
        id: "payment-failed",
        type: "error",
        title: "Payment failed",
        message: `Your payment for ${failedPayment.description} failed. Please update your payment method.`,
        action: { label: "Update Payment", onClick: () => setActiveTab("payment") }
      });
    }

    setBillingAlerts(alerts);
  }, []);

  const setLoadingState = (key: string, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: loading }));
  };

  const handleUpgrade = async (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowUpgradeDialog(true);
  };

  const confirmUpgrade = async () => {
    if (!selectedPlan) return;
    
    setLoadingState("upgrade", true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success(`Successfully upgraded to ${selectedPlan.name} plan!`);
      setShowUpgradeDialog(false);
      setSelectedPlan(null);
    } catch (error) {
      toast.error("Failed to upgrade plan. Please try again.");
    } finally {
      setLoadingState("upgrade", false);
    }
  };

  const handleAddPaymentMethod = async () => { 
    setLoadingState("add-payment", true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success("Payment method added successfully");
    } catch (error) {
      toast.error("Failed to add payment method");
    } finally {
      setLoadingState("add-payment", false);
    }
  };

  const handleDownloadInvoice = async (invoiceId: string) => {
    setLoadingState(`download-${invoiceId}`, true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Invoice downloaded successfully");
    } catch (error) {
      toast.error("Failed to download invoice");
    } finally {
      setLoadingState(`download-${invoiceId}`, false);
    }
  };

  const handleDeletePaymentMethod = async (methodId: string) => {
    setLoadingState(`delete-${methodId}`, true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Payment method removed");
    } catch (error) {
      toast.error("Failed to remove payment method");
    } finally {
      setLoadingState(`delete-${methodId}`, false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Billing & Subscription</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your subscription, usage, and billing preferences
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-2 py-1">
            <Crown className="h-3 w-3 mr-1" />
            {currentPlan} Plan
          </Badge>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-3 w-3 mr-1" />
            Sync
          </Button>
        </div>
      </div>

      {/* Alerts */}
      <BillingAlerts alerts={billingAlerts} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="border-b relative">
          <TabsList className="h-10 bg-transparent p-0 w-full justify-start overflow-x-auto">
            <TabsTrigger 
              value="overview" 
              className="text-xs sm:text-sm h-10 px-2 sm:px-4 rounded-none touch-manipulation hover:bg-muted/50 relative transition-colors whitespace-nowrap cursor-pointer"
            >
              <Activity className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Overview</span>
              {activeTab === "overview" && (
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary" />
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="plans" 
              className="text-xs sm:text-sm h-10 px-2 sm:px-4 rounded-none touch-manipulation hover:bg-muted/50 relative transition-colors whitespace-nowrap cursor-pointer"
            >
              <CreditCard className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Plans</span>
              {activeTab === "plans" && (
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary" />
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="text-xs sm:text-sm h-10 px-2 sm:px-4 rounded-none touch-manipulation hover:bg-muted/50 relative transition-colors whitespace-nowrap cursor-pointer"
            >
              <History className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">History</span>
              {activeTab === "history" && (
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary" />
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="payment" 
              className="text-xs sm:text-sm h-10 px-2 sm:px-4 rounded-none touch-manipulation hover:bg-muted/50 relative transition-colors whitespace-nowrap cursor-pointer"
            >
              <Settings className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Payment</span>
              {activeTab === "payment" && (
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary" />
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="transition-all duration-200 animate-fadeIn">
          <Suspense fallback={<TabSkeleton />}>
            <OverviewTab
              currentPlan={currentPlan}
              usageData={usageData}
              onUpgrade={() => setActiveTab("plans")}
              onCancel={() => setShowCancelDialog(true)}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="plans" className="transition-all duration-200 animate-fadeIn">
          <Suspense fallback={<TabSkeleton />}>
            <PlansTab
              plans={subscriptionPlans}
              onUpgrade={handleUpgrade}
              formatCurrency={formatCurrency}
              isLoading={loadingStates.upgrade}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="history" className="transition-all duration-200 animate-fadeIn">
          <Suspense fallback={<TabSkeleton />}>
            <HistoryTab
              billingHistory={billingHistory}
              onDownload={handleDownloadInvoice}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              loadingStates={loadingStates}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="payment" className="transition-all duration-200 animate-fadeIn">
          <Suspense fallback={<TabSkeleton />}>
            <PaymentTab
              paymentMethods={paymentMethods}
              onAddPayment={handleAddPaymentMethod}
              onDeletePayment={handleDeletePaymentMethod}
              loadingStates={loadingStates}
            />
          </Suspense>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <Suspense fallback={null}>
        <BillingDialogs
          showUpgradeDialog={showUpgradeDialog}
          showCancelDialog={showCancelDialog}
          selectedPlan={selectedPlan}
          isLoading={loadingStates.upgrade}
          nextBillingDate={usageData.nextBillingDate}
          onUpgradeClose={() => setShowUpgradeDialog(false)}
          onCancelClose={() => setShowCancelDialog(false)}
          onConfirmUpgrade={confirmUpgrade}
          onConfirmCancel={() => {
            toast.success("Subscription cancelled. You'll retain access until your next billing date.");
            setShowCancelDialog(false);
          }}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
        />
      </Suspense>
    </div>
  );
} 