"use client";

import { useState } from "react";
import { MoreVertical, ExternalLink, ChevronRight, Check, AlertCircle, Clock, BarChart3 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { WebsiteDialog } from "@/components/website-dialog";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead,
  TableCell 
} from "@/components/ui/table";
import type { Website } from "@/hooks/use-websites";
import { useWebsitesStore } from "@/stores/use-websites-store";
import { MiniChart } from "@/components/websites/mini-chart";
import type { MiniChartDataPoint } from "@/hooks/use-analytics";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

type VerifiedDomain = {
  id: string;
  name: string;
  verificationStatus: "PENDING" | "VERIFIED" | "FAILED";
};

interface WebsiteListProps {
  websites: Website[];
  onUpdate: (id: string, name: string) => void;
  isUpdating: boolean;
  verifiedDomains: VerifiedDomain[];
}

export function WebsiteList({
  websites,
  onUpdate,
  isUpdating,
  verifiedDomains
}: WebsiteListProps) {
  return (
    <div className="rounded-md border overflow-hidden bg-card">
      <Table className="table-modern">
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="w-[40%] text-foreground/70 text-xs">WEBSITE</TableHead>
            <TableHead className="w-[40%] text-foreground/70 text-xs">TRAFFIC</TableHead>
            <TableHead className="text-right text-foreground/70 text-xs">ACTIONS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {websites.map((website) => (
            <WebsiteRow
              key={website.id}
              website={website}
              onUpdate={onUpdate}
              isUpdating={isUpdating}
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
  onUpdate: (id: string, name: string) => void;
  isUpdating: boolean;
  verifiedDomains: VerifiedDomain[];
}

function WebsiteRow({
  website,
  onUpdate,
  isUpdating,
  verifiedDomains
}: WebsiteRowProps) {
  const setSelectedWebsite = useWebsitesStore(state => state.setSelectedWebsite);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const domainValue = typeof website.domain === 'string' 
    ? website.domain 
    : website.domain?.name || '';

  const isLocalhost = domainValue.includes('localhost') || domainValue.includes('127.0.0.1');

  const handleOpenDialog = () => {
    setSelectedWebsite(website);
    setDialogOpen(true);
  };

  // Get verification status and badge
  const getVerificationStatus = () => {
    if (isLocalhost) {
      return {
        label: "Local",
        variant: "outline" as const,
        icon: <Check className="h-3 w-3" />
      };
    }
    
    const domain = typeof website.domain === 'string' 
      ? verifiedDomains.find(d => d.name === website.domain)
      : verifiedDomains.find(d => d.id === website.domainId);
    
    if (!domain) {
      return {
        label: "Unknown",
        variant: "outline" as const,
        icon: null
      };
    }
    
    switch (domain.verificationStatus) {
      case "VERIFIED":
        return {
          label: "Verified",
          variant: "success" as const,
          icon: <Check className="h-3 w-3" />
        };
      case "FAILED":
        return {
          label: "Failed",
          variant: "destructive" as const,
          icon: <AlertCircle className="h-3 w-3" />
        };
      case "PENDING":
        return {
          label: "Pending",
          variant: "warning" as const,
          icon: <Clock className="h-3 w-3" />
        };
      default:
        return {
          label: "Unknown",
          variant: "outline" as const,
          icon: null
        };
    }
  };

  const status = getVerificationStatus();
  const badgeClass = {
    success: "bg-[color-mix(in_oklch,var(--background),var(--success)_15%)] text-[var(--success)]",
    destructive: "bg-[color-mix(in_oklch,var(--background),var(--destructive)_15%)] text-[var(--destructive)]",
    warning: "bg-[color-mix(in_oklch,var(--background),var(--warning)_15%)] text-[var(--warning)]",
    outline: "bg-[color-mix(in_oklch,var(--background),var(--muted-foreground)_10%)] text-muted-foreground"
  };

  const viewAnalyticsLink = `/websites/${website.id}`;

  return (
    <>
      <TableRow className="table-row-hover cursor-pointer group transition-colors">
        <TableCell className="py-3.5">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-sm group-hover:text-primary transition-colors">
                {website.name || 'Unnamed Website'}
              </span>
              <div className={cn(
                "text-[0.65rem] py-0.5 px-1.5 h-4 rounded-full flex items-center gap-1",
                badgeClass[status.variant]
              )}>
                {status.icon && <span>{status.icon}</span>}
                <span>{status.label}</span>
              </div>
            </div>
            
            <span className="text-xs text-muted-foreground mt-1 truncate max-w-[300px]">
              {domainValue}
            </span>
          </div>
        </TableCell>
        
        <TableCell className="py-3.5">
          <MiniChart
            websiteId={website.id}
            className="h-12"
          />
        </TableCell>
        
        <TableCell className="py-3.5" align="right">
          <div className="flex items-center justify-end gap-1.5">
            <Button 
              asChild
              variant="outline" 
              size="sm" 
              className="h-8 text-xs font-medium border-primary/20 text-primary hover:text-primary hover:bg-primary/5 hover:border-primary/30 btn-hover-effect"
            >
              <Link href={viewAnalyticsLink} className="flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5" />
                <span>Analytics</span>
              </Link>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="h-8 w-8 p-0"
                  type="button"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[180px]">
                <DropdownMenuItem onClick={handleOpenDialog}>
                  Edit Website
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={viewAnalyticsLink}>View Analytics</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`${viewAnalyticsLink}/settings`}>Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`${viewAnalyticsLink}/code`}>Get Tracking Code</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TableCell>
      </TableRow>

      <WebsiteDialog
        website={website}
        verifiedDomains={verifiedDomains}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        isLoading={isUpdating}
      />
    </>
  );
} 