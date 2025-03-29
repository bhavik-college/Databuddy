import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3Icon } from "lucide-react";

interface SkeletonChartProps {
  height?: number;
  title?: string;
  className?: string;
}

export function SkeletonChart({ height = 300, title, className }: SkeletonChartProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-0.5 pt-3 px-3">
        {title ? (
          <>
            <CardTitle className="text-xs font-medium">{title}</CardTitle>
            <CardDescription className="text-xs">Loading data...</CardDescription>
          </>
        ) : (
          <>
            <Skeleton className="h-3 w-32 mb-1" />
            <Skeleton className="h-2.5 w-40" />
          </>
        )}
      </CardHeader>
      <CardContent style={{ height: `${height}px` }}>
        <div className="relative w-full h-full overflow-hidden">
          <div className="flex items-center justify-center h-full">
            <BarChart3Icon
              className="h-12 w-12 text-muted-foreground/20 animate-pulse"
              strokeWidth={1}
            />
          </div>
          
          {/* Skeleton lines with gradient effect */}
          <div className="absolute bottom-12 left-0 right-0 flex items-end justify-between px-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="bg-gradient-to-t from-primary/5 to-primary/20 rounded-t animate-pulse"
                style={{
                  width: '12%',
                  height: `${20 + Math.random() * 100}px`,
                  animationDelay: `${i * 100}ms`,
                  opacity: 0.7
                }}
              />
            ))}
          </div>
          
          {/* Bottom axis */}
          <Skeleton className="absolute bottom-6 left-0 right-0 h-0.5 mx-4" />
          
          {/* X-axis labels */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-2 w-10" />
            ))}
          </div>
          
          {/* Y-axis */}
          <Skeleton className="absolute top-4 bottom-6 left-4 w-0.5" />
          
          {/* Y-axis labels */}
          <div className="absolute top-4 bottom-12 left-0 flex flex-col justify-between">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-2 w-6 ml-1" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 