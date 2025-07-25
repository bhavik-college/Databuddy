'use client';

import { ChartLineUp, Clock, CreditCard } from '@phosphor-icons/react';
import { useQueryState } from 'nuqs';
import { lazy, Suspense, useEffect, useState } from 'react';
import { TabLayout } from '@/app/(main)/websites/[id]/_components/utils/tab-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  type Customer,
  type Invoice,
  useBillingData,
} from './data/billing-data';

const OverviewTab = lazy(() =>
  import('./components/overview-tab').then((m) => ({ default: m.OverviewTab }))
);
const PlansTab = lazy(() =>
  import('./components/plans-tab').then((m) => ({ default: m.PlansTab }))
);
const HistoryTab = lazy(() =>
  import('./components/history-tab').then((m) => ({ default: m.HistoryTab }))
);

function TabSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <div className="space-y-4 text-center">
          <Skeleton className="mx-auto h-10 w-64" />
          <Skeleton className="mx-auto h-6 w-96" />
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
];

export default function BillingPage() {
  const [activeTab, setActiveTab] = useQueryState('tab', {
    defaultValue: 'overview',
    clearOnDefault: true,
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
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
        description="Manage your subscription, usage, and billing preferences"
        title="Billing & Subscription"
      >
        <Tabs
          className="space-y-8"
          onValueChange={setActiveTab}
          value={activeTab}
        >
          {/* Enhanced Tab Navigation */}
          <div className="border-border/50 border-b">
            <div className="mx-auto max-w-7xl">
              <TabsList className="h-12 w-full justify-start overflow-x-auto border-0 bg-transparent p-0">
                {TABS.map((tab) => (
                  <TabsTrigger
                    className="relative h-12 cursor-pointer touch-manipulation whitespace-nowrap rounded-none px-6 font-medium text-sm transition-all duration-200 hover:bg-muted/50 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                    key={tab.id}
                    value={tab.id}
                  >
                    <tab.icon className="mr-2 h-4 w-4" />
                    <span>{tab.label}</span>
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-0 h-[3px] w-full rounded-t-full bg-gradient-to-r from-primary to-primary/80" />
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </div>

          {/* Tab Content with improved spacing */}
          <div className="py-4">
            <TabsContent className="mt-0" value="overview">
              <Suspense fallback={<TabSkeleton />}>
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                  <OverviewTab onNavigateToPlans={navigateToPlans} />
                </div>
              </Suspense>
            </TabsContent>

            <TabsContent className="mt-0" value="plans">
              <Suspense fallback={<TabSkeleton />}>
                <PlansTab />
              </Suspense>
            </TabsContent>

            <TabsContent className="mt-0" value="history">
              <Suspense fallback={<TabSkeleton />}>
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                  <HistoryTab
                    customerData={customerData as unknown as Customer}
                    invoices={invoices}
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
