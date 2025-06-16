import { 
  Activity,
  FileText,
  Database,
  Table,
  Folder,
  BarChart,
  MessageSquare,
  Bell,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  type Notification, 
  isAuditNotification, 
  isAnalyticsNotification,
  isBillingNotification 
} from "./types";

// Helper function to get icon for resource type
function getResourceIcon(resourceType: string) {
  const type = resourceType.toLowerCase();
  
  if (type.includes('document') || type.includes('file')) {
    return <FileText className="h-4 w-4 text-primary" />;
  } 
  if (type.includes('database') || type.includes('db')) {
    return <Database className="h-4 w-4 text-primary" />;
  }
  if (type.includes('table')) {
    return <Table className="h-4 w-4 text-primary" />;
  }
  if (type.includes('folder') || type.includes('directory')) {
    return <Folder className="h-4 w-4 text-primary" />;
  }
  
}

// Helper function to format percentage
function formatPercentage(value: number | undefined) {
  if (typeof value !== 'number') return '';
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

interface NotificationItemProps {
  notification: Notification;
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const isAudit = isAuditNotification(notification);
  const isAnalytics = isAnalyticsNotification(notification);
  const isBilling = isBillingNotification(notification);
  
  // Get website and environment based on notification type
  const website = isAudit ? notification.details.website : notification.website;
  const environment = isAudit ? notification.details.environment : notification.environment;
  
  return (
    <div 
      className={cn(
        "p-4 hover:bg-accent/50 cursor-pointer transition-colors",
        !notification.read && "bg-accent/30"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          {isAudit ? (
            getResourceIcon(notification.details.resourceType)
          ) : isAnalytics ? (
            notification.trend === 'up' ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : notification.trend === 'down' ? (
              <TrendingDown className="h-4 w-4 text-red-500" />
            ) : (
              <Minus className="h-4 w-4 text-primary" />
            )
          ) : isBilling ? (
            notification.usageValue && notification.usageLimit && 
            (notification.usageValue / notification.usageLimit) > 0.9 ? (
              <AlertCircle className="h-4 w-4 text-red-500" />
            ) : (
              <MessageSquare className="h-4 w-4 text-primary" />
            )
          ) : (
            <Bell className="h-4 w-4 text-primary" />
          )}
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium leading-none">{notification.title}</p>
            {website && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-secondary">
                {website}
              </span>
            )}
            {environment && (
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded-full",
                environment === 'production' && "bg-red-500/10 text-red-500",
                environment === 'staging' && "bg-yellow-500/10 text-yellow-500",
                environment === 'development' && "bg-green-500/10 text-green-500"
              )}>
                {environment}
              </span>
            )}
          </div>
          
          {/* Audit notification details */}
          {isAudit && (
            <div className="text-xs text-muted-foreground space-y-1">
              {notification.description && (
                <p>{notification.description}</p>
              )}
              {notification.details.changes && notification.details.changes.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {notification.details.changes.map((change, i) => (
                    <p key={notification.id} className="flex items-center gap-1">
                      <span className="font-medium">{change.field}:</span>
                      {change.oldValue && (
                        <>
                          <span className="line-through">{change.oldValue}</span>
                          <span>→</span>
                        </>
                      )}
                      <span>{change.newValue}</span>
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Analytics notification details */}
          {isAnalytics && (
            <div className="text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="font-medium">{notification.metric}:</span>
                <span>{notification.value}</span>
                {notification.percentageChange && (
                  <span className={cn(
                    "font-medium",
                    notification.trend === 'up' && "text-green-500",
                    notification.trend === 'down' && "text-red-500"
                  )}>
                    {formatPercentage(notification.percentageChange)}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Billing notification details */}
          {isBilling && (
            <div className="text-xs text-muted-foreground">
              {notification.usageMetric && notification.usageValue !== undefined && notification.usageLimit && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span>{notification.usageMetric}</span>
                    <span>{notification.usageValue} / {notification.usageLimit}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-primary/10">
                    <div 
                      className={cn(
                        "h-full rounded-full",
                        (notification.usageValue / notification.usageLimit) > 0.9 
                          ? "bg-red-500" 
                          : "bg-primary"
                      )} 
                      style={{ 
                        width: `${Math.min(100, (notification.usageValue / notification.usageLimit) * 100)}%` 
                      }} 
                    />
                  </div>
                </div>
              )}
              {notification.amount && (
                <p className="mt-1">
                  Amount: ${notification.amount.toFixed(2)}
                  {notification.planName && ` - ${notification.planName}`}
                </p>
              )}
            </div>
          )}

          <p className="text-xs text-muted-foreground">{notification.time}</p>
        </div>
      </div>
    </div>
  );
} 