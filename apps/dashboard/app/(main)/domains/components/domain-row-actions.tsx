"use client";

import {
  ArrowClockwiseIcon,
  CaretDownIcon,
  CheckCircleIcon,
  TrashIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Domain, DomainActions } from "../types";

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
  updateActions,
}: DomainRowActionsProps) {
  const domainIsDeleting = actions.isDeleting[domain.id];
  const domainIsRegenerating = actions.isRegenerating[domain.id];
  const deleteDialogOpen = actions.deleteDialogOpen[domain.id];
  const regenerateDialogOpen = actions.regenerateDialogOpen[domain.id];
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Primary action based on domain status
  const getPrimaryAction = () => {
    if (domain.verificationStatus === "PENDING") {
      return (
        <Button
          className="flex-1 font-medium text-xs transition-all duration-200 hover:shadow-sm sm:min-w-[80px] sm:flex-none"
          data-domain-name={domain.name}
          data-section="domains"
          data-track="domain-verify-click"
          disabled={domainIsVerifying}
          onClick={onVerify}
          size="sm"
          variant="default"
        >
          {domainIsVerifying ? (
            <span className="flex items-center justify-center">
              <ArrowClockwiseIcon className="mr-1.5 h-3 w-3 animate-spin" size={12} weight="fill" />
              <span className="hidden sm:inline">{domainVerificationProgress}%</span>
              <span className="sm:hidden">Verifying</span>
            </span>
          ) : (
            <>
              <CheckCircleIcon className="mr-1.5 h-3 w-3" size={12} weight="fill" />
              Verify
            </>
          )}
        </Button>
      );
    }

    if (domain.verificationStatus === "FAILED") {
      return (
        <Button
          className="flex-1 font-medium text-xs transition-all duration-200 hover:shadow-sm sm:min-w-[80px] sm:flex-none"
          data-domain-name={domain.name}
          data-section="domains"
          data-track="domain-retry-click"
          disabled={domainIsRegenerating || isRetrying}
          onClick={onRetry}
          size="sm"
          variant="default"
        >
          <ArrowClockwiseIcon
            className={`mr-1.5 h-3 w-3 ${domainIsRegenerating || isRetrying ? "animate-spin" : ""}`}
            size={12}
            weight="fill"
          />
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
            regenerateDialogOpen: { ...actions.regenerateDialogOpen, [domain.id]: true },
          });
        },
        disabled: domainIsRegenerating,
        className: "text-amber-600 hover:text-amber-700",
        loading: domainIsRegenerating,
      });
    }

    secondaryActionsList.push({
      label: "Delete Domain",
      icon: TrashIcon,
      onClick: () => {
        setDropdownOpen(false);
        updateActions({
          deleteDialogOpen: { ...actions.deleteDialogOpen, [domain.id]: true },
        });
      },
      disabled: domainIsDeleting,
      className: "text-red-600 hover:text-red-700",
      loading: domainIsDeleting,
      destructive: true,
    });

    return secondaryActionsList;
  };

  const primaryAction = getPrimaryAction();
  const secondaryActions = getSecondaryActions();

  return (
    <>
      <div className="flex min-w-0 items-center gap-2">
        {/* Primary Action */}
        {primaryAction && <div className="flex-1 sm:flex-none">{primaryAction}</div>}

        {/* Secondary Actions Dropdown */}
        {secondaryActions.length > 0 && (
          <DropdownMenu onOpenChange={setDropdownOpen} open={dropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                className="h-8 w-8 flex-shrink-0 p-0 transition-all duration-200 hover:bg-muted/80"
                data-domain-name={domain.name}
                data-section="domains"
                data-track="domain-actions-menu-click"
                size="sm"
                variant="outline"
              >
                <CaretDownIcon className="h-3 w-3" size={12} weight="fill" />
                <span className="sr-only">More actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {secondaryActions.map((action, index) => (
                <DropdownMenuItem
                  className={`cursor-pointer ${action.className || ""} ${action.destructive ? "focus:bg-red-50 focus:text-red-700 dark:focus:bg-red-950/20" : ""}`}
                  disabled={action.disabled}
                  key={index}
                  onClick={action.onClick}
                >
                  <action.icon className={`mr-2 h-4 w-4 ${action.loading ? "animate-spin" : ""}`} />
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Regenerate Token Dialog */}
      <Dialog
        onOpenChange={(open) =>
          updateActions({
            regenerateDialogOpen: { ...actions.regenerateDialogOpen, [domain.id]: open },
          })
        }
        open={regenerateDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowClockwiseIcon className="h-5 w-5 text-amber-600" size={20} weight="fill" />
              Regenerate Verification Token
            </DialogTitle>
            <DialogDescription>
              This will generate a new verification token for <strong>{domain.name}</strong>. You'll
              need to update your DNS record with the new token value.
            </DialogDescription>
          </DialogHeader>
          <Alert className="my-4 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
            <WarningCircleIcon className="h-4 w-4 text-amber-600" size={16} weight="fill" />
            <AlertTitle className="text-amber-700 dark:text-amber-400">Important</AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-300">
              After regenerating, your current DNS record will no longer work. Make sure to update
              it with the new token immediately.
            </AlertDescription>
          </Alert>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              className="w-full sm:w-auto"
              onClick={() =>
                updateActions({
                  regenerateDialogOpen: { ...actions.regenerateDialogOpen, [domain.id]: false },
                })
              }
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              className="w-full bg-amber-600 hover:bg-amber-700 sm:w-auto"
              disabled={domainIsRegenerating}
              onClick={onRegenerate}
            >
              {domainIsRegenerating ? (
                <span className="flex items-center">
                  <ArrowClockwiseIcon
                    className="mr-2 h-4 w-4 animate-spin"
                    size={16}
                    weight="fill"
                  />
                  Regenerating...
                </span>
              ) : (
                <>
                  <ArrowClockwiseIcon className="mr-2 h-4 w-4" size={16} weight="fill" />
                  Regenerate Token
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Domain Dialog */}
      <Dialog
        onOpenChange={(open) =>
          updateActions({
            deleteDialogOpen: { ...actions.deleteDialogOpen, [domain.id]: open },
          })
        }
        open={deleteDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrashIcon className="h-5 w-5 text-red-600" size={20} weight="fill" />
              Delete Domain
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{domain.name}</strong>? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <Alert className="my-4 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
            <WarningCircleIcon className="h-4 w-4 text-red-600" size={16} weight="fill" />
            <AlertTitle className="text-red-600">Warning</AlertTitle>
            <AlertDescription className="text-red-700 dark:text-red-300">
              This will permanently delete the domain and all associated websites and analytics
              data.
            </AlertDescription>
          </Alert>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              className="w-full sm:w-auto"
              onClick={() =>
                updateActions({
                  deleteDialogOpen: { ...actions.deleteDialogOpen, [domain.id]: false },
                })
              }
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              className="w-full sm:w-auto"
              disabled={domainIsDeleting}
              onClick={onDelete}
              variant="destructive"
            >
              {domainIsDeleting ? (
                <span className="flex items-center">
                  <ArrowClockwiseIcon
                    className="mr-2 h-4 w-4 animate-spin"
                    size={16}
                    weight="fill"
                  />
                  Deleting...
                </span>
              ) : (
                <>
                  <TrashIcon className="mr-2 h-4 w-4" size={16} weight="fill" />
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
