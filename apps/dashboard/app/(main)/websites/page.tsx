"use client";

import { useState } from 'react';
import { PlusIcon, GlobeIcon, ChartLineIcon, SparkleIcon, TrendUpIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useWebsites } from '@/hooks/use-websites';
import { useDomains } from '@/hooks/use-domains';
import { WebsiteDialog } from '@/components/website-dialog';
import { WebsiteCard } from './_components/website-card';
import { cn } from '@/lib/utils';

function WebsiteLoadingSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[1, 2, 3, 4, 5, 6].map((num) => (
        <Card key={`website-skeleton-${num}`} className="overflow-hidden animate-pulse">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32 rounded" />
                <div className="flex items-center gap-1">
                  <Skeleton className="h-3 w-3 rounded" />
                  <Skeleton className="h-3 w-24 rounded" />
                </div>
              </div>
              <Skeleton className="h-4 w-4 rounded" />
            </div>
          </CardHeader>
          <CardContent className="pt-0 pb-3">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-12 rounded" />
                <Skeleton className="h-3 w-8 rounded" />
              </div>
              <Skeleton className="h-12 w-full rounded" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EnhancedEmptyState({ onAddWebsite }: { onAddWebsite: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="relative mb-8">
        <div className="rounded-full bg-muted/50 p-8 border">
          <GlobeIcon size={64} weight="duotone" className="h-16 w-16 text-muted-foreground" />
        </div>
        <div className="absolute -top-2 -right-2 p-2 rounded-full bg-primary/10 border border-primary/20">
          <ChartLineIcon size={24} weight="fill" className="h-6 w-6 text-primary" />
        </div>
      </div>

      <h3 className="text-2xl font-bold mb-4">No Websites Yet</h3>
      <p className="text-muted-foreground mb-8 max-w-md leading-relaxed">
        Start tracking your website analytics by adding your first website. Get insights into visitors, pageviews, and performance.
      </p>

      <Button
        size="lg"
        onClick={onAddWebsite}
        data-track="websites-add-first-website"
        data-section="empty-state"
        data-button-type="primary-cta"
        className={cn(
          "gap-2 px-8 py-4 font-medium text-base",
          "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary",
          "shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
        <PlusIcon size={24} className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300 relative z-10" />
        <span className="relative z-10">Add First Website</span>
      </Button>

      <div className="bg-muted/50 rounded-xl p-6 max-w-md border mt-8">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <SparkleIcon size={24} weight="fill" className="h-5 w-5 text-primary" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-sm mb-2">💡 Quick tip</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Add your tracking script to start collecting analytics data. You'll see beautiful charts and insights within minutes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="rounded-full bg-red-50 p-8 border border-red-200 mb-8">
        <GlobeIcon size={64} weight="duotone" className="h-16 w-16 text-red-500" />
      </div>
      <h3 className="text-2xl font-bold mb-4">Failed to Load Websites</h3>
      <p className="text-muted-foreground mb-8 max-w-md leading-relaxed">
        There was an issue fetching your websites. Please check your connection and try again.
      </p>
      <Button onClick={onRetry} variant="outline" size="lg" data-track="websites-retry-load" data-section="error-state">
        Try Again
      </Button>
    </div>
  );
}

export default function WebsitesPage() {
  const { websites, isLoading, isError, refetch } = useWebsites();
  const { verifiedDomains } = useDomains();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleRetry = () => {
    refetch();
  };

  const handleWebsiteCreated = () => {
    refetch();
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Enhanced header */}
      <div className="border-b bg-gradient-to-r from-background via-background to-muted/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:px-4 sm:py-4 gap-3 sm:gap-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 animate-pulse">
                <TrendUpIcon size={24} weight="fill" className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
                  Websites
                </h1>
                <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
                  Track analytics for all your websites
                </p>
              </div>
            </div>
          </div>
          <Button
            size="default"
            onClick={() => setDialogOpen(true)}
            data-track="websites-new-website-header"
            data-section="header"
            data-button-type="primary"
            className={cn(
              "gap-2 w-full sm:w-auto px-6 py-3 font-medium",
              "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary",
              "shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <PlusIcon size={24} className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300 relative z-10" />
            <span className="truncate relative z-10">New Website</span>
          </Button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto p-3 sm:px-4 sm:pt-4 sm:pb-6">
        {/* Website count indicator */}
        {!isLoading && websites && websites.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 rounded-lg px-3 py-2 border border-muted">
              <GlobeIcon size={24} weight="duotone" className="h-4 w-4 flex-shrink-0" />
              <span>
                Tracking <span className="font-medium text-foreground">{websites.length}</span> website{websites.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}

        {/* Show loading state */}
        {isLoading && <WebsiteLoadingSkeleton />}

        {/* Show error state */}
        {isError && <ErrorState onRetry={handleRetry} />}

        {/* Show empty state */}
        {!isLoading && !isError && websites && websites.length === 0 && <EnhancedEmptyState onAddWebsite={() => setDialogOpen(true)} />}

        {/* Show website grid */}
        {!isLoading && !isError && websites && websites.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
            {websites.map((website, index) => (
              <div
                key={website.id}
                className="animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <WebsiteCard website={website} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Website Dialog */}
      <WebsiteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        verifiedDomains={verifiedDomains}
        onCreationSuccess={handleWebsiteCreated}
      />
    </div>
  );
}