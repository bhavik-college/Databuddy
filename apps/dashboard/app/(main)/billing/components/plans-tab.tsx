"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Star, ArrowRight, ExternalLink, Crown } from "lucide-react";

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number | null;
  originalPrice?: number;
  description: string;
  features: string[];
  limits: {
    websites: number | null;
    pageviews: number | null;
    dataRetention: string;
    teamMembers: number | null;
  };
  current: boolean;
  popular: boolean;
  recommended?: boolean;
  badge?: string;
}

interface PlansTabProps {
  plans: SubscriptionPlan[];
  onUpgrade: (plan: SubscriptionPlan) => void;
  formatCurrency: (amount: number) => string;
  isLoading: boolean;
}

export function PlansTab({ plans, onUpgrade, formatCurrency, isLoading }: PlansTabProps) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-bold">Choose Your Plan</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Upgrade or downgrade anytime. All plans include a 14-day free trial.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative transition-all hover:shadow-md ${
              plan.current ? "ring-2 ring-primary" : ""
            } ${plan.popular ? "ring-2 ring-purple-500 scale-[1.02]" : ""}`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-purple-500 text-white px-3 py-1">
                  <Star className="h-3 w-3 mr-1" />
                  Most Popular
                </Badge>
              </div>
            )}
            {plan.recommended && (
              <div className="absolute -top-3 right-3">
                <Badge variant="secondary">Recommended</Badge>
              </div>
            )}
            {plan.badge && (
              <div className="absolute -top-3 left-3">
                <Badge variant="outline" className="bg-orange-100 text-orange-700">
                  {plan.badge}
                </Badge>
              </div>
            )}

            <CardHeader className="text-center pb-3">
              <CardTitle className="flex items-center justify-center gap-2">
                {plan.name}
                {plan.current && (
                  <Badge variant="secondary">Current</Badge>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
              <div className="mt-3">
                {plan.price === null ? (
                  <div>
                    <span className="text-2xl font-bold">Custom</span>
                    <p className="text-xs text-muted-foreground mt-1">Contact sales</p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-2xl font-bold">{formatCurrency(plan.price)}</span>
                      {plan.originalPrice && (
                        <span className="text-sm text-muted-foreground line-through">
                          {formatCurrency(plan.originalPrice)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">per month</p>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Limits</h4>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div>
                    <span className="text-muted-foreground">Websites</span>
                    <p className="font-medium">{plan.limits.websites || "Unlimited"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Pageviews</span>
                    <p className="font-medium">
                      {plan.limits.pageviews ? plan.limits.pageviews.toLocaleString() : "Unlimited"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Retention</span>
                    <p className="font-medium">{plan.limits.dataRetention}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Team</span>
                    <p className="font-medium">{plan.limits.teamMembers || "Unlimited"}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-1">
                <h4 className="font-medium text-sm">Features</h4>
                <ul className="space-y-0.5">
                  {plan.features.slice(0, 5).map((feature) => (
                    <li key={feature} className="flex items-center text-xs">
                      <CheckCircle2 className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                  {plan.features.length > 5 && (
                    <li className="text-xs text-muted-foreground ml-5">
                      +{plan.features.length - 5} more
                    </li>
                  )}
                </ul>
              </div>

              <Button 
                className="w-full mt-4" 
                variant={plan.current ? "outline" : plan.popular ? "default" : "outline"}
                onClick={() => onUpgrade(plan)}
                disabled={plan.current || isLoading}
                size="sm"
              >
                {plan.current ? (
                  "Current Plan"
                ) : plan.price === null ? (
                  <>
                    Contact Sales
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </>
                ) : (
                  <>
                    Upgrade to {plan.name}
                    <ArrowRight className="ml-2 h-3 w-3" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 