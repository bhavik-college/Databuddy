"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FaviconImage } from "@/components/analytics/favicon-image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WebsiteDialog } from "@/components/website-dialog";
import { MiniChart } from "@/components/websites/mini-chart";
import type { Website } from "@/hooks/use-websites";

interface WebsiteListProps {
  websites: Website[];
}

export function WebsiteList({ websites }: WebsiteListProps) {
  return (
    <div className="overflow-hidden rounded-lg border bg-background shadow-sm">
      <Table className="min-w-full text-sm">
        <TableHeader>
          <TableRow className="border-b bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-[60%] px-4 py-3 font-medium">Website</TableHead>
            <TableHead className="w-[40%] px-4 py-3 font-medium">Traffic</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {websites.map((website) => (
            <WebsiteRow key={website.id} website={website} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

interface WebsiteRowProps {
  website: Website;
}

function WebsiteRow({ website }: WebsiteRowProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const router = useRouter();

  const domainValue = website.domain;

  const viewAnalyticsLink = `/websites/${website.id}`;

  const handleRowClick = (e: React.MouseEvent) => {
    // Only navigate if the click is not on a button or link
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("a") || target.closest('[role="menu"]')) {
      return;
    }
    router.push(viewAnalyticsLink);
  };

  return (
    <>
      <TableRow
        aria-label={`View analytics for ${website.name || "website"}`}
        className="group cursor-pointer border-b transition-all duration-150 last:border-b-0 focus-within:ring-2 focus-within:ring-primary/60 hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-primary/60"
        onClick={handleRowClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            handleRowClick(e as unknown as React.MouseEvent);
          }
        }}
        tabIndex={0}
      >
        <TableCell className="px-4 py-4 align-middle">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/40 bg-muted/40">
              <FaviconImage className="flex-shrink-0" domain={domainValue} size={24} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="truncate font-semibold text-foreground transition-colors group-hover:text-primary">
                {website.name || "Unnamed Website"}
              </div>
              <div className="mt-0.5 flex items-center gap-1 truncate text-muted-foreground text-sm">
                <span className="truncate">{domainValue}</span>
              </div>
            </div>
          </div>
        </TableCell>
        <TableCell className="px-4 py-3 align-middle">
          <MiniChart className="h-12" websiteId={website.id} />
        </TableCell>
      </TableRow>
      <WebsiteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        website={website}
      />
    </>
  );
}
