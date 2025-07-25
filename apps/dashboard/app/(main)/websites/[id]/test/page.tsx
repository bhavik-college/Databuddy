'use client';

import { useParams } from 'next/navigation';
import { SessionsList } from '../sessions/_components';

export default function TestPage() {
  const params = useParams();
  const websiteId = params.id as string;

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="mb-2 font-bold text-2xl text-foreground">
          Sessions Test Page
        </h1>
        <p className="text-muted-foreground">
          Testing the sessions functionality with infinite scrolling and
          filtering
        </p>
      </div>

      <SessionsList websiteId={websiteId} />
    </div>
  );
}
