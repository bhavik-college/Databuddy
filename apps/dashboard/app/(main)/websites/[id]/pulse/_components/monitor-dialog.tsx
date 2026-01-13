"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
	CaretDownIcon,
	CodeIcon,
	InfoIcon,
	PlusIcon,
	XIcon,
} from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { type KeyboardEvent, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Sheet,
	SheetBody,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
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
	{ value: "five_minutes", label: "5m" },
	{ value: "ten_minutes", label: "10m" },
	{ value: "thirty_minutes", label: "30m" },
	{ value: "hour", label: "1h" },
	{ value: "six_hours", label: "6h" },
] as const;

const monitorFormSchema = z.object({
	granularity: z.enum([
		"minute",
		"five_minutes",
		"ten_minutes",
		"thirty_minutes",
		"hour",
		"six_hours",
	]),
	jsonParsingEnabled: z.boolean(),
	jsonParsingMode: z.enum(["auto", "manual"]),
	jsonParsingFields: z.array(z.string()),
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

const DOT_NOTATION_REGEX = /^[a-zA-Z0-9_]+(\.[a-zA-Z0-9_]+)*$/;

interface FieldPathInputProps {
	value: string[];
	onChange: (value: string[]) => void;
}

function FieldPathInput({ value = [], onChange }: FieldPathInputProps) {
	const [inputValue, setInputValue] = useState("");
	const [error, setError] = useState<string | null>(null);

	const validatePath = (path: string) => {
		if (!path) {
			return false;
		}
		// Simple dot notation validation: alphanumeric chars + underscores, separated by dots
		return DOT_NOTATION_REGEX.test(path);
	};

	const addPath = (path: string) => {
		const trimmed = path.trim();
		if (!trimmed) {
			return;
		}

		if (value.includes(trimmed)) {
			setError("Path already exists");
			return;
		}

		if (!validatePath(trimmed)) {
			setError("Invalid path format (use dot notation e.g. services.db)");
			return;
		}

		onChange([...value, trimmed]);
		setInputValue("");
		setError(null);
	};

	const removePath = (pathToRemove: string) => {
		onChange(value.filter((path) => path !== pathToRemove));
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" || e.key === ",") {
			e.preventDefault();
			addPath(inputValue);
		} else if (e.key === "Backspace" && !inputValue && value.length > 0) {
			removePath(value.at(-1) ?? "");
		}
	};

	const handleBlur = () => {
		if (inputValue) {
			addPath(inputValue);
		}
		setError(null);
	};

	const generatePreview = () => {
		if (value.length === 0) {
			return {
				status: "ok",
				services: {
					database: {
						status: "up",
						latency: 45,
					},
				},
			};
		}

		const preview = {};
		for (const path of value) {
			let current: any = preview;
			const parts = path.split(".");
			const last = parts.pop();
			if (!last) {
				continue;
			}

			for (const part of parts) {
				if (!current[part]) {
					current[part] = {};
				}
				current = current[part];
			}

			if (last.includes("status")) {
				current[last] = "up";
			} else if (last.includes("latency")) {
				current[last] = 45;
			} else {
				current[last] = "ok";
			}
		}
		return preview;
	};

	return (
		<div className="space-y-4">
			<div className="space-y-3">
				<div className="flex flex-wrap gap-2 rounded-sm border border-accent-brighter bg-input p-1.5 transition-all focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 dark:bg-input/80">
					{value.map((path) => (
						<Badge
							className="flex items-center gap-1 pr-1"
							key={path}
							variant="secondary"
						>
							{path}
							<button
								className="rounded-full p-0.5 hover:bg-muted-foreground/20"
								onClick={() => removePath(path)}
								type="button"
							>
								<XIcon className="size-3" />
								<span className="sr-only">Remove {path}</span>
							</button>
						</Badge>
					))}
					<Input
						className="h-6 min-w-[120px] flex-1 border-0 bg-transparent p-0 text-sm shadow-none placeholder:text-muted-foreground focus-visible:ring-0"
						onBlur={handleBlur}
						onChange={(e) => {
							setInputValue(e.target.value);
							setError(null);
						}}
						onKeyDown={handleKeyDown}
						placeholder={value.length === 0 ? "e.g. services.database" : ""}
						value={inputValue}
					/>
				</div>
				{error && <p className="text-destructive text-xs">{error}</p>}
			</div>

			<div className="rounded-md border bg-muted/50 p-4">
				<div className="mb-3 flex items-center justify-between">
					<p className="font-medium text-xs">
						{value.length === 0
							? "Example API Response"
							: "Extracted Data Preview"}
					</p>
					{value.length === 0 && (
						<span className="text-muted-foreground text-xs">
							(Add fields above to see preview)
						</span>
					)}
				</div>
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
					<div className="space-y-2">
						<pre className="overflow-x-auto rounded-md bg-background p-3 font-mono text-[10px] text-muted-foreground leading-relaxed">
							{JSON.stringify(generatePreview(), null, 2)}
						</pre>
					</div>
					<div className="space-y-4">
						<div className="space-y-2">
							<p className="font-medium text-xs">How it works</p>
							<p className="text-muted-foreground text-xs leading-relaxed">
								We extract the exact values at the paths you provide. To track
								service health, you should target specific <b>status</b>{" "}
								(string) and <b>latency</b> (number) fields.
							</p>
						</div>
						{value.length === 0 && (
							<div className="space-y-2">
								<p className="font-medium text-xs">Try these examples:</p>
								<div className="flex flex-col gap-1.5">
									{[
										{ label: "Root status", path: "status" },
										{ label: "DB status", path: "services.database.status" },
										{
											label: "DB latency",
											path: "services.database.latency",
										},
									].map((example) => (
										<button
											className="flex w-fit items-center gap-2 rounded bg-background px-2 py-1 text-left text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
											key={example.path}
											onClick={() => addPath(example.path)}
											type="button"
										>
											<PlusIcon className="size-3" />
											<code className="font-mono text-[10px]">
												{example.path}
											</code>
										</button>
									))}	
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

function CollapsibleSection({
	icon: Icon,
	title,
	badge,
	isExpanded,
	onToggleAction,
	children,
}: {
	icon: React.ComponentType<{ size?: number; weight?: "duotone" | "fill" }>;
	title: string;
	badge?: number;
	isExpanded: boolean;
	onToggleAction: () => void;
	children: React.ReactNode;
}) {
	return (
		<div>
			<button
				className="group flex w-full cursor-pointer items-center justify-between rounded py-3 text-left transition-colors hover:bg-accent/50"
				onClick={onToggleAction}
				type="button"
			>
				<div className="flex items-center gap-2.5">
					<Icon size={16} weight="duotone" />
					<span className="font-medium text-sm">{title}</span>
					{badge !== undefined && badge > 0 && (
						<span className="flex size-5 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground text-xs">
							{badge}
						</span>
					)}
				</div>
				<CaretDownIcon
					className={cn(
						"size-4 text-muted-foreground transition-transform duration-200",
						isExpanded && "rotate-180"
					)}
					weight="fill"
				/>
			</button>

			<AnimatePresence initial={false}>
				{isExpanded && (
					<motion.div
						animate={{ height: "auto", opacity: 1 }}
						className="overflow-hidden"
						exit={{ height: 0, opacity: 0 }}
						initial={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.2, ease: "easeInOut" }}
					>
						<div className="pb-4">{children}</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

export function MonitorSheet({
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
			jsonParsingFields: jsonConfig?.fields ?? [],
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
				jsonParsingFields: jsonConfig?.fields ?? [],
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
						data.jsonParsingMode === "manual" &&
						data.jsonParsingFields.length > 0
							? data.jsonParsingFields
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
		<Sheet onOpenChange={onCloseAction} open={open}>
			<SheetContent className="w-full sm:max-w-xl">
				<SheetHeader>
					<SheetTitle>
						{isEditing ? "Edit Monitor" : "Create Monitor"}
					</SheetTitle>
					<SheetDescription>
						{isEditing
							? "Update your uptime monitor settings"
							: "Set up a new uptime monitor for your website"}
					</SheetDescription>
				</SheetHeader>

				<Form {...form}>
					<form
						className="flex flex-1 flex-col overflow-hidden"
						onSubmit={form.handleSubmit(handleSubmit)}
					>
						<SheetBody className="space-y-6">
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

							<div className="h-px bg-border" />

							<div className="space-y-1">
								<CollapsibleSection
									badge={form.watch("jsonParsingEnabled") ? 1 : 0}
									icon={CodeIcon}
									isExpanded={isAdvancedOpen}
									onToggleAction={() => setIsAdvancedOpen(!isAdvancedOpen)}
									title="JSON Response Parsing"
								>
									<div className="space-y-6">
										<FormField
											control={form.control}
											name="jsonParsingEnabled"
											render={({ field }) => (
												<FormItem className="flex items-center justify-between gap-4 space-y-0 rounded border p-3">
													<div className="space-y-1">
														<FormLabel className="font-normal text-sm">
															Enable Parsing
														</FormLabel>
														<p className="text-muted-foreground text-xs">
															Extract status and latency from JSON health checks
														</p>
													</div>
													<FormControl>
														<Switch
															checked={field.value}
															onCheckedChange={(checked) => {
																field.onChange(checked);
																if (checked) {
																	setIsAdvancedOpen(true);
																}
															}}
														/>
													</FormControl>
												</FormItem>
											)}
										/>

										{form.watch("jsonParsingEnabled") && (
											<div className="fade-in slide-in-from-top-2 animate-in space-y-6">
												<FormField
													control={form.control}
													name="jsonParsingMode"
													render={({ field }) => (
														<FormItem>
															<div className="mb-2 flex items-center justify-between">
																<FormLabel>Parsing Mode</FormLabel>
																<span className="text-muted-foreground text-xs">
																	{field.value === "auto"
																		? "Recursively search for status/latency fields"
																		: "Manually specify paths using dot notation"}
																</span>
															</div>
															<FormControl>
																<div className="flex items-center justify-center gap-0 rounded border">
																	<Button
																		className={clsx(
																			"h-9 flex-1 cursor-pointer rounded-none rounded-l border-r px-0 font-medium text-sm hover:bg-accent/50",
																			field.value === "auto" &&
																				"bg-accent text-accent-foreground hover:bg-accent"
																		)}
																		onClick={() => field.onChange("auto")}
																		type="button"
																		variant={
																			field.value === "auto"
																				? "secondary"
																				: "ghost"
																		}
																	>
																		Auto
																	</Button>
																	<Button
																		className={clsx(
																			"h-9 flex-1 cursor-pointer rounded-none rounded-r px-0 font-medium text-sm hover:bg-accent/50",
																			field.value === "manual" &&
																				"bg-accent text-accent-foreground hover:bg-accent"
																		)}
																		onClick={() => field.onChange("manual")}
																		type="button"
																		variant={
																			field.value === "manual"
																				? "secondary"
																				: "ghost"
																		}
																	>
																		Manual
																	</Button>
																</div>
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
																</FormLabel>
																<FormControl>
																	<FieldPathInput
																		onChange={field.onChange}
																		value={field.value}
																	/>
																</FormControl>
																<FormMessage />
															</FormItem>
														)}
													/>
												)}
											</div>
										)}
									</div>
								</CollapsibleSection>
							</div>
						</SheetBody>

						<SheetFooter>
							<Button
								onClick={() => onCloseAction(false)}
								type="button"
								variant="ghost"
							>
								Cancel
							</Button>
							<Button
								className="min-w-28"
								disabled={isPending || !form.formState.isValid}
								type="submit"
							>
								{isPending ? "Saving..." : isEditing ? "Update" : "Create"}
							</Button>
						</SheetFooter>
					</form>
				</Form>
			</SheetContent>
		</Sheet>
	);
}
