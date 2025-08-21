'use client';

import { UsersIcon } from '@phosphor-icons/react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
	type ActiveOrganization,
	type Organization,
	useOrganizationMembers,
} from '@/hooks/use-organizations';
import { MemberList } from './member-list';

function MembersSkeleton() {
	return (
		<Card>
			<CardContent className="p-4">
				<div className="space-y-4">
					{Array.from({ length: 3 }).map((_, i) => (
						<div className="flex items-center gap-3" key={i.toString()}>
							<Skeleton className="h-10 w-10 flex-shrink-0 rounded-full" />
							<div className="min-w-0 flex-1 space-y-2">
								<Skeleton className="h-4 w-32" />
								<Skeleton className="h-3 w-24" />
							</div>
							<Skeleton className="h-8 w-20" />
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

function EmptyMembersState() {
	return (
		<Card>
			<CardContent className="p-8">
				<div className="flex flex-col items-center justify-center text-center">
					<div className="mx-auto mb-4 w-fit rounded-xl border border-primary/20 bg-primary/10 p-3">
						<UsersIcon
							className="h-6 w-6 text-primary"
							size={24}
							weight="duotone"
						/>
					</div>
					<h3 className="mb-2 font-medium text-base">No Team Members</h3>
					<p className="max-w-sm text-muted-foreground text-sm">
						This organization doesn't have any team members yet. Invite people
						to start collaborating.
					</p>
				</div>
			</CardContent>
		</Card>
	);
}

function ErrorState({ error }: { error: Error }) {
	return (
		<Card>
			<CardContent className="p-8">
				<div className="flex flex-col items-center justify-center text-center">
					<div className="mx-auto mb-4 w-fit rounded-xl border border-destructive/20 bg-destructive/10 p-3">
						<UsersIcon
							className="h-6 w-6 text-destructive"
							size={24}
							weight="duotone"
						/>
					</div>
					<h3 className="mb-2 font-medium text-base text-destructive">
						Failed to Load Members
					</h3>
					<p className="max-w-sm text-muted-foreground text-sm">
						{error.message}
					</p>
				</div>
			</CardContent>
		</Card>
	);
}

export function MembersView({
	organization,
}: {
	organization: NonNullable<Organization | ActiveOrganization>;
}) {
	const {
		members,
		isLoading: isLoadingMembers,
		removeMember,
		isRemovingMember,
		updateMember,
		isUpdatingMember,
		error: membersError,
	} = useOrganizationMembers(organization.id);

	if (isLoadingMembers) {
		return <MembersSkeleton />;
	}

	if (membersError) {
		return <ErrorState error={membersError} />;
	}

	if (!members || members.length === 0) {
		return <EmptyMembersState />;
	}

	return (
		<Card>
			<CardContent className="p-4">
				<MemberList
					isRemovingMember={isRemovingMember}
					isUpdatingMember={isUpdatingMember}
					members={members}
					onRemoveMember={removeMember}
					onUpdateRole={updateMember}
					organizationId={organization.id}
				/>
			</CardContent>
		</Card>
	);
}
