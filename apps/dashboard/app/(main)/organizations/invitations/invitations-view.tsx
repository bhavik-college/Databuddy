'use client';

import {
	CheckIcon,
	ClockIcon,
	EnvelopeIcon,
	XIcon,
} from '@phosphor-icons/react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOrganizationInvitations } from '@/hooks/use-organization-invitations';
import type {
	ActiveOrganization,
	Organization,
} from '@/hooks/use-organizations';
import type { InvitationTab } from '@/stores/jotai/organizationAtoms';
import { InvitationList } from './invitation-list';

function InvitationsSkeleton() {
	return (
		<Card>
			<CardContent className="p-4">
				<div className="space-y-4">
					{Array.from({ length: 3 }).map((_, i) => (
						<div className="flex items-center gap-3" key={i.toString()}>
							<Skeleton className="h-10 w-10 flex-shrink-0 rounded-full" />
							<div className="min-w-0 flex-1 space-y-2">
								<Skeleton className="h-4 w-40" />
								<Skeleton className="h-3 w-32" />
							</div>
							<Skeleton className="h-8 w-16" />
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

function EmptyInvitationsState() {
	return (
		<Card>
			<CardContent className="p-8">
				<div className="flex flex-col items-center justify-center text-center">
					<div className="mx-auto mb-4 w-fit rounded-xl border border-primary/20 bg-primary/10 p-3">
						<EnvelopeIcon
							className="h-6 w-6 text-primary"
							size={24}
							weight="duotone"
						/>
					</div>
					<h3 className="mb-2 font-medium text-base">No Pending Invitations</h3>
					<p className="max-w-sm text-muted-foreground text-sm">
						There are no pending invitations for this organization. All invited
						members have either joined or declined.
					</p>
				</div>
			</CardContent>
		</Card>
	);
}

export function InvitationsView({
	organization,
}: {
	organization: NonNullable<Organization | ActiveOrganization>;
}) {
	const {
		filteredInvitations,
		isLoading: isLoadingInvitations,
		selectedTab,
		isCancelling: isCancellingInvitation,
		pendingCount,
		expiredCount,
		acceptedCount,
		cancelInvitation,
		setTab,
	} = useOrganizationInvitations(organization.id);

	if (isLoadingInvitations) {
		return <InvitationsSkeleton />;
	}

	if (
		!filteredInvitations ||
		(pendingCount === 0 && expiredCount === 0 && acceptedCount === 0)
	) {
		return <EmptyInvitationsState />;
	}

	return (
		<Card>
			<CardContent className="p-0">
				<Tabs className="w-full" onValueChange={setTab} value={selectedTab}>
					<TabsList className="m-4 mb-0 grid grid-cols-3">
						<TabsTrigger className="text-xs" value="pending">
							<ClockIcon className="mr-1 h-3 w-3" size={12} weight="duotone" />
							Pending ({pendingCount})
						</TabsTrigger>
						<TabsTrigger className="text-xs" value="expired">
							<XIcon className="mr-1 h-3 w-3" size={12} weight="duotone" />
							Expired ({expiredCount})
						</TabsTrigger>
						<TabsTrigger className="text-xs" value="accepted">
							<CheckIcon className="mr-1 h-3 w-3" size={12} weight="duotone" />
							Accepted ({acceptedCount})
						</TabsTrigger>
					</TabsList>

					<TabsContent className="p-4 pt-4" value="pending">
						{pendingCount > 0 ? (
							<InvitationList
								invitations={filteredInvitations}
								isCancellingInvitation={isCancellingInvitation}
								onCancelInvitationAction={cancelInvitation}
							/>
						) : (
							<div className="py-8 text-center text-muted-foreground text-sm">
								No pending invitations
							</div>
						)}
					</TabsContent>

					<TabsContent className="p-4 pt-4" value="expired">
						{expiredCount > 0 ? (
							<InvitationList
								invitations={filteredInvitations}
								isCancellingInvitation={isCancellingInvitation}
								onCancelInvitationAction={cancelInvitation}
							/>
						) : (
							<div className="py-8 text-center text-muted-foreground text-sm">
								No expired invitations
							</div>
						)}
					</TabsContent>

					<TabsContent className="p-4 pt-4" value="accepted">
						{acceptedCount > 0 ? (
							<InvitationList
								invitations={filteredInvitations}
								isCancellingInvitation={isCancellingInvitation}
								onCancelInvitationAction={cancelInvitation}
							/>
						) : (
							<div className="py-8 text-center text-muted-foreground text-sm">
								No accepted invitations
							</div>
						)}
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
}
