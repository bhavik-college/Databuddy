import type { user } from "@databuddy/db";

export type User = typeof user.$inferSelect;

export interface CustomerData {
    customer_id: string;
    feature_id: string;
    allowed: boolean;
    required_balance: number;
    code: string;
    interval: string;
    unlimited: boolean;
    balance: number;
    usage: number;
    included_usage: number;
    next_reset_at: number;
    overage_allowed: boolean;
    user_name?: string;
    user_email?: string;
}

export interface CustomerDataWithPricing extends CustomerData {
    overage_amount: number;
    overage_cost: number;
    total_cost: number;
    predicted_usage?: number;
    predicted_overage?: number;
    risk_level?: 'low' | 'medium' | 'high' | 'critical';
    days_until_reset?: number;
    is_over_limit?: boolean;
    is_free_plan?: boolean;
}
