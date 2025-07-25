// Revenue-related types

export interface RevenueSummaryData {
  total_revenue: number;
  total_transactions: number;
  total_refunds: number;
  avg_order_value: number;
  success_rate: number;
}

export interface RevenueTrendData {
  time: string;
  revenue: number;
  transactions: number;
  avg_order_value: number;
  success_rate: number;
}

export interface RecentTransactionData {
  id: string;
  created: string;
  status: string;
  currency: string;
  amount: number;
  card_brand?: string;
  session_id?: string;
}

export interface RecentRefundData {
  id: string;
  created: string;
  status: string;
  reason?: string;
  currency: string;
  amount: number;
  payment_intent_id: string;
  session_id?: string;
}

export interface RevenueBreakdownData {
  name: string;
  total_revenue: number;
  total_transactions: number;
  avg_order_value: number;
}
