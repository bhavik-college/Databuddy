"use client";

import type { ColumnType } from "@databuddy/shared/schema/analytics-tables";
import {
	ANALYTICS_TABLES,
	getTableDefinition,
} from "@databuddy/shared/schema/analytics-tables";
import type {
	AggregateFunction,
	CustomQueryConfig,
	CustomQueryFilter,
	CustomQueryOperator,
	CustomQuerySelect,
} from "@databuddy/shared/types/custom-query";
import {
	AGGREGATE_FUNCTIONS,
	CUSTOM_QUERY_OPERATORS,
	getAggregatesForType,
	getOperatorsForType,
} from "@databuddy/shared/types/custom-query";
import {
	CaretDownIcon,
	CheckIcon,
	PlusIcon,
	TrashIcon,
} from "@phosphor-icons/react";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface ColumnInfo {
	name: string;
	type: ColumnType;
	label: string;
	description?: string;
	aggregatable: boolean;
	filterable: boolean;
}

interface CustomQueryBuilderProps {
	value: CustomQueryConfig | null;
	onChangeAction: (config: CustomQueryConfig | null) => void;
	disabled?: boolean;
}

export function CustomQueryBuilder({
	value,
	onChangeAction,
	disabled,
}: CustomQueryBuilderProps) {
	const [isTableOpen, setIsTableOpen] = useState(false);

	// Static table list from bundle
	const tables = useMemo(
		() =>
			ANALYTICS_TABLES.map((t) => ({
				name: t.name,
				label: t.label,
				description: t.description,
			})),
		[]
	);

	// Static columns for selected table
	const columns: ColumnInfo[] = useMemo(() => {
		if (!value?.table) {
			return [];
		}
		const table = getTableDefinition(value.table);
		if (!table) {
			return [];
		}
		return table.columns.map((c) => ({
			name: c.name,
			type: c.type,
			label: c.label,
			description: c.description,
			aggregatable: c.aggregatable,
			filterable: c.filterable,
		}));
	}, [value?.table]);

	const handleTableSelect = useCallback(
		(tableName: string) => {
			onChangeAction({
				table: tableName,
				selects: [{ field: "*", aggregate: "count", alias: "Total" }],
				filters: [],
			});
			setIsTableOpen(false);
		},
		[onChangeAction]
	);

	const handleAddSelect = useCallback(() => {
		if (!value) {
			return;
		}
		onChangeAction({
			...value,
			selects: [
				...value.selects,
				{ field: "*", aggregate: "count", alias: "" },
			],
		});
	}, [value, onChangeAction]);

	const handleRemoveSelect = useCallback(
		(index: number) => {
			if (!value || value.selects.length <= 1) {
				return;
			}
			onChangeAction({
				...value,
				selects: value.selects.filter((_, i) => i !== index),
			});
		},
		[value, onChangeAction]
	);

	const handleUpdateSelect = useCallback(
		(index: number, updates: Partial<CustomQuerySelect>) => {
			if (!value) {
				return;
			}
			onChangeAction({
				...value,
				selects: value.selects.map((s, i) =>
					i === index ? { ...s, ...updates } : s
				),
			});
		},
		[value, onChangeAction]
	);

	const handleAddFilter = useCallback(() => {
		if (!value) {
			return;
		}
		const firstFilterableColumn = columns.find((c) => c.filterable);
		onChangeAction({
			...value,
			filters: [
				...(value.filters || []),
				{
					field: firstFilterableColumn?.name || "",
					operator: "eq",
					value: "",
				},
			],
		});
	}, [value, onChangeAction, columns]);

	const handleRemoveFilter = useCallback(
		(index: number) => {
			if (!value) {
				return;
			}
			onChangeAction({
				...value,
				filters: (value.filters || []).filter((_, i) => i !== index),
			});
		},
		[value, onChangeAction]
	);

	const handleUpdateFilter = useCallback(
		(index: number, updates: Partial<CustomQueryFilter>) => {
			if (!value) {
				return;
			}
			onChangeAction({
				...value,
				filters: (value.filters || []).map((f, i) =>
					i === index ? { ...f, ...updates } : f
				),
			});
		},
		[value, onChangeAction]
	);

	const filterableColumns = columns.filter((c) => c.filterable);
	const aggregatableColumns = columns.filter(
		(c) => c.aggregatable || c.type === "string"
	);

	return (
		<div className="space-y-4">
			{/* Table Selection */}
			<div className="space-y-2">
				<Label>Table</Label>
				<Popover onOpenChange={setIsTableOpen} open={isTableOpen}>
					<PopoverTrigger asChild>
						<Button
							className="w-full justify-between"
							disabled={disabled}
							role="combobox"
							variant="outline"
						>
							{value?.table
								? tables.find((t) => t.name === value.table)?.label ||
									value.table
								: "Select a table..."}
							<CaretDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
						</Button>
					</PopoverTrigger>
					<PopoverContent align="start" className="w-[300px] p-0">
						<Command>
							<CommandInput placeholder="Search tables..." />
							<CommandList>
								<CommandEmpty>No tables found.</CommandEmpty>
								<CommandGroup>
									{tables.map((table) => (
										<CommandItem
											key={table.name}
											onSelect={() => handleTableSelect(table.name)}
											value={table.name}
										>
											<CheckIcon
												className={cn(
													"mr-2 size-4",
													value?.table === table.name
														? "opacity-100"
														: "opacity-0"
												)}
											/>
											<div className="flex flex-col">
												<span>{table.label}</span>
												<span className="text-muted-foreground text-xs">
													{table.description}
												</span>
											</div>
										</CommandItem>
									))}
								</CommandGroup>
							</CommandList>
						</Command>
					</PopoverContent>
				</Popover>
			</div>

			{value?.table && (
				<>
					{/* Select Expressions */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label>Select</Label>
							<Button
								disabled={disabled || value.selects.length >= 10}
								onClick={handleAddSelect}
								size="sm"
								type="button"
								variant="ghost"
							>
								<PlusIcon className="mr-1 size-3" />
								Add
							</Button>
						</div>
						<div className="space-y-2">
							{value.selects.map((select, index) => (
								<SelectRow
									aggregatableColumns={aggregatableColumns}
									columns={columns}
									disabled={disabled}
									key={index}
									onRemoveAction={
										value.selects.length > 1
											? () => handleRemoveSelect(index)
											: undefined
									}
									onUpdateAction={(updates) =>
										handleUpdateSelect(index, updates)
									}
									select={select}
								/>
							))}
						</div>
					</div>

					{/* Filters */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label>Where</Label>
							<Button
								disabled={
									disabled ||
									(value.filters?.length || 0) >= 20 ||
									filterableColumns.length === 0
								}
								onClick={handleAddFilter}
								size="sm"
								type="button"
								variant="ghost"
							>
								<PlusIcon className="mr-1 size-3" />
								Add Filter
							</Button>
						</div>
						{value.filters && value.filters.length > 0 ? (
							<div className="space-y-2">
								{value.filters.map((filter, index) => (
									<FilterRow
										columns={filterableColumns}
										disabled={disabled}
										filter={filter}
										key={index}
										onRemoveAction={() => handleRemoveFilter(index)}
										onUpdateAction={(updates) =>
											handleUpdateFilter(index, updates)
										}
									/>
								))}
							</div>
						) : (
							<p className="text-muted-foreground text-sm">
								No filters applied
							</p>
						)}
					</div>
				</>
			)}
		</div>
	);
}

interface SelectRowProps {
	select: CustomQuerySelect;
	columns: ColumnInfo[];
	aggregatableColumns: ColumnInfo[];
	onUpdateAction: (updates: Partial<CustomQuerySelect>) => void;
	onRemoveAction?: () => void;
	disabled?: boolean;
}

function SelectRow({
	select,
	columns,
	aggregatableColumns,
	onUpdateAction,
	onRemoveAction,
	disabled,
}: SelectRowProps) {
	const selectedColumn = columns.find((c) => c.name === select.field);
	const applicableAggregates =
		select.field === "*"
			? AGGREGATE_FUNCTIONS.filter((a) => a.value === "count")
			: selectedColumn
				? getAggregatesForType(selectedColumn.type)
				: AGGREGATE_FUNCTIONS;

	return (
		<div className="flex items-center gap-2">
			<Select
				disabled={disabled}
				onValueChange={(v) =>
					onUpdateAction({ aggregate: v as AggregateFunction })
				}
				value={select.aggregate}
			>
				<SelectTrigger className="w-[120px]">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{applicableAggregates.map((agg) => (
						<SelectItem key={agg.value} value={agg.value}>
							{agg.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<Select
				disabled={disabled}
				onValueChange={(v) => onUpdateAction({ field: v })}
				value={select.field}
			>
				<SelectTrigger className="flex-1">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="*">All rows (*)</SelectItem>
					{aggregatableColumns.map((col) => (
						<SelectItem key={col.name} value={col.name}>
							{col.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<Input
				className="w-[100px]"
				disabled={disabled}
				onChange={(e) => onUpdateAction({ alias: e.target.value })}
				placeholder="Alias"
				value={select.alias || ""}
			/>

			{onRemoveAction && (
				<Button
					disabled={disabled}
					onClick={onRemoveAction}
					size="icon"
					type="button"
					variant="ghost"
				>
					<TrashIcon className="size-4 text-muted-foreground" />
				</Button>
			)}
		</div>
	);
}

interface FilterRowProps {
	filter: CustomQueryFilter;
	columns: ColumnInfo[];
	onUpdateAction: (updates: Partial<CustomQueryFilter>) => void;
	onRemoveAction: () => void;
	disabled?: boolean;
}

function FilterRow({
	filter,
	columns,
	onUpdateAction,
	onRemoveAction,
	disabled,
}: FilterRowProps) {
	const selectedColumn = columns.find((c) => c.name === filter.field);
	const applicableOperators = selectedColumn
		? getOperatorsForType(selectedColumn.type)
		: CUSTOM_QUERY_OPERATORS;

	return (
		<div className="flex items-center gap-2">
			<Select
				disabled={disabled}
				onValueChange={(v) => onUpdateAction({ field: v })}
				value={filter.field}
			>
				<SelectTrigger className="w-[140px]">
					<SelectValue placeholder="Field" />
				</SelectTrigger>
				<SelectContent>
					{columns.map((col) => (
						<SelectItem key={col.name} value={col.name}>
							{col.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<Select
				disabled={disabled}
				onValueChange={(v) =>
					onUpdateAction({ operator: v as CustomQueryOperator })
				}
				value={filter.operator}
			>
				<SelectTrigger className="w-[140px]">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{applicableOperators.map((op) => (
						<SelectItem key={op.value} value={op.value}>
							{op.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<Input
				className="flex-1"
				disabled={disabled}
				onChange={(e) => onUpdateAction({ value: e.target.value })}
				placeholder="Value"
				value={String(filter.value)}
			/>

			<Button
				disabled={disabled}
				onClick={onRemoveAction}
				size="icon"
				type="button"
				variant="ghost"
			>
				<TrashIcon className="size-4 text-muted-foreground" />
			</Button>
		</div>
	);
}
