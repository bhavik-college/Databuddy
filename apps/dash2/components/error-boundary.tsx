"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const errorHandler = (error: ErrorEvent) => {
      console.error("Error caught by boundary:", error);
      setError(error.error);
      setHasError(true);
    };

    window.addEventListener("error", errorHandler);
    return () => window.removeEventListener("error", errorHandler);
  }, []);

  if (hasError) {
    if (fallback) return <>{fallback}</>;

    return (
      <div className="flex items-center justify-center w-full h-full min-h-[400px] p-6">
        <Card className="shadow-lg border-red-100 max-w-lg w-full">
          <CardHeader className="pb-3 border-b bg-red-50/40">
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Something went wrong
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                We encountered an error while trying to display this content. This could be due to a temporary issue or a problem with the data.
              </p>
              {error && (
                <div className="p-3 bg-muted rounded-md text-xs font-mono overflow-auto max-h-[150px]">
                  {error.toString()}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2 border-t pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reload Page
            </Button>
            <Button
              onClick={() => {
                setHasError(false);
                setError(null);
              }}
              size="sm"
            >
              Try Again
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
} 