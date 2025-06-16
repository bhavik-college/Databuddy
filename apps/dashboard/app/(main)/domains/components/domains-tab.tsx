"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GlobeIcon, PlusIcon, CaretDownIcon, CaretRightIcon, ClockClockwiseIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { Skeleton } from "@/components/ui/skeleton";
import { FaviconImage } from "@/components/analytics/favicon-image";
import { formatDistanceToNow } from "date-fns";
import { StatusBadge } from "./status-badge";
import { useDomainManagement } from "../hooks/use-domain-management";
import type { Domain } from "../types";
import { copyToClipboard } from "../utils";
import React from "react";
import { DomainRowActions } from "./domain-row-actions";
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
    fetchDomains
  } = useDomainManagement();

  const domains = state.domains;

  // Separate domains by verification status
  const verifiedDomains = domains.filter(domain => domain.verificationStatus === "VERIFIED");
  const unverifiedDomains = domains.filter(domain => domain.verificationStatus !== "VERIFIED");

  const LoadingSkeleton = () => (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, i) => (
        <Card key={i} className="border animate-pulse">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3 flex-1">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="h-3 w-16 rounded" />
                </div>
              </div>
              <Skeleton className="h-6 w-16 rounded" />
            </div>
            <div className="space-y-2 pt-2 border-t">
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
    const canExpand = domain.verificationStatus === "PENDING" || domain.verificationStatus === "FAILED";
    const isRetrying = actions.retryingDomains[domain.id];

    return (
      <Card className="group hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border hover:border-primary/60 hover:-translate-y-1 bg-gradient-to-br from-background to-muted/20 h-full flex flex-col">
        <CardContent className="p-4 flex-grow flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              {canExpand && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 p-0 flex-shrink-0 hover:bg-muted/60 transition-colors"
                  onClick={() => toggleExpanded(domain.id)}
                  data-track="domain-expand-toggle"
                  data-section="domains"
                  data-domain-name={domain.name}
                >
                  {isExpanded ? <CaretDownIcon size={16} weight="fill" className="h-3 w-3" /> : <CaretRightIcon size={16} weight="fill" className="h-3 w-3" />}
                </Button>
              )}
              <div className="relative">
                <FaviconImage
                  domain={domain.name}
                  size={32}
                  className="h-8 w-8 flex-shrink-0 rounded-full"
                />
                {isVerifying && (
                  <div className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">{domain.name}</h3>
                <div className="mt-1">
                  <StatusBadge status={domain.verificationStatus} isRetrying={isRetrying} />
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 ml-3">
              <DomainRowActions
                domain={domain}
                actions={actions}
                domainIsVerifying={isVerifying}
                domainVerificationProgress={actions.verificationProgress[domain.id] || 0}
                isRetrying={isRetrying}
                onVerify={() => handleVerifyDomain(domain.id)}
                onDelete={() => handleDeleteDomain(domain.id)}
                onRegenerate={() => handleRegenerateToken(domain.id)}
                onRetry={() => handleRetryFailedDomain(domain.id)}
                onCreate={() => handleCreateWebsite(domain.id, domain.name)}
                updateActions={updateActions}
              />
            </div>
          </div>

          <div className="space-y-2 text-xs text-muted-foreground border-t pt-3 mt-auto">
            <div className="flex justify-between">
              <span className="font-medium">Verified:</span>
              <span className="text-right">
                {domain.verifiedAt
                  ? formatDistanceToNow(new Date(domain.verifiedAt), { addSuffix: true })
                  : domain.verificationStatus === "PENDING" ? "Not verified yet" : "—"
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Added:</span>
              <span className="text-right">{formatDistanceToNow(new Date(domain.createdAt), { addSuffix: true })}</span>
            </div>
          </div>
        </CardContent>

        {isExpanded && canExpand && (
          <div className="border-t">
            <VerificationDetails
              domain={domain}
              actions={actions}
              verificationResult={actions.verificationResult[domain.id]}
              onVerify={() => handleVerifyDomain(domain.id)}
              onRetry={() => handleRetryFailedDomain(domain.id)}
              onCopy={copyToClipboard}
            />
          </div>
        )}
      </Card>
    );
  };

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {state.hasError ? (
        <>
          <div className="rounded-full bg-red-50 p-8 border border-red-200 mb-8">
            <WarningCircleIcon size={64} weight="duotone" className="h-16 w-16 text-red-500" />
          </div>
          <h3 className="text-2xl font-bold mb-4">Failed to Load Domains</h3>
          <p className="text-muted-foreground mb-8 max-w-md leading-relaxed">
            There was a problem loading your domains. Please check your connection and try again.
          </p>
          <Button size="lg" onClick={fetchDomains}>
            <ClockClockwiseIcon className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </>
      ) : (
        <>
          <div className="relative mb-8">
            <div className="rounded-full bg-muted/50 p-8 border">
              <GlobeIcon size={64} weight="duotone" className="h-16 w-16 text-muted-foreground" />
            </div>
            <div className="absolute -top-2 -right-2 p-2 rounded-full bg-primary/10 border border-primary/20">
              <PlusIcon size={24} weight="fill" className="h-6 w-6 text-primary" />
            </div>
          </div>
          <h3 className="text-2xl font-bold mb-4">No Domains Yet</h3>
          <p className="text-muted-foreground mb-8 max-w-md leading-relaxed">
            Add your first domain to get started. Once verified, you can create websites and track analytics.
          </p>
          <div className="bg-muted/50 rounded-xl p-6 max-w-md border">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <GlobeIcon size={20} weight="fill" className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm mb-2">💡 Quick tip</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Verify domain ownership by adding a DNS TXT record. This enables you to create websites and track analytics.
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
      {/* Domain count */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 rounded-lg px-3 py-2 border border-muted">
        <GlobeIcon size={16} weight="duotone" className="h-4 w-4 flex-shrink-0" />
        <span>
          Managing <span className="font-medium text-foreground">{domains.length}</span> domain{domains.length !== 1 ? 's' : ''}
          {verifiedDomains.length > 0 && unverifiedDomains.length > 0 && (
            <span className="text-xs ml-2">
              (<span className="text-green-600 font-medium">{verifiedDomains.length} verified</span>, <span className="text-amber-600 font-medium">{unverifiedDomains.length} pending</span>)
            </span>
          )}
        </span>
      </div>

      {/* Verified Domains */}
      {verifiedDomains.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
            <h3 className="font-semibold text-lg">Verified Domains</h3>
            <span className="text-sm text-muted-foreground">({verifiedDomains.length})</span>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {verifiedDomains.map((domain, index) => (
              <div
                key={domain.id}
                className="animate-in fade-in slide-in-from-bottom-4"
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
            <div className="h-2 w-2 bg-amber-500 rounded-full animate-pulse"></div>
            <h3 className="font-semibold text-lg">Pending Verification</h3>
            <span className="text-sm text-muted-foreground">({unverifiedDomains.length})</span>
          </div>
          <div className="space-y-4">
            {unverifiedDomains.map((domain, index) => (
              <div
                key={domain.id}
                className="animate-in fade-in slide-in-from-bottom-4"
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