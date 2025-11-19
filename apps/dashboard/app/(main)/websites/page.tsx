"use client";

import {
	ArrowClockwiseIcon,
	GlobeIcon,
	PlusIcon,
	TrendUpIcon,
} from "@phosphor-icons/react";
import { useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { WebsiteDialog } from "@/components/website-dialog";
import { useWebsites } from "@/hooks/use-websites";

import { cn } from "@/lib/utils";
import { NoticeBanner } from "./_components/notice-banner";
import { PageHeader } from "./_components/page-header";
import { WebsiteCard } from "./_components/website-card";

function LoadingSkeleton() {
	return (
		<div className="grid select-none gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{[1, 2, 3, 4, 5, 6].map((num) => (
				<Card
					className="animate-pulse overflow-hidden"
					key={`website-skeleton-${num}`}
				>
					<CardHeader className="pb-2">
						<div className="flex items-center justify-between">
							<div className="flex-1 space-y-2">
								<Skeleton className="h-4 w-32 rounded" />
								<div className="flex items-center gap-1">
									<Skeleton className="h-3 w-3 rounded" />
									<Skeleton className="h-3 w-24 rounded" />
								</div>
							</div>
							<Skeleton className="h-4 w-4 rounded" />
						</div>
					</CardHeader>
					<CardContent className="pt-0 pb-3">
						<div className="space-y-2">
							<div className="flex justify-between">
								<Skeleton className="h-3 w-12 rounded" />
								<Skeleton className="h-3 w-8 rounded" />
							</div>
							<Skeleton className="h-12 w-full rounded" />
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
	return (
		<div className="flex select-none flex-col items-center justify-center px-4 py-16 text-center">
			<div className="mb-8 rounded-full border border-destructive/20 bg-destructive/10 p-8">
				<GlobeIcon
					aria-hidden="true"
					className="h-16 w-16 text-destructive"
					size={64}
					weight="duotone"
				/>
			</div>
			<h3 className="mb-4 font-bold text-2xl">Failed to Load Websites</h3>
			<p className="mb-8 max-w-md text-muted-foreground leading-relaxed">
				There was an issue fetching your websites. Please check your connection
				and try again.
			</p>
			<Button
				data-section="error-state"
				data-track="websites-retry-load"
				onClick={onRetry}
				size="lg"
				variant="outline"
			>
				Try Again
			</Button>
		</div>
	);
}

export default function WebsitesPage() {
	const [dialogOpen, setDialogOpen] = useState(false);

	const { websites, chartData, isLoading, isError, isFetching, refetch } =
		useWebsites();

	const handleRetry = () => {
		refetch();
	};

	return (
		<div className="flex h-full flex-col">
			{/* Enhanced header */}
			<PageHeader
				description="Track analytics for all your websites"
				icon={<TrendUpIcon />}
				right={
					<>
						<Button
							aria-label="Refresh websites"
							disabled={isLoading || isFetching}
							onClick={() => refetch()}
							size="icon"
							variant="outline"
						>
							<ArrowClockwiseIcon
								aria-hidden
								className={`h-4 w-4 ${isLoading || isFetching ? "animate-spin" : ""}`}
							/>
						</Button>
						<Button
							className={cn(
								"gap-2 px-3 py-2 font-medium sm:px-4 sm:py-2",
								"bg-linear-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary",
								"group relative overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl"
							)}
							data-button-type="primary"
							data-section="header"
							data-track="websites-new-website-header"
							onClick={() => setDialogOpen(true)}
							size="default"
						>
							<div className="-translate-x-full absolute inset-0 bg-linear-to-r from-white/0 via-white/20 to-white/0 transition-transform duration-700 group-hover:translate-x-full" />
							<PlusIcon className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
							<span className="relative z-10 truncate">New Website</span>
						</Button>
					</>
				}
				title="Websites"
			/>

			{/* Content area */}
			<div
				aria-busy={isFetching}
				className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6"
			>
				{/* Website count indicator */}
				{!isLoading && websites && websites.length > 0 && (
					<NoticeBanner className="mb-6" icon={<GlobeIcon />}>
						Tracking <span className="font-medium">{websites.length} </span>
						website{websites.length !== 1 ? "s" : ""}
					</NoticeBanner>
				)}

				{/* Show loading state */}
				{isLoading && <LoadingSkeleton />}

				{/* Show error state */}
				{isError && <ErrorState onRetry={handleRetry} />}

				{/* Show empty state */}
				{!(isLoading || isError) && websites && websites.length === 0 && (
					<EmptyState
						action={{
							label: "Create Your First Website",
							onClick: () => setDialogOpen(true),
						}}
						description="Start tracking your website analytics by adding your first website. Get insights into visitors, pageviews, and performance."
						icon={
							<GlobeIcon
								className="h-16 w-16 text-primary"
								size={16}
								weight="duotone"
							/>
						}
						title="No websites yet"
					/>
				)}

				{/* Show website grid */}
				{!(isLoading || isError) && websites && websites.length > 0 && (
					<div
						aria-live="polite"
						className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
					>
						{websites.map((website) => (
							<WebsiteCard
								chartData={chartData?.[website.id]}
								isLoadingChart={isLoading || isFetching}
								key={website.id}
								website={website}
							/>
						))}
					</div>
				)}
			</div>

			{/* Website Dialog */}
			<WebsiteDialog onOpenChange={setDialogOpen} open={dialogOpen} />
		</div>
	);
}
