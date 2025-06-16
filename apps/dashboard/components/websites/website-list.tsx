"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { WebsiteDialog } from "@/components/website-dialog";
import { FaviconImage } from "@/components/analytics/favicon-image";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead,
  TableCell 
} from "@/components/ui/table";
import type { Website } from "@/hooks/use-websites";
import { MiniChart } from "@/components/websites/mini-chart";

type VerifiedDomain = {
  id: string;
  name: string;
  verificationStatus: "PENDING" | "VERIFIED" | "FAILED";
};

interface WebsiteListProps {
  websites: Website[];
  verifiedDomains: VerifiedDomain[];
}

export function WebsiteList({
  websites,
  verifiedDomains
}: WebsiteListProps) {
  return (
    <div className="rounded-lg border bg-background shadow-sm overflow-hidden">
      <Table className="min-w-full text-sm">
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50 border-b">
            <TableHead className="w-[60%] font-medium py-3 px-4">Website</TableHead>
            <TableHead className="w-[40%] font-medium py-3 px-4">Traffic</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {websites.map((website) => (
            <WebsiteRow
              key={website.id}
              website={website}
              verifiedDomains={verifiedDomains}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}


interface WebsiteRowProps {
  website: Website;
  verifiedDomains: VerifiedDomain[];
}

function WebsiteRow({
  website,
  verifiedDomains
}: WebsiteRowProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const router = useRouter();
  
  const domainValue = website.domain;

  const viewAnalyticsLink = `/websites/${website.id}`;

  const handleRowClick = (e: React.MouseEvent) => {
    // Only navigate if the click is not on a button or link
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('a') ||
      target.closest('[role="menu"]')
    ) {
      return;
    }
    router.push(viewAnalyticsLink);
  };

  return (
    <>
      <TableRow
        className="border-b last:border-b-0 cursor-pointer group transition-all duration-150 hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-primary/60 focus-within:ring-2 focus-within:ring-primary/60"
        tabIndex={0}
        aria-label={`View analytics for ${website.name || 'website'}`}
        onClick={handleRowClick}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleRowClick(e as unknown as React.MouseEvent);
          }
        }}
      >
        <TableCell className="py-4 px-4 align-middle">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted/40 border border-border/40">
              <FaviconImage 
                domain={domainValue} 
                size={24} 
                className="flex-shrink-0" 
              />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                {website.name || 'Unnamed Website'}
              </div>
              <div className="text-sm text-muted-foreground truncate mt-0.5 flex items-center gap-1">
                <span className="truncate">{domainValue}</span>
              </div>
            </div>
          </div>
        </TableCell>
        <TableCell className="py-3 px-4 align-middle">
          <MiniChart
            websiteId={website.id}
            className="h-12"
          />
        </TableCell>
      </TableRow>
      <WebsiteDialog
        website={website}
        verifiedDomains={verifiedDomains}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
} 