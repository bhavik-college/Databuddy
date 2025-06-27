import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function LoadingState() {
  // Create a fixed array of unique IDs for the loading rows
  const loadingRowIds = ["loading-row-1", "loading-row-2", "loading-row-3"];

  return (
    <div className="overflow-x-auto rounded border border-border bg-card/80 shadow-lg">
      <Table className="min-w-full text-sm">
        <TableHeader>
          <TableRow className="border-border/60 border-b bg-muted/80">
            <TableHead className="w-[40%] px-6 py-4 font-bold text-secondary-foreground text-xs uppercase tracking-wider">
              Website
            </TableHead>
            <TableHead className="w-[40%] px-6 py-4 font-bold text-secondary-foreground text-xs uppercase tracking-wider">
              Traffic
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loadingRowIds.map((id, index) => (
            <TableRow
              className="border-border/50 border-b"
              key={id}
              style={{
                animationDelay: `${index * 100}ms`,
                opacity: 0,
                animation: "fadeIn 0.5s ease forwards",
              }}
            >
              <TableCell className="px-6 py-4 align-middle">
                <div className="flex flex-col">
                  <div className="mb-1 flex items-center gap-1.5">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-14 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-40" />
                </div>
              </TableCell>
              <TableCell className="px-6 py-4 align-middle">
                <Skeleton className="h-12 w-full rounded" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
