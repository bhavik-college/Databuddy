"use client";

import {
  ArrowClockwiseIcon,
  TrendDownIcon,
  TrendUpIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { useState } from "react";
import { FaviconImage } from "@/components/analytics/favicon-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDomainRanks } from "@/hooks/use-domain-info";
import { useDomainManagement } from "../hooks/use-domain-management";
import { getRankColor, getTierInfo } from "../utils";
import { DomainRankDetails } from "./domain-rank-details";

const LoadingSkeleton = () => (
  <div className="space-y-6">
    {Array.from({ length: 4 }, (_, i) => (
      <Card className="animate-pulse" key={i}>
        <CardContent className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex flex-1 items-center space-x-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-3 w-24 rounded" />
              </div>
            </div>
            <div className="space-y-2 text-center">
              <Skeleton className="mx-auto h-8 w-12 rounded" />
              <Skeleton className="h-3 w-16 rounded" />
            </div>
          </div>
          <div className="space-y-2 border-t pt-3">
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
  <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
    <div className="mb-8 rounded-full border border-red-200 bg-red-50 p-8">
      <WarningCircleIcon className="h-16 w-16 text-red-500" size={64} weight="duotone" />
    </div>
    <h3 className="mb-4 font-bold text-2xl">Failed to Load Rankings</h3>
    <p className="mb-8 max-w-md text-muted-foreground leading-relaxed">
      {error?.message || "Unable to fetch domain ranking data. This might be a temporary issue."}
    </p>
    <Button onClick={onRetry} size="lg">
      <ArrowClockwiseIcon className="mr-2 h-4 w-4" size={16} weight="fill" />
      Try Again
    </Button>
  </div>
);

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
    <div className="relative mb-8">
      <div className="rounded-full border bg-muted/50 p-8">
        <TrendDownIcon className="h-16 w-16 text-muted-foreground" size={64} weight="fill" />
      </div>
      <div className="-top-2 -right-2 absolute rounded-full border border-primary/20 bg-primary/10 p-2">
        <TrendUpIcon className="h-6 w-6 text-primary" size={24} weight="fill" />
      </div>
    </div>
    <h3 className="mb-4 font-bold text-2xl">No Rankings Available</h3>
    <p className="mb-8 max-w-md text-muted-foreground leading-relaxed">
      Add and verify domains to see their ranking data. Domain rankings help you understand your
      site's authority and search performance.
    </p>
    <div className="max-w-md rounded-xl border bg-muted/50 p-6">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <TrendUpIcon className="h-5 w-5 text-primary" size={20} weight="fill" />
        </div>
        <div className="text-left">
          <p className="mb-2 font-semibold text-sm">💡 About DR Scores</p>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Domain Rank (DR) measures your domain's backlink authority on a scale of 0-100. Higher
            scores indicate stronger SEO potential.
          </p>
        </div>
      </div>
    </div>
  </div>
);

const DomainRankCard = ({
  domain,
  rankData,
  onViewDetails,
}: {
  domain: any;
  rankData: any;
  onViewDetails: () => void;
}) => {
  const hasData = rankData && rankData.status_code === 200;
  const isLoading = !rankData;

  return (
    <Card className="group hover:-translate-y-1 border bg-gradient-to-br from-background to-muted/20 transition-all duration-300 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/5">
      <CardContent className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex flex-1 items-center space-x-3">
            <div className="relative">
              <FaviconImage
                className="h-10 w-10 rounded-full ring-2 ring-border"
                domain={domain.name}
              />
              {isLoading && (
                <div className="-bottom-1 -right-1 absolute flex h-4 w-4 items-center justify-center rounded-full border bg-background">
                  <ArrowClockwiseIcon
                    className="h-2 w-2 animate-spin text-muted-foreground"
                    size={8}
                    weight="fill"
                  />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h4 className="truncate font-semibold text-base transition-colors group-hover:text-primary">
                {domain.name}
              </h4>
              <div className="mt-1 flex items-center gap-4 text-muted-foreground text-sm">
                <span>
                  Global: {hasData && rankData.rank ? `#${rankData.rank.toLocaleString()}` : "N/A"}
                </span>
                <span>Score: {hasData ? rankData.page_rank_decimal.toFixed(1) : "N/A"}/100</span>
              </div>
            </div>
          </div>
          <div className="text-center">
            <div
              className={`font-bold text-3xl ${hasData ? getRankColor(rankData.page_rank_decimal) : "text-muted-foreground"}`}
            >
              {hasData ? rankData.page_rank_decimal.toFixed(1) : "—"}
            </div>
            <p className="mt-1 text-muted-foreground text-xs">DR Score</p>
          </div>
        </div>

        {hasData && (
          <>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Authority Progress</span>
              <span className="font-medium">{Math.round(rankData.page_rank_decimal)}%</span>
            </div>
            <div className="mb-3 h-2 w-full rounded-full bg-muted">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  rankData.page_rank_decimal >= 70
                    ? "bg-green-500"
                    : rankData.page_rank_decimal >= 40
                      ? "bg-blue-500"
                      : rankData.page_rank_decimal >= 20
                        ? "bg-yellow-500"
                        : "bg-red-500"
                }`}
                style={{ width: `${Math.min(100, rankData.page_rank_decimal)}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <Button onClick={onViewDetails} size="sm" variant="outline">
                View Details
              </Button>
              {domain.verificationStatus === "VERIFIED" && (
                <Badge className="text-xs" variant="secondary">
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
  const [selectedRankDetails, setSelectedRankDetails] = useState<{
    domainName: string;
    domainId: string;
  } | null>(null);

  if (isLoading) return <LoadingSkeleton />;
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />;

  const rankedDomains = state.domains
    .map((domain) => ({ ...domain, rank: ranks[domain.id]?.page_rank_decimal || 0 }))
    .sort((a, b) => b.rank - a.rank);

  if (rankedDomains.length === 0) return <EmptyState />;

  return (
    <div className="fade-in slide-in-from-bottom-2 animate-in space-y-8 duration-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="animate-pulse rounded-lg border border-primary/20 bg-primary/10 p-2">
            <TrendUpIcon className="h-5 w-5 text-primary" size={20} weight="fill" />
          </div>
          <div>
            <h2 className="font-bold text-2xl">Domain Rankings</h2>
            <p className="text-muted-foreground text-sm">
              View Domain Rank (DR) scores and authority metrics for your domains
            </p>
          </div>
        </div>
        <Button className="gap-2" disabled={isFetching} onClick={() => refetch()} variant="outline">
          <ArrowClockwiseIcon
            className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            size={16}
            weight="fill"
          />
          {isFetching ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {/* Domain count */}
      <div className="flex items-center gap-2 rounded-lg border border-muted bg-muted/30 px-3 py-2 text-muted-foreground text-sm">
        <TrendUpIcon className="h-4 w-4 flex-shrink-0" size={16} weight="fill" />
        <span>
          Tracking <span className="font-medium text-foreground">{rankedDomains.length}</span>{" "}
          domain{rankedDomains.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Domain rankings grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {rankedDomains.map((domain, index) => (
          <div
            className="fade-in slide-in-from-bottom-4 animate-in"
            key={domain.id}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <DomainRankCard
              domain={domain}
              onViewDetails={() =>
                setSelectedRankDetails({ domainName: domain.name, domainId: domain.id })
              }
              rankData={ranks[domain.id]}
            />
          </div>
        ))}
      </div>

      <DomainRankDetails
        domainName={selectedRankDetails?.domainName || ""}
        isOpen={!!selectedRankDetails}
        onClose={() => setSelectedRankDetails(null)}
        rankData={selectedRankDetails ? ranks[selectedRankDetails.domainId] || null : null}
      />
    </div>
  );
}
