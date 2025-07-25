'use client';

import { useParams } from 'next/navigation';
import { SessionsList } from './_components';

export default function SessionsPage() {
  const { id: websiteId } = useParams();

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      <SessionsList websiteId={websiteId as string} />
    </div>
  );
}
