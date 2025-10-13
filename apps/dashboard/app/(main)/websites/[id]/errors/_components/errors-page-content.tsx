'use client';

import type { ErrorEvent, ErrorSummary } from '@databuddy/shared';
import { ArrowClockwiseIcon, BugIcon } from '@phosphor-icons/react';
import { useAtom } from 'jotai';
import { use, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useDateFilters } from '@/hooks/use-date-filters';
import { useEnhancedErrorData } from '@/hooks/use-dynamic-query';
import { formatDateOnly } from '@/lib/formatters';
import { isAnalyticsRefreshingAtom } from '@/stores/jotai/filterAtoms';
import { ErrorDataTable } from './error-data-table';
import { ErrorSummaryStats } from './error-summary-stats';
import { ErrorTrendsChart } from './error-trends-chart';
import { RecentErrorsTable } from './recent-errors-table';
import { TopErrorCard } from './top-error-card';

interface ErrorsPageContentProps {
	params: Promise<{ id: string }>;
}

export const ErrorsPageContent = ({ params }: ErrorsPageContentProps) => {
	const resolvedParams = use(params);
	const websiteId = resolvedParams.id;

	const [isRefreshing, setIsRefreshing] = useAtom(isAnalyticsRefreshingAtom);
	const { dateRange } = useDateFilters();

	const {
		results: errorResults,
		isLoading,
		refetch,
		error,
	} = useEnhancedErrorData(websiteId, dateRange, {
		queryKey: ['enhancedErrorData', websiteId, dateRange],
	});

	const handleRefresh = useCallback(async () => {
		if (isRefreshing) {
			try {
				await refetch();
			} finally {
				setIsRefreshing(false);
			}
		}
	}, [isRefreshing, refetch, setIsRefreshing]);

	useEffect(() => {
		handleRefresh();
	}, [handleRefresh]);

	const getData = (id: string): unknown[] =>
		(errorResults?.find((r) => r.queryId === id)?.data?.[id] as unknown[]) ||
		[];

	const recentErrors = getData('recent_errors') as ErrorEvent[];
	const errorTypes = getData('error_types');
	const errorsByPage = getData('errors_by_page');
	const errorTrends = getData('error_trends');

	const totalErrors = (errorTypes as Record<string, unknown>[]).reduce(
		(sum: number, type: Record<string, unknown>) =>
			sum + ((type.count as number) || 0),
		0
	);
	const totalUsers = (errorTypes as Record<string, unknown>[]).reduce(
		(sum: number, type: Record<string, unknown>) =>
			sum + ((type.users as number) || 0),
		0
	);

	const errorSummary: ErrorSummary = {
		totalErrors,
		uniqueErrorTypes: errorTypes.length,
		affectedUsers: totalUsers,
		affectedSessions: recentErrors.length,
		errorRate: 0,
	};

	const topError = (errorTypes as Record<string, unknown>[])[0] || null;
	const errorChartData = (errorTrends as Record<string, unknown>[]).map(
		(point: Record<string, unknown>) => ({
			date: formatDateOnly(point.date as string),
			'Total Errors': (point.errors as number) || 0,
			'Affected Users': (point.users as number) || 0,
		})
	);

	if (error) {
		return (
			<div className="mx-auto max-w-[1600px] p-6 text-center">
				<div className="rounded border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-950">
					<div className="mx-auto mb-4 w-fit rounded-full border border-destructive/20 bg-destructive/10 p-3">
						<BugIcon className="h-6 w-6 text-destructive" weight="duotone" />
					</div>
					<h4 className="mb-2 font-semibold text-destructive">
						Error loading data
					</h4>
					<p className="mb-4 text-destructive/80 text-sm">
						There was an issue loading your error analytics. Please try
						refreshing using the toolbar above.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-[1600px] space-y-6 py-6">
			{isLoading ? (
				<ErrorsLoadingSkeleton />
			) : (
				<div className="space-y-6">
					<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
						<div className="lg:col-span-2">
							<ErrorTrendsChart errorChartData={errorChartData} />
						</div>
					<div className="space-y-4">
						<ErrorSummaryStats errorSummary={errorSummary} />
						<TopErrorCard
							topError={
								topError as {
									name: string;
									count: number;
									users: number;
								} | null
							}
						/>
					</div>
					</div>
				<RecentErrorsTable recentErrors={recentErrors} />
				<ErrorDataTable
					isLoading={isLoading}
					isRefreshing={isRefreshing}
					processedData={{
						error_types: errorTypes as Record<string, unknown>[],
						errors_by_page: errorsByPage as Record<string, unknown>[],
					}}
				/>
				</div>
			)}
		</div>
	);
};

function ErrorsLoadingSkeleton() {
	return (
		<div className="space-y-6">
			{/* Chart and summary stats grid */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				{/* Error trends chart skeleton */}
				<div className="lg:col-span-2">
					<div className="rounded-lg border bg-background">
						<div className="flex flex-col items-start justify-between gap-3 border-b p-4 sm:flex-row">
							<div className="space-y-2">
								<Skeleton className="h-5 w-32" />
								<Skeleton className="h-4 w-48" />
							</div>
							<div className="flex gap-2">
								<Skeleton className="h-8 w-20" />
								<Skeleton className="h-8 w-20" />
							</div>
						</div>
						<div className="p-4">
							<Skeleton className="h-80 w-full" />
						</div>
					</div>
				</div>

				{/* Summary stats and top error card */}
				<div className="space-y-4">
					{/* Error summary stats skeleton */}
					<div className="rounded-lg border bg-background p-4">
						<div className="space-y-4">
							<div className="space-y-2">
								<Skeleton className="h-5 w-24" />
								<Skeleton className="h-4 w-32" />
							</div>
							<div className="grid grid-cols-2 gap-4">
								{[1, 2, 3, 4].map((num) => (
									<div key={`summary-skeleton-${num}`} className="space-y-2">
										<Skeleton className="h-4 w-16" />
										<Skeleton className="h-6 w-12" />
									</div>
								))}
							</div>
						</div>
					</div>

					{/* Top error card skeleton */}
					<div className="rounded-lg border bg-background p-4">
						<div className="space-y-3">
							<div className="space-y-2">
								<Skeleton className="h-5 w-20" />
								<Skeleton className="h-4 w-28" />
							</div>
							<div className="space-y-2">
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-3/4" />
							</div>
							<div className="flex items-center justify-between">
								<Skeleton className="h-4 w-16" />
								<Skeleton className="h-6 w-12 rounded-full" />
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Recent errors table skeleton */}
			<div className="rounded-lg border bg-background">
				<div className="border-b p-4">
					<div className="space-y-2">
						<Skeleton className="h-5 w-32" />
						<Skeleton className="h-4 w-48" />
					</div>
				</div>
				<div className="space-y-3 p-4">
					{[1, 2, 3, 4, 5].map((rowNum) => (
						<div
							className="flex items-center justify-between"
							key={`recent-error-skeleton-${rowNum}`}
						>
							<div className="flex items-center gap-3">
								<Skeleton className="h-4 w-4" />
								<Skeleton className="h-4 w-48" />
							</div>
							<div className="flex items-center gap-4">
								<Skeleton className="h-4 w-16" />
								<Skeleton className="h-5 w-16 rounded-full" />
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Error data table skeleton */}
			<div className="rounded-lg border bg-background">
				<div className="border-b p-4">
					<div className="space-y-2">
						<Skeleton className="h-5 w-24" />
						<Skeleton className="h-4 w-32" />
					</div>
				</div>
				<div className="space-y-3 p-4">
					{[1, 2, 3, 4, 5, 6, 7, 8].map((rowNum) => (
						<div
							className="flex items-center justify-between"
							key={`error-data-skeleton-${rowNum}`}
						>
							<div className="flex items-center gap-3">
								<Skeleton className="h-4 w-4" />
								<Skeleton className="h-4 w-32" />
							</div>
							<div className="flex items-center gap-4">
								<Skeleton className="h-4 w-12" />
								<Skeleton className="h-4 w-12" />
								<Skeleton className="h-5 w-12 rounded-full" />
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
