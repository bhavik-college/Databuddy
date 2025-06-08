"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useDomains } from "@/hooks/use-domains";
import type { Domain, VerificationResult, DomainState, DomainActions } from "../types";
import { cleanDomainInput, validateDomainFormat } from "../utils";

export const useDomainManagement = () => {
  const router = useRouter();
  const domainsHook = useDomains();

  // State
  const [state, setState] = useState<DomainState>({
    domains: [],
    isLoading: true,
    hasError: false,
    currentPage: 1,
    searchQuery: "",
    filterStatus: "all",
    expandedDomains: new Set()
  });

  // Actions state
  const [actions, setActions] = useState<DomainActions>({
    isVerifying: {},
    isDeleting: {},
    isRegenerating: {},
    verificationResult: {},
    verificationProgress: {},
    retryingDomains: {},
    deleteDialogOpen: {},
    regenerateDialogOpen: {}
  });

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [domain, setDomain] = useState("");
  const domainsPerPage = 10;

  // Update state when domains data changes
  useEffect(() => {
    const domains = domainsHook.domains || [];
    const domainsNeedingVerification = domains
      .filter(domain => domain.verificationStatus === "PENDING" || domain.verificationStatus === "FAILED")
      .map(domain => domain.id);
      
    setState(prev => ({
      ...prev,
      domains,
      isLoading: domainsHook.isLoading,
      hasError: domainsHook.isError,
      expandedDomains: domains.length > 0 ? new Set(domainsNeedingVerification) : prev.expandedDomains
    }));
  }, [domainsHook.domains, domainsHook.isLoading, domainsHook.isError]);

  // Fetch domains (now just refetch from the hook)
  const fetchDomains = useCallback(() => {
    domainsHook.refetch();
  }, [domainsHook.refetch]);

  // Add domain
  const handleAddDomain = async () => {
    if (!domain) {
      toast.error("Please enter a domain");
      return;
    }

    const cleanedDomain = cleanDomainInput(domain);
    
    if (!validateDomainFormat(cleanedDomain)) {
      toast.error("Please enter a valid top-level domain (e.g., example.com)");
      return;
    }

    domainsHook.createDomain({ name: cleanedDomain }, {
      onSuccess: () => {
        toast.success(`Domain ${cleanedDomain} added successfully`);
        setDomain("");
        setAddDialogOpen(false);
      }
    });
  };

  // Verify domain
  const handleVerifyDomain = async (domainId: string) => {
    if (!domainId) {
      toast.error("Invalid domain ID");
      return;
    }

    setActions(prev => ({ 
      ...prev, 
      isVerifying: { ...prev.isVerifying, [domainId]: true },
      verificationProgress: { ...prev.verificationProgress, [domainId]: 25 }
    }));
    
    const domainToVerify = state.domains.find(d => d.id === domainId);
    
    if (domainToVerify?.verificationStatus === "FAILED") {
      setActions(prev => ({ 
        ...prev, 
        retryingDomains: { ...prev.retryingDomains, [domainId]: true }
      }));
    }
    
    setActions(prev => ({ 
      ...prev, 
      verificationProgress: { ...prev.verificationProgress, [domainId]: 75 }
    }));

    // Use the domains hook to verify
    domainsHook.verifyDomain(domainId, {
      onSuccess: (result) => {
        setActions(prev => ({ 
          ...prev, 
          verificationProgress: { ...prev.verificationProgress, [domainId]: 100 },
          verificationResult: { 
            ...prev.verificationResult, 
            [domainId]: {
              verified: Boolean(result.verified),
              message: String(result.message || ""),
              lastChecked: new Date()
            }
          },
          isVerifying: { ...prev.isVerifying, [domainId]: false },
          retryingDomains: { ...prev.retryingDomains, [domainId]: false }
        }));
        
        if (result.verified) {
          toast.success("Domain verified successfully");
        } else {
          toast.error(result.message || "Verification failed", {
            action: {
              label: "Retry",
              onClick: () => handleVerifyDomain(domainId)
            }
          });
        }
        
        setTimeout(() => {
          setActions(prev => ({ 
            ...prev, 
            verificationProgress: { ...prev.verificationProgress, [domainId]: 0 }
          }));
        }, 1000);
      },
      onError: (error) => {
        setActions(prev => ({ 
          ...prev, 
          verificationResult: { 
            ...prev.verificationResult, 
            [domainId]: {
              verified: false,
              message: error.message || "Failed to verify domain",
              error: error.message,
              lastChecked: new Date()
            }
          },
          isVerifying: { ...prev.isVerifying, [domainId]: false },
          retryingDomains: { ...prev.retryingDomains, [domainId]: false }
        }));
        
        setTimeout(() => {
          setActions(prev => ({ 
            ...prev, 
            verificationProgress: { ...prev.verificationProgress, [domainId]: 0 }
          }));
        }, 1000);
      }
    });
  };

  // Delete domain
  const handleDeleteDomain = async (domainId: string) => {
    setActions(prev => ({ 
      ...prev, 
      isDeleting: { ...prev.isDeleting, [domainId]: true }
    }));
    
    domainsHook.deleteDomain(domainId, {
      onSuccess: () => {
        toast.success("Domain deleted successfully");
        setActions(prev => ({ 
          ...prev, 
          deleteDialogOpen: { ...prev.deleteDialogOpen, [domainId]: false },
          isDeleting: { ...prev.isDeleting, [domainId]: false }
        }));
      },
      onError: (error) => {
        toast.error(error.message || "Failed to delete domain");
        setActions(prev => ({ 
          ...prev, 
          isDeleting: { ...prev.isDeleting, [domainId]: false }
        }));
      }
    });
  };

  // Regenerate token
  const handleRegenerateToken = async (domainId: string) => {
    setActions(prev => ({ 
      ...prev, 
      isRegenerating: { ...prev.isRegenerating, [domainId]: true }
    }));
    
    domainsHook.regenerateToken(domainId, {
      onSuccess: () => {
        toast.success("Verification token regenerated", {
          description: "Please update your DNS record with the new token"
        });
        setActions(prev => ({ 
          ...prev, 
          regenerateDialogOpen: { ...prev.regenerateDialogOpen, [domainId]: false },
          isRegenerating: { ...prev.isRegenerating, [domainId]: false }
        }));
      },
      onError: (error) => {
        toast.error(error.message || "Failed to regenerate token");
        setActions(prev => ({ 
          ...prev, 
          isRegenerating: { ...prev.isRegenerating, [domainId]: false }
        }));
      }
    });
  };

  // Retry failed domain
  const handleRetryFailedDomain = async (domainId: string) => {
    setActions(prev => ({ 
      ...prev, 
      isRegenerating: { ...prev.isRegenerating, [domainId]: true }
    }));
    
    domainsHook.regenerateToken(domainId, {
      onSuccess: () => {
        toast.success("Verification token regenerated", {
          description: "Try adding the new DNS record and verify again"
        });
        
        setState(prev => ({
          ...prev,
          expandedDomains: new Set([...prev.expandedDomains, domainId])
        }));
        
        setActions(prev => ({ 
          ...prev, 
          isRegenerating: { ...prev.isRegenerating, [domainId]: false }
        }));
      },
      onError: (error) => {
        toast.error(`Failed to regenerate token: ${error.message}`);
        setActions(prev => ({ 
          ...prev, 
          isRegenerating: { ...prev.isRegenerating, [domainId]: false }
        }));
      }
    });
  };

  // Create website
  const handleCreateWebsite = (domainId: string, domainName: string) => {
    router.push(`/websites?new=true&domain=${domainName}&domainId=${domainId}`);
  };

  // Toggle expanded
  const toggleExpanded = (domainId: string) => {
    setState(prev => {
      const newExpandedDomains = new Set(prev.expandedDomains);
      if (newExpandedDomains.has(domainId)) {
        newExpandedDomains.delete(domainId);
      } else {
        newExpandedDomains.add(domainId);
      }
      return {
        ...prev,
        expandedDomains: newExpandedDomains
      };
    });
  };

  // Update state setters
  const updateState = (updates: Partial<DomainState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const updateActions = (updates: Partial<DomainActions>) => {
    setActions(prev => ({ ...prev, ...updates }));
  };

  return {
    // State
    state,
    actions,
    domain,
    setDomain,
    isAdding: domainsHook.isCreating,
    addDialogOpen,
    setAddDialogOpen,
    domainsPerPage,
    
    // Actions
    fetchDomains,
    handleAddDomain,
    handleVerifyDomain,
    handleDeleteDomain,
    handleRegenerateToken,
    handleRetryFailedDomain,
    handleCreateWebsite,
    toggleExpanded,
    updateState,
    updateActions
  };
}; 