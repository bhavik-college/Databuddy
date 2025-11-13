"use client";

import {
	ChartLineIcon,
	RepeatIcon,
	TableIcon,
	UsersIcon,
} from "@phosphor-icons/react";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDateFilters } from "@/hooks/use-date-filters";
import { useDynamicQuery } from "@/hooks/use-dynamic-query";
import { RetentionCohortsGrid } from "./retention-cohorts-grid";
import { RetentionRateChart } from "./retention-rate-chart";

type RetentionContentProps = {
	websiteId: string;
};

type RetentionCohort = {
	cohort: string;
	users: number;
	week_0_retention: number;
	week_1_retention: number;
	week_2_retention: number;
	week_3_retention: number;
	week_4_retention: number;
	week_5_retention: number;
};

type RetentionRate = {
	date: string;
	new_users: number;
	returning_users: number;
	retention_rate: number;
};

type StatCardConfig = {
	id: string;
	title: string;
	value: string;
	subtitle?: string;
	icon: typeof RepeatIcon;
};

export function RetentionContent({ websiteId }: RetentionContentProps) {
	const { dateRange } = useDateFilters();
	const [activeTab, setActiveTab] = useState("cohorts");

	const { data, isLoading } = useDynamicQuery(
		websiteId,
		dateRange,
		{
			id: "retention-metrics",
			parameters: ["retention_cohorts", "retention_rate"],
		},
		{
			staleTime: 5 * 60 * 1000,
			gcTime: 10 * 60 * 1000,
		}
	);

	const cohortsData = data;
	const rateData = data;
	const cohortsLoading = isLoading;
	const rateLoading = isLoading;

	const cohorts = useMemo(
		() => (cohortsData?.retention_cohorts as RetentionCohort[]) ?? [],
		[cohortsData]
	);

	const rates = useMemo(() => {
		const rawRates = (rateData?.retention_rate as RetentionRate[]) ?? [];
		const hasDateRange = dateRange?.start_date && dateRange?.end_date;
		if (!hasDateRange) {
			return rawRates;
		}

		const start = dayjs(dateRange.start_date).startOf("day");
		const end = dayjs(dateRange.end_date).startOf("day");

		return rawRates.filter((rate) => {
			const date = dayjs(rate.date).startOf("day");
			return date.isValid() && !date.isBefore(start) && !date.isAfter(end);
		});
	}, [rateData, dateRange]);

	const overallStats = useMemo(() => {
		const totalNewUsers = rates.reduce((sum, rate) => sum + rate.new_users, 0);
		const totalReturningUsers = rates.reduce(
			(sum, rate) => sum + rate.returning_users,
			0
		);
		const totalUniqueUsers = totalNewUsers + totalReturningUsers;

		const overallRetentionRate =
			totalUniqueUsers > 0 ? (totalReturningUsers / totalUniqueUsers) * 100 : 0;

		const weightedWeek1 = cohorts.reduce(
			(sum, cohort) => sum + cohort.week_1_retention * cohort.users,
			0
		);
		const totalCohortUsers = cohorts.reduce(
			(sum, cohort) => sum + cohort.users,
			0
		);
		const avgWeek1Retention =
			totalCohortUsers > 0 ? weightedWeek1 / totalCohortUsers : 0;

		return {
			avgRetentionRate: overallRetentionRate.toFixed(1),
			totalUsers: totalUniqueUsers,
			totalNewUsers,
			totalReturningUsers,
			avgWeek1Retention: avgWeek1Retention.toFixed(1),
		};
	}, [rates, cohorts]);

	const statCards: StatCardConfig[] = useMemo(
		() => [
			{
				id: "overall-rate",
				title: "Overall Retention Rate",
				value: `${overallStats.avgRetentionRate}%`,
				subtitle: "Average across selected range",
				icon: RepeatIcon,
			},
			{
				id: "total-users",
				title: "Total Users",
				value: overallStats.totalUsers.toLocaleString(),
				subtitle: `${overallStats.totalNewUsers.toLocaleString()} new · ${overallStats.totalReturningUsers.toLocaleString()} returning`,
				icon: UsersIcon,
			},
			{
				id: "week1",
				title: "Week 1 Retention",
				value: `${overallStats.avgWeek1Retention}%`,
				subtitle: "Weighted by cohort size",
				icon: ChartLineIcon,
			},
			{
				id: "returning",
				title: "Returning Users",
				value: overallStats.totalReturningUsers.toLocaleString(),
				subtitle: "Users who came back",
				icon: UsersIcon,
			},
		],
		[overallStats]
	);

	const renderStatCard = (card: StatCardConfig) => {
		const Icon = card.icon;
		return (
			<Card
				className="min-w-[200px] snap-center md:min-w-0 md:snap-none"
				key={card.id}
			>
				<CardContent className="p-3 sm:p-4">
					<div className="flex items-center gap-2 sm:gap-3">
						<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 sm:h-10 sm:w-10">
							<Icon
								className="h-4 w-4 text-primary sm:h-5 sm:w-5"
								weight="duotone"
							/>
						</div>
						<div className="min-w-0 flex-1">
							<p className="font-medium text-[11px] text-muted-foreground uppercase tracking-wide sm:text-xs">
								{card.title}
							</p>
							<p className="font-bold text-foreground text-lg sm:text-xl">
								{card.value}
							</p>
							{card.subtitle ? (
								<p className="text-[11px] text-muted-foreground sm:text-xs">
									{card.subtitle}
								</p>
							) : null}
						</div>
					</div>
				</CardContent>
			</Card>
		);
	};

	return (
		<div className="flex h-full min-h-0 flex-col gap-4">
			<div className="shrink-0 space-y-3">
				<div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 md:hidden">
					{isLoading
						? [...new Array(4)].map((_, i) => (
								<Card
									className="min-w-[200px] snap-center"
									key={`skeleton-mobile-${i}`}
								>
									<CardContent className="p-4">
										<div className="flex items-center gap-3">
											<Skeleton className="h-10 w-10 rounded-lg" />
											<div className="space-y-2">
												<Skeleton className="h-3 w-24 rounded" />
												<Skeleton className="h-6 w-16 rounded" />
											</div>
										</div>
									</CardContent>
								</Card>
							))
						: statCards.map((card) => renderStatCard(card))}
				</div>
				<div className="hidden grid-cols-1 gap-3 sm:grid-cols-2 md:grid lg:grid-cols-4">
					{isLoading
						? [...new Array(4)].map((_, i) => (
								<Card key={`skeleton-desktop-${i}`}>
									<CardContent className="p-4">
										<div className="flex items-center gap-3">
											<Skeleton className="h-10 w-10 rounded-lg" />
											<div className="flex-1 space-y-2">
												<Skeleton className="h-3 w-24 rounded" />
												<Skeleton className="h-6 w-16 rounded" />
											</div>
										</div>
									</CardContent>
								</Card>
							))
						: statCards.map((card) => renderStatCard(card))}
				</div>
			</div>
			<Tabs
				className="flex min-h-0 flex-1 flex-col"
				defaultValue="cohorts"
				onValueChange={setActiveTab}
				value={activeTab}
			>
				<div className="shrink-0 border-border border-b">
					<TabsList className="h-11 w-full justify-start overflow-x-auto bg-transparent p-0">
						<TabsTrigger
							className="relative h-11 whitespace-nowrap rounded-none border-transparent border-b-2 px-4 font-medium text-muted-foreground text-sm transition-colors hover:bg-muted/50 hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
							value="cohorts"
						>
							<TableIcon className="mr-2 h-4 w-4" weight="duotone" />
							Retention Cohorts
						</TabsTrigger>
						<TabsTrigger
							className="relative h-11 whitespace-nowrap rounded-none border-transparent border-b-2 px-4 font-medium text-muted-foreground text-sm transition-colors hover:bg-muted/50 hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
							value="rate"
						>
							<ChartLineIcon className="mr-2 h-4 w-4" weight="duotone" />
							Retention Rate
						</TabsTrigger>
					</TabsList>
				</div>

				<TabsContent
					className="mt-4 min-h-0 flex-1 overflow-hidden data-[state=inactive]:hidden"
					value="cohorts"
				>
					<div className="flex h-full flex-col gap-4">
						<div className="shrink-0">
							<h3 className="font-semibold text-foreground text-lg">
								Retention by Cohort
							</h3>
							<p className="text-muted-foreground text-sm">
								Track what percentage of users from each cohort return over 5
								weeks
							</p>
						</div>
						<div className="min-h-0 flex-1 overflow-auto">
							<RetentionCohortsGrid
								cohorts={cohorts}
								isLoading={cohortsLoading}
							/>
						</div>
					</div>
				</TabsContent>

				<TabsContent
					className="mt-4 min-h-0 flex-1 overflow-hidden data-[state=inactive]:hidden"
					value="rate"
				>
					<Card className="flex h-full flex-col">
						<CardHeader className="shrink-0 px-3 py-2 sm:px-6 sm:py-4">
							<CardTitle className="font-semibold text-base text-foreground sm:text-lg">
								Daily Retention Rate
							</CardTitle>
							<p className="text-[11px] text-muted-foreground sm:text-sm">
								View the percentage of returning users vs new users over time
							</p>
						</CardHeader>
						<CardContent className="min-h-0 flex-1 px-2 pb-3 sm:px-6 sm:pb-6">
							<div className="h-[320px] sm:h-full">
								<RetentionRateChart data={rates} isLoading={rateLoading} />
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
