'use client';

import type { QueryPerformanceSummary } from '@databuddy/shared';
import {
	ArrowClockwiseIcon,
	ChartBarIcon,
	ChartLineIcon,
	ClockIcon,
	DatabaseIcon,
	EyeIcon,
	FireIcon,
	PlayIcon,
	TrendUpIcon,
	WarningIcon,
} from '@phosphor-icons/react';
import { use, useState } from 'react';
import {
	Bar,
	BarChart,
	Cell,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/lib/trpc';

interface PerformancePageProps {
	params: Promise<{ id: string }>;
}

const CHART_COLORS = [
	'#3b82f6', // blue
	'#ef4444', // red
	'#f59e0b', // amber
	'#10b981', // emerald
	'#8b5cf6', // violet
	'#f97316', // orange
];

function LoadingState() {
	return (
		<div className="space-y-6">
			<div className="space-y-2">
				<Skeleton className="h-8 w-64" />
				<Skeleton className="h-4 w-96" />
			</div>
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<Card key={i.toString()}>
						<CardContent className="pt-6">
							<Skeleton className="h-8 w-16" />
							<Skeleton className="mt-2 h-4 w-24" />
						</CardContent>
					</Card>
				))}
			</div>
			<div className="grid gap-6 lg:grid-cols-2">
				{Array.from({ length: 4 }).map((_, cardIndex) => (
					<Card key={cardIndex.toString()}>
						<CardHeader>
							<Skeleton className="h-6 w-48" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-64 w-full" />
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}

function ExtensionNotEnabledState({ connectionId }: { connectionId: string }) {
	return (
		<div className="space-y-6">
			<div className="space-y-2">
				<div className="flex items-center gap-2">
					<ChartLineIcon
						className="h-6 w-6 text-muted-foreground"
						weight="duotone"
					/>
					<h1 className="font-bold text-2xl">Query Performance</h1>
				</div>
				<p className="text-muted-foreground text-sm">
					Monitor and analyze database query performance with detailed metrics
					and visualizations
				</p>
			</div>

			<Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
				<WarningIcon className="h-4 w-4 text-amber-600" />
				<AlertDescription className="text-amber-800 dark:text-amber-200">
					<div className="space-y-3">
						<div>
							<p className="font-medium">
								pg_stat_statements Extension Required
							</p>
							<p className="mt-1 text-sm">
								The pg_stat_statements extension is required to view query
								performance data. This extension tracks execution statistics for
								all SQL statements.
							</p>
						</div>
						<Button
							onClick={() => {
								window.location.href = `/observability/database/${connectionId}/plugins`;
							}}
							size="sm"
							variant="outline"
						>
							Install Extension
						</Button>
					</div>
				</AlertDescription>
			</Alert>
		</div>
	);
}

function MetricCard({
	title,
	value,
	icon,
	suffix = '',
	trend,
	description,
}: {
	title: string;
	value: string | number;
	icon: React.ReactNode;
	suffix?: string;
	trend?: 'up' | 'down' | 'neutral';
	description?: string;
}) {
	return (
		<Card>
			<CardContent className="pt-6">
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-3">
						{icon}
						<div>
							<p className="font-bold text-2xl">
								{typeof value === 'number' ? value.toLocaleString() : value}
								{suffix}
							</p>
							<p className="text-muted-foreground text-sm">{title}</p>
							{description && (
								<p className="mt-1 text-muted-foreground text-xs">
									{description}
								</p>
							)}
						</div>
					</div>
					{trend && (
						<div
							className={`text-sm ${
								trend === 'up'
									? 'text-green-600'
									: trend === 'down'
										? 'text-red-600'
										: 'text-gray-600'
							}`}
						>
							<TrendUpIcon className="h-4 w-4" />
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

function QueryDistributionChart({
	data,
}: {
	data: Array<{
		time_bucket: string;
		query_count: number;
		total_time: number;
		avg_time: number;
	}>;
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<ChartBarIcon className="h-5 w-5 text-blue-600" />
					Response Time Distribution
				</CardTitle>
				<p className="text-muted-foreground text-sm">
					How many queries fall into each performance bucket
				</p>
			</CardHeader>
			<CardContent>
				<ResponsiveContainer height={300} width="100%">
					<BarChart data={data}>
						<XAxis dataKey="time_bucket" />
						<YAxis />
						<Tooltip
							formatter={(value, name) => [
								typeof value === 'number' ? value.toLocaleString() : value,
								name === 'query_count' ? 'Queries' : 'Total Time (ms)',
							]}
						/>
						<Bar dataKey="query_count" fill="#3b82f6" name="query_count" />
					</BarChart>
				</ResponsiveContainer>
			</CardContent>
		</Card>
	);
}

function TopQueriesPieChart({ data }: { data: QueryPerformanceSummary[] }) {
	const chartData = data.slice(0, 6).map((query, index) => ({
		name: `Query ${index + 1}`,
		value: query.percentage_of_total_time,
		query: `${query.query.slice(0, 50)}...`,
	}));

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<ChartLineIcon className="h-5 w-5 text-amber-600" />
					Resource Consumption
				</CardTitle>
				<p className="text-muted-foreground text-sm">
					Which queries are consuming the most database time
				</p>
			</CardHeader>
			<CardContent>
				<ResponsiveContainer height={300} width="100%">
					<PieChart>
						<Pie
							cx="50%"
							cy="50%"
							data={chartData}
							dataKey="value"
							innerRadius={60}
							outerRadius={120}
						>
							{chartData.map((_, index) => (
								<Cell
									fill={CHART_COLORS[index % CHART_COLORS.length]}
									key={index.toString()}
								/>
							))}
						</Pie>
						<Tooltip
							formatter={(value) => [
								`${Number(value).toFixed(1)}%`,
								'Time Share',
							]}
						/>
					</PieChart>
				</ResponsiveContainer>
			</CardContent>
		</Card>
	);
}

function QueryTableRow({
	query,
	formatTime,
	formatQuery,
	showPercentage,
}: {
	query: QueryPerformanceSummary;
	formatTime: (ms: number) => string;
	formatQuery: (queryText: string) => string;
	showPercentage?: boolean;
}) {
	return (
		<TableRow>
			<TableCell className="max-w-md font-mono text-xs">
				<div className="truncate" title={query.query}>
					{formatQuery(query.query)}
				</div>
			</TableCell>
			<TableCell className="text-right">
				<Badge
					className="text-xs"
					variant={query.calls > 1000 ? 'default' : 'secondary'}
				>
					{query.calls.toLocaleString()}
				</Badge>
			</TableCell>
			<TableCell className="text-right font-medium">
				<Badge
					className="text-xs"
					variant={query.total_exec_time > 1000 ? 'destructive' : 'outline'}
				>
					{formatTime(query.total_exec_time)}
				</Badge>
			</TableCell>
			<TableCell className="text-right font-medium">
				<Badge
					className="text-xs"
					variant={
						query.mean_exec_time > 100
							? 'destructive'
							: query.mean_exec_time > 50
								? 'secondary'
								: 'default'
					}
				>
					{formatTime(query.mean_exec_time)}
				</Badge>
			</TableCell>
			<TableCell className="text-right">
				<div className="flex items-center justify-end gap-2">
					<Progress className="h-2 w-16" value={query.cache_hit_ratio} />
					<Badge
						className="text-xs"
						variant={query.cache_hit_ratio > 90 ? 'default' : 'secondary'}
					>
						{query.cache_hit_ratio.toFixed(0)}%
					</Badge>
				</div>
			</TableCell>
			{showPercentage && (
				<TableCell className="text-right">
					<Badge
						className="text-xs"
						variant={
							query.percentage_of_total_time > 10 ? 'destructive' : 'secondary'
						}
					>
						{query.percentage_of_total_time.toFixed(1)}%
					</Badge>
				</TableCell>
			)}
		</TableRow>
	);
}

function EnhancedQueryTable({
	queries,
	title,
	emptyMessage,
	showPercentage = false,
}: {
	queries: QueryPerformanceSummary[];
	title: string;
	emptyMessage: string;
	showPercentage?: boolean;
}) {
	const formatTime = (ms: number) => {
		if (ms < 1) {
			return `${(ms * 1000).toFixed(0)}μs`;
		}
		if (ms < 1000) {
			return `${ms.toFixed(1)}ms`;
		}
		return `${(ms / 1000).toFixed(2)}s`;
	};

	const formatQuery = (queryText: string) => {
		if (queryText.length > 80) {
			return `${queryText.slice(0, 80)}...`;
		}
		return queryText;
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">{title}</CardTitle>
			</CardHeader>
			<CardContent>
				{queries.length === 0 ? (
					<div className="py-8 text-center">
						<DatabaseIcon className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
						<p className="text-muted-foreground">{emptyMessage}</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Query Pattern</TableHead>
									<TableHead className="text-right">Executions</TableHead>
									<TableHead className="text-right">Total Time</TableHead>
									<TableHead className="text-right">Avg Response</TableHead>
									<TableHead className="text-right">Cache Efficiency</TableHead>
									{showPercentage && (
										<TableHead className="text-right">Resource %</TableHead>
									)}
								</TableRow>
							</TableHeader>
							<TableBody>
								{queries.map((query) => (
									<QueryTableRow
										formatQuery={formatQuery}
										formatTime={formatTime}
										key={query.queryid}
										query={query}
										showPercentage={showPercentage}
									/>
								))}
							</TableBody>
						</Table>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function ResetStatsDialog({
	open,
	onOpenChange,
	connectionId,
	onSuccess,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	connectionId: string;
	onSuccess: () => void;
}) {
	const resetMutation = trpc.performance.resetStats.useMutation({
		onSuccess: () => {
			onSuccess();
			onOpenChange(false);
		},
	});

	const handleReset = () => {
		resetMutation.mutate({ id: connectionId });
	};

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Reset Performance Statistics</DialogTitle>
					<DialogDescription>
						This will clear all query performance statistics and start
						collecting fresh data. This action cannot be undone.
					</DialogDescription>
				</DialogHeader>
				{resetMutation.error && (
					<Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
						<WarningIcon className="h-4 w-4 text-red-600" />
						<AlertDescription className="text-red-800 dark:text-red-200">
							{resetMutation.error.message}
						</AlertDescription>
					</Alert>
				)}
				<DialogFooter>
					<Button onClick={() => onOpenChange(false)} variant="outline">
						Cancel
					</Button>
					<Button
						disabled={resetMutation.isPending}
						onClick={handleReset}
						variant="destructive"
					>
						{resetMutation.isPending ? 'Resetting...' : 'Reset Statistics'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export default function PerformancePage({ params }: PerformancePageProps) {
	const [resetDialog, setResetDialog] = useState(false);
	const [success, setSuccess] = useState<string | null>(null);

	const resolvedParams = use(params);
	const connectionId = resolvedParams.id;

	const utils = trpc.useUtils();

	const { data: extensionStatus, isLoading: extensionLoading } =
		trpc.performance.checkExtensionStatus.useQuery({ id: connectionId });

	const { data: metrics, isLoading: metricsLoading } =
		trpc.performance.getMetrics.useQuery(
			{ id: connectionId },
			{ enabled: extensionStatus?.enabled === true }
		);

	const { data: userInfo } = trpc.performance.getUserInfo.useQuery(
		{ id: connectionId },
		{ enabled: extensionStatus?.enabled === true }
	);

	const handleSuccess = (message: string) => {
		utils.performance.getMetrics.invalidate({ id: connectionId });
		setSuccess(message);
		setTimeout(() => setSuccess(null), 5000);
	};

	if (extensionLoading) {
		return <LoadingState />;
	}

	if (!extensionStatus?.enabled) {
		return <ExtensionNotEnabledState connectionId={connectionId} />;
	}

	if (metricsLoading) {
		return <LoadingState />;
	}

	if (!metrics) {
		return (
			<Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
				<WarningIcon className="h-4 w-4 text-red-600" />
				<AlertDescription className="text-red-800 dark:text-red-200">
					Failed to load performance metrics. Please try again.
				</AlertDescription>
			</Alert>
		);
	}

	return (
		<div className="space-y-6 p-3 sm:p-4 lg:p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<div className="flex items-center gap-2">
						<ChartLineIcon className="h-6 w-6 text-blue-600" weight="duotone" />
						<h1 className="font-bold text-2xl">Performance Analytics</h1>
					</div>
					<p className="text-muted-foreground text-sm">
						Real-time query performance monitoring and optimization insights
					</p>
				</div>
				<Button onClick={() => setResetDialog(true)} variant="outline">
					<ArrowClockwiseIcon className="mr-2 h-4 w-4" />
					Reset Stats
				</Button>
			</div>

			{/* Success Banner */}
			{success && (
				<Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
					<DatabaseIcon className="h-4 w-4 text-green-600" />
					<AlertDescription className="flex items-center justify-between">
						<span className="text-green-800 dark:text-green-200">
							{success}
						</span>
						<Button onClick={() => setSuccess(null)} size="sm" variant="ghost">
							Dismiss
						</Button>
					</AlertDescription>
				</Alert>
			)}

			{/* Performance Health Summary */}
			{metrics.p99_exec_time > 1000 && (
				<Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
					<WarningIcon className="h-4 w-4 text-red-600" />
					<AlertDescription className="text-red-800 dark:text-red-200">
						<strong>Performance Issue Detected:</strong> P99 response time is{' '}
						{metrics.p99_exec_time.toFixed(0)}ms. Consider optimizing slow
						queries or adding database indexes.
					</AlertDescription>
				</Alert>
			)}

			{/* Query Text Permission Info */}
			{metrics.top_queries_by_time.some((q) =>
				q.query.includes('Query ID:')
			) && (
				<Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
					<DatabaseIcon className="h-4 w-4 text-blue-600" />
					<AlertDescription className="text-blue-800 dark:text-blue-200">
						<div className="space-y-2">
							<div>
								<strong>Limited Query Visibility:</strong> Query text is hidden
								due to database permissions. Performance metrics are still
								accurate.
							</div>
							{userInfo && (
								<div className="space-y-1 text-xs">
									<div>
										<strong>Current User:</strong> {userInfo.username}
									</div>
									<div>
										<strong>Has pg_read_all_stats:</strong>{' '}
										{userInfo.hasReadAllStats ? '✅ Yes' : '❌ No'}
									</div>
									{userInfo.roles.length > 0 && (
										<div>
											<strong>Roles:</strong> {userInfo.roles.join(', ')}
										</div>
									)}
								</div>
							)}
							<div>
								<strong>To fix:</strong> Run as superuser:
								<code className="mx-1 rounded bg-blue-100 px-1 text-xs dark:bg-blue-900">
									GRANT pg_read_all_stats TO {userInfo?.username || 'your_user'}
								</code>
								Then <strong>reconnect</strong> to refresh permissions.
							</div>
						</div>
					</AlertDescription>
				</Alert>
			)}

			{/* Critical Performance Metrics */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<MetricCard
					description="99% of queries complete within this time"
					icon={<ClockIcon className="h-6 w-6 text-red-600" />}
					suffix="ms"
					title="P99 Response Time"
					value={metrics.p99_exec_time.toFixed(1)}
				/>
				<MetricCard
					description="Typical query response time"
					icon={<TrendUpIcon className="h-6 w-6 text-green-600" />}
					suffix="ms"
					title="P50 (Median)"
					value={metrics.p50_exec_time.toFixed(1)}
				/>
				<MetricCard
					description="Memory vs disk reads"
					icon={<EyeIcon className="h-6 w-6 text-purple-600" />}
					suffix="%"
					title="Cache Hit Rate"
					value={metrics.cache_hit_ratio.toFixed(1)}
				/>
				<MetricCard
					description={`${metrics.total_queries} unique patterns`}
					icon={<DatabaseIcon className="h-6 w-6 text-blue-600" />}
					title="Query Load"
					value={`${metrics.total_calls.toLocaleString()} calls`}
				/>
			</div>

			{/* Charts */}
			<div className="grid gap-6 lg:grid-cols-2">
				<QueryDistributionChart data={metrics.query_distribution} />
				<TopQueriesPieChart data={metrics.top_queries_by_time} />
			</div>

			{/* Query Tables */}
			<Tabs className="w-full" defaultValue="by-time">
				<TabsList>
					<TabsTrigger value="by-time">
						<FireIcon className="mr-2 h-4 w-4" />
						Resource Hogs
					</TabsTrigger>
					<TabsTrigger value="by-calls">
						<PlayIcon className="mr-2 h-4 w-4" />
						High Volume
					</TabsTrigger>
					<TabsTrigger value="slowest">
						<ClockIcon className="mr-2 h-4 w-4" />
						Slow Queries
					</TabsTrigger>
				</TabsList>

				<TabsContent value="by-time">
					<EnhancedQueryTable
						emptyMessage="No resource-intensive queries found"
						queries={metrics.top_queries_by_time}
						showPercentage={true}
						title="Queries Consuming the Most Database Time"
					/>
				</TabsContent>

				<TabsContent value="by-calls">
					<EnhancedQueryTable
						emptyMessage="No high-volume queries found"
						queries={metrics.top_queries_by_calls}
						title="Most Frequently Executed Queries"
					/>
				</TabsContent>

				<TabsContent value="slowest">
					<EnhancedQueryTable
						emptyMessage="No slow queries found"
						queries={metrics.slowest_queries}
						title="Queries with Highest Average Response Time"
					/>
				</TabsContent>
			</Tabs>

			{/* Reset Dialog */}
			<ResetStatsDialog
				connectionId={connectionId}
				onOpenChange={setResetDialog}
				onSuccess={() =>
					handleSuccess('Performance statistics reset successfully')
				}
				open={resetDialog}
			/>
		</div>
	);
}
