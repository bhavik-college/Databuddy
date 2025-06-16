import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";

export function LoadingState() {
  // Create a fixed array of unique IDs for the loading rows
  const loadingRowIds = ['loading-row-1', 'loading-row-2', 'loading-row-3'];

  return (
    <div className="rounded border border-border bg-card/80 shadow-lg overflow-x-auto">
      <Table className="min-w-full text-sm">
        <TableHeader>
          <TableRow className="bg-muted/80 border-b border-border/60">
            <TableHead className="w-[40%] text-secondary-foreground text-xs font-bold uppercase tracking-wider py-4 px-6">Website</TableHead>
            <TableHead className="w-[40%] text-secondary-foreground text-xs font-bold uppercase tracking-wider py-4 px-6">Traffic</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loadingRowIds.map((id, index) => (
            <TableRow key={id}
              className="border-b border-border/50"
              style={{
                animationDelay: `${index * 100}ms`,
                opacity: 0,
                animation: 'fadeIn 0.5s ease forwards'
              }}
            >
              <TableCell className="py-4 px-6 align-middle">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-14 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-40" />
                </div>
              </TableCell>
              <TableCell className="py-4 px-6 align-middle">
                <Skeleton className="h-12 w-full rounded" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 