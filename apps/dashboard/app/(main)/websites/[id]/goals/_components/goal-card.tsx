"use client";

import { DotsThreeIcon, Eye, MouseMiddleClick, PencilSimple, Trash } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Funnel } from "@/hooks/use-funnels";

interface GoalCardProps {
  goal: Funnel;
  onEdit: () => void;
  onDelete: () => void;
  conversionRate?: number;
  totalUsers?: number;
  completions?: number;
  isLoading?: boolean;
}

export function GoalCard({
  goal,
  onEdit,
  onDelete,
  conversionRate = 0,
  totalUsers = 0,
  completions = 0,
  isLoading = false,
}: GoalCardProps) {
  const step = goal.steps[0]; // Only one step for goals

  const getStepIcon = (type: string) => {
    switch (type) {
      case "PAGE_VIEW":
        return <Eye className="text-muted-foreground" size={16} />;
      case "EVENT":
        return <MouseMiddleClick className="text-muted-foreground" size={16} />;
      default:
        return <Eye className="text-muted-foreground" size={16} />;
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  return (
    <Card className="group transition-shadow hover:shadow-md">
      <CardContent className="p-6">
        <div className="mb-4 flex items-start justify-between">
          {/* Left side - Goal info */}
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex items-center gap-2">
              <h3 className="truncate font-semibold text-foreground text-lg">{goal.name}</h3>
              {!goal.isActive && (
                <span className="rounded bg-muted px-2 py-1 font-medium text-muted-foreground text-xs">
                  Paused
                </span>
              )}
            </div>

            {/* Goal target */}
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              {getStepIcon(step.type)}
              <span className="truncate">{step?.target || "No target"}</span>
            </div>
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="h-8 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                size="sm"
                variant="ghost"
              >
                <DotsThreeIcon size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <PencilSimple className="mr-2" size={16} />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={onDelete}
              >
                <Trash className="mr-2" size={16} />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Stats section */}
        <div className="grid grid-cols-3 gap-4 border-t pt-4">
          {/* Conversion Rate */}
          <div>
            <div className="mb-1 text-muted-foreground text-xs">Conversion</div>
            <div className="font-semibold text-foreground text-xl">
              {isLoading ? (
                <div className="h-5 w-10 animate-pulse rounded bg-muted" />
              ) : (
                `${conversionRate.toFixed(1)}%`
              )}
            </div>
          </div>

          {/* Total Users */}
          <div>
            <div className="mb-1 text-muted-foreground text-xs">Users</div>
            <div className="font-medium text-foreground text-lg">
              {isLoading ? (
                <div className="h-4 w-8 animate-pulse rounded bg-muted" />
              ) : (
                formatNumber(totalUsers)
              )}
            </div>
          </div>

          {/* Completions */}
          <div>
            <div className="mb-1 text-muted-foreground text-xs">Completions</div>
            <div className="font-medium text-foreground text-lg">
              {isLoading ? (
                <div className="h-4 w-8 animate-pulse rounded bg-muted" />
              ) : (
                formatNumber(completions)
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
