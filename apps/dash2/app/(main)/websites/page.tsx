"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useWebsites } from "@/hooks/use-websites";
import { useDomains } from "@/hooks/use-domains";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { TrialStatusCard } from "@/components/trial/trial-status-card";

// Dynamic imports with proper loading states
const WebsiteDialog = dynamic(
  () => import("@/components/website-dialog").then(mod => ({ default: mod.WebsiteDialog })),
  {
    loading: () => <div />, // Dialog doesn't need visible loading state
    ssr: false
  }
);

const LoadingState = dynamic(
  () => import("@/components/websites/loading-state").then(mod => ({ default: mod.LoadingState })),
  {
    loading: () => <WebsiteLoadingSkeleton />,
    ssr: false
  }
);

const EmptyState = dynamic(
  () => import("@/components/websites/empty-state").then(mod => ({ default: mod.EmptyState })),
  {
    loading: () => <WebsiteLoadingSkeleton />,
    ssr: false
  }
);

const ErrorState = dynamic(
  () => import("@/components/websites/error-state").then(mod => ({ default: mod.ErrorState })),
  {
    loading: () => <WebsiteLoadingSkeleton />,
    ssr: false
  }
);

const WebsiteList = dynamic(
  () => import("@/components/websites/website-list").then(mod => ({ default: mod.WebsiteList })),
  {
    loading: () => <WebsiteLoadingSkeleton />,
    ssr: false
  }
);

// Loading skeleton component for website components - mobile optimized
function WebsiteLoadingSkeleton() {
  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {[1, 2, 3, 4, 5, 6].map((num) => (
          <div key={`website-skeleton-${num}`} className="rounded-lg border p-3 sm:p-4 space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 sm:h-5 w-24 sm:w-32" />
              <Skeleton className="h-3 sm:h-4 w-3 sm:w-4 rounded-full" />
            </div>
            <Skeleton className="h-3 sm:h-4 w-full max-w-[200px] sm:max-w-[240px]" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 sm:h-6 w-12 sm:w-16" />
              <Skeleton className="h-5 sm:h-6 w-16 sm:w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WebsitesPage() {
  const searchParams = useSearchParams();
  const shouldOpenDialog = searchParams.get('new') === 'true';
  const domainFromParams = searchParams.get('domain');
  const domainIdFromParams = searchParams.get('domainId');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [initialValues, setInitialValues] = useState<{name?: string, domain?: string, domainId?: string} | null>(null);
  
  const {
    websites,
    isLoading: isLoadingWebsites,
    isError: isWebsitesError,
    isCreating,
    isUpdating,
    createWebsite,
    updateWebsite,
    refetch: refetchWebsites,
  } = useWebsites();

  const {
    verifiedDomains,
    isLoading: isLoadingDomains,
    isError: isDomainsError,
    refetch: refetchDomains
  } = useDomains();

  // Handle the query parameters
  useEffect(() => {
    if (shouldOpenDialog) {
      if (domainFromParams || domainIdFromParams) {
        const values: {name?: string, domain?: string, domainId?: string} = {};
        
        if (domainFromParams) {
          // Set website name to domain name without TLD by default
          const nameSuggestion = domainFromParams.split('.')[0];
          values.name = nameSuggestion.charAt(0).toUpperCase() + nameSuggestion.slice(1);
          values.domain = domainFromParams;
        }
        
        if (domainIdFromParams) {
          values.domainId = domainIdFromParams;
        }
        
        setInitialValues(values);
      } else {
        setInitialValues(null);
      }
      setDialogOpen(true);
    }
  }, [shouldOpenDialog, domainFromParams, domainIdFromParams]);

  // Combined loading and error states
  const isLoading = isLoadingWebsites || isLoadingDomains;
  const isError = isWebsitesError || isDomainsError;
  
  const handleRefresh = () => {
    refetchWebsites();
    refetchDomains();
  };

  // Handle opening the dialog
  const handleOpenDialog = () => {
    setInitialValues(null);
    setDialogOpen(true);
  };

  if (isError) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-3 sm:p-4">
          <Suspense fallback={<WebsiteLoadingSkeleton />}>
            <ErrorState onRetry={handleRefresh} />
          </Suspense>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col animate-fadeIn">
      {/* Mobile-optimized header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:px-4 sm:py-4 border-b gap-3 sm:gap-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
            Websites
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 line-clamp-2 sm:line-clamp-1">
            Manage your websites for analytics tracking
          </p>
        </div>
        <Button 
          size="default" 
          className="h-9 sm:h-9 text-sm sm:text-base text-primary-foreground btn-hover-effect w-full sm:w-auto touch-manipulation"
          onClick={handleOpenDialog}
        >
          <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="truncate">Add Website</span>
        </Button>
      </div>

      {/* Mobile-optimized content area */}
      <div className="flex-1 overflow-y-auto p-3 sm:px-4 sm:pt-4 sm:pb-6">
        {/* Trial Status Card */}
        <TrialStatusCard />

        {/* Show no verified domains message - mobile optimized */}
        {!isLoading && verifiedDomains.length === 0 && (
          <Alert className="mb-3 sm:mb-4 border-warning/40 bg-[color-mix(in_oklch,var(--background),var(--warning)_5%)] text-warning">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <div className="min-w-0">
              <AlertTitle className="text-sm sm:text-base">No verified domains available</AlertTitle>
              <AlertDescription className="text-xs sm:text-sm">
                You need at least one verified domain to create a website.{" "}
                <Link 
                  href="/domains" 
                  className="font-medium text-primary hover:underline touch-manipulation inline-block"
                >
                  Go to Domains page
                </Link>{" "}
                to add and verify domains.
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* Show loading state */}
        {isLoading && (
          <Suspense fallback={<WebsiteLoadingSkeleton />}>
            <LoadingState />
          </Suspense>
        )}

        {/* Show empty state */}
        {!isLoading && websites.length === 0 && (
          <Suspense fallback={<WebsiteLoadingSkeleton />}>
            <EmptyState 
              onCreateWebsite={createWebsite} 
              isCreating={isCreating} 
              hasVerifiedDomains={verifiedDomains.length > 0}
              verifiedDomains={verifiedDomains}
            />
          </Suspense>
        )}

        {/* Show website list view */}
        {!isLoading && websites.length > 0 && (
          <Suspense fallback={<WebsiteLoadingSkeleton />}>
            <WebsiteList
              websites={websites}
              onUpdate={(id: string, name: string) => updateWebsite({ id, name })}
              isUpdating={isUpdating}
              verifiedDomains={verifiedDomains}
            />
          </Suspense>
        )}
      </div>

      {/* Separate dialog component */}
      <Suspense fallback={<div />}>
        <WebsiteDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          isLoading={isCreating}
          verifiedDomains={verifiedDomains}
          initialValues={initialValues}
        />
      </Suspense>
    </div>
  );
} 

export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full p-3 sm:p-4">
        <div className="space-y-3 sm:space-y-4 w-full max-w-4xl">
          {/* Mobile-optimized loading header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
            <div className="space-y-2 min-w-0 flex-1">
              <Skeleton className="h-6 sm:h-8 w-24 sm:w-32" />
              <Skeleton className="h-3 sm:h-4 w-full max-w-[200px] sm:max-w-[300px]" />
            </div>
            <Skeleton className="h-9 w-full sm:w-32" />
          </div>
          <WebsiteLoadingSkeleton />
        </div>
      </div>
    }>
      <WebsitesPage />
    </Suspense>
  )
}