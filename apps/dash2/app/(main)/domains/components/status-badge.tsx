"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertCircle, RefreshCw } from "lucide-react";

interface StatusBadgeProps {
  status: string;
  isRetrying?: boolean;
}

export function StatusBadge({ status, isRetrying }: StatusBadgeProps) {
  if (isRetrying) {
    return (
      <Badge variant="outline" className="gap-1.5 text-blue-600 border-blue-200 bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:bg-blue-950/20">
        <RefreshCw className="h-3 w-3 animate-spin" />
        <span className="font-medium">Retrying</span>
      </Badge>
    );
  }
  
  switch (status) {
    case "VERIFIED":
      return (
        <Badge variant="default" className="gap-1.5 bg-green-600 hover:bg-green-700 text-white border-green-600">
          <CheckCircle className="h-3 w-3" />
          <span className="font-medium">Verified</span>
        </Badge>
      );
    case "PENDING":
      return (
        <Badge variant="secondary" className="gap-1.5 bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400 dark:border-yellow-800">
          <Clock className="h-3 w-3" />
          <span className="font-medium">Pending</span>
        </Badge>
      );
    case "FAILED":
      return (
        <Badge variant="destructive" className="gap-1.5 bg-red-100 text-red-800 border-red-200 hover:bg-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800">
          <AlertCircle className="h-3 w-3" />
          <span className="font-medium">Failed</span>
        </Badge>
      );
    default:
      return null;
  }
} 