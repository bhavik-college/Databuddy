"use client";

import { ClipboardIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface CopyFieldProps {
  label: string;
  value: string;
  onCopy: () => void;
}

export function CopyField({ label, value, onCopy }: CopyFieldProps) {
  return (
    <div className="space-y-1.5 sm:space-y-2">
      <span className="font-medium text-muted-foreground text-xs">{label}</span>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <code className="block w-full min-w-0 flex-1 break-all rounded bg-muted/50 p-2 font-mono text-xs">
          {value}
        </code>
        <Button
          className="h-8 w-full flex-shrink-0 sm:w-auto"
          onClick={onCopy}
          size="sm"
          variant="outline"
        >
          <ClipboardIcon className="h-4 w-4" size={16} weight="duotone" />
          <span className="ml-1.5 sm:sr-only">Copy</span>
        </Button>
      </div>
    </div>
  );
}
