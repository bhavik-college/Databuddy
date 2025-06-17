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
import { GlobeIcon, PlusIcon, TrendUpIcon, ShieldIcon, SparkleIcon } from "@phosphor-icons/react";
import { useDomainManagement } from "./hooks/use-domain-management";
import { cn } from "@/lib/utils";

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-48 rounded" />
        <Skeleton className="h-9 w-32 rounded" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="border rounded-lg p-4 animate-pulse">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-3 w-20 rounded" />
                </div>
              </div>
              <Skeleton className="h-6 w-16 rounded" />
            </div>
            <div className="space-y-2 pt-2 border-t">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-16 rounded" />
                <Skeleton className="h-3 w-24 rounded" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-3 w-12 rounded" />
                <Skeleton className="h-3 w-20 rounded" />
              </div>
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
    <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Enhanced header */}
      <div className="border-b bg-gradient-to-r from-background via-background to-muted/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:px-4 sm:py-4 gap-3 sm:gap-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 animate-pulse">
                <ShieldIcon size={20} weight="duotone" className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
                  Domains
                </h1>
                <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
                  Manage your domains and DNS verification
                </p>
              </div>
            </div>
          </div>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="default"
                className={cn(
                  "gap-2 w-full sm:w-auto px-6 py-3 font-medium",
                  "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary",
                  "shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
                )}
                data-track="domains-add-domain-click"
                data-section="domains-header"
                data-button-type="primary-cta"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <PlusIcon size={16} className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300 relative z-10" />
                <span className="truncate relative z-10">Add Domain</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <GlobeIcon size={20} weight="duotone" className="h-5 w-5" />
                  <DialogTitle>Add New Domain</DialogTitle>
                </div>
                <DialogDescription className="text-xs">
                  Add a domain to verify ownership and create websites
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="domain" className="text-xs font-medium">Domain</Label>
                  <Input
                    id="domain"
                    placeholder="example.com"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="h-9"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter only the top-level domain (e.g., example.com)
                  </p>
                </div>

                <div className="bg-muted/50 rounded-lg p-3 border">
                  <div className="flex items-start gap-2">
                    <div className="p-1 rounded bg-primary/10">
                      <SparkleIcon size={12} weight="fill" className="h-3 w-3 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-xs mb-1">💡 Next steps</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        After adding, you'll need to verify ownership by adding a DNS TXT record.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter className="pt-2">
                <div className="flex w-full gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setAddDialogOpen(false)}
                    disabled={isAdding}
                    className="flex-1 h-9"
                    data-track="domains-add-dialog-cancel"
                    data-section="domains-dialog"
                    data-button-type="cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddDomain}
                    disabled={isAdding}
                    className="flex-1 h-9"
                    data-track="domains-add-dialog-confirm"
                    data-section="domains-dialog"
                    data-button-type="confirm"
                  >
                    {isAdding ? "Adding..." : "Add Domain"}
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto p-3 sm:px-4 sm:pt-4 sm:pb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="border-b relative mb-6">
            <TabsList className="h-12 bg-transparent p-0 w-full justify-start overflow-x-auto">
              <TabsTrigger
                value="domains"
                className={cn(
                  "text-sm h-12 px-4 rounded-none relative transition-all duration-200",
                  "hover:bg-muted/50 whitespace-nowrap cursor-pointer",
                  "data-[state=active]:text-primary data-[state=active]:bg-transparent"
                )}
                data-track="domains-tab-click"
                data-section="domains-tabs"
                data-tab-name="domains"
              >
                <GlobeIcon size={16} weight="duotone" className="h-4 w-4 mr-2" />
                <span>Domains</span>
                {activeTab === "domains" && (
                  <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary rounded-t" />
                )}
              </TabsTrigger>
              <TabsTrigger
                value="ranks"
                className={cn(
                  "text-sm h-12 px-4 rounded-none relative transition-all duration-200",
                  "hover:bg-muted/50 whitespace-nowrap cursor-pointer",
                  "data-[state=active]:text-primary data-[state=active]:bg-transparent"
                )}
                data-track="domains-tab-click"
                data-section="domains-tabs"
                data-tab-name="ranks"
              >
                <TrendUpIcon size={16} weight="fill" className="h-4 w-4 mr-2" />
                <span>Domain Ranks</span>
                {activeTab === "ranks" && (
                  <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary rounded-t" />
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