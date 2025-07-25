'use client';

import { ArrowClockwise, Warning } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorDisplayProps {
  error?: Error | null;
  onRetry?: () => void;
}

export function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
  return (
    <div className="flex w-full items-center justify-center py-8">
      <Card className="w-full max-w-lg border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Warning className="h-5 w-5" />
            Failed to load organizations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            An error occurred while fetching your organization data. Please try
            again.
          </p>
          {error && (
            <pre className="max-h-[150px] overflow-auto rounded bg-muted p-3 font-mono text-xs">
              {error.message}
            </pre>
          )}
          {onRetry && (
            <Button onClick={onRetry} size="sm" variant="outline">
              <ArrowClockwise className="mr-2 h-4 w-4" />
              Retry
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
