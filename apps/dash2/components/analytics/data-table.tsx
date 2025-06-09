import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ListFilterIcon, DatabaseIcon, ArrowUpDown, ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Search, X, ChevronDown, ChevronRight as ChevronRightIcon } from "lucide-react";
import { type ColumnDef, type RowData, flexRender, getCoreRowModel, useReactTable, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, type SortingState, type PaginationState } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import React, { useState, useCallback, useMemo, Fragment, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface TabConfig<TData> {
  id: string;
  label: string;
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
}

interface DataTableProps<TData extends { name: string | number }, TValue> {
  data?: TData[] | undefined;
  columns?: ColumnDef<TData, TValue>[];
  tabs?: TabConfig<TData>[];
  title: string;
  description?: string;
  isLoading?: boolean;
  initialPageSize?: number;
  emptyMessage?: string;
  className?: string;
  onRowClick?: (field: string, value: string | number) => void;
  minHeight?: string | number;
  showSearch?: boolean;
  getSubRows?: (row: TData) => TData[] | undefined;
  renderSubRow?: (subRow: TData, parentRow: TData, index: number) => React.ReactNode;
  expandable?: boolean;
  renderTooltipContent?: (row: TData) => React.ReactNode;
}

function getRowPercentage(row: any): number {
  if (row.marketShare !== undefined) return Number.parseFloat(row.marketShare) || 0;
  if (row.percentage !== undefined) return Number.parseFloat(row.percentage) || 0;
  if (row.percent !== undefined) return Number.parseFloat(row.percent) || 0;
  if (row.share !== undefined) return Number.parseFloat(row.share) || 0;
  return 0;
}

function getPercentageGradient(percentage: number): {
  background: string;
  hoverBackground: string;
  borderColor: string;
  accentColor: string;
  glowColor: string;
} {
  if (percentage >= 50) {
    return {
      background: `linear-gradient(90deg, rgba(34, 197, 94, 0.08) 0%, rgba(34, 197, 94, 0.15) ${percentage * 0.8}%, rgba(34, 197, 94, 0.12) ${percentage}%, rgba(34, 197, 94, 0.02) ${percentage + 5}%, transparent 100%)`,
      hoverBackground: `linear-gradient(90deg, rgba(34, 197, 94, 0.12) 0%, rgba(34, 197, 94, 0.22) ${percentage * 0.8}%, rgba(34, 197, 94, 0.18) ${percentage}%, rgba(34, 197, 94, 0.04) ${percentage + 5}%, transparent 100%)`,
      borderColor: 'rgba(34, 197, 94, 0.3)',
      accentColor: 'rgba(34, 197, 94, 0.8)',
      glowColor: 'rgba(34, 197, 94, 0.2)'
    };
  }
  if (percentage >= 25) {
    return {
      background: `linear-gradient(90deg, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0.15) ${percentage * 0.8}%, rgba(59, 130, 246, 0.12) ${percentage}%, rgba(59, 130, 246, 0.02) ${percentage + 5}%, transparent 100%)`,
      hoverBackground: `linear-gradient(90deg, rgba(59, 130, 246, 0.12) 0%, rgba(59, 130, 246, 0.22) ${percentage * 0.8}%, rgba(59, 130, 246, 0.18) ${percentage}%, rgba(59, 130, 246, 0.04) ${percentage + 5}%, transparent 100%)`,
      borderColor: 'rgba(59, 130, 246, 0.3)',
      accentColor: 'rgba(59, 130, 246, 0.8)',
      glowColor: 'rgba(59, 130, 246, 0.2)'
    };
  }
  if (percentage >= 10) {
    return {
      background: `linear-gradient(90deg, rgba(245, 158, 11, 0.08) 0%, rgba(245, 158, 11, 0.15) ${percentage * 0.8}%, rgba(245, 158, 11, 0.12) ${percentage}%, rgba(245, 158, 11, 0.02) ${percentage + 5}%, transparent 100%)`,
      hoverBackground: `linear-gradient(90deg, rgba(245, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0.22) ${percentage * 0.8}%, rgba(245, 158, 11, 0.18) ${percentage}%, rgba(245, 158, 11, 0.04) ${percentage + 5}%, transparent 100%)`,
      borderColor: 'rgba(245, 158, 11, 0.3)',
      accentColor: 'rgba(245, 158, 11, 0.8)',
      glowColor: 'rgba(245, 158, 11, 0.2)'
    };
  }
  return {
    background: `linear-gradient(90deg, rgba(107, 114, 128, 0.06) 0%, rgba(107, 114, 128, 0.12) ${percentage * 0.8}%, rgba(107, 114, 128, 0.1) ${percentage}%, rgba(107, 114, 128, 0.02) ${percentage + 5}%, transparent 100%)`,
    hoverBackground: `linear-gradient(90deg, rgba(107, 114, 128, 0.1) 0%, rgba(107, 114, 128, 0.18) ${percentage * 0.8}%, rgba(107, 114, 128, 0.15) ${percentage}%, rgba(107, 114, 128, 0.03) ${percentage + 5}%, transparent 100%)`,
    borderColor: 'rgba(107, 114, 128, 0.2)',
    accentColor: 'rgba(107, 114, 128, 0.7)',
    glowColor: 'rgba(107, 114, 128, 0.15)'
  };
}

const EnhancedSkeleton = ({ minHeight }: { minHeight: string | number }) => (
  <div className="space-y-3 animate-pulse" style={{ minHeight }}>
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-24 rounded-md" />
      <Skeleton className="h-8 w-32 rounded-lg" />
    </div>
    <div className="space-y-2">
      {Array.from({ length: 5 }, (_, index) => index).map((itemIndex) => (
        <div key={`skeleton-${itemIndex}`} className="flex items-center space-x-4 p-3 bg-muted/20 rounded-lg animate-pulse">
          <Skeleton className="h-6 w-6 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full rounded-md" />
            <div className="flex items-center space-x-2">
              <Skeleton className="h-3 w-16 rounded-sm" />
              <Skeleton className="h-3 w-12 rounded-sm" />
              <Skeleton className="h-3 w-8 rounded-sm" />
            </div>
          </div>
          <div className="text-right space-y-1">
            <Skeleton className="h-4 w-12 rounded-md" />
            <Skeleton className="h-3 w-8 rounded-sm" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export function DataTable<TData extends { name: string | number }, TValue>(
  {
    data,
    columns,
    tabs,
    title,
    description,
    isLoading = false,
    initialPageSize,
    emptyMessage = "No data available",
    className,
    onRowClick,
    minHeight = 200,
    showSearch = true,
    getSubRows,
    renderSubRow,
    expandable = false,
    renderTooltipContent
  }: DataTableProps<TData, TValue>
) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize ?? 10,
  });
  const [activeTab, setActiveTab] = React.useState(tabs?.[0]?.id || '');
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [tooltipState, setTooltipState] = useState<{
    visible: boolean;
    content: React.ReactNode;
    x: number;
    y: number;
  }>({ visible: false, content: null, x: 0, y: 0 });

  const tableContainerRef = useRef<HTMLDivElement>(null);

  const currentTabData = tabs?.find(tab => tab.id === activeTab);
  const tableData = React.useMemo(() => currentTabData?.data || data || [], [currentTabData?.data, data]);
  const tableColumns = React.useMemo(() => currentTabData?.columns || columns || [], [currentTabData?.columns, columns]);

  const table = useReactTable({
    data: tableData,
    columns: tableColumns,
    getRowId: (row, index) => {
      if ((row as any)._uniqueKey) {
        return (row as any)._uniqueKey;
      }
      return activeTab ? `${activeTab}-${index}` : `row-${index}`;
    },
    state: {
      sorting,
      globalFilter: showSearch ? globalFilter : '',
      pagination,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const displayData = table.getRowModel().rows;

  const getFieldFromTabId = (tabId: string): string => {
    const mapping: Record<string, string> = {
      'errors_by_page': 'path',
      'errors_by_browser': 'browser_name',
      'errors_by_os': 'os_name',
      'errors_by_country': 'country',
      'errors_by_device': 'device_type',
      'error_types': 'error_message'
    };
    return mapping[tabId] || 'name';
  };

  const toggleRowExpansion = useCallback((rowId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
    });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (tableContainerRef.current) {
      const rect = tableContainerRef.current.getBoundingClientRect();
      setTooltipState(prev => ({ ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top }));
    }
  }, []);

  const handleRowMouseEnter = useCallback((row: TData, rowId: string) => {
    if (!renderTooltipContent) return;
    const content = renderTooltipContent(row);
    setTooltipState(prev => ({ ...prev, visible: true, content }));
    setHoveredRow(rowId);
  }, [renderTooltipContent]);

  const handleMouseLeave = useCallback(() => {
    if (!renderTooltipContent) return;
    setTooltipState(prev => ({ ...prev, visible: false }));
    setHoveredRow(null);
  }, [renderTooltipContent]);

  const handleTabChange = React.useCallback((tabId: string) => {
    if (tabId === activeTab) return;

    setIsTransitioning(true);
    setTimeout(() => {
      setActiveTab(tabId);
      setPagination(prev => ({ ...prev, pageIndex: 0 }));
      setGlobalFilter('');
      setExpandedRows(new Set());
      setIsTransitioning(false);
    }, 150);
  }, [activeTab]);

  if (isLoading) {
    return (
      <Card className={cn("w-full border-0 shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden", className)}>
        <CardHeader className="px-2 sm:px-3 pb-2">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <Skeleton className="h-5 w-32 rounded-md" />
              {description && <Skeleton className="h-3 w-48 rounded-sm mt-0.5" />}
            </div>
            {showSearch && (
              <div className="flex-shrink-0">
                <Skeleton className="h-7 w-36 rounded-md" />
              </div>
            )}
          </div>

          {tabs && tabs.length > 1 && (
            <div className="mt-3">
              <div className="flex gap-0.5 p-0.5 bg-muted/20 rounded-lg">
                {tabs.map((tab) => (
                  <Skeleton key={tab.id} className="h-8 w-20 rounded-md" />
                ))}
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="px-2 sm:px-3 pb-2">
          <EnhancedSkeleton minHeight={minHeight} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full border-0 shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden", className)}>
      <CardHeader className="px-2 sm:px-3 pb-2">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-sm truncate">
              {title}
            </h3>
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {description}
              </p>
            )}
          </div>

          {showSearch && (
            <div className="relative flex-shrink-0 w-full sm:w-auto">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground/50" />
              <Input
                placeholder="Filter data..."
                value={globalFilter ?? ''}
                onChange={(event) => setGlobalFilter(event.target.value)}
                className="h-7 w-full sm:w-36 pl-7 pr-2 text-xs bg-muted/30 border-0 focus:bg-background focus:ring-1 focus:ring-primary/20"
                aria-label={`Search ${title}`}
              />
            </div>
          )}
        </div>

        {tabs && tabs.length > 1 && (
          <div className="mt-3 overflow-hidden">
            <div className="overflow-x-auto pb-1 -mb-1">
              <nav className="inline-flex gap-0.5 p-0.5 bg-muted/40 rounded" role="tablist" aria-label="Data view options">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  const itemCount = tab.data?.length || 0;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleTabChange(tab.id)}
                      disabled={isTransitioning}
                      role="tab"
                      aria-selected={isActive}
                      aria-controls={`tabpanel-${tab.id}`}
                      tabIndex={isActive ? 0 : -1}
                      className={cn(
                        "flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all duration-200",
                        "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-1",
                        "disabled:opacity-60",
                        isActive
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                      )}
                    >
                      <span>{tab.label}</span>
                      {itemCount > 0 && (
                        <span className={cn(
                          "inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[10px] font-semibold",
                          isActive
                            ? "bg-primary/15 text-primary"
                            : "bg-muted-foreground/20 text-muted-foreground/70"
                        )}>
                          {itemCount > 99 ? '99+' : itemCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="px-2 sm:px-3 pb-2 overflow-hidden">
        <div
          className={cn(
            "transition-all duration-300 ease-out relative",
            isTransitioning && "opacity-40 scale-[0.98]"
          )}
          ref={tableContainerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <AnimatePresence>
            {renderTooltipContent && tooltipState.visible && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: "-50%" }}
                animate={{ opacity: 1, scale: 1, y: "-50%" }}
                exit={{ opacity: 0, scale: 0.9, y: "-50%" }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                style={{
                  top: tooltipState.y,
                  left: tooltipState.x,
                }}
                className="absolute z-30 pointer-events-none translate-x-4"
              >
                {tooltipState.content}
              </motion.div>
            )}
          </AnimatePresence>
          {isTransitioning && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-20 flex items-center justify-center">
              <div className="flex items-center gap-2 px-3 py-2 bg-background/80 rounded-lg border border-border/50 shadow-sm">
                <div className="w-3 h-3 bg-primary/60 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-muted-foreground">Loading...</span>
              </div>
            </div>
          )}

          {!table.getRowModel().rows.length ? (
            <div className="flex flex-col items-center justify-center py-8 sm:py-16 text-center" style={{ minHeight }}>
              <div className="mb-4">
                <div className="w-16 h-16 rounded-2xl bg-muted/20 flex items-center justify-center mb-3 mx-auto">
                  {globalFilter ? (
                    <Search className="h-7 w-7 text-muted-foreground/50" />
                  ) : (
                    <DatabaseIcon className="h-7 w-7 text-muted-foreground/50" />
                  )}
                </div>
              </div>
              <h4 className="text-base font-medium text-foreground mb-2">
                {globalFilter ? 'No results found' : emptyMessage}
              </h4>
              <p className="text-sm text-muted-foreground max-w-sm mb-4">
                {globalFilter
                  ? `No data matches your search for "${globalFilter}". Try adjusting your search terms.`
                  : 'Data will appear here when available and ready to display.'
                }
              </p>
              {globalFilter && (
                <button
                  type="button"
                  onClick={() => setGlobalFilter('')}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/15 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4" />
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div
              className="overflow-hidden rounded-md sm:rounded-lg border border-border/50 bg-background/50 relative"
              style={{ minHeight }}
              role="tabpanel"
              id={`tabpanel-${activeTab}`}
              aria-labelledby={`tab-${activeTab}`}
            >
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map(headerGroup => (
                      <TableRow key={headerGroup.id} className="bg-muted/20 border-border/30 sticky top-0 z-10">
                        {headerGroup.headers.map(header => (
                          <TableHead
                            key={header.id}
                            className={cn(
                              "h-11 text-xs font-semibold px-2 sm:px-4 text-muted-foreground uppercase tracking-wide bg-muted/20 backdrop-blur-sm",
                              (header.column.columnDef.meta as any)?.className,
                              header.column.getCanSort()
                                ? 'cursor-pointer hover:text-foreground hover:bg-muted/30 transition-all duration-200 select-none group'
                                : 'select-none'
                            )}
                            style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                            onClick={header.column.getToggleSortingHandler()}
                            tabIndex={header.column.getCanSort() ? 0 : -1}
                            role={header.column.getCanSort() ? "button" : undefined}
                            aria-sort={
                              header.column.getIsSorted() === 'asc' ? 'ascending' :
                                header.column.getIsSorted() === 'desc' ? 'descending' :
                                  header.column.getCanSort() ? 'none' : undefined
                            }
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="truncate">
                                {header.isPlaceholder
                                  ? null
                                  : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                              </span>
                              {header.column.getCanSort() && (
                                <div className="flex flex-col items-center justify-center w-3 h-3">
                                  {!header.column.getIsSorted() && (
                                    <ArrowUpDown className="h-3 w-3 text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors" />
                                  )}
                                  {header.column.getIsSorted() === 'asc' && (
                                    <ArrowUp className="h-3 w-3 text-primary" />
                                  )}
                                  {header.column.getIsSorted() === 'desc' && (
                                    <ArrowDown className="h-3 w-3 text-primary" />
                                  )}
                                </div>
                              )}
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody className="overflow-hidden">
                    {displayData.map((row, rowIndex) => {
                      const subRows = expandable && getSubRows ? getSubRows(row.original) : undefined;
                      const hasSubRows = subRows && subRows.length > 0;
                      const isExpanded = expandedRows.has(row.id);
                      const percentage = getRowPercentage(row.original);
                      const gradient = getPercentageGradient(percentage);

                      return (
                        <Fragment key={row.id}>
                          <TableRow
                            className={cn(
                              "h-12 border-border/20 relative transition-all duration-300 ease-in-out",
                              (onRowClick && !hasSubRows) || hasSubRows ? "cursor-pointer" : "",
                              hoveredRow && hoveredRow !== row.id ? "opacity-40 grayscale-[80%]" : "opacity-100",
                              !hoveredRow && (rowIndex % 2 === 0 ? "bg-background/50" : "bg-muted/10")
                            )}
                            onClick={() => {
                              if (hasSubRows) {
                                toggleRowExpansion(row.id);
                              } else if (onRowClick && row.original.name) {
                                const field = getFieldFromTabId(activeTab);
                                onRowClick(field, row.original.name);
                              }
                            }}
                            style={{
                              background: !hoveredRow && percentage > 0 ? gradient.background : undefined,
                              boxShadow: !hoveredRow && percentage > 0 ? `inset 3px 0 0 0 ${gradient.accentColor}` : undefined,
                            }}
                            onMouseEnter={() => handleRowMouseEnter(row.original, row.id)}
                          >
                            {row.getVisibleCells().map((cell, cellIndex) => (
                              <TableCell
                                key={cell.id}
                                className={cn(
                                  "py-3 text-sm font-medium transition-colors duration-150 px-2 sm:px-4",
                                  cellIndex === 0 && "font-semibold text-foreground",
                                  (cell.column.columnDef.meta as any)?.className
                                )}
                                style={{ width: cell.column.getSize() !== 150 ? cell.column.getSize() : undefined }}
                              >
                                <div className="flex items-center gap-2">
                                  {cellIndex === 0 && hasSubRows && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleRowExpansion(row.id);
                                      }}
                                      className="flex-shrink-0 p-0.5 hover:bg-muted rounded transition-colors"
                                      aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
                                    >
                                      {isExpanded ? (
                                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                                      ) : (
                                        <ChevronRightIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                      )}
                                    </button>
                                  )}
                                  <div className="truncate flex-1">
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                  </div>
                                </div>
                              </TableCell>
                            ))}
                          </TableRow>

                          {hasSubRows && isExpanded && subRows.map((subRow, subIndex) => (
                            <TableRow
                              key={`${row.id}-sub-${subIndex}`}
                              className="border-border/10 bg-muted/5 hover:bg-muted/10 transition-colors"
                            >
                              {renderSubRow ? (
                                <TableCell
                                  colSpan={row.getVisibleCells().length}
                                  className="p-0"
                                >
                                  {renderSubRow(subRow, row.original, subIndex)}
                                </TableCell>
                              ) : (
                                row.getVisibleCells().map((cell, cellIndex) => (
                                  <TableCell
                                    key={`sub-${cell.id}`}
                                    className={cn(
                                      "py-2 text-sm text-muted-foreground",
                                      cellIndex === 0 ? "pl-8" : "px-3"
                                    )}
                                    style={{ width: cell.column.getSize() !== 150 ? cell.column.getSize() : undefined }}
                                  >
                                    <div className="truncate">
                                      {cellIndex === 0 ? (
                                        <span className="text-xs">↳ {(subRow as any)[cell.column.id] || ''}</span>
                                      ) : (
                                        (subRow as any)[cell.column.id] || ''
                                      )}
                                    </div>
                                  </TableCell>
                                ))
                              )}
                            </TableRow>
                          ))}
                        </Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        {(table.getFilteredRowModel().rows.length > table.getState().pagination.pageSize || table.getPageCount() > 1) && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-border/30">
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              {(() => {
                const pageIndex = table.getState().pagination.pageIndex;
                const pageSize = table.getState().pagination.pageSize;
                const filteredRowCount = table.getFilteredRowModel().rows.length;
                const totalRowCount = (data || []).length;
                const firstVisibleRow = pageIndex * pageSize + 1;
                const lastVisibleRow = Math.min(firstVisibleRow + pageSize - 1, filteredRowCount);

                return (
                  <>
                    <span className="font-medium">
                      {firstVisibleRow}-{lastVisibleRow} of {filteredRowCount}
                    </span>
                    {filteredRowCount !== totalRowCount && (
                      <span className="text-muted-foreground/60">
                        (filtered from {totalRowCount})
                      </span>
                    )}
                  </>
                );
              })()}
            </div>

            {table.getPageCount() > 1 && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 hover:bg-muted/50"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>

                <div className="flex items-center gap-1 px-2 py-1 bg-muted/20 rounded">
                  <span className="text-xs font-medium min-w-0">
                    {table.getState().pagination.pageIndex + 1}
                  </span>
                  <span className="text-xs text-muted-foreground/70">/</span>
                  <span className="text-xs text-muted-foreground">
                    {table.getPageCount()}
                  </span>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 hover:bg-muted/50"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}