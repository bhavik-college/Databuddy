"use client";

import type { DynamicQueryRequest } from "@databuddy/shared/types/api";
import { BugIcon, WarningIcon } from "@phosphor-icons/react";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { StatCard } from "@/components/analytics/stat-card";
import { SimpleMetricsChart } from "@/components/charts/simple-metrics-chart";
import { DataTable, type TabConfig } from "@/components/table/data-table";
import { useDateFilters } from "@/hooks/use-date-filters";
import { useBatchDynamicQuery } from "@/hooks/use-dynamic-query";
import {
	createErrorColumns,
	createHttpStatusColumns,
	createRecentErrorColumns,
	type LlmErrorBreakdownRow,
	type LlmHttpStatusRow,
	type LlmRecentErrorRow,
} from "../_components/llm-columns";
import { formatPercent, formatTokenCount } from "../_lib/llm-analytics-utils";

interface LlmOverviewKpiRow {
	error_count: number;
	error_rate: number;
}

interface LlmErrorRateSeriesRow {
	date: string;
	error_count: number;
	error_rate: number;
}

export default function LlmReliabilityPage() {
	const { id } = useParams();
	const websiteId = id as string;
	const { dateRange } = useDateFilters();

	const queries: DynamicQueryRequest[] = [
		{ id: "llm-kpis", parameters: ["llm_overview_kpis"] },
		{ id: "llm-error-series", parameters: ["llm_error_rate_time_series"] },
		{ id: "llm-errors", parameters: ["llm_error_breakdown"] },
		{ id: "llm-status", parameters: ["llm_http_status_breakdown"] },
		{ id: "llm-recent-errors", parameters: ["llm_recent_errors"] },
	];

	const { isLoading, getDataForQuery } = useBatchDynamicQuery(
		websiteId,
		dateRange,
		queries
	);

	const kpiRow = (
		getDataForQuery("llm-kpis", "llm_overview_kpis") as LlmOverviewKpiRow[]
	)[0] ?? { error_count: 0, error_rate: 0 };

	const errorSeries =
		(getDataForQuery(
			"llm-error-series",
			"llm_error_rate_time_series"
		) as LlmErrorRateSeriesRow[]) ?? [];

	const errorBreakdown =
		(getDataForQuery(
			"llm-errors",
			"llm_error_breakdown"
		) as LlmErrorBreakdownRow[]) ?? [];
	const statusBreakdown =
		(getDataForQuery(
			"llm-status",
			"llm_http_status_breakdown"
		) as LlmHttpStatusRow[]) ?? [];

	const recentErrors =
		(
			getDataForQuery(
				"llm-recent-errors",
				"llm_recent_errors"
			) as LlmRecentErrorRow[]
		)?.map((row) => ({
			...row,
			name: row.error_name,
		})) ?? [];

	const errorChart = useMemo(
		() =>
			errorSeries.map((row) => ({
				date: row.date,
				errors: row.error_count ?? 0,
				rate: row.error_rate ?? 0,
			})),
		[errorSeries]
	);

	const breakdownTabs = useMemo(() => {
		const tabs: TabConfig<LlmErrorBreakdownRow | LlmHttpStatusRow>[] = [];

		if (errorBreakdown.length > 0) {
			tabs.push({
				id: "errors",
				label: "Errors",
				data: errorBreakdown,
				columns: createErrorColumns(),
			});
		}

		if (statusBreakdown.length > 0) {
			tabs.push({
				id: "http-status",
				label: "HTTP Status",
				data: statusBreakdown,
				columns: createHttpStatusColumns(),
			});
		}

		return tabs;
	}, [errorBreakdown, statusBreakdown]);

	return (
		<div className="space-y-4 p-4">
			<div className="space-y-1">
				<h1 className="text-balance font-semibold text-foreground text-lg">
					LLM Reliability
				</h1>
				<p className="text-pretty text-muted-foreground text-sm">
					Watch error rates, failure reasons, and HTTP status patterns.
				</p>
			</div>

			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
				<StatCard
					icon={BugIcon}
					isLoading={isLoading}
					title="Error Count"
					value={formatTokenCount(kpiRow.error_count)}
				/>
				<StatCard
					icon={WarningIcon}
					isLoading={isLoading}
					title="Error Rate"
					value={formatPercent(kpiRow.error_rate)}
				/>
			</div>

			<SimpleMetricsChart
				data={errorChart}
				description="Errors and error rate over time"
				height={240}
				isLoading={isLoading}
				metrics={[
					{
						key: "errors",
						label: "Errors",
						color: "#ef4444",
						formatValue: (value) => formatTokenCount(value),
					},
					{
						key: "rate",
						label: "Error Rate",
						color: "#f59e0b",
						formatValue: (value) => formatPercent(value),
					},
				]}
				title="Error Trends"
			/>

			{breakdownTabs.length > 0 && (
				<DataTable
					description="Breakdowns by error type and HTTP status"
					isLoading={isLoading}
					tabs={breakdownTabs}
					title="Breakdowns"
				/>
			)}

			<DataTable
				columns={createRecentErrorColumns()}
				data={recentErrors}
				description="Latest error instances"
				isLoading={isLoading}
				title="Recent Errors"
			/>
		</div>
	);
}
