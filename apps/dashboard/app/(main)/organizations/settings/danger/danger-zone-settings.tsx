'use client';

import { TrashIcon, WarningIcon } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
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
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { type Organization, useOrganizations } from '@/hooks/use-organizations';
import { TransferAssets } from './transfer-assets';

interface DangerZoneSettingsProps {
	organization: Organization;
}

export function DangerZoneSettings({ organization }: DangerZoneSettingsProps) {
	const router = useRouter();
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const { deleteOrganizationAsync } = useOrganizations();

	const handleDelete = async () => {
		setIsDeleting(true);
		try {
			await deleteOrganizationAsync(organization.id);
			toast.success('Organization deleted successfully');
			router.push('/organizations2');
		} catch (_error) {
			toast.error('Failed to delete organization');
		} finally {
			setIsDeleting(false);
			setShowDeleteDialog(false);
		}
	};

	return (
		<div className="space-y-6">
			<Card className="border-destructive/20">
				<CardHeader>
					<div className="flex items-center gap-2">
						<div className="rounded border border-destructive/20 bg-destructive/10 p-2">
							<WarningIcon
								className="h-5 w-5 text-destructive"
								size={16}
								weight="duotone"
							/>
						</div>
						<div>
							<CardTitle className="text-destructive">Danger Zone</CardTitle>
							<CardDescription>
								Irreversible and destructive actions for this organization.
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Transfer Assets Section */}
					<TransferAssets organizationId={organization.id} />

					{/* Delete Organization Section */}
					<div className="rounded border border-destructive/20 bg-destructive/5 p-4">
						<div className="flex items-start justify-between">
							<div className="flex-1">
								<h4 className="font-medium text-destructive">
									Delete Organization
								</h4>
								<p className="mt-1 text-destructive/80 text-sm">
									Once you delete an organization, there is no going back.
									Please be certain.
								</p>
							</div>
							<Button
								className="ml-4 rounded"
								onClick={() => setShowDeleteDialog(true)}
								size="sm"
								variant="destructive"
							>
								<TrashIcon className="mr-2 h-4 w-4" size={16} />
								Delete Organization
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Delete Confirmation Dialog */}
			<AlertDialog onOpenChange={setShowDeleteDialog} open={showDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will permanently delete the
							organization "{organization.name}" and remove all associated data.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							disabled={isDeleting}
							onClick={handleDelete}
						>
							{isDeleting ? (
								<>
									<div className="mr-2 h-4 w-4 animate-spin rounded-full border border-destructive-foreground/30 border-t-destructive-foreground" />
									Deleting...
								</>
							) : (
								'Delete Organization'
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
