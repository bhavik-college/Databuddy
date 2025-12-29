"use client";

import {
	EnvelopeIcon,
	PlusIcon,
	TrashIcon,
	UserIcon,
	WrenchIcon,
	XIcon,
} from "@phosphor-icons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { UserRule, UserRulesBuilderProps } from "./types";

const TARGET_TYPES = [
	{ value: "user_id", label: "User ID", icon: UserIcon },
	{ value: "email", label: "Email", icon: EnvelopeIcon },
	{ value: "property", label: "Property", icon: WrenchIcon },
] as const;

const CONDITIONS = [
	{ value: "equals", label: "is", needsValue: true },
	{ value: "contains", label: "contains", needsValue: true },
	{ value: "starts_with", label: "starts with", needsValue: true },
	{ value: "ends_with", label: "ends with", needsValue: true },
	{ value: "in", label: "is one of", needsValue: true },
	{ value: "not_in", label: "is not one of", needsValue: true },
	{ value: "exists", label: "exists", needsValue: false },
	{ value: "not_exists", label: "doesn't exist", needsValue: false },
] as const;

function getConditionsForType(type: UserRule["type"]) {
	if (type === "property") {
		return CONDITIONS;
	}
	return CONDITIONS.filter(
		(c) => c.value !== "exists" && c.value !== "not_exists"
	);
}

function getCurrentValues(rule: UserRule): string[] {
	if (rule.values?.length) {
		return rule.values;
	}
	if (rule.batchValues?.length) {
		return rule.batchValues;
	}
	if (rule.value) {
		return [rule.value];
	}
	return [];
}

function InlineTagsInput({
	values,
	onChange,
	placeholder,
}: {
	values: string[];
	onChange: (values: string[]) => void;
	placeholder: string;
}) {
	const [draft, setDraft] = useState("");

	const addValue = (val: string) => {
		const trimmed = val.trim();
		if (!trimmed) {
			return;
		}
		if (values.includes(trimmed)) {
			setDraft("");
			return;
		}
		onChange([...values, trimmed]);
		setDraft("");
	};

	const removeValue = (index: number) => {
		onChange(values.filter((_, i) => i !== index));
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" || e.key === ",") {
			e.preventDefault();
			addValue(draft);
		}
		if (e.key === "Backspace" && draft === "" && values.length > 0) {
			e.preventDefault();
			removeValue(values.length - 1);
		}
	};

	return (
		<div className="flex min-h-[38px] flex-wrap items-center gap-1.5 rounded border bg-background px-2 py-1.5 focus-within:ring-1 focus-within:ring-ring">
			{values.map((val, i) => (
				<span
					className="inline-flex items-center gap-1 rounded bg-secondary px-2 py-0.5 text-sm"
					key={`${val}-${i}`}
				>
					{val}
					<button
						className="cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
						onClick={() => removeValue(i)}
						type="button"
					>
						<XIcon size={12} />
					</button>
				</span>
			))}
			<input
				className="min-w-[120px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
				onChange={(e) => setDraft(e.target.value)}
				onKeyDown={handleKeyDown}
				placeholder={values.length === 0 ? placeholder : "Add more…"}
				type="text"
				value={draft}
			/>
		</div>
	);
}

function RuleRow({
	rule,
	onUpdate,
	onRemove,
}: {
	rule: UserRule;
	onUpdate: (updates: Partial<UserRule>) => void;
	onRemove: () => void;
}) {
	const conditions = getConditionsForType(rule.type);
	const condition = CONDITIONS.find((c) => c.value === rule.operator);
	const needsValue = condition?.needsValue ?? true;
	const currentValues = getCurrentValues(rule);

	const handleTypeChange = (newType: UserRule["type"]) => {
		const updates: Partial<UserRule> = { type: newType };
		if (
			newType !== "property" &&
			(rule.operator === "exists" || rule.operator === "not_exists")
		) {
			updates.operator = "equals";
		}
		onUpdate(updates);
	};

	const placeholderText =
		rule.type === "email"
			? "Enter emails…"
			: rule.type === "user_id"
				? "Enter user IDs…"
				: "Enter values…";

	return (
		<div className="space-y-2 rounded border p-3">
			<div className="flex items-center gap-2">
				<Select
					onValueChange={(v) => handleTypeChange(v as UserRule["type"])}
					value={rule.type}
				>
					<SelectTrigger className="h-8 w-auto gap-1.5 border-0 bg-secondary px-2 text-sm">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{TARGET_TYPES.map((t) => {
							const TypeIcon = t.icon;
							return (
								<SelectItem key={t.value} value={t.value}>
									<div className="flex items-center gap-1.5">
										<TypeIcon size={14} weight="duotone" />
										{t.label}
									</div>
								</SelectItem>
							);
						})}
					</SelectContent>
				</Select>

				{rule.type === "property" && (
					<Input
						className="h-8 w-24 text-sm"
						onChange={(e) => onUpdate({ field: e.target.value })}
						placeholder="field…"
						value={rule.field || ""}
					/>
				)}

				<Select
					onValueChange={(v) =>
						onUpdate({
							operator: v as UserRule["operator"],
							values: currentValues,
						})
					}
					value={rule.operator}
				>
					<SelectTrigger className="h-8 w-auto border-0 bg-transparent px-1.5 text-muted-foreground text-sm">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{conditions.map((c) => (
							<SelectItem key={c.value} value={c.value}>
								{c.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<div className="flex-1" />

				<button
					className={cn(
						"cursor-pointer rounded px-2 py-1 font-medium text-xs transition-colors",
						rule.enabled
							? "bg-green-500/10 text-green-600 hover:bg-green-500/20"
							: "bg-muted text-muted-foreground hover:bg-muted/80"
					)}
					onClick={() => onUpdate({ enabled: !rule.enabled })}
					type="button"
				>
					{rule.enabled ? "On" : "Off"}
				</button>

				<button
					className="cursor-pointer rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
					onClick={onRemove}
					type="button"
				>
					<TrashIcon size={14} />
				</button>
			</div>

			{needsValue && (
				<InlineTagsInput
					onChange={(values) => onUpdate({ values })}
					placeholder={placeholderText}
					values={currentValues}
				/>
			)}
		</div>
	);
}

export function UserRulesBuilder({ rules, onChange }: UserRulesBuilderProps) {
	const addRule = () => {
		onChange([
			...rules,
			{
				type: "user_id",
				operator: "equals",
				values: [],
				batchValues: [],
				enabled: true,
				batch: true,
			},
		]);
	};

	const updateRule = (index: number, updates: Partial<UserRule>) => {
		const newRules = [...rules];
		const syncedUpdates = { ...updates };
		if (syncedUpdates.values !== undefined) {
			syncedUpdates.batchValues = syncedUpdates.values;
		}
		newRules[index] = { ...newRules[index], ...syncedUpdates, batch: true };
		onChange(newRules);
	};

	const removeRule = (index: number) => {
		onChange(rules.filter((_, i) => i !== index));
	};

	if (rules.length === 0) {
		return (
			<div className="py-4 text-center">
				<p className="mb-3 text-muted-foreground text-sm">
					Target specific users, emails, or properties
				</p>
				<Button onClick={addRule} size="sm" type="button" variant="outline">
					<PlusIcon size={14} />
					Add Rule
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-2">
			{rules.map((rule, index) => (
				<RuleRow
					key={index}
					onRemove={() => removeRule(index)}
					onUpdate={(updates) => updateRule(index, updates)}
					rule={rule}
				/>
			))}

			<Button
				className="w-full"
				onClick={addRule}
				size="sm"
				type="button"
				variant="ghost"
			>
				<PlusIcon size={14} />
				Add Rule
			</Button>
		</div>
	);
}
