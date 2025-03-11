"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface TopPagesTableProps {
  data: Array<{ page: string; visits: number }>;
}

export function TopPagesTable({ data }: TopPagesTableProps) {
  // Sort data by visits (descending)
  const sortedData = [...data]
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 10);
  
  // Calculate total visits for percentage
  const totalVisits = sortedData.reduce((sum, item) => sum + item.visits, 0);

  return (
    <Card className="bg-slate-900/80 border-slate-800/80 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-base">Top Pages</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-slate-400">Page</TableHead>
              <TableHead className="text-slate-400 text-right">Visits</TableHead>
              <TableHead className="text-slate-400 text-right">%</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length > 0 ? (
              sortedData.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium text-slate-300 truncate max-w-[200px]">
                    {item.page}
                  </TableCell>
                  <TableCell className="text-right text-slate-400">
                    {item.visits.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-slate-400">
                    <div className="flex items-center justify-end gap-2">
                      <span>
                        {totalVisits > 0 ? Math.round((item.visits / totalVisits) * 100) : 0}%
                      </span>
                      <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-sky-500 rounded-full" 
                          style={{ 
                            width: `${totalVisits > 0 ? Math.round((item.visits / totalVisits) * 100) : 0}%` 
                          }}
                        />
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-slate-400 py-4">
                  No data available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
} 