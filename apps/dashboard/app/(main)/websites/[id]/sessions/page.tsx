"use client";

import { useParams } from "next/navigation";

import { SessionsList } from "./_components";

export default function SessionsPage() {
  const params = useParams();
  const websiteId = params.id as string;

  return (
    <div className="py-8">
      <SessionsList websiteId={websiteId} />
    </div>
  );
}
