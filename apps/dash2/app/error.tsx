"use client";

import { useEffect } from "react";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";
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

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
          <div className="max-w-md w-full space-y-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
                <p className="text-muted-foreground text-sm">
                  We encountered an unexpected error. Our team has been notified.
                </p>
              </div>
              
              {process.env.NODE_ENV === "development" && (
                <div className="w-full p-4 bg-muted/50 rounded-lg text-xs font-mono text-left overflow-auto max-h-[200px] border">
                  <p className="font-semibold mb-2 text-muted-foreground">Error details:</p>
                  <p className="text-red-600">{error.message}</p>
                  <p className="mt-2 text-muted-foreground">{error.stack}</p>
                </div>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                variant="outline"
                className="sm:flex-1"
                onClick={() => window.location.href = "/"}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Button>
              
              <Button 
                className="sm:flex-1"
                onClick={reset}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
} 