"use client";

import { TrendDownIcon } from "@phosphor-icons/react";
import { useAtom } from "jotai";
import { useParams } from "next/navigation";
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  type CreateFunnelData,
  type Funnel,
  useAutocompleteData,
  useBulkGoalAnalytics,
  useGoals,
} from "@/hooks/use-funnels";
import { useWebsite } from "@/hooks/use-websites";
import {
  dateRangeAtom,
  formattedDateRangeAtom,
  timeGranularityAtom,
} from "@/stores/jotai/filterAtoms";
import { DeleteGoalDialog } from "./_components/delete-goal-dialog";
import { EditGoalDialog } from "./_components/edit-goal-dialog";
import { GoalsList } from "./_components/goals-list";
import { PageHeader } from "./_components/page-header";

const PageHeaderSkeleton = () => (
  <div className="space-y-6">
    <div className="-mx-3 sm:-mx-4 lg:-mx-6 border-b bg-gradient-to-r from-background via-background to-muted/20 px-3 pb-6 sm:px-4 lg:px-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 animate-pulse rounded-xl bg-muted" />
            <div>
              <div className="mb-2 h-8 w-48 animate-pulse rounded bg-muted" />
              <div className="h-4 w-64 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-32 animate-pulse rounded-lg bg-muted" />
          <div className="h-10 w-36 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    </div>
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-6 w-32 animate-pulse rounded bg-muted" />
        <div className="h-4 w-16 animate-pulse rounded bg-muted" />
      </div>
    </div>
  </div>
);

const GoalsListSkeleton = () => (
  <div className="space-y-3">
    {[...Array(3)].map((_, i) => (
      <Card className="animate-pulse rounded-xl" key={i}>
        <div className="p-6">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-6 w-48 rounded-lg bg-muted" />
                <div className="h-4 w-4 rounded bg-muted" />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-5 w-16 rounded-full bg-muted" />
                <div className="h-4 w-20 rounded bg-muted" />
              </div>
            </div>
            <div className="h-8 w-8 rounded bg-muted" />
          </div>
          <div className="space-y-3">
            <div className="h-4 w-2/3 rounded bg-muted" />
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="mb-2 h-3 w-24 rounded bg-muted" />
              <div className="flex gap-2">
                <div className="h-8 w-32 rounded-lg bg-muted" />
                <div className="h-4 w-4 rounded bg-muted" />
                <div className="h-8 w-28 rounded-lg bg-muted" />
              </div>
            </div>
          </div>
        </div>
      </Card>
    ))}
  </div>
);

export default function GoalsPage() {
  const { id } = useParams();
  const websiteId = id as string;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Funnel | null>(null);
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);

  // Intersection observer for lazy loading
  const [isVisible, setIsVisible] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (pageRef.current) {
      observer.observe(pageRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const [,] = useAtom(dateRangeAtom);
  const [currentGranularity] = useAtom(timeGranularityAtom);
  const [formattedDateRangeState] = useAtom(formattedDateRangeAtom);

  const memoizedDateRangeForTabs = useMemo(
    () => ({
      start_date: formattedDateRangeState.startDate,
      end_date: formattedDateRangeState.endDate,
      granularity: currentGranularity,
    }),
    [formattedDateRangeState, currentGranularity]
  );

  const { data: websiteData } = useWebsite(websiteId);

  const {
    data: goals,
    isLoading: goalsLoading,
    error: goalsError,
    refetch: refetchGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    isCreating,
    isUpdating,
  } = useGoals(websiteId);

  // Get goal IDs for bulk analytics
  const goalIds = useMemo(() => goals.map((goal) => goal.id), [goals]);

  // Fetch analytics for all goals
  const {
    goalAnalytics,
    isLoading: analyticsLoading,
    error: analyticsError,
    refetch: refetchAnalytics,
  } = useBulkGoalAnalytics(websiteId, goalIds, memoizedDateRangeForTabs);

  // Preload autocomplete data for instant suggestions in dialogs
  const autocompleteQuery = useAutocompleteData(websiteId);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetchGoals(), autocompleteQuery.refetch()]);
      if (goalIds.length > 0) {
        refetchAnalytics();
      }
    } catch (error) {
      console.error("Failed to refresh goal data:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchGoals, refetchAnalytics, autocompleteQuery.refetch, goalIds.length]);

  const handleSaveGoal = async (data: CreateFunnelData | Funnel) => {
    try {
      if ('id' in data) {
        // Updating existing goal
        const goalData = { ...data, steps: data.steps.slice(0, 1) };
        await updateGoal({
          goalId: goalData.id,
          updates: {
            name: goalData.name,
            description: goalData.description,
            steps: goalData.steps,
            filters: goalData.filters,
          },
        });
      } else {
        // Creating new goal
        const goalData = { ...data, steps: data.steps.slice(0, 1) };
        await createGoal(goalData);
      }
      setIsDialogOpen(false);
      setEditingGoal(null);
    } catch (error) {
      console.error("Failed to save goal:", error);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await deleteGoal(goalId);
      setDeletingGoalId(null);
    } catch (error) {
      console.error("Failed to delete goal:", error);
    }
  };

  if (goalsError) {
    return (
      <div className="mx-auto max-w-[1600px] p-6">
        <Card className="rounded border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendDownIcon className="h-5 w-5 text-red-600" size={16} weight="duotone" />
              <p className="font-medium text-red-600">Error loading goal data</p>
            </div>
            <p className="mt-2 text-red-600/80 text-sm">{goalsError.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-3 sm:p-4 lg:p-6" ref={pageRef}>
      <Suspense fallback={<PageHeaderSkeleton />}>
        <PageHeader
          goalsCount={goals.length}
          hasError={!!goalsError}
          isLoading={goalsLoading}
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
          onCreateGoal={() => {
            setEditingGoal(null);
            setIsDialogOpen(true);
          }}
          websiteName={websiteData?.name || ""}
        />
      </Suspense>

      {isVisible && (
        <Suspense fallback={<GoalsListSkeleton />}>
          <GoalsList
            analyticsLoading={analyticsLoading}
            goalAnalytics={goalAnalytics}
            goals={goals}
            isLoading={goalsLoading}
            onCreateGoal={() => {
              setEditingGoal(null);
              setIsDialogOpen(true);
            }}
            onDeleteGoal={(goalId) => setDeletingGoalId(goalId)}
            onEditGoal={(goal) => {
              setEditingGoal(goal);
              setIsDialogOpen(true);
            }}
          />
        </Suspense>
      )}

      {isDialogOpen && (
        <Suspense>
          <EditGoalDialog
            autocompleteData={autocompleteQuery.data?.data}
            goal={editingGoal}
            isOpen={isDialogOpen}
            isSaving={isCreating || isUpdating}
            onClose={() => {
              setIsDialogOpen(false);
              setEditingGoal(null);
            }}
            onSave={handleSaveGoal}
          />
        </Suspense>
      )}

      {deletingGoalId && (
        <Suspense>
          <DeleteGoalDialog
            isOpen={!!deletingGoalId}
            onClose={() => setDeletingGoalId(null)}
            onConfirm={() => deletingGoalId && handleDeleteGoal(deletingGoalId)}
          />
        </Suspense>
      )}
    </div>
  );
}
