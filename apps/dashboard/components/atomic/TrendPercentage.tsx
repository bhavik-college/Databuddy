"use client";

import type React from "react";
import { cn } from "@/lib/utils";

interface TrendPercentageProps {
  id?: string;
  value: number; // The percentage value (e.g., 10.5, -5.2)
  invertColor?: boolean; // If true, positive is red, negative is green
  className?: string;
  digits?: number; // Number of digits after the decimal point
}

const formatPercentage = (value: number, digits = 1): string => {
  const sign = value > 0 ? "+" : "";
  return `${sign}${Math.abs(value).toFixed(digits)}%`;
};

export const TrendPercentage: React.FC<TrendPercentageProps> = ({
  id,
  value,
  invertColor = false,
  className,
  digits = 1,
}) => {
  let colorClass = "text-muted-foreground"; // Default for zero or NaN

  if (Number.isNaN(value)) {
    // Handle NaN case, perhaps display '--%'
    return (
      <span className={cn("text-muted-foreground", className)} id={id}>
        --%
      </span>
    );
  }

  if (value > 0) {
    colorClass = invertColor
      ? "text-red-600 dark:text-red-400"
      : "text-green-600 dark:text-green-400";
  }
  if (value < 0) {
    colorClass = invertColor
      ? "text-green-600 dark:text-green-400"
      : "text-red-600 dark:text-red-400";
  }

  return (
    <span className={cn("font-medium", colorClass, className)} id={id}>
      {formatPercentage(value, digits)}
    </span>
  );
};

export default TrendPercentage;
