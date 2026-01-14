"use client";

import type { DynamicQueryRequest } from "@databuddy/shared/types/api";
import { CurrencyDollarIcon, LightningIcon } from "@phosphor-icons/react";
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
	createModelColumns,
	createProviderColumns,
	type LlmModelBreakdownRow,
	type LlmProviderBreakdownRow,
} from "../_components/llm-columns";
import {
	formatPercent,
	formatTokenCount,
	formatUsd,
	pivotTimeSeries,
} from "../_lib/llm-analytics-utils";

interface LlmOverviewKpiRow {
	total_calls: number;
	total_cost: number;
	total_tokens: number;
	input_tokens: number;
	output_tokens: number;
	cache_hit_rate: number;
}

interface LlmCostSeriesRow {
	date: string;
	provider?: string;
	model?: string;
	total_cost: number;
}

export default function LlmCostPage() {
	const { id } = useParams();
	const websiteId = id as string;
	const { dateRange } = useDateFilters();
	const [, addFilter] = useAtom(addDynamicFilterAtom);

	const queries: DynamicQueryRequest[] = [
		{ id: "llm-kpis", parameters: ["llm_overview_kpis"] },
		{
			id: "llm-cost-provider",
			parameters: ["llm_cost_by_provider_time_series"],
		},
		{ id: "llm-cost-model", parameters: ["llm_cost_by_model_time_series"] },
		{ id: "llm-provider", parameters: ["llm_provider_breakdown"] },
		{ id: "llm-model", parameters: ["llm_model_breakdown"] },
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
		cache_hit_rate: 0,
	};

	const providerSeries =
		(getDataForQuery(
			"llm-cost-provider",
			"llm_cost_by_provider_time_series"
		) as LlmCostSeriesRow[]) ?? [];
	const modelSeries =
		(getDataForQuery(
			"llm-cost-model",
			"llm_cost_by_model_time_series"
		) as LlmCostSeriesRow[]) ?? [];

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

	const providerPivot = useMemo(
		() =>
			pivotTimeSeries(
				providerSeries.map((row) => ({
					date: row.date,
					seriesKey: row.provider ?? "unknown",
					value: row.total_cost ?? 0,
				}))
			),
		[providerSeries]
	);

	const modelPivot = useMemo(
		() =>
			pivotTimeSeries(
				modelSeries.map((row) => ({
					date: row.date,
					seriesKey: row.model ?? "unknown",
					value: row.total_cost ?? 0,
				}))
			),
		[modelSeries]
	);

	const breakdownTabs = useMemo(() => {
		const tabs: TabConfig<LlmProviderBreakdownRow | LlmModelBreakdownRow>[] =
			[];

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

		return tabs;
	}, [providerBreakdown, modelBreakdown]);

	const providerMetrics = providerPivot.seriesKeys.map((key, index) => ({
		key,
		label: key,
		color: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"][index % 5],
		formatValue: (value: number) => formatUsd(value),
	}));

	const modelMetrics = modelPivot.seriesKeys.map((key, index) => ({
		key,
		label: key,
		color: ["#22c55e", "#f97316", "#6366f1", "#ec4899", "#14b8a6"][index % 5],
		formatValue: (value: number) => formatUsd(value),
	}));

	return (
		<div className="space-y-4 p-4">
			<div className="space-y-1">
				<h1 className="text-balance font-semibold text-foreground text-lg">
					LLM Cost and Tokens
				</h1>
				<p className="text-pretty text-muted-foreground text-sm">
					Understand spend drivers and how tokens contribute to overall cost.
				</p>
			</div>

			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
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
					icon={LightningIcon}
					isLoading={isLoading}
					title="Input Tokens"
					value={formatTokenCount(kpiRow.input_tokens)}
				/>
				<StatCard
					icon={LightningIcon}
					isLoading={isLoading}
					title="Output Tokens"
					value={formatTokenCount(kpiRow.output_tokens)}
				/>
				<StatCard
					icon={CurrencyDollarIcon}
					isLoading={isLoading}
					title="Cost per Call"
					value={formatUsd(kpiRow.total_cost / Math.max(kpiRow.total_calls, 1))}
				/>
				<StatCard
					icon={LightningIcon}
					isLoading={isLoading}
					title="Cache Hit Rate"
					value={formatPercent(kpiRow.cache_hit_rate)}
				/>
			</div>

			<div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
				<SimpleMetricsChart
					data={providerPivot.data}
					description="Spend over time by provider"
					height={240}
					isLoading={isLoading}
					metrics={providerMetrics}
					title="Cost by Provider"
				/>
				<SimpleMetricsChart
					data={modelPivot.data}
					description="Spend over time by model"
					height={240}
					isLoading={isLoading}
					metrics={modelMetrics}
					title="Cost by Model"
				/>
			</div>

			{breakdownTabs.length > 0 && (
				<DataTable
					description="Cost and token breakdowns"
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
