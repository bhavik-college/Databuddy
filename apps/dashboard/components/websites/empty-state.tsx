import { useState } from "react";
import { Globe, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WebsiteDialog } from "@/components/website-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { domains } from "@databuddy/db";
import type { CreateWebsiteData } from "@/hooks/use-websites";
type Domain = typeof domains.$inferSelect;

interface EmptyStateProps {
  onCreateWebsite: (data: CreateWebsiteData) => void;
  isCreating: boolean;
  hasVerifiedDomains?: boolean;
  verifiedDomains?: Domain[];
}

export function EmptyState({ 
  isCreating, 
  hasVerifiedDomains = true,
  verifiedDomains = []
}: EmptyStateProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const renderButton = () => {
    const button = (
      <Button size="lg" disabled={!hasVerifiedDomains || isCreating} onClick={() => hasVerifiedDomains && setDialogOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Add Your First Website
      </Button>
    );

    if (!hasVerifiedDomains) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {button}
            </TooltipTrigger>
            <TooltipContent>
              <p>You need a verified domain to create a website</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return button;
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 border border-dashed rounded-lg bg-accent/20">
      <Globe className="h-16 w-16 text-muted-foreground mb-5 opacity-80" />
      <h3 className="text-xl font-semibold mb-2">No websites added yet</h3>
      <p className="text-muted-foreground text-center max-w-md mb-6">
        Add your first website to start tracking analytics and insights.
        {!hasVerifiedDomains && " You'll need a verified domain first."}
      </p>
      
      {renderButton()}
      
      <WebsiteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        verifiedDomains={verifiedDomains}
      />
    </div>
  );
} 