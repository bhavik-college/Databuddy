"use client";

import type { DynamicQueryRequest } from "@databuddy/shared/types/api";
import { LightningIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { StatCard } from "@/components/analytics/stat-card";
import { SimpleMetricsChart } from "@/components/charts/simple-metrics-chart";
import { DataTable } from "@/components/table/data-table";
import { useDateFilters } from "@/hooks/use-date-filters";
import { useBatchDynamicQuery } from "@/hooks/use-dynamic-query";
import {
	createRecentCallColumns,
	createToolNameColumns,
	type LlmRecentCallRow,
	type LlmToolNameRow,
} from "../_components/llm-columns";
import { formatPercent } from "../_lib/llm-analytics-utils";

interface LlmOverviewKpiRow {
	tool_use_rate: number;
	web_search_rate: number;
}

interface LlmToolUseSeriesRow {
	date: string;
	tool_use_rate: number;
	avg_tool_calls: number;
	avg_tool_results: number;
}

export default function LlmToolingPage() {
	const { id } = useParams();
	const websiteId = id as string;
	const { dateRange } = useDateFilters();

	const queries: DynamicQueryRequest[] = [
		{ id: "llm-kpis", parameters: ["llm_overview_kpis"] },
		{ id: "llm-tool-series", parameters: ["llm_tool_use_time_series"] },
		{ id: "llm-tool-names", parameters: ["llm_tool_name_breakdown"] },
		{ id: "llm-recent-calls", parameters: ["llm_recent_calls"] },
	];

	const { isLoading, getDataForQuery } = useBatchDynamicQuery(
		websiteId,
		dateRange,
		queries
	);

	const kpiRow = (
		getDataForQuery("llm-kpis", "llm_overview_kpis") as LlmOverviewKpiRow[]
	)[0] ?? { tool_use_rate: 0, web_search_rate: 0 };

	const toolSeries =
		(getDataForQuery(
			"llm-tool-series",
			"llm_tool_use_time_series"
		) as LlmToolUseSeriesRow[]) ?? [];

	const toolNames =
		(getDataForQuery(
			"llm-tool-names",
			"llm_tool_name_breakdown"
		) as LlmToolNameRow[]) ?? [];

	const recentCalls =
		(
			getDataForQuery(
				"llm-recent-calls",
				"llm_recent_calls"
			) as LlmRecentCallRow[]
		)?.map((row) => ({
			...row,
			name: row.trace_id ?? row.model,
		})) ?? [];

	const toolSeriesChart = useMemo(
		() =>
			toolSeries.map((row) => ({
				date: row.date,
				rate: row.tool_use_rate ?? 0,
				calls: row.avg_tool_calls ?? 0,
			})),
		[toolSeries]
	);

	return (
		<div className="space-y-4 p-4">
			<div className="space-y-1">
				<h1 className="text-balance font-semibold text-foreground text-lg">
					LLM Tooling
				</h1>
				<p className="text-pretty text-muted-foreground text-sm">
					Track how often tools and web search are used in calls.
				</p>
			</div>

			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
				<StatCard
					icon={LightningIcon}
					isLoading={isLoading}
					title="Tool Use Rate"
					value={formatPercent(kpiRow.tool_use_rate)}
				/>
				<StatCard
					icon={MagnifyingGlassIcon}
					isLoading={isLoading}
					title="Web Search Rate"
					value={formatPercent(kpiRow.web_search_rate)}
				/>
			</div>

			<SimpleMetricsChart
				data={toolSeriesChart}
				description="Tool usage rate and average tool calls"
				height={240}
				isLoading={isLoading}
				metrics={[
					{
						key: "rate",
						label: "Tool Use Rate",
						color: "#3b82f6",
						formatValue: (value) => formatPercent(value),
					},
					{
						key: "calls",
						label: "Avg Tool Calls",
						color: "#10b981",
						formatValue: (value) => value.toFixed(2),
					},
				]}
				title="Tool Usage"
			/>

			<DataTable
				columns={createToolNameColumns()}
				data={toolNames}
				description="Top tools used across calls"
				isLoading={isLoading}
				title="Tool Names"
			/>

			<DataTable
				columns={createRecentCallColumns()}
				data={recentCalls}
				description="Recent calls with tool usage"
				isLoading={isLoading}
				title="Recent Calls"
			/>
		</div>
	);
}
