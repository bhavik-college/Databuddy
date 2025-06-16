"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CreditCard, Plus, Edit3, Trash2, Loader2 } from "lucide-react";

interface PaymentMethod {
  id: string;
  type: "card";
  last4: string;
  brand: string;
  expiry: string;
  default: boolean;
  name: string;
  country: string;
}

interface PaymentTabProps {
  paymentMethods: PaymentMethod[];
  onAddPayment: () => void;
  onDeletePayment: (methodId: string) => void;
  loadingStates: Record<string, boolean>;
}

export function PaymentTab({ 
  paymentMethods, 
  onAddPayment, 
  onDeletePayment, 
  loadingStates 
}: PaymentTabProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-4 w-4" />
            Payment Methods
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage your payment methods and billing information
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-muted rounded-lg">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium text-sm capitalize">
                      {method.brand} •••• {method.last4}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Expires {method.expiry} • {method.name}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {method.default && (
                    <Badge variant="secondary" className="text-xs">Default</Badge>
                  )}
                  <Button variant="ghost" size="sm">
                    <Edit3 className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  {!method.default && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onDeletePayment(method.id)}
                      disabled={loadingStates[`delete-${method.id}`]}
                    >
                      {loadingStates[`delete-${method.id}`] ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            <Separator className="my-4" />
            
            <Button
              className="w-full"
              variant="outline"
              onClick={onAddPayment}
              disabled={loadingStates["add-payment"]}
              size="sm"
            >
              {loadingStates["add-payment"] ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-3 w-3" />
                  Add Payment Method
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Billing Settings</CardTitle>
          <p className="text-sm text-muted-foreground">Configure your billing preferences</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-pay" className="text-sm font-medium">Automatic payments</Label>
              <p className="text-xs text-muted-foreground">
                Automatically charge your default payment method
              </p>
            </div>
            <Switch id="auto-pay" defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-receipts" className="text-sm font-medium">Email receipts</Label>
              <p className="text-xs text-muted-foreground">
                Send payment receipts to your email
              </p>
            </div>
            <Switch id="email-receipts" defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="usage-alerts" className="text-sm font-medium">Usage alerts</Label>
              <p className="text-xs text-muted-foreground">
                Get notified when approaching plan limits
              </p>
            </div>
            <Switch id="usage-alerts" defaultChecked />
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 