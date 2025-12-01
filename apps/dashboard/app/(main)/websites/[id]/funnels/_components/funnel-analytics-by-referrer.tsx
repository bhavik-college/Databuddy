"use client";

import { FaviconImage } from "@/components/analytics/favicon-image";
import { Skeleton } from "@/components/ui/skeleton";
import type { FunnelAnalyticsByReferrerResult } from "@/hooks/use-funnels";
import { cn } from "@/lib/utils";
import {
	GlobeIcon,
	TargetIcon,
	UsersIcon,
	WarningCircleIcon,
} from "@phosphor-icons/react";
import { useMemo, useState } from "react";

interface FunnelAnalyticsByReferrerProps {
	onReferrerChange?: (referrer: string) => void;
	data: { referrer_analytics: FunnelAnalyticsByReferrerResult[] } | undefined;
	isLoading: boolean;
	error: Error | null;
}

interface SourceCardProps {
	label: string;
	domain?: string;
	users: number;
	conversionRate?: number;
	isSelected: boolean;
	onClick: () => void;
	isAll?: boolean;
}

function SourceCard({
	label,
	domain,
	users,
	conversionRate,
	isSelected,
	onClick,
	isAll,
}: SourceCardProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"group flex shrink-0 flex-col gap-2 rounded border p-3 text-left transition-all",
				"min-w-[140px] max-w-[180px]",
				isSelected
					? "border-chart-2 bg-chart-2/10"
					: "border-border bg-card hover:border-border hover:bg-secondary/50"
			)}
		>
			<div className="flex items-center gap-2">
				{isAll ? (
					<div
						className={cn(
							"flex size-5 items-center justify-center",
							isSelected ? "text-chart-2" : "text-muted-foreground"
						)}
					>
						<GlobeIcon className="size-5" weight="duotone" />
					</div>
				) : (
					<FaviconImage
						domain={domain || ""}
						size={20}
						className="shrink-0"
						fallbackIcon={
							<GlobeIcon
								className={cn(
									"size-5",
									isSelected ? "text-chart-2" : "text-muted-foreground"
								)}
								weight="duotone"
							/>
						}
					/>
				)}
				<span
					className={cn(
						"truncate font-medium text-sm",
						isSelected ? "text-chart-2" : "text-foreground"
					)}
				>
					{label}
				</span>
			</div>

			<div className="flex items-center justify-between gap-2">
				<div className="flex items-center gap-1 text-xs text-muted-foreground">
					<UsersIcon className="size-3" weight="fill" />
					<span className="tabular-nums">{users.toLocaleString()}</span>
				</div>
				{conversionRate !== undefined && (
					<div
						className={cn(
							"flex items-center gap-1 text-xs",
							isSelected ? "text-chart-2" : "text-success"
						)}
					>
						<TargetIcon className="size-3" weight="fill" />
						<span className="tabular-nums">{conversionRate.toFixed(0)}%</span>
					</div>
				)}
			</div>
		</button>
	);
}

function SourcesSkeleton() {
	return (
		<div className="flex gap-2 overflow-hidden">
			{[1, 2, 3, 4].map((i) => (
				<div
					key={i}
					className="flex min-w-[140px] shrink-0 flex-col gap-2 rounded border border-border bg-card p-3"
				>
					<div className="flex items-center gap-2">
						<Skeleton className="size-5 rounded" />
						<Skeleton className="h-4 w-16" />
					</div>
					<div className="flex items-center justify-between">
						<Skeleton className="h-3 w-12" />
						<Skeleton className="h-3 w-8" />
					</div>
				</div>
			))}
		</div>
	);
}

export function FunnelAnalyticsByReferrer({
	onReferrerChange,
	data,
	isLoading,
	error,
}: FunnelAnalyticsByReferrerProps) {
	const [selectedReferrer, setSelectedReferrer] = useState("all");

	const handleChange = (referrer: string) => {
		setSelectedReferrer(referrer);
		onReferrerChange?.(referrer);
	};

	const { referrers, totalUsers, avgConversionRate } = useMemo(() => {
		if (!data?.referrer_analytics) {
			return { referrers: [], totalUsers: 0, avgConversionRate: 0 };
		}

		const grouped = new Map<
			string,
			{
				label: string;
				parsed: FunnelAnalyticsByReferrerResult["referrer_parsed"];
				users: number;
				completedUsers: number;
			}
		>();

		let total = 0;
		let totalCompleted = 0;

		for (const r of data.referrer_analytics) {
			const domain = r.referrer_parsed?.domain?.toLowerCase() || "direct";
			const label = r.referrer_parsed?.name || domain || "Direct";

			if (!grouped.has(domain)) {
				grouped.set(domain, {
					label,
					parsed: r.referrer_parsed,
					users: 0,
					completedUsers: 0,
				});
			}

			const group = grouped.get(domain);
			if (group) {
				group.users += r.total_users;
				group.completedUsers += r.completed_users;
			}

			total += r.total_users;
			totalCompleted += r.completed_users;
		}

		const referrersList = Array.from(
			grouped,
			([value, { label, parsed, users, completedUsers }]) => ({
				value,
				label,
				parsed,
				users,
				conversionRate: users > 0 ? (completedUsers / users) * 100 : 0,
			})
		).sort((a, b) => b.users - a.users);

		return {
			referrers: referrersList,
			totalUsers: total,
			avgConversionRate: total > 0 ? (totalCompleted / total) * 100 : 0,
		};
	}, [data]);

	if (isLoading) {
		return <SourcesSkeleton />;
	}

	if (error) {
		return (
			<div className="flex items-center gap-2 rounded border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm">
				<WarningCircleIcon className="size-4 text-destructive" weight="fill" />
				<span className="text-destructive">Failed to load traffic sources</span>
			</div>
		);
	}

	if (!data?.referrer_analytics?.length) {
		return null;
	}

	return (
		<div className="-mx-4 px-4">
			<div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
				<SourceCard
					label="All Sources"
					users={totalUsers}
					conversionRate={avgConversionRate}
					isSelected={selectedReferrer === "all"}
					onClick={() => handleChange("all")}
					isAll
				/>
				{referrers.map((source) => (
					<SourceCard
						key={source.value}
						label={source.label}
						domain={source.parsed?.domain}
						users={source.users}
						conversionRate={source.conversionRate}
						isSelected={selectedReferrer === source.value}
						onClick={() => handleChange(source.value)}
					/>
				))}
			</div>
		</div>
	);
}
