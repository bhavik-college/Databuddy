"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Download, Loader2, History } from "lucide-react";

interface BillingHistoryItem {
  id: string;
  date: string;
  amount: number;
  status: "paid" | "failed";
  description: string;
  period: string;
  pdfUrl: string;
  paymentMethod: string;
}

interface HistoryTabProps {
  billingHistory: BillingHistoryItem[];
  onDownload: (invoiceId: string) => void;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
  loadingStates: Record<string, boolean>;
}

export function HistoryTab({ 
  billingHistory, 
  onDownload, 
  formatCurrency, 
  formatDate, 
  loadingStates 
}: HistoryTabProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="h-4 w-4" />
          Billing History
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          View and download your invoices and payment history
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {billingHistory.map((invoice) => (
            <div
              key={invoice.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-full ${
                  invoice.status === 'paid' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {invoice.status === 'paid' ? (
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                  ) : (
                    <XCircle className="h-3 w-3 text-red-600" />
                  )}
                </div>
                <div>
                  <div className="font-medium text-sm">{invoice.description}</div>
                  <div className="text-xs text-muted-foreground">
                    {invoice.id} • {formatDate(invoice.date)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {invoice.period} • {invoice.paymentMethod}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="font-medium text-sm">{formatCurrency(invoice.amount)}</div>
                  <Badge 
                    variant={invoice.status === 'paid' ? 'secondary' : 'destructive'}
                    className="text-xs"
                  >
                    {invoice.status}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDownload(invoice.id)}
                  disabled={loadingStates[`download-${invoice.id}`]}
                  className="h-8 w-8"
                >
                  {loadingStates[`download-${invoice.id}`] ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Download className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 