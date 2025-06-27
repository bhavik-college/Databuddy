"use client";

import { ArrowClockwiseIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import type { Domain, DomainActions, VerificationResult } from "../types";
import { CopyField } from "./copy-field";

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
  onCopy,
}: VerificationDetailsProps) {
  const verificationToken = domain.verificationToken;
  const host = `_databuddy.${domain.name}`;
  const isFailed = domain.verificationStatus === "FAILED";
  const isVerifying = actions.isVerifying[domain.id];
  const isRegenerating = actions.isRegenerating[domain.id];

  return (
    <div className="space-y-3 bg-muted/30 p-3 sm:space-y-4 sm:p-4">
      <div>
        <h4 className="mb-2 font-medium text-sm sm:mb-3">
          {isFailed ? "Verification Failed" : "Add DNS Record"}
        </h4>

        <div className="space-y-3 sm:space-y-4">
          <div className="space-y-2 sm:space-y-3">
            <p className="text-muted-foreground text-xs sm:text-sm">
              Add this TXT record to your DNS:
            </p>
            <div className="space-y-2 rounded border bg-background p-2 sm:space-y-3 sm:p-3">
              <CopyField label="Name" onCopy={() => onCopy(host)} value={host} />
              <CopyField
                label="Value"
                onCopy={() => onCopy(verificationToken || "")}
                value={verificationToken || ""}
              />
            </div>
            <p className="text-muted-foreground text-xs">
              DNS changes take 15-30 minutes to propagate.{" "}
              <a
                className="text-primary hover:underline"
                href={`https://mxtoolbox.com/TXTLookup.aspx?domain=${host}`}
                rel="noopener noreferrer"
                target="_blank"
              >
                Check DNS record →
              </a>
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button className="w-full" disabled={isVerifying} onClick={onVerify} size="sm">
              {isVerifying ? (
                <>
                  <ArrowClockwiseIcon
                    className="mr-2 h-4 w-4 animate-spin"
                    size={16}
                    weight="fill"
                  />
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
        <div className="space-y-3 border-t pt-3 sm:space-y-4 sm:pt-4">
          <div>
            <p className="mb-2 font-medium text-sm">Common Issues:</p>
            <ul className="space-y-1 text-muted-foreground text-xs sm:text-sm">
              <li>• Record not added to correct domain zone</li>
              <li>
                • Missing underscore: use{" "}
                <code className="break-all rounded bg-muted px-1 text-xs">_databuddy</code> exactly
              </li>
              <li>• Token value copied incorrectly</li>
              <li>• DNS not propagated yet (can take 24 hours)</li>
            </ul>
          </div>
          <div>
            <p className="mb-2 font-medium text-sm">Provider-Specific Notes:</p>
            <ul className="space-y-1 text-muted-foreground text-xs sm:text-sm">
              <li>
                • <strong>Cloudflare:</strong> Turn off proxy (gray cloud)
              </li>
              <li>
                • <strong>Some providers:</strong> Use{" "}
                <code className="break-all rounded bg-muted px-1 text-xs">_databuddy</code> only
              </li>
              <li className="break-words">
                • <strong>GoDaddy/Namecheap:</strong> Use full host{" "}
                <code className="break-all rounded bg-muted px-1 text-xs">{host}</code>
              </li>
            </ul>
          </div>
        </div>
      )}

      {verificationResult && !verificationResult.verified && (
        <div className="border-t pt-3 sm:pt-4">
          <p className="text-muted-foreground text-xs sm:text-sm">{verificationResult.message}</p>
        </div>
      )}
    </div>
  );
}
