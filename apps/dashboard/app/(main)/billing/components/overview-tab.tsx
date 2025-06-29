"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useBillingData, type Plan, type FeatureUsage } from "../data/billing-data";
import { useBilling } from "@/app/(main)/billing/hooks/use-billing";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { WarningIcon, CheckIcon, ArrowSquareOutIcon, CreditCardIcon, CalendarIcon, TrendUpIcon, LightningIcon, ClockIcon, ChartBarIcon, DatabaseIcon, UsersIcon, CrownIcon, SparkleIcon } from "@phosphor-icons/react";
import { NoPaymentMethodDialog } from "./no-payment-method-dialog";
import { CancelSubscriptionDialog } from "./cancel-subscription-dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PricingTiersTooltip } from "./pricing-tiers-tooltip";

function UsageCard({ feature, onUpgrade }: {
  feature: FeatureUsage,
  onUpgrade: () => void
}) {
  const percentage = feature.limit > 0 ? Math.min((feature.used / feature.limit) * 100, 100) : 0;
  const isUnlimited = !isFinite(feature.limit);
  const isNearLimit = !isUnlimited && percentage > 80;
  const isOverLimit = !isUnlimited && percentage >= 100;

  const getIcon = () => {
    if (feature.name.toLowerCase().includes('event')) return ChartBarIcon;
    if (feature.name.toLowerCase().includes('storage')) return DatabaseIcon;
    if (feature.name.toLowerCase().includes('user') || feature.name.toLowerCase().includes('member')) return UsersIcon;
    return ChartBarIcon;
  };

  const Icon = getIcon();

  return (
    <Card className={cn(
      "h-full",
      isOverLimit && "border-destructive",
      isNearLimit && !isOverLimit && "border-orange-500"
    )}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded border flex items-center justify-center">
              <Icon className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">{feature.name}</CardTitle>
              <p className="text-sm text-muted-foreground">Current usage</p>
            </div>
          </div>

          <div className="text-right">
            {isUnlimited ? (
              <Badge>
                <LightningIcon size={12} className="mr-1" />
                Unlimited
              </Badge>
            ) : (
              <div>
                <div className={cn(
                  "text-2xl font-bold",
                  isOverLimit ? "text-destructive" : isNearLimit ? "text-orange-500" : "text-foreground"
                )}>
                  {feature.used.toLocaleString()}
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    / {feature.limit.toLocaleString()}
                  </span>
                </div>
                {feature.hasOverage && feature.overageAmount && feature.overageAmount > 0 && (
                  <div className="text-sm text-destructive font-medium">
                    +${feature.overageAmount.toFixed(2)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {!isUnlimited && (
          <div className="space-y-3">
            <Progress value={percentage} className="h-3" />

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <ClockIcon size={12} />
                {feature.interval ? (
                  <span>Resets {feature.interval === 'day' ? 'daily' : feature.interval === 'month' ? 'monthly' : feature.interval === 'year' ? 'yearly' : feature.nextReset}</span>
                ) : (
                  <span>Resets {feature.nextReset}</span>
                )}
              </div>

              {isNearLimit && (
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs font-medium cursor-pointer hover:underline"
                  onClick={onUpgrade}
                >
                  {isOverLimit ? "Upgrade" : "Upgrade"}
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PlanStatusCard({ plan, statusDetails, onUpgrade, onCancelClick, onManageBilling }: {
  plan: Plan | undefined,
  statusDetails: string,
  onUpgrade: () => void,
  onCancelClick: (planId: string, planName: string, currentPeriodEnd?: number) => void,
  onManageBilling: () => void
}) {
  const isCanceled = plan?.status === 'canceled' || plan?.canceled_at;
  const isScheduled = plan?.status === 'scheduled';
  const isFree = plan?.id === 'free';

  const getStatusBadge = () => {
    if (isCanceled) {
      return (
        <Badge variant="destructive">
          <WarningIcon size={12} className="mr-1" />
          Cancelled
        </Badge>
      );
    }
    if (isScheduled) {
      return (
        <Badge className="bg-blue-500 text-white">
          <CalendarIcon size={12} className="mr-1" />
          Scheduled
        </Badge>
      );
    }
    return (
      <Badge>
        <CheckIcon size={12} className="mr-1" />
        Active
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded border flex items-center justify-center">
                <CrownIcon size={24} className="text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold">{plan?.name || 'Free Plan'}</CardTitle>
                <p className="text-sm text-muted-foreground">Current subscription</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {getStatusBadge()}
              {statusDetails && (
                <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded">
                  {statusDetails}
                </span>
              )}
            </div>
          </div>

          <div className="text-right">
            <div className="text-3xl font-bold">
              {plan?.price.primary_text || 'Free'}
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              {plan?.price.secondary_text}
              {/* {plan?.price.display === 'tiered' && plan.price.tiers && (
                <PricingTiersTooltip tiers={plan.price.tiers} />
              )} */}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-3">
          {plan?.items.map((item) => {
            const getFeatureText = () => {
              let mainText = item.primary_text || '';

              // Add interval information if it exists and isn't already in the text
              if (item.interval && !mainText.toLowerCase().includes('per ') && !mainText.toLowerCase().includes('/')) {
                if (item.interval === 'day') {
                  mainText += ' per day';
                } else if (item.interval === 'month') {
                  mainText += ' per month';
                } else if (item.interval === 'year') {
                  mainText += ' per year';
                }
              }

              return mainText;
            };

            return (
              <div key={item.feature_id} className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1 w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                  <CheckIcon size={12} className="text-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium">{getFeatureText()}</span>
                  {item.secondary_text && (
                    <p className="text-xs text-muted-foreground mt-0.5">{item.secondary_text}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <Separator />

        <div className="space-y-3">
          {isCanceled ? (
            <Button onClick={onUpgrade} className="w-full cursor-pointer" size="lg">
              <TrendUpIcon size={16} className="mr-2" />
              Reactivate Subscription
            </Button>
          ) : (
            <div className="space-y-2">
              {isFree && (
                <Button onClick={onUpgrade} className="w-full cursor-pointer" size="lg">
                  <TrendUpIcon size={16} className="mr-2" />
                  Upgrade Plan
                </Button>
              )}
              {!isFree && !isCanceled && (
                <Button
                  onClick={() => plan && onCancelClick(plan.id, plan.name, plan.current_period_end)}
                  variant="outline"
                  size="sm"
                  className="w-full text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground cursor-pointer"
                >
                  Cancel Subscription
                </Button>
              )}
            </div>
          )}

          <Button onClick={onManageBilling} variant="outline" className="w-full cursor-pointer" size="sm">
            <CreditCardIcon size={16} className="mr-2" />
            Manage Billing
            <ArrowSquareOutIcon size={12} className="ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function OverviewTab({ onNavigateToPlans }: { onNavigateToPlans: () => void }) {
  const { subscriptionData, usage, customerData, isLoading, refetch } = useBillingData();
  const { onCancelClick, onCancelConfirm, onManageBilling, showNoPaymentDialog, setShowNoPaymentDialog, showCancelDialog, setShowCancelDialog, cancellingPlan, getSubscriptionStatusDetails } = useBilling(refetch);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-8 w-48" />
            <div className="grid gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </div>
          <div className="lg:col-span-1">
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const currentPlan = subscriptionData?.list?.find((p: Plan) => p.scenario === 'active');
  const usageStats = usage?.features || [];

  const statusDetails = currentPlan && customerData?.products?.find(p => p.id === currentPlan.id)
    ? getSubscriptionStatusDetails(customerData.products.find(p => p.id === currentPlan.id) as any)
    : '';

  return (
    <>
      <NoPaymentMethodDialog
        open={showNoPaymentDialog}
        onOpenChange={setShowNoPaymentDialog}
        onConfirm={onManageBilling}
      />

      <CancelSubscriptionDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        onCancel={onCancelConfirm}
        planName={cancellingPlan?.name || ''}
        currentPeriodEnd={cancellingPlan?.currentPeriodEnd}
        isLoading={isLoading}
      />

      <div className="space-y-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Usage Overview</h2>
                <p className="text-muted-foreground mt-1">Monitor your current usage and limits</p>
              </div>
              <Badge variant="secondary">
                <SparkleIcon size={12} className="mr-1" />
                Current period
              </Badge>
            </div>

            {usageStats.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 rounded border flex items-center justify-center mb-6">
                    <TrendUpIcon size={32} className="text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No Usage Data</h3>
                  <p className="text-muted-foreground text-center max-w-sm">
                    Start using our features to see your usage statistics here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {usageStats.map((feature: FeatureUsage) => (
                  <UsageCard
                    key={feature.id}
                    feature={feature}
                    onUpgrade={onNavigateToPlans}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div>
              <h2 className="text-xl font-bold">Current Plan</h2>
              <p className="text-muted-foreground text-sm mt-1">Manage your subscription</p>
            </div>

            <PlanStatusCard
              plan={currentPlan}
              statusDetails={statusDetails}
              onUpgrade={onNavigateToPlans}
              onCancelClick={onCancelClick}
              onManageBilling={onManageBilling}
            />
          </div>
        </div>
      </div>
    </>
  );
} 