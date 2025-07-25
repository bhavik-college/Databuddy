'use client';

import {
  ArrowUpDown,
  Columns,
  Eye,
  EyeOff,
  Filter,
  RefreshCcw,
  Search,
  Trash2,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TableColumn {
  name: string;
  type: string;
}

interface TableControlsProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  pageSize: number;
  onPageSizeChange: (value: number) => void;
  selectedRowsCount: number;
  onDeleteSelected: () => void;
  columns: TableColumn[];
  hiddenColumns: Set<string>;
  onToggleColumn: (column: string) => void;
  onRefresh: () => void;
  loading: boolean;
}

export function TableControls({
  searchTerm,
  onSearchChange,
  pageSize,
  onPageSizeChange,
  selectedRowsCount,
  onDeleteSelected,
  columns,
  hiddenColumns,
  onToggleColumn,
  onRefresh,
  loading,
}: TableControlsProps) {
  return (
    <div className="relative flex h-[60px] w-full items-center gap-2 border-border border-b bg-sidebar px-2">
      {/* Left side controls */}
      <div className="flex items-center gap-2">
        <Button
          className="h-7 cursor-pointer bg-accent/50"
          size="sm"
          variant="outline"
        >
          <Filter className="size-3 opacity-80" />
          Filter
        </Button>
        <Button
          className="h-7 cursor-pointer bg-accent/50"
          size="sm"
          variant="outline"
        >
          <ArrowUpDown className="size-3 opacity-80" />
          Sort
        </Button>

        {/* Column Visibility */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="h-7 cursor-pointer bg-accent/50"
              size="sm"
              variant="outline"
            >
              <Columns className="size-3 opacity-80" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {columns.map((col) => (
              <DropdownMenuItem
                className="flex items-center justify-between"
                key={col.name}
                onClick={() => onToggleColumn(col.name)}
              >
                <span className="truncate">{col.name}</span>
                {hiddenColumns.has(col.name) ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Search */}
        <div className="relative">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-3 w-3 transform text-muted-foreground" />
          <Input
            className="h-7 w-48 bg-accent/50 pl-8"
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search..."
            value={searchTerm}
          />
        </div>

        {/* Page Size */}
        <Select
          onValueChange={(value) => onPageSizeChange(Number(value))}
          value={pageSize.toString()}
        >
          <SelectTrigger className="h-7 w-24 bg-accent/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
            <SelectItem value="200">200</SelectItem>
            <SelectItem value="500">500</SelectItem>
          </SelectContent>
        </Select>

        {/* Selected rows actions */}
        {selectedRowsCount > 0 && (
          <div className="flex items-center gap-2">
            <Badge className="h-7" variant="secondary">
              {selectedRowsCount} selected
            </Badge>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="h-7" size="sm" variant="destructive">
                  <Trash2 className="mr-1 h-3 w-3" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Rows</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {selectedRowsCount} selected
                    rows? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={onDeleteSelected}
                  >
                    Delete Rows
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      {/* Right side controls */}
      <div className="pointer-events-none absolute right-0 left-0 mr-2 flex h-full items-center justify-end gap-2">
        <Button
          className="pointer-events-auto h-7 cursor-pointer bg-accent/50"
          disabled={loading}
          onClick={onRefresh}
          size="sm"
          variant="outline"
        >
          <RefreshCcw className={`size-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
    </div>
  );
}
