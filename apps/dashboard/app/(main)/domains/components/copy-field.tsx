"use client";

import { Button } from "@/components/ui/button";
import { ClipboardIcon } from "@phosphor-icons/react";

interface CopyFieldProps {
  label: string;
  value: string;
  onCopy: () => void;
}

export function CopyField({ label, value, onCopy }: CopyFieldProps) {
  return (
    <div className="space-y-1.5 sm:space-y-2">
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <code className="block p-2 bg-muted/50 rounded text-xs break-all flex-1 min-w-0 w-full font-mono">
          {value}
        </code>
        <Button size="sm" variant="outline" onClick={onCopy} className="flex-shrink-0 w-full sm:w-auto h-8">
          <ClipboardIcon size={16} weight="duotone" className="h-4 w-4" />
          <span className="ml-1.5 sm:sr-only">Copy</span>
        </Button>
      </div>
    </div>
  );
} 