"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useWebsites } from "@/hooks/use-websites";
import { useDomains } from "@/hooks/use-domains";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { TrialStatusCard } from "@/components/trial/trial-status-card";

import { WebsiteDialog } from "@/components/website-dialog";
import { EmptyState } from "@/components/websites/empty-state";
import { ErrorState } from "@/components/websites/error-state";
import { WebsiteList } from "@/components/websites/website-list";

function WebsiteLoadingSkeleton() {
  return (
    <div className="rounded-lg border bg-background shadow-sm overflow-hidden">
      <div className="min-w-full text-sm">
        {/* Table Header */}
        <div className="bg-muted/50 border-b flex">
          <div className="w-[60%] py-3 px-4">
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="w-[40%] py-3 px-4">
            <Skeleton className="h-4 w-12" />
          </div>
        </div>
        
        {/* Table Rows */}
        {[1, 2, 3, 4].map((num) => (
          <div key={`website-skeleton-${num}`} className="border-b last:border-b-0 flex">
            <div className="py-3 px-4 align-middle w-[60%]">
              <div className="flex flex-col">
                <div className="flex items-center gap-3 mb-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            <div className="py-3 px-4 align-middle w-[40%]">
              <Skeleton className="h-12 w-full" />
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

  const handleWebsiteCreated = () => {
    refetchWebsites();
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
          <ErrorState onRetry={handleRefresh} />
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
        {isLoading && <WebsiteLoadingSkeleton />}

        {/* Show empty state */}
        {!isLoading && websites.length === 0 && (
          <EmptyState 
            onCreateWebsite={createWebsite} 
            isCreating={isCreating} 
            hasVerifiedDomains={verifiedDomains.length > 0}
            verifiedDomains={verifiedDomains}
          />
        )}

        {/* Show website list view */}
        {!isLoading && websites.length > 0 && (
          <WebsiteList
            websites={websites}
            verifiedDomains={verifiedDomains}
          />
        )}
      </div>

      {/* Dialog component */}
      <WebsiteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        verifiedDomains={verifiedDomains}
        initialValues={initialValues}
        onCreationSuccess={handleWebsiteCreated}
      />
    </div>
  );
} 

export default function Page() {
  return <WebsitesPage />;
}