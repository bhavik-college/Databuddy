"use client";

import {
  ArrowClockwiseIcon,
  CheckCircleIcon,
  ClockIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
  isRetrying?: boolean;
}

export function StatusBadge({ status, isRetrying }: StatusBadgeProps) {
  if (isRetrying) {
    return (
      <Badge
        className="gap-1.5 border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-800 dark:bg-blue-950/20 dark:text-blue-400"
        variant="outline"
      >
        <ArrowClockwiseIcon className="h-3 w-3 animate-spin" size={12} weight="fill" />
        <span className="font-medium">Retrying</span>
      </Badge>
    );
  }

  switch (status) {
    case "VERIFIED":
      return (
        <Badge
          className="gap-1.5 border-green-600 bg-green-600 text-white hover:bg-green-700"
          variant="default"
        >
          <CheckCircleIcon className="h-3 w-3" size={12} weight="fill" />
          <span className="font-medium">Verified</span>
        </Badge>
      );
    case "PENDING":
      return (
        <Badge
          className="gap-1.5 border-yellow-200 bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:border-yellow-800 dark:bg-yellow-950/20 dark:text-yellow-400"
          variant="secondary"
        >
          <ClockIcon className="h-3 w-3" size={12} weight="fill" />
          <span className="font-medium">Pending</span>
        </Badge>
      );
    case "FAILED":
      return (
        <Badge
          className="gap-1.5 border-red-200 bg-red-100 text-red-800 hover:bg-red-200 dark:border-red-800 dark:bg-red-950/20 dark:text-red-400"
          variant="destructive"
        >
          <WarningCircleIcon className="h-3 w-3" size={12} weight="fill" />
          <span className="font-medium">Failed</span>
        </Badge>
      );
    default:
      return null;
  }
}
