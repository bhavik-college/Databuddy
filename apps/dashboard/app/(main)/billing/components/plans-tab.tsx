"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckIcon, StarIcon, CrownIcon, LightningIcon, ClockIcon } from "@phosphor-icons/react";
import { useBillingData, type Plan } from "../data/billing-data";
import { useBilling } from "@/app/(main)/billing/hooks/use-billing";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { NoPaymentMethodDialog } from "./no-payment-method-dialog";
import { PricingTiersTooltip } from "./pricing-tiers-tooltip";

function PlanCard({ plan, onUpgrade, isLoading }: { plan: Plan, onUpgrade: (id: string) => void, isLoading: boolean }) {
  const isCurrent = plan.scenario === 'active';
  const isCanceled = plan.scenario === 'canceled';
  const isScheduled = plan.scenario === 'scheduled';
  const isDowngrade = plan.scenario === 'downgrade';
  const isUpgrade = plan.scenario === 'upgrade';
  const isPopular = plan.name.toLowerCase().includes('pro') && !isCurrent;
  const isFree = plan.id.includes('free');

  const getBadgeInfo = () => {
    if (isCurrent) {
      return {
        badge: (
          <Badge className="bg-emerald-500 hover:bg-emerald-600 shadow-lg">
            <CrownIcon size={12} className="mr-1" />
            Current Plan
          </Badge>
        ),
        show: true
      };
    }

    if (isCanceled) {
      return {
        badge: (
          <Badge variant="destructive" className="shadow-lg">
            Cancelled
          </Badge>
        ),
        show: true
      };
    }

    if (isScheduled) {
      return {
        badge: (
          <Badge variant="secondary" className="shadow-sm">
            <ClockIcon size={12} className="mr-1.5" />
            Scheduled
          </Badge>
        ),
        show: true
      };
    }

    if (isPopular) {
      return {
        badge: (
          <Badge variant="default" className="shadow-sm">
            <StarIcon size={12} className="mr-1.5" />
            Most Popular
          </Badge>
        ),
        show: true
      };
    }

    return { badge: null, show: false };
  };

  const badgeInfo = getBadgeInfo();

  const getButtonConfig = () => {
    if (isLoading) {
      return {
        text: "Processing...",
        disabled: true,
        variant: "default" as const
      };
    }

    if (isCurrent && !isCanceled) {
      return {
        text: "Current Plan",
        disabled: true,
        variant: "outline" as const
      };
    }

    if (isCanceled) {
      return {
        text: (
          <>
            <LightningIcon size={16} className="mr-2" />
            Reactivate Plan
          </>
        ),
        disabled: false,
        variant: "default" as const
      };
    }

    if (isScheduled) {
      return {
        text: "Scheduled",
        disabled: true,
        variant: "outline" as const
      };
    }

    // For upgrade, downgrade, or new plans
    return {
      text: (
        <>
          {!isFree && <LightningIcon size={16} className="mr-2" />}
          {plan.button_text || plan.buttonText || (isUpgrade ? "Upgrade" : isDowngrade ? "Downgrade" : "Select Plan")}
        </>
      ),
      disabled: false,
      variant: "default" as const
    };
  };

  const buttonConfig = getButtonConfig();

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300 hover:shadow-lg h-full flex flex-col",
      isCurrent && "ring-2 ring-emerald-200 border-emerald-200 dark:ring-emerald-800 dark:border-emerald-800",
      isPopular && "ring-2 ring-orange-200 border-orange-200 dark:ring-orange-800 dark:border-orange-800 shadow-md"
    )}>
      {/* Badge positioned absolutely at top */}
      {badgeInfo.show && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
          {badgeInfo.badge}
        </div>
      )}

      {/* Header with consistent padding */}
      <CardHeader className="text-center pb-4 flex-shrink-0 pt-6">
        <div className="space-y-3">
          <CardTitle className="text-2xl font-bold tracking-tight">{plan.name}</CardTitle>

          <div className="space-y-3">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold tracking-tight">{plan.price.primary_text}</span>
              {plan.price.secondary_text && plan.price.secondary_text.trim() && (
                <span className="text-muted-foreground text-base font-medium">{plan.price.secondary_text}</span>
              )}
            </div>

            {/* Free Trial Info */}
            {plan.free_trial && plan.free_trial.trial_available && !isCurrent && (
              <div className="text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-3 py-1.5 rounded-full inline-block font-medium border border-emerald-200 dark:border-emerald-800">
                🎉 {plan.free_trial.length} {plan.free_trial.duration} free trial
              </div>
            )}

            {plan.current_period_end && (
              <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full inline-block border">
                {plan.canceled_at ? (
                  <span>Access until {new Date(plan.current_period_end).toLocaleDateString()}</span>
                ) : plan.status === 'scheduled' ? (
                  <span>Starts {new Date(plan.current_period_end).toLocaleDateString()}</span>
                ) : isCurrent ? (
                  <span>Renews {new Date(plan.current_period_end).toLocaleDateString()}</span>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Content area that grows to fill space */}
      <CardContent className="flex-1 flex flex-col px-6 pb-6">
        {/* Features list */}
        <div className="space-y-3 flex-1 mb-6">
          {plan.items.map((item, index) => {
            const getFeatureText = () => {
              let mainText = item.primary_text || item.primaryText || '';

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
              <div key={item.feature_id || index} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5 border border-primary/20">
                  <CheckIcon size={12} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground leading-relaxed">
                    {getFeatureText()}
                  </div>
                  {(item.secondary_text || item.secondaryText) && (
                    <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {item.secondary_text || item.secondaryText}
                    </div>
                  )}
                  {item.tiers && item.tiers.length > 0 && (
                    <div className="mt-2">
                      <PricingTiersTooltip tiers={item.tiers} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Button always at bottom */}
        <Button
          onClick={() => onUpgrade(plan.id)}
          disabled={buttonConfig.disabled}
          variant={buttonConfig.variant}
          className={cn(
            "w-full font-semibold transition-all duration-200 h-11",
            !buttonConfig.disabled && "cursor-pointer hover:shadow-md",
            buttonConfig.disabled && "cursor-default",
            isPopular && !buttonConfig.disabled && "bg-primary text-white hover:bg-primary/90",
            isCurrent && buttonConfig.disabled && "text-muted-foreground bg-muted hover:bg-muted/90"
          )}
        >
          {buttonConfig.text}
        </Button>
      </CardContent>
    </Card>
  );
}

export function PlansTab() {
  const { subscriptionData, isLoading: isDataLoading, refetch } = useBillingData();
  const { onUpgrade, onManageBilling, isLoading: isActionLoading, showNoPaymentDialog, setShowNoPaymentDialog } = useBilling(refetch);

  if (isDataLoading) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-3">
          <Skeleton className="h-9 w-64 mx-auto" />
          <Skeleton className="h-5 w-96 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[520px] w-full" />
          ))}
        </div>
      </div>
    );
  }

  const plans = subscriptionData?.list || [];

  return (
    <>
      <NoPaymentMethodDialog
        open={showNoPaymentDialog}
        onOpenChange={setShowNoPaymentDialog}
        onConfirm={onManageBilling}
      />

      <div className="space-y-8">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight">Choose Your Plan</h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Select the perfect plan for your needs. All plans include our core features with the flexibility to upgrade or downgrade at any time.
          </p>
        </div>

        {plans.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <CrownIcon size={32} className="text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Plans Available</h3>
            <p className="text-muted-foreground">
              Plans will appear here once they're configured.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {plans.map((plan: Plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onUpgrade={onUpgrade}
                isLoading={isActionLoading}
              />
            ))}
          </div>
        )}

        <div className="text-center pt-6 border-t">
          <div className="space-y-2 max-w-2xl mx-auto">
            <p className="text-muted-foreground">
              All plans include our core analytics features, real-time data processing, and dedicated support.
            </p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground">Need help choosing?</span>
              <Button variant="link" className="h-auto p-0 text-sm cursor-pointer hover:underline" onClick={onManageBilling}>
                Contact our team
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 