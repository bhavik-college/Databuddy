'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import {
  createErrorTypeColumns,
  createPageColumn,
  errorColumns,
} from './error-table-columns';
import type { ErrorTab } from './types';

// Dynamically import DataTable for better performance
const DataTable = dynamic(
  () =>
    import('@/components/analytics/data-table').then((mod) => ({
      default: mod.DataTable,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-96 animate-pulse rounded-lg bg-muted/20" />
    ),
  }
);

interface ErrorDataTableProps {
  processedData: {
    error_types: any[];
    errors_by_page: any[];
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
        id: 'error_types',
        label: 'Error Types',
        data: processedData.error_types.map((item: any, i: number) => ({
          ...item,
          _uniqueKey: `error-type-${i}`,
        })),
        columns: createErrorTypeColumns(),
      },
      {
        id: 'errors_by_page',
        label: 'By Page',
        data: processedData.errors_by_page.map((item: any, i: number) => ({
          ...item,
          _uniqueKey: `page-${i}`,
        })),
        columns: [createPageColumn(), ...errorColumns],
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
