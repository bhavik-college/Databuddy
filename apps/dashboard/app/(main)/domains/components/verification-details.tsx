"use client";

import { Button } from "@/components/ui/button";
import { ArrowClockwiseIcon } from "@phosphor-icons/react";
import { CopyField } from "./copy-field";
import type { Domain, DomainActions, VerificationResult } from "../types";

interface VerificationDetailsProps {
  domain: Domain;
  actions: DomainActions;
  verificationResult?: VerificationResult;
  onVerify: () => void;
  onRetry: () => void;
  onCopy: (text: string) => void;
}

export function VerificationDetails({
  domain,
  actions,
  verificationResult,
  onVerify,
  onRetry,
  onCopy
}: VerificationDetailsProps) {
  const verificationToken = domain.verificationToken;
  const host = `_databuddy.${domain.name}`;
  const isFailed = domain.verificationStatus === "FAILED";
  const isVerifying = actions.isVerifying[domain.id] || false;
  const isRegenerating = actions.isRegenerating[domain.id] || false;

  return (
    <div className="bg-muted/30 p-3 sm:p-4 space-y-3 sm:space-y-4">
      <div>
        <h4 className="font-medium text-sm mb-2 sm:mb-3">
          {isFailed ? "Verification Failed" : "Add DNS Record"}
        </h4>

        <div className="space-y-3 sm:space-y-4">
          <div className="space-y-2 sm:space-y-3">
            <p className="text-xs sm:text-sm text-muted-foreground">Add this TXT record to your DNS:</p>
            <div className="space-y-2 sm:space-y-3 bg-background rounded p-2 sm:p-3 border">
              <CopyField label="Name" value={host} onCopy={() => onCopy(host)} />
              <CopyField label="Value" value={verificationToken || ""} onCopy={() => onCopy(verificationToken || "")} />
            </div>
            <p className="text-xs text-muted-foreground">
              DNS changes take 15-30 minutes to propagate.{" "}
              <a
                href={`https://mxtoolbox.com/TXTLookup.aspx?domain=${host}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Check DNS record →
              </a>
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              size="sm"
              onClick={onVerify}
              disabled={isVerifying}
              className="w-full"
            >
              {isVerifying ? (
                <>
                  <ArrowClockwiseIcon size={16} weight="fill" className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Domain"
              )}
            </Button>
          </div>
        </div>
      </div>

      {isFailed && (
        <div className="pt-3 sm:pt-4 border-t space-y-3 sm:space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Common Issues:</p>
            <ul className="text-xs sm:text-sm text-muted-foreground space-y-1">
              <li>• Record not added to correct domain zone</li>
              <li>• Missing underscore: use <code className="bg-muted px-1 rounded text-xs break-all">_databuddy</code> exactly</li>
              <li>• Token value copied incorrectly</li>
              <li>• DNS not propagated yet (can take 24 hours)</li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Provider-Specific Notes:</p>
            <ul className="text-xs sm:text-sm text-muted-foreground space-y-1">
              <li>• <strong>Cloudflare:</strong> Turn off proxy (gray cloud)</li>
              <li>• <strong>Some providers:</strong> Use <code className="bg-muted px-1 rounded text-xs break-all">_databuddy</code> only</li>
              <li className="break-words">• <strong>GoDaddy/Namecheap:</strong> Use full host <code className="bg-muted px-1 rounded text-xs break-all">{host}</code></li>
            </ul>
          </div>
        </div>
      )}

      {verificationResult && !verificationResult.verified && (
        <div className="pt-3 sm:pt-4 border-t">
          <p className="text-xs sm:text-sm text-muted-foreground">
            {verificationResult.message}
          </p>
        </div>
      )}
    </div>
  );
} 