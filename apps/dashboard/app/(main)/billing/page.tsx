"use client";

import { lazy, Suspense, useState, useEffect } from "react";
import { useQueryState } from "nuqs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { TabLayout } from "@/app/(main)/websites/[id]/_components/utils/tab-layout";
import { ChartLineUp, CreditCard, Clock } from "@phosphor-icons/react";
import { Customer, useBillingData, type Invoice } from "./data/billing-data";

const OverviewTab = lazy(() => import("./components/overview-tab").then(m => ({ default: m.OverviewTab })));
const PlansTab = lazy(() => import("./components/plans-tab").then(m => ({ default: m.PlansTab })));
const HistoryTab = lazy(() => import("./components/history-tab").then(m => ({ default: m.HistoryTab })));

function TabSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <Skeleton className="h-10 w-64 mx-auto" />
          <Skeleton className="h-6 w-96 mx-auto" />
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    </div>
  );
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: ChartLineUp },
  { id: 'plans', label: 'Plans', icon: CreditCard },
  { id: 'history', label: 'History', icon: Clock },
]

function BillingPage() {
  const [activeTab, setActiveTab] = useQueryState('tab', {
    defaultValue: 'overview',
    clearOnDefault: true
  });

  const { customerData, isLoading } = useBillingData();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [hasLoadedInvoices, setHasLoadedInvoices] = useState(false);

  useEffect(() => {
    if (!isLoading && customerData?.invoices && !hasLoadedInvoices) {
      setInvoices(customerData.invoices as Invoice[]);
      setHasLoadedInvoices(true);
    }
  }, [customerData?.invoices, isLoading, hasLoadedInvoices]);

  const navigateToPlans = () => {
    setActiveTab('plans');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <TabLayout
        title="Billing & Subscription"
        description="Manage your subscription, usage, and billing preferences"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          {/* Enhanced Tab Navigation */}
          <div className="border-b border-border/50">
            <div className="max-w-7xl mx-auto">
              <TabsList className="h-12 bg-transparent p-0 w-full justify-start overflow-x-auto border-0">
                {TABS.map(tab => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="text-sm h-12 px-6 rounded-none touch-manipulation hover:bg-muted/50 relative transition-all duration-200 whitespace-nowrap cursor-pointer data-[state=active]:shadow-none data-[state=active]:bg-transparent font-medium"
                  >
                    <tab.icon className="h-4 w-4 mr-2" />
                    <span>{tab.label}</span>
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary to-primary/80 rounded-t-full" />
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </div>

          {/* Tab Content with improved spacing */}
          <div className="py-4">
            <TabsContent value="overview" className="mt-0">
              <Suspense fallback={<TabSkeleton />}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <OverviewTab onNavigateToPlans={navigateToPlans} />
                </div>
              </Suspense>
            </TabsContent>

            <TabsContent value="plans" className="mt-0">
              <Suspense fallback={<TabSkeleton />}>
                <PlansTab />
              </Suspense>
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              <Suspense fallback={<TabSkeleton />}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <HistoryTab
                    invoices={invoices}
                    customerData={customerData as Customer}
                    isLoading={isLoading && !hasLoadedInvoices}
                  />
                </div>
              </Suspense>
            </TabsContent>
          </div>
        </Tabs>
      </TabLayout>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <BillingPage />
    </Suspense>
  )
}