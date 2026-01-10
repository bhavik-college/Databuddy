"use client";

import {
	ANALYTICS_TABLES,
	getTableDefinition,
} from "@databuddy/shared/schema/analytics-tables";
import type { CustomQueryConfig } from "@databuddy/shared/types/custom-query";
import {
	AGGREGATE_FUNCTIONS,
	type AggregateFunction,
} from "@databuddy/shared/types/custom-query";
import { useCallback, useMemo } from "react";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface CustomQueryBuilderProps {
	value: CustomQueryConfig | null;
	onChangeAction: (config: CustomQueryConfig) => void;
	disabled?: boolean;
}

export function CustomQueryBuilder({
	value,
	onChangeAction,
	disabled,
}: CustomQueryBuilderProps) {
	const tables = useMemo(
		() =>
			ANALYTICS_TABLES.map((t) => ({
				name: t.name,
				label: t.label,
				description: t.description,
			})),
		[]
	);

	const columns = useMemo(() => {
		if (!value?.table) {
			return [];
		}
		const table = getTableDefinition(value.table);
		if (!table) {
			return [];
		}
		return table.columns.filter((c) => c.aggregatable || c.type === "string");
	}, [value?.table]);

	const handleTableChange = useCallback(
		(tableName: string) => {
			onChangeAction({
				table: tableName,
				selects: [{ field: "*", aggregate: "count", alias: "Count" }],
			});
		},
		[onChangeAction]
	);

	const handleAggregateChange = useCallback(
		(aggregate: AggregateFunction) => {
			if (!value) {
				return;
			}
			const currentField = value.selects.at(0)?.field || "*";
			// If switching to count, allow * field
			// Otherwise, pick first valid column
			const field =
				aggregate === "count"
					? currentField
					: currentField === "*"
						? columns.at(0)?.name || "*"
						: currentField;

			const alias =
				aggregate === "count"
					? "Count"
					: `${aggregate.charAt(0).toUpperCase()}${aggregate.slice(1)}`;

			onChangeAction({
				...value,
				selects: [{ field, aggregate, alias }],
			});
		},
		[value, columns, onChangeAction]
	);

	const handleFieldChange = useCallback(
		(field: string) => {
			if (!value) {
				return;
			}
			const aggregate = value.selects.at(0)?.aggregate || "count";
			const col = columns.find((c) => c.name === field);
			const alias = field === "*" ? "Count" : col?.label || field;

			onChangeAction({
				...value,
				selects: [{ field, aggregate, alias }],
			});
		},
		[value, columns, onChangeAction]
	);

	const currentAggregate = value?.selects.at(0)?.aggregate || "count";
	const currentField = value?.selects.at(0)?.field || "*";

	// Filter aggregates based on field
	const availableAggregates =
		currentField === "*"
			? AGGREGATE_FUNCTIONS.filter((a) => a.value === "count")
			: AGGREGATE_FUNCTIONS;

	return (
		<div className="space-y-4">
			{/* Table */}
			<div className="space-y-2">
				<Label>From Table</Label>
				<Select
					disabled={disabled}
					onValueChange={handleTableChange}
					value={value?.table || ""}
				>
					<SelectTrigger>
						<SelectValue placeholder="Select a table..." />
					</SelectTrigger>
					<SelectContent>
						{tables.map((table) => (
							<SelectItem key={table.name} value={table.name}>
								<div className="flex items-center gap-2">
									<span>{table.label}</span>
									<span className="text-muted-foreground text-xs">
										— {table.description}
									</span>
								</div>
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{value?.table && (
				<>
					{/* Aggregate + Field in one row */}
					<div className="space-y-2">
						<Label>Calculate</Label>
						<div className="flex gap-2">
							<Select
								disabled={disabled}
								onValueChange={(v) =>
									handleAggregateChange(v as AggregateFunction)
								}
								value={currentAggregate}
							>
								<SelectTrigger className="w-[140px]">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{availableAggregates.map((agg) => (
										<SelectItem key={agg.value} value={agg.value}>
											{agg.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>

							<span className="flex items-center text-muted-foreground text-sm">
								of
							</span>

							<Select
								disabled={disabled}
								onValueChange={handleFieldChange}
								value={currentField}
							>
								<SelectTrigger className="flex-1">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="*">All rows</SelectItem>
									{columns.map((col) => (
										<SelectItem key={col.name} value={col.name}>
											{col.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Preview */}
					<div className="rounded border bg-muted/50 p-3">
						<p className="text-muted-foreground text-xs">Query preview:</p>
						<p className="font-mono text-sm">
							SELECT {currentAggregate.toUpperCase()}(
							{currentField === "*" ? "*" : currentField}) FROM{" "}
							{value.table}
						</p>
					</div>
				</>
			)}
		</div>
	);
}
