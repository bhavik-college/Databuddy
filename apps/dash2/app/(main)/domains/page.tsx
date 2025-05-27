"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createDomain, getUserDomains, checkDomainVerification, deleteDomain, regenerateVerificationToken } from "@/app/actions/domains";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Clock, Copy, Filter, Globe, Plus, RefreshCw, Search, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";
import { useRouter } from "next/navigation";

import type { domains } from "@databuddy/db";

type Domain = typeof domains.$inferSelect;

// Enhance VerificationResult type to include error details for better handling
type VerificationResult = {
  verified: boolean;
  message: string;
  error?: string;
  lastChecked?: Date;
};

// Enhanced status type to track verification attempts
type VerificationStatus = "VERIFIED" | "PENDING" | "FAILED" | "RETRYING";

// Reusable copy field for DNS info
function CopyField({ label, value, onCopy }: { label: string; value: string; onCopy: () => void }) {
  return (
    <div className="flex flex-col gap-1 min-w-0 flex-1">
      <span className="text-xs text-muted-foreground mb-1">{label}</span>
      <div className="flex items-center gap-2 min-w-0">
        <code className="block p-2 bg-background rounded text-sm break-all min-w-0 flex-1">{value}</code>
        <Button size="icon" variant="outline" onClick={onCopy}>
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function DomainsPage() {
  const [domain, setDomain] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState<Record<string, boolean>>({});
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({});
  const [isRegenerating, setIsRegenerating] = useState<Record<string, boolean>>({});
  const [verificationResult, setVerificationResult] = useState<Record<string, VerificationResult>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<Record<string, boolean>>({});
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedDomainId, setExpandedDomainId] = useState<string | null>(null);
  const [verificationProgress, setVerificationProgress] = useState<Record<string, number>>({});
  const [retryingDomains, setRetryingDomains] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [domainsPerPage] = useState(10);
  const [hasError, setHasError] = useState(false);
  const [regenerateDialogOpen, setRegenerateDialogOpen] = useState<Record<string, boolean>>({});
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());
  const router = useRouter();

  // Clean domain input
  const cleanDomainInput = (input: string): string => {
    // Remove protocol if present
    let cleaned = input.replace(/^(https?:\/\/)?(www\.)?/, '');
    
    // Remove any subdomains, keeping only the top-level domain
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts.slice(-2).join('.');
    }
    
    return cleaned;
  };

  // Fetch domains on component mount
  useEffect(() => {
    fetchDomains();
  }, []);

  // Fetch domains with error handling
  const fetchDomains = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const result = await getUserDomains();
      if (result.error) {
        setHasError(true);
        toast.error(result.error, {
          action: {
            label: "Retry",
            onClick: () => fetchDomains()
          }
        });
        return;
      }
      setDomains(result.data || []);
      
      // Auto-expand domains that need verification (PENDING or FAILED)
      const domainsNeedingVerification = (result.data || [])
        .filter(domain => domain.verificationStatus === "PENDING" || domain.verificationStatus === "FAILED")
        .map(domain => domain.id);
      setExpandedDomains(new Set(domainsNeedingVerification));
      
      setCurrentPage(1);
    } catch (error) {
      console.error("Error fetching domains:", error);
      setHasError(true);
      toast.error("Failed to fetch domains", {
        action: {
          label: "Retry",
          onClick: () => fetchDomains()
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDomain = async () => {
    if (!domain) {
      toast.error("Please enter a domain");
      return;
    }

    // Clean the domain input
    const cleanedDomain = cleanDomainInput(domain);
    
    // Validate domain format (only domain.tld, no subdomains or protocols)
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(cleanedDomain)) {
      toast.error("Please enter a valid top-level domain (e.g., example.com)");
      return;
    }

    setIsAdding(true);
    try {
      const result = await createDomain({ name: cleanedDomain });
      
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      toast.success(`Domain ${cleanedDomain} added successfully`);
      setDomain("");
      setAddDialogOpen(false);
      fetchDomains(); // Refresh domains list
    } catch (error) {
      console.error("Error adding domain:", error);
      toast.error("Failed to add domain");
    } finally {
      setIsAdding(false);
    }
  };

  const handleVerifyDomain = async (domainId: string) => {
    if (!domainId) {
      toast.error("Invalid domain ID");
      return;
    }

    // Set domain as verifying and reset any previous results
    setIsVerifying(prev => ({ ...prev, [domainId]: true }));
    setVerificationProgress(prev => ({ ...prev, [domainId]: 25 }));
    
    try {
      // Find the domain we're verifying
      const domainToVerify = domains.find(d => d.id === domainId);
      
      // Start verification with progress indicators
      setVerificationProgress(prev => ({ ...prev, [domainId]: 50 }));
      
      // Check if we're retrying a failed domain
      if (domainToVerify?.verificationStatus === "FAILED") {
        setRetryingDomains(prev => ({ ...prev, [domainId]: true }));
      }
      
      // Wrap in try-catch to prevent unhandled exceptions
      const result = await checkDomainVerification(domainId);
      
      // Update verification progress
      setVerificationProgress(prev => ({ ...prev, [domainId]: 75 }));
      
      // Handle error case first
      if (!result || result.error) {
        setVerificationResult(prev => ({ 
          ...prev, 
          [domainId]: {
            verified: false,
            message: result?.error || "Verification failed - no response from server",
            error: result?.error,
            lastChecked: new Date()
          }
        }));
        
        toast.error(result?.error || "Verification failed - please try again", {
          action: {
            label: "Retry",
            onClick: () => handleVerifyDomain(domainId)
          }
        });
        return;
      }
      
      // Update verification progress
      setVerificationProgress(prev => ({ ...prev, [domainId]: 90 }));
      
      // Safely handle the result data
      if (result.data) {
        // Update verification result state with type safety
        setVerificationResult(prev => ({ 
          ...prev, 
          [domainId]: {
            verified: Boolean(result.data.verified),
            message: String(result.data.message || ""),
            lastChecked: new Date()
          }
        }));
        
        // Show appropriate toast based on verification result
        if (result.data.verified) {
          toast.success("Domain verified successfully");
          // Wait a moment before refreshing to ensure UI updates properly
          setTimeout(() => fetchDomains(), 500);
        } else {
          toast.error(result.data.message || "Verification failed", {
            action: {
              label: "Retry",
              onClick: () => handleVerifyDomain(domainId)
            }
          });
        }
      } else {
        // Handle case where result.data is undefined
        toast.error("Verification returned invalid data", {
          action: {
            label: "Retry",
            onClick: () => handleVerifyDomain(domainId)
          }
        });
      }
      
      // Final progress update
      setVerificationProgress(prev => ({ ...prev, [domainId]: 100 }));
    } catch (error) {
      // Log detailed error and show user-friendly message
      console.error("Error verifying domain:", error);
      let errorMessage = "Failed to verify domain";
      
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      }
      
      // Update verification result with error info
      setVerificationResult(prev => ({ 
        ...prev, 
        [domainId]: {
          verified: false,
          message: errorMessage,
          error: error instanceof Error ? error.message : String(error),
          lastChecked: new Date()
        }
      }));
      
      toast.error(errorMessage, {
        action: {
          label: "Retry",
          onClick: () => handleVerifyDomain(domainId)
        }
      });
    } finally {
      // Always reset the loading states
      setIsVerifying(prev => ({ ...prev, [domainId]: false }));
      setRetryingDomains(prev => ({ ...prev, [domainId]: false }));
      
      // Clear progress state after a delay to allow for animation
      setTimeout(() => {
        setVerificationProgress(prev => ({ ...prev, [domainId]: 0 }));
      }, 1000);
    }
  };

  const handleDeleteDomain = async (domainId: string) => {
    setIsDeleting(prev => ({ ...prev, [domainId]: true }));
    try {
      const result = await deleteDomain(domainId);
      
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      toast.success("Domain deleted successfully");
      setDeleteDialogOpen(prev => ({ ...prev, [domainId]: false }));
      fetchDomains(); // Refresh domains list
    } catch (error) {
      console.error("Error deleting domain:", error);
      toast.error("Failed to delete domain");
    } finally {
      setIsDeleting(prev => ({ ...prev, [domainId]: false }));
    }
  };

  const handleRegenerateToken = async (domainId: string) => {
    setIsRegenerating(prev => ({ ...prev, [domainId]: true }));
    try {
      const result = await regenerateVerificationToken(domainId);
      
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      toast.success("Verification token regenerated", {
        description: "Please update your DNS record with the new token"
      });
      setRegenerateDialogOpen(prev => ({ ...prev, [domainId]: false }));
      fetchDomains();
    } catch (error) {
      console.error("Error regenerating token:", error);
      toast.error("Failed to regenerate token");
    } finally {
      setIsRegenerating(prev => ({ ...prev, [domainId]: false }));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const getStatusBadge = (status: string, domainId: string) => {
    // Handle special retrying state
    if (retryingDomains[domainId]) {
      return (
        <Badge className="bg-blue-100 text-blue-800">
          <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
          Retrying
        </Badge>
      );
    }
    
    switch (status) {
      case "VERIFIED":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="mr-1 h-3 w-3" />
            Verified
          </Badge>
        );
      case "PENDING":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      case "FAILED":
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800">
            <AlertCircle className="mr-1 h-3 w-3" />
            Failed
          </Badge>
        );
      default:
        return null;
    }
  };

  // Get filtered domains with pagination
  const filteredDomains = () => {
    let filtered = domains;
    
    // Apply status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(domain => domain.verificationStatus === filterStatus);
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(domain => 
        domain.name.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  };

  // Get current page of domains
  const getCurrentPageDomains = () => {
    const filtered = filteredDomains();
    const indexOfLastDomain = currentPage * domainsPerPage;
    const indexOfFirstDomain = indexOfLastDomain - domainsPerPage;
    return filtered.slice(indexOfFirstDomain, indexOfLastDomain);
  };

  // Calculate total pages
  const totalPages = Math.ceil(filteredDomains().length / domainsPerPage);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Keep expanded state when changing pages for better UX
  };

  const handleCreateWebsite = (domainId: string, domainName: string) => {
    router.push(`/websites?new=true&domain=${domainName}&domainId=${domainId}`);
  };

  const handleRetryFailedDomain = async (domainId: string) => {
    try {
      setIsRegenerating(prev => ({ ...prev, [domainId]: true }));
      
      const regenerateResult = await regenerateVerificationToken(domainId);
      
      if (regenerateResult.error) {
        toast.error(`Failed to regenerate token: ${regenerateResult.error}`);
        return;
      }
      
      toast.success("Verification token regenerated", {
        description: "Try adding the new DNS record and verify again"
      });
      
      await fetchDomains();
      
      // Auto-expand the domain details
      setExpandedDomains(prev => new Set([...prev, domainId]));
    } catch (error) {
      console.error("Error retrying failed domain:", error);
      toast.error("Failed to retry domain verification");
    } finally {
      setIsRegenerating(prev => ({ ...prev, [domainId]: false }));
    }
  };

  const renderDomainRow = (domain: Domain) => {
    const domainIsVerifying = isVerifying[domain.id] || false;
    const domainIsDeleting = isDeleting[domain.id] || false;
    const domainIsRegenerating = isRegenerating[domain.id] || false;
    const domainVerificationResult = verificationResult[domain.id];
    const domainVerificationProgress = verificationProgress[domain.id] || 0;
    const isExpanded = expandedDomains.has(domain.id);
    const canExpand = domain.verificationStatus === "PENDING" || domain.verificationStatus === "FAILED";
    const isRetrying = retryingDomains[domain.id] || false;
    
    const toggleExpanded = () => {
      setExpandedDomains(prev => {
        const newSet = new Set(prev);
        if (newSet.has(domain.id)) {
          newSet.delete(domain.id);
        } else {
          newSet.add(domain.id);
        }
        return newSet;
      });
    };
    
    return (
      <TableRow key={domain.id}>
        <TableCell className="font-medium">
          <div className="flex items-center">
            {canExpand && (
              <Button
                variant="ghost"
                size="icon"
                className="mr-2"
                aria-label={isExpanded ? "Collapse details" : "Expand details"}
                onClick={toggleExpanded}
              >
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            )}
            <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
            {domain.name}
          </div>
        </TableCell>
        <TableCell>{getStatusBadge(domain.verificationStatus, domain.id)}</TableCell>
        <TableCell>
          {domain.verifiedAt 
            ? formatDistanceToNow(new Date(domain.verifiedAt), { addSuffix: true })
            : domain.verificationStatus === "PENDING" 
              ? "Not verified yet" 
              : "—"}
        </TableCell>
        <TableCell>
          {formatDistanceToNow(new Date(domain.createdAt), { addSuffix: true })}
        </TableCell>
        <TableCell className="text-right">
          <div className="flex justify-end space-x-2">
            {domain.verificationStatus === "PENDING" && (
              <>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleVerifyDomain(domain.id)}
                        disabled={domainIsVerifying}
                      >
                        {domainIsVerifying ? (
                          <span className="flex items-center">
                            <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                            {domainVerificationProgress}%
                          </span>
                        ) : (
                          "Verify"
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Verify domain ownership</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Dialog open={regenerateDialogOpen[domain.id]} onOpenChange={(open) => setRegenerateDialogOpen(prev => ({ ...prev, [domain.id]: open }))}>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            disabled={domainIsRegenerating}
                            className="text-amber-600 hover:text-amber-800 border-amber-200 hover:border-amber-300"
                          >
                            <RefreshCw className={`h-4 w-4 ${domainIsRegenerating ? "animate-spin" : ""}`} />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Regenerate Verification Token</DialogTitle>
                            <DialogDescription>
                              This will generate a new verification token for <strong>{domain.name}</strong>. 
                              You'll need to update your DNS record with the new token value.
                            </DialogDescription>
                          </DialogHeader>
                          <Alert className="my-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Important</AlertTitle>
                            <AlertDescription>
                              After regenerating, your current DNS record will no longer work. 
                              Make sure to update it with the new token immediately.
                            </AlertDescription>
                          </Alert>
                          <DialogFooter>
                            <Button 
                              variant="outline" 
                              onClick={() => setRegenerateDialogOpen(prev => ({ ...prev, [domain.id]: false }))}
                            >
                              Cancel
                            </Button>
                            <Button 
                              onClick={() => handleRegenerateToken(domain.id)}
                              disabled={domainIsRegenerating}
                              className="bg-amber-600 hover:bg-amber-700"
                            >
                              {domainIsRegenerating ? (
                                <span className="flex items-center">
                                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                  Regenerating...
                                </span>
                              ) : (
                                "Regenerate Token"
                              )}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Regenerate verification token</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            )}
            
            {domain.verificationStatus === "FAILED" && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      size="sm" 
                      variant="default" 
                      onClick={() => handleRetryFailedDomain(domain.id)}
                      disabled={domainIsRegenerating || isRetrying}
                    >
                      <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${domainIsRegenerating || isRetrying ? "animate-spin" : ""}`} />
                      Retry
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Reset and retry verification</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            {domain.verificationStatus === "VERIFIED" && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleCreateWebsite(domain.id, domain.name)}
                      className="text-green-600 hover:text-green-800"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Website
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Create website with this domain</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Dialog open={deleteDialogOpen[domain.id]} onOpenChange={(open) => setDeleteDialogOpen(prev => ({ ...prev, [domain.id]: open }))}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="text-red-500 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Domain</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to delete {domain.name}? This action cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button 
                          variant="outline" 
                          onClick={() => setDeleteDialogOpen(prev => ({ ...prev, [domain.id]: false }))}
                        >
                          Cancel
                        </Button>
                        <Button 
                          variant="destructive" 
                          onClick={() => handleDeleteDomain(domain.id)}
                          disabled={domainIsDeleting}
                        >
                          {domainIsDeleting ? "Deleting..." : "Delete"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete domain</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  const renderVerificationDetails = (domain: Domain) => {
    if ((domain.verificationStatus !== "PENDING" && domain.verificationStatus !== "FAILED") || !expandedDomains.has(domain.id)) return null;
    
    const domainVerificationResult = verificationResult[domain.id];
    const verificationToken = domain.verificationToken;
    const host = `_databuddy.${domain.name}`;
    const isFailed = domain.verificationStatus === "FAILED";
    
    return (
      <TableRow>
        <TableCell colSpan={5} className="!p-0">
          <div className="rounded-lg border bg-muted/60 p-6 my-2 mx-1 flex flex-col gap-6">
            {/* Header with status indicator */}
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${isFailed ? 'bg-red-500' : 'bg-yellow-500'}`} />
              <h4 className="font-medium text-base">
                {isFailed ? "Verification Failed - Action Required" : "Domain Verification Required"}
              </h4>
            </div>
            
            {/* Step-by-step guidance with improved visual hierarchy */}
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary rounded-full h-8 w-8 flex items-center justify-center mt-0.5 flex-shrink-0">
                  <span className="text-sm font-medium text-primary-foreground">1</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium mb-3">Add this TXT record to your DNS settings</p>
                  <div className="flex flex-col md:flex-row gap-4 md:gap-8 w-full bg-background rounded-md p-4 border-2 border-dashed border-primary/20">
                    <CopyField label="Name / Host" value={host} onCopy={() => copyToClipboard(host)} />
                    <CopyField label="Value" value={verificationToken || ""} onCopy={() => copyToClipboard(verificationToken || "")} />
                  </div>
                  <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-200">
                    <p className="text-xs text-blue-800 font-medium mb-1">DNS Record Example:</p>
                    <code className="text-xs text-blue-700 break-all">{host} IN TXT "{verificationToken}"</code>
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-primary rounded-full h-8 w-8 flex items-center justify-center mt-0.5 flex-shrink-0">
                  <span className="text-sm font-medium text-primary-foreground">2</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium mb-2">Wait for DNS propagation</p>
                  <p className="text-xs text-muted-foreground">
                    DNS changes typically take 15-30 minutes but can take up to 24-48 hours to propagate worldwide.
                  </p>
                  <div className="mt-2 p-2 bg-amber-50 rounded border border-amber-200">
                    <p className="text-xs text-amber-800">
                      💡 <strong>Tip:</strong> You can check if your DNS record is live using{" "}
                      <a 
                        href={`https://mxtoolbox.com/TXTLookup.aspx?domain=${host}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-primary hover:underline font-medium"
                      >
                        this DNS lookup tool
                      </a>
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-primary rounded-full h-8 w-8 flex items-center justify-center mt-0.5 flex-shrink-0">
                  <span className="text-sm font-medium text-primary-foreground">3</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium mb-3">Verify your domain</p>
                  <div className="flex items-center gap-3">
                    <Button 
                      size="sm" 
                      onClick={() => handleVerifyDomain(domain.id)}
                      disabled={isVerifying[domain.id]}
                      className="h-9"
                    >
                      {isVerifying[domain.id] ? (
                        <span className="flex items-center">
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Verifying... {verificationProgress[domain.id] || 0}%
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Verify Domain
                        </span>
                      )}
                    </Button>
                    {isFailed && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleRetryFailedDomain(domain.id)}
                        disabled={isRegenerating[domain.id]}
                        className="h-9"
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isRegenerating[domain.id] ? "animate-spin" : ""}`} />
                        Reset & Try Again
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Troubleshooting section with better organization */}
            {isFailed && (
              <div className="mt-4 border-t pt-6 border-border">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <h5 className="font-medium text-sm">Troubleshooting Guide</h5>
                </div>
                <div className="grid gap-3">
                  <div className="p-3 bg-red-50 rounded border border-red-200">
                    <p className="text-xs font-medium text-red-800 mb-1">Common Issues:</p>
                    <ul className="text-xs text-red-700 space-y-1 list-disc pl-4">
                      <li>TXT record not added to the correct domain zone</li>
                      <li>Missing underscore in host field: should be <code className="bg-red-100 rounded px-1">_databuddy</code></li>
                      <li>Token value doesn't match exactly (copy/paste recommended)</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-blue-50 rounded border border-blue-200">
                    <p className="text-xs font-medium text-blue-800 mb-1">DNS Provider Notes:</p>
                    <ul className="text-xs text-blue-700 space-y-1 list-disc pl-4">
                      <li>Some providers require only <code className="bg-blue-100 rounded px-1">_databuddy</code> as the host (without domain)</li>
                      <li>Others need the full host: <code className="bg-blue-100 rounded px-1">{host}</code></li>
                      <li>Cloudflare users: Make sure the record is not proxied (gray cloud)</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            {/* Error message with better styling */}
            {domainVerificationResult && !domainVerificationResult.verified && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Verification Failed</AlertTitle>
                <AlertDescription className="mt-2">
                  {domainVerificationResult.message}
                  {domainVerificationResult.lastChecked && (
                    <div className="text-xs mt-2 opacity-75">
                      Last checked: {formatDistanceToNow(domainVerificationResult.lastChecked, { addSuffix: true })}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </TableCell>
      </TableRow>
    );
  };

  // Render pagination controls
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="flex items-center justify-between border-t pt-4 mt-4">
        <div className="text-sm text-muted-foreground">
          Showing {((currentPage - 1) * domainsPerPage) + 1} to {Math.min(currentPage * domainsPerPage, filteredDomains().length)} of {filteredDomains().length} domains
        </div>
        <div className="flex items-center space-x-1">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0"
          >
            &lt;
          </Button>
          
          {/* Page numbers */}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            // Show pages around current page
            let pageNum = currentPage;
            if (totalPages <= 5) {
              // If 5 or fewer pages, show all
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              // If near start, show first 5
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              // If near end, show last 5
              pageNum = totalPages - 4 + i;
            } else {
              // Otherwise show 2 before and 2 after current
              pageNum = currentPage - 2 + i;
            }
            
            return (
              <Button 
                key={`page-${pageNum}`}
                variant={currentPage === pageNum ? "default" : "outline"} 
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
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="h-8 w-8 p-0"
          >
            &gt;
          </Button>
        </div>
      </div>
    );
  };

  // Render empty state with better UX
  const renderEmptyState = () => {
    const isFiltering = searchQuery || filterStatus !== "all";
    
    return (
      <div className="py-12 text-center">
        {isFiltering ? (
          <>
            <div className="bg-muted/30 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
              <Filter className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No matching domains</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              No domains match your current filters. Try adjusting your search or filter criteria.
            </p>
            <Button variant="outline" onClick={() => {
              setSearchQuery("");
              setFilterStatus("all");
            }}>
              Clear Filters
            </Button>
          </>
        ) : hasError ? (
          <>
            <div className="bg-red-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-lg font-medium mb-2">Failed to load domains</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              There was a problem loading your domains. Please try again.
            </p>
            <Button onClick={fetchDomains}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </>
        ) : (
          <>
            <div className="bg-muted/30 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
              <Globe className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No domains yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Add your first domain to get started with DataBuddy. Once verified, you can create websites and track analytics.
            </p>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Domain
            </Button>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Domains</h1>
          <p className="text-muted-foreground">
            Manage your domains and DNS settings
          </p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Domain
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Domain</DialogTitle>
              <DialogDescription>
                Add a new domain to your account
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  placeholder="example.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter only the top-level domain (e.g., example.com). Subdomains and protocols will be removed.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddDomain} disabled={isAdding}>
                {isAdding ? "Adding..." : "Add Domain"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search domains..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-[200px]"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-9 w-[150px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Domains</SelectItem>
                  <SelectItem value="VERIFIED">Verified</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
              {(searchQuery || filterStatus !== "all") && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setSearchQuery("");
                    setFilterStatus("all");
                  }}
                  className="h-9"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[100px]" />
              </div>
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[100px]" />
                </div>
              ))}
            </div>
          ) : filteredDomains().length === 0 ? (
            renderEmptyState()
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Domain</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Verified</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getCurrentPageDomains().map(domain => (
                    <React.Fragment key={domain.id}>
                      {renderDomainRow(domain)}
                      {renderVerificationDetails(domain)}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
              
              {/* Pagination */}
              {renderPagination()}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 