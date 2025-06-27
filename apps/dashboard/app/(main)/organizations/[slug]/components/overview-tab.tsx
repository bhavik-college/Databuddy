"use client";

import {
  BuildingsIcon,
  CalendarIcon,
  ChartBarIcon,
  ClockIcon,
  GlobeIcon,
  UsersIcon,
} from "@phosphor-icons/react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useQueryState } from "nuqs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useOrganizationMembers } from "@/hooks/use-organizations";

dayjs.extend(relativeTime);

interface OverviewTabProps {
  organization: any;
}

export function OverviewTab({ organization }: OverviewTabProps) {
  const { members } = useOrganizationMembers(organization.id);
  const [, setActiveTab] = useQueryState("tab");

  const recentMembers = members?.slice(0, 5) || [];
  const ownerMember = members?.find((member) => member.role === "owner");

  return (
    <div className="space-y-8">
      {/* Organization Info */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded border border-border/50 bg-muted/30 p-6">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-lg">
            <BuildingsIcon className="h-5 w-5" size={16} weight="duotone" />
            Organization Details
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" size={16} />
              </div>
              <div>
                <p className="font-medium text-sm">Created</p>
                <p className="text-muted-foreground text-sm">
                  {dayjs(organization.createdAt).format("MMMM D, YYYY")}
                  <span className="ml-1">({dayjs(organization.createdAt).fromNow()})</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <GlobeIcon className="h-4 w-4 text-muted-foreground" size={16} />
              </div>
              <div>
                <p className="font-medium text-sm">Organization Slug</p>
                <p className="font-mono text-muted-foreground text-sm">{organization.slug}</p>
              </div>
            </div>
            {ownerMember && (
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <UsersIcon className="h-4 w-4 text-muted-foreground" size={16} />
                </div>
                <div>
                  <p className="font-medium text-sm">Owner</p>
                  <p className="text-muted-foreground text-sm">{ownerMember.user.name}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="rounded border border-border/50 bg-muted/30 p-6">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-lg">
            <ChartBarIcon className="h-5 w-5" size={16} weight="duotone" />
            Quick Stats
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Total Members</span>
              <Badge className="px-2 py-1" variant="outline">
                {members?.length || 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Admins</span>
              <Badge className="px-2 py-1" variant="outline">
                {members?.filter((m) => m.role === "admin").length || 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Regular Members</span>
              <Badge className="px-2 py-1" variant="outline">
                {members?.filter((m) => m.role === "member").length || 0}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Members */}
      <div className="rounded border border-border/50 bg-muted/30 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-semibold text-lg">
            <UsersIcon className="h-5 w-5" size={16} weight="duotone" />
            Recent Team Members
          </h3>
          <Button
            className="rounded"
            onClick={() => setActiveTab("teams")}
            size="sm"
            variant="outline"
          >
            View All Members
          </Button>
        </div>

        {recentMembers.length > 0 ? (
          <div className="space-y-3">
            {recentMembers.map((member) => (
              <div
                className="flex items-center justify-between rounded border border-border/50 bg-background/50 p-3"
                key={member.id}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage alt={member.user.name} src={member.user.image || undefined} />
                    <AvatarFallback className="bg-accent text-sm">
                      {member.user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{member.user.name}</p>
                    <p className="text-muted-foreground text-xs">{member.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="px-2 py-1 text-xs" variant="secondary">
                    {member.role}
                  </Badge>
                  <div className="flex items-center gap-1 text-muted-foreground text-xs">
                    <ClockIcon className="h-3 w-3" size={16} />
                    {dayjs(member.createdAt).fromNow()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <UsersIcon
              className="mx-auto mb-2 h-8 w-8 text-muted-foreground"
              size={32}
              weight="duotone"
            />
            <p className="text-muted-foreground text-sm">No team members yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
