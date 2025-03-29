import { LucideIcon } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: number;
  trendLabel?: string;
  isLoading?: boolean;
  className?: string;
  variant?: "default" | "success" | "info" | "warning" | "danger";
  // Flag to indicate if decreasing values are positive (e.g., bounce rate, page load time)
  invertTrend?: boolean;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendLabel,
  isLoading = false,
  className,
  variant = "default",
  invertTrend = false
}: StatCardProps) {
  // Determine color based on variant
  const getVariantClasses = () => {
    switch (variant) {
      case "success":
        return "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900";
      case "info":
        return "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900";
      case "warning":
        return "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900";
      case "danger":
        return "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900";
      default:
        return "";
    }
  };

  // Determine color for trend indicator
  const getTrendColor = () => {
    if (trend === undefined || trend === 0) return "text-muted-foreground";
    
    // For metrics where decreasing is positive (like bounce rate), invert the color logic
    if (invertTrend) {
      return trend < 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
    }
    
    return trend > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
  };

  if (isLoading) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <div className="p-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-16" />
            {Icon && <Skeleton className="h-3 w-3 rounded-full" />}
          </div>
          <Skeleton className="h-5 w-12 mt-1.5" />
          <Skeleton className="h-2.5 w-16 mt-1" />
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden transition-all hover:shadow-md py-2", getVariantClasses(), className)}>
      <div className="p-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight">{title}</p>
          {Icon && (
            <Icon className="h-3 w-3 text-muted-foreground" />
          )}
        </div>
        <div className="text-base font-bold leading-none mt-1.5">{value}</div>
        <div className="flex items-center text-[10px] mt-1 leading-none">
          {trend !== undefined && !isNaN(trend) && (
            <span className={cn("font-medium", getTrendColor())}>
              {trend > 0 ? "↑" : trend < 0 ? "↓" : "→"} {Math.abs(trend)}%
            </span>
          )}
          {trendLabel && trend !== undefined && !isNaN(trend) && (
            <span className="text-muted-foreground ml-1">
              {trendLabel}
            </span>
          )}
          {description && (!trendLabel || trend === undefined || isNaN(trend)) && (
            <span className="text-muted-foreground">
              {description}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
} 