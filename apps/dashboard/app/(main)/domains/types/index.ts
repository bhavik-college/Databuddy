import type { domains } from "@databuddy/db";

export type Domain = typeof domains.$inferSelect;

export type VerificationResult = {
  verified: boolean;
  message: string;
  error?: string;
  lastChecked?: Date;
};

export type VerificationStatus = "VERIFIED" | "PENDING" | "FAILED" | "RETRYING";

export interface DomainState {
  domains: Domain[];
  isLoading: boolean;
  hasError: boolean;
  currentPage: number;
  searchQuery: string;
  filterStatus: string;
  expandedDomains: Set<string>;
}

export interface DomainActions {
  isVerifying: Record<string, boolean>;
  isDeleting: Record<string, boolean>;
  isRegenerating: Record<string, boolean>;
  verificationResult: Record<string, VerificationResult>;
  verificationProgress: Record<string, number>;
  retryingDomains: Record<string, boolean>;
  deleteDialogOpen: Record<string, boolean>;
  regenerateDialogOpen: Record<string, boolean>;
}
