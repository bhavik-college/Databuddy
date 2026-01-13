"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CaretDownIcon, InfoIcon } from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { FormDialog } from "@/components/ui/form-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useWebsite } from "@/hooks/use-websites";
import { orpc } from "@/lib/orpc";
import { cn } from "@/lib/utils";

const granularityOptions = [
	{ value: "minute", label: "1m" },
	{ value: "ten_minutes", label: "10m" },
	{ value: "thirty_minutes", label: "30m" },
	{ value: "hour", label: "1h" },
	{ value: "six_hours", label: "6h" },
] as const;

const monitorFormSchema = z.object({
	granularity: z.enum([
		"minute",
		"ten_minutes",
		"thirty_minutes",
		"hour",
		"six_hours",
	]),
	jsonParsingEnabled: z.boolean(),
	jsonParsingMode: z.enum(["auto", "manual"]),
	jsonParsingFields: z.string(),
});

type MonitorFormData = z.infer<typeof monitorFormSchema>;

interface MonitorDialogProps {
	open: boolean;
	onCloseAction: (open: boolean) => void;
	websiteId: string;
	onSaveAction?: () => void;
	schedule?: {
		id: string;
		granularity: string;
		jsonParsingConfig?: {
			enabled: boolean;
			mode: "auto" | "manual";
			fields?: string[];
		} | null;
	} | null;
}

export function MonitorDialog({
	open,
	onCloseAction,
	websiteId,
	onSaveAction,
	schedule,
}: MonitorDialogProps) {
	const isEditing = !!schedule;
	const { data: website } = useWebsite(websiteId);
	const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

	const jsonConfig = schedule?.jsonParsingConfig;

	const form = useForm<MonitorFormData>({
		resolver: zodResolver(monitorFormSchema),
		defaultValues: {
			granularity:
				(schedule?.granularity as MonitorFormData["granularity"]) ||
				"ten_minutes",
			jsonParsingEnabled: jsonConfig?.enabled ?? false,
			jsonParsingMode: jsonConfig?.mode ?? "auto",
			jsonParsingFields: jsonConfig?.fields?.join(", ") ?? "",
		},
	});

	const createMutation = useMutation({
		...orpc.uptime.createSchedule.mutationOptions(),
	});
	const updateMutation = useMutation({
		...orpc.uptime.updateSchedule.mutationOptions(),
	});

	useEffect(() => {
		if (open) {
			const jsonConfig = schedule?.jsonParsingConfig;
			form.reset({
				granularity:
					(schedule?.granularity as MonitorFormData["granularity"]) ||
					"ten_minutes",
				jsonParsingEnabled: jsonConfig?.enabled ?? false,
				jsonParsingMode: jsonConfig?.mode ?? "auto",
				jsonParsingFields: jsonConfig?.fields?.join(", ") ?? "",
			});
			setIsAdvancedOpen(jsonConfig?.enabled ?? false);
		}
	}, [open, schedule, form]);

	const getErrorMessage = (error: unknown): string => {
		const defaultMessage = "Failed to create monitor.";

		const rpcError = error as {
			data?: { code?: string };
			message?: string;
		};

		if (rpcError?.data?.code) {
			switch (rpcError.data.code) {
				case "FORBIDDEN":
					return (
						rpcError.message ||
						"You do not have permission to perform this action."
					);
				case "UNAUTHORIZED":
					return "You must be logged in to perform this action.";
				case "BAD_REQUEST":
					return (
						rpcError.message || "Invalid request. Please check your input."
					);
				default:
					return rpcError.message || defaultMessage;
			}
		}

		return rpcError?.message || defaultMessage;
	};

	const handleSubmit = async () => {
		const data = form.getValues();

		const jsonParsingConfig = data.jsonParsingEnabled
			? {
					enabled: true,
					mode: data.jsonParsingMode,
					fields:
						data.jsonParsingMode === "manual" && data.jsonParsingFields
							? data.jsonParsingFields
									.split(",")
									.map((f) => f.trim())
									.filter(Boolean)
							: undefined,
				}
			: undefined;

		try {
			if (isEditing && schedule) {
				await updateMutation.mutateAsync({
					scheduleId: schedule.id,
					granularity: data.granularity,
					jsonParsingConfig,
				});
				toast.success("Monitor updated successfully");
			} else {
				if (!website?.domain) {
					toast.error("Website domain not found");
					return;
				}

				const url = website.domain.startsWith("http")
					? website.domain
					: `https://${website.domain}`;

				await createMutation.mutateAsync({
					websiteId,
					url,
					name: website.name ?? undefined,
					granularity: data.granularity,
					jsonParsingConfig,
				});
				toast.success("Monitor created successfully");
			}
			onSaveAction?.();
			onCloseAction(false);
		} catch (error: unknown) {
			const message = getErrorMessage(error);
			toast.error(message);
		}
	};

	const isPending = createMutation.isPending || updateMutation.isPending;

	return (
		<FormDialog
			description={
				isEditing
					? "Update your uptime monitor settings"
					: "Set up a new uptime monitor for your website"
			}
			isSubmitting={isPending}
			onOpenChange={onCloseAction}
			onSubmit={form.handleSubmit(handleSubmit)}
			open={open}
			submitDisabled={!form.formState.isValid}
			submitLabel={isEditing ? "Update Monitor" : "Create Monitor"}
			title={isEditing ? "Edit Monitor" : "Create Monitor"}
		>
			<Form {...form}>
				<FormField
					control={form.control}
					name="granularity"
					render={({ field }) => (
						<FormItem>
							<FormLabel className="flex items-center gap-2">
								Check Frequency
								<Tooltip>
									<TooltipTrigger asChild>
										<InfoIcon className="size-4" weight="duotone" />
									</TooltipTrigger>
									<TooltipContent className="max-w-xs">
										<div className="space-y-2">
											<p className="text-xs leading-relaxed">
												How often the monitor will check your website's
												availability. More frequent checks provide faster
												alerting but may be limited by your plan.
											</p>
										</div>
									</TooltipContent>
								</Tooltip>
							</FormLabel>
							<div className="flex items-center justify-center gap-0 rounded border">
								{granularityOptions.map((option, index) => {
									const isActive = field.value === option.value;
									const isFirst = index === 0;
									const isLast = index === granularityOptions.length - 1;
									return (
										<Button
											className={clsx(
												"h-10 flex-1 cursor-pointer touch-manipulation whitespace-nowrap rounded-none border-r px-0 font-medium text-sm",
												isFirst ? "rounded-l" : "",
												isLast ? "rounded-r border-r-0" : "",
												isActive
													? "bg-accent text-accent-foreground hover:bg-accent"
													: "hover:bg-accent/50"
											)}
											disabled={isPending}
											key={option.value}
											onClick={() => field.onChange(option.value)}
											type="button"
											variant={isActive ? "secondary" : "ghost"}
										>
											{option.label}
										</Button>
									);
								})}
							</div>
							<FormMessage />
						</FormItem>
					)}
				/>

				<Collapsible onOpenChange={setIsAdvancedOpen} open={isAdvancedOpen}>
					<CollapsibleTrigger asChild>
						<Button
							className="mt-4 w-full justify-between"
							type="button"
							variant="ghost"
						>
							<span className="font-medium text-sm">Advanced</span>
							<CaretDownIcon
								className={cn(
									"size-4 transition-transform",
									isAdvancedOpen && "rotate-180"
								)}
								weight="fill"
							/>
						</Button>
					</CollapsibleTrigger>
					<CollapsibleContent className="space-y-4">
						<FormField
							control={form.control}
							name="jsonParsingEnabled"
							render={({ field }) => (
								<FormItem className="flex items-center justify-between rounded border p-4">
									<div className="space-y-0.5">
										<FormLabel className="flex items-center gap-2">
											JSON Response Parsing
											<Tooltip>
												<TooltipTrigger asChild>
													<InfoIcon className="size-4" weight="duotone" />
												</TooltipTrigger>
												<TooltipContent className="max-w-xs">
													<div className="space-y-2">
														<p className="text-xs leading-relaxed">
															Parse JSON responses to extract individual service
															status and latency. Useful for health check
															endpoints that return multiple service statuses.
														</p>
													</div>
												</TooltipContent>
											</Tooltip>
										</FormLabel>
										<p className="text-muted-foreground text-xs">
											Extract status and latency from JSON health checks
										</p>
									</div>
									<FormControl>
										<Switch
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
								</FormItem>
							)}
						/>

						{form.watch("jsonParsingEnabled") && (
							<>
								<FormField
									control={form.control}
									name="jsonParsingMode"
									render={({ field }) => (
										<FormItem className="space-y-3">
											<FormLabel>Parsing Mode</FormLabel>
											<FormControl>
												<RadioGroup
													className="grid grid-cols-2 gap-3"
													onValueChange={field.onChange}
													value={field.value}
												>
													<div className="flex items-center space-x-2 rounded border p-3">
														<RadioGroupItem id="auto" value="auto" />
														<FormLabel
															className="cursor-pointer font-normal"
															htmlFor="auto"
														>
															<div>
																<div className="font-medium text-sm">Auto</div>
																<p className="text-muted-foreground text-xs">
																	Automatically detect services
																</p>
															</div>
														</FormLabel>
													</div>
													<div className="flex items-center space-x-2 rounded border p-3">
														<RadioGroupItem id="manual" value="manual" />
														<FormLabel
															className="cursor-pointer font-normal"
															htmlFor="manual"
														>
															<div>
																<div className="font-medium text-sm">
																	Manual
																</div>
																<p className="text-muted-foreground text-xs">
																	Specify field paths
																</p>
															</div>
														</FormLabel>
													</div>
												</RadioGroup>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								{form.watch("jsonParsingMode") === "manual" && (
									<FormField
										control={form.control}
										name="jsonParsingFields"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="flex items-center gap-2">
													Field Paths
													<Tooltip>
														<TooltipTrigger asChild>
															<InfoIcon className="size-4" weight="duotone" />
														</TooltipTrigger>
														<TooltipContent className="max-w-xs">
															<div className="space-y-2">
																<p className="text-xs leading-relaxed">
																	Comma-separated paths to extract from JSON
																	response. Use dot notation, e.g.:
																</p>
																<code className="block rounded bg-muted p-2 text-xs">
																	services.database, services.clickhouse
																</code>
															</div>
														</TooltipContent>
													</Tooltip>
												</FormLabel>
												<FormControl>
													<Textarea
														placeholder="services.database, services.clickhouse, services.stripe"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								)}
							</>
						)}
					</CollapsibleContent>
				</Collapsible>
			</Form>
		</FormDialog>
	);
}
