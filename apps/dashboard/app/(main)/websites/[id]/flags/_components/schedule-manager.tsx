"use client";

import { DATE_FORMATS, formatDate } from "@lib/formatters";
import { CalendarIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
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
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { ScheduleManagerProps } from "./types";

export function ScheduleManager({ form }: ScheduleManagerProps) {
	const rolloutSteps = form.watch("schedule.rolloutSteps") || [];
	const scheduleEnabled = form.watch("schedule.isEnabled");
	const watchedScheduledType = form.watch("schedule.type");

	function addRolloutStep() {
		form.setValue("schedule.rolloutSteps", [
			...rolloutSteps,
			{
				scheduledAt: new Date().toISOString(),
				value: 0,
			},
		]);
	}

	return (
		<div className="space-y-4">
			{/* HEADER */}
			<div className="flex items-center justify-between">
				<div>
					<h3 className="font-medium text-sm">Schedule Changes</h3>
					<p className="text-muted-foreground text-xs">
						Automatically update this flag at a specific time
					</p>
				</div>
				<div className="flex items-center gap-2">
					<FormField
						// control={form.control}
						name="isEnabled"
						render={() => (
							<FormItem className="flex items-center gap-2">
								<FormLabel className="text-muted-foreground text-sm">
									{scheduleEnabled ? "Enabled" : "Disabled"}
								</FormLabel>
								<FormControl>
									<Switch
										checked={scheduleEnabled}
										id="schedule-toggle"
										onCheckedChange={(value) => {
											form.setValue("schedule.isEnabled", value);
											if (!value) {
												form.setValue("schedule", undefined);
											}
										}}
									/>
								</FormControl>
							</FormItem>
						)}
					/>
				</div>
			</div>

			{scheduleEnabled ? (
				<div className="space-y-4 rounded border p-4">
					<div className="flex gap-2">
						<FormField
							control={form.control}
							name="schedule.type"
							render={({ field }) => (
								<FormItem className="grow">
									<FormLabel>Schedule Type</FormLabel>
									<Select
										onValueChange={(e) => {
											if (
												e === "update_rollout" &&
												(rolloutSteps.length === 0 || !rolloutSteps)
											) {
												addRolloutStep();
											}
											field.onChange(e);
										}}
										value={field.value}
									>
										<FormControl>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Select" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="enable">Enable</SelectItem>
											<SelectItem value="disable">Disable</SelectItem>
										</SelectContent>
									</Select>
									{watchedScheduledType === "update_rollout" ? (
										<FormDescription>
											Schedule different rollouts for your traffic.
										</FormDescription>
									) : null}
								</FormItem>
							)}
						/>

						{watchedScheduledType !== "update_rollout" ? (
							<FormField
								control={form.control}
								name="schedule.scheduledAt"
								render={({ field }) => (
									<FormItem className="flex grow flex-col">
										<FormLabel>Date & Time</FormLabel>
										<Popover>
											<PopoverTrigger asChild>
												<FormControl>
													<Button
														className={cn(
															"w-full pl-3 text-left font-normal",
															!field.value && "text-muted-foreground"
														)}
														variant="outline"
													>
														{field.value
															? formatDate(
																	new Date(field.value),
																	DATE_FORMATS.DATE_TIME_12H
																)
															: "Pick a Time"}
														<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
													</Button>
												</FormControl>
											</PopoverTrigger>

											<PopoverContent align="start" className="w-auto p-0">
												<Calendar
													mode="single"
													onSelect={(date) => {
														if (date) {
															const currentTime = field.value
																? new Date(field.value)
																: new Date();
															date.setHours(currentTime.getHours());
															date.setMinutes(currentTime.getMinutes());
															field.onChange(date.toISOString());
														}
													}}
													selected={
														field.value
															? new Date(field.value)
															: (undefined as Date | undefined)
													}
												/>

												<div className="border-t p-3">
													<Input
														defaultValue={
															field.value
																? formatDate(
																		new Date(field.value),
																		DATE_FORMATS.TIME_ONLY
																	)
																: ""
														}
														onChange={(e) => {
															const date = field.value
																? new Date(field.value)
																: new Date();
															const [h, m] = e.target.value.split(":");
															date.setHours(Number(h), Number(m));
															field.onChange(date.toISOString());
														}}
														type="time"
													/>
												</div>
											</PopoverContent>
										</Popover>
										<FormMessage />
									</FormItem>
								)}
							/>
						) : null}
					</div>
				</div>
			) : null}
		</div>
	);
}
