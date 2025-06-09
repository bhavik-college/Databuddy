"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Filter, Circle, RefreshCw, Globe, AlertCircle, Plus, ChevronRight, ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { FaviconImage } from "@/components/analytics/favicon-image";
import { formatDistanceToNow } from "date-fns";
import { StatusBadge } from "./status-badge";
import { useDomainManagement } from "../hooks/use-domain-management";
import type { Domain } from "../types";
import { copyToClipboard } from "../utils";
import React, { useMemo } from "react";
import { DomainRowActions } from "./domain-row-actions";
import { VerificationDetails } from "./verification-details";

export function DomainsTab() {
  const {
    state,
    actions,
    domainsPerPage,
    updateState,
    updateActions,
    toggleExpanded,
    handleVerifyDomain,
    handleDeleteDomain,
    handleRegenerateToken,
    handleRetryFailedDomain,
    handleCreateWebsite,
    fetchDomains
  } = useDomainManagement();

  const filteredDomains = useMemo(() => {
    let filtered = state.domains;
    
    if (state.filterStatus !== "all") {
      filtered = filtered.filter(domain => domain.verificationStatus === state.filterStatus);
    }
    
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(domain => 
        domain.name.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [state.domains, state.filterStatus, state.searchQuery]);

  // Get current page of domains
  const currentPageDomains = useMemo(() => {
    const indexOfLastDomain = state.currentPage * domainsPerPage;
    const indexOfFirstDomain = indexOfLastDomain - domainsPerPage;
    return filteredDomains.slice(indexOfFirstDomain, indexOfLastDomain);
  }, [filteredDomains, state.currentPage, domainsPerPage]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredDomains.length / domainsPerPage);

  // Handle page change
  const handlePageChange = (page: number) => {
    updateState({ currentPage: page });
  };

  const renderDomainCard = (domain: Domain) => {
    const domainIsVerifying = actions.isVerifying[domain.id] || false;
    const domainVerificationProgress = actions.verificationProgress[domain.id] || 0;
    const isExpanded = state.expandedDomains.has(domain.id);
    const canExpand = domain.verificationStatus === "PENDING" || domain.verificationStatus === "FAILED";
    const isRetrying = actions.retryingDomains[domain.id] || false;
    
    return (
      <Card key={domain.id} className="group hover:shadow-md transition-all duration-200 border hover:border-muted-foreground/20">
        <CardContent className="p-3 sm:p-6">
          <div className="space-y-3 sm:space-y-4">
            {/* Header row */}
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                <div className="flex items-center space-x-1 sm:space-x-2">
                  {canExpand && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 sm:h-8 sm:w-8 p-0 flex-shrink-0 hover:bg-muted/60 transition-colors"
                      aria-label={isExpanded ? "Collapse details" : "Expand details"}
                      onClick={() => toggleExpanded(domain.id)}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                      ) : (
                        <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                      )}
                    </Button>
                  )}
                  <div className="relative">
                    <FaviconImage 
                      domain={domain.name} 
                      size={32} 
                      className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 rounded-full" 
                    />
                    {domainIsVerifying && (
                      <div className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 sm:h-2 sm:w-2 bg-blue-500 rounded-full animate-pulse" />
                    )}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-sm sm:text-base truncate">{domain.name}</h3>
                  <div className="flex items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1">
                    <StatusBadge 
                      status={domain.verificationStatus} 
                      isRetrying={isRetrying}
                    />
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex-shrink-0">
                <DomainRowActions
                  domain={domain}
                  actions={actions}
                  domainIsVerifying={domainIsVerifying}
                  domainVerificationProgress={domainVerificationProgress}
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

            {/* Basic Details */}
            <div className="space-y-1 sm:space-y-2 text-xs text-muted-foreground border-t pt-2 sm:pt-3">
              <div className="flex justify-between">
                <span className="font-medium">Verified:</span>
                <span className="text-right">{domain.verifiedAt 
                  ? formatDistanceToNow(new Date(domain.verifiedAt), { addSuffix: true })
                  : domain.verificationStatus === "PENDING" 
                    ? "Not verified yet" 
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Added:</span>
                <span className="text-right">{formatDistanceToNow(new Date(domain.createdAt), { addSuffix: true })}</span>
              </div>
            </div>
          </div>
        </CardContent>
        
        {/* Verification details */}
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

  // Render pagination controls
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between border-t pt-4 mt-6 gap-4">
        <div className="text-sm text-muted-foreground text-center sm:text-left">
          Showing <span className="font-medium">{((state.currentPage - 1) * domainsPerPage) + 1}</span> to <span className="font-medium">{Math.min(state.currentPage * domainsPerPage, filteredDomains.length)}</span> of <span className="font-medium">{filteredDomains.length}</span> domains
        </div>
        <div className="flex items-center space-x-1">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handlePageChange(state.currentPage - 1)}
            disabled={state.currentPage === 1}
            className="h-8 w-8 p-0"
          >
            &lt;
          </Button>
          
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum = state.currentPage;
            const maxPages = 5;
            if (totalPages <= maxPages) {
              pageNum = i + 1;
            } else if (state.currentPage <= Math.floor(maxPages / 2) + 1) {
              pageNum = i + 1;
            } else if (state.currentPage >= totalPages - Math.floor(maxPages / 2)) {
              pageNum = totalPages - maxPages + 1 + i;
            } else {
              pageNum = state.currentPage - Math.floor(maxPages / 2) + i;
            }
            
            return (
              <Button 
                key={`page-${pageNum}`}
                variant={state.currentPage === pageNum ? "default" : "outline"} 
                size="sm" 
                onClick={() => handlePageChange(pageNum)}
                className="h-8 w-8 p-0"
              >
                {pageNum}
              </Button>
            );
          })}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handlePageChange(state.currentPage + 1)}
            disabled={state.currentPage === totalPages}
            className="h-8 w-8 p-0"
          >
            &gt;
          </Button>
        </div>
      </div>
    );
  };

  // Render empty state
  const renderEmptyState = () => {
    const isFiltering = state.searchQuery || state.filterStatus !== "all";
    
    return (
      <div className="py-12 text-center px-4">
        {isFiltering ? (
          <>
            <div className="bg-muted/30 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-4">
              <Filter className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No matching domains</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm leading-relaxed">
              No domains match your current filters. Try adjusting your search or filter criteria.
            </p>
            <Button variant="outline" size="sm" onClick={() => {
              updateState({ searchQuery: "", filterStatus: "all" });
            }}>
              Clear Filters
            </Button>
          </>
        ) : state.hasError ? (
          <>
            <div className="bg-red-100 dark:bg-red-950/20 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-6 w-6 text-red-500 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">Failed to load domains</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm leading-relaxed">
              There was a problem loading your domains. Please try again.
            </p>
            <Button size="sm" onClick={fetchDomains}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </>
        ) : (
          <>
            <div className="bg-muted/30 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-4">
              <Globe className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No domains yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm leading-relaxed">
              Add your first domain to get started. Once verified, you can create websites and track analytics.
            </p>
          </>
        )}
      </div>
    );
  };

  return (
    <Card className="rounded-lg border bg-background shadow-sm h-full flex flex-col">
      <CardHeader className="pb-3 sm:pb-4 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-center space-x-2 flex-1">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search domains..."
              value={state.searchQuery}
              onChange={(e) => updateState({ searchQuery: e.target.value })}
              className="h-9 flex-1 sm:max-w-xs transition-colors focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={state.filterStatus} onValueChange={(value) => updateState({ filterStatus: value })}>
              <SelectTrigger className="h-9 w-[160px] transition-colors">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Circle className="h-3 w-3 text-muted-foreground" fill="currentColor" />
                    <span>All Domains</span>
                  </div>
                </SelectItem>
                <SelectItem value="VERIFIED">
                  <div className="flex items-center gap-2">
                    <Circle className="h-3 w-3 text-green-500" fill="currentColor" />
                    <span>Verified</span>
                  </div>
                </SelectItem>
                <SelectItem value="PENDING">
                  <div className="flex items-center gap-2">
                    <Circle className="h-3 w-3 text-yellow-500" fill="currentColor" />
                    <span>Pending</span>
                  </div>
                </SelectItem>
                <SelectItem value="FAILED">
                  <div className="flex items-center gap-2">
                    <Circle className="h-3 w-3 text-red-500" fill="currentColor" />
                    <span>Failed</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {(state.searchQuery || state.filterStatus !== "all") && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => updateState({ searchQuery: "", filterStatus: "all" })}
                className="h-9 hover:bg-muted/60 transition-colors"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col overflow-hidden px-3 sm:px-6">
        {state.isLoading ? (
          <div className="space-y-3 sm:space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border">
                <CardContent className="p-3 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 sm:space-x-3 flex-1">
                      <Skeleton className="h-4 w-4 sm:h-5 sm:w-5 rounded" />
                      <div className="space-y-1 sm:space-y-2 flex-1">
                        <Skeleton className="h-3 sm:h-4 w-3/4" />
                        <Skeleton className="h-3 w-16 rounded-full" />
                      </div>
                    </div>
                    <div className="flex space-x-1 sm:space-x-2">
                      <Skeleton className="h-7 w-12 sm:h-8 sm:w-16 rounded" />
                      <Skeleton className="h-7 w-7 sm:h-8 sm:w-8 rounded" />
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-4 pt-2 sm:pt-3 border-t space-y-1 sm:space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <div className="flex justify-between">
                      <Skeleton className="h-3 w-12" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredDomains.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            <div className="flex-1 overflow-auto space-y-3 sm:space-y-4">
              {currentPageDomains.map(domain => renderDomainCard(domain))}
            </div>
            
            {renderPagination()}
          </>
        )}
      </CardContent>
    </Card>
  );
} 