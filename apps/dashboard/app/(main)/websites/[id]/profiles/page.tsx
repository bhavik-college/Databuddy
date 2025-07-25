'use client';

import { useParams } from 'next/navigation';
import { ProfilesList } from './_components';

export default function ProfilesPage() {
  const { id: websiteId } = useParams();

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      <ProfilesList websiteId={websiteId as string} />
    </div>
  );
}
