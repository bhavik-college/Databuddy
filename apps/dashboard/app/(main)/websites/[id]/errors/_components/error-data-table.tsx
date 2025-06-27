"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import {
  createBrowserColumn,
  createCountryColumn,
  createDeviceColumn,
  createErrorTypeColumns,
  createOSColumn,
  createPageColumn,
  errorColumns,
} from "./error-table-columns";
import type { ErrorTab } from "./types";

// Dynamically import DataTable for better performance
const DataTable = dynamic(
  () => import("@/components/analytics/data-table").then((mod) => ({ default: mod.DataTable })),
  {
    ssr: false,
    loading: () => <div className="h-96 animate-pulse rounded-lg bg-muted/20" />,
  }
);

interface ErrorDataTableProps {
  processedData: {
    error_types: any[];
    errors_by_page: any[];
    errors_by_browser: any[];
    errors_by_os: any[];
    errors_by_country: any[];
    errors_by_device: any[];
  };
  isLoading: boolean;
  isRefreshing: boolean;
  onRowClick: (field: string, value: string | number) => void;
}

export const ErrorDataTable = ({
  processedData,
  isLoading,
  isRefreshing,
  onRowClick,
}: ErrorDataTableProps) => {
  const errorTabs = useMemo(
    (): ErrorTab[] => [
      {
        id: "error_types",
        label: "Error Types",
        data: processedData.error_types.map((item: any, i: number) => ({
          ...item,
          _uniqueKey: `error-type-${i}`,
        })),
        columns: createErrorTypeColumns(),
      },
      {
        id: "errors_by_page",
        label: "By Page",
        data: processedData.errors_by_page.map((item: any, i: number) => ({
          ...item,
          _uniqueKey: `page-${i}`,
        })),
        columns: [createPageColumn(), ...errorColumns],
      },
      {
        id: "errors_by_browser",
        label: "By Browser",
        data: processedData.errors_by_browser.map((item: any, i: number) => ({
          ...item,
          _uniqueKey: `browser-${i}`,
        })),
        columns: [createBrowserColumn(), ...errorColumns],
      },
      {
        id: "errors_by_os",
        label: "By OS",
        data: processedData.errors_by_os.map((item: any, i: number) => ({
          ...item,
          _uniqueKey: `os-${i}`,
        })),
        columns: [createOSColumn(), ...errorColumns],
      },
      {
        id: "errors_by_country",
        label: "By Country",
        data: processedData.errors_by_country.map((item: any, i: number) => ({
          ...item,
          _uniqueKey: `country-${i}`,
        })),
        columns: [createCountryColumn(), ...errorColumns],
      },
      {
        id: "errors_by_device",
        label: "By Device",
        data: processedData.errors_by_device.map((item: any, i: number) => ({
          ...item,
          _uniqueKey: `device-${i}`,
        })),
        columns: [createDeviceColumn(), ...errorColumns],
      },
    ],
    [processedData]
  );

  return (
    <DataTable
      description="Comprehensive error breakdown across different dimensions"
      initialPageSize={15}
      isLoading={isLoading || isRefreshing}
      minHeight={400}
      onRowClick={onRowClick}
      tabs={errorTabs}
      title="Error Analysis"
    />
  );
};
