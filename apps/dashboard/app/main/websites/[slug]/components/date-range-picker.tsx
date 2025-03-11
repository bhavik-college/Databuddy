"use client";

import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { DateRange } from "../hooks/use-date-range";
import { useState } from "react";

interface DateRangePickerProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

export function DateRangePicker({ dateRange, onDateRangeChange }: DateRangePickerProps) {
  const [date, setDate] = useState<DateRange>(dateRange);
  
  // Predefined ranges
  const predefinedRanges = [
    { label: "Last 7 days", days: 7 },
    { label: "Last 30 days", days: 30 },
    { label: "Last 90 days", days: 90 },
  ];
  
  // Apply a predefined range
  const applyPredefinedRange = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - days);
    
    const newRange = { from, to };
    setDate(newRange);
    onDateRangeChange(newRange);
  };
  
  // Get a human-readable description of the date range
  const getDateRangeText = (): string => {
    const diffTime = Math.abs(date.to.getTime() - date.from.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (days <= 1) {
      return "Today";
    } else if (days <= 7) {
      return "Last 7 days";
    } else if (days <= 30) {
      return "Last 30 days";
    } else if (days <= 90) {
      return "Last 90 days";
    } else {
      return `${date.from.toLocaleDateString()} - ${date.to.toLocaleDateString()}`;
    }
  };
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className="bg-slate-900/50 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <Calendar className="h-4 w-4 mr-2" />
          {getDateRangeText()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-slate-900 border-slate-800" align="end">
        <div className="p-3 border-b border-slate-800">
          <div className="space-y-2">
            {predefinedRanges.map((range) => (
              <Button
                key={range.days}
                variant="outline"
                size="sm"
                className="w-full justify-start text-left font-normal bg-slate-900 border-slate-800 hover:bg-slate-800"
                onClick={() => applyPredefinedRange(range.days)}
              >
                {range.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="p-3 flex flex-col sm:flex-row gap-2">
          <div>
            <div className="text-xs text-slate-400 mb-1">From</div>
            <CalendarComponent
              mode="single"
              selected={date.from}
              onSelect={(day) => day && setDate({ ...date, from: day })}
              disabled={(day) => day > date.to || day > new Date()}
              initialFocus
            />
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">To</div>
            <CalendarComponent
              mode="single"
              selected={date.to}
              onSelect={(day) => day && setDate({ ...date, to: day })}
              disabled={(day) => day < date.from || day > new Date()}
              initialFocus
            />
          </div>
        </div>
        <div className="p-3 border-t border-slate-800 flex justify-end">
          <Button 
            size="sm"
            onClick={() => onDateRangeChange(date)}
            className="bg-sky-600 hover:bg-sky-700 text-white"
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
} 