"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface CalendarDateRangePickerProps {
  className?: string;
  initialDateRange?: DateRange;
  onUpdate?: (dateRange: DateRange | undefined) => void;
}

export function CalendarDateRangePicker({
  className,
  initialDateRange,
  onUpdate,
}: CalendarDateRangePickerProps) {
  // No internal state - use the initialDateRange directly
  // and let the parent component control the state
  
  // Create a stable callback for date selection
  const handleSelect = React.useCallback((selectedRange: DateRange | undefined) => {
    if (onUpdate && selectedRange?.from && selectedRange?.to) {
      onUpdate(selectedRange);
    }
  }, [onUpdate]);

  // Default range if none provided
  const defaultRange = {
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  };

  // Use provided range or default
  const dateRange = initialDateRange || defaultRange;
  
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              "w-[240px] justify-start text-left font-normal",
              !dateRange && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "LLL dd, y")} -{" "}
                  {format(dateRange.to, "LLL dd, y")}
                </>
              ) : (
                format(dateRange.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
} 