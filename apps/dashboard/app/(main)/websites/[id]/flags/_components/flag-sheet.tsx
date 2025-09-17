'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { FlagIcon, PlusIcon } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/lib/trpc';
import type { Flag, UserRule } from './types';

const userRuleSchema = z.object({
	type: z.enum(['user_id', 'email', 'property']),
	operator: z.enum([
		'equals',
		'contains',
		'starts_with',
		'ends_with',
		'in',
		'not_in',
		'exists',
		'not_exists',
	]),
	field: z.string().optional(),
	value: z.any().optional(),
	values: z.array(z.any()).optional(),
	enabled: z.boolean(),
	batch: z.boolean(),
	batchValues: z.array(z.string()).optional(),
});

const flagFormSchema = z.object({
	key: z
		.string()
		.min(1, 'Key is required')
		.max(100, 'Key too long')
		.regex(
			/^[a-zA-Z0-9_-]+$/,
			'Key must contain only letters, numbers, underscores, and hyphens'
		),
	name: z
		.string()
		.min(1, 'Name is required')
		.max(100, 'Name too long')
		.optional(),
	description: z.string().optional(),
	type: z.enum(['boolean', 'rollout']),
	status: z.enum(['active', 'inactive', 'archived']),
	defaultValue: z.boolean(),
	payload: z.string().optional(),
	rolloutPercentage: z.number().min(0).max(100),
	rules: z.array(userRuleSchema).optional(),
});

type FlagFormData = z.infer<typeof flagFormSchema>;

interface FlagSheetProps {
	isOpen: boolean;
	onClose: () => void;
	websiteId: string;
	flag?: Flag | null;
}

export function FlagSheet({
	isOpen,
	onClose,
	websiteId,
	flag,
}: FlagSheetProps) {
	const [keyManuallyEdited, setKeyManuallyEdited] = useState(false);
	const isEditing = Boolean(flag);

	const form = useForm<FlagFormData>({
		resolver: zodResolver(flagFormSchema),
		defaultValues: {
			key: '',
			name: '',
			description: '',
			type: 'boolean',
			status: 'active',
			defaultValue: false,
			payload: '',
			rolloutPercentage: 0,
			rules: [],
		},
	});

	const utils = trpc.useUtils();
	const createMutation = trpc.flags.create.useMutation();
	const updateMutation = trpc.flags.update.useMutation();

	useEffect(() => {
		if (isOpen) {
			if (flag && isEditing) {
				form.reset({
					key: flag.key,
					name: flag.name || '',
					description: flag.description || '',
					type: flag.type as 'boolean' | 'rollout',
					status: flag.status as 'active' | 'inactive' | 'archived',
					defaultValue: Boolean(flag.defaultValue),
					payload: '', // Payload is commented out
					rolloutPercentage: flag.rolloutPercentage || 0,
					rules: (flag.rules as any[]) || [],
				});
			} else {
				form.reset();
			}
			setKeyManuallyEdited(false);
		}
	}, [isOpen, flag, isEditing, form]);

	const watchedName = form.watch('name');
	const watchedType = form.watch('type');

	useEffect(() => {
		if (isEditing || keyManuallyEdited || !watchedName) {
			return;
		}

		const key = watchedName
			.toLowerCase()
			.replace(/[^a-z0-9\s]/g, '')
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-')
			.replace(/^-+|-+$/g, '')
			.slice(0, 50);
		form.setValue('key', key);
	}, [watchedName, keyManuallyEdited, isEditing, form]);

	// Show rollout percentage only for rollout type
	const showRolloutPercentage = watchedType === 'rollout';

	const onSubmit = async (data: FlagFormData) => {
		try {
			// Payload is commented out for now
			const payload = undefined;

			const mutation = isEditing ? updateMutation : createMutation;
			const mutationData =
				isEditing && flag
					? {
							id: flag.id,
							name: data.name || undefined,
							description: data.description || undefined,
							type: data.type,
							status: data.status,
							defaultValue: data.defaultValue,
							payload,
							rolloutPercentage: data.rolloutPercentage,
							rules: data.rules || [],
						}
					: {
							websiteId,
							key: data.key,
							name: data.name || undefined,
							description: data.description || undefined,
							type: data.type,
							status: data.status,
							defaultValue: data.defaultValue,
							payload,
							rolloutPercentage: data.rolloutPercentage,
							rules: data.rules || [],
						};

			await mutation.mutateAsync(mutationData as any);
			toast.success(`Flag ${isEditing ? 'updated' : 'created'} successfully`);

			// Invalidate to refresh with real server data
			utils.flags.list.invalidate();
			onClose();
		} catch (error: any) {
			if (
				error?.message?.includes('unique') ||
				error?.message?.includes('CONFLICT')
			) {
				toast.error('A flag with this key already exists in this scope');
			} else if (error?.message?.includes('FORBIDDEN')) {
				toast.error('You do not have permission to perform this action');
			} else {
				toast.error(`Failed to ${isEditing ? 'update' : 'create'} flag`);
			}
		}
	};

	const isLoading = createMutation.isPending || updateMutation.isPending;

	return (
		<Sheet onOpenChange={onClose} open={isOpen}>
			<SheetContent
				className="w-full overflow-y-auto p-4 sm:w-[60vw] sm:max-w-[800px]"
				side="right"
			>
				<SheetHeader className="space-y-3 border-border/50 border-b pb-6">
					<div className="flex items-center gap-3">
						<div className="rounded-xl border border-primary/20 bg-primary/10 p-3">
							<FlagIcon
								className="h-6 w-6 text-primary"
								size={16}
								weight="duotone"
							/>
						</div>
						<div>
							<SheetTitle className="font-semibold text-foreground text-xl">
								{isEditing ? 'Edit Feature Flag' : 'Create Feature Flag'}
							</SheetTitle>
							<SheetDescription className="mt-1 text-muted-foreground">
								{isEditing
									? 'Update flag configuration and settings'
									: 'Set up a new feature flag for controlled rollouts'}
							</SheetDescription>
						</div>
					</div>
				</SheetHeader>

				<div className="space-y-8 pt-6">
					<Form {...form}>
						<form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
							{/* Basic Information */}
							<div className="space-y-4">
								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									<FormField
										control={form.control}
										name="name"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Flag Name</FormLabel>
												<FormControl>
													<Input
														placeholder="New Dashboard Feature"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="key"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													Key{' '}
													{!isEditing && (
														<span className="text-red-500">*</span>
													)}
												</FormLabel>
												<FormControl>
													<Input
														placeholder="new-dashboard"
														{...field}
														disabled={isEditing}
														onChange={(e) => {
															const value = e.target.value;
															setKeyManuallyEdited(value.length > 0);
															field.onChange(value);
														}}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<FormField
									control={form.control}
									name="description"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Description (Optional)</FormLabel>
											<FormControl>
												<Textarea
													placeholder="What does this flag control?"
													rows={2}
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							{/* Configuration */}
							<div className="space-y-4">
								<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
									<FormField
										control={form.control}
										name="type"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Flag Type</FormLabel>
												<Select
													onValueChange={field.onChange}
													value={field.value}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														<SelectItem value="boolean">
															Boolean (On/Off)
														</SelectItem>
														<SelectItem value="rollout">
															Rollout (Percentage)
														</SelectItem>
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="status"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Status</FormLabel>
												<Select
													onValueChange={field.onChange}
													value={field.value}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														<SelectItem value="active">🟢 Active</SelectItem>
														<SelectItem value="inactive">
															🟡 Inactive
														</SelectItem>
														<SelectItem value="archived">
															⚫ Archived
														</SelectItem>
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="defaultValue"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Default Value</FormLabel>
												<FormControl>
													<div className="flex h-10 items-center justify-center rounded-md border bg-background px-3">
														<div className="flex items-center gap-2">
															<span
																className={
																	field.value
																		? 'text-muted-foreground'
																		: 'font-medium'
																}
															>
																Off
															</span>
															<Switch
																checked={field.value}
																onCheckedChange={field.onChange}
															/>
															<span
																className={
																	field.value
																		? 'font-medium'
																		: 'text-muted-foreground'
																}
															>
																On
															</span>
														</div>
													</div>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							</div>

							{/* Rollout Percentage */}
							{showRolloutPercentage && (
								<div className="space-y-4">
									<FormField
										control={form.control}
										name="rolloutPercentage"
										render={({ field }) => {
											const currentValue = Number(field.value) || 0;

											return (
												<FormItem>
													<div className="flex items-center justify-between">
														<FormLabel>Rollout Percentage</FormLabel>
														<span className="font-mono font-semibold text-sm">
															{currentValue}%
														</span>
													</div>
													<FormControl>
														<div className="space-y-3">
															<input
																className="slider h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 dark:bg-gray-700"
																max="100"
																min="0"
																onChange={(e) =>
																	field.onChange(Number(e.target.value))
																}
																step="5"
																type="range"
																value={currentValue}
															/>
															<div className="flex justify-center gap-2">
																{[0, 25, 50, 75, 100].map((preset) => (
																	<button
																		className={`rounded border px-2 py-1 text-xs transition-colors ${
																			currentValue === preset
																				? 'border-primary bg-primary text-primary-foreground'
																				: 'border-border hover:border-primary/50'
																		}`}
																		key={preset}
																		onClick={() => field.onChange(preset)}
																		type="button"
																	>
																		{preset}%
																	</button>
																))}
															</div>
														</div>
													</FormControl>
													<FormMessage />
												</FormItem>
											);
										}}
									/>
								</div>
							)}

							{/* Payload Section - Commented out for now */}
							{/* <div className="space-y-3">
								{showPayload ? (
									<div className="slide-in-from-top-2 animate-in duration-300">
										<FormField
											control={form.control}
											name="payload"
											render={({ field }) => (
												<FormItem>
													<div className="flex items-center justify-between">
														<FormLabel className="font-medium text-foreground text-sm">
															Payload (Optional)
														</FormLabel>
														<Button
															className="h-6 px-2 text-muted-foreground hover:text-foreground"
															onClick={() => {
																setShowPayload(false);
																form.setValue('payload', '');
															}}
															size="sm"
															type="button"
															variant="ghost"
														>
															Remove
														</Button>
													</div>
													<FormControl>
														<Textarea
															className="rounded border-border/50 font-mono text-sm focus:border-primary/50 focus:ring-primary/20"
															placeholder='{"theme": "dark", "timeout": 5000}'
															rows={4}
															{...field}
														/>
													</FormControl>
													<FormDescription className="text-muted-foreground text-xs">
														JSON data returned when flag is enabled
													</FormDescription>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
								) : (
									<Button
										className="group w-full rounded border-2 border-primary/30 border-dashed transition-all duration-300 hover:border-primary/50 hover:bg-primary/5"
										onClick={() => setShowPayload(true)}
										type="button"
										variant="outline"
									>
										<PlusIcon
											className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:rotate-90"
											size={16}
										/>
										Add Payload (Optional)
									</Button>
								)}
							</div> */}

							{/* User Targeting Rules */}
							<div className="space-y-4">
								<FormField
									control={form.control}
									name="rules"
									render={({ field }) => (
										<FormItem>
											<FormLabel>User Targeting (Optional)</FormLabel>
											<FormControl>
												<UserRulesBuilder
													onChange={field.onChange}
													rules={field.value || []}
												/>
											</FormControl>
											<FormDescription>
												Define rules to target specific users or groups
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<div className="flex justify-end gap-3 border-t pt-6">
								<Button onClick={onClose} type="button" variant="outline">
									Cancel
								</Button>
								<Button disabled={isLoading} type="submit">
									{isLoading ? 'Saving...' : isEditing ? 'Update' : 'Create'}
								</Button>
							</div>
						</form>
					</Form>
				</div>
			</SheetContent>
		</Sheet>
	);
}

// User Rules Builder Component
interface UserRulesBuilderProps {
	rules: UserRule[];
	onChange: (rules: UserRule[]) => void;
}

function UserRulesBuilder({ rules, onChange }: UserRulesBuilderProps) {
	const [batchTextValues, setBatchTextValues] = useState<
		Record<number, string>
	>({});

	const addRule = () => {
		const newRule: UserRule = {
			type: 'user_id',
			operator: 'equals',
			value: '',
			enabled: true,
			batch: false,
		};
		onChange([...rules, newRule]);
	};

	const canUseBatch = (rule: UserRule) => {
		return rule.operator !== 'exists' && rule.operator !== 'not_exists';
	};

	const updateRule = (index: number, updatedRule: Partial<UserRule>) => {
		const newRules = [...rules];
		newRules[index] = { ...newRules[index], ...updatedRule };
		onChange(newRules);
	};

	const removeRule = (index: number) => {
		// Clean up local state when removing a rule
		setBatchTextValues((prev) => {
			const newValues = { ...prev };
			delete newValues[index];
			// Shift indices down for rules after the removed one
			const shiftedValues: Record<number, string> = {};
			Object.entries(newValues).forEach(([key, value]) => {
				const numKey = Number(key);
				if (numKey > index) {
					shiftedValues[numKey - 1] = value;
				} else {
					shiftedValues[numKey] = value;
				}
			});
			return shiftedValues;
		});
		onChange(rules.filter((_, i) => i !== index));
	};

	const updateBatchText = (index: number, rawValue: string) => {
		// Update local state for textarea display
		setBatchTextValues((prev) => ({ ...prev, [index]: rawValue }));

		// Process the value for the rule
		const batchValues = rawValue
			.split('\n')
			.map((v) => v.trim())
			.filter(Boolean);

		updateRule(index, { batchValues });
	};

	useEffect(() => {
		const initialValues: Record<number, string> = {};
		rules.forEach((rule, index) => {
			if (rule.batch && rule.batchValues?.length) {
				initialValues[index] = rule.batchValues.join('\n');
			}
		});
		if (Object.keys(initialValues).length > 0) {
			setBatchTextValues((prev) => ({ ...prev, ...initialValues }));
		}
	}, [rules]);

	if (rules.length === 0) {
		return (
			<div className="rounded border border-primary/30 border-dashed bg-primary/5 p-8 text-center">
				<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
					<FlagIcon className="h-6 w-6 text-primary" weight="duotone" />
				</div>
				<h3 className="mb-2 font-medium text-sm">No targeting rules</h3>
				<p className="mb-4 text-muted-foreground text-xs">
					Add rules to target specific users, emails, or properties
				</p>
				<Button
					className="rounded"
					onClick={addRule}
					size="sm"
					type="button"
					variant="outline"
				>
					<PlusIcon className="mr-2 h-4 w-4" size={16} />
					Add First Rule
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{rules.map((rule, index) => {
				const ruleId = `rule-${index}`;
				const supportsBatch = canUseBatch(rule);

				return (
					<div className="rounded border bg-card p-4" key={index}>
						{/* Rule Header */}
						<div className="mb-4 flex items-center justify-between">
							<div className="flex items-center gap-2">
								<div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 font-medium text-primary text-xs">
									{index + 1}
								</div>
								<span className="font-medium text-sm">
									{rule.type === 'user_id' && 'User ID'}
									{rule.type === 'email' && 'Email'}
									{rule.type === 'property' && 'Property'}
									{rule.batch && ' (Batch)'}
								</span>
							</div>
							<Button
								onClick={() => removeRule(index)}
								size="sm"
								type="button"
								variant="ghost"
							>
								Remove
							</Button>
						</div>

						{/* Rule Configuration */}
						<div className="space-y-4">
							{/* Target Type & Batch Toggle */}
							<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
								<div>
									<label
										className="mb-1 block font-medium text-sm"
										htmlFor={`${ruleId}-type`}
									>
										Target Type
									</label>
									<Select
										onValueChange={(value) => {
											const newType = value as UserRule['type'];
											updateRule(index, {
												type: newType,
												batch: rule.batch,
												operator: rule.operator,
											});
										}}
										value={rule.type}
									>
										<SelectTrigger id={`${ruleId}-type`}>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="user_id">User ID</SelectItem>
											<SelectItem value="email">Email</SelectItem>
											<SelectItem value="property">Property</SelectItem>
										</SelectContent>
									</Select>
								</div>

								{supportsBatch && (
									<div>
										<label
											className="mb-1 block font-medium text-sm"
											htmlFor={`${ruleId}-batch-toggle`}
										>
											Mode
										</label>
										<div className="flex items-center gap-2 rounded border p-2">
											<Switch
												checked={rule.batch}
												id={`${ruleId}-batch-toggle`}
												onCheckedChange={(batch) =>
													updateRule(index, { batch })
												}
											/>
											<span className="font-medium text-sm">
												{rule.batch ? 'Batch Mode' : 'Single Value'}
											</span>
										</div>
									</div>
								)}
							</div>

							{/* Property Field */}
							{rule.type === 'property' && (
								<div>
									<label
										className="mb-1 block font-medium text-sm"
										htmlFor={`${ruleId}-field`}
									>
										Property Name
									</label>
									<Input
										id={`${ruleId}-field`}
										onChange={(e) =>
											updateRule(index, { field: e.target.value })
										}
										placeholder="e.g. plan, role, country"
										value={rule.field || ''}
									/>
								</div>
							)}

							{/* Condition & Value */}
							{rule.batch ? (
								<div>
									<label
										className="mb-1 block font-medium text-sm"
										htmlFor={`${ruleId}-batch`}
									>
										{rule.type === 'user_id' && 'User IDs'}
										{rule.type === 'email' && 'Email Addresses'}
										{rule.type === 'property' && 'Property Values'}
										{' (one per line)'}
									</label>
									<Textarea
										id={`${ruleId}-batch`}
										onChange={(e) => updateBatchText(index, e.target.value)}
										placeholder={
											rule.type === 'user_id'
												? 'user_123\nuser_456\nuser_789'
												: rule.type === 'email'
													? 'user@example.com\nadmin@company.com\ntest@domain.org'
													: 'premium\nenterprise\nvip'
										}
										rows={4}
										value={
											batchTextValues[index] ||
											rule.batchValues?.join('\n') ||
											''
										}
									/>
									<p className="mt-1 text-muted-foreground text-xs">
										{rule.batchValues?.length || 0} values entered
									</p>
								</div>
							) : (
								<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
									<div>
										<label
											className="mb-1 block font-medium text-sm"
											htmlFor={`${ruleId}-operator`}
										>
											Condition
										</label>
										<Select
											onValueChange={(value) =>
												updateRule(index, { operator: value as any })
											}
											value={rule.operator}
										>
											<SelectTrigger id={`${ruleId}-operator`}>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="equals">Equals</SelectItem>
												<SelectItem value="contains">Contains</SelectItem>
												<SelectItem value="starts_with">Starts with</SelectItem>
												<SelectItem value="ends_with">Ends with</SelectItem>
												<SelectItem value="in">Is one of</SelectItem>
												<SelectItem value="not_in">Is not one of</SelectItem>
												{rule.type === 'property' && (
													<>
														<SelectItem value="exists">Exists</SelectItem>
														<SelectItem value="not_exists">
															Does not exist
														</SelectItem>
													</>
												)}
											</SelectContent>
										</Select>
									</div>

									{rule.operator !== 'exists' &&
										rule.operator !== 'not_exists' && (
											<div>
												<label
													className="mb-1 block font-medium text-sm"
													htmlFor={`${ruleId}-value`}
												>
													{rule.operator === 'in' || rule.operator === 'not_in'
														? 'Values (comma-separated)'
														: 'Value'}
												</label>
												{rule.operator === 'in' ||
												rule.operator === 'not_in' ? (
													<Input
														id={`${ruleId}-value`}
														onChange={(e) => {
															const values = e.target.value
																.split(',')
																.map((v) => v.trim())
																.filter(Boolean);
															updateRule(index, { values });
														}}
														placeholder="value1, value2, value3"
														value={rule.values?.join(', ') || ''}
													/>
												) : (
													<Input
														id={`${ruleId}-value`}
														onChange={(e) =>
															updateRule(index, { value: e.target.value })
														}
														placeholder="Enter value"
														value={rule.value || ''}
													/>
												)}
											</div>
										)}
								</div>
							)}

							{/* Result */}
							<div className="flex items-center justify-between rounded bg-muted/30 p-3">
								<span className="font-medium text-sm">
									When this rule matches:
								</span>
								<div className="flex items-center gap-2">
									<span
										className={
											rule.enabled ? 'text-muted-foreground' : 'font-medium'
										}
									>
										Disabled
									</span>
									<Switch
										checked={rule.enabled}
										onCheckedChange={(enabled) =>
											updateRule(index, { enabled })
										}
									/>
									<span
										className={
											rule.enabled ? 'font-medium' : 'text-muted-foreground'
										}
									>
										Enabled
									</span>
								</div>
							</div>
						</div>
					</div>
				);
			})}

			<Button
				className="w-full"
				onClick={addRule}
				type="button"
				variant="outline"
			>
				<PlusIcon className="mr-2 h-4 w-4" />
				Add Rule
			</Button>
		</div>
	);
}
