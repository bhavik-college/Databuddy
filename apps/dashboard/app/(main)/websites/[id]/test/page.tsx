"use client";

import { useParams } from "next/navigation";
import { SessionsList } from "../sessions/_components";

export default function TestPage() {
  const params = useParams();
  const websiteId = params.id as string;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Sessions Test Page</h1>
        <p className="text-muted-foreground">
          Testing the sessions functionality with infinite scrolling and filtering
        </p>
      </div>

      <SessionsList websiteId={websiteId} />
    </div>
  );
}