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
import { ListFilterIcon, DatabaseIcon, ArrowUpDown, ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { type ColumnDef, type RowData, flexRender, getCoreRowModel, useReactTable, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, type SortingState, type PaginationState } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import React from "react";

interface TabConfig<TData> {
  id: string;
  label: string;
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
}

interface DataTableProps<TData extends RowData, TValue> {
  data?: TData[] | undefined;
  columns?: ColumnDef<TData, TValue>[];
  tabs?: TabConfig<TData>[];
  title: string;
  description?: string;
  isLoading?: boolean;
  initialPageSize?: number;
  emptyMessage?: string;
  className?: string;
  onRowClick?: (row: TData) => void;
  minHeight?: string | number;
  showSearch?: boolean;
}

// Helper function to get percentage value from row data
function getRowPercentage(row: any): number {
  // Try to find percentage in common property names
  if (typeof row.percentage === 'number') return row.percentage;
  if (typeof row.percent === 'number') return row.percent;
  if (typeof row.share === 'number') return row.share;
  return 0;
}

// Enhanced helper function for gradient colors with sophisticated aesthetics
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

// Enhanced skeleton loading component
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

export function DataTable<TData extends RowData, TValue>(
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
    showSearch = true
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

  // Use tab data if tabs are provided, otherwise use direct data/columns
  const currentTabData = tabs?.find(tab => tab.id === activeTab);
  const tableData = React.useMemo(() => currentTabData?.data || data || [], [currentTabData?.data, data]);
  const tableColumns = React.useMemo(() => currentTabData?.columns || columns || [], [currentTabData?.columns, columns]);

  const table = useReactTable({
    data: tableData,
    columns: tableColumns,
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

  // Enhanced tab switching with transition
  const handleTabChange = React.useCallback((tabId: string) => {
    if (tabId === activeTab) return;
    
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveTab(tabId);
      // Reset pagination when switching tabs
      setPagination(prev => ({ ...prev, pageIndex: 0 }));
      setIsTransitioning(false);
    }, 150);
  }, [activeTab]);

  if (isLoading) {
    return (
      <Card className={cn("w-full border-0 shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden", className)}>
        <CardHeader className={cn(
          "px-4 space-y-0 pb-3",
          showSearch ? "flex flex-row items-center justify-between" : ""
        )}>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-32 rounded-md" />
              <div className="w-2 h-2 bg-primary/20 rounded-full animate-pulse" />
            </div>
            {description && <Skeleton className="h-3 w-48 rounded-sm" />}
          </div>
          {showSearch && <Skeleton className="h-8 w-32 rounded-lg" />}
          
          {/* Enhanced tabs loading state */}
          {tabs && tabs.length > 1 && (
            <div className="flex items-center gap-4 mt-3">
              {tabs.map((tab) => (
                <Skeleton key={tab.id} className="h-4 w-16 rounded-md" />
              ))}
            </div>
          )}
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <EnhancedSkeleton minHeight={minHeight} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full border-0 shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden", className)}>
      <CardHeader className={cn(
        "px-4 space-y-0 pb-3 transition-all duration-300",
        showSearch ? "flex flex-row items-center justify-between" : ""
      )}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground tracking-tight text-sm md:text-base leading-tight transition-colors duration-200">
              {title}
            </h3>
            <div className="w-1.5 h-1.5 bg-primary/30 rounded-full animate-pulse" />
          </div>
          {description && (
            <div className="text-xs md:text-sm text-muted-foreground mt-1 leading-snug transition-colors duration-200">
              {description}
            </div>
          )}
        </div>
        
        {showSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground/50" />
            <Input 
              placeholder="Search all columns..."
              value={globalFilter ?? ''}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="h-8 pl-9 pr-3 max-w-xs text-xs border-muted-foreground/20 focus:border-primary/40 transition-all duration-200 focus:shadow-sm"
              aria-label="Search table data"
            />
          </div>
        )}
        
        {/* Enhanced Internal Tabs */}
        {tabs && tabs.length > 1 && (
                                  <div className="flex items-center gap-1 mt-3 p-1 bg-muted/20 rounded-md">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                disabled={isTransitioning}
                                  className={cn(
                    "relative px-3 py-1.5 text-xs font-medium rounded transition-colors duration-200",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    activeTab === tab.id
                      ? "text-foreground bg-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                  )}
                aria-label={`Switch to ${tab.label} tab`}
                aria-pressed={activeTab === tab.id}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" />
                )}
              </button>
            ))}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="px-4 pb-3 overflow-hidden">
        <div className={cn(
          "transition-opacity duration-300",
          isTransitioning && "opacity-30"
        )}>
          {!table.getRowModel().rows.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-xs" style={{ minHeight }}>
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-full blur-xl animate-pulse" />
                <ListFilterIcon className="relative h-16 w-16 text-muted-foreground/20" strokeWidth={1} />
                <DatabaseIcon className="absolute h-6 w-6 text-primary/60 -bottom-1 -right-1 animate-bounce" />
              </div>
              <p className="text-center max-w-[240px] font-medium text-sm mb-2">{emptyMessage}</p>
              <p className="text-center text-[10px] text-muted-foreground/70 leading-relaxed">
                Data will appear here once collected and processed
              </p>
            </div>
          ) : (
            <div 
              className="overflow-hidden rounded-lg border border-border/50 bg-background/50" 
              style={{ minHeight }}
            >
              <div className="overflow-hidden">
                <Table>
                <TableHeader>
                  {table.getHeaderGroups().map(headerGroup => (
                    <TableRow key={headerGroup.id} className="bg-muted/30 border-border/50">
                      {headerGroup.headers.map(header => (
                        <TableHead 
                          key={header.id}
                          className={cn(
                            "h-11 text-xs font-semibold px-4 text-muted-foreground uppercase tracking-wide",
                            (header.column.columnDef.meta as any)?.className,
                            header.column.getCanSort() ? 'cursor-pointer hover:text-foreground transition-colors select-none' : 'select-none'
                          )}
                          style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <div className="flex items-center gap-2">
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                            {header.column.getCanSort() && !header.column.getIsSorted() && <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />}
                            {header.column.getIsSorted() === 'asc' && <ArrowUp className="h-3 w-3 text-primary" />}
                            {header.column.getIsSorted() === 'desc' && <ArrowDown className="h-3 w-3 text-primary" />}
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody className="overflow-hidden">
                  {displayData.map((row, rowIndex) => {
                    const percentage = getRowPercentage(row.original);
                    const gradient = getPercentageGradient(percentage);
                    
                    return (
                      <TableRow 
                        key={row.id}
                        className={cn(
                          "h-12 border-border/30 relative transition-all duration-200 animate-in fade-in-0",
                          onRowClick ? "cursor-pointer hover:bg-muted/30" : ""
                        )}
                        onClick={() => onRowClick?.(row.original)}
                        style={{
                          background: percentage > 0 ? gradient.background : undefined,
                          borderLeft: percentage > 0 ? `3px solid ${gradient.borderColor}` : undefined,
                          animationDelay: `${rowIndex * 30}ms`,
                          animationFillMode: 'both'
                        }}
                        onMouseEnter={(e) => {
                          if (percentage > 0) {
                            const target = e.currentTarget as HTMLElement;
                            target.style.background = gradient.hoverBackground;
                            target.style.boxShadow = `0 4px 12px ${gradient.glowColor}`;
                          } else {
                            const target = e.currentTarget as HTMLElement;
                            target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          const target = e.currentTarget as HTMLElement;
                          if (percentage > 0) {
                            target.style.background = gradient.background;
                          }
                          target.style.boxShadow = '';
                        }}

                      >
                        {row.getVisibleCells().map((cell, cellIndex) => (
                          <TableCell 
                            key={cell.id}
                            className={cn(
                              "py-3 text-sm font-medium transition-colors duration-150 px-4",
                              (cell.column.columnDef.meta as any)?.className
                            )}
                            style={{ width: cell.column.getSize() !== 150 ? cell.column.getSize() : undefined }}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              </div>
            </div>
          )}
        </div>
        
        {/* Enhanced pagination */}
                    {(table.getFilteredRowModel().rows.length > 0 || table.getPageCount() > 1) && (
              <div className="flex items-center justify-between pt-4 text-xs">
            <div className="flex-1 text-muted-foreground font-medium">
              {(() => {
                const pageIndex = table.getState().pagination.pageIndex;
                const pageSize = table.getState().pagination.pageSize;
                const filteredRowCount = table.getFilteredRowModel().rows.length;
                const firstVisibleRow = pageIndex * pageSize + 1;
                const lastVisibleRow = Math.min(firstVisibleRow + pageSize - 1, filteredRowCount);
                if (filteredRowCount === 0 && !globalFilter) return "No data available";
                if (filteredRowCount === 0 && globalFilter) return "No results found";
                return (
                  <span className="flex items-center gap-1">
                    Showing <span className="font-semibold text-foreground">{firstVisibleRow}-{lastVisibleRow}</span> of <span className="font-semibold text-foreground">{filteredRowCount}</span> rows
                  </span>
                );
              })()}
            </div>
            
            {table.getPageCount() > 1 && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1 px-2">
                  <span className="text-muted-foreground font-medium">Page</span>
                  <span className="font-bold text-foreground text-sm">
                    {table.getState().pagination.pageIndex + 1}
                  </span>
                  <span className="text-muted-foreground">of</span>
                  <span className="font-bold text-foreground text-sm">
                    {table.getPageCount()}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 