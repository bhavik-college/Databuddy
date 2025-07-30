'use client';

import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { SpinnerIcon } from '@phosphor-icons/react';

const ProfilesList = dynamic(() => import('./_components').then(mod => ({ default: mod.ProfilesList })), {
	loading: () => (
		<div className="flex items-center justify-center p-8">
			<SpinnerIcon className="h-6 w-6 animate-spin" />
		</div>
	),
	ssr: false
});

export default function ProfilesPage() {
	const { id: websiteId } = useParams();

	return (
		<div className="p-3 sm:p-4 lg:p-6">
			<ProfilesList websiteId={websiteId as string} />
		</div>
	);
}
