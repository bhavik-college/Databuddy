"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface DomainRankData {
  status_code: number;
  error: string;
  page_rank_integer: number;
  page_rank_decimal: number;
  rank: string | null;
  domain: string;
}

interface BatchDomainRankResponse {
  success: boolean;
  error?: string;
  data: Record<string, DomainRankData | null>;
}

const CACHE_TIME = 60 * 60 * 1000; // 1 hour
const STALE_TIME = 30 * 60 * 1000; // 30 minutes

const queryOptions = {
  staleTime: STALE_TIME,
  gcTime: CACHE_TIME + 5 * 60 * 1000,
  refetchOnWindowFocus: false,
  refetchOnMount: true,
  retry: (failureCount: number, error: Error) => {
    // Don't retry on 4xx errors except 408 (timeout)
    if (error.message.includes("HTTP 4") && !error.message.includes("HTTP 408")) {
      return false;
    }
    // Retry up to 3 times for other errors
    return failureCount < 3;
  },
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30_000),
} as const;

async function fetchDomainRanks(): Promise<BatchDomainRankResponse> {
  const response = await fetch(`${API_BASE_URL}/v1/domain-info/batch/all`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || "Failed to fetch domain ranks");
  }

  return data;
}

export function useDomainRanks() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["domain-ranks"],
    queryFn: fetchDomainRanks,
    ...queryOptions,
  });

  const invalidateAndRefetch = () => {
    queryClient.invalidateQueries({ queryKey: ["domain-ranks"] });
    return query.refetch();
  };

  const forceRefresh = () => {
    queryClient.removeQueries({ queryKey: ["domain-ranks"] });
    return query.refetch();
  };

  return {
    // Data
    ranks: query.data?.data ?? {},

    // Loading states
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isRefetching: query.isRefetching,

    // Error states
    isError: query.isError,
    error: query.error,

    // Status
    status: query.status,
    fetchStatus: query.fetchStatus,

    // Actions
    refetch: query.refetch,
    invalidateAndRefetch,
    forceRefresh,

    // Timestamps
    dataUpdatedAt: query.dataUpdatedAt,
    errorUpdatedAt: query.errorUpdatedAt,

    // Helper functions
    isStale: query.isStale,
    isPending: query.isPending,
  };
}
