"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, RefreshCw, AlertCircle, TrendingDown, Globe } from "lucide-react";
import { FaviconImage } from "@/components/analytics/favicon-image";
import { useDomainManagement } from "../hooks/use-domain-management";
import { useDomainRanks } from "@/hooks/use-domain-info";
import { getRankColor, getTierInfo } from "../utils";
import { DomainRankDetails } from "./domain-rank-details";

// Loading skeleton for domain rank cards
const DomainRankSkeleton = ({ index }: { index: number }) => (
  <Card className="hover:shadow-md transition-all duration-200">
    <CardContent className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
          <div className="relative flex-shrink-0">
            <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-full" />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className={`h-4 ${index % 2 === 0 ? 'w-32' : 'w-24'}`} />
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-4">
          <div className="text-center space-y-2">
            <Skeleton className="h-6 sm:h-8 w-10 sm:w-12 rounded mx-auto" />
            <Skeleton className="h-3 w-12 sm:w-16" />
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-20 sm:w-24 rounded" />
            <Skeleton className="h-4 sm:h-5 w-12 sm:w-16 rounded-full" />
          </div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-8" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
    </CardContent>
  </Card>
);

// Enhanced loading state component
const LoadingState = () => (
  <div className="space-y-4">
    {Array.from({ length: 3 }, (_, i) => (
      <DomainRankSkeleton key={`domain-rank-skeleton-${i + 1}`} index={i} />
    ))}
  </div>
);

// Error state component
const ErrorState = ({ error, onRetry }: { error: Error | null; onRetry: () => void }) => (
  <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-4 text-center">
    <div className="bg-red-100 dark:bg-red-950/20 rounded-full h-12 w-12 sm:h-16 sm:w-16 flex items-center justify-center mb-4">
      <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
    </div>
    <h3 className="text-base sm:text-lg font-semibold mb-2">Failed to load domain rankings</h3>
    <p className="text-muted-foreground mb-4 sm:mb-6 max-w-md text-sm leading-relaxed">
      {error?.message || "Unable to fetch domain ranking data. This might be a temporary issue."}
    </p>
    <Button onClick={onRetry} className="transition-all duration-200 hover:scale-105">
      <RefreshCw className="h-4 w-4 mr-2" />
      Try again
    </Button>
  </div>
);

// Empty state component
const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-4 text-center">
    <div className="bg-muted/30 rounded-full h-12 w-12 sm:h-16 sm:w-16 flex items-center justify-center mb-4">
      <TrendingDown className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
    </div>
    <h3 className="text-base sm:text-lg font-semibold mb-2">No domain rankings available</h3>
    <p className="text-muted-foreground mb-4 sm:mb-6 max-w-md text-sm leading-relaxed">
      Add and verify domains to see their ranking data. Domain rankings help you understand your site's authority and search performance.
    </p>
  </div>
);

export function DomainRanksTab() {
  const { state } = useDomainManagement();
  const { 
    ranks, 
    isLoading, 
    isError, 
    error, 
    refetch, 
    isFetching, 
    isRefetching 
  } = useDomainRanks();
  const [selectedRankDetails, setSelectedRankDetails] = useState<{domainName: string; domainId: string} | null>(null);

  // Show loading state
  if (isLoading) {
    return (
      <Card className="rounded-lg border bg-background shadow-sm h-full flex flex-col">
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
            Domain Rankings
          </CardTitle>
          <CardDescription className="text-sm">
            View Domain Rank (DR) scores for your verified domains. DR is a metric that represents the strength of a domain's backlink profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto px-4 sm:px-6">
          <LoadingState />
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (isError) {
    return (
      <Card className="rounded-lg border bg-background shadow-sm h-full flex flex-col">
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
            Domain Rankings
          </CardTitle>
          <CardDescription className="text-sm">
            View Domain Rank (DR) scores for your verified domains. DR is a metric that represents the strength of a domain's backlink profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <ErrorState error={error} onRetry={() => refetch()} />
        </CardContent>
      </Card>
    );
  }

  const rankedDomains = state.domains.map(domain => ({
    ...domain,
    rank: ranks[domain.id]?.page_rank_decimal || 0
  })).sort((a, b) => b.rank - a.rank);

  // Show empty state when no domains
  if (rankedDomains.length === 0) {
    return (
      <Card className="rounded-lg border bg-background shadow-sm h-full flex flex-col">
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
            Domain Rankings
          </CardTitle>
          <CardDescription className="text-sm">
            View Domain Rank (DR) scores for your verified domains. DR is a metric that represents the strength of a domain's backlink profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <EmptyState />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="rounded-lg border bg-background shadow-sm h-full flex flex-col">
        <CardHeader className="pb-4 sm:pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                Domain Rankings
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                View Domain Rank (DR) scores for your verified domains. DR is a metric that represents the strength of a domain's backlink profile.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex-shrink-0 w-full sm:w-auto"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              {isFetching ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto px-4 sm:px-6">
          <div className="space-y-4">
            {rankedDomains.map(domain => {
              const rankData = ranks[domain.id];
              const hasData = rankData && rankData.status_code === 200;
              const isLoading = !rankData; // Individual domain loading state
              
              return (
                <Card key={domain.id} className="hover:shadow-md transition-all duration-200">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                        <div className="relative flex-shrink-0">
                          <FaviconImage 
                            domain={domain.name} 
                            className="h-8 w-8 sm:h-10 sm:w-10 rounded-full ring-2 ring-border" 
                          />
                          {isLoading && (
                            <div className="absolute -bottom-1 -right-1 bg-background border rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                              <RefreshCw className="h-2 w-2 animate-spin text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-sm sm:text-base truncate">{domain.name}</h4>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1">
                            {isLoading ? (
                              <>
                                <Skeleton className="h-3 w-20" />
                                <Skeleton className="h-3 w-16" />
                              </>
                            ) : (
                              <>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                  Global: {hasData && rankData.rank ? `#${rankData.rank.toLocaleString()}` : 'N/A'}
                                </p>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                  Score: {hasData ? rankData.page_rank_decimal.toFixed(1) : 'N/A'}/100
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <div className="text-center">
                          {isLoading ? (
                            <div className="space-y-2">
                              <Skeleton className="h-6 sm:h-8 w-10 sm:w-12 rounded mx-auto" />
                              <Skeleton className="h-3 w-12 sm:w-16" />
                            </div>
                          ) : (
                            <>
                              <div className={`text-2xl sm:text-3xl font-bold ${hasData ? getRankColor(rankData.page_rank_decimal) : 'text-muted-foreground'}`}>
                                {hasData ? rankData.page_rank_decimal.toFixed(1) : '—'}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">DR Score</p>
                            </>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          {isLoading ? (
                            <>
                              <Skeleton className="h-8 w-20 sm:w-24 rounded" />
                              <Skeleton className="h-4 sm:h-5 w-12 sm:w-16 rounded-full" />
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedRankDetails({domainName: domain.name, domainId: domain.id})}
                                disabled={!hasData}
                                className="text-xs sm:text-sm"
                              >
                                View Details
                              </Button>
                              {domain.verificationStatus === "VERIFIED" && hasData && (
                                <Badge variant="secondary" className="text-xs text-center">
                                  {getTierInfo(rankData.page_rank_decimal).tier}
                                </Badge>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {hasData && !isLoading && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Authority Progress</span>
                          <span className="font-medium">{Math.round(rankData.page_rank_decimal)}%</span>
                        </div>
                        <div className="mt-2">
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                rankData.page_rank_decimal >= 70 ? 'bg-green-500' :
                                rankData.page_rank_decimal >= 40 ? 'bg-blue-500' :
                                rankData.page_rank_decimal >= 20 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(100, rankData.page_rank_decimal)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {isLoading && (
                      <div className="mt-4 pt-4 border-t space-y-3">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-3 w-24" />
                          <Skeleton className="h-3 w-8" />
                        </div>
                        <Skeleton className="h-2 w-full rounded-full" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <DomainRankDetails
        isOpen={!!selectedRankDetails}
        onClose={() => setSelectedRankDetails(null)}
        rankData={selectedRankDetails ? ranks[selectedRankDetails.domainId] || null : null}
        domainName={selectedRankDetails?.domainName || ''}
      />
    </>
  );
} 