"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExternalLink } from "lucide-react";

interface TopReferrersTableProps {
  data: Array<{ referrer: string; visits: number }>;
}

export function TopReferrersTable({ data }: TopReferrersTableProps) {
  // Sort data by visits (descending)
  const sortedData = [...data]
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 10);
  
  // Calculate total visits for percentage
  const totalVisits = sortedData.reduce((sum, item) => sum + item.visits, 0);

  // Format referrer for display
  const formatReferrer = (referrer: string): string => {
    if (referrer === "direct") return "Direct / None";
    if (referrer === "(unknown)") return "Unknown";
    
    try {
      // Try to extract domain from URL
      const url = new URL(referrer.startsWith("http") ? referrer : `https://${referrer}`);
      return url.hostname.replace(/^www\./, "");
    } catch (e) {
      return referrer;
    }
  };

  return (
    <Card className="bg-slate-900/80 border-slate-800/80 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-base">Top Referrers</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-slate-400">Source</TableHead>
              <TableHead className="text-slate-400 text-right">Visits</TableHead>
              <TableHead className="text-slate-400 text-right">%</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length > 0 ? (
              sortedData.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium text-slate-300">
                    <div className="flex items-center gap-1">
                      {formatReferrer(item.referrer)}
                      {item.referrer !== "direct" && item.referrer !== "(unknown)" && (
                        <a 
                          href={item.referrer.startsWith("http") ? item.referrer : `https://${item.referrer}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sky-400 hover:text-sky-300"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
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
                          className="h-full bg-purple-500 rounded-full" 
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