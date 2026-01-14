"use client";

import type { DynamicQueryRequest } from "@databuddy/shared/types/api";
import { RoadHorizonIcon, UsersThreeIcon } from "@phosphor-icons/react";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { StatCard } from "@/components/analytics/stat-card";
import { DataTable } from "@/components/table/data-table";
import { useDateFilters } from "@/hooks/use-date-filters";
import { useBatchDynamicQuery } from "@/hooks/use-dynamic-query";
import {
	createRecentCallColumns,
	createTraceColumns,
	type LlmRecentCallRow,
	type LlmTraceSummaryRow,
} from "../_components/llm-columns";
import { formatTokenCount } from "../_lib/llm-analytics-utils";

export default function LlmTracesPage() {
	const { id } = useParams();
	const websiteId = id as string;
	const { dateRange } = useDateFilters();

	const queries: DynamicQueryRequest[] = [
		{ id: "llm-traces", parameters: ["llm_trace_summary"] },
		{ id: "llm-recent-calls", parameters: ["llm_recent_calls"] },
	];

	const { isLoading, getDataForQuery } = useBatchDynamicQuery(
		websiteId,
		dateRange,
		queries
	);

	const traceSummary =
		(getDataForQuery(
			"llm-traces",
			"llm_trace_summary"
		) as LlmTraceSummaryRow[]) ?? [];

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

	const { totalTraces, uniqueUsers, avgCallsPerTrace } = useMemo(() => {
		if (traceSummary.length === 0) {
			return { totalTraces: 0, uniqueUsers: 0, avgCallsPerTrace: 0 };
		}

		const uniqueUserIds = new Set(traceSummary.map((row) => row.user_id));
		const totalCalls = traceSummary.reduce((sum, row) => sum + row.calls, 0);
		const traces = traceSummary.length;

		return {
			totalTraces: traces,
			uniqueUsers: uniqueUserIds.size,
			avgCallsPerTrace: totalCalls / Math.max(traces, 1),
		};
	}, [traceSummary]);

	const traceRows = useMemo(
		() =>
			traceSummary.map((row) => ({
				...row,
				name: row.trace_id,
			})),
		[traceSummary]
	);

	return (
		<div className="space-y-4 p-4">
			<div className="space-y-1">
				<h1 className="text-balance font-semibold text-foreground text-lg">
					LLM Traces
				</h1>
				<p className="text-pretty text-muted-foreground text-sm">
					Analyze multi-call traces and recent sequences.
				</p>
			</div>

			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
				<StatCard
					icon={RoadHorizonIcon}
					isLoading={isLoading}
					title="Total Traces"
					value={formatTokenCount(totalTraces)}
				/>
				<StatCard
					icon={UsersThreeIcon}
					isLoading={isLoading}
					title="Unique Users"
					value={formatTokenCount(uniqueUsers)}
				/>
				<StatCard
					icon={RoadHorizonIcon}
					isLoading={isLoading}
					title="Calls per Trace"
					value={avgCallsPerTrace.toFixed(1)}
				/>
			</div>

			<DataTable
				columns={createTraceColumns()}
				data={traceRows}
				description="Trace-level aggregates"
				isLoading={isLoading}
				title="Trace Summary"
			/>

			<DataTable
				columns={createRecentCallColumns()}
				data={recentCalls}
				description="Recent calls across traces"
				isLoading={isLoading}
				title="Recent Calls"
			/>
		</div>
	);
}
