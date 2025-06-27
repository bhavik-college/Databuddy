"use client";

import type { Website } from "@databuddy/shared";
import { Globe } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

function WebsiteCard({
  website,
  selected,
  onClick,
}: {
  website: Website;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "flex w-full items-center gap-3 rounded border p-3 text-left transition-colors",
        selected
          ? "border-primary/30 bg-primary/10 ring-2 ring-primary/20"
          : "border-border/50 bg-background/50 hover:bg-muted/80"
      )}
      onClick={onClick}
    >
      <Globe className="text-muted-foreground" size={18} />
      <div className="flex-1">
        <p className="font-medium text-sm">{website.name}</p>
        <p className="text-muted-foreground text-xs">{website.domain}</p>
      </div>
    </button>
  );
}

export function WebsiteSelector({
  websites,
  selectedWebsite,
  onSelectWebsite,
}: {
  websites: Website[];
  selectedWebsite: string | null;
  onSelectWebsite: (id: string | null) => void;
}) {
  return (
    <div className="max-h-60 space-y-2 overflow-y-auto p-1">
      {websites.length > 0 ? (
        websites.map((w) => (
          <WebsiteCard
            key={w.id}
            onClick={() => onSelectWebsite(w.id === selectedWebsite ? null : w.id)}
            selected={selectedWebsite === w.id}
            website={w}
          />
        ))
      ) : (
        <div className="py-8 text-center text-muted-foreground text-sm">No websites found.</div>
      )}
    </div>
  );
}
