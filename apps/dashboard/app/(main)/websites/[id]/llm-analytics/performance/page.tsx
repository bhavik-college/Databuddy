"use client";

import type { DynamicQueryRequest } from "@databuddy/shared/types/api";
import { ChartLineUpIcon } from "@phosphor-icons/react";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { StatCard } from "@/components/analytics/stat-card";
import { SimpleMetricsChart } from "@/components/charts/simple-metrics-chart";
import { DataTable, type TabConfig } from "@/components/table/data-table";
import { useDateFilters } from "@/hooks/use-date-filters";
import { useBatchDynamicQuery } from "@/hooks/use-dynamic-query";
import {
	createLatencyColumns,
	createSlowCallColumns,
	type LlmLatencyBreakdownRow,
	type LlmSlowCallRow,
} from "../_components/llm-columns";
import { formatDurationMs } from "../_lib/llm-analytics-utils";

interface LlmOverviewKpiRow {
	avg_duration_ms: number;
	p75_duration_ms: number;
}

interface LlmLatencySeriesRow {
	date: string;
	avg_duration_ms: number;
	p75_duration_ms: number;
	p95_duration_ms: number;
}

const getLatestLatency = (rows: LlmLatencySeriesRow[]) => {
	if (rows.length === 0) {
		return { p95: 0 };
	}
	const latest = rows[rows.length - 1];
	return { p95: latest?.p95_duration_ms ?? 0 };
};

export default function LlmPerformancePage() {
	const { id } = useParams();
	const websiteId = id as string;
	const { dateRange } = useDateFilters();

	const queries: DynamicQueryRequest[] = [
		{ id: "llm-kpis", parameters: ["llm_overview_kpis"] },
		{ id: "llm-latency-series", parameters: ["llm_latency_time_series"] },
		{ id: "llm-latency-model", parameters: ["llm_latency_by_model"] },
		{ id: "llm-latency-provider", parameters: ["llm_latency_by_provider"] },
		{ id: "llm-slowest", parameters: ["llm_slowest_calls"] },
	];

	const { isLoading, getDataForQuery } = useBatchDynamicQuery(
		websiteId,
		dateRange,
		queries
	);

	const kpiRow = (
		getDataForQuery("llm-kpis", "llm_overview_kpis") as LlmOverviewKpiRow[]
	)[0] ?? { avg_duration_ms: 0, p75_duration_ms: 0 };

	const latencySeries =
		(getDataForQuery(
			"llm-latency-series",
			"llm_latency_time_series"
		) as LlmLatencySeriesRow[]) ?? [];

	const latencyByModel =
		(getDataForQuery(
			"llm-latency-model",
			"llm_latency_by_model"
		) as LlmLatencyBreakdownRow[]) ?? [];
	const latencyByProvider =
		(getDataForQuery(
			"llm-latency-provider",
			"llm_latency_by_provider"
		) as LlmLatencyBreakdownRow[]) ?? [];
	const slowCalls =
		(
			getDataForQuery("llm-slowest", "llm_slowest_calls") as LlmSlowCallRow[]
		)?.map((row) => ({
			...row,
			name: row.trace_id ?? row.model,
		})) ?? [];

	const latestLatency = useMemo(
		() => getLatestLatency(latencySeries),
		[latencySeries]
	);

	const latencyChartData = useMemo(
		() =>
			latencySeries.map((row) => ({
				date: row.date,
				avg: row.avg_duration_ms ?? 0,
				p75: row.p75_duration_ms ?? 0,
				p95: row.p95_duration_ms ?? 0,
			})),
		[latencySeries]
	);

	const breakdownTabs = useMemo(() => {
		const tabs: TabConfig<LlmLatencyBreakdownRow>[] = [];

		if (latencyByModel.length > 0) {
			tabs.push({
				id: "models",
				label: "Models",
				data: latencyByModel,
				columns: createLatencyColumns(),
			});
		}

		if (latencyByProvider.length > 0) {
			tabs.push({
				id: "providers",
				label: "Providers",
				data: latencyByProvider,
				columns: createLatencyColumns(),
			});
		}

		return tabs;
	}, [latencyByModel, latencyByProvider]);

	return (
		<div className="space-y-4 p-4">
			<div className="space-y-1">
				<h1 className="text-balance font-semibold text-foreground text-lg">
					LLM Performance
				</h1>
				<p className="text-pretty text-muted-foreground text-sm">
					Monitor latency trends and identify slow calls.
				</p>
			</div>

			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
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
					icon={ChartLineUpIcon}
					isLoading={isLoading}
					title="p95 Latency"
					value={formatDurationMs(latestLatency.p95)}
				/>
			</div>

			<SimpleMetricsChart
				data={latencyChartData}
				description="Latency percentiles over time"
				height={260}
				isLoading={isLoading}
				metrics={[
					{
						key: "avg",
						label: "Average",
						color: "#22c55e",
						formatValue: (value) => formatDurationMs(value),
					},
					{
						key: "p75",
						label: "p75",
						color: "#3b82f6",
						formatValue: (value) => formatDurationMs(value),
					},
					{
						key: "p95",
						label: "p95",
						color: "#f97316",
						formatValue: (value) => formatDurationMs(value),
					},
				]}
				title="Latency Trends"
			/>

			{breakdownTabs.length > 0 && (
				<DataTable
					description="Latency breakdowns by model and provider"
					isLoading={isLoading}
					tabs={breakdownTabs}
					title="Latency Breakdown"
				/>
			)}

			<DataTable
				columns={createSlowCallColumns()}
				data={slowCalls}
				description="Slowest calls in the selected time range"
				isLoading={isLoading}
				title="Slow Calls"
			/>
		</div>
	);
}
