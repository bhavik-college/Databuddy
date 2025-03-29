import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ListFilterIcon, DatabaseIcon } from "lucide-react";

interface Column {
  accessorKey: string;
  header: string;
  cell?: (value: any, row: any) => React.ReactNode;
  className?: string;
}

interface DataTableProps {
  data: any[] | undefined;
  columns: Column[];
  title: string;
  description?: string;
  isLoading?: boolean;
  limit?: number;
  emptyMessage?: string;
  className?: string;
  onRowClick?: (row: any) => void;
}

export function DataTable({
  data,
  columns,
  title,
  description,
  isLoading = false,
  limit = 5,
  emptyMessage = "No data available",
  className,
  onRowClick
}: DataTableProps) {

  const displayData = data?.slice(0, limit);

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader className="pb-0.5 pt-3 px-3">
          <CardTitle className="text-xs font-medium">{title}</CardTitle>
          {description && <CardDescription className="text-xs">{description}</CardDescription>}
        </CardHeader>
        <CardContent className="px-3 pb-2 pt-1">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-0.5 pt-3 px-3">
        <CardTitle className="text-xs font-medium">{title}</CardTitle>
        {description && <CardDescription className="text-xs">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="px-3 pb-2 pt-1">
        {!displayData?.length ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-xs">
            <div className="relative mb-3">
              <ListFilterIcon className="h-10 w-10 text-muted-foreground/30" strokeWidth={1} />
              <DatabaseIcon className="h-4 w-4 text-primary absolute -bottom-1 -right-1" />
            </div>
            <p className="text-center max-w-[200px]">{emptyMessage}</p>
            <p className="text-center text-[10px] text-muted-foreground/70 mt-1">
              Data will appear here once collected
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  {columns.map((column) => (
                    <TableHead 
                      key={column.accessorKey}
                      className={cn("h-7 text-[11px] font-medium", column.className)}
                    >
                      {column.header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayData.map((row, rowIndex) => (
                  <TableRow 
                    key={rowIndex} 
                    className={cn(
                      "h-8 hover:bg-muted/30",
                      rowIndex % 2 === 0 ? "" : "bg-muted/20",
                      onRowClick ? "cursor-pointer" : ""
                    )}
                    onClick={() => onRowClick && onRowClick(row)}
                  >
                    {columns.map((column) => (
                      <TableCell 
                        key={`${rowIndex}-${column.accessorKey}`}
                        className={cn("py-1.5 px-3 text-xs", column.className)}
                      >
                        {column.cell 
                          ? column.cell(row[column.accessorKey], row) 
                          : row[column.accessorKey]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 