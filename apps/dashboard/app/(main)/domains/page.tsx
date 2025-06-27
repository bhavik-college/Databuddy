"use client";

import { GlobeIcon, PlusIcon, ShieldIcon, SparkleIcon, TrendUpIcon } from "@phosphor-icons/react";
import dynamic from "next/dynamic";
import { useQueryState } from "nuqs";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useDomainManagement } from "./hooks/use-domain-management";

// Dynamic imports for tab components
const DomainsTab = dynamic(
  () => import("./components/domains-tab").then((mod) => ({ default: mod.DomainsTab })),
  {
    loading: () => <TabSkeleton />,
    ssr: false,
  }
);

const DomainRanksTab = dynamic(
  () => import("./components/domain-ranks-tab").then((mod) => ({ default: mod.DomainRanksTab })),
  {
    loading: () => <TabSkeleton />,
    ssr: false,
  }
);

function TabSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-48 rounded" />
        <Skeleton className="h-9 w-32 rounded" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div className="animate-pulse rounded-lg border p-4" key={i}>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-3 w-20 rounded" />
                </div>
              </div>
              <Skeleton className="h-6 w-16 rounded" />
            </div>
            <div className="space-y-2 border-t pt-2">
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
  const [activeTab, setActiveTab] = useQueryState("tab", {
    defaultValue: "domains",
    clearOnDefault: true,
  });

  const { domain, setDomain, isAdding, addDialogOpen, setAddDialogOpen, handleAddDomain } =
    useDomainManagement();

  return (
    <div className="fade-in slide-in-from-bottom-4 flex h-full animate-in flex-col duration-500">
      {/* Enhanced header */}
      <div className="border-b bg-gradient-to-r from-background via-background to-muted/20">
        <div className="flex flex-col justify-between gap-3 p-3 sm:flex-row sm:items-center sm:gap-0 sm:px-4 sm:py-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <div className="rounded-lg border border-primary/20 bg-primary/10 p-2">
                <ShieldIcon className="h-5 w-5 text-primary" size={20} weight="duotone" />
              </div>
              <div>
                <h1 className="truncate font-bold text-foreground text-xl tracking-tight sm:text-2xl">
                  Domains
                </h1>
                <p className="mt-0.5 text-muted-foreground text-xs sm:text-sm">
                  Manage your domains and DNS verification
                </p>
              </div>
            </div>
          </div>
          <Dialog onOpenChange={setAddDialogOpen} open={addDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className={cn(
                  "w-full gap-2 px-6 py-3 font-medium sm:w-auto",
                  "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary",
                  "group relative overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl"
                )}
                data-button-type="primary-cta"
                data-section="domains-header"
                data-track="domains-add-domain-click"
                size="default"
              >
                <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-white/0 via-white/20 to-white/0 transition-transform duration-700 group-hover:translate-x-[100%]" />
                <PlusIcon
                  className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:rotate-90"
                  size={16}
                />
                <span className="relative z-10 truncate">Add Domain</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <div className="mb-1 flex items-center gap-2">
                  <GlobeIcon className="h-5 w-5" size={20} weight="duotone" />
                  <DialogTitle>Add New Domain</DialogTitle>
                </div>
                <DialogDescription className="text-xs">
                  Add a domain to verify ownership and create websites
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-medium text-xs" htmlFor="domain">
                    Domain
                  </Label>
                  <Input
                    className="h-9"
                    id="domain"
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="example.com"
                    value={domain}
                  />
                  <p className="text-muted-foreground text-xs">
                    Enter only the top-level domain (e.g., example.com)
                  </p>
                </div>

                <div className="rounded-lg border bg-muted/50 p-3">
                  <div className="flex items-start gap-2">
                    <div className="rounded bg-primary/10 p-1">
                      <SparkleIcon className="h-3 w-3 text-primary" size={12} weight="fill" />
                    </div>
                    <div className="text-left">
                      {/* Removed lightbulb icon */}
                      <p className="mb-1 font-semibold text-xs">Next steps</p>
                      <p className="text-muted-foreground text-xs leading-relaxed">
                        After adding, you'll need to verify ownership by adding a DNS TXT record.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter className="pt-2">
                <div className="flex w-full gap-2">
                  <Button
                    className="h-9 flex-1"
                    data-button-type="cancel"
                    data-section="domains-dialog"
                    data-track="domains-add-dialog-cancel"
                    disabled={isAdding}
                    onClick={() => setAddDialogOpen(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button
                    className="h-9 flex-1"
                    data-button-type="confirm"
                    data-section="domains-dialog"
                    data-track="domains-add-dialog-confirm"
                    disabled={isAdding}
                    onClick={handleAddDomain}
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
        <Tabs className="flex h-full flex-col" onValueChange={setActiveTab} value={activeTab}>
          <div className="relative mb-6 border-b">
            <TabsList className="h-12 w-full justify-start overflow-x-auto bg-transparent p-0">
              <TabsTrigger
                className={cn(
                  "relative h-12 rounded-none px-4 text-sm transition-all duration-200",
                  "cursor-pointer whitespace-nowrap hover:bg-muted/50",
                  "data-[state=active]:bg-transparent data-[state=active]:text-primary"
                )}
                data-section="domains-tabs"
                data-tab-name="domains"
                data-track="domains-tab-click"
                value="domains"
              >
                <GlobeIcon className="mr-2 h-4 w-4" size={16} weight="duotone" />
                <span>Domains</span>
                {activeTab === "domains" && (
                  <div className="absolute bottom-0 left-0 h-[2px] w-full rounded-t bg-primary" />
                )}
              </TabsTrigger>
              <TabsTrigger
                className={cn(
                  "relative h-12 rounded-none px-4 text-sm transition-all duration-200",
                  "cursor-pointer whitespace-nowrap hover:bg-muted/50",
                  "data-[state=active]:bg-transparent data-[state=active]:text-primary"
                )}
                data-section="domains-tabs"
                data-tab-name="ranks"
                data-track="domains-tab-click"
                value="ranks"
              >
                <TrendUpIcon className="mr-2 h-4 w-4" size={16} weight="fill" />
                <span>Domain Ranks</span>
                {activeTab === "ranks" && (
                  <div className="absolute bottom-0 left-0 h-[2px] w-full rounded-t bg-primary" />
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent className="mt-0 flex-1" value="domains">
            <Suspense fallback={<TabSkeleton />}>
              <DomainsTab />
            </Suspense>
          </TabsContent>

          <TabsContent className="mt-0 flex-1" value="ranks">
            <Suspense fallback={<TabSkeleton />}>
              <DomainRanksTab />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
