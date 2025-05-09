"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WebsiteDialog } from "@/components/website-dialog";
import { useWebsites } from "@/hooks/use-websites";
import { useDomains } from "@/hooks/use-domains";
import { LoadingState } from "@/components/websites/loading-state";
import { EmptyState } from "@/components/websites/empty-state";
import { ErrorState } from "@/components/websites/error-state";
import { WebsiteCard } from "@/components/websites/website-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

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
    return <ErrorState onRetry={handleRefresh} />;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Websites</h1>
          <p className="text-muted-foreground mt-1">
            Manage your websites for analytics tracking
          </p>
        </div>
        <Button 
          size="default" 
          className="h-10"
          onClick={handleOpenDialog}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Website
        </Button>
      </div>

      {/* Show no verified domains message */}
      {!isLoading && verifiedDomains.length === 0 && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No verified domains available</AlertTitle>
          <AlertDescription>
            You need at least one verified domain to create a website. 
            <Link href="/domains" className="ml-1 font-medium hover:underline">
              Go to Domains page
            </Link> to add and verify domains.
          </AlertDescription>
        </Alert>
      )}

      {/* Show loading state */}
      {isLoading && <LoadingState />}

      {/* Show empty state */}
      {!isLoading && websites.length === 0 && (
        <EmptyState 
          onCreateWebsite={createWebsite} 
          isCreating={isCreating} 
          hasVerifiedDomains={verifiedDomains.length > 0}
          verifiedDomains={verifiedDomains}
        />
      )}

      {/* Show website grid */}
      {!isLoading && websites.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {websites.map((website: typeof websites.$inferSelect) => (
            <WebsiteCard
              key={website.id}
              website={website}
              onUpdate={(id, data) => updateWebsite({ id, data })}
              isUpdating={isUpdating}
            />
          ))}
        </div>
      )}

      {/* Separate dialog component */}
      <WebsiteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={createWebsite}
        isLoading={isCreating}
        verifiedDomains={verifiedDomains}
        initialValues={initialValues}
      />
    </div>
  );
} 

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WebsitesPage />
    </Suspense>
  )
}