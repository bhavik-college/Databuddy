"use client";

import { PlusIcon } from "@phosphor-icons/react";
import type { TableColumn } from "@databuddy/shared/schema/analytics-tables";
import {
	CUSTOM_QUERY_OPERATORS,
	type CustomQueryFilter,
	type CustomQueryOperator,
} from "@databuddy/shared/types/custom-query";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface FilterPopoverProps {
	columns: TableColumn[];
	onAddAction: (filter: CustomQueryFilter) => void;
	disabled?: boolean;
}

export function FilterPopover({
	columns,
	onAddAction,
	disabled,
}: FilterPopoverProps) {
	const [open, setOpen] = useState(false);
	const [field, setField] = useState("");
	const [operator, setOperator] = useState<CustomQueryOperator>("eq");
	const [value, setValue] = useState("");

	// Get filterable columns only
	const filterableColumns = useMemo(
		() => columns.filter((c) => c.filterable),
		[columns]
	);

	// Get the selected column's type
	const selectedColumn = useMemo(
		() => filterableColumns.find((c) => c.name === field),
		[filterableColumns, field]
	);

	// Filter operators based on selected column type
	const availableOperators = useMemo(() => {
		if (!selectedColumn) {
			return CUSTOM_QUERY_OPERATORS;
		}
		return CUSTOM_QUERY_OPERATORS.filter((op) =>
			op.applicableTypes.includes(selectedColumn.type as "string" | "number")
		);
	}, [selectedColumn]);

	const resetForm = () => {
		setField("");
		setOperator("eq");
		setValue("");
	};

	const handleAdd = () => {
		const trimmedValue = value.trim();
		const isValid = field && trimmedValue;
		if (!isValid) {
			return;
		}

		const parsedValue =
			selectedColumn?.type === "number" ? Number(trimmedValue) : trimmedValue;

		onAddAction({
			field,
			operator,
			value: parsedValue,
		});

		resetForm();
		setOpen(false);
	};

	const handleFieldChange = (newField: string) => {
		setField(newField);
		// Reset operator if it's not valid for new field type
		const newColumn = filterableColumns.find((c) => c.name === newField);
		if (newColumn) {
			const validOps = CUSTOM_QUERY_OPERATORS.filter((op) =>
				op.applicableTypes.includes(newColumn.type as "string" | "number")
			);
			if (!validOps.some((op) => op.value === operator)) {
				setOperator(validOps.at(0)?.value || "eq");
			}
		}
	};

	const canAdd = field && value.trim();

	return (
		<Popover onOpenChange={setOpen} open={open}>
			<PopoverTrigger asChild>
				<Button
					className="size-7 p-0"
					disabled={disabled || filterableColumns.length === 0}
					size="icon"
					variant="ghost"
				>
					<PlusIcon className="size-4" />
				</Button>
			</PopoverTrigger>
			<PopoverContent align="start" className="w-80 space-y-3">
				<div className="space-y-2">
					<Select
						disabled={disabled}
						onValueChange={handleFieldChange}
						value={field}
					>
						<SelectTrigger>
							<SelectValue placeholder="Select field..." />
						</SelectTrigger>
						<SelectContent>
							{filterableColumns.map((col) => (
								<SelectItem key={col.name} value={col.name}>
									{col.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{field && (
					<>
						<div className="space-y-2">
							<Select
								disabled={disabled}
								onValueChange={(v) => setOperator(v as CustomQueryOperator)}
								value={operator}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{availableOperators.map((op) => (
										<SelectItem key={op.value} value={op.value}>
											{op.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Input
								disabled={disabled}
								onChange={(e) => setValue(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter" && canAdd) {
										e.preventDefault();
										handleAdd();
									}
								}}
								placeholder="Enter value..."
								type={selectedColumn?.type === "number" ? "number" : "text"}
								value={value}
							/>
						</div>

						<Button
							className="w-full"
							disabled={disabled || !canAdd}
							onClick={handleAdd}
							size="sm"
						>
							Add filter
						</Button>
					</>
				)}
			</PopoverContent>
		</Popover>
	);
}
