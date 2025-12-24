"use client";

import { useFeature } from "@databuddy/sdk/react";
import { FlagIcon, InfoIcon, UsersThreeIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useWebsite } from "@/hooks/use-websites";
import { orpc } from "@/lib/orpc";
import { cn } from "@/lib/utils";
import { isAnalyticsRefreshingAtom } from "@/stores/jotai/filterAtoms";
import {
	isFlagSheetOpenAtom,
	isGroupSheetOpenAtom,
} from "@/stores/jotai/flagsAtoms";
import { WebsitePageHeader } from "../_components/website-page-header";

export default function FlagsLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const { id } = useParams();
	const websiteId = id as string;
	const pathname = usePathname();
	const [isRefreshing, setIsRefreshing] = useAtom(isAnalyticsRefreshingAtom);
	const [, setIsFlagSheetOpen] = useAtom(isFlagSheetOpenAtom);
	const [, setIsGroupSheetOpen] = useAtom(isGroupSheetOpenAtom);

	const { data: website } = useWebsite(websiteId);

	const {
		data: flags,
		isLoading: flagsLoading,
		refetch: refetchFlags,
	} = useQuery({
		...orpc.flags.list.queryOptions({ input: { websiteId } }),
	});

	const {
		data: groups,
		isLoading: groupsLoading,
		refetch: refetchGroups,
	} = useQuery({
		...orpc.targetGroups.list.queryOptions({ input: { websiteId } }),
	});

	const isGroupsPage = pathname?.includes("/groups");
	const isLoading = isGroupsPage ? groupsLoading : flagsLoading;

	const { on: isExperimentOn, loading: experimentLoading } =
		useFeature("experiment-50");

	const handleRefresh = useCallback(async () => {
		setIsRefreshing(true);
		try {
			if (isGroupsPage) {
				await refetchGroups();
			} else {
				await refetchFlags();
			}
		} finally {
			setIsRefreshing(false);
		}
	}, [isGroupsPage, refetchFlags, refetchGroups, setIsRefreshing]);

	return (
		<div className="flex h-full min-h-0 flex-col">
			<WebsitePageHeader
				createActionLabel={isGroupsPage ? "Create Group" : "Create Flag"}
				description={
					isGroupsPage
						? "Reusable targeting rules for your flags"
						: "Control feature rollouts and A/B testing"
				}
				docsUrl="https://www.databuddy.cc/docs/features/feature-flags"
				icon={
					isGroupsPage ? (
						<UsersThreeIcon className="size-6 text-accent-foreground" />
					) : (
						<FlagIcon className="size-6 text-accent-foreground" />
					)
				}
				isLoading={isLoading}
				isRefreshing={isRefreshing}
				onCreateAction={() => {
					if (isGroupsPage) {
						setIsGroupSheetOpen(true);
					} else {
						setIsFlagSheetOpen(true);
					}
				}}
				onRefreshAction={handleRefresh}
				subtitle={
					isLoading
						? undefined
						: isGroupsPage
							? `${groups?.length ?? 0} group${(groups?.length ?? 0) !== 1 ? "s" : ""}`
							: `${flags?.length || 0} flag${(flags?.length || 0) !== 1 ? "s" : ""}`
				}
				title={isGroupsPage ? "Target Groups" : "Feature Flags"}
				websiteId={websiteId}
				websiteName={website?.name ?? undefined}
			/>

			{/* Navigation Tabs */}
			<div className="box-border flex h-10 shrink-0 border-border border-b bg-accent/30">
				<Link
					className={cn(
						"flex items-center gap-2 border-b-2 px-3 py-2.5 font-medium text-sm transition-all",
						pathname === `/websites/${websiteId}/flags`
							? "border-primary text-foreground"
							: "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
					)}
					href={`/websites/${websiteId}/flags`}
				>
					<FlagIcon
						className={cn(
							"size-4",
							pathname === `/websites/${websiteId}/flags` && "text-primary"
						)}
						weight={
							pathname === `/websites/${websiteId}/flags` ? "fill" : "duotone"
						}
					/>
					Flags
					{flags && flags.length > 0 && (
						<span
							className={cn(
								"flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 font-semibold text-xs tabular-nums",
								pathname === `/websites/${websiteId}/flags`
									? "bg-primary text-primary-foreground"
									: "bg-muted text-foreground"
							)}
						>
							{flags.length}
						</span>
					)}
				</Link>
				<Link
					className={cn(
						"flex items-center gap-2 border-b-2 px-3 py-2.5 font-medium text-sm transition-all",
						pathname === `/websites/${websiteId}/flags/groups`
							? "border-primary text-foreground"
							: "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
					)}
					href={`/websites/${websiteId}/flags/groups`}
				>
					<UsersThreeIcon
						className={cn(
							"size-4",
							pathname === `/websites/${websiteId}/flags/groups` &&
								"text-primary"
						)}
						weight={
							pathname === `/websites/${websiteId}/flags/groups`
								? "fill"
								: "duotone"
						}
					/>
					Groups
					{groups && groups.length > 0 && (
						<span
							className={cn(
								"flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 font-semibold text-xs tabular-nums",
								pathname === `/websites/${websiteId}/flags/groups`
									? "bg-primary text-primary-foreground"
									: "bg-muted text-foreground"
							)}
						>
							{groups.length}
						</span>
					)}
				</Link>
			</div>

			{/* Experiment Flag Banner */}
			{!experimentLoading && flags && (
				<div className="flex h-10 items-center border-border border-b bg-accent px-4">
					<div className="flex items-center gap-3">
						<div className="flex items-center gap-2">
							{isExperimentOn ? (
								<FlagIcon className="size-4 text-destructive" weight="fill" />
							) : (
								<FlagIcon className="size-4 text-blue-600" weight="fill" />
							)}
							{isExperimentOn ? (
								<Badge variant="destructive">Red Team</Badge>
							) : (
								<Badge variant="blue">Blue Team</Badge>
							)}
						</div>
						<Tooltip delayDuration={500}>
							<TooltipTrigger asChild>
								<button
									className="flex items-center gap-1.5 text-foreground text-sm hover:text-foreground/80"
									type="button"
								>
									<InfoIcon className="size-4" weight="duotone" />
									<span className="hidden sm:inline">A/B Test Experiment</span>
								</button>
							</TooltipTrigger>
							<TooltipContent className="max-w-xs">
								<div className="space-y-2">
									<p className="font-medium">A/B Test Experiment</p>
									<p className="text-xs leading-relaxed">
										This is a proof-of-concept feature flag demonstrating A/B
										testing capabilities. Approximately 50% of users are
										randomly assigned to the "Red Team" experience, while the
										other 50% see the "Blue Team" experience.
									</p>
								</div>
							</TooltipContent>
						</Tooltip>
					</div>
				</div>
			)}

			{/* Page Content */}
			<div className="min-h-0 flex-1 overflow-hidden">{children}</div>
		</div>
	);
}
