import { useCustomer } from 'autumn-js/react';

export interface CustomerProduct {
  id: string;
  name: string;
  group: string | null;
  status: 'active' | 'canceled' | 'scheduled' | 'trialing';
  canceled_at: number | null;
  started_at: number;
  is_default: boolean;
  is_add_on: boolean;
  current_period_start?: number;
  current_period_end?: number;
  stripe_id: string;
  env: string;
  products: CustomerProduct[];
  features: Record<string, CustomerFeature>;
  metadata: Record<string, any>;
  invoices?: Invoice[];
  payment_methods?: PaymentMethod[];
}

export interface CustomerFeature {
  id: string;
  name: string;
  type: string;
  unlimited?: boolean;
  balance: number | null;
  usage: number;
  included_usage: number;
  next_reset_at: number | null;
  interval?: string;
}

export interface Invoice {
  product_ids: string[];
  stripe_id: string;
  status: 'paid' | 'pending' | 'failed' | 'draft' | 'open' | 'void';
  total: number;
  currency: string;
  created_at: number;
  hosted_invoice_url?: string;
  description?: string;
}

export interface Customer {
  id: string;
  created_at: number;
  name: string;
  email: string;
  fingerprint: string | null;
  stripe_id: string;
  env: string;
  products: CustomerProduct[];
  features: Record<string, CustomerFeature>;
  metadata: Record<string, any>;
  invoices?: Invoice[];
  payment_methods?: PaymentMethod[];
}

export interface Price {
  primary_text: string;
  secondary_text: string;
  primaryText?: string;
  secondaryText?: string;
  type?: string;
  feature_id?: string | null;
  interval?: string;
  price?: number;
}

export interface PlanItem {
  type: 'feature' | 'priced_feature';
  feature_id: string;
  primary_text: string;
  secondary_text?: string;
  included_usage: number | 'inf' | string;
  feature_type?: string;
  interval?: string | null;
  reset_usage_when_enabled?: boolean;
  primaryText?: string;
  secondaryText?: string;
  price?: number | null;
  tiers?: any[];
  usage_model?: string;
  billing_units?: number;
}

export interface Plan {
  id: string;
  name: string;
  is_add_on: boolean;
  price: Price;
  items: PlanItem[];
  scenario: 'active' | 'upgrade' | 'downgrade' | 'canceled' | 'scheduled' | 'trialing';
  button_text: string;
  free_trial?: any | null;
  interval_group?: any | null;
  buttonText?: string;
  status?: string;
  statusDetails?: string;
  current_period_end?: number;
  canceled_at?: number | null;
}

export interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  isDefault: boolean;
}

export interface SubscriptionResponse {
  list: Plan[];
  paymentMethods?: PaymentMethod[];
}

const PLANS_DATA: SubscriptionResponse = {
  "list": [
    {
      "id": "free",
      "name": "Free",
      "is_add_on": false,
      "price": {
        "primary_text": "Free",
        "secondary_text": " ",
        "primaryText": "Free",
        "secondaryText": " "
      },
      "items": [
        {
          "type": "feature",
          "feature_id": "assistant_message",
          "feature_type": "single_use",
          "included_usage": 25,
          "interval": "day",
          "reset_usage_when_enabled": true,
          "primary_text": "25 assistant messages",
          "primaryText": "25 assistant messages"
        },
        {
          "type": "feature",
          "feature_id": "events",
          "feature_type": "single_use",
          "included_usage": 25000,
          "interval": "month",
          "reset_usage_when_enabled": true,
          "primary_text": "25,000 events",
          "primaryText": "25,000 events"
        },
        {
          "type": "feature",
          "feature_id": "websites",
          "feature_type": "single_use",
          "included_usage": 5,
          "interval": null,
          "reset_usage_when_enabled": true,
          "primary_text": "5 websites",
          "primaryText": "5 websites"
        }
      ],
      "scenario": "active",
      "button_text": "Current Plan",
      "free_trial": null,
      "interval_group": null,
      "buttonText": "Current Plan"
    },
    {
      "id": "pro",
      "name": "Pro",
      "is_add_on": false,
      "price": {
        "primary_text": "$9.99",
        "secondary_text": "per month",
        "type": "price",
        "feature_id": null,
        "interval": "month",
        "price": 9.99,
        "primaryText": "$9.99",
        "secondaryText": "per month"
      },
      "items": [
        {
          "type": "priced_feature",
          "feature_id": "assistant_message",
          "feature_type": "single_use",
          "included_usage": 50,
          "interval": "month",
          "price": null,
          "tiers": [
            {
              "to": "inf",
              "amount": 0.02
            }
          ],
          "usage_model": "pay_per_use",
          "billing_units": 1,
          "reset_usage_when_enabled": true,
          "primary_text": "50 included",
          "secondary_text": "then $0.02 per assistant message",
          "primaryText": "50 included",
          "secondaryText": "then $0.02 per assistant message"
        },
        {
          "type": "priced_feature",
          "feature_id": "events",
          "feature_type": "single_use",
          "included_usage": 50000,
          "interval": "month",
          "price": null,
          "tiers": [
            {
              "to": "inf",
              "amount": 0.00002
            }
          ],
          "usage_model": "pay_per_use",
          "billing_units": 1,
          "reset_usage_when_enabled": true,
          "primary_text": "50,000 included",
          "secondary_text": "then $0.00002 per event",
          "primaryText": "50,000 included",
          "secondaryText": "then $0.00002 per event"
        },
        {
          "type": "feature",
          "feature_id": "websites",
          "feature_type": "single_use",
          "included_usage": "inf",
          "interval": null,
          "reset_usage_when_enabled": true,
          "primary_text": "Unlimited website",
          "primaryText": "Unlimited website"
        }
      ],
      "scenario": "upgrade",
      "button_text": "Get Started",
      "free_trial": {
        "duration": "day",
        "length": 14,
        "unique_fingerprint": true,
        "trial_available": true
      },
      "interval_group": null,
      "buttonText": "Get Started"
    },
    {
      "id": "scale",
      "name": "Scale",
      "is_add_on": false,
      "price": {
        "primary_text": "$24.99",
        "secondary_text": "per month",
        "type": "price",
        "feature_id": null,
        "interval": "month",
        "price": 24.99,
        "primaryText": "$24.99",
        "secondaryText": "per month"
      },
      "free_trial": {
        "duration": "day",
        "length": 14,
        "unique_fingerprint": true,
        "trial_available": true
      },
      "items": [
        {
          "type": "priced_feature",
          "feature_id": "assistant_message",
          "feature_type": "single_use",
          "included_usage": 250,
          "interval": "month",
          "price": null,
          "tiers": [
            {
              "to": "inf",
              "amount": 0.02
            }
          ],
          "usage_model": "pay_per_use",
          "billing_units": 1,
          "reset_usage_when_enabled": true,
          "primary_text": "250 included",
          "secondary_text": "then $0.02 per assistant message",
          "primaryText": "250 included",
          "secondaryText": "then $0.02 per assistant message"
        },
        {
          "type": "priced_feature",
          "feature_id": "events",
          "feature_type": "single_use",
          "included_usage": 250000,
          "interval": "month",
          "price": null,
          "tiers": [
            {
              "to": "inf",
              "amount": 0.00017
            }
          ],
          "usage_model": "pay_per_use",
          "billing_units": 1,
          "reset_usage_when_enabled": true,
          "primary_text": "250,000 included",
          "secondary_text": "then $0.00017 per event",
          "primaryText": "250,000 included",
          "secondaryText": "then $0.00017 per event"
        },
        {
          "type": "feature",
          "feature_id": "websites",
          "feature_type": "single_use",
          "included_usage": "inf",
          "interval": null,
          "reset_usage_when_enabled": true,
          "primary_text": "Unlimited website",
          "primaryText": "Unlimited website"
        }
      ],
      "scenario": "upgrade",
      "button_text": "Get Started",
      "interval_group": null,
      "buttonText": "Get Started"
    },
    {
      "id": "buddy",
      "name": "Buddy",
      "is_add_on": false,
      "price": {
        "primary_text": "$49.99",
        "secondary_text": "per month",
        "type": "price",
        "feature_id": null,
        "interval": "month",
        "price": 49.99,
        "primaryText": "$49.99",
        "secondaryText": "per month"
      },
      "items": [
        {
          "type": "priced_feature",
          "feature_id": "events",
          "feature_type": "single_use",
          "included_usage": 1000000,
          "interval": "month",
          "price": null,
          "tiers": [
            {
              "to": "inf",
              "amount": 0.00015
            }
          ],
          "usage_model": "pay_per_use",
          "billing_units": 1,
          "reset_usage_when_enabled": true,
          "primary_text": "1,000,000 included",
          "secondary_text": "then $0.00015 per event",
          "primaryText": "1,000,000 included",
          "secondaryText": "then $0.00015 per event"
        },
        {
          "type": "feature",
          "feature_id": "assistant_message",
          "feature_type": "single_use",
          "included_usage": 500,
          "interval": "day",
          "reset_usage_when_enabled": true,
          "primary_text": "500 assistant messages",
          "primaryText": "500 assistant messages"
        },
        {
          "type": "feature",
          "feature_id": "websites",
          "feature_type": "single_use",
          "included_usage": "inf",
          "interval": null,
          "reset_usage_when_enabled": true,
          "primary_text": "Unlimited website",
          "primaryText": "Unlimited website"
        }
      ],
      "scenario": "upgrade",
      "button_text": "Get Started",
      "free_trial": {
        "duration": "day",
        "length": 7,
        "unique_fingerprint": true,
        "trial_available": true
      },
      "interval_group": null,
      "buttonText": "Get Started"
    }
  ],
  "paymentMethods": []
}

export type FeatureUsage = {
  id: string;
  name: string;
  used: number;
  limit: number;
  unlimited?: boolean;
  nextReset?: string | null;
  interval?: string | null;
  overageRate?: number;
  overageAmount?: number;
  hasOverage?: boolean;
};

export type Usage = {
  features: FeatureUsage[];
}

export const useBillingData = () => {
  const { customer, isLoading: isCustomerLoading, refetch } = useCustomer({
    expand: ["invoices"]
  });

  const subscriptionData: SubscriptionResponse = {
    list: PLANS_DATA.list.map(plan => {
      const customerProduct = customer?.products?.find(p => p.id === plan.id);

      if (customerProduct) {
        let scenario: Plan['scenario'] = 'upgrade';

        if (customerProduct.status === 'active' || customerProduct.status === 'trialing') {
          scenario = customerProduct.canceled_at ? 'canceled' : 'active';
        } else if (customerProduct.status === 'scheduled') {
          scenario = 'scheduled';
        } else {
          scenario = 'downgrade';
        }

        return {
          ...plan,
          scenario,
          status: customerProduct.status,
          statusDetails: customerProduct.status,
          current_period_end: customerProduct.current_period_end || undefined,
          canceled_at: customerProduct.canceled_at,
        };
      }

      const isFree = plan.id === 'free';
      const scenario: Plan['scenario'] = isFree ? 'downgrade' : 'upgrade';

      return {
        ...plan,
        scenario,
        status: undefined,
        statusDetails: undefined,
        current_period_end: undefined,
        canceled_at: undefined,
      };
    }),
    paymentMethods: (customer as any)?.payment_methods || [],
  };

  const usage: Usage = {
    features: !customer ? [] : Object.values(customer.features).map(feature => {
      const used = feature.usage || 0;
      const limit = feature.unlimited ? Infinity : (feature.included_usage || 0);
      const unlimited = feature.unlimited || false;

      const currentPlan = subscriptionData.list.find(p => p.scenario === 'active');
      const planItem = currentPlan?.items.find(item => item.feature_id === feature.id);

      let overageRate = 0;
      let overageAmount = 0;
      let hasOverage = false;

      if (!unlimited && used > limit && planItem?.type === 'priced_feature') {
        hasOverage = true;
        const overageUnits = used - limit;

        if (planItem.tiers && planItem.tiers.length > 0) {
          overageRate = planItem.tiers[0].amount || 0;
          overageAmount = overageUnits * overageRate;
        }
      }

      return {
        id: feature.id,
        name: feature.name,
        used,
        limit,
        unlimited,
        nextReset: feature.next_reset_at ? new Date(feature.next_reset_at).toLocaleDateString() : null,
        interval: feature.interval || null,
        overageRate,
        overageAmount,
        hasOverage
      };
    }),
  };

  return {
    subscriptionData,
    usage,
    customerData: customer,
    isLoading: isCustomerLoading,
    refetch,
  };
};