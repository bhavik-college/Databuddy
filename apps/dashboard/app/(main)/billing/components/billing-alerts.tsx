"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface BillingAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  action?: { label: string; onClick: () => void };
}

interface BillingAlertsProps {
  alerts: BillingAlert[];
}

export function BillingAlerts({ alerts }: BillingAlertsProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <Alert 
          key={alert.id} 
          className={`border-l-4 ${
            alert.type === 'error' ? 'border-l-destructive bg-destructive/5' :
            alert.type === 'warning' ? 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' :
            'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20'
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="text-sm">{alert.title}</AlertTitle>
          <AlertDescription className="flex items-center justify-between text-sm">
            <span>{alert.message}</span>
            {alert.action && (
              <Button variant="outline" size="sm" onClick={alert.action.onClick}>
                {alert.action.label}
              </Button>
            )}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
} 