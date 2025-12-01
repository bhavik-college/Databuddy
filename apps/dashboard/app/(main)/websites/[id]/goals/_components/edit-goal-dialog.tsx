"use client";

import { filterOptions } from "@databuddy/shared/lists/filters";
import type { GoalFilter } from "@databuddy/shared/types/api";
import { PlusIcon, Target, TrashIcon } from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
	Sheet,
	SheetBody,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { operatorOptions, useFilters } from "@/hooks/use-filters";
import type { AutocompleteData } from "@/hooks/use-funnels";
import type { CreateGoalData, Goal } from "@/hooks/use-goals";
import { AutocompleteInput } from "../../funnels/_components/funnel-components";

const defaultFilter: GoalFilter = {
	field: "browser_name",
	operator: "equals",
	value: "",
} as const;

interface GoalFormData {
	id?: string;
	name: string;
	description: string | null;
	type: string;
	target: string;
	filters: GoalFilter[];
	ignoreHistoricData?: boolean;
}

interface EditGoalDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (data: Goal | Omit<CreateGoalData, "websiteId">) => Promise<void>;
	goal: Goal | null;
	isSaving: boolean;
	autocompleteData?: AutocompleteData;
}

export function EditGoalDialog({
	isOpen,
	onClose,
	onSave,
	goal,
	isSaving,
	autocompleteData,
}: EditGoalDialogProps) {
	const [formData, setFormData] = useState<GoalFormData | null>(null);
	const isCreateMode = !goal;

	useEffect(() => {
		if (goal) {
			setFormData({
				id: goal.id,
				name: goal.name,
				description: goal.description,
				type: goal.type,
				target: goal.target,
				filters: (goal.filters as GoalFilter[]) || [],
				ignoreHistoricData: goal.ignoreHistoricData ?? false,
			});
		} else {
			setFormData({
				name: "",
				description: "",
				type: "PAGE_VIEW",
				target: "",
				filters: [],
				ignoreHistoricData: false,
			});
		}
	}, [goal]);

	const handleSubmit = async () => {
		if (!formData) return;
		await onSave(formData as Goal | Omit<CreateGoalData, "websiteId">);
	};

	const resetForm = useCallback(() => {
		setFormData({
			name: "",
			description: "",
			type: "PAGE_VIEW",
			target: "",
			filters: [],
			ignoreHistoricData: false,
		});
	}, []);

	const updateField = useCallback((field: keyof GoalFormData, value: string) => {
		setFormData((prev) => (prev ? { ...prev, [field]: value } : prev));
	}, []);

	const handleFiltersChange = useCallback((newFilters: GoalFilter[]) => {
		setFormData((prev) => (prev ? { ...prev, filters: newFilters } : prev));
	}, []);

	const { addFilter, removeFilter, updateFilter } = useFilters({
		filters: formData?.filters || [],
		onFiltersChange: handleFiltersChange,
		defaultFilter,
	});

	const getSuggestions = useCallback(
		(field: string): string[] => {
			if (!autocompleteData) return [];

			switch (field) {
				case "browser_name":
					return autocompleteData.browsers || [];
				case "os_name":
					return autocompleteData.operatingSystems || [];
				case "country":
					return autocompleteData.countries || [];
				case "device_type":
					return autocompleteData.deviceTypes || [];
				case "utm_source":
					return autocompleteData.utmSources || [];
				case "utm_medium":
					return autocompleteData.utmMediums || [];
				case "utm_campaign":
					return autocompleteData.utmCampaigns || [];
				default:
					return [];
			}
		},
		[autocompleteData]
	);

	const getTargetSuggestions = useCallback(
		(goalType: string): string[] => {
			if (!autocompleteData) return [];
			if (goalType === "PAGE_VIEW") return autocompleteData.pagePaths || [];
			if (goalType === "EVENT") return autocompleteData.customEvents || [];
			return [];
		},
		[autocompleteData]
	);

	const handleClose = useCallback(() => {
		onClose();
		if (isCreateMode) resetForm();
	}, [onClose, isCreateMode, resetForm]);

	const isFormValid = useMemo(() => {
		if (!formData) return false;
		const hasEmptyFilter = formData.filters.some((f) => !f.value);
		return formData.name && formData.target && !hasEmptyFilter;
	}, [formData]);

	if (!formData) return null;

	return (
		<Sheet onOpenChange={handleClose} open={isOpen}>
			<SheetContent side="right">
				<SheetHeader>
					<div className="flex items-start gap-4">
						<div className="flex size-11 items-center justify-center rounded border bg-background">
							<Target
								className="text-accent-foreground"
								size={22}
								weight="fill"
							/>
						</div>
						<div className="min-w-0 flex-1">
							<SheetTitle className="truncate text-lg">
								{isCreateMode ? "New Goal" : formData.name || "Edit Goal"}
							</SheetTitle>
							<SheetDescription className="text-xs">
								{isCreateMode
									? "Track single-step conversions"
									: "Update goal settings"}
							</SheetDescription>
						</div>
					</div>
				</SheetHeader>

				<SheetBody className="space-y-6">
					{/* Basic Info */}
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="goal-name">Name</Label>
							<Input
								id="goal-name"
								placeholder="e.g., Newsletter Signup"
								value={formData.name}
								onChange={(e) => updateField("name", e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="goal-description">Description</Label>
							<Input
								id="goal-description"
								placeholder="Optional"
								value={formData.description || ""}
								onChange={(e) => updateField("description", e.target.value)}
							/>
						</div>
					</div>

					{/* Goal Target Section */}
					<section className="space-y-3">
						<Label className="text-muted-foreground text-xs">
							Goal Target
						</Label>

						<div className="flex items-center gap-2 rounded border bg-card p-2.5">
							{/* Step number */}
							<div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary text-xs">
								1
							</div>

							{/* Goal fields */}
							<div className="flex flex-1 gap-2">
								<Select
									value={formData.type}
									onValueChange={(value) => updateField("type", value)}
								>
									<SelectTrigger className="h-8 w-28 shrink-0 text-xs">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="PAGE_VIEW">Page View</SelectItem>
										<SelectItem value="EVENT">Event</SelectItem>
									</SelectContent>
								</Select>
								<AutocompleteInput
									className="flex-1"
									inputClassName="h-8 text-xs"
									placeholder={formData.type === "PAGE_VIEW" ? "/path" : "event_name"}
									value={formData.target}
									suggestions={getTargetSuggestions(formData.type)}
									onValueChange={(value) => updateField("target", value)}
								/>
							</div>
						</div>
					</section>

					{/* Settings Section */}
					<section className="space-y-3">
						<Label className="text-muted-foreground text-xs">
							Settings
						</Label>
						<div className="flex items-center justify-between rounded border bg-card p-3">
							<div className="space-y-0.5">
								<Label htmlFor="ignore-historic" className="font-medium text-sm">
									Ignore historic data
								</Label>
								<p className="text-muted-foreground text-xs">
									Only count events after this goal was created
								</p>
							</div>
							<Switch
								id="ignore-historic"
								checked={formData.ignoreHistoricData ?? false}
								onCheckedChange={(checked) =>
									setFormData((prev) =>
										prev ? { ...prev, ignoreHistoricData: checked } : prev
									)
								}
							/>
						</div>
					</section>

					{/* Filters Section */}
					<section className="space-y-3">
						<Label className="text-muted-foreground text-xs">
							Filters (Optional)
						</Label>

						{formData.filters.length > 0 && (
							<div className="space-y-2">
								{formData.filters.map((filter, index) => (
									<div
										key={`filter-${index}`}
										className="flex items-center gap-2 rounded border bg-card p-2.5"
									>
										<Select
											value={filter.field}
											onValueChange={(value) => updateFilter(index, "field", value)}
										>
											<SelectTrigger className="h-8 w-28 text-xs">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{filterOptions.map((option) => (
													<SelectItem key={option.value} value={option.value}>
														{option.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>

										<Select
											value={filter.operator}
											onValueChange={(value) => updateFilter(index, "operator", value)}
										>
											<SelectTrigger className="h-8 w-24 text-xs">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{operatorOptions.map((option) => (
													<SelectItem key={option.value} value={option.value}>
														{option.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>

										<AutocompleteInput
											className="h-10 flex-1"
											inputClassName="text-xs"
											placeholder="Value"
											value={(filter.value as string) || ""}
											suggestions={getSuggestions(filter.field)}
											onValueChange={(value) => updateFilter(index, "value", value)}
										/>

										<Button
											className="size-6 shrink-0 p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
											size="icon"
											variant="ghost"
											onClick={() => removeFilter(index)}
										>
											<TrashIcon size={14} />
										</Button>
									</div>
								))}
							</div>
						)}

						<Button
							className="w-full"
							size="sm"
							variant="outline"
							onClick={() => addFilter()}
						>
							<PlusIcon size={14} />
							Add Filter
						</Button>
					</section>
				</SheetBody>

				<SheetFooter>
					<Button variant="ghost" onClick={handleClose}>
						Cancel
					</Button>
					<Button
						disabled={!isFormValid || isSaving}
						onClick={handleSubmit}
					>
						{isSaving ? (
							<>
								<div className="size-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
								{isCreateMode ? "Creating…" : "Saving…"}
							</>
						) : isCreateMode ? (
							"Create Goal"
						) : (
							"Save Changes"
						)}
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}
