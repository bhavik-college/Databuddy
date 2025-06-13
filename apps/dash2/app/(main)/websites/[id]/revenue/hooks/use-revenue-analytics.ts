'use client';

import { 
  useBatchDynamicQuery,
  type RevenueSummaryData,
  type RevenueTrendData,
  type RecentTransactionData,
  type RecentRefundData,
  type RevenueBreakdownData
} from '@/hooks/use-dynamic-query';
import type { DateRange } from '@/hooks/use-analytics';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import { useRevenueConfig } from './use-revenue-config';

/**
 * Hook for revenue analytics specific to the revenue page
 * Uses the base useRevenueAnalytics hook with website context
 */
export function useRevenueAnalytics(dateRange: DateRange) {
  const params = useParams();
  const websiteId = params.id as string;
  
  // Get user's revenue config to determine live mode setting
  const { isLiveMode } = useRevenueConfig();

  // Debug logging
  console.log('Revenue Analytics - isLiveMode:', isLiveMode);

  // Create custom queries with livemode filter
  const queries = useMemo(() => {
    console.log('Revenue Analytics - Creating queries with isLiveMode:', isLiveMode);
    return [
      {
        id: 'revenue-summary',
        parameters: ['revenue_summary'],
        limit: 1,
        filters: [{ field: 'livemode', operator: 'eq' as const, value: isLiveMode ? 1 : 0 }]
      },
      {
        id: 'revenue-trends',
        parameters: ['revenue_trends'],
        limit: 100,
        filters: [{ field: 'livemode', operator: 'eq' as const, value: isLiveMode ? 1 : 0 }]
      },
      {
        id: 'recent-transactions',
        parameters: ['recent_transactions'],
        limit: 50,
        filters: [{ field: 'livemode', operator: 'eq' as const, value: isLiveMode ? 1 : 0 }]
      },
      {
        id: 'recent-refunds',
        parameters: ['recent_refunds'],
        limit: 50,
        filters: [{ field: 'livemode', operator: 'eq' as const, value: isLiveMode ? 1 : 0 }]
      },
      {
        id: 'revenue-by-country',
        parameters: ['revenue_by_country'],
        limit: 20,
        filters: [{ field: 'livemode', operator: 'eq' as const, value: isLiveMode ? 1 : 0 }]
      },
      {
        id: 'revenue-by-currency',
        parameters: ['revenue_by_currency'],
        limit: 10,
        filters: [{ field: 'livemode', operator: 'eq' as const, value: isLiveMode ? 1 : 0 }]
      },
      {
        id: 'revenue-by-card-brand',
        parameters: ['revenue_by_card_brand'],
        limit: 10,
        filters: [{ field: 'livemode', operator: 'eq' as const, value: isLiveMode ? 1 : 0 }]
      },
    ];
  }, [isLiveMode]);

  const batchResult = useBatchDynamicQuery(websiteId, dateRange, queries, {
    enabled: !!websiteId,
    staleTime: 2 * 60 * 1000, // 2 minutes for revenue data
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Process the batch results into revenue data structure
  const revenueData = useMemo(() => {
    const summaryData = batchResult.getDataForQuery('revenue-summary', 'revenue_summary') as RevenueSummaryData[];
    const summary = summaryData?.[0] || {
      total_revenue: 0,
      total_transactions: 0,
      total_refunds: 0,
      avg_order_value: 0,
      success_rate: 0,
    };

    return {
      summary,
      trends: batchResult.getDataForQuery('revenue-trends', 'revenue_trends') as RevenueTrendData[],
      recentTransactions: batchResult.getDataForQuery('recent-transactions', 'recent_transactions') as RecentTransactionData[],
      recentRefunds: batchResult.getDataForQuery('recent-refunds', 'recent_refunds') as RecentRefundData[],
      byCountry: batchResult.getDataForQuery('revenue-by-country', 'revenue_by_country') as RevenueBreakdownData[],
      byCurrency: batchResult.getDataForQuery('revenue-by-currency', 'revenue_by_currency') as RevenueBreakdownData[],
      byCardBrand: batchResult.getDataForQuery('revenue-by-card-brand', 'revenue_by_card_brand') as RevenueBreakdownData[],
    };
  }, [batchResult]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const { summary, trends } = revenueData;
    
    // Calculate growth from trends if available
    const revenueGrowth = trends.length >= 2 ? 
      ((trends[0]?.revenue || 0) - (trends[1]?.revenue || 0)) / (trends[1]?.revenue || 1) * 100 : 0;
    
    const transactionGrowth = trends.length >= 2 ? 
      ((trends[0]?.transactions || 0) - (trends[1]?.transactions || 0)) / (trends[1]?.transactions || 1) * 100 : 0;

    // Calculate refund rate
    const refundRate = summary.total_transactions > 0 ? 
      (summary.total_refunds / summary.total_transactions) * 100 : 0;

    return {
      revenueGrowth: Math.round(revenueGrowth * 100) / 100,
      transactionGrowth: Math.round(transactionGrowth * 100) / 100,
      refundRate: Math.round(refundRate * 100) / 100,
      totalRecentTransactions: revenueData.recentTransactions.length,
      totalRecentRefunds: revenueData.recentRefunds.length,
    };
  }, [revenueData]);

  const result = {
    ...batchResult,
    revenueData,
    summaryStats,
    // Convenience methods
    hasSummaryData: batchResult.hasDataForQuery('revenue-summary', 'revenue_summary'),
    hasTrendsData: batchResult.hasDataForQuery('revenue-trends', 'revenue_trends'),
    hasTransactionsData: batchResult.hasDataForQuery('recent-transactions', 'recent_transactions'),
    hasRefundsData: batchResult.hasDataForQuery('recent-refunds', 'recent_refunds'),
    hasCountryData: batchResult.hasDataForQuery('revenue-by-country', 'revenue_by_country'),
    hasCurrencyData: batchResult.hasDataForQuery('revenue-by-currency', 'revenue_by_currency'),
    hasCardBrandData: batchResult.hasDataForQuery('revenue-by-card-brand', 'revenue_by_card_brand'),
  };

  // Format currency values for display
  const formattedData = useMemo(() => {
    if (!result.revenueData) return null;

    const formatCurrency = (amount: number, currency = 'USD') => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    };

    const formatPercentage = (value: number) => {
      return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
    };

    return {
      ...result.revenueData,
      summary: {
        ...result.revenueData.summary,
        total_revenue_formatted: formatCurrency(result.revenueData.summary.total_revenue),
        avg_order_value_formatted: formatCurrency(result.revenueData.summary.avg_order_value),
        success_rate_formatted: `${result.revenueData.summary.success_rate.toFixed(1)}%`,
      },
      summaryStats: {
        ...result.summaryStats,
        revenueGrowth_formatted: formatPercentage(result.summaryStats.revenueGrowth),
        transactionGrowth_formatted: formatPercentage(result.summaryStats.transactionGrowth),
        refundRate_formatted: `${result.summaryStats.refundRate.toFixed(1)}%`,
      },
      trends: result.revenueData.trends.map(trend => ({
        ...trend,
        revenue_formatted: formatCurrency(trend.revenue),
        date: new Date(trend.time).toLocaleDateString(),
      })),
      recentTransactions: result.revenueData.recentTransactions.map(transaction => ({
        ...transaction,
        amount_formatted: formatCurrency(transaction.amount, transaction.currency),
        created_formatted: new Date(transaction.created).toLocaleString(),
      })),
      recentRefunds: result.revenueData.recentRefunds.map(refund => ({
        ...refund,
        amount_formatted: formatCurrency(refund.amount, refund.currency),
        created_formatted: new Date(refund.created).toLocaleString(),
      })),
      byCountry: result.revenueData.byCountry.map(country => ({
        ...country,
        total_revenue_formatted: formatCurrency(country.total_revenue),
        avg_order_value_formatted: formatCurrency(country.avg_order_value),
      })),
      byCurrency: result.revenueData.byCurrency.map(currency => ({
        ...currency,
        total_revenue_formatted: formatCurrency(currency.total_revenue),
        avg_order_value_formatted: formatCurrency(currency.avg_order_value),
      })),
      byCardBrand: result.revenueData.byCardBrand.map(brand => ({
        ...brand,
        total_revenue_formatted: formatCurrency(brand.total_revenue),
        avg_order_value_formatted: formatCurrency(brand.avg_order_value),
      })),
    };
  }, [result.revenueData, result.summaryStats]);

  return {
    ...result,
    formattedData,
    // Convenience flags
    hasAnyData: result.hasSummaryData || result.hasTrendsData || result.hasTransactionsData,
    isEmpty: !result.isLoading && !(result.hasSummaryData || result.hasTrendsData || result.hasTransactionsData),
  };
}

/**
 * Hook for revenue summary metrics only (lighter weight)
 */
export function useRevenueSummary(dateRange: DateRange) {
  const params = useParams();
  const websiteId = params.id as string;
  
  // Get user's revenue config to determine live mode setting
  const { isLiveMode } = useRevenueConfig();

  // Create a single query for summary only
  const queries = useMemo(() => [
    {
      id: 'revenue-summary',
      parameters: ['revenue_summary'],
      limit: 1,
      filters: [{ field: 'livemode', operator: 'eq' as const, value: isLiveMode ? 1 : 0 }]
    },
  ], [isLiveMode]);

  const result = useBatchDynamicQuery(websiteId, dateRange, queries, {
    enabled: !!websiteId,
    staleTime: 1 * 60 * 1000, // 1 minute for summary
  });

  const summaryData = result.getDataForQuery('revenue-summary', 'revenue_summary') as RevenueSummaryData[];
  const summary = summaryData?.[0] || {
    total_revenue: 0,
    total_transactions: 0,
    total_refunds: 0,
    avg_order_value: 0,
    success_rate: 0,
  };

  return {
    summary,
    summaryStats: {
      revenueGrowth: 0,
      transactionGrowth: 0,
      refundRate: summary.total_transactions > 0 ? (summary.total_refunds / summary.total_transactions) * 100 : 0,
      totalRecentTransactions: 0,
      totalRecentRefunds: 0,
    },
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    hasSummaryData: result.hasDataForQuery('revenue-summary', 'revenue_summary'),
  };
} 