"use client";

import {
	ANALYTICS_TABLES,
	getTableDefinition,
} from "@databuddy/shared/schema/analytics-tables";
import type { CustomQueryConfig } from "@databuddy/shared/types/custom-query";
import type { AggregateFunction } from "@databuddy/shared/types/custom-query";
import { useMemo } from "react";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface CustomQueryBuilderProps {
	value: CustomQueryConfig | null;
	onChangeAction: (config: CustomQueryConfig) => void;
	disabled?: boolean;
}

// Aggregate options that return a single value (for stat cards)
const SINGLE_VALUE_AGGREGATES: {
	value: AggregateFunction;
	label: string;
	description: string;
	forTypes: ("string" | "number")[];
}[] = [
	{
		value: "count",
		label: "Count",
		description: "Total number of rows",
		forTypes: ["string", "number"],
	},
	{
		value: "uniq",
		label: "Count Unique",
		description: "Number of distinct values",
		forTypes: ["string"],
	},
	{
		value: "sum",
		label: "Sum",
		description: "Total of all values",
		forTypes: ["number"],
	},
	{
		value: "avg",
		label: "Average",
		description: "Mean of all values",
		forTypes: ["number"],
	},
	{
		value: "max",
		label: "Maximum",
		description: "Highest value",
		forTypes: ["number"],
	},
	{
		value: "min",
		label: "Minimum",
		description: "Lowest value",
		forTypes: ["number"],
	},
];

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
			})),
		[]
	);

	// Get columns grouped by type
	const { stringColumns, numberColumns } = useMemo(() => {
		if (!value?.table) {
			return { stringColumns: [], numberColumns: [] };
		}
		const table = getTableDefinition(value.table);
		if (!table) {
			return { stringColumns: [], numberColumns: [] };
		}
		return {
			stringColumns: table.columns.filter((c) => c.type === "string"),
			numberColumns: table.columns.filter(
				(c) => c.type === "number" && c.aggregatable
			),
		};
	}, [value?.table]);

	// Get available aggregates based on selected field
	const currentField = value?.selects?.at(0)?.field || "*";
	const currentAggregate = value?.selects?.at(0)?.aggregate || "count";

	const availableAggregates = useMemo(() => {
		if (currentField === "*") {
			return SINGLE_VALUE_AGGREGATES.filter((a) => a.value === "count");
		}
		const isNumber = numberColumns.some((c) => c.name === currentField);
		const fieldType = isNumber ? "number" : "string";
		return SINGLE_VALUE_AGGREGATES.filter((a) =>
			a.forTypes.includes(fieldType)
		);
	}, [currentField, numberColumns]);

	const handleTableChange = (tableName: string) => {
		onChangeAction({
			table: tableName,
			selects: [{ field: "*", aggregate: "count", alias: "Count" }],
		});
	};

	const handleFieldChange = (field: string) => {
		if (!value?.table) {
			return;
		}

		// Auto-select best aggregate for field type
		const isNumber = numberColumns.some((c) => c.name === field);
		let aggregate: AggregateFunction = "count";

		if (field === "*") {
			aggregate = "count";
		} else if (isNumber) {
			aggregate = "sum"; // Default to sum for numbers
		} else {
			aggregate = "uniq"; // Default to unique for strings
		}

		const col = [...stringColumns, ...numberColumns].find(
			(c) => c.name === field
		);
		const alias =
			field === "*" ? "Count" : `${aggregate === "uniq" ? "Unique " : ""}${col?.label || field}`;

		onChangeAction({
			...value,
			selects: [{ field, aggregate, alias }],
		});
	};

	const handleAggregateChange = (aggregate: AggregateFunction) => {
		if (!value?.table) {
			return;
		}

		const col = [...stringColumns, ...numberColumns].find(
			(c) => c.name === currentField
		);
		const prefix =
			aggregate === "uniq"
				? "Unique "
				: aggregate === "avg"
					? "Avg "
					: aggregate === "sum"
						? "Total "
						: aggregate === "max"
							? "Max "
							: aggregate === "min"
								? "Min "
								: "";
		const alias =
			currentField === "*" ? "Count" : `${prefix}${col?.label || currentField}`;

		onChangeAction({
			...value,
			selects: [{ field: currentField, aggregate, alias }],
		});
	};

	return (
		<div className="space-y-4">
			{/* Table */}
			<div className="space-y-2">
				<Label>Table</Label>
				<Select
					disabled={disabled}
					onValueChange={handleTableChange}
					value={value?.table || ""}
				>
					<SelectTrigger>
						<SelectValue placeholder="Select table..." />
					</SelectTrigger>
					<SelectContent>
						{tables.map((t) => (
							<SelectItem key={t.name} value={t.name}>
								{t.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{value?.table && (
				<>
					{/* Field */}
					<div className="space-y-2">
						<Label>Field</Label>
						<Select
							disabled={disabled}
							onValueChange={handleFieldChange}
							value={currentField}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="*">All rows</SelectItem>

								{stringColumns.length > 0 && (
									<SelectGroup>
										<SelectLabel>Text fields</SelectLabel>
										{stringColumns.map((col) => (
											<SelectItem key={col.name} value={col.name}>
												{col.label}
											</SelectItem>
										))}
									</SelectGroup>
								)}

								{numberColumns.length > 0 && (
									<SelectGroup>
										<SelectLabel>Numeric fields</SelectLabel>
										{numberColumns.map((col) => (
											<SelectItem key={col.name} value={col.name}>
												{col.label}
											</SelectItem>
										))}
									</SelectGroup>
								)}
							</SelectContent>
						</Select>
					</div>

					{/* Aggregate - only show if not "All rows" or if multiple options */}
					{availableAggregates.length > 1 && (
						<div className="space-y-2">
							<Label>Calculation</Label>
							<Select
								disabled={disabled}
								onValueChange={(v) =>
									handleAggregateChange(v as AggregateFunction)
								}
								value={currentAggregate}
							>
								<SelectTrigger>
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
						</div>
					)}
				</>
			)}
		</div>
	);
}
