"use client";

import { useEffect } from "react";
import { WarningCircleIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error occurred:", error);
  }, [error]);

  const handleGoToHomepage = () => {
    window.location.href = '/';
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <div className="text-center max-w-md">
        <WarningCircleIcon size={64} weight="duotone" className="mx-auto h-16 w-16 text-destructive mb-6" />
        <h1 className="text-3xl font-semibold mb-3">Something went wrong</h1>
        <p className="text-muted-foreground mb-1">
          We encountered an unexpected issue. Please try again.
        </p>
        {error?.message && (
          <p className="text-sm text-destructive-foreground bg-destructive/20 p-2 rounded-md my-3">
            Error details: {error.message}
          </p>
        )}
        <Button
          onClick={() => reset()}
          className="mt-6"
          size="lg"
        >
          Try again
        </Button>
        <Button
          onClick={handleGoToHomepage}
          variant="outline"
          className="mt-3 ml-3"
          size="lg"
        >
          Go to Homepage
        </Button>
      </div>
    </div>
  );
} 