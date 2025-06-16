"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendUpIcon, ArrowClockwiseIcon, WarningCircleIcon, TrendDownIcon } from "@phosphor-icons/react";
import { FaviconImage } from "@/components/analytics/favicon-image";
import { useDomainManagement } from "../hooks/use-domain-management";
import { useDomainRanks } from "@/hooks/use-domain-info";
import { getRankColor, getTierInfo } from "../utils";
import { DomainRankDetails } from "./domain-rank-details";

const LoadingSkeleton = () => (
  <div className="space-y-6">
    {Array.from({ length: 4 }, (_, i) => (
      <Card key={i} className="animate-pulse">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3 flex-1">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-3 w-24 rounded" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <Skeleton className="h-8 w-12 rounded mx-auto" />
              <Skeleton className="h-3 w-16 rounded" />
            </div>
          </div>
          <div className="space-y-2 pt-3 border-t">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-24 rounded" />
              <Skeleton className="h-3 w-8 rounded" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

const ErrorState = ({ error, onRetry }: { error: Error | null; onRetry: () => void }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="rounded-full bg-red-50 p-8 border border-red-200 mb-8">
      <WarningCircleIcon size={64} weight="duotone" className="h-16 w-16 text-red-500" />
    </div>
    <h3 className="text-2xl font-bold mb-4">Failed to Load Rankings</h3>
    <p className="text-muted-foreground mb-8 max-w-md leading-relaxed">
      {error?.message || "Unable to fetch domain ranking data. This might be a temporary issue."}
    </p>
    <Button size="lg" onClick={onRetry}>
      <ArrowClockwiseIcon size={16} weight="fill" className="h-4 w-4 mr-2" />
      Try Again
    </Button>
  </div>
);

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="relative mb-8">
      <div className="rounded-full bg-muted/50 p-8 border">
        <TrendDownIcon size={64} weight="fill" className="h-16 w-16 text-muted-foreground" />
      </div>
      <div className="absolute -top-2 -right-2 p-2 rounded-full bg-primary/10 border border-primary/20">
        <TrendUpIcon size={24} weight="fill" className="h-6 w-6 text-primary" />
      </div>
    </div>
    <h3 className="text-2xl font-bold mb-4">No Rankings Available</h3>
    <p className="text-muted-foreground mb-8 max-w-md leading-relaxed">
      Add and verify domains to see their ranking data. Domain rankings help you understand your site's authority and search performance.
    </p>
    <div className="bg-muted/50 rounded-xl p-6 max-w-md border">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <TrendUpIcon size={20} weight="fill" className="h-5 w-5 text-primary" />
        </div>
        <div className="text-left">
          <p className="font-semibold text-sm mb-2">💡 About DR Scores</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Domain Rank (DR) measures your domain's backlink authority on a scale of 0-100. Higher scores indicate stronger SEO potential.
          </p>
        </div>
      </div>
    </div>
  </div>
);

const DomainRankCard = ({ domain, rankData, onViewDetails }: {
  domain: any;
  rankData: any;
  onViewDetails: () => void;
}) => {
  const hasData = rankData && rankData.status_code === 200;
  const isLoading = !rankData;

  return (
    <Card className="group hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border hover:border-primary/60 hover:-translate-y-1 bg-gradient-to-br from-background to-muted/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3 flex-1">
            <div className="relative">
              <FaviconImage
                domain={domain.name}
                className="h-10 w-10 rounded-full ring-2 ring-border"
              />
              {isLoading && (
                <div className="absolute -bottom-1 -right-1 bg-background border rounded-full w-4 h-4 flex items-center justify-center">
                  <ArrowClockwiseIcon size={8} weight="fill" className="h-2 w-2 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-base truncate group-hover:text-primary transition-colors">{domain.name}</h4>
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                <span>Global: {hasData && rankData.rank ? `#${rankData.rank.toLocaleString()}` : 'N/A'}</span>
                <span>Score: {hasData ? rankData.page_rank_decimal.toFixed(1) : 'N/A'}/100</span>
              </div>
            </div>
          </div>
          <div className="text-center">
            <div className={`text-3xl font-bold ${hasData ? getRankColor(rankData.page_rank_decimal) : 'text-muted-foreground'}`}>
              {hasData ? rankData.page_rank_decimal.toFixed(1) : '—'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">DR Score</p>
          </div>
        </div>

        {hasData && (
          <>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Authority Progress</span>
              <span className="font-medium">{Math.round(rankData.page_rank_decimal)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 mb-3">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${rankData.page_rank_decimal >= 70 ? 'bg-green-500' :
                  rankData.page_rank_decimal >= 40 ? 'bg-blue-500' :
                    rankData.page_rank_decimal >= 20 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                style={{ width: `${Math.min(100, rankData.page_rank_decimal)}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <Button size="sm" variant="outline" onClick={onViewDetails}>
                View Details
              </Button>
              {domain.verificationStatus === "VERIFIED" && (
                <Badge variant="secondary" className="text-xs">
                  {getTierInfo(rankData.page_rank_decimal).tier}
                </Badge>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export function DomainRanksTab() {
  const { state } = useDomainManagement();
  const { ranks, isLoading, isError, error, refetch, isFetching } = useDomainRanks();
  const [selectedRankDetails, setSelectedRankDetails] = useState<{ domainName: string; domainId: string } | null>(null);

  if (isLoading) return <LoadingSkeleton />;
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />;

  const rankedDomains = state.domains
    .map(domain => ({ ...domain, rank: ranks[domain.id]?.page_rank_decimal || 0 }))
    .sort((a, b) => b.rank - a.rank);

  if (rankedDomains.length === 0) return <EmptyState />;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 animate-pulse">
            <TrendUpIcon size={20} weight="fill" className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Domain Rankings</h2>
            <p className="text-sm text-muted-foreground">
              View Domain Rank (DR) scores and authority metrics for your domains
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-2"
        >
          <ArrowClockwiseIcon size={16} weight="fill" className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          {isFetching ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Domain count */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 rounded-lg px-3 py-2 border border-muted">
        <TrendUpIcon size={16} weight="fill" className="h-4 w-4 flex-shrink-0" />
        <span>
          Tracking <span className="font-medium text-foreground">{rankedDomains.length}</span> domain{rankedDomains.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Domain rankings grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {rankedDomains.map((domain, index) => (
          <div
            key={domain.id}
            className="animate-in fade-in slide-in-from-bottom-4"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <DomainRankCard
              domain={domain}
              rankData={ranks[domain.id]}
              onViewDetails={() => setSelectedRankDetails({ domainName: domain.name, domainId: domain.id })}
            />
          </div>
        ))}
      </div>

      <DomainRankDetails
        isOpen={!!selectedRankDetails}
        onClose={() => setSelectedRankDetails(null)}
        rankData={selectedRankDetails ? ranks[selectedRankDetails.domainId] || null : null}
        domainName={selectedRankDetails?.domainName || ''}
      />
    </div>
  );
} 