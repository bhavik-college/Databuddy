import { zodResolver } from '@hookform/resolvers/zod';
import { KeyIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { trpc } from '@/lib/trpc';

import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../ui/select';
import { Separator } from '../ui/separator';
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from '../ui/sheet';
import type {
	ApiKeyAccessEntry,
	ApiResourceType,
	ApiScope,
	CreateApiKeyInput,
} from './api-key-types';

interface ApiKeyCreateDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organizationId?: string;
	defaultResource?: { resourceType: ApiResourceType; resourceId?: string };
	onCreated?: (result: {
		id: string;
		secret: string;
		prefix: string;
		start: string;
	}) => void;
}

const ALL_SCOPES: { value: ApiScope; label: string; description: string }[] = [
	{
		value: 'read:data',
		label: 'Read Data',
		description: 'View analytics data and reports',
	},
	{
		value: 'write:data',
		label: 'Write Data',
		description: 'Send events and modify data',
	},
	{
		value: 'read:experiments',
		label: 'Read Experiments',
		description: 'View A/B tests and feature flags',
	},
	{
		value: 'track:events',
		label: 'Track Events',
		description: 'Send tracking events to analytics',
	},
	{
		value: 'admin:apikeys',
		label: 'Manage API Keys',
		description: 'Create and manage API keys',
	},
];

export function ApiKeyCreateDialog({
	open,
	onOpenChange,
	organizationId,
	defaultResource,
	onCreated,
}: ApiKeyCreateDialogProps) {
	const utils = trpc.useUtils();
	const createMutation = trpc.apikeys.create.useMutation({
		onSuccess: async (res: {
			id: string;
			secret: string;
			prefix: string;
			start: string;
		}) => {
			await utils.apikeys.list.invalidate();
			onCreated?.(res);
			onOpenChange(false);
		},
	});

	// Form schema
	const formSchema = z.object({
		name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
	});
	type FormData = z.infer<typeof formSchema>;

	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		defaultValues: { name: '' },
	});

	const [globalScopes, setGlobalScopes] = useState<ApiScope[]>([]);
	const [scopedAccess, setScopedAccess] = useState<ApiKeyAccessEntry[]>(
		defaultResource
			? [
					{
						resourceType: defaultResource.resourceType,
						resourceId: defaultResource.resourceId,
						scopes: [],
					},
				]
			: []
	);
	const { data: websites } = trpc.websites.list.useQuery({ organizationId });
	const [websiteToAdd, setWebsiteToAdd] = useState<string | undefined>(
		undefined
	);

	const toggleGlobalScope = (scope: ApiScope) => {
		setGlobalScopes((prev) =>
			prev.includes(scope) ? prev.filter((x) => x !== scope) : [...prev, scope]
		);
	};

	const addWebsite = () => {
		if (!websiteToAdd) {
			return;
		}
		const exists = scopedAccess.some(
			(e) => e.resourceType === 'website' && e.resourceId === websiteToAdd
		);
		if (exists) {
			return;
		}
		setScopedAccess((prev) => [
			...prev,
			{ resourceType: 'website', resourceId: websiteToAdd, scopes: [] },
		]);
		setWebsiteToAdd(undefined);
	};

	const removeAccess = (index: number) => {
		setScopedAccess((prev) => prev.filter((_, i) => i !== index));
	};

	const toggleResourceScope = (accessIndex: number, scope: ApiScope) => {
		setScopedAccess((prev) =>
			prev.map((entry, i) => {
				if (i !== accessIndex) {
					return entry;
				}
				const scopes = entry.scopes.includes(scope)
					? entry.scopes.filter((s) => s !== scope)
					: [...entry.scopes, scope];
				return { ...entry, scopes };
			})
		);
	};

	const submit = form.handleSubmit((values) => {
		const payload: CreateApiKeyInput = {
			name: values.name,
			organizationId,
			globalScopes,
			access: scopedAccess,
		};
		createMutation.mutate(payload);
	});

	const handleClose = () => {
		onOpenChange(false);
		form.reset();
		setGlobalScopes([]);
		setScopedAccess(
			defaultResource
				? [
						{
							resourceType: defaultResource.resourceType,
							resourceId: defaultResource.resourceId,
							scopes: [],
						},
					]
				: []
		);
		setWebsiteToAdd(undefined);
	};

	return (
		<Sheet onOpenChange={handleClose} open={open}>
			<SheetContent
				className="w-full overflow-y-auto p-4 sm:w-[60vw] sm:max-w-[1200px]"
				side="right"
			>
				<SheetHeader className="space-y-3 border-border/50 border-b pb-6">
					<div className="flex items-center gap-3">
						<div className="rounded border p-3">
							<KeyIcon
								className="h-6 w-6 not-dark:text-primary"
								weight="duotone"
							/>
						</div>
						<div>
							<SheetTitle className="font-semibold text-foreground text-xl">
								Create API Key
							</SheetTitle>
							<SheetDescription className="mt-1 text-muted-foreground">
								Generate a new key with scoped permissions for secure API access
							</SheetDescription>
						</div>
					</div>
				</SheetHeader>

				<div className="space-y-6 pt-6">
					<Form {...form}>
						<form className="space-y-6" onSubmit={submit}>
							<fieldset
								className="space-y-6"
								disabled={createMutation.isPending}
							>
								{/* Name Field */}
								<FormField
									control={form.control}
									name="name"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="font-medium text-foreground text-sm">
												Key Name
											</FormLabel>
											<FormControl>
												<Input
													placeholder="e.g., Production API Key"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								{/* Global Scopes Section */}
								<div className="space-y-3">
									<Label className="font-medium text-foreground text-sm">
										Global Permissions
									</Label>
									<div className="grid grid-cols-1 gap-2 md:grid-cols-2">
										{ALL_SCOPES.map((scope) => (
											<label
												className="flex cursor-pointer items-center gap-3 rounded border bg-background p-3 transition-colors hover:bg-accent/50"
												htmlFor={`global-${scope.value}`}
												key={scope.value}
											>
												<Checkbox
													checked={globalScopes.includes(scope.value)}
													id={`global-${scope.value}`}
													onCheckedChange={() => toggleGlobalScope(scope.value)}
												/>
												<div className="flex-1">
													<div className="font-medium text-sm">
														{scope.label}
													</div>
													<div className="text-muted-foreground text-xs">
														{scope.description}
													</div>
												</div>
											</label>
										))}
									</div>
								</div>

								{/* Resource Access Section */}
								{websites && websites.length > 0 && (
									<div className="space-y-4">
										<Separator className="my-2" />
										<div className="flex items-center gap-2">
											<KeyIcon
												className="h-5 w-5 not-dark:text-primary"
												weight="duotone"
											/>
											<Label className="font-semibold text-base text-foreground">
												Website Restrictions
											</Label>
											<span className="text-muted-foreground text-xs">
												(optional)
											</span>
										</div>

										{/* Add Website */}
										<div className="flex items-center gap-3">
											<Select
												onValueChange={setWebsiteToAdd}
												value={websiteToAdd}
											>
												<SelectTrigger className="flex-1">
													<SelectValue placeholder="Select website to restrict" />
												</SelectTrigger>
												<SelectContent>
													{websites.map((w) => (
														<SelectItem key={w.id} value={w.id}>
															<div className="flex items-center gap-2">
																<div className="h-2 w-2 rounded-full bg-green-500" />
																{w.name || w.domain}
															</div>
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<Button
												disabled={!websiteToAdd}
												onClick={addWebsite}
												type="button"
											>
												<PlusIcon className="mr-2 h-4 w-4" />
												Add
											</Button>
										</div>

										{/* Website Access Entries */}
										{scopedAccess.length > 0 && (
											<div className="space-y-3">
												{scopedAccess.map((entry, idx) => {
													const website = websites.find(
														(w) => w.id === entry.resourceId
													);
													return (
														<div
															className="rounded border bg-muted/30 p-4"
															key={`${entry.resourceType}-${entry.resourceId ?? 'none'}`}
														>
															<div className="mb-3 flex items-center justify-between">
																<div className="flex items-center gap-2">
																	<div className="h-2 w-2 rounded-full bg-blue-500" />
																	<span className="font-medium text-sm">
																		{website?.name ||
																			website?.domain ||
																			entry.resourceId}
																	</span>
																</div>
																<Button
																	className="h-8 w-8 p-0"
																	onClick={() => removeAccess(idx)}
																	size="sm"
																	type="button"
																	variant="ghost"
																>
																	<TrashIcon className="h-4 w-4" />
																</Button>
															</div>
															<div className="grid grid-cols-1 gap-2 md:grid-cols-2">
																{ALL_SCOPES.map((scope) => (
																	<label
																		className="flex cursor-pointer items-center gap-3 rounded border bg-background/50 p-2 transition-colors hover:bg-accent/50"
																		htmlFor={`resource-${idx}-${scope.value}`}
																		key={scope.value}
																	>
																		<Checkbox
																			checked={entry.scopes.includes(
																				scope.value
																			)}
																			id={`resource-${idx}-${scope.value}`}
																			onCheckedChange={() =>
																				toggleResourceScope(idx, scope.value)
																			}
																		/>
																		<div className="flex-1">
																			<div className="font-medium text-sm">
																				{scope.label}
																			</div>
																			<div className="text-muted-foreground text-xs">
																				{scope.description}
																			</div>
																		</div>
																	</label>
																))}
															</div>
														</div>
													);
												})}
											</div>
										)}
									</div>
								)}
							</fieldset>

							<div className="flex items-center justify-end gap-3 border-border/50 border-t pt-6">
								<Button onClick={handleClose} type="button" variant="outline">
									Cancel
								</Button>
								<Button disabled={createMutation.isPending} type="submit">
									{createMutation.isPending ? 'Creating...' : 'Create API Key'}
								</Button>
							</div>
						</form>
					</Form>
				</div>
			</SheetContent>
		</Sheet>
	);
}
