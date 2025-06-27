import { Check, Copy, Loader2, RefreshCw } from "lucide-react";
import { memo, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Website } from "@/hooks/use-websites";

// Helper to extract domain string from domain object or string
function getDomainString(domain: string | { name: string } | any): string {
  if (typeof domain === "string") {
    return domain;
  }

  if (domain && typeof domain === "object" && "name" in domain) {
    return domain.name;
  }

  return "";
}

// Extended Website type for verification properties
interface VerifiableDomain extends Website {
  verificationStatus?: string;
  verificationToken?: string | null;
}

interface VerificationDialogProps {
  website: VerifiableDomain | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerify: (id: string) => void;
  onRegenerateToken: (id: string) => Promise<{ data?: VerifiableDomain; error?: string }>;
  isVerifying: boolean;
  isRegenerating: boolean;
}

export const VerificationDialog = memo(function VerificationDialog({
  website,
  open,
  onOpenChange,
  onVerify,
  onRegenerateToken,
  isVerifying,
  isRegenerating,
}: VerificationDialogProps) {
  const [displayToken, setDisplayToken] = useState<string>("");

  // Reset token when dialog closes
  useEffect(() => {
    if (!open) {
      setDisplayToken("");
    }
  }, [open]);

  // Memoize these functions to prevent recreating on each render
  const getDomainForDNS = useCallback((domainInput: string | object | undefined) => {
    try {
      // Extract domain as string
      const domainStr = getDomainString(domainInput || "");
      if (!domainStr) return "";

      // Ensure domain has a protocol
      const domainWithProtocol = domainStr.startsWith("http") ? domainStr : `https://${domainStr}`;
      return new URL(domainWithProtocol).hostname.replace(/^www\./, "");
    } catch (error) {
      console.error("Invalid domain:", domainInput);
      return typeof domainInput === "string" ? domainInput : "";
    }
  }, []);

  const handleVerifyDomain = useCallback(() => {
    if (!website) return;
    onVerify(website.id);
  }, [website, onVerify]);

  const handleRegenerateToken = useCallback(async () => {
    if (!website) return;

    try {
      const result = await onRegenerateToken(website.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.data?.verificationToken) {
        setDisplayToken(result.data.verificationToken);
        toast.success("Token regenerated", {
          description: "Please update your DNS record with the new token.",
        });
      }
    } catch (error) {
      console.error("Error regenerating token:", error);
      toast.error("Failed to regenerate token");
    }
  }, [website, onRegenerateToken]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const isVerified = website?.verificationStatus === "VERIFIED";

  // If not open, don't render anything (optimization)
  if (!open) return null;

  // Get domain string for display
  const domainForDisplay = getDomainString(website?.domain || "");

  return (
    <Dialog onOpenChange={handleClose} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Verify Domain</DialogTitle>
          <DialogDescription>
            Verify ownership of {domainForDisplay} by adding a DNS record.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">DNS Verification</h4>
            <p className="text-muted-foreground text-sm">
              Add the following DNS TXT record to verify ownership of your domain:
            </p>
            <div className="rounded-md bg-muted p-3 font-mono text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">TXT Record:</span>
                <Button
                  className="h-6 px-2"
                  onClick={() => {
                    const dnsRecord = `_databuddy.${getDomainForDNS(website?.domain)}`;
                    navigator.clipboard.writeText(dnsRecord);
                    toast("DNS record name copied to clipboard");
                  }}
                  size="sm"
                  variant="ghost"
                >
                  <Copy className="mr-1 h-3 w-3" />
                  Copy
                </Button>
              </div>
              <div className="mt-1">_databuddy.{getDomainForDNS(website?.domain)}</div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-muted-foreground">Value:</span>
                <Button
                  className="h-6 px-2"
                  onClick={() => {
                    navigator.clipboard.writeText(displayToken);
                    toast("Verification token copied to clipboard");
                  }}
                  size="sm"
                  variant="ghost"
                >
                  <Copy className="mr-1 h-3 w-3" />
                  Copy
                </Button>
              </div>
              <div className="mt-1">{displayToken}</div>
            </div>
            <p className="mt-2 text-muted-foreground text-xs">
              Note: DNS changes can take up to 48 hours to propagate. If verification fails, wait a
              while and try again.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              className="flex-1"
              disabled={isVerifying || isVerified}
              onClick={handleVerifyDomain}
              size="sm"
              variant="outline"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : isVerified ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Verified
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Verify Domain
                </>
              )}
            </Button>
            <Button
              disabled={isRegenerating || isVerified}
              onClick={handleRegenerateToken}
              size="sm"
              variant="ghost"
            >
              {isRegenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate
                </>
              )}
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleClose} variant="outline">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
