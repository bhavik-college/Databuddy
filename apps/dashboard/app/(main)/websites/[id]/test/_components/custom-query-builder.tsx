"use client";

import {
	ANALYTICS_TABLES,
	getTableDefinition,
} from "@databuddy/shared/schema/analytics-tables";
import {
	CUSTOM_QUERY_OPERATORS,
	type CustomQueryConfig,
	type CustomQueryFilter,
	type CustomQuerySelect,
} from "@databuddy/shared/types/custom-query";
import { useMemo } from "react";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { AggregatePopover } from "./aggregate-popover";
import { FilterPopover } from "./filter-popover";
import { QueryChip } from "./query-chip";

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
			})),
		[]
	);

	// Get columns for the selected table
	const columns = useMemo(() => {
		if (!value?.table) {
			return [];
		}
		const table = getTableDefinition(value.table);
		return table?.columns || [];
	}, [value?.table]);

	// Handle table change - reset to defaults
	const handleTableChange = (tableName: string) => {
		onChangeAction({
			table: tableName,
			selects: [{ field: "*", aggregate: "count", alias: "Count" }],
			filters: [],
		});
	};

	// Add a new filter
	const addFilter = (filter: CustomQueryFilter) => {
		if (!value) {
			return;
		}
		onChangeAction({
			...value,
			filters: [...(value.filters || []), filter],
		});
	};

	// Remove a filter by index
	const removeFilter = (index: number) => {
		if (!value?.filters) {
			return;
		}
		const newFilters = value.filters.filter((_, i) => i !== index);
		onChangeAction({
			...value,
			filters: newFilters,
		});
	};

	// Add a new select/aggregate
	const addSelect = (select: CustomQuerySelect) => {
		if (!value) {
			return;
		}
		onChangeAction({
			...value,
			selects: [...value.selects, select],
		});
	};

	// Remove a select by index (keep at least 1)
	const removeSelect = (index: number) => {
		if (!value || value.selects.length <= 1) {
			return;
		}
		const newSelects = value.selects.filter((_, i) => i !== index);
		onChangeAction({
			...value,
			selects: newSelects,
		});
	};

	// Format filter for display
	const formatFilter = (filter: CustomQueryFilter) => {
		const col = columns.find((c) => c.name === filter.field);
		const op = CUSTOM_QUERY_OPERATORS.find((o) => o.value === filter.operator);
		const fieldLabel = col?.label || filter.field;
		const opLabel = op?.label || filter.operator;
		const valueStr = Array.isArray(filter.value)
			? filter.value.join(", ")
			: String(filter.value);
		return `${fieldLabel} ${opLabel} ${valueStr}`;
	};

	// Format select for display
	const formatSelect = (select: CustomQuerySelect) => {
		if (select.alias) {
			return select.alias;
		}
		const col = columns.find((c) => c.name === select.field);
		const fieldLabel = select.field === "*" ? "" : col?.label || select.field;
		return `${select.aggregate}(${fieldLabel || ""})`;
	};

	return (
		<div className="space-y-3">
			{/* Row 1: Table */}
			<div className="flex items-center gap-3">
				<Label className="w-20 shrink-0 text-muted-foreground">Table</Label>
				<Select
					disabled={disabled}
					onValueChange={handleTableChange}
					value={value?.table || ""}
				>
					<SelectTrigger className="w-48">
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

			{/* Row 2: Where (filters) */}
			{value?.table && (
				<div className="flex items-start gap-3">
					<Label className="w-20 shrink-0 pt-1.5 text-muted-foreground">
						Where
					</Label>
					<div className="flex flex-wrap items-center gap-2">
						{value.filters?.map((filter, index) => (
							<QueryChip
								key={`${filter.field}-${filter.operator}-${index}`}
								label={formatFilter(filter)}
								onRemoveAction={() => removeFilter(index)}
								disabled={disabled}
							/>
						))}
						<FilterPopover
							columns={columns}
							disabled={disabled}
							onAddAction={addFilter}
						/>
					</div>
				</div>
			)}

			{/* Row 3: Summarize (aggregates) */}
			{value?.table && (
				<div className="flex items-start gap-3">
					<Label className="w-20 shrink-0 pt-1.5 text-muted-foreground">
						Summarize
					</Label>
					<div className="flex flex-wrap items-center gap-2">
						{value.selects.map((select, index) => (
							<QueryChip
								key={`${select.field}-${select.aggregate}-${index}`}
								label={formatSelect(select)}
								onRemoveAction={
									value.selects.length > 1
										? () => removeSelect(index)
										: undefined
								}
								disabled={disabled}
							/>
						))}
						<AggregatePopover
							columns={columns}
							disabled={disabled}
							onAddAction={addSelect}
						/>
					</div>
				</div>
			)}
		</div>
	);
}
