'use client';

import {
	ArrowRightIcon,
	ChartLineIcon,
	GlobeIcon,
	PlusIcon,
	SparkleIcon,
} from '@phosphor-icons/react';
import Link from 'next/link';
import { FaviconImage } from '@/components/analytics/favicon-image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Organization } from '@/hooks/use-organizations';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';

interface WebsiteSettingsProps {
	organization: Organization;
}

function WebsiteLoadingSkeleton() {
	return (
		<div className="grid select-none gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{[1, 2, 3].map((num) => (
				<Card
					className="animate-pulse overflow-hidden"
					key={`website-skeleton-${num}`}
				>
					<CardHeader className="pb-3">
						<div className="flex items-center gap-3">
							<Skeleton className="h-6 w-6 rounded" />
							<div className="min-w-0 flex-1 space-y-1">
								<Skeleton className="h-4 w-24 rounded" />
								<Skeleton className="h-3 w-32 rounded" />
							</div>
						</div>
					</CardHeader>
					<CardContent className="pt-0 pb-4">
						<div className="flex items-center justify-between">
							<Skeleton className="h-5 w-12 rounded-full" />
							<Skeleton className="h-4 w-4 rounded" />
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}

function EnhancedEmptyState() {
	return (
		<Card className="border-dashed">
			<CardContent className="flex select-none flex-col items-center justify-center px-6 py-16 text-center">
				<div className="relative mb-8">
					<div className="rounded-full border bg-muted/50 p-8">
						<GlobeIcon
							aria-hidden="true"
							className="h-16 w-16 text-muted-foreground"
							size={64}
							weight="duotone"
						/>
					</div>
					<div className="-top-2 -right-2 absolute rounded-full border border-primary/20 bg-primary/10 p-2">
						<ChartLineIcon
							aria-hidden="true"
							className="h-6 w-6 text-primary"
							size={24}
							weight="fill"
						/>
					</div>
				</div>

				<h3 className="mb-4 font-bold text-xl">No Websites Yet</h3>
				<p className="mb-8 max-w-md text-muted-foreground text-sm leading-relaxed">
					This organization doesn't have any websites yet. Add your first
					website to start tracking analytics and performance metrics.
				</p>

				<Button
					asChild
					className={cn(
						'gap-2 px-6 py-3 font-medium',
						'bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary',
						'group relative overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl'
					)}
					size="lg"
				>
					<Link href="/websites">
						<div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-white/0 via-white/20 to-white/0 transition-transform duration-700 group-hover:translate-x-[100%]" />
						<PlusIcon className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
						<span className="relative z-10">Add Website</span>
					</Link>
				</Button>

				<div className="mt-8 max-w-md rounded-xl border bg-muted/50 p-6">
					<div className="flex items-start gap-3">
						<div className="rounded-lg bg-primary/10 p-2">
							<SparkleIcon
								aria-hidden="true"
								className="h-4 w-4 text-primary"
								size={16}
								weight="fill"
							/>
						</div>
						<div className="text-left">
							<p className="mb-2 font-semibold text-sm">💡 Quick tip</p>
							<p className="text-muted-foreground text-xs leading-relaxed">
								Once you add a website, all organization members will be able to
								view its analytics and insights.
							</p>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

export function WebsiteSettings({ organization }: WebsiteSettingsProps) {
	const { data: websites, isLoading: isLoadingWebsites } =
		trpc.websites.list.useQuery({
			organizationId: organization.id,
		});

	return (
		<div className="space-y-6">
			{/* Website count indicator */}
			{!isLoadingWebsites && websites && websites.length > 0 && (
				<div className="flex items-center gap-2 rounded-lg border border-muted bg-muted/30 px-3 py-2 text-muted-foreground text-sm">
					<GlobeIcon
						aria-hidden="true"
						className="h-4 w-4 flex-shrink-0"
						size={16}
						weight="duotone"
					/>
					<span>
						Managing{' '}
						<span className="font-medium text-foreground">
							{websites.length}
						</span>{' '}
						website{websites.length !== 1 ? 's' : ''}
					</span>
				</div>
			)}

			{/* Loading state */}
			{isLoadingWebsites && <WebsiteLoadingSkeleton />}

			{/* Empty state */}
			{!isLoadingWebsites && websites && websites.length === 0 && (
				<EnhancedEmptyState />
			)}

			{/* Website grid */}
			{!isLoadingWebsites && websites && websites.length > 0 && (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{websites.map((website) => (
						<Link
							aria-label={`View ${website.name} settings`}
							className="group block rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
							href={`/websites/${website.id}`}
							key={website.id}
						>
							<Card className="h-full overflow-hidden transition-all duration-300 ease-in-out group-hover:border-primary/50 group-hover:shadow-lg group-hover:shadow-primary/5">
								<CardHeader className="pb-3">
									<div className="flex items-center justify-between gap-2">
										<div className="flex min-w-0 flex-1 items-center gap-3">
											<FaviconImage
												altText={`${website.name} favicon`}
												className="flex-shrink-0 rounded"
												domain={website.domain}
												fallbackIcon={
													<div className="rounded bg-primary/10 p-1">
														<GlobeIcon
															className="h-4 w-4 text-primary"
															size={16}
															weight="duotone"
														/>
													</div>
												}
												size={24}
											/>
											<div className="min-w-0 flex-1">
												<h4 className="truncate font-semibold text-foreground text-sm transition-colors group-hover:text-primary">
													{website.name}
												</h4>
												<p className="truncate text-muted-foreground text-xs">
													{website.domain}
												</p>
											</div>
										</div>
										<ArrowRightIcon
											aria-hidden="true"
											className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-all duration-200 group-hover:translate-x-1 group-hover:text-primary"
											weight="fill"
										/>
									</div>
								</CardHeader>
								<CardContent className="pt-0 pb-4">
									<div className="flex items-center justify-between">
										<Badge
											className="border-primary/20 bg-primary/10 text-primary"
											variant="secondary"
										>
											Active
										</Badge>
									</div>
								</CardContent>
							</Card>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
