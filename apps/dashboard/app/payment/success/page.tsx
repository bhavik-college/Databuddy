"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircleIcon, ArrowRightIcon, CreditCardIcon } from '@phosphor-icons/react';
import { Skeleton } from '@/components/ui/skeleton';
import { useBillingData } from '@/app/(main)/billing/data/billing-data';
import { Badge } from '@/components/ui/badge';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { subscriptionData, customerData, isLoading, refetch } = useBillingData();
  const [isRefetching, setIsRefetching] = useState(true);

  const sessionId = searchParams.get('session_id');
  const planId = searchParams.get('plan_id');

  // Refetch data when component mounts to get updated subscription info
  useEffect(() => {
    const refreshData = async () => {
      if (refetch) {
        await refetch();
      }
      setIsRefetching(false);
    };
    
    refreshData();
  }, [refetch]);

  const currentPlan = subscriptionData?.list?.find(plan => 
    plan.scenario === 'active' || plan.scenario === 'trialing'
  );

  const navigateToDashboard = () => {
    router.push('/');
  };

  const navigateToBilling = () => {
    router.push('/billing');
  };

  if (isLoading || isRefetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <Skeleton className="h-12 w-12 rounded-full mx-auto mb-4" />
            <Skeleton className="h-6 w-48 mx-auto mb-2" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-10 w-full mt-6" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon size={32} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            Payment Successful!
          </CardTitle>
          <CardDescription className="text-base">
            Your subscription has been activated successfully
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {currentPlan && (
            <div className="bg-muted/50 rounded p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Plan:</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{currentPlan.name}</span>
                  {currentPlan.scenario === 'trialing' && (
                    <Badge variant="secondary" className="text-xs">
                      Free Trial
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium">Price:</span>
                <span className="font-semibold">{currentPlan.price.primary_text}</span>
              </div>

              {currentPlan.current_period_end && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {currentPlan.scenario === 'trialing' ? 'Trial ends:' : 'Next billing:'}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(currentPlan.current_period_end).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          )}

          {sessionId && (
            <div className="text-center text-sm text-muted-foreground">
              <div className="flex items-center justify-center gap-2">
                <CreditCardIcon size={16} />
                <span>Session ID: {sessionId.slice(-8)}</span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Button 
              onClick={navigateToDashboard} 
              className="w-full"
              size="lg"
            >
              Go to Dashboard
              <ArrowRightIcon size={16} className="ml-2" />
            </Button>
            
            <Button 
              onClick={navigateToBilling} 
              variant="outline" 
              className="w-full"
            >
              View Billing Details
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              Thank you for your purchase! You now have access to all premium features.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 