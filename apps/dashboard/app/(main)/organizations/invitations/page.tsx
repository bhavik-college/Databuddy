'use client';

import { Suspense } from 'react';
import { useOrganizations } from '@/hooks/use-organizations';
import { InvitationsView } from './invitations-view';

const ComponentSkeleton = () => (
	<div className="space-y-4">
		<div className="h-32 w-full animate-pulse rounded bg-muted" />
		<div className="h-24 w-full animate-pulse rounded bg-muted" />
	</div>
);

export default function InvitationsPage() {
	const { activeOrganization } = useOrganizations();

	if (!activeOrganization) {
		return null;
	}

	return (
		<Suspense fallback={<ComponentSkeleton />}>
			<InvitationsView organization={activeOrganization} />
		</Suspense>
	);
}
