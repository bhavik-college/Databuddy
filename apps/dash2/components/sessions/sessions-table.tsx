import { useMemo, useState } from "react";
import Image from "next/image";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { Monitor, Smartphone, Globe, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SessionData } from "@/hooks/use-analytics";

interface SessionsTableProps {
  sessions: SessionData[];
  isLoading: boolean;
  onSessionClick: (session: SessionData) => void;
}

const getBrowserIcon = (browser: string) => {
  const browserMap: Record<string, string> = {
    'chrome': '/browsers/Chrome.svg',
    'firefox': '/browsers/Firefox.svg',
    'safari': '/browsers/Safari.svg',
    'edge': '/browsers/Edge.svg',
    'opera': '/browsers/Opera.svg',
    'ie': '/browsers/IE.svg',
    'samsung': '/browsers/SamsungInternet.svg',
  };
  return browserMap[browser?.toLowerCase() || ''] || '/browsers/Chrome.svg';
};

const getOSIcon = (os: string) => {
  const osMap: Record<string, string> = {
    'windows': '/operating-systems/Windows.svg',
    'macos': '/operating-systems/macOS.svg',
    'ios': '/operating-systems/Apple.svg',
    'android': '/operating-systems/Android.svg',
    'linux': '/operating-systems/Ubuntu.svg',
    'ubuntu': '/operating-systems/Ubuntu.svg',
  };
  return osMap[os?.toLowerCase() || ''] || '/operating-systems/Windows.svg';
};

export function SessionsTable({ sessions, isLoading, onSessionClick }: SessionsTableProps) {
  const [globalFilter, setGlobalFilter] = useState("");

  const columns = useMemo<ColumnDef<SessionData>[]>(() => [
    {
      accessorKey: 'country',
      header: 'Location',
      cell: ({ row }) => {
        const session = row.original;
        const hasValidCountry = session.country && session.country !== 'Unknown';
        
        return (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center">
              {hasValidCountry ? (
                <Image 
                  src={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${session.country.toUpperCase()}.svg`}
                  alt={session.country}
                  width={20}
                  height={20}
                  
                  className="object-cover rounded-full"
                  onError={() => {}}
                />
              ) : (
                <Globe className="h-3 w-3 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">
                  {session.country || 'Unknown'}
                </span>
                <Badge variant={session.is_returning_visitor ? "default" : "secondary"} className="text-xs">
                  {session.is_returning_visitor ? 'Return' : 'New'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {session.city && session.city !== 'Unknown' ? session.city : 'Unknown City'}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'first_visit',
      header: ({ column }) => (
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            Date
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        </div>
      ),
      cell: ({ getValue }) => {
        const date = getValue() as string;
        return date ? (
          <div className="text-center">
            <p className="text-xs font-medium">{format(new Date(date), 'MMM d')}</p>
            <p className="text-xs text-muted-foreground">{format(new Date(date), 'HH:mm')}</p>
          </div>
        ) : (
          <div className="text-center">
            <span className="text-xs text-muted-foreground">-</span>
          </div>
        );
      },
      sortingFn: 'datetime',
    },
    {
      accessorKey: 'duration',
      header: ({ column }) => (
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            Duration
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        </div>
      ),
      cell: ({ getValue }) => {
        const duration = getValue() as number || 0;
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        return (
          <div className="text-center">
            <span className="text-xs font-medium">
              {`${minutes}:${String(seconds).padStart(2, '0')}`}
            </span>
          </div>
        );
      },
      sortingFn: 'basic',
    },
    {
      accessorKey: 'page_views',
      header: ({ column }) => (
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            Pages
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        </div>
      ),
      cell: ({ getValue }) => (
        <div className="text-center">
          <span className="text-xs font-medium">{(getValue() as number) || 0}</span>
        </div>
      ),
      sortingFn: 'basic',
    },
    {
      accessorKey: 'device',
      header: () => <div className="text-center">Device</div>,
      cell: ({ getValue }) => {
        const device = getValue() as string;
        return (
          <div className="flex items-center justify-center gap-1">
            {device === 'desktop' ? <Monitor className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
            <span className="text-xs">{device || 'Unknown'}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'browser',
      header: () => <div className="text-center">Browser</div>,
      cell: ({ getValue }) => {
        const browser = getValue() as string;
        return (
          <div className="flex items-center justify-center gap-1">
            <Image 
              src={getBrowserIcon(browser)} 
              alt={browser || 'Unknown'}
              width={12}
              height={12}
              className="flex-shrink-0"
            />
            <span className="text-xs truncate">{browser || 'Unknown'}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'os',
      header: () => <div className="text-center">OS</div>,
      cell: ({ getValue }) => {
        const os = getValue() as string;
        return (
          <div className="flex items-center justify-center gap-1">
            <Image 
              src={getOSIcon(os)} 
              alt={os || 'Unknown'}
              width={12}
              height={12}
              className="flex-shrink-0"
            />
            <span className="text-xs truncate">{os || 'Unknown'}</span>
          </div>
        );
      },
    },
  ], []);

  const table = useReactTable({
    data: sessions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: 'includesString',
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    initialState: {
      pagination: {
        pageSize: 50,
      },
    },
  });

  if (isLoading) {
    return (
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="p-8 text-center text-muted-foreground">
          Loading sessions...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Table */}
      <div className="flex-1 border border-border rounded-lg overflow-hidden min-h-0">
        <div className="h-full overflow-y-auto">
          <table className="w-full">
            <thead className="bg-muted sticky top-0">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="p-3 text-xs font-medium text-muted-foreground text-center">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => onSessionClick(row.original)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSessionClick(row.original);
                    }
                  }}
                  aria-label={`View details for session from ${row.original.country || 'Unknown'}`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="p-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex-shrink-0 flex items-center justify-between mt-4">
        <div className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
} 