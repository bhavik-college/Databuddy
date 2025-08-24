'use client';

import { LightningIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { MetricsChart } from '@/components/charts/metrics-chart';
import type { ChartDataRow } from '@/components/charts/metrics-constants';

interface WebVitalsData {
	date: string;
	[key: string]: unknown;
}

interface WebVitalsChartProps {
	data: WebVitalsData[];
	isLoading: boolean;
	isRefreshing: boolean;
}

const WEB_VITALS_METRICS = [
	{
		key: 'lcp',
		label: 'LCP',
		desc: 'Largest Contentful Paint',
		good: 2500,
		poor: 4000,
	},
	{
		key: 'fcp',
		label: 'FCP',
		desc: 'First Contentful Paint',
		good: 1800,
		poor: 3000,
	},
	{ key: 'fid', label: 'FID', desc: 'First Input Delay', good: 100, poor: 300 },
	{
		key: 'inp',
		label: 'INP',
		desc: 'Interaction to Next Paint',
		good: 200,
		poor: 500,
	},
] as const;

const getStatus = (
	value: number,
	metric: (typeof WEB_VITALS_METRICS)[number]
) => {
	if (value <= metric.good) {
		return { label: 'Good', color: 'text-green-600' };
	}
	if (value <= metric.poor) {
		return { label: 'Needs Improvement', color: 'text-yellow-600' };
	}
	return { label: 'Poor', color: 'text-red-600' };
};

export function WebVitalsChart({
	data,
	isLoading,
	isRefreshing,
}: WebVitalsChartProps) {
	const [selectedMetric, setSelectedMetric] = useState<string>('lcp');

	if (!data?.length) {
		return null;
	}

	const latestData = data.at(-1);

	const selectMetric = (metricKey: string) => {
		setSelectedMetric(metricKey);
	};

	const chartData = data.map((item) => {
		const result: Record<string, unknown> = { date: item.date };
		// Add all percentiles for the selected metric
		result[`avg_${selectedMetric}`] = item[`avg_${selectedMetric}`];
		result[`p50_${selectedMetric}`] = item[`p50_${selectedMetric}`];
		result[`p75_${selectedMetric}`] = item[`p75_${selectedMetric}`];
		result[`p90_${selectedMetric}`] = item[`p90_${selectedMetric}`];
		result[`p95_${selectedMetric}`] = item[`p95_${selectedMetric}`];
		result[`p99_${selectedMetric}`] = item[`p99_${selectedMetric}`];
		return result;
	});

	return (
		<div className="rounded border bg-muted/20 p-4">
			<div className="mb-4 flex items-start gap-2">
				<LightningIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
				<div>
					<p className="mb-1 font-medium text-foreground">Core Web Vitals</p>
					<p className="text-muted-foreground text-xs">
						Performance metrics with percentile distributions.{' '}
						<span className="font-medium text-green-600">Good</span>,
						<span className="ml-1 font-medium text-yellow-600">
							Needs Improvement
						</span>
						,<span className="ml-1 font-medium text-red-600">Poor</span>{' '}
						ratings.
					</p>
				</div>
			</div>

			<div className="space-y-4">
				{/* Metric Selection */}
				<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
					{WEB_VITALS_METRICS.map((metric) => {
						const isSelected = selectedMetric === metric.key;
						const p95Value = latestData?.[`p95_${metric.key}`] as
							| number
							| undefined;
						const status = p95Value ? getStatus(p95Value, metric) : null;

						return (
							<button
								className={`rounded border p-3 text-left transition-all hover:shadow-sm ${
									isSelected
										? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary/20'
										: 'border-border hover:border-primary/50 hover:bg-muted/50'
								}`}
								key={metric.key}
								onClick={() => {
									selectMetric(metric.key);
								}}
								type="button"
							>
								<div className="mb-2 flex items-center justify-between">
									<div>
										<div className="font-medium text-sm">{metric.label}</div>
										<div className="text-muted-foreground text-xs">
											{metric.desc}
										</div>
									</div>
									{isSelected && (
										<div className="h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
									)}
								</div>
								{p95Value && (
									<div>
										<div className="font-mono font-semibold text-base">
											{Math.round(p95Value)}ms
										</div>
										{status && (
											<div className={`font-medium text-xs ${status.color}`}>
												{status.label}
											</div>
										)}
									</div>
								)}
							</button>
						);
					})}
				</div>

				{/* Chart */}
				<MetricsChart
					data={chartData as ChartDataRow[]}
					description={`${WEB_VITALS_METRICS.find((m) => m.key === selectedMetric)?.desc || 'Performance metric'} showing percentile distributions over time`}
					height={400}
					isLoading={isLoading || isRefreshing}
					title={`${WEB_VITALS_METRICS.find((m) => m.key === selectedMetric)?.label || 'Core Web Vitals'} Performance`}
				/>
			</div>
		</div>
	);
}
