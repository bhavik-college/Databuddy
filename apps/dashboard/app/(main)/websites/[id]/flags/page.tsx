"use client";

import { useFlags } from "@databuddy/sdk/react";
import { FlagIcon, InfoIcon } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { useParams } from "next/navigation";
import { Suspense, useCallback, useState } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { FeatureGate } from "@/components/feature-gate";
import { GATED_FEATURES } from "@/components/providers/billing-provider";
import { Badge } from "@/components/ui/badge";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useWebsite } from "@/hooks/use-websites";
import { orpc } from "@/lib/orpc";
import { isAnalyticsRefreshingAtom } from "@/stores/jotai/filterAtoms";
import { WebsitePageHeader } from "../_components/website-page-header";
import { FlagSheet } from "./_components/flag-sheet";
import { FlagsList } from "./_components/flags-list";
import type { Flag } from "./_components/types";

const FlagsListSkeleton = () => (
	<div className="border-border border-t">
		{[...new Array(5)].map((_, i) => (
			<div
				className="flex animate-pulse items-center border-border border-b px-4 py-4 sm:px-6"
				key={`skeleton-${i + 1}`}
			>
				<div className="flex flex-1 items-center gap-4">
					<div className="min-w-0 flex-1 space-y-2">
						<div className="flex items-center gap-2">
							<div className="h-5 w-40 rounded bg-muted" />
							<div className="h-5 w-16 rounded bg-muted" />
							<div className="h-5 w-20 rounded bg-muted" />
						</div>
						<div className="h-4 w-48 rounded bg-muted" />
					</div>
					<div className="h-6 w-10 rounded-full bg-muted" />
					<div className="size-8 rounded bg-muted" />
				</div>
			</div>
		))}
	</div>
);

export default function FlagsPage() {
	const { id } = useParams();
	const websiteId = id as string;
	const [isRefreshing, setIsRefreshing] = useAtom(isAnalyticsRefreshingAtom);
	const [isSheetOpen, setIsSheetOpen] = useState(false);
	const [editingFlag, setEditingFlag] = useState<Flag | null>(null);
	const queryClient = useQueryClient();

	const { data: website } = useWebsite(websiteId);
	const { isEnabled } = useFlags();
	const experimentFlag = isEnabled("experiment-50");

	const {
		data: flags,
		isLoading,
		refetch,
	} = useQuery({
		...orpc.flags.list.queryOptions({ input: { websiteId } }),
	});

	const deleteMutation = useMutation({
		...orpc.flags.delete.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: orpc.flags.list.key({ input: { websiteId } }),
			});
		},
	});

	const handleRefresh = useCallback(async () => {
		setIsRefreshing(true);
		try {
			await refetch();
		} finally {
			setIsRefreshing(false);
		}
	}, [refetch, setIsRefreshing]);

	const handleCreateFlag = () => {
		setEditingFlag(null);
		setIsSheetOpen(true);
	};

	const handleEditFlag = (flag: Flag) => {
		setEditingFlag(flag);
		setIsSheetOpen(true);
	};

	const handleDeleteFlag = async (flagId: string) => {
		await deleteMutation.mutateAsync({ id: flagId });
	};

	const handleSheetClose = () => {
		setIsSheetOpen(false);
		setEditingFlag(null);
	};

	return (
		<FeatureGate feature={GATED_FEATURES.FEATURE_FLAGS}>
			<ErrorBoundary>
				<div className="flex h-full min-h-0 flex-col overflow-hidden">
					<WebsitePageHeader
						createActionLabel="Create Flag"
						description="Control feature rollouts and A/B testing"
						docsUrl="https://www.databuddy.cc/docs/features/feature-flags"
						icon={<FlagIcon className="size-6 text-accent-foreground" />}
						isLoading={isLoading}
						isRefreshing={isRefreshing}
						onCreateAction={handleCreateFlag}
						onRefreshAction={handleRefresh}
						subtitle={
							isLoading
								? undefined
								: `${flags?.length || 0} flag${(flags?.length || 0) !== 1 ? "s" : ""}`
						}
						title="Feature Flags"
						websiteId={websiteId}
						websiteName={website?.name ?? undefined}
					/>

					<div className="min-h-0 flex-1 overflow-y-auto">
						{experimentFlag.isReady && flags && flags.length > 0 && (
							<div className="flex h-10 items-center border-border border-b bg-accent/30 px-4">
								<div className="flex items-center gap-3">
									<div className="flex items-center gap-2">
										<FlagIcon
											className="size-4"
											color={experimentFlag.enabled ? "red" : "blue"}
											weight="fill"
										/>
										{experimentFlag.enabled ? (
											<Badge className="bg-red-500 text-white">Red Team</Badge>
										) : (
											<Badge className="bg-blue-500 text-white">
												Blue Team
											</Badge>
										)}
									</div>
									<Tooltip>
										<TooltipTrigger asChild>
											<button
												className="flex items-center gap-1.5 text-muted-foreground text-sm hover:text-foreground"
												type="button"
											>
												<InfoIcon className="size-4" weight="duotone" />
												<span className="hidden sm:inline">
													A/B Test Experiment
												</span>
											</button>
										</TooltipTrigger>
										<TooltipContent className="max-w-xs">
											<div className="space-y-2">
												<p className="font-medium">A/B Test Experiment</p>
												<p className="text-xs leading-relaxed">
													This is a proof-of-concept feature flag demonstrating
													A/B testing capabilities. Approximately 50% of users
													are randomly assigned to the "Red Team" experience,
													while the other 50% see the "Blue Team" experience.
												</p>
											</div>
										</TooltipContent>
									</Tooltip>
								</div>
							</div>
						)}

						<Suspense fallback={<FlagsListSkeleton />}>
							<FlagsList
								flags={(flags as Flag[]) ?? []}
								isLoading={isLoading}
								onCreateFlagAction={handleCreateFlag}
								onDeleteFlag={handleDeleteFlag}
								onEditFlagAction={handleEditFlag}
							/>
						</Suspense>

						{isSheetOpen && (
							<Suspense fallback={null}>
								<FlagSheet
									flag={editingFlag}
									isOpen={isSheetOpen}
									onCloseAction={handleSheetClose}
									websiteId={websiteId}
								/>
							</Suspense>
						)}
					</div>
				</div>
			</ErrorBoundary>
		</FeatureGate>
	);
}
