"use client";

import {
  BuildingsIcon,
  CalendarIcon,
  CheckIcon,
  GearIcon,
  PlusIcon,
  TrashIcon,
  UsersIcon,
} from "@phosphor-icons/react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrganizations } from "@/hooks/use-organizations";
import { cn } from "@/lib/utils";

dayjs.extend(relativeTime);

interface OrganizationsTabProps {
  organizations: any[] | undefined;
  activeOrganization: any | null;
  isLoading: boolean;
  onCreateOrganization: () => void;
}

export function OrganizationsTab({
  organizations,
  activeOrganization,
  isLoading,
  onCreateOrganization,
}: OrganizationsTabProps) {
  const {
    setActiveOrganization,
    deleteOrganization,
    isSettingActiveOrganization,
    isDeletingOrganization,
  } = useOrganizations();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getOrganizationInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSetActive = (organizationId: string) => {
    setActiveOrganization(organizationId);
  };

  const handleDelete = async (organizationId: string, organizationName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${organizationName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setDeletingId(organizationId);
    try {
      deleteOrganization(organizationId);
    } catch (error) {
      toast.error("Failed to delete organization");
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div className="space-y-4 rounded border border-border/50 bg-muted/30 p-6" key={i}>
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32 rounded" />
                  <Skeleton className="h-4 w-24 rounded" />
                </div>
              </div>
              <Skeleton className="h-8 w-full rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!organizations || organizations.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto max-w-md rounded border border-border/50 bg-muted/30 p-6">
          <div className="mx-auto mb-4 w-fit rounded-full border border-primary/20 bg-primary/10 p-4">
            <BuildingsIcon className="h-8 w-8 text-primary" size={32} weight="duotone" />
          </div>
          <h3 className="mb-2 font-semibold text-lg">No Organizations Yet</h3>
          <p className="mb-6 text-muted-foreground text-sm">
            Create your first organization to start collaborating with your team.
          </p>
          <Button className="rounded" onClick={onCreateOrganization}>
            <PlusIcon className="mr-2 h-4 w-4" size={16} />
            Create Organization
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-lg">Your Organizations</h2>
          <p className="text-muted-foreground text-sm">
            Manage and switch between your organizations
          </p>
        </div>
        <Button className="rounded" onClick={onCreateOrganization} size="sm">
          <PlusIcon className="mr-2 h-4 w-4" size={16} />
          New Organization
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {organizations.map((org) => {
          const isActive = activeOrganization?.id === org.id;
          const isDeleting = deletingId === org.id;

          return (
            <div
              className={cn(
                "relative rounded border p-6 transition-all duration-200",
                isActive
                  ? "border-primary/50 bg-primary/5 shadow-md"
                  : "border-border/50 bg-muted/30 hover:border-border/70 hover:bg-muted/40"
              )}
              key={org.id}
            >
              {isActive && (
                <div className="absolute top-3 right-3">
                  <Badge
                    className="border-primary/20 bg-primary/10 text-primary"
                    variant="secondary"
                  >
                    <CheckIcon className="mr-1 h-3 w-3" size={16} />
                    Active
                  </Badge>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12 border border-border/50">
                    <AvatarImage alt={org.name} src={org.logo || undefined} />
                    <AvatarFallback className="bg-accent font-medium text-sm">
                      {getOrganizationInitials(org.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold">{org.name}</h3>
                    <p className="truncate text-muted-foreground text-sm">{org.slug}</p>
                    <div className="mt-1 flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3 text-muted-foreground" size={16} />
                      <span className="text-muted-foreground text-xs">
                        Created {dayjs(org.createdAt).fromNow()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isActive ? (
                    <Button className="flex-1 rounded" disabled size="sm" variant="outline">
                      <UsersIcon className="mr-2 h-3 w-3" size={16} />
                      Current Workspace
                    </Button>
                  ) : (
                    <Button
                      className="flex-1 rounded"
                      disabled={isSettingActiveOrganization}
                      onClick={() => handleSetActive(org.id)}
                      size="sm"
                    >
                      {isSettingActiveOrganization ? (
                        <>
                          <div className="mr-2 h-3 w-3 animate-spin rounded-full border border-primary-foreground/30 border-t-primary-foreground" />
                          Switching...
                        </>
                      ) : (
                        <>
                          <CheckIcon className="mr-2 h-3 w-3" size={16} />
                          Set Active
                        </>
                      )}
                    </Button>
                  )}

                  <Button asChild className="rounded" size="sm" variant="outline">
                    <Link href={`/organizations/${org.slug}`}>
                      <GearIcon className="h-3 w-3" size={16} />
                    </Link>
                  </Button>

                  <Button
                    className="rounded hover:border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                    disabled={isDeleting || isDeletingOrganization}
                    onClick={() => handleDelete(org.id, org.name)}
                    size="sm"
                    variant="outline"
                  >
                    {isDeleting ? (
                      <div className="h-3 w-3 animate-spin rounded-full border border-destructive/30 border-t-destructive" />
                    ) : (
                      <TrashIcon className="h-3 w-3" size={16} />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
