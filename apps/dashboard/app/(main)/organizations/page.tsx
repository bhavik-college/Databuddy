"use client";

import { BuildingsIcon, GearIcon, PlusIcon, UsersIcon } from "@phosphor-icons/react";
import dynamic from "next/dynamic";
import { Suspense, useState } from "react";
import { CreateOrganizationDialog } from "@/components/organizations/create-organization-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrganizations } from "@/hooks/use-organizations";

// Skeletons
function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-40" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

function TabSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-32 w-full rounded" />
      <Skeleton className="h-48 w-full rounded" />
    </div>
  );
}

// Dynamic imports for tab components
const OrganizationsTab = dynamic(
  () => import("./components/organizations-tab").then((mod) => ({ default: mod.OrganizationsTab })),
  {
    loading: () => <TabSkeleton />,
    ssr: false,
  }
);

const TeamsTab = dynamic(
  () => import("./[slug]/components/teams-tab").then((mod) => ({ default: mod.TeamsTab })),
  {
    loading: () => <TabSkeleton />,
    ssr: false,
  }
);

// Sub-components
function PageHeader({ onNewOrg, activeOrg }: any) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="font-bold text-2xl">Organizations</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Manage your organizations and team collaboration
        </p>
      </div>
      <div className="flex items-center gap-2">
        {activeOrg && (
          <Badge className="px-2 py-1" variant="outline">
            <BuildingsIcon className="mr-1 h-3 w-3" size={16} />
            {activeOrg.name}
          </Badge>
        )}
        <Button className="rounded" onClick={onNewOrg} size="sm">
          <PlusIcon className="mr-1 h-3 w-3" size={16} />
          New Organization
        </Button>
      </div>
    </div>
  );
}

function QuickStats({ orgCount, activeOrg }: any) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="rounded border border-border/50 bg-muted/30 p-4">
        <div className="flex items-center gap-3">
          <div className="rounded border border-primary/20 bg-primary/10 p-2">
            <BuildingsIcon className="h-5 w-5 text-primary" size={16} weight="duotone" />
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Organizations</p>
            <p className="font-semibold text-xl">{orgCount}</p>
          </div>
        </div>
      </div>
      <div className="rounded border border-border/50 bg-muted/30 p-4">
        <div className="flex items-center gap-3">
          <div className="rounded border border-primary/20 bg-primary/10 p-2">
            <UsersIcon className="h-5 w-5 text-primary" size={16} weight="duotone" />
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Active Workspace</p>
            <p className="max-w-[120px] truncate font-medium text-sm">
              {activeOrg?.name || "Personal"}
            </p>
          </div>
        </div>
      </div>
      <div className="rounded border border-border/50 bg-muted/30 p-4">
        <div className="flex items-center gap-3">
          <div className="rounded border border-primary/20 bg-primary/10 p-2">
            <GearIcon className="h-5 w-5 text-primary" size={16} weight="duotone" />
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Status</p>
            <p className="font-medium text-sm">{activeOrg ? "Team Mode" : "Personal Mode"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MainView({ organizations, activeOrganization, isLoading, onNewOrg }: any) {
  const [activeTab, setActiveTab] = useState("organizations");

  return (
    <>
      <QuickStats activeOrg={activeOrganization} orgCount={organizations.length} />
      <Tabs className="space-y-4" onValueChange={setActiveTab} value={activeTab}>
        <div className="relative border-b">
          <TabsList className="h-10 w-full justify-start overflow-x-auto bg-transparent p-0">
            <TabsTrigger
              className="relative h-10 cursor-pointer touch-manipulation whitespace-nowrap rounded-none px-2 text-xs transition-colors hover:bg-muted/50 sm:px-4 sm:text-sm"
              value="organizations"
            >
              <BuildingsIcon className="mr-1 h-3 w-3" size={16} />
              <span className="hidden sm:inline">Organizations</span>
              {activeTab === "organizations" && (
                <div className="absolute bottom-0 left-0 h-[2px] w-full rounded bg-primary" />
              )}
            </TabsTrigger>
            <TabsTrigger
              className="relative h-10 cursor-pointer touch-manipulation whitespace-nowrap rounded-none px-2 text-xs transition-colors hover:bg-muted/50 sm:px-4 sm:text-sm"
              value="teams"
            >
              <UsersIcon className="mr-1 h-3 w-3" size={16} />
              <span className="hidden sm:inline">Teams</span>
              {activeTab === "teams" && (
                <div className="absolute bottom-0 left-0 h-[2px] w-full rounded bg-primary" />
              )}
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent className="animate-fadeIn transition-all duration-200" value="organizations">
          <Suspense fallback={<TabSkeleton />}>
            <OrganizationsTab
              activeOrganization={activeOrganization}
              isLoading={isLoading}
              onCreateOrganization={onNewOrg}
              organizations={organizations}
            />
          </Suspense>
        </TabsContent>
        <TabsContent className="animate-fadeIn transition-all duration-200" value="teams">
          <Suspense fallback={<TabSkeleton />}>
            <TeamsTab organization={activeOrganization || {}} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </>
  );
}

// Main page component
export default function OrganizationsPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { organizations, activeOrganization, isLoading } = useOrganizations();

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-6">
        <PageSkeleton />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl space-y-6 px-4 py-6">
      <PageHeader activeOrg={activeOrganization} onNewOrg={() => setShowCreateDialog(true)} />
      <MainView
        activeOrganization={activeOrganization}
        isLoading={isLoading}
        onNewOrg={() => setShowCreateDialog(true)}
        organizations={organizations}
      />
      <CreateOrganizationDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
      />
    </div>
  );
}
