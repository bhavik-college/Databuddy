"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TrashIcon, WarningCircleIcon, CaretDownIcon, CheckCircleIcon, ArrowClockwiseIcon } from "@phosphor-icons/react";
import type { Domain, DomainActions } from "../types";
import { useState } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface DomainRowActionsProps {
  domain: Domain;
  actions: DomainActions;
  domainIsVerifying: boolean;
  domainVerificationProgress: number;
  isRetrying: boolean;
  onVerify: () => void;
  onDelete: () => void;
  onRegenerate: () => void;
  onRetry: () => void;
  onCreate: () => void;
  updateActions: (updates: Partial<DomainActions>) => void;
}

export function DomainRowActions({
  domain,
  actions,
  domainIsVerifying,
  domainVerificationProgress,
  isRetrying,
  onVerify,
  onDelete,
  onRegenerate,
  onRetry,
  onCreate,
  updateActions
}: DomainRowActionsProps) {
  const domainIsDeleting = actions.isDeleting[domain.id] || false;
  const domainIsRegenerating = actions.isRegenerating[domain.id] || false;
  const deleteDialogOpen = actions.deleteDialogOpen[domain.id] || false;
  const regenerateDialogOpen = actions.regenerateDialogOpen[domain.id] || false;
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Primary action based on domain status
  const getPrimaryAction = () => {
    if (domain.verificationStatus === "PENDING") {
      return (
        <Button
          size="sm"
          variant="default"
          onClick={onVerify}
          disabled={domainIsVerifying}
          className="flex-1 sm:flex-none sm:min-w-[80px] text-xs font-medium transition-all duration-200 hover:shadow-sm"
          data-track="domain-verify-click"
          data-section="domains"
          data-domain-name={domain.name}
        >
          {domainIsVerifying ? (
            <span className="flex items-center justify-center">
              <ArrowClockwiseIcon size={12} weight="fill" className="h-3 w-3 mr-1.5 animate-spin" />
              <span className="hidden sm:inline">{domainVerificationProgress}%</span>
              <span className="sm:hidden">Verifying</span>
            </span>
          ) : (
            <>
              <CheckCircleIcon size={12} weight="fill" className="h-3 w-3 mr-1.5" />
              Verify
            </>
          )}
        </Button>
      );
    }

    if (domain.verificationStatus === "FAILED") {
      return (
        <Button
          size="sm"
          variant="default"
          onClick={onRetry}
          disabled={domainIsRegenerating || isRetrying}
          className="flex-1 sm:flex-none sm:min-w-[80px] text-xs font-medium transition-all duration-200 hover:shadow-sm"
          data-track="domain-retry-click"
          data-section="domains"
          data-domain-name={domain.name}
        >
          <ArrowClockwiseIcon size={12} weight="fill" className={`h-3 w-3 mr-1.5 ${domainIsRegenerating || isRetrying ? "animate-spin" : ""}`} />
          Retry
        </Button>
      );
    }

    return null;
  };

  // Secondary actions for dropdown
  const getSecondaryActions = () => {
    const secondaryActionsList: Array<{
      label: string;
      icon: any;
      onClick: () => void;
      disabled: boolean;
      className?: string;
      loading?: boolean;
      destructive?: boolean;
    }> = [];

    if (domain.verificationStatus === "PENDING") {
      secondaryActionsList.push({
        label: "Regenerate Token",
        icon: ArrowClockwiseIcon,
        onClick: () => {
          setDropdownOpen(false);
          updateActions({
            regenerateDialogOpen: { ...actions.regenerateDialogOpen, [domain.id]: true }
          });
        },
        disabled: domainIsRegenerating,
        className: "text-amber-600 hover:text-amber-700",
        loading: domainIsRegenerating
      });
    }

    secondaryActionsList.push({
      label: "Delete Domain",
      icon: TrashIcon,
      onClick: () => {
        setDropdownOpen(false);
        updateActions({
          deleteDialogOpen: { ...actions.deleteDialogOpen, [domain.id]: true }
        });
      },
      disabled: domainIsDeleting,
      className: "text-red-600 hover:text-red-700",
      loading: domainIsDeleting,
      destructive: true
    });

    return secondaryActionsList;
  };

  const primaryAction = getPrimaryAction();
  const secondaryActions = getSecondaryActions();

  return (
    <>
      <div className="flex items-center gap-2 min-w-0">
        {/* Primary Action */}
        {primaryAction && (
          <div className="flex-1 sm:flex-none">
            {primaryAction}
          </div>
        )}

        {/* Secondary Actions Dropdown */}
        {secondaryActions.length > 0 && (
          <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="flex-shrink-0 w-8 h-8 p-0 hover:bg-muted/80 transition-all duration-200"
                data-track="domain-actions-menu-click"
                data-section="domains"
                data-domain-name={domain.name}
              >
                <CaretDownIcon size={12} weight="fill" className="h-3 w-3" />
                <span className="sr-only">More actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {secondaryActions.map((action, index) => (
                <DropdownMenuItem
                  key={index}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={`cursor-pointer ${action.className || ""} ${action.destructive ? "focus:bg-red-50 focus:text-red-700 dark:focus:bg-red-950/20" : ""}`}
                >
                  <action.icon className={`h-4 w-4 mr-2 ${action.loading ? "animate-spin" : ""}`} />
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Regenerate Token Dialog */}
      <Dialog
        open={regenerateDialogOpen}
        onOpenChange={(open) => updateActions({
          regenerateDialogOpen: { ...actions.regenerateDialogOpen, [domain.id]: open }
        })}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowClockwiseIcon size={20} weight="fill" className="h-5 w-5 text-amber-600" />
              Regenerate Verification Token
            </DialogTitle>
            <DialogDescription>
              This will generate a new verification token for <strong>{domain.name}</strong>.
              You'll need to update your DNS record with the new token value.
            </DialogDescription>
          </DialogHeader>
          <Alert className="my-4 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
            <WarningCircleIcon size={16} weight="fill" className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-700 dark:text-amber-400">Important</AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-300">
              After regenerating, your current DNS record will no longer work.
              Make sure to update it with the new token immediately.
            </AlertDescription>
          </Alert>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => updateActions({
                regenerateDialogOpen: { ...actions.regenerateDialogOpen, [domain.id]: false }
              })}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={onRegenerate}
              disabled={domainIsRegenerating}
              className="bg-amber-600 hover:bg-amber-700 w-full sm:w-auto"
            >
              {domainIsRegenerating ? (
                <span className="flex items-center">
                  <ArrowClockwiseIcon size={16} weight="fill" className="h-4 w-4 mr-2 animate-spin" />
                  Regenerating...
                </span>
              ) : (
                <>
                  <ArrowClockwiseIcon size={16} weight="fill" className="h-4 w-4 mr-2" />
                  Regenerate Token
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Domain Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => updateActions({
          deleteDialogOpen: { ...actions.deleteDialogOpen, [domain.id]: open }
        })}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrashIcon size={20} weight="fill" className="h-5 w-5 text-red-600" />
              Delete Domain
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{domain.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <Alert className="my-4 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
            <WarningCircleIcon size={16} weight="fill" className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-600">Warning</AlertTitle>
            <AlertDescription className="text-red-700 dark:text-red-300">
              This will permanently delete the domain and all associated websites and analytics data.
            </AlertDescription>
          </Alert>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => updateActions({
                deleteDialogOpen: { ...actions.deleteDialogOpen, [domain.id]: false }
              })}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onDelete}
              disabled={domainIsDeleting}
              className="w-full sm:w-auto"
            >
              {domainIsDeleting ? (
                <span className="flex items-center">
                  <ArrowClockwiseIcon size={16} weight="fill" className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </span>
              ) : (
                <>
                  <TrashIcon size={16} weight="fill" className="h-4 w-4 mr-2" />
                  Delete Domain
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 