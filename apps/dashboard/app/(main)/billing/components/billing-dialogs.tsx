"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from "lucide-react";

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number | null;
}

interface BillingDialogsProps {
  showUpgradeDialog: boolean;
  showCancelDialog: boolean;
  selectedPlan: SubscriptionPlan | null;
  isLoading: boolean;
  nextBillingDate: string;
  onUpgradeClose: () => void;
  onCancelClose: () => void;
  onConfirmUpgrade: () => void;
  onConfirmCancel: () => void;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
}

export function BillingDialogs({
  showUpgradeDialog,
  showCancelDialog,
  selectedPlan,
  isLoading,
  nextBillingDate,
  onUpgradeClose,
  onCancelClose,
  onConfirmUpgrade,
  onConfirmCancel,
  formatCurrency,
  formatDate
}: BillingDialogsProps) {
  return (
    <>
      {/* Upgrade Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={onUpgradeClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade to {selectedPlan?.name}</DialogTitle>
            <DialogDescription>
              Confirm your plan upgrade. You'll be charged immediately and your new features will be available right away.
            </DialogDescription>
          </DialogHeader>
          {selectedPlan && (
            <div className="space-y-3">
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex justify-between items-center text-sm">
                  <span>Plan upgrade</span>
                  <span className="font-medium">
                    {selectedPlan.price ? formatCurrency(selectedPlan.price) : "Custom pricing"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>Prorated amount</span>
                  <span>{selectedPlan.price ? formatCurrency(selectedPlan.price * 0.8) : "Contact sales"}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Your billing cycle will remain the same. The upgrade takes effect immediately.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={onUpgradeClose}>Cancel</Button>
            <Button onClick={onConfirmUpgrade} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm Upgrade"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={onCancelClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your subscription? You'll lose access to premium features at the end of your billing period.
            </DialogDescription>
          </DialogHeader>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="text-sm">What happens when you cancel?</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1 text-xs mt-2">
                <li>Your subscription will remain active until {formatDate(nextBillingDate)}</li>
                <li>You'll be downgraded to the Free plan automatically</li>
                <li>Your data will be retained according to the Free plan limits</li>
                <li>You can reactivate anytime before the end of your billing period</li>
              </ul>
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="outline" onClick={onCancelClose}>Keep Subscription</Button>
            <Button variant="destructive" onClick={onConfirmCancel}>
              Cancel Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 