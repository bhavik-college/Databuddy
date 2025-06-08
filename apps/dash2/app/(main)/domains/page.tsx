"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { useQueryState } from "nuqs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Globe, Plus, TrendingUp } from "lucide-react";
import { useDomainManagement } from "./hooks/use-domain-management";

// Dynamic imports for tab components
const DomainsTab = dynamic(() => import("./components/domains-tab").then(mod => ({ default: mod.DomainsTab })), {
  loading: () => <TabSkeleton />,
  ssr: false
});

const DomainRanksTab = dynamic(() => import("./components/domain-ranks-tab").then(mod => ({ default: mod.DomainRanksTab })), {
  loading: () => <TabSkeleton />,
  ssr: false
});

function TabSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DomainsPage() {
  const [activeTab, setActiveTab] = useQueryState('tab', {
    defaultValue: 'domains',
    clearOnDefault: true
  });
  
  const {
    domain,
    setDomain,
    isAdding,
    addDialogOpen,
    setAddDialogOpen,
    handleAddDomain
  } = useDomainManagement();

  return (
    <div className="h-full flex flex-col animate-fadeIn">
      {/* Compact header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:px-4 sm:py-4 border-b gap-3 sm:gap-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
            Domains
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 line-clamp-2 sm:line-clamp-1">
            Manage your domains and DNS settings
          </p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              size="default" 
              className="h-9 sm:h-9 text-sm sm:text-base text-primary-foreground btn-hover-effect w-full sm:w-auto touch-manipulation"
            >
              <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">Add Domain</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Domain</DialogTitle>
              <DialogDescription>
                Add a new domain to your account
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  placeholder="example.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter only the top-level domain (e.g., example.com). Subdomains and protocols will be removed.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddDomain} disabled={isAdding}>
                {isAdding ? "Adding..." : "Add Domain"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabbed content area */}
      <div className="flex-1 overflow-y-auto p-3 sm:px-4 sm:pt-4 sm:pb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="border-b relative mb-4">
            <TabsList className="h-10 bg-transparent p-0 w-full justify-start overflow-x-auto">
              <TabsTrigger 
                value="domains" 
                className="text-xs sm:text-sm h-10 px-2 sm:px-4 rounded-none touch-manipulation hover:bg-muted/50 relative transition-colors whitespace-nowrap cursor-pointer"
              >
                <Globe className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Domains</span>
                {activeTab === "domains" && (
                  <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary" />
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="ranks" 
                className="text-xs sm:text-sm h-10 px-2 sm:px-4 rounded-none touch-manipulation hover:bg-muted/50 relative transition-colors whitespace-nowrap cursor-pointer"
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Domain Ranks</span>
                {activeTab === "ranks" && (
                  <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary" />
                )}
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="domains" className="flex-1 mt-0">
            <Suspense fallback={<TabSkeleton />}>
              <DomainsTab />
            </Suspense>
          </TabsContent>

          <TabsContent value="ranks" className="flex-1 mt-0">
            <Suspense fallback={<TabSkeleton />}>
              <DomainRanksTab />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 