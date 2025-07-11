import type { Website } from "@databuddy/shared";
import {
  ArrowRightIcon,
  GlobeIcon,
  MinusIcon,
  TrendDownIcon,
  TrendUpIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { memo, useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FaviconImage } from "@/components/analytics/favicon-image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { MiniChartDataPoint } from "@/hooks/use-analytics";

interface WebsiteCardProps {
  website: Website;
  chartData?: MiniChartDataPoint[];
  isLoadingChart?: boolean;
}

const formatNumber = (num: number) => {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const getTrend = (data: MiniChartDataPoint[]) => {
  if (data.length < 4) return null;

  const mid = Math.floor(data.length / 2);
  const [first, second] =
    data.length >= 8
      ? [data.slice(-14, -7), data.slice(-7)]
      : [data.slice(0, mid), data.slice(mid)];

  const avg = (arr: MiniChartDataPoint[]) => arr.reduce((sum, p) => sum + p.value, 0) / arr.length;
  const [prevAvg, currAvg] = [avg(first), avg(second)];

  if (prevAvg === 0) return currAvg > 0 ? { type: "up", value: 100 } : null;

  const change = ((currAvg - prevAvg) / prevAvg) * 100;
  const type = change > 5 ? "up" : change < -5 ? "down" : "neutral";

  return { type, value: Math.abs(change) };
};

// Memoized chart component
const Chart = memo(({ data, id }: { data: MiniChartDataPoint[]; id: string }) => (
  <div className="chart-container">
    <ResponsiveContainer height={50} width="100%">
      <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`gradient-${id}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="5%" stopColor="var(--chart-color)" stopOpacity={0.8} />
            <stop offset="95%" stopColor="var(--chart-color)" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" hide />
        <YAxis domain={["dataMin - 5", "dataMax + 5"]} hide />
        <Tooltip
          content={({ active, payload, label }) =>
            active && payload?.[0] && typeof payload[0].value === "number" ? (
              <div className="rounded-lg border bg-background p-2 text-sm shadow-lg">
                <p className="font-medium">
                  {new Date(label).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
                <p className="text-primary">{formatNumber(payload[0].value)} views</p>
              </div>
            ) : null
          }
        />
        <Area
          dataKey="value"
          dot={false}
          fill={`url(#gradient-${id})`}
          stroke="var(--chart-color)"
          strokeWidth={2.5}
          type="monotone"
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
));

Chart.displayName = "Chart";

export const WebsiteCard = memo(({ website, chartData, isLoadingChart }: WebsiteCardProps) => {
  const data = chartData || [];

  // Memoize expensive calculations
  const { totalViews, trend } = useMemo(
    () => ({
      totalViews: data.reduce((sum, point) => sum + point.value, 0),
      trend: getTrend(data),
    }),
    [data]
  );

  return (
    <Link
      className="group block"
      data-section="website-grid"
      data-track="website-card-click"
      data-website-id={website.id}
      data-website-name={website.name}
      href={`/websites/${website.id}`}
    >
      <Card className="flex h-full select-none flex-col bg-background transition-all duration-300 ease-in-out group-hover:border-primary/60 group-hover:shadow-primary/5 group-hover:shadow-xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <CardTitle className="truncate font-bold text-base transition-colors group-hover:text-primary">
                {website.name}
              </CardTitle>
              <CardDescription className="flex items-center gap-1 pt-0.5">
                <FaviconImage
                  altText={`${website.name} favicon`}
                  className="flex-shrink-0"
                  domain={website.domain}
                  size={24}
                />
                <span className="truncate text-xs">{website.domain}</span>
              </CardDescription>
            </div>
            <ArrowRightIcon
              aria-hidden="true"
              className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-all duration-200 group-hover:translate-x-1 group-hover:text-primary"
              weight="fill"
            />
          </div>
        </CardHeader>

        <CardContent className="pt-0 pb-3">
          {isLoadingChart ? (
            <div className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-12 rounded" />
                <Skeleton className="h-3 w-8 rounded" />
              </div>
              <Skeleton className="h-12 w-full rounded" />
            </div>
          ) : !chartData ? (
            <div className="py-4 text-center text-muted-foreground text-xs">Failed to load</div>
          ) : data.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-muted-foreground text-xs">
                  {formatNumber(totalViews)} views
                </span>
                {trend && (
                  <div
                    className={`flex items-center gap-1 font-medium text-xs ${trend.type === "up"
                      ? "text-success"
                      : trend.type === "down"
                        ? "text-destructive"
                        : "text-muted-foreground"
                      }`}
                  >
                    {trend.type === "up" ? (
                      <TrendUpIcon aria-hidden="true" className="h-4 w-4" weight="fill" />
                    ) : trend.type === "down" ? (
                      <TrendDownIcon aria-hidden="true" className="h-4 w-4" weight="fill" />
                    ) : (
                      <MinusIcon aria-hidden="true" className="h-4 w-4" weight="fill" />
                    )}
                    <span>
                      {trend.type === "neutral"
                        ? "—"
                        : `${trend.type === "up" ? "+" : "-"}${trend.value.toFixed(0)}%`}
                    </span>
                  </div>
                )}
              </div>
              <div className="transition-colors duration-300 [--chart-color:theme(colors.primary.DEFAULT)] group-hover:[--chart-color:theme(colors.primary.600)]">
                <Chart data={data} id={website.id} />
              </div>
            </div>
          ) : (
            <div className="py-4 text-center text-muted-foreground text-xs">No data yet</div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
});

WebsiteCard.displayName = "WebsiteCard";

export function WebsiteCardSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader>
        <Skeleton className="h-6 w-3/4 rounded-md" />
        <Skeleton className="mt-1 h-4 w-1/2 rounded-md" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-20 w-full rounded-md" />
      </CardContent>
    </Card>
  );
}
