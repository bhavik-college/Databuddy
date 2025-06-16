import Link from 'next/link';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { GlobeIcon, ArrowRightIcon, TrendUpIcon, TrendDownIcon, MinusIcon } from '@phosphor-icons/react';
import type { MiniChartDataPoint } from '@/hooks/use-analytics';
import { useMiniChartData } from '@/hooks/use-analytics';
import type { Website } from '@databuddy/shared';
import { memo, useMemo } from 'react';
import { FaviconImage } from '@/components/analytics/favicon-image';

interface WebsiteCardProps {
    website: Website;
}

const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
};

const getTrend = (data: MiniChartDataPoint[]) => {
    if (data.length < 4) return null;

    const mid = Math.floor(data.length / 2);
    const [first, second] = data.length >= 8
        ? [data.slice(-14, -7), data.slice(-7)]
        : [data.slice(0, mid), data.slice(mid)];

    const avg = (arr: MiniChartDataPoint[]) => arr.reduce((sum, p) => sum + p.value, 0) / arr.length;
    const [prevAvg, currAvg] = [avg(first), avg(second)];

    if (prevAvg === 0) return currAvg > 0 ? { type: 'up', value: 100 } : null;

    const change = ((currAvg - prevAvg) / prevAvg) * 100;
    const type = change > 5 ? 'up' : change < -5 ? 'down' : 'neutral';

    return { type, value: Math.abs(change) };
};

// Memoized chart component
const Chart = memo(({ data, id }: { data: MiniChartDataPoint[]; id: string }) => (
    <div className="chart-container">
        <ResponsiveContainer width="100%" height={50}>
            <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id={`gradient-${id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--chart-color)" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="var(--chart-color)" stopOpacity={0.1} />
                    </linearGradient>
                </defs>
                <XAxis dataKey="date" hide />
                <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                <Tooltip
                    content={({ active, payload, label }) =>
                        active && payload?.[0] && typeof payload[0].value === 'number' ? (
                            <div className="bg-background border rounded-lg shadow-lg p-2 text-sm">
                                <p className="font-medium">{new Date(label).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                                <p className="text-primary">{formatNumber(payload[0].value)} views</p>
                            </div>
                        ) : null
                    }
                />
                <Area
                    type="monotone"
                    dataKey="value"
                    stroke="var(--chart-color)"
                    fill={`url(#gradient-${id})`}
                    strokeWidth={2.5}
                    dot={false}
                />
            </AreaChart>
        </ResponsiveContainer>
    </div>
));

Chart.displayName = 'Chart';

export const WebsiteCard = memo(({ website }: WebsiteCardProps) => {
    const { data: response, isLoading, isError } = useMiniChartData(website.id);

    const data = response?.data || [];

    // Memoize expensive calculations
    const { totalViews, trend } = useMemo(() => ({
        totalViews: data.reduce((sum, point) => sum + point.value, 0),
        trend: getTrend(data)
    }), [data]);

    return (
        <Link
            href={`/websites/${website.id}`}
            className="block group"
            data-track="website-card-click"
            data-website-id={website.id}
            data-website-name={website.name}
            data-section="website-grid"
        >
            <Card className="h-full flex flex-col transition-all duration-300 ease-in-out group-hover:border-primary/60 group-hover:shadow-xl group-hover:shadow-primary/5 group-hover:-translate-y-1 bg-gradient-to-br from-background to-muted/20">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                            <CardTitle className="text-base font-bold truncate group-hover:text-primary transition-colors">
                                {website.name}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-1 pt-0.5">
                                <FaviconImage
                                    domain={website.domain}
                                    size={24}
                                    className="flex-shrink-0"
                                    altText={`${website.name} favicon`}
                                />
                                <span className="truncate text-xs">{website.domain}</span>
                            </CardDescription>
                        </div>
                        <ArrowRightIcon size={32} weight="fill" className="h-4 w-4 text-muted-foreground transition-all duration-200 group-hover:translate-x-1 group-hover:text-primary flex-shrink-0" />
                    </div>
                </CardHeader>

                <CardContent className="pt-0 pb-3">
                    {isLoading ? (
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Skeleton className="h-3 w-12 rounded" />
                                <Skeleton className="h-3 w-8 rounded" />
                            </div>
                            <Skeleton className="h-12 w-full rounded" />
                        </div>
                    ) : isError ? (
                        <div className="text-center text-xs text-muted-foreground py-4">Failed to load</div>
                    ) : data.length > 0 ? (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">
                                    {formatNumber(totalViews)} views
                                </span>
                                {trend && (
                                    <div className={`flex items-center gap-1 text-xs font-medium ${trend.type === 'up' ? 'text-green-600' :
                                        trend.type === 'down' ? 'text-red-600' : 'text-muted-foreground'
                                        }`}>
                                        {trend.type === 'up' ? <TrendUpIcon size={32} weight="fill" className="h-4 w-4" /> :
                                            trend.type === 'down' ? <TrendDownIcon size={32} weight="fill" className="h-4 w-4" /> :
                                                <MinusIcon size={32} weight="fill" className="h-4 w-4" />}
                                        <span>{trend.type === 'neutral' ? '—' : `${trend.type === 'up' ? '+' : '-'}${trend.value.toFixed(0)}%`}</span>
                                    </div>
                                )}
                            </div>
                            <div className="[--chart-color:theme(colors.primary.DEFAULT)] group-hover:[--chart-color:theme(colors.primary.600)] transition-colors duration-300">
                                <Chart data={data} id={website.id} />
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-xs text-muted-foreground py-4">No data yet</div>
                    )}
                </CardContent>
            </Card>
        </Link>
    );
});

WebsiteCard.displayName = 'WebsiteCard';

export function WebsiteCardSkeleton() {
    return (
        <Card className="h-full">
            <CardHeader>
                <Skeleton className="h-6 w-3/4 rounded-md" />
                <Skeleton className="h-4 w-1/2 mt-1 rounded-md" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-20 w-full rounded-md" />
            </CardContent>
        </Card>
    );
} 