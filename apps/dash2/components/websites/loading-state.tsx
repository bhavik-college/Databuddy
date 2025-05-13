import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";

export function LoadingState() {
  // Create a fixed array of unique IDs for the loading rows
  const loadingRowIds = ['loading-row-1', 'loading-row-2', 'loading-row-3'];
  
  return (
    <div className="rounded-md border overflow-hidden bg-card">
      <Table className="table-modern">
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="w-[40%] text-foreground/70 text-xs">WEBSITE</TableHead>
            <TableHead className="w-[40%] text-foreground/70 text-xs">TRAFFIC</TableHead>
            <TableHead className="text-right text-foreground/70 text-xs">ACTIONS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loadingRowIds.map((id, index) => (
            <TableRow key={id} style={{ 
              animationDelay: `${index * 100}ms`,
              opacity: 0,
              animation: 'fadeIn 0.5s ease forwards'
            }}>
              <TableCell className="py-3.5">
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-48" />
                </div>
              </TableCell>
              <TableCell className="py-3.5">
                <Skeleton className="h-12 w-full rounded-md" />
              </TableCell>
              <TableCell className="py-3.5" align="right">
                <div className="flex items-center justify-end gap-1.5">
                  <Skeleton className="h-8 w-24 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 