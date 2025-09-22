'use client';

import {
	CheckIcon,
	ClipboardIcon,
	DownloadIcon,
	InfoIcon,
	WarningCircleIcon,
} from '@phosphor-icons/react';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import type { DateRange as DayPickerRange } from 'react-day-picker';
import { toast } from 'sonner';
import { DateRangePicker } from '@/components/date-range-picker';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { WebsiteDialog } from '@/components/website-dialog';
import { useDataExport } from '@/hooks/use-data-export';
import { useDeleteWebsite, useTogglePublicWebsite } from '@/hooks/use-websites';
import { SETTINGS_TABS, TOAST_MESSAGES } from '../shared/tracking-constants';
import type {
	DeleteWebsiteDialogProps,
	ExportFormat,
	ExportTabProps,
	PrivacyTabProps,
	SettingsTab,
	WebsiteDataTabProps,
} from '../utils/types';
import { SettingsNavigation } from './settings/settings-navigation';
import { WebsiteHeader } from './settings/website-header';

export function WebsiteSettingsTab({
	websiteId,
	websiteData,
}: WebsiteDataTabProps) {
	const router = useRouter();
	const togglePublicMutation = useTogglePublicWebsite();
	const deleteWebsiteMutation = useDeleteWebsite();

	// UI State
	const [activeTab, setActiveTab] = useState<SettingsTab>(
		SETTINGS_TABS.PRIVACY
	);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [showEditDialog, setShowEditDialog] = useState(false);
	// Data export hook
	const { mutate: exportData, isPending: isExporting } = useDataExport({
		websiteId,
		websiteName: websiteData?.name || undefined,
	});

	// Settings State - use website data directly from props
	const isPublic = websiteData?.isPublic ?? false;

	const handleTogglePublic = useCallback(async () => {
		if (!websiteData) {
			return;
		}

		const newIsPublic = !isPublic;

		try {
			await toast.promise(
				togglePublicMutation.mutateAsync({
					id: websiteId,
					isPublic: newIsPublic,
				}),
				{
					loading: TOAST_MESSAGES.PRIVACY_UPDATING,
					success: TOAST_MESSAGES.PRIVACY_UPDATED,
					error: TOAST_MESSAGES.PRIVACY_ERROR,
				}
			);
		} catch {
			// Error is already handled by toast.promise
		}
	}, [isPublic, websiteData, websiteId, togglePublicMutation]);

	const handleDeleteWebsite = useCallback(async () => {
		try {
			await toast.promise(
				deleteWebsiteMutation.mutateAsync({ id: websiteId }),
				{
					loading: TOAST_MESSAGES.WEBSITE_DELETING,
					success: () => {
						router.push('/websites');
						return TOAST_MESSAGES.WEBSITE_DELETED;
					},
					error: TOAST_MESSAGES.WEBSITE_DELETE_ERROR,
				}
			);
		} catch {
			// Error is already handled by toast.promise
		}
	}, [websiteId, deleteWebsiteMutation, router]);

	const handleWebsiteUpdated = useCallback(() => {
		setShowEditDialog(false);
		// Cache is automatically updated by the mutation, no need for manual refetch
	}, []);

	const handleExportData = useCallback(
		async (format: ExportFormat, startDate?: string, endDate?: string) => {
			await exportData({ format, startDate, endDate });
		},
		[exportData]
	);

	if (!websiteData) {
		return <div>Loading website data...</div>;
	}

	return (
		<div className="space-y-3">
			{/* Header */}
			{websiteData && (
				<WebsiteHeader
					onEditClick={() => setShowEditDialog(true)}
					websiteData={websiteData}
					websiteId={websiteId}
				/>
			)}

			{/* Main Content */}
			<div className="grid grid-cols-12 gap-4">
				{/* Compact Navigation */}
				<div className="col-span-12 md:col-span-4 lg:col-span-3">
					<SettingsNavigation
						activeTab={activeTab}
						onDeleteClick={() => setShowDeleteDialog(true)}
						setActiveTab={setActiveTab}
					/>
				</div>

				{/* Content Area */}
				<div className="col-span-12 md:col-span-8 lg:col-span-9">
					<div className="space-y-4">
						{activeTab === 'privacy' && (
							<PrivacyTab
								isPublic={isPublic}
								onTogglePublic={handleTogglePublic}
								websiteId={websiteId}
							/>
						)}

						{activeTab === 'export' && websiteData && (
							<ExportTab
								isExporting={isExporting}
								onExportData={handleExportData}
								websiteData={websiteData}
								websiteId={websiteId}
							/>
						)}
					</div>
				</div>
			</div>

			{/* Edit Dialog */}
			{websiteData && (
				<WebsiteDialog
					onOpenChange={setShowEditDialog}
					onSave={handleWebsiteUpdated}
					open={showEditDialog}
					website={websiteData}
				/>
			)}

			{/* Delete Dialog */}
			{websiteData && (
				<DeleteWebsiteDialog
					isDeleting={deleteWebsiteMutation.isPending}
					onConfirmDelete={handleDeleteWebsite}
					onOpenChange={setShowDeleteDialog}
					open={showDeleteDialog}
					websiteData={websiteData}
				/>
			)}
		</div>
	);
}

function DeleteWebsiteDialog({
	open,
	onOpenChange,
	websiteData,
	isDeleting,
	onConfirmDelete,
}: DeleteWebsiteDialogProps) {
	return (
		<AlertDialog onOpenChange={onOpenChange} open={open}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete Website</AlertDialogTitle>
					<AlertDialogDescription asChild>
						<div className="space-y-4">
							<p className="text-muted-foreground text-sm">
								Are you sure you want to delete{' '}
								<span className="font-medium">
									{websiteData.name || websiteData.domain}
								</span>
								? This action cannot be undone.
							</p>

							<div className="rounded-md bg-muted p-3 text-muted-foreground text-sm">
								<div className="flex items-start gap-2">
									<WarningCircleIcon className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
									<div className="space-y-1">
										<p className="font-medium">Warning:</p>
										<ul className="list-disc space-y-1 pl-4 text-xs">
											<li>All analytics data will be permanently deleted</li>
											<li>Tracking will stop immediately</li>
											<li>All website settings will be lost</li>
										</ul>
									</div>
								</div>
							</div>
						</div>
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
					<AlertDialogAction
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						disabled={isDeleting}
						onClick={onConfirmDelete}
					>
						{isDeleting ? 'Deleting...' : 'Delete Website'}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

function PrivacyTab({ isPublic, onTogglePublic, websiteId }: PrivacyTabProps) {
	const shareableLink = `${window.location.origin}/demo/${websiteId}`;

	const handleCopyLink = () => {
		navigator.clipboard.writeText(shareableLink);
		toast.success(TOAST_MESSAGES.SHAREABLE_LINK_COPIED);
	};

	return (
		<Card className="rounded border bg-background shadow-sm">
			<CardContent className="p-6">
				<div className="space-y-6">
					<div>
						<h3 className="mb-2 font-medium text-base">Sharing & Privacy</h3>
						<p className="text-muted-foreground text-sm">
							Control who can access your website's analytics dashboard.
						</p>
					</div>

					<div className="space-y-4">
						{/* Public Access Toggle */}
						<div className="flex items-center justify-between rounded-lg border bg-card/50 p-4">
							<div className="space-y-1">
								<div className="flex items-center gap-2">
									<h4 className="font-medium text-sm">Public Access</h4>
									{isPublic && (
										<span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-green-800 text-xs dark:bg-green-900 dark:text-green-200">
											Enabled
										</span>
									)}
								</div>
								<p className="text-muted-foreground text-xs">
									Allow anyone with the link to view analytics without
									authentication.
								</p>
							</div>
							<Switch
								checked={isPublic}
								className="ml-4"
								id="public-access"
								onCheckedChange={onTogglePublic}
							/>
						</div>

						{/* Shareable Link Section */}
						{isPublic && (
							<div className="space-y-3 rounded-lg border bg-card/50 p-4">
								<div className="flex items-center gap-2">
									<h4 className="font-medium text-sm">Shareable Link</h4>
									<span className="text-muted-foreground text-xs">
										(Read-only access)
									</span>
								</div>

								<div className="flex items-center gap-2">
									<code className="flex-1 break-all rounded bg-muted px-3 py-2 font-mono text-muted-foreground text-sm">
										{shareableLink}
									</code>
									<Button
										className="shrink-0"
										onClick={handleCopyLink}
										size="sm"
										variant="outline"
									>
										<ClipboardIcon className="mr-2 h-4 w-4" />
										Copy Link
									</Button>
								</div>

								<div className="flex items-start gap-2 rounded border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/20">
									<InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
									<div className="text-blue-800 text-xs dark:text-blue-200">
										<strong>Share securely:</strong> This link provides
										view-only access to your analytics. Recipients can see data
										but cannot modify settings or delete the website.
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function ExportTab({
	isExporting,
	onExportData,
	websiteData,
	websiteId: _websiteId,
}: ExportTabProps) {
	const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv');
	const [dateRange, setDateRange] = useState<DayPickerRange | undefined>(
		undefined
	);
	const [useCustomRange, setUseCustomRange] = useState(false);

	const formatOptions = [
		{
			value: 'json' as const,
			label: 'JSON',
			description: 'Structured data format, ideal for developers',
			icon: '📄',
		},
		{
			value: 'csv' as const,
			label: 'CSV',
			description: 'Spreadsheet format, perfect for Excel/Google Sheets',
			icon: '📊',
		},
		{
			value: 'txt' as const,
			label: 'TXT',
			description: 'Plain text format for simple data viewing',
			icon: '📝',
		},
	];

	const handleExport = () => {
		if (useCustomRange && dateRange?.from && dateRange?.to) {
			const startDate = dayjs(dateRange.from).format('YYYY-MM-DD');
			const endDate = dayjs(dateRange.to).format('YYYY-MM-DD');
			onExportData(selectedFormat, startDate, endDate);
		} else {
			onExportData(selectedFormat);
		}
	};

	return (
		<Card className="rounded border bg-background shadow-sm">
			<CardContent className="p-6">
				<div className="space-y-6">
					<div>
						<h3 className="mb-2 font-medium text-base">Data Export</h3>
						<p className="text-muted-foreground text-sm">
							Download your analytics data for backup, analysis, or migration.
						</p>
					</div>

					{/* Export Format Selection */}
					<div className="space-y-4">
						<div>
							<Label className="mb-3 block font-medium text-sm">
								Export Format
							</Label>
							<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
								{formatOptions.map((format) => (
									<button
										className={`rounded-lg border-2 p-4 text-left transition-all hover:border-primary/50 hover:shadow-sm ${
											selectedFormat === format.value
												? 'border-primary bg-primary/5 shadow-sm'
												: 'border-border'
										}`}
										key={format.value}
										onClick={() => setSelectedFormat(format.value)}
										type="button"
									>
										<div className="flex items-start gap-3">
											<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-lg">
												{format.icon}
											</div>
											<div className="min-w-0 flex-1">
												<div className="mb-1 flex items-center gap-2">
													<span className="font-medium text-sm">
														{format.label}
													</span>
													{selectedFormat === format.value && (
														<CheckIcon className="h-4 w-4 flex-shrink-0 text-primary" />
													)}
												</div>
												<p className="text-muted-foreground text-xs leading-relaxed">
													{format.description}
												</p>
											</div>
										</div>
									</button>
								))}
							</div>
						</div>

						{/* Date Range Selection */}
						<div className="space-y-3 rounded-lg border bg-card/50 p-4">
							<div className="flex items-center justify-between">
								<div>
									<h4 className="mb-1 font-medium text-sm">Date Range</h4>
									<p className="text-muted-foreground text-xs">
										{useCustomRange
											? 'Select a specific time period'
											: 'Export all available data'}
									</p>
								</div>
								<Switch
									checked={useCustomRange}
									id="custom-range"
									onCheckedChange={setUseCustomRange}
								/>
							</div>

							{useCustomRange && (
								<div className="border-t pt-2">
									<div className="flex items-center gap-2">
										<Label className="font-medium text-sm">Range:</Label>
										<DateRangePicker
											className="flex-1"
											maxDate={new Date()}
											minDate={new Date(2020, 0, 1)}
											onChange={(range) => setDateRange(range)}
											value={dateRange}
										/>
									</div>
								</div>
							)}
						</div>
					</div>

					{/* Export Actions */}
					<div className="flex items-center justify-between border-t pt-4">
						<div>
							<h4 className="mb-1 font-medium text-sm">
								Ready to export {websiteData.name || 'your website'} data?
							</h4>
							<p className="text-muted-foreground text-xs">
								Format:{' '}
								<span className="font-mono">
									{selectedFormat.toUpperCase()}
								</span>
								{useCustomRange && dateRange?.from && dateRange?.to && (
									<span className="ml-2">
										• {dayjs(dateRange.from).format('MMM D, YYYY')} -{' '}
										{dayjs(dateRange.to).format('MMM D, YYYY')}
									</span>
								)}
							</p>
						</div>

						<Button
							className="min-w-[140px]"
							disabled={
								isExporting ||
								(useCustomRange && !(dateRange?.from && dateRange?.to))
							}
							onClick={handleExport}
							size="lg"
						>
							{isExporting ? (
								<>
									<div className="mr-2 h-4 w-4 animate-spin rounded-full border border-current border-t-transparent" />
									Exporting...
								</>
							) : (
								<>
									<DownloadIcon className="mr-2 h-4 w-4" />
									Export Data
								</>
							)}
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
