"use client";

import { filterOptions } from "@databuddy/shared/lists/filters";
import {
	DragDropContext,
	Draggable,
	Droppable,
	type DropResult,
} from "@hello-pangea/dnd";
import {
	DotsNineIcon,
	FunnelIcon,
	PlusIcon,
	TrashIcon,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
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
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { operatorOptions, useFilters } from "@/hooks/use-filters";
import type {
	AutocompleteData,
	CreateFunnelData,
	Funnel,
	FunnelFilter,
	FunnelStep,
} from "@/hooks/use-funnels";
import { cn } from "@/lib/utils";
import { AutocompleteInput } from "./funnel-components";

const defaultFilter: FunnelFilter = {
	field: "browser_name",
	operator: "equals",
	value: "",
} as const;

interface EditFunnelDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (funnel: Funnel) => Promise<void>;
	onCreate?: (data: CreateFunnelData) => Promise<void>;
	funnel: Funnel | null;
	isUpdating: boolean;
	isCreating?: boolean;
	autocompleteData?: AutocompleteData;
}

export function EditFunnelDialog({
	isOpen,
	onClose,
	onSubmit,
	onCreate,
	funnel,
	isUpdating,
	isCreating = false,
	autocompleteData,
}: EditFunnelDialogProps) {
	const [formData, setFormData] = useState<Funnel | null>(null);
	const isCreateMode = !funnel;

	useEffect(() => {
		if (funnel) {
			setFormData({
				...funnel,
				filters: funnel.filters || [],
			});
		} else {
			setFormData({
				id: "",
				name: "",
				description: "",
				steps: [
					{ type: "PAGE_VIEW" as const, target: "/", name: "Landing Page" },
					{ type: "PAGE_VIEW" as const, target: "/signup", name: "Sign Up Page" },
				],
				filters: [],
				isActive: true,
				createdAt: "",
				updatedAt: "",
			});
		}
	}, [funnel]);

	const handleSubmit = async () => {
		if (!formData) return;

		if (isCreateMode && onCreate) {
			const createData: CreateFunnelData = {
				name: formData.name,
				description: formData.description || undefined,
				steps: formData.steps,
				filters: formData.filters || [],
			};
			await onCreate(createData);
			resetForm();
		} else {
			await onSubmit(formData);
		}
	};

	const resetForm = useCallback(() => {
		if (isCreateMode) {
			setFormData({
				id: "",
				name: "",
				description: "",
				steps: [
					{ type: "PAGE_VIEW" as const, target: "/", name: "Landing Page" },
					{ type: "PAGE_VIEW" as const, target: "/signup", name: "Sign Up Page" },
				],
				filters: [],
				isActive: true,
				createdAt: "",
				updatedAt: "",
			});
		}
	}, [isCreateMode]);

	const addStep = useCallback(() => {
		if (!formData) return;
		setFormData((prev) =>
			prev
				? {
						...prev,
						steps: [...prev.steps, { type: "PAGE_VIEW" as const, target: "", name: "" }],
					}
				: prev
		);
	}, [formData]);

	const removeStep = useCallback(
		(index: number) => {
			if (!formData || formData.steps.length <= 2) return;
			setFormData((prev) =>
				prev ? { ...prev, steps: prev.steps.filter((_, i) => i !== index) } : prev
			);
		},
		[formData]
	);

	const updateStep = useCallback(
		(index: number, field: keyof FunnelStep, value: string) => {
			if (!formData) return;
			setFormData((prev) =>
				prev
					? {
							...prev,
							steps: prev.steps.map((step, i) =>
								i === index ? { ...step, [field]: value } : step
							),
						}
					: prev
			);
		},
		[formData]
	);

	const reorderSteps = useCallback(
		(result: DropResult) => {
			if (!(result.destination && formData)) return;

			const sourceIndex = result.source.index;
			const destinationIndex = result.destination.index;

			if (sourceIndex === destinationIndex) return;

			const items = [...formData.steps];
			const [reorderedItem] = items.splice(sourceIndex, 1);
			items.splice(destinationIndex, 0, reorderedItem);

			setFormData((prev) => (prev ? { ...prev, steps: items } : prev));
		},
		[formData]
	);

	const handleFiltersChange = useCallback((newFilters: FunnelFilter[]) => {
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

	const getStepSuggestions = useCallback(
		(stepType: string): string[] => {
			if (!autocompleteData) return [];

			if (stepType === "PAGE_VIEW") return autocompleteData.pagePaths || [];
			if (stepType === "EVENT") return autocompleteData.customEvents || [];

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
		return (
			formData.name &&
			!formData.steps.some((s) => !(s.name && s.target)) &&
			!(formData.filters || []).some((f) => !f.value || f.value === "")
		);
	}, [formData]);

	if (!formData) return null;

	return (
		<Sheet onOpenChange={handleClose} open={isOpen}>
			<SheetContent
				className="m-3 h-[calc(100%-1.5rem)] rounded border p-0 sm:max-w-lg"
				side="right"
			>
				<div className="flex h-full flex-col">
					{/* Header */}
					<SheetHeader className="shrink-0 border-b bg-secondary p-5">
						<div className="flex items-start gap-4">
							<div className="flex size-11 items-center justify-center rounded border bg-background">
								<FunnelIcon className="text-accent-foreground" size={22} weight="fill" />
							</div>
							<div className="min-w-0 flex-1">
								<SheetTitle className="truncate text-lg">
									{isCreateMode ? "New Funnel" : formData.name || "Edit Funnel"}
								</SheetTitle>
								<SheetDescription className="text-xs">
									{isCreateMode
										? "Track user conversion journeys"
										: `${formData.steps.length} steps configured`}
								</SheetDescription>
							</div>
							<Badge variant="secondary">
								{formData.steps.length} steps
							</Badge>
						</div>
					</SheetHeader>

					{/* Content */}
					<div className="flex-1 space-y-6 overflow-y-auto p-5">
						{/* Basic Info */}
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="funnel-name">Name</Label>
								<Input
									id="funnel-name"
									placeholder="e.g., Sign Up Flow"
									value={formData.name}
									onChange={(e) =>
										setFormData((prev) =>
											prev ? { ...prev, name: e.target.value } : prev
										)
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="funnel-description">Description</Label>
								<Input
									id="funnel-description"
									placeholder="Optional"
									value={formData.description || ""}
									onChange={(e) =>
										setFormData((prev) =>
											prev ? { ...prev, description: e.target.value } : prev
										)
									}
								/>
							</div>
						</div>

						{/* Steps Section */}
						<section className="space-y-3">
							<div className="flex items-center justify-between">
								<Label className="text-muted-foreground text-xs">
									Funnel Steps
								</Label>
								<span className="text-muted-foreground text-xs">
									Drag to reorder
								</span>
							</div>

							<DragDropContext onDragEnd={reorderSteps}>
								<Droppable droppableId="funnel-steps">
									{(provided, snapshot) => (
										<div
											{...provided.droppableProps}
											ref={provided.innerRef}
											className={cn(
												"space-y-2",
												snapshot.isDraggingOver && "rounded bg-accent/50 p-2"
											)}
										>
											{formData.steps.map((step, index) => (
												<Draggable
													draggableId={`step-${index}`}
													index={index}
													key={`step-${index}`}
												>
													{(provided, snapshot) => (
														<div
															ref={provided.innerRef}
															{...provided.draggableProps}
															className={cn(
																"flex items-center gap-2 rounded border bg-card p-2.5 transition-all",
																snapshot.isDragging &&
																	"border-primary shadow-lg ring-2 ring-primary/20"
															)}
														>
															{/* Drag handle */}
															<div
																{...provided.dragHandleProps}
																className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
															>
																<DotsNineIcon size={16} />
															</div>

															{/* Step number */}
															<div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary text-xs">
																{index + 1}
															</div>

															{/* Step fields */}
															<div className="grid flex-1 grid-cols-3 gap-2">
																<Select
																	value={step.type}
																	onValueChange={(value) =>
																		updateStep(index, "type", value)
																	}
																>
																	<SelectTrigger className="h-8 text-xs">
																		<SelectValue />
																	</SelectTrigger>
																	<SelectContent>
																		<SelectItem value="PAGE_VIEW">
																			Page View
																		</SelectItem>
																		<SelectItem value="EVENT">Event</SelectItem>
																	</SelectContent>
																</Select>
																<AutocompleteInput
																	className="h-8 text-xs"
																	placeholder={
																		step.type === "PAGE_VIEW"
																			? "/path"
																			: "event_name"
																	}
																	value={step.target || ""}
																	suggestions={getStepSuggestions(step.type)}
																	onValueChange={(value) =>
																		updateStep(index, "target", value)
																	}
																/>
																<Input
																	className="h-8 text-xs"
																	placeholder="Step name"
																	value={step.name}
																	onChange={(e) =>
																		updateStep(index, "name", e.target.value)
																	}
																/>
															</div>

															{/* Remove button */}
															{formData.steps.length > 2 && (
																<Button
																	className="size-6 shrink-0 p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
																	size="icon"
																	variant="ghost"
																	onClick={() => removeStep(index)}
																>
																	<TrashIcon size={14} />
																</Button>
															)}
														</div>
													)}
												</Draggable>
											))}
											{provided.placeholder}
										</div>
									)}
								</Droppable>
							</DragDropContext>

							<Button
								className="w-full border text-accent-foreground hover:bg-accent hover:text-accent-foreground"
								size="sm"
								variant="outline"
								disabled={formData.steps.length >= 10}
								onClick={addStep}
							>
								<PlusIcon size={14} />
								Add Step
							</Button>
						</section>

						{/* Filters Section */}
						<section className="space-y-3">
							<Label className="text-muted-foreground text-xs">
								Filters (Optional)
							</Label>

							{formData.filters && formData.filters.length > 0 && (
								<div className="space-y-2">
									{formData.filters.map((filter, index) => (
										<div
											key={`filter-${index}`}
											className="flex items-center gap-2 rounded border bg-card p-2.5"
										>
											<Select
												value={filter.field}
												onValueChange={(value) =>
													updateFilter(index, "field", value)
												}
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
												onValueChange={(value) =>
													updateFilter(index, "operator", value)
												}
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
												className="h-8 flex-1 text-xs"
												placeholder="Value"
												value={(filter.value as string) || ""}
												suggestions={getSuggestions(filter.field)}
												onValueChange={(value) =>
													updateFilter(index, "value", value)
												}
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
					</div>

					{/* Footer */}
					<div className="angled-rectangle-gradient flex shrink-0 items-center justify-end gap-3 border-t bg-secondary px-5 py-4">
						<Button variant="ghost" onClick={handleClose}>
							Cancel
						</Button>
						<Button
							disabled={!isFormValid || (isCreateMode ? isCreating : isUpdating)}
							onClick={handleSubmit}
						>
							{(isCreateMode ? isCreating : isUpdating) ? (
								<>
									<div className="size-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
									{isCreateMode ? "Creating…" : "Saving…"}
								</>
							) : isCreateMode ? (
								"Create Funnel"
							) : (
								"Save Changes"
							)}
						</Button>
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}
