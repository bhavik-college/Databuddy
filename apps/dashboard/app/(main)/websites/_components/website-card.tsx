import type {
	ProcessedMiniChartData,
	Website,
} from "@databuddy/shared/types/website";
import {
	EyeIcon,
	MinusIcon,
	TrendDownIcon,
	TrendUpIcon,
} from "@phosphor-icons/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { memo, Suspense } from "react";
import { FaviconImage } from "@/components/analytics/favicon-image";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type WebsiteCardProps = {
	website: Website;
	chartData?: ProcessedMiniChartData;
	isLoadingChart?: boolean;
};

function TrendStat({
	trend,
	className = "flex items-center gap-1 font-medium text-xs",
}: {
	trend: ProcessedMiniChartData["trend"] | undefined;
	className?: string;
}) {
	if (!trend) {
		return null;
	}
	if (trend.type === "up") {
		return (
			<div className={className}>
				<TrendUpIcon
					aria-hidden="true"
					className="!text-success h-4 w-4"
					style={{ color: "var(--tw-success, #22c55e)" }}
					weight="duotone"
				/>
				<span
					className="!text-success"
					style={{ color: "var(--tw-success, #22c55e)" }}
				>
					+{trend.value.toFixed(0)}%
				</span>
			</div>
		);
	}
	if (trend.type === "down") {
		return (
			<div className={className}>
				<TrendDownIcon
					aria-hidden
					className="!text-destructive h-4 w-4"
					style={{ color: "var(--tw-destructive, #ef4444)" }}
					weight="duotone"
				/>
				<span
					className="!text-destructive"
					style={{ color: "var(--tw-destructive, #ef4444)" }}
				>
					-{trend.value.toFixed(0)}%
				</span>
			</div>
		);
	}
	return (
		<div className={className}>
			<MinusIcon
				aria-hidden
				className="h-4 w-4 text-muted-foreground"
				weight="fill"
			/>
			<span className="text-muted-foreground">0%</span>
		</div>
	);
}

const formatNumber = (num: number) => {
	if (num >= 1_000_000) {
		return `${(num / 1_000_000).toFixed(1)}M`;
	}
	if (num >= 1000) {
		return `${(num / 1000).toFixed(1)}K`;
	}
	return num.toString();
};

// Lazy load the chart component to improve initial page load
const MiniChart = dynamic(
	() => import("./mini-chart").then((mod) => mod.default),
	{
		loading: () => <Skeleton className="h-12 w-full rounded" />,
		ssr: false,
	}
);

export const WebsiteCard = memo(
	({ website, chartData, isLoadingChart }: WebsiteCardProps) => (
		<Link
			aria-label={`Open ${website.name} analytics`}
			className="group block rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
			data-section="website-grid"
			data-track="website-card-click"
			data-website-id={website.id}
			data-website-name={website.name}
			href={`/websites/${website.id}`}
		>
			<Card className="flex h-full select-none flex-col gap-0 overflow-hidden bg-background p-0 transition-all duration-300 ease-in-out group-hover:border-primary/60 group-hover:shadow-primary/5 group-hover:shadow-xl motion-reduce:transform-none motion-reduce:transition-none">
				<CardHeader className="dotted-bg gap-0! border-b bg-accent-brighter/80 px-0 pt-4 pb-0!">
					{isLoadingChart ? (
						<div className="px-3">
							<Skeleton className="mx-auto h-12 w-full rounded sm:h-16" />
						</div>
					) : chartData ? (
						chartData.data.length > 0 ? (
							<div className="h-16 space-y-2">
								<div className="h-full transition-colors duration-300 [--chart-color:theme(colors.primary.DEFAULT)] motion-reduce:transition-none group-hover:[--chart-color:theme(colors.primary.600)]">
									<Suspense
										fallback={
											<Skeleton className="h-12 w-full rounded sm:h-16" />
										}
									>
										<MiniChart
											data={chartData.data}
											days={chartData.data.length}
											id={website.id}
										/>
									</Suspense>
								</div>
							</div>
						) : (
							<div className="py-4 text-center text-muted-foreground text-xs">
								No data yet
							</div>
						)
					) : (
						<div className="py-4 text-center text-muted-foreground text-xs">
							Failed to load
						</div>
					)}
				</CardHeader>
				<CardContent className="gap-0 p-4">
					<div className="flex flex-wrap items-center gap-5">
						<div className="flex min-w-0 flex-1 items-center justify-between">
							<div>
								<CardTitle className="truncate font-medium text-base leading-tight sm:text-base">
									{website.name}
								</CardTitle>
								<CardDescription className="flex items-center gap-1 pt-0.5">
									<FaviconImage
										altText={`${website.name} favicon`}
										className="shrink-0"
										domain={website.domain}
										size={12}
									/>
									<span className="truncate text-muted text-xs">
										{website.domain}
									</span>
								</CardDescription>
							</div>
						</div>
						{chartData && (
							<div className="flex w-full items-center justify-between">
								<span className="flex items-center gap-1 font-medium text-muted text-xs">
									<EyeIcon
										className="size-3 shrink-0 text-muted"
										weight="duotone"
									/>
									{formatNumber(chartData.totalViews)} views
								</span>
								<TrendStat trend={chartData.trend} />
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		</Link>
	)
);

WebsiteCard.displayName = "WebsiteCard";

export function WebsiteCardSkeleton() {
	return (
		<Card className="h-full">
			<CardHeader>
				<Skeleton className="h-6 w-3/4 rounded" />
				<Skeleton className="mt-1 h-4 w-1/2 rounded" />
			</CardHeader>
			<CardContent>
				<Skeleton className="h-20 w-full rounded sm:h-24" />
			</CardContent>
		</Card>
	);
}
