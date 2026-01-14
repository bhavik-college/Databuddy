"use client";

import type { DynamicQueryRequest } from "@databuddy/shared/types/api";
import {
	ChartLineUpIcon,
	CurrencyDollarIcon,
	LightningIcon,
	RobotIcon,
	WarningIcon,
} from "@phosphor-icons/react";
import { useAtom } from "jotai";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { StatCard } from "@/components/analytics/stat-card";
import { SimpleMetricsChart } from "@/components/charts/simple-metrics-chart";
import { DataTable, type TabConfig } from "@/components/table/data-table";
import { useDateFilters } from "@/hooks/use-date-filters";
import { useBatchDynamicQuery } from "@/hooks/use-dynamic-query";
import { addDynamicFilterAtom } from "@/stores/jotai/filterAtoms";
import {
	createErrorColumns,
	createFinishReasonColumns,
	createModelColumns,
	createProviderColumns,
	type LlmErrorBreakdownRow,
	type LlmFinishReasonRow,
	type LlmModelBreakdownRow,
	type LlmProviderBreakdownRow,
} from "./_components/llm-columns";
import {
	formatDurationMs,
	formatPercent,
	formatTokenCount,
	formatUsd,
} from "./_lib/llm-analytics-utils";

interface LlmOverviewKpiRow {
	total_calls: number;
	total_cost: number;
	total_tokens: number;
	input_tokens: number;
	output_tokens: number;
	avg_duration_ms: number;
	p75_duration_ms: number;
	error_count: number;
	error_rate: number;
	cache_hit_rate: number;
	tool_use_rate: number;
	web_search_rate: number;
}

interface LlmTimeSeriesRow {
	date: string;
	total_calls: number;
	total_cost: number;
	total_tokens: number;
	avg_duration_ms: number;
	p75_duration_ms: number;
}

export default function LlmAnalyticsOverviewPage() {
	const { id } = useParams();
	const websiteId = id as string;
	const { dateRange } = useDateFilters();
	const [, addFilter] = useAtom(addDynamicFilterAtom);

	const queries: DynamicQueryRequest[] = [
		{ id: "llm-kpis", parameters: ["llm_overview_kpis"] },
		{ id: "llm-series", parameters: ["llm_time_series"] },
		{ id: "llm-provider", parameters: ["llm_provider_breakdown"] },
		{ id: "llm-model", parameters: ["llm_model_breakdown"] },
		{ id: "llm-finish", parameters: ["llm_finish_reason_breakdown"] },
		{ id: "llm-errors", parameters: ["llm_error_breakdown"] },
	];

	const { isLoading, getDataForQuery } = useBatchDynamicQuery(
		websiteId,
		dateRange,
		queries
	);

	const kpiRow = (
		getDataForQuery("llm-kpis", "llm_overview_kpis") as LlmOverviewKpiRow[]
	)[0] ?? {
		total_calls: 0,
		total_cost: 0,
		total_tokens: 0,
		input_tokens: 0,
		output_tokens: 0,
		avg_duration_ms: 0,
		p75_duration_ms: 0,
		error_count: 0,
		error_rate: 0,
		cache_hit_rate: 0,
		tool_use_rate: 0,
		web_search_rate: 0,
	};

	const timeSeries =
		(getDataForQuery("llm-series", "llm_time_series") as LlmTimeSeriesRow[]) ??
		[];

	const providerBreakdown =
		(getDataForQuery(
			"llm-provider",
			"llm_provider_breakdown"
		) as LlmProviderBreakdownRow[]) ?? [];
	const modelBreakdown =
		(getDataForQuery(
			"llm-model",
			"llm_model_breakdown"
		) as LlmModelBreakdownRow[]) ?? [];
	const finishReasonBreakdown =
		(getDataForQuery(
			"llm-finish",
			"llm_finish_reason_breakdown"
		) as LlmFinishReasonRow[]) ?? [];
	const errorBreakdown =
		(getDataForQuery(
			"llm-errors",
			"llm_error_breakdown"
		) as LlmErrorBreakdownRow[]) ?? [];

	const callsSeries = useMemo(
		() =>
			timeSeries.map((row) => ({
				date: row.date,
				calls: row.total_calls ?? 0,
			})),
		[timeSeries]
	);
	const costSeries = useMemo(
		() =>
			timeSeries.map((row) => ({
				date: row.date,
				cost: row.total_cost ?? 0,
			})),
		[timeSeries]
	);
	const latencySeries = useMemo(
		() =>
			timeSeries.map((row) => ({
				date: row.date,
				avg: row.avg_duration_ms ?? 0,
				p75: row.p75_duration_ms ?? 0,
			})),
		[timeSeries]
	);

	const breakdownTabs = useMemo(() => {
		const tabs: TabConfig<
			| LlmProviderBreakdownRow
			| LlmModelBreakdownRow
			| LlmFinishReasonRow
			| LlmErrorBreakdownRow
		>[] = [];

		if (providerBreakdown.length > 0) {
			tabs.push({
				id: "providers",
				label: "Providers",
				data: providerBreakdown,
				columns: createProviderColumns(),
				getFilter: (row) => ({ field: "provider", value: row.name }),
			});
		}

		if (modelBreakdown.length > 0) {
			tabs.push({
				id: "models",
				label: "Models",
				data: modelBreakdown,
				columns: createModelColumns(),
				getFilter: (row) => ({ field: "model", value: row.name }),
			});
		}

		if (finishReasonBreakdown.length > 0) {
			tabs.push({
				id: "finish",
				label: "Finish Reasons",
				data: finishReasonBreakdown,
				columns: createFinishReasonColumns(),
				getFilter: (row) => ({ field: "finish_reason", value: row.name }),
			});
		}

		if (errorBreakdown.length > 0) {
			tabs.push({
				id: "errors",
				label: "Errors",
				data: errorBreakdown,
				columns: createErrorColumns(),
				getFilter: (row) => ({ field: "error_name", value: row.name }),
			});
		}

		return tabs;
	}, [
		providerBreakdown,
		modelBreakdown,
		finishReasonBreakdown,
		errorBreakdown,
	]);

	return (
		<div className="space-y-4 p-4">
			<div className="space-y-1">
				<h1 className="text-balance font-semibold text-foreground text-lg">
					LLM Analytics
				</h1>
				<p className="text-pretty text-muted-foreground text-sm">
					Track LLM usage, cost, performance, and reliability for this website.
				</p>
			</div>

			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
				<StatCard
					icon={RobotIcon}
					isLoading={isLoading}
					title="Total Calls"
					value={formatTokenCount(kpiRow.total_calls)}
				/>
				<StatCard
					icon={CurrencyDollarIcon}
					isLoading={isLoading}
					title="Total Cost"
					value={formatUsd(kpiRow.total_cost)}
				/>
				<StatCard
					icon={LightningIcon}
					isLoading={isLoading}
					title="Total Tokens"
					value={formatTokenCount(kpiRow.total_tokens)}
				/>
				<StatCard
					icon={ChartLineUpIcon}
					isLoading={isLoading}
					title="Avg Latency"
					value={formatDurationMs(kpiRow.avg_duration_ms)}
				/>
				<StatCard
					icon={ChartLineUpIcon}
					isLoading={isLoading}
					title="p75 Latency"
					value={formatDurationMs(kpiRow.p75_duration_ms)}
				/>
				<StatCard
					icon={WarningIcon}
					isLoading={isLoading}
					title="Error Rate"
					value={formatPercent(kpiRow.error_rate)}
				/>
			</div>

			<div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
				<SimpleMetricsChart
					data={callsSeries}
					description="Call volume over time"
					height={220}
					isLoading={isLoading}
					metrics={[
						{
							key: "calls",
							label: "Calls",
							color: "#3b82f6",
							formatValue: (value) => formatTokenCount(value),
						},
					]}
					title="Calls"
				/>
				<SimpleMetricsChart
					data={costSeries}
					description="Total spend over time"
					height={220}
					isLoading={isLoading}
					metrics={[
						{
							key: "cost",
							label: "Cost",
							color: "#f59e0b",
							formatValue: (value) => formatUsd(value),
						},
					]}
					title="Cost"
				/>
			</div>

			<SimpleMetricsChart
				data={latencySeries}
				description="Latency trend"
				height={240}
				isLoading={isLoading}
				metrics={[
					{
						key: "avg",
						label: "Average",
						color: "#10b981",
						formatValue: (value) => formatDurationMs(value),
					},
					{
						key: "p75",
						label: "p75",
						color: "#8b5cf6",
						formatValue: (value) => formatDurationMs(value),
					},
				]}
				title="Latency"
			/>

			{breakdownTabs.length > 0 && (
				<DataTable
					description="Provider, model, finish reason, and error breakdowns"
					isLoading={isLoading}
					onAddFilter={(field, value) =>
						addFilter({ field, operator: "eq", value })
					}
					tabs={breakdownTabs}
					title="Breakdowns"
				/>
			)}
		</div>
	);
}
