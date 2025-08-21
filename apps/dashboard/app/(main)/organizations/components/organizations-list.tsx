'use client';

import {
	ArrowRightIcon,
	BuildingsIcon,
	CalendarIcon,
	CheckIcon,
	GearIcon,
	TrashIcon,
} from '@phosphor-icons/react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import Link from 'next/link';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import {
	type ActiveOrganization,
	type Organization,
	useOrganizations,
} from '@/hooks/use-organizations';
import { cn, getOrganizationInitials } from '@/lib/utils';

dayjs.extend(relativeTime);

interface OrganizationsListProps {
	organizations: Organization[];
	activeOrganization: ActiveOrganization;
	isLoading: boolean;
}

function OrganizationSkeleton() {
	return (
		<Card className="group relative overflow-hidden">
			<CardContent className="p-4">
				<div className="flex items-center gap-3">
					<Skeleton className="h-10 w-10 flex-shrink-0 rounded-full" />
					<div className="min-w-0 flex-1 space-y-2">
						<Skeleton className="h-4 w-32" />
						<Skeleton className="h-3 w-20" />
					</div>
				</div>
				<div className="mt-4 space-y-2">
					<Skeleton className="h-8 w-full" />
					<div className="flex gap-2">
						<Skeleton className="h-8 flex-1" />
						<Skeleton className="h-8 w-8" />
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function EmptyState() {
	return (
		<div className="flex h-[400px] flex-col items-center justify-center text-center">
			<div className="mx-auto mb-6 w-fit rounded-xl border border-primary/20 bg-primary/10 p-4">
				<BuildingsIcon
					className="h-8 w-8 text-primary"
					size={32}
					weight="duotone"
				/>
			</div>
			<h3 className="mb-2 font-semibold text-lg">No Organizations Yet</h3>
			<p className="mb-6 max-w-sm text-muted-foreground text-sm">
				Create your first organization to start managing your team and projects.
			</p>
		</div>
	);
}

export function OrganizationsList({
	organizations,
	activeOrganization,
	isLoading,
}: OrganizationsListProps) {
	const {
		setActiveOrganization,
		deleteOrganizationAsync,
		isSettingActiveOrganization,
		isDeletingOrganization,
	} = useOrganizations();
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [confirmDelete, setConfirmDelete] = useState<{
		id: string;
		name: string;
	} | null>(null);

	const handleSetActive = (organizationId: string) => {
		setActiveOrganization(organizationId);
	};

	const handleDelete = (organizationId: string, organizationName: string) => {
		setConfirmDelete({ id: organizationId, name: organizationName });
	};

	const confirmDeleteAction = async () => {
		if (!confirmDelete) {
			return;
		}
		setDeletingId(confirmDelete.id);
		try {
			await deleteOrganizationAsync(confirmDelete.id);
		} catch (_error) {
			toast.error('Failed to delete organization');
		} finally {
			setDeletingId(null);
			setConfirmDelete(null);
		}
	};

	if (isLoading) {
		return (
			<div className="space-y-4">
				<div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: 6 }).map((_, i) => (
						<OrganizationSkeleton key={i.toString()} />
					))}
				</div>
			</div>
		);
	}

	if (!organizations || organizations.length === 0) {
		return <EmptyState />;
	}

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
				{organizations.map((org) => {
					const isActive = activeOrganization?.id === org.id;
					const isDeleting = deletingId === org.id;

					return (
						<Card
							className={cn(
								'group relative overflow-hidden transition-all duration-200 hover:shadow-sm',
								isActive
									? 'border-primary/30 bg-primary/5 shadow-sm'
									: 'hover:border-border/60 hover:bg-muted/30'
							)}
							key={org.id}
						>
							{isActive && (
								<div className="absolute top-2 right-2">
									<Badge
										className="border-primary/20 bg-primary/10 text-primary text-xs"
										variant="secondary"
									>
										<CheckIcon className="mr-1 h-3 w-3" size={12} />
										Active
									</Badge>
								</div>
							)}

							<CardContent className="p-4">
								<div className="space-y-4">
									{/* Organization Info */}
									<div className="flex items-center gap-3">
										<Avatar className="h-10 w-10 flex-shrink-0 border border-border/30">
											<AvatarImage alt={org.name} src={org.logo || undefined} />
											<AvatarFallback className="bg-accent font-medium text-xs">
												{getOrganizationInitials(org.name)}
											</AvatarFallback>
										</Avatar>
										<div className="min-w-0 flex-1">
											<h3 className="truncate font-medium text-sm">
												{org.name}
											</h3>
											<p className="truncate text-muted-foreground text-xs">
												@{org.slug}
											</p>
											<div className="mt-1 flex items-center gap-1">
												<CalendarIcon
													className="h-3 w-3 text-muted-foreground"
													size={12}
												/>
												<span className="text-muted-foreground text-xs">
													{dayjs(org.createdAt).fromNow()}
												</span>
											</div>
										</div>
									</div>

									{/* Actions */}
									<div className="space-y-2">
										{isActive ? (
											<Button
												className="h-8 w-full rounded text-xs"
												disabled
												size="sm"
												variant="secondary"
											>
												<CheckIcon className="mr-2 h-3 w-3" size={12} />
												Current Organization
											</Button>
										) : (
											<Button
												className="h-8 w-full rounded text-xs"
												disabled={isSettingActiveOrganization}
												onClick={() => handleSetActive(org.id)}
												size="sm"
											>
												{isSettingActiveOrganization ? (
													<>
														<div className="mr-2 h-3 w-3 animate-spin rounded-full border border-primary-foreground/30 border-t-primary-foreground" />
														Switching...
													</>
												) : (
													<>
														<ArrowRightIcon
															className="mr-2 h-3 w-3"
															size={12}
														/>
														Switch to This
													</>
												)}
											</Button>
										)}

										<div className="flex items-center gap-2">
											<TooltipProvider>
												<Tooltip>
													<TooltipTrigger asChild>
														<Button
															asChild
															className="h-8 flex-1 rounded text-xs"
															size="sm"
															variant="outline"
														>
															<Link href="/organizations2/settings">
																<GearIcon className="mr-2 h-3 w-3" size={12} />
																Settings
															</Link>
														</Button>
													</TooltipTrigger>
													<TooltipContent side="bottom">
														<p>Organization settings</p>
													</TooltipContent>
												</Tooltip>
											</TooltipProvider>

											<TooltipProvider>
												<Tooltip>
													<TooltipTrigger asChild>
														<Button
															className="h-8 w-8 rounded p-0 hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
															disabled={isDeleting || isDeletingOrganization}
															onClick={() => handleDelete(org.id, org.name)}
															size="sm"
															variant="outline"
														>
															{isDeleting ? (
																<div className="h-3 w-3 animate-spin rounded-full border border-destructive/30 border-t-destructive" />
															) : (
																<TrashIcon className="h-3 w-3" size={12} />
															)}
														</Button>
													</TooltipTrigger>
													<TooltipContent side="bottom">
														<p>Delete organization</p>
													</TooltipContent>
												</Tooltip>
											</TooltipProvider>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					);
				})}
			</div>

			<AlertDialog
				onOpenChange={(open) => !open && setConfirmDelete(null)}
				open={!!confirmDelete}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete organization</AlertDialogTitle>
						<AlertDialogDescription>
							This will permanently delete "{confirmDelete?.name}" and all
							associated resources. This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							onClick={confirmDeleteAction}
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
