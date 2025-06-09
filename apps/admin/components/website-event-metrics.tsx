import { Activity, Users, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { WebsiteEventCounts } from "@/types/website";

interface WebsiteEventMetricsProps {
  eventCounts: WebsiteEventCounts;
  showLabels?: boolean;
  compact?: boolean;
}

// Helper function to format numbers
export const formatNumber = (num: number) => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

export function WebsiteEventMetrics({ 
  eventCounts, 
  showLabels = true, 
  compact = false 
}: WebsiteEventMetricsProps) {
  if (compact) {
    return (
      <div className="flex gap-2 text-xs text-muted-foreground">
        <span>Events: {formatNumber(eventCounts.totalEvents)}</span>
        <span>Sessions: {formatNumber(eventCounts.totalSessions)}</span>
        <span>24h: {formatNumber(eventCounts.eventsLast24h)}</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-500" />
            <div>
              {showLabels && <p className="text-sm font-medium">Total Events</p>}
              <p className="text-2xl font-bold">{formatNumber(eventCounts.totalEvents)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-green-500" />
            <div>
              {showLabels && <p className="text-sm font-medium">Total Sessions</p>}
              <p className="text-2xl font-bold">{formatNumber(eventCounts.totalSessions)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-orange-500" />
            <div>
              {showLabels && <p className="text-sm font-medium">Events (24h)</p>}
              <p className="text-2xl font-bold">{formatNumber(eventCounts.eventsLast24h)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 