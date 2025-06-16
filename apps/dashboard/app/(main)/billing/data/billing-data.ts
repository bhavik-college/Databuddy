export interface SubscriptionPlan {
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

export interface UsageData {
  websites: { current: number; limit: number | null };
  pageviews: { current: number; limit: number | null };
  teamMembers: { current: number; limit: number | null };
  dataRetention: string;
  billingCycle: string;
  nextBillingDate: string;
  renewalAmount: number;
}

export interface BillingAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  action?: { label: string; onClick: () => void };
}

export interface BillingHistoryItem {
  id: string;
  date: string;
  amount: number;
  status: "paid" | "failed";
  description: string;
  period: string;
  pdfUrl: string;
  paymentMethod: string;
}

export interface PaymentMethod {
  id: string;
  type: "card";
  last4: string;
  brand: string;
  expiry: string;
  default: boolean;
  name: string;
  country: string;
}

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Starter",
    price: 0,
    description: "Perfect for personal projects and getting started",
    features: [
      "Real-time analytics dashboard",
      "Basic visitor tracking",
      "Page view analytics",
      "Referrer tracking",
      "Mobile-responsive reports",
      "Email support"
    ],
    limits: {
      websites: 3,
      pageviews: 10000,
      dataRetention: "7 days",
      teamMembers: 1
    },
    current: true,
    popular: false
  },
  {
    id: "pro",
    name: "Professional",
    price: 29,
    originalPrice: 39,
    description: "For growing businesses and teams",
    features: [
      "Everything in Starter",
      "Advanced analytics & insights",
      "Custom event tracking",
      "Goal conversion tracking",
      "A/B testing analytics",
      "Team collaboration",
      "API access",
      "Priority support",
      "Custom domains",
      "White-label reports"
    ],
    limits: {
      websites: null,
      pageviews: 100000,
      dataRetention: "90 days",
      teamMembers: 5
    },
    current: false,
    popular: true,
    badge: "Save $10/mo"
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: null,
    description: "For large organizations with custom needs",
    features: [
      "Everything in Professional",
      "Unlimited pageviews",
      "Custom data retention",
      "Dedicated account manager",
      "Custom integrations",
      "SSO & advanced security",
      "SLA guarantee (99.9%)",
      "On-premise deployment",
      "Custom reporting",
      "24/7 phone support"
    ],
    limits: {
      websites: null,
      pageviews: null,
      dataRetention: "Custom",
      teamMembers: null
    },
    current: false,
    popular: false,
    recommended: true
  }
];

export const usageData: UsageData = {
  websites: { current: 2, limit: 3 },
  pageviews: { current: 7500, limit: 10000 },
  teamMembers: { current: 1, limit: 1 },
  dataRetention: "7 days",
  billingCycle: "monthly",
  nextBillingDate: "2024-04-15",
  renewalAmount: 0
};

export const billingHistory: BillingHistoryItem[] = [
  {
    id: "INV-2024-003",
    date: "2024-03-15",
    amount: 29.00,
    status: "paid",
    description: "Professional Plan - Monthly",
    period: "Mar 15 - Apr 15, 2024",
    pdfUrl: "#",
    paymentMethod: "•••• 4242"
  },
  {
    id: "INV-2024-002",
    date: "2024-02-15",
    amount: 29.00,
    status: "paid",
    description: "Professional Plan - Monthly",
    period: "Feb 15 - Mar 15, 2024",
    pdfUrl: "#",
    paymentMethod: "•••• 4242"
  },
  {
    id: "INV-2024-001",
    date: "2024-01-15",
    amount: 29.00,
    status: "failed",
    description: "Professional Plan - Monthly",
    period: "Jan 15 - Feb 15, 2024",
    pdfUrl: "#",
    paymentMethod: "•••• 8888"
  }
];

export const paymentMethods: PaymentMethod[] = [
  {
    id: "pm_1",
    type: "card",
    last4: "4242",
    brand: "visa",
    expiry: "12/25",
    default: true,
    name: "John Doe",
    country: "US"
  },
  {
    id: "pm_2",
    type: "card",
    last4: "8888",
    brand: "mastercard",
    expiry: "06/24",
    default: false,
    name: "John Doe",
    country: "US"
  }
]; 