"use client";

import { MoreVertical, ExternalLink, Globe, Home, ShieldCheck, ShieldAlert, ShieldQuestion, Clock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WebsiteDialog } from "@/components/website-dialog";
import type { Website } from "@/hooks/use-websites";
import { MiniChart } from "@/components/websites/mini-chart";
import type { MiniChartDataPoint } from "@/hooks/use-analytics";
import { cn } from "@/lib/utils";

type VerifiedDomain = {
  id: string;
  name: string;
  verificationStatus: "PENDING" | "VERIFIED" | "FAILED";
};

interface WebsiteCardProps {
  website: Website;
  onUpdate: (id: string, name: string) => void;
  isUpdating: boolean;
  verifiedDomains: VerifiedDomain[];
  data?: MiniChartDataPoint[];
  isLoading?: boolean;
  isError?: boolean;
}

export function WebsiteCard({
  website,
  onUpdate,
  isUpdating,
  verifiedDomains,
  data,
  isLoading,
  isError
}: WebsiteCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const domainValue = typeof website.domain === 'string' 
    ? website.domain 
    : website.domain?.name || '';

  const isLocalhost = domainValue.includes('localhost') || domainValue.includes('127.0.0.1');

  const handleOpenDialog = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDialogOpen(true);
  };

  // Get verification icon
  const getVerificationIcon = () => {
    if (isLocalhost) {
      return (
        <div className="flex items-center text-zinc-500" title="Local Development">
          <Home className="h-3.5 w-3.5" />
        </div>
      );
    }
    
    const domain = typeof website.domain === 'string' 
      ? verifiedDomains.find(d => d.name === website.domain)
      : verifiedDomains.find(d => d.id === website.domainId);
    
    if (!domain) {
      return (
        <div className="flex items-center text-zinc-500" title="Domain Status Unknown">
          <Globe className="h-3.5 w-3.5" />
        </div>
      );
    }
    
    switch (domain.verificationStatus) {
      case "VERIFIED":
        return (
          <div className="flex items-center text-green-500" title="Domain Verified">
            <ShieldCheck className="h-3.5 w-3.5" />
          </div>
        );
      case "FAILED":
        return (
          <div className="flex items-center text-red-500" title="Verification Failed">
            <ShieldAlert className="h-3.5 w-3.5" />
          </div>
        );
      case "PENDING":
        return (
          <div className="flex items-center text-amber-500" title="Verification Pending">
            <Clock className="h-3.5 w-3.5" />
          </div>
        );
      default:
        return (
          <div className="flex items-center text-zinc-500" title="Domain Status Unknown">
            <ShieldQuestion className="h-3.5 w-3.5" />
          </div>
        );
    }
  };

  return (
    <Card className={cn(
      "relative overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md",
      "border border-border/60 hover:border-border/80 group"
    )}>
      <CardHeader className="relative pb-2 md:pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base truncate group-hover:text-primary transition-colors">
              {website.name || 'Unnamed Website'}
            </CardTitle>
            <CardDescription className="truncate text-xs flex items-center gap-1.5">
              {getVerificationIcon()}
              <span className="truncate">{domainValue}</span>
            </CardDescription>
          </div>
          <Button 
            variant="ghost" 
            className="h-8 w-8 p-0 -mr-2 opacity-70 hover:opacity-100"
            type="button"
            onClick={handleOpenDialog}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pb-3 md:pb-4">
        <MiniChart
          websiteId={website.id}
          data={data}
          isLoading={isLoading}
          isError={isError}
        />
      </CardContent>
      <CardFooter className="pt-0">
        <Button 
          asChild 
          variant="outline" 
          size="sm" 
          className={cn(
            "w-full bg-transparent border-muted text-muted-foreground",
            "hover:bg-primary/5 hover:text-primary hover:border-primary/20",
            "transition-all duration-200"
          )}
        >
          <Link href={`/websites/${website.id}`} className="flex items-center justify-center gap-1">
            <span>View Analytics</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardFooter>
      
      <WebsiteDialog
        website={website}
        verifiedDomains={verifiedDomains}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        isLoading={isUpdating}
      />
    </Card>
  );
} 