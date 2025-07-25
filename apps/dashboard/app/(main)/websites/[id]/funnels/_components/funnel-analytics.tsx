'use client';

import {
  ArrowClockwiseIcon,
  ChartBarIcon,
  ClockIcon,
  TargetIcon,
  TrendDownIcon,
  UsersIcon,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import type { FunnelAnalyticsData } from '@/types/funnels';
import { FunnelFlow } from './funnel-flow';

interface FunnelAnalyticsProps {
  isLoading: boolean;
  error: Error | null;
  data: FunnelAnalyticsData | undefined;
  onRetry: () => void;
  formatCompletionTime: (seconds: number) => string;
}

export function FunnelAnalytics({
  isLoading,
  error,
  data,
  onRetry,
  formatCompletionTime,
}: FunnelAnalyticsProps) {
  if (isLoading) {
    return (
      <div className="fade-in-50 animate-in space-y-4 duration-500">
        {/* Loading Summary Stats */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          </div>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div
                className="animate-pulse rounded border bg-card p-3"
                key={`summary-stat-skeleton-${i + 1}`}
              >
                <div className="mb-1 flex items-center gap-2">
                  <div className="h-3 w-3 rounded bg-muted" />
                  <div className="h-3 w-12 rounded bg-muted" />
                </div>
                <div className="h-4 w-16 rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>

        {/* Loading Funnel Flow */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-20 animate-pulse rounded bg-muted" />
          </div>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div
                className="animate-pulse space-y-1"
                key={`funnel-step-skeleton-${i + 1}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-muted" />
                    <div className="h-3 w-24 rounded bg-muted" />
                  </div>
                  <div className="h-4 w-12 rounded bg-muted" />
                </div>
                <div className="h-6 rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-4">
        <div className="flex items-center justify-between rounded border bg-destructive/5 p-3">
          <div className="flex items-center gap-2">
            <TrendDownIcon
              className="h-4 w-4 text-destructive"
              size={14}
              weight="duotone"
            />
            <div>
              <div className="font-medium text-destructive text-sm">
                Error loading analytics
              </div>
              <div className="text-muted-foreground text-xs">
                {error.message}
              </div>
            </div>
          </div>
          <Button
            className="h-7 gap-1 rounded"
            onClick={onRetry}
            size="sm"
            variant="outline"
          >
            <ArrowClockwiseIcon className="h-3 w-3" size={12} weight="fill" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <ChartBarIcon
            className="h-4 w-4 text-primary"
            size={14}
            weight="duotone"
          />
          <h3 className="font-semibold text-foreground text-sm">Performance</h3>
        </div>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <div className="rounded border bg-card p-3">
            <div className="mb-1 flex items-center gap-2">
              <UsersIcon className="text-muted-foreground" size={12} />
              <span className="text-muted-foreground text-xs">Users</span>
            </div>
            <div className="font-semibold text-sm">
              {data.total_users_entered.toLocaleString()}
            </div>
          </div>
          <div className="rounded border bg-card p-3">
            <div className="mb-1 flex items-center gap-2">
              <TargetIcon className="text-muted-foreground" size={12} />
              <span className="text-muted-foreground text-xs">Conversion</span>
            </div>
            <div className="font-semibold text-primary text-sm">
              {data.overall_conversion_rate.toFixed(1)}%
            </div>
          </div>
          <div className="rounded border bg-card p-3">
            <div className="mb-1 flex items-center gap-2">
              <ClockIcon className="text-muted-foreground" size={12} />
              <span className="text-muted-foreground text-xs">Avg Time</span>
            </div>
            <div className="font-semibold text-sm">
              {formatCompletionTime(data.avg_completion_time)}
            </div>
          </div>
          <div className="rounded border bg-card p-3">
            <div className="mb-1 flex items-center gap-2">
              <TrendDownIcon className="text-muted-foreground" size={12} />
              <span className="text-muted-foreground text-xs">Drop-off</span>
            </div>
            <div className="font-semibold text-destructive text-sm">
              {data.biggest_dropoff_rate.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Funnel Flow */}
      <FunnelFlow
        formatCompletionTime={formatCompletionTime}
        steps={data.steps_analytics}
        totalUsers={data.total_users_entered}
      />
    </div>
  );
}
