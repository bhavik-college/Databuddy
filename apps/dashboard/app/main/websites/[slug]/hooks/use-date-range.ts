"use client";

import { useState } from "react";

export type DateRange = { from: Date; to: Date };

export function useDateRange() {
  // Default to last 30 days
  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);
  
  const [dateRange, setDateRange] = useState<DateRange>({
    from: thirtyDaysAgo,
    to: now
  });
  
  // Calculate number of days in the current range
  const getDays = (): number => {
    const diffTime = Math.abs(dateRange.to.getTime() - dateRange.from.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  
  // Get a human-readable description of the date range
  const getDateRangeText = (): string => {
    const days = getDays();
    
    if (days <= 1) {
      return "Today";
    } else if (days <= 7) {
      return "Last 7 days";
    } else if (days <= 30) {
      return "Last 30 days";
    } else if (days <= 90) {
      return "Last 90 days";
    } else {
      return `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`;
    }
  };
  
  return {
    dateRange,
    setDateRange,
    getDays,
    getDateRangeText
  };
} 