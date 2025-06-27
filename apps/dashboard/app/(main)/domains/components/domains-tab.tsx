"use client";

import {
  CaretDownIcon,
  CaretRightIcon,
  ClockClockwiseIcon,
  GlobeIcon,
  PlusIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { formatDistanceToNow } from "date-fns";
import React from "react";
import { FaviconImage } from "@/components/analytics/favicon-image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDomainManagement } from "../hooks/use-domain-management";
import type { Domain } from "../types";
import { copyToClipboard } from "../utils";
import { DomainRowActions } from "./domain-row-actions";
import { StatusBadge } from "./status-badge";
import { VerificationDetails } from "./verification-details";

export function DomainsTab() {
  const {
    state,
    actions,
    updateActions,
    toggleExpanded,
    handleVerifyDomain,
    handleDeleteDomain,
    handleRegenerateToken,
    handleRetryFailedDomain,
    handleCreateWebsite,
    fetchDomains,
  } = useDomainManagement();

  const domains = state.domains;

  // Separate domains by verification status
  const verifiedDomains = domains.filter((domain) => domain.verificationStatus === "VERIFIED");
  const unverifiedDomains = domains.filter((domain) => domain.verificationStatus !== "VERIFIED");

  const LoadingSkeleton = () => (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, i) => (
        <Card className="animate-pulse border" key={i}>
          <CardContent className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex flex-1 items-center space-x-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="h-3 w-16 rounded" />
                </div>
              </div>
              <Skeleton className="h-6 w-16 rounded" />
            </div>
            <div className="space-y-2 border-t pt-2">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-16 rounded" />
                <Skeleton className="h-3 w-24 rounded" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-3 w-12 rounded" />
                <Skeleton className="h-3 w-20 rounded" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const DomainCard = ({ domain }: { domain: Domain }) => {
    const isVerifying = actions.isVerifying[domain.id];
    const isExpanded = state.expandedDomains.has(domain.id);
    const canExpand =
      domain.verificationStatus === "PENDING" || domain.verificationStatus === "FAILED";
    const isRetrying = actions.retryingDomains[domain.id];

    return (
      <Card className="group hover:-translate-y-1 flex h-full flex-col border bg-card transition-all duration-300 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/5">
        {/* Removed pt-4 */}
        <CardContent className="flex flex-grow flex-col px-4 pb-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex min-w-0 flex-1 items-center space-x-3">
              {canExpand && (
                <Button
                  className="h-6 w-6 flex-shrink-0 p-0 transition-colors hover:bg-muted/60"
                  data-domain-name={domain.name}
                  data-section="domains"
                  data-track="domain-expand-toggle"
                  onClick={() => toggleExpanded(domain.id)}
                  size="icon"
                  variant="ghost"
                >
                  {isExpanded ? (
                    <CaretDownIcon className="h-3 w-3" size={16} weight="fill" />
                  ) : (
                    <CaretRightIcon className="h-3 w-3" size={16} weight="fill" />
                  )}
                </Button>
              )}
              <div className="relative">
                <FaviconImage
                  className="h-8 w-8 flex-shrink-0 rounded-full"
                  domain={domain.name}
                  size={32}
                />
                {isVerifying && (
                  <div className="-top-0.5 -right-0.5 absolute h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold text-base transition-colors group-hover:text-primary">
                  {domain.name}
                </h3>
                <div className="mt-1">
                  <StatusBadge isRetrying={isRetrying} status={domain.verificationStatus} />
                </div>
              </div>
            </div>

            <div className="ml-3 flex-shrink-0">
              <DomainRowActions
                actions={actions}
                domain={domain}
                domainIsVerifying={isVerifying}
                domainVerificationProgress={actions.verificationProgress[domain.id] || 0}
                isRetrying={isRetrying}
                onCreate={() => handleCreateWebsite(domain.id, domain.name)}
                onDelete={() => handleDeleteDomain(domain.id)}
                onRegenerate={() => handleRegenerateToken(domain.id)}
                onRetry={() => handleRetryFailedDomain(domain.id)}
                onVerify={() => handleVerifyDomain(domain.id)}
                updateActions={updateActions}
              />
            </div>
          </div>

          <div className="mt-auto space-y-2 border-t pt-3 text-muted-foreground text-xs">
            <div className="flex justify-between">
              <span className="font-medium">Verified:</span>
              <span className="text-right">
                {domain.verifiedAt
                  ? formatDistanceToNow(new Date(domain.verifiedAt), { addSuffix: true })
                  : domain.verificationStatus === "PENDING"
                    ? "Not verified yet"
                    : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Added:</span>
              <span className="text-right">
                {formatDistanceToNow(new Date(domain.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>
        </CardContent>

        {isExpanded && canExpand && (
          <div className="border-t">
            <VerificationDetails
              actions={actions}
              domain={domain}
              onCopy={copyToClipboard}
              onRetry={() => handleRetryFailedDomain(domain.id)}
              onVerify={() => handleVerifyDomain(domain.id)}
              verificationResult={actions.verificationResult[domain.id]}
            />
          </div>
        )}
      </Card>
    );
  };

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      {state.hasError ? (
        <>
          <div className="mb-8 rounded-full border border-red-200 bg-red-50 p-8">
            <WarningCircleIcon className="h-16 w-16 text-red-500" size={64} weight="duotone" />
          </div>
          <h3 className="mb-4 font-bold text-2xl">Failed to Load Domains</h3>
          <p className="mb-8 max-w-md text-muted-foreground leading-relaxed">
            There was a problem loading your domains. Please check your connection and try again.
          </p>
          <Button onClick={fetchDomains} size="lg">
            <ClockClockwiseIcon className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </>
      ) : (
        <>
          <div className="relative mb-8">
            <div className="rounded-full border bg-muted/50 p-8">
              <GlobeIcon className="h-16 w-16 text-muted-foreground" size={64} weight="duotone" />
            </div>
            <div className="-top-2 -right-2 absolute rounded-full border border-primary/20 bg-primary/10 p-2">
              <PlusIcon className="h-6 w-6 text-primary" size={24} />
            </div>
          </div>
          <h3 className="mb-4 font-bold text-2xl">No Domains Yet</h3>
          <p className="mb-8 max-w-md text-muted-foreground leading-relaxed">
            Add your first domain to get started. Once verified, you can create websites and track
            analytics.
          </p>
          <div className="max-w-md rounded-xl border bg-muted/50 p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <GlobeIcon className="h-5 w-5 text-primary" size={20} weight="fill" />
              </div>
              <div className="text-left">
                <p className="mb-2 font-semibold text-sm">💡 Quick tip</p>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Verify domain ownership by adding a DNS TXT record. This enables you to create
                  websites and track analytics.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  if (state.isLoading) return <LoadingSkeleton />;
  if (domains.length === 0) return <EmptyState />;

  return (
    <div className="fade-in slide-in-from-bottom-2 animate-in space-y-8 duration-700">
      {/* Domain count */}
      <div className="flex items-center gap-2 rounded-lg border border-muted bg-muted/30 px-3 py-2 text-muted-foreground text-sm">
        <GlobeIcon className="h-4 w-4 flex-shrink-0" size={16} weight="duotone" />
        <span>
          Managing <span className="font-medium text-foreground">{domains.length}</span> domain
          {domains.length !== 1 ? "s" : ""}
          {verifiedDomains.length > 0 && unverifiedDomains.length > 0 && (
            <span className="ml-2 text-xs">
              (<span className="font-medium text-green-600">{verifiedDomains.length} verified</span>
              ,{" "}
              <span className="font-medium text-amber-600">{unverifiedDomains.length} pending</span>
              )
            </span>
          )}
        </span>
      </div>

      {/* Verified Domains */}
      {verifiedDomains.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <h3 className="font-semibold text-lg">Verified Domains</h3>
            <span className="text-muted-foreground text-sm">({verifiedDomains.length})</span>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {verifiedDomains.map((domain, index) => (
              <div
                className="fade-in slide-in-from-bottom-4 animate-in"
                key={domain.id}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <DomainCard domain={domain} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unverified Domains */}
      {unverifiedDomains.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
            <h3 className="font-semibold text-lg">Pending Verification</h3>
            <span className="text-muted-foreground text-sm">({unverifiedDomains.length})</span>
          </div>
          <div className="space-y-4">
            {unverifiedDomains.map((domain, index) => (
              <div
                className="fade-in slide-in-from-bottom-4 animate-in"
                key={domain.id}
                style={{ animationDelay: `${(verifiedDomains.length + index) * 100}ms` }}
              >
                <DomainCard domain={domain} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
