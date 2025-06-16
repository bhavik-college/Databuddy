"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AuthLoadingProps {
  className?: string;
}
export function AuthLoading({ className }: AuthLoadingProps) {
  return (
    <div className={cn("flex min-h-screen items-center justify-center bg-background", className)}>
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-[spin_0.5s_linear_infinite] text-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}