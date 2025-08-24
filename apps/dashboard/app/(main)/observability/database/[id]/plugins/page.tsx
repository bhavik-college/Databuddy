'use client';

import {
	ArrowClockwiseIcon,
	CheckIcon,
	DatabaseIcon,
	GearIcon,
	MagnifyingGlassIcon,
	PlusIcon,
	ShieldCheckIcon,
	ShieldWarningIcon,
	TrashIcon,
	WarningIcon,
} from '@phosphor-icons/react';
import { use, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/lib/trpc';

interface ExtensionsPageProps {
	params: Promise<{ id: string }>;
}

function LoadingState() {
	return (
		<div className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
			<Skeleton className="h-8 w-64" />
			<div className="grid gap-4 md:grid-cols-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<Skeleton className="h-24 w-full" key={i.toString()} />
				))}
			</div>
			<Skeleton className="h-40 w-full" />
		</div>
	);
}

function PermissionBanner({
	permissionLevel,
	onUpgrade,
}: {
	permissionLevel: string;
	onUpgrade: () => void;
}) {
	if (permissionLevel === 'admin') {
		return (
			<Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
				<ShieldCheckIcon className="h-4 w-4 text-green-600" />
				<AlertDescription className="text-green-800 dark:text-green-200">
					<strong>Admin Access</strong> - You can install, update, and remove
					extensions.
				</AlertDescription>
			</Alert>
		);
	}

	return (
		<Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
			<ShieldWarningIcon className="h-4 w-4 text-amber-600" />
			<AlertDescription className="flex items-center justify-between">
				<div className="text-amber-800 dark:text-amber-200">
					<strong>Read-Only Access</strong> - Extension management requires
					admin permissions.
				</div>
				<Button onClick={onUpgrade} size="sm" variant="outline">
					Upgrade Connection
				</Button>
			</AlertDescription>
		</Alert>
	);
}

function StatsCard({
	title,
	value,
	icon,
}: {
	title: string;
	value: number;
	icon: React.ReactNode;
}) {
	return (
		<Card>
			<CardContent className="pt-6">
				<div className="flex items-center space-x-2">
					{icon}
					<div>
						<p className="font-medium text-2xl">{value}</p>
						<p className="text-muted-foreground text-sm">{title}</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

interface Extension {
	name: string;
	description: string;
	version?: string;
	defaultVersion?: string;
	schema?: string;
	hasStatefulData?: boolean;
	requiresRestart?: boolean;
	needsUpdate?: boolean;
}

function ExtensionBadges({
	extension,
	type,
}: {
	extension: Extension;
	type: 'installed' | 'available';
}) {
	return (
		<div className="flex gap-1">
			{type === 'installed' ? (
				<Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
					<CheckIcon className="mr-1 h-3 w-3" />
					Installed
				</Badge>
			) : (
				<Badge variant="outline">
					<PlusIcon className="mr-1 h-3 w-3" />
					Available
				</Badge>
			)}
			{extension.needsUpdate && (
				<Badge variant="default">
					<ArrowClockwiseIcon className="mr-1 h-3 w-3" />
					Update
				</Badge>
			)}
		</div>
	);
}

function ExtensionMetadata({
	extension,
	type,
}: {
	extension: Extension;
	type: 'installed' | 'available';
}) {
	return (
		<div className="flex flex-wrap gap-1">
			{type === 'installed' && (
				<span className="text-muted-foreground text-xs">
					v{extension.version}
				</span>
			)}
			{type === 'available' && (
				<span className="text-muted-foreground text-xs">
					v{extension.defaultVersion}
				</span>
			)}
			{extension.schema && (
				<Badge className="text-xs" variant="outline">
					{extension.schema}
				</Badge>
			)}
			{extension.hasStatefulData && (
				<Badge className="text-xs" variant="outline">
					Stateful
				</Badge>
			)}
			{extension.requiresRestart && (
				<Badge className="text-amber-600 text-xs" variant="outline">
					Restart Required
				</Badge>
			)}
		</div>
	);
}

function ExtensionActions({
	extension,
	type,
	onInstall,
	onUpdate,
	onRemove,
	onReset,
	canManage,
	isInstalling,
	isUpdating,
	isRemoving,
	isResetting,
}: {
	extension: Extension;
	type: 'installed' | 'available';
	onInstall?: () => void;
	onUpdate?: () => void;
	onRemove?: () => void;
	onReset?: () => void;
	canManage: boolean;
	isInstalling?: boolean;
	isUpdating?: boolean;
	isRemoving?: boolean;
	isResetting?: boolean;
}) {
	return (
		<div className="flex items-center justify-between">
			<div className="flex gap-2">
				{type === 'installed' && extension.needsUpdate && onUpdate && (
					<Button
						disabled={!canManage || isUpdating}
						onClick={onUpdate}
						size="sm"
					>
						<ArrowClockwiseIcon className="mr-1 h-3 w-3" />
						{isUpdating ? 'Updating...' : 'Update'}
					</Button>
				)}
				{type === 'installed' && extension.hasStatefulData && onReset && (
					<Button
						disabled={!canManage || isResetting}
						onClick={onReset}
						size="sm"
						variant="outline"
					>
						{isResetting ? 'Resetting...' : 'Reset Stats'}
					</Button>
				)}
			</div>
			<div className="flex gap-2">
				{type === 'available' && onInstall && (
					<Button
						disabled={!canManage || isInstalling}
						onClick={onInstall}
						size="sm"
					>
						<PlusIcon className="mr-1 h-3 w-3" />
						{isInstalling ? 'Installing...' : 'Install'}
					</Button>
				)}
				{type === 'installed' && onRemove && (
					<Button
						disabled={!canManage || isRemoving}
						onClick={onRemove}
						size="sm"
						variant="destructive"
					>
						<TrashIcon className="mr-1 h-3 w-3" />
						{isRemoving ? 'Removing...' : 'Remove'}
					</Button>
				)}
			</div>
		</div>
	);
}

function ExtensionCard({
	extension,
	type,
	onInstall,
	onUpdate,
	onRemove,
	onReset,
	canManage,
	isInstalling,
	isUpdating,
	isRemoving,
	isResetting,
}: {
	extension: Extension;
	type: 'installed' | 'available';
	onInstall?: () => void;
	onUpdate?: () => void;
	onRemove?: () => void;
	onReset?: () => void;
	canManage: boolean;
	isInstalling?: boolean;
	isUpdating?: boolean;
	isRemoving?: boolean;
	isResetting?: boolean;
}) {
	return (
		<Card className="p-4">
			<div className="space-y-3">
				<div className="flex items-center justify-between">
					<h3 className="font-semibold">{extension.name}</h3>
					<ExtensionBadges extension={extension} type={type} />
				</div>

				<p className="text-muted-foreground text-sm">{extension.description}</p>

				<ExtensionMetadata extension={extension} type={type} />

				<ExtensionActions
					canManage={canManage}
					extension={extension}
					isInstalling={isInstalling}
					isRemoving={isRemoving}
					isResetting={isResetting}
					isUpdating={isUpdating}
					onInstall={onInstall}
					onRemove={onRemove}
					onReset={onReset}
					onUpdate={onUpdate}
					type={type}
				/>
			</div>
		</Card>
	);
}

function InstallDialog({
	open,
	onOpenChange,
	availableExtensions,
	onInstall,
	isLoading,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	availableExtensions: Extension[];
	onInstall: (name: string, schema?: string) => void;
	isLoading: boolean;
}) {
	const [selectedExtension, setSelectedExtension] = useState('');
	const [schema, setSchema] = useState('public');

	const handleInstall = () => {
		if (!selectedExtension) {
			return;
		}
		onInstall(selectedExtension, schema);
		setSelectedExtension('');
	};

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Install Extension</DialogTitle>
					<DialogDescription>
						Select an extension to install with safety checks.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4">
					<div>
						<Label>Extension</Label>
						<Select
							onValueChange={setSelectedExtension}
							value={selectedExtension}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select extension" />
							</SelectTrigger>
							<SelectContent>
								{availableExtensions.map((ext) => (
									<SelectItem key={ext.name} value={ext.name}>
										{ext.name} - {ext.description}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div>
						<Label>Schema</Label>
						<Input onChange={(e) => setSchema(e.target.value)} value={schema} />
					</div>
				</div>
				<DialogFooter>
					<Button onClick={() => onOpenChange(false)} variant="outline">
						Cancel
					</Button>
					<Button
						disabled={!selectedExtension || isLoading}
						onClick={handleInstall}
					>
						{isLoading ? 'Installing...' : 'Install'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function UpgradeConnectionDialog({
	open,
	onOpenChange,
	connectionId,
	onSuccess,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	connectionId: string;
	onSuccess: () => void;
}) {
	const [adminUrl, setAdminUrl] = useState('');

	const upgradeMutation = trpc.dbConnections.updateUrl.useMutation({
		onSuccess: () => {
			onSuccess();
			onOpenChange(false);
			setAdminUrl('');
		},
	});

	const handleUpgrade = () => {
		if (!adminUrl) {
			return;
		}
		upgradeMutation.mutate({
			id: connectionId,
			adminUrl,
			permissionLevel: 'admin',
		});
	};

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Upgrade to Admin Access</DialogTitle>
					<DialogDescription>
						Provide an admin connection URL to enable extension management.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4">
					<div>
						<Label>Admin Database URL</Label>
						<Input
							onChange={(e) => setAdminUrl(e.target.value)}
							placeholder="postgresql://admin:password@host:5432/database"
							type="password"
							value={adminUrl}
						/>
						<p className="mt-1 text-muted-foreground text-xs">
							This will create a new admin user and replace your readonly
							connection.
						</p>
					</div>
					{upgradeMutation.error && (
						<Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
							<WarningIcon className="h-4 w-4 text-red-600" />
							<AlertDescription className="text-red-800 dark:text-red-200">
								{upgradeMutation.error.message}
							</AlertDescription>
						</Alert>
					)}
				</div>
				<DialogFooter>
					<Button onClick={() => onOpenChange(false)} variant="outline">
						Cancel
					</Button>
					<Button
						disabled={!adminUrl || upgradeMutation.isPending}
						onClick={handleUpgrade}
					>
						{upgradeMutation.isPending ? 'Upgrading...' : 'Upgrade'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function ConfigurationRequiredDialog({
	open,
	onOpenChange,
	extensionName,
	warnings,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	extensionName: string;
	warnings: string[];
}) {
	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
	};

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className="max-h-[80vh] max-w-lg overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<GearIcon className="h-5 w-5" />
						Configuration Required
					</DialogTitle>
					<DialogDescription>
						{extensionName} requires PostgreSQL server configuration changes.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
						<WarningIcon className="h-4 w-4 text-blue-600" />
						<AlertDescription className="text-blue-800 dark:text-blue-200">
							<p className="font-medium text-sm">
								Server Configuration Required
							</p>
							<p className="mt-1 text-xs">{warnings[0]}</p>
						</AlertDescription>
					</Alert>

					<div className="space-y-3">
						<h4 className="font-medium text-sm">Quick Setup:</h4>

						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 font-medium text-blue-800 text-xs dark:bg-blue-900/20 dark:text-blue-400">
									1
								</div>
								<span className="font-medium text-sm">
									Edit postgresql.conf
								</span>
							</div>
							<div className="ml-7">
								<div className="relative">
									<pre className="overflow-x-auto rounded bg-muted p-2 text-xs">
										<code>{`shared_preload_libraries = '${extensionName}'`}</code>
									</pre>
									<Button
										className="absolute top-1 right-1"
										onClick={() =>
											copyToClipboard(
												`shared_preload_libraries = '${extensionName}'`
											)
										}
										size="sm"
										variant="ghost"
									>
										Copy
									</Button>
								</div>
							</div>
						</div>

						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 font-medium text-blue-800 text-xs dark:bg-blue-900/20 dark:text-blue-400">
									2
								</div>
								<span className="font-medium text-sm">Restart PostgreSQL</span>
							</div>
							<div className="ml-7">
								<div className="relative">
									<pre className="overflow-x-auto rounded bg-muted p-2 text-xs">
										<code>sudo systemctl restart postgresql</code>
									</pre>
									<Button
										className="absolute top-1 right-1"
										onClick={() =>
											copyToClipboard('sudo systemctl restart postgresql')
										}
										size="sm"
										variant="ghost"
									>
										Copy
									</Button>
								</div>
							</div>
						</div>

						<div className="flex items-center gap-2">
							<div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 font-medium text-blue-800 text-xs dark:bg-blue-900/20 dark:text-blue-400">
								3
							</div>
							<span className="font-medium text-sm">Try installing again</span>
						</div>
					</div>

					<Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
						<WarningIcon className="h-4 w-4 text-amber-600" />
						<AlertDescription className="text-amber-800 text-xs dark:text-amber-200">
							<strong>Note:</strong> Requires server admin access and will
							restart PostgreSQL.
						</AlertDescription>
					</Alert>
				</div>

				<DialogFooter>
					<Button onClick={() => onOpenChange(false)} variant="outline">
						Later
					</Button>
					<Button onClick={() => onOpenChange(false)}>Done</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function RemoveExtensionDialog({
	open,
	onOpenChange,
	extensionName,
	warnings,
	isLoading,
	onRemove,
	forceCascade,
	onForceCascadeChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	extensionName: string | null;
	warnings: string[];
	isLoading: boolean;
	onRemove: (extensionName: string, cascade: boolean) => void;
	forceCascade: boolean;
	onForceCascadeChange: (checked: boolean) => void;
}) {
	const handleRemove = () => {
		if (!extensionName) {
			return;
		}
		onRemove(extensionName, forceCascade);
	};

	const handleClose = () => {
		onOpenChange(false);
		onForceCascadeChange(false);
	};

	return (
		<Dialog onOpenChange={handleClose} open={open}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Remove Extension</DialogTitle>
					<DialogDescription>
						Are you sure you want to remove <strong>{extensionName}</strong>?
						This action cannot be undone.
					</DialogDescription>
				</DialogHeader>

				{warnings.length > 0 && (
					<div className="space-y-4">
						<Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
							<WarningIcon className="h-4 w-4 text-amber-600" />
							<AlertDescription>
								<div className="space-y-2">
									<p className="font-medium text-amber-800 dark:text-amber-200">
										Dependencies Found
									</p>
									<ul className="list-inside list-disc space-y-1 text-amber-700 text-sm dark:text-amber-300">
										{warnings.map((warning) => (
											<li key={warning}>{warning}</li>
										))}
									</ul>
								</div>
							</AlertDescription>
						</Alert>

						<div className="flex items-center space-x-2">
							<Checkbox
								checked={forceCascade}
								id="force-cascade"
								onCheckedChange={onForceCascadeChange}
							/>
							<Label
								className="font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
								htmlFor="force-cascade"
							>
								Force removal (CASCADE) - This will also remove dependent
								objects
							</Label>
						</div>
					</div>
				)}

				<DialogFooter>
					<Button onClick={handleClose} variant="outline">
						Cancel
					</Button>
					<Button
						disabled={isLoading || (warnings.length > 0 && !forceCascade)}
						onClick={handleRemove}
						variant="destructive"
					>
						{isLoading ? 'Removing...' : 'Remove'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export default function ExtensionsPage({ params }: ExtensionsPageProps) {
	const [search, setSearch] = useState('');
	const [installDialog, setInstallDialog] = useState(false);
	const [upgradeDialog, setUpgradeDialog] = useState(false);
	const [removeDialog, setRemoveDialog] = useState<string | null>(null);
	const [removeWarnings, setRemoveWarnings] = useState<string[]>([]);
	const [forceCascade, setForceCascade] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [configDialog, setConfigDialog] = useState<{
		open: boolean;
		extensionName: string;
		warnings: string[];
	}>({ open: false, extensionName: '', warnings: [] });

	const resolvedParams = use(params);
	const connectionId = resolvedParams.id;

	const utils = trpc.useUtils();

	// Queries
	const { data: connection } = trpc.dbConnections.getById.useQuery({
		id: connectionId,
	});
	const { data: extensions } = trpc.dbConnections.getExtensions.useQuery({
		id: connectionId,
	});
	const { data: availableExtensions } =
		trpc.dbConnections.getAvailableExtensions.useQuery({
			id: connectionId,
		});

	// Mutations
	const installMutation = trpc.dbConnections.installExtension.useMutation({
		onSuccess: (result, variables) => {
			if (result?.success !== false) {
				// Successful installation
				utils.dbConnections.getExtensions.invalidate({ id: connectionId });
				utils.dbConnections.getAvailableExtensions.invalidate({
					id: connectionId,
				});
				setInstallDialog(false);
				setError(null);
				setSuccess(
					`Extension "${variables.extensionName}" installed successfully`
				);
				setTimeout(() => setSuccess(null), 5000);
			} else if (result.warnings) {
				// Check if this is a configuration-required extension
				const isConfigRequired = result.warnings.some(
					(warning) =>
						warning.includes('shared_preload_libraries') ||
						warning.includes('restart')
				);

				if (isConfigRequired) {
					setConfigDialog({
						open: true,
						extensionName: variables.extensionName,
						warnings: result.warnings,
					});
					setInstallDialog(false);
				} else {
					setError(`Cannot install extension: ${result.warnings.join(', ')}`);
				}
				setSuccess(null);
			}
		},
		onError: (err) => {
			console.error('Failed to install extension:', err);
			setError(`Failed to install extension: ${err.message}`);
			setSuccess(null);
		},
	});

	const updateMutation = trpc.dbConnections.updateExtension.useMutation({
		onSuccess: () => {
			utils.dbConnections.getExtensions.invalidate({ id: connectionId });
			setError(null);
		},
		onError: (err) => {
			console.error('Failed to update extension:', err);
			setError(`Failed to update extension: ${err.message}`);
		},
	});

	const removeMutation = trpc.dbConnections.dropExtension.useMutation({
		onSuccess: (result, variables) => {
			if (result.success) {
				utils.dbConnections.getExtensions.invalidate({ id: connectionId });
				utils.dbConnections.getAvailableExtensions.invalidate({
					id: connectionId,
				});
				setRemoveDialog(null);
				setRemoveWarnings([]);
				setForceCascade(false);
				setError(null);
				setSuccess(
					`Extension "${variables.extensionName}" removed successfully`
				);
				setTimeout(() => setSuccess(null), 5000);
			} else if (result.warnings) {
				// Handle dependency warnings
				setRemoveWarnings(result.warnings);
				setError(null);
				setSuccess(null);
			}
		},
		onError: (err) => {
			console.error('Failed to remove extension:', err);
			setError(`Failed to remove extension: ${err.message}`);
			setRemoveWarnings([]);
			setSuccess(null);
		},
	});

	const resetMutation = trpc.dbConnections.resetExtensionStats.useMutation({
		onSuccess: () => {
			utils.dbConnections.getExtensions.invalidate({ id: connectionId });
			setError(null);
		},
		onError: (err) => {
			console.error('Failed to reset extension stats:', err);
			setError(`Failed to reset extension stats: ${err.message}`);
		},
	});

	if (!(connection && extensions && availableExtensions)) {
		return <LoadingState />;
	}

	const canManage = connection.permissionLevel === 'admin';
	const filteredInstalled = extensions.filter(
		(ext) =>
			ext.name.toLowerCase().includes(search.toLowerCase()) ||
			ext.description.toLowerCase().includes(search.toLowerCase())
	);
	const filteredAvailable = availableExtensions.filter(
		(ext) =>
			ext.name.toLowerCase().includes(search.toLowerCase()) ||
			ext.description.toLowerCase().includes(search.toLowerCase())
	);

	const stats = {
		installed: extensions.length,
		available: availableExtensions.length,
		updates: extensions.filter((ext) => ext.needsUpdate).length,
	};

	const handleInstall = (name: string, schema?: string) => {
		installMutation.mutate({
			id: connectionId,
			extensionName: name,
			schema,
		});
	};

	const handleRemove = (extensionName: string, cascade = false) => {
		removeMutation.mutate({
			id: connectionId,
			extensionName,
			cascade,
		});
	};

	return (
		<div className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
			{/* Header */}
			<div className="space-y-2">
				<div className="flex items-center gap-2">
					<DatabaseIcon
						className="h-6 w-6 text-muted-foreground"
						weight="duotone"
					/>
					<h1 className="font-bold text-2xl">PostgreSQL Extensions</h1>
				</div>
				<p className="text-muted-foreground text-sm">
					Manage database extensions with production-safe operations
				</p>
			</div>

			{/* Permission Banner */}
			<PermissionBanner
				onUpgrade={() => setUpgradeDialog(true)}
				permissionLevel={connection.permissionLevel}
			/>

			{/* Success Banner */}
			{success && (
				<Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
					<CheckIcon className="h-4 w-4 text-green-600" />
					<AlertDescription className="flex items-center justify-between">
						<span className="text-green-800 dark:text-green-200">
							{success}
						</span>
						<Button onClick={() => setSuccess(null)} size="sm" variant="ghost">
							Dismiss
						</Button>
					</AlertDescription>
				</Alert>
			)}

			{/* Error Banner */}
			{error && (
				<Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
					<WarningIcon className="h-4 w-4 text-red-600" />
					<AlertDescription className="flex items-center justify-between">
						<span className="text-red-800 dark:text-red-200">{error}</span>
						<Button onClick={() => setError(null)} size="sm" variant="ghost">
							Dismiss
						</Button>
					</AlertDescription>
				</Alert>
			)}

			{/* Stats */}
			<div className="grid gap-4 md:grid-cols-4">
				<StatsCard
					icon={<CheckIcon className="h-5 w-5 text-green-600" />}
					title="Installed"
					value={stats.installed}
				/>
				<StatsCard
					icon={<PlusIcon className="h-5 w-5 text-blue-600" />}
					title="Available"
					value={stats.available}
				/>
				<StatsCard
					icon={<ArrowClockwiseIcon className="h-5 w-5 text-amber-600" />}
					title="Updates"
					value={stats.updates}
				/>
			</div>

			{/* Search and Actions */}
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div className="relative max-w-md flex-1">
					<MagnifyingGlassIcon className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
					<Input
						className="pl-10"
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search extensions..."
						value={search}
					/>
				</div>
				<Button
					disabled={!canManage || installMutation.isPending}
					onClick={() => setInstallDialog(true)}
				>
					<PlusIcon className="mr-2 h-4 w-4" />
					{installMutation.isPending ? 'Installing...' : 'Install Extension'}
				</Button>
			</div>

			{/* Extensions Tabs */}
			<Tabs className="w-full" defaultValue="installed">
				<TabsList>
					<TabsTrigger value="installed">
						Installed ({stats.installed})
					</TabsTrigger>
					<TabsTrigger value="available">
						Available ({stats.available})
					</TabsTrigger>
				</TabsList>

				<TabsContent className="space-y-4" value="installed">
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{filteredInstalled.map((ext) => (
							<ExtensionCard
								canManage={canManage}
								extension={ext}
								isRemoving={
									removeMutation.isPending &&
									removeMutation.variables?.extensionName === ext.name
								}
								isResetting={
									resetMutation.isPending &&
									resetMutation.variables?.extensionName === ext.name
								}
								isUpdating={
									updateMutation.isPending &&
									updateMutation.variables?.extensionName === ext.name
								}
								key={ext.name}
								onRemove={() => setRemoveDialog(ext.name)}
								onReset={() =>
									resetMutation.mutate({
										id: connectionId,
										extensionName: ext.name,
									})
								}
								onUpdate={() =>
									updateMutation.mutate({
										id: connectionId,
										extensionName: ext.name,
									})
								}
								type="installed"
							/>
						))}
					</div>
					{filteredInstalled.length === 0 && (
						<div className="py-12 text-center">
							<DatabaseIcon className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
							<p className="text-muted-foreground">
								No installed extensions found
							</p>
						</div>
					)}
				</TabsContent>

				<TabsContent className="space-y-4" value="available">
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{filteredAvailable.map((ext) => (
							<ExtensionCard
								canManage={canManage}
								extension={ext}
								isInstalling={
									installMutation.isPending &&
									installMutation.variables?.extensionName === ext.name
								}
								key={ext.name}
								onInstall={() => handleInstall(ext.name)}
								type="available"
							/>
						))}
					</div>
					{filteredAvailable.length === 0 && (
						<div className="py-12 text-center">
							<CheckIcon className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
							<p className="text-muted-foreground">
								No available extensions found
							</p>
						</div>
					)}
				</TabsContent>
			</Tabs>

			{/* Dialogs */}
			<InstallDialog
				availableExtensions={availableExtensions}
				isLoading={installMutation.isPending}
				onInstall={handleInstall}
				onOpenChange={setInstallDialog}
				open={installDialog}
			/>

			<UpgradeConnectionDialog
				connectionId={connectionId}
				onOpenChange={setUpgradeDialog}
				onSuccess={() => {
					utils.dbConnections.getById.invalidate({ id: connectionId });
					utils.dbConnections.getExtensions.invalidate({ id: connectionId });
					utils.dbConnections.getAvailableExtensions.invalidate({
						id: connectionId,
					});
				}}
				open={upgradeDialog}
			/>

			{/* Configuration Required Dialog */}
			<ConfigurationRequiredDialog
				extensionName={configDialog.extensionName}
				onOpenChange={(open) => {
					if (!open) {
						setConfigDialog({ open: false, extensionName: '', warnings: [] });
					}
				}}
				open={configDialog.open}
				warnings={configDialog.warnings}
			/>

			{/* Remove Extension Dialog */}
			<RemoveExtensionDialog
				extensionName={removeDialog}
				forceCascade={forceCascade}
				isLoading={removeMutation.isPending}
				onForceCascadeChange={setForceCascade}
				onOpenChange={(open) => {
					if (!open) {
						setRemoveDialog(null);
						setRemoveWarnings([]);
						setForceCascade(false);
					}
				}}
				onRemove={handleRemove}
				open={!!removeDialog}
				warnings={removeWarnings}
			/>
		</div>
	);
}
