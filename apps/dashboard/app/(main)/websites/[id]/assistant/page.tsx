"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { useParams } from "next/navigation";
import { useWebsite } from "@/hooks/use-websites";

const AIAssistantMain = dynamic(
  () => import("./components/ai-assistant-main"),
  { 
    loading: () => <AIAssistantLoadingSkeleton />,
    ssr: false 
  }
);

function AIAssistantLoadingSkeleton() {
  return (
    <div className="flex flex-1 p-3 gap-3 overflow-hidden">
      {/* Chat Section Skeleton */}
      <div className="flex-[2_2_0%] rounded-lg border bg-background shadow-sm flex flex-col overflow-hidden">
        <div className="p-3 border-b flex-shrink-0">
          <Skeleton className="h-5 w-32 mb-1" />
          <Skeleton className="h-3 w-48" />
        </div>
        <div className="flex-1 p-3 space-y-3 overflow-y-auto">
          <div className="flex gap-2">
            <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
            <Skeleton className="h-16 w-3/4 rounded-lg" />
          </div>
          <div className="flex gap-2 ml-auto flex-row-reverse">
            <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
            <Skeleton className="h-10 w-1/2 rounded-lg" />
          </div>
        </div>
        <div className="p-3 border-t flex-shrink-0">
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
      </div>

      {/* Visualization Section Skeleton */}
      <div className="flex-[3_3_0%] rounded-lg border bg-background shadow-sm flex flex-col overflow-hidden">
        <div className="p-3 border-b flex-shrink-0">
          <Skeleton className="h-5 w-32 mb-1" />
        </div>
        <div className="flex-1 p-3">
          <Skeleton className="h-full w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function AssistantPage() {
  const { id } = useParams();
  
  const { data: websiteData, isLoading } = useWebsite(id as string);

  // This div structure is crucial for correct layout and scrolling
  return (
    <div className="fixed inset-0 pt-16 md:pl-72 flex flex-col bg-gradient-to-br from-background to-muted/20">
      {/* This inner div will handle the actual content area and padding */}
      <div className="flex flex-1 p-3 overflow-hidden">
        {isLoading || !websiteData ? (
          <AIAssistantLoadingSkeleton />
        ) : (
          <Suspense fallback={<AIAssistantLoadingSkeleton />}>
            <AIAssistantMain 
              websiteId={id as string}
              websiteData={websiteData}
              dateRange={{
                start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                end_date: new Date().toISOString(),
                granularity: 'daily'
              }}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
} 