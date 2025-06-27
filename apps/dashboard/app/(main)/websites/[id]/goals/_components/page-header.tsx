"use client";

import { ArrowClockwise, Plus, Target } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  websiteName: string;
  goalsCount: number;
  isRefreshing: boolean;
  isLoading: boolean;
  hasError: boolean;
  onRefresh: () => void;
  onCreateGoal: () => void;
}

export function PageHeader({
  websiteName,
  goalsCount,
  isRefreshing,
  isLoading,
  hasError,
  onRefresh,
  onCreateGoal,
}: PageHeaderProps) {
  return (
    <div className="-mx-6 mb-6 border-border/50 border-b bg-gradient-to-r from-background via-background to-muted/20 px-6 pt-2 pb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-3">
            <Target className="text-primary" size={24} weight="duotone" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text font-bold text-3xl text-transparent tracking-tight">
              Goals
            </h1>
            <p className="mt-1 text-muted-foreground">
              {isLoading ? (
                <span className="inline-block h-4 w-16 animate-pulse rounded bg-muted" />
              ) : (
                `${goalsCount} active goal${goalsCount !== 1 ? "s" : ""} • Track key conversions`
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            className="gap-2 border-border/50 transition-all duration-200 hover:border-primary/50 hover:bg-primary/5"
            disabled={isRefreshing}
            onClick={onRefresh}
            variant="outline"
          >
            <ArrowClockwise className={isRefreshing ? "animate-spin" : ""} size={16} />
            Refresh
          </Button>
          <Button
            className="gap-2 bg-gradient-to-r from-primary to-primary/90 shadow-lg transition-all duration-200 hover:from-primary/90 hover:to-primary hover:shadow-xl"
            onClick={onCreateGoal}
          >
            <Plus size={16} />
            Create Goal
          </Button>
        </div>
      </div>
    </div>
  );
}
