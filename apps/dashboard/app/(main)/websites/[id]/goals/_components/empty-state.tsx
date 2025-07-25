'use client';

import { Plus, Target } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface EmptyStateProps {
  onCreateGoal: () => void;
}

export function EmptyState({ onCreateGoal }: EmptyStateProps) {
  return (
    <Card className="rounded border-2 border-muted-foreground/25 border-dashed">
      <CardContent className="flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted/50">
          <Target
            className="text-muted-foreground"
            size={24}
            weight="duotone"
          />
        </div>

        <h3 className="mb-2 font-semibold text-foreground text-lg">
          No goals yet
        </h3>

        <p className="mb-6 max-w-sm text-muted-foreground text-sm">
          Track conversions like sign-ups, purchases, or button clicks
        </p>

        <Button className="gap-2" onClick={onCreateGoal}>
          <Plus size={16} />
          Create Goal
        </Button>
      </CardContent>
    </Card>
  );
}
