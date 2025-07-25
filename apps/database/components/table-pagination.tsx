'use client';

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalResults: number;
  filteredResults: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
}

export function TablePagination({
  currentPage,
  totalPages,
  totalResults,
  filteredResults,
  startIndex,
  endIndex,
  onPageChange,
}: TablePaginationProps) {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  return (
    <div className="border-t bg-background p-4">
      <div className="flex items-center justify-between">
        <div className="text-muted-foreground text-sm">
          Showing {startIndex + 1} to {Math.min(endIndex, filteredResults)} of{' '}
          {formatNumber(filteredResults)} results
          {filteredResults !== totalResults && (
            <span className="ml-2">
              (filtered from {formatNumber(totalResults)} total)
            </span>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              disabled={currentPage === 1}
              onClick={() => onPageChange(1)}
              size="sm"
              variant="outline"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              disabled={currentPage === 1}
              onClick={() => onPageChange(currentPage - 1)}
              size="sm"
              variant="outline"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-4 text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              disabled={currentPage === totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              size="sm"
              variant="outline"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              disabled={currentPage === totalPages}
              onClick={() => onPageChange(totalPages)}
              size="sm"
              variant="outline"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
