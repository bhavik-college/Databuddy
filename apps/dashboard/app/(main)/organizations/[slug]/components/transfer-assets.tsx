"use client";

import { ArrowRight, Buildings, User } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useWebsiteTransfer } from "@/hooks/use-website-transfer";
import { WebsiteSelector } from "./website-selector";

export function TransferAssets({ organizationId }: { organizationId: string }) {
  const { personalWebsites, organizationWebsites, transferWebsite, isTransferring, isLoading } =
    useWebsiteTransfer(organizationId);
  const [selectedWebsite, setSelectedWebsite] = useState<string | null>(null);

  const selectedSide = personalWebsites.some((w) => w.id === selectedWebsite)
    ? "personal"
    : organizationWebsites.some((w) => w.id === selectedWebsite)
      ? "organization"
      : null;

  const handleTransfer = () => {
    if (!(selectedWebsite && selectedSide)) return;

    const destination = selectedSide === "personal" ? { organizationId } : { organizationId: null };

    transferWebsite(
      { websiteId: selectedWebsite, destination },
      {
        onSuccess: () => {
          setSelectedWebsite(null);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
        {/* Personal Websites */}
        <div className="flex flex-col gap-2 rounded-lg border p-4">
          <div className="mb-2 flex items-center gap-2">
            <User size={16} />
            <h4 className="font-semibold">Your Websites</h4>
          </div>
          <WebsiteSelector
            onSelectWebsite={setSelectedWebsite}
            selectedWebsite={selectedWebsite}
            websites={personalWebsites}
          />
        </div>

        <div className="flex items-center justify-center">
          <Button
            disabled={!selectedSide || isTransferring}
            onClick={handleTransfer}
            size="icon"
            variant="outline"
          >
            <ArrowRight />
          </Button>
        </div>

        {/* Organization Websites */}
        <div className="flex flex-col gap-2 rounded-lg border p-4">
          <div className="mb-2 flex items-center gap-2">
            <Buildings size={16} />
            <h4 className="font-semibold">Organization Websites</h4>
          </div>
          <WebsiteSelector
            onSelectWebsite={setSelectedWebsite}
            selectedWebsite={selectedWebsite}
            websites={organizationWebsites}
          />
        </div>
      </div>
    </div>
  );
}
