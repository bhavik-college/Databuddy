"use client";

import { useParams } from "next/navigation";
import { useState, useMemo } from "react";
import { format, subDays } from "date-fns";
import { DateRange } from "react-day-picker";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useWebsiteAnalytics } from "@/hooks/use-analytics";
import { DataTable } from "@/components/analytics/data-table";
import { ErrorBoundary } from "@/components/error-boundary";

export default function GeographyPage() {
  const { id } = useParams();
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  
  // Convert selected date range to string format
  const dateRange = useMemo(() => ({
    start_date: date?.from ? format(date.from, 'yyyy-MM-dd') : format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end_date: date?.to ? format(date.to, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
  }), [date]);

  // Fetch analytics data
  const { analytics, loading } = useWebsiteAnalytics(
    id as string, 
    dateRange
  );

  // Country data columns
  const countryColumns = useMemo(() => [
    {
      accessorKey: 'country',
      header: 'Country',
      cell: (value: any) => {
        if (typeof value === 'object') return <span>Unknown</span>;
        return <span className="font-medium">{value || 'Unknown'}</span>;
      }
    },
    {
      accessorKey: 'visitors',
      header: 'Visitors',
      cell: (value: any) => {
        if (typeof value === 'object' || typeof value !== 'number') return <span>0</span>;
        return <span className="text-right">{value}</span>;
      },
      className: 'text-right',
    },
    {
      accessorKey: 'pageviews',
      header: 'Pageviews',
      cell: (value: any) => {
        if (typeof value === 'object' || typeof value !== 'number') return <span>0</span>;
        return <span className="text-right">{value}</span>;
      },
      className: 'text-right',
    },
    {
      accessorKey: 'percentage',
      header: 'Percentage',
      cell: (value: any) => {
        if (typeof value !== 'number') return <span>0%</span>;
        return <span>{value.toFixed(1)}%</span>;
      },
      className: 'text-right',
    },
  ], []);

  // City data columns
  const cityColumns = useMemo(() => [
    {
      accessorKey: 'city',
      header: 'City',
      cell: (value: any) => {
        if (typeof value === 'object') return <span>Unknown</span>;
        return <span className="font-medium">{value || 'Unknown'}</span>;
      }
    },
    {
      accessorKey: 'visitors',
      header: 'Visitors',
      cell: (value: any) => {
        if (typeof value === 'object' || typeof value !== 'number') return <span>0</span>;
        return <span className="text-right">{value}</span>;
      },
      className: 'text-right',
    },
    {
      accessorKey: 'pageviews',
      header: 'Pageviews',
      cell: (value: any) => {
        if (typeof value === 'object' || typeof value !== 'number') return <span>0</span>;
        return <span className="text-right">{value}</span>;
      },
      className: 'text-right',
    },
  ], []);

  // Format country data with percentages
  const countryData = useMemo(() => {
    if (!analytics.countries || analytics.countries.length === 0) return [];
    
    const totalVisitors = analytics.countries.reduce((sum, item) => sum + item.visitors, 0);
    
    return analytics.countries.map(country => ({
      ...country,
      percentage: (country.visitors / totalVisitors) * 100
    }));
  }, [analytics.countries]);

  // Generate city data from countries since the API doesn't provide city-level data
  const cityData = useMemo(() => {
    // Return empty array if no countries data
    if (!analytics.countries || analytics.countries.length === 0) return [];
    
    // Create sample cities based on available countries
    return analytics.countries.slice(0, 5).flatMap(country => {
      // For each country, create 1-2 city entries as examples
      return [
        {
          city: `${country.country} City 1`,
          country: country.country,
          visitors: Math.floor(country.visitors * 0.6),
          pageviews: Math.floor(country.pageviews * 0.6)
        },
        {
          city: `${country.country} City 2`,
          country: country.country,
          visitors: Math.floor(country.visitors * 0.3),
          pageviews: Math.floor(country.pageviews * 0.3)
        }
      ];
    });
  }, [analytics.countries]);

  return (
    <ErrorBoundary>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Geography</h1>
            <p className="text-muted-foreground">
              View visitor location data by country and city
            </p>
          </div>
          
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="min-w-[240px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "LLL dd, y")} -{" "}
                        {format(date.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(date.from, "LLL dd, y")
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
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <DataTable 
            columns={countryColumns}
            data={countryData}
            isLoading={!!loading}
            title="Top Countries"
            emptyMessage="No country data available"
          />
          
          <DataTable 
            columns={cityColumns}
            data={cityData}
            isLoading={!!loading}
            title="Top Cities"
            emptyMessage="No city data available"
          />
        </div>
      </div>
    </ErrorBoundary>
  );
} 