import type { Website } from "@databuddy/shared/types/website";
import { CaretLeftIcon, PlanetIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { FaviconImage } from "@/components/analytics/favicon-image";
import { Skeleton } from "@/components/ui/skeleton";

interface WebsiteHeaderProps {
	website: Website | null | undefined;
	showBackButton?: boolean;
}

export function WebsiteHeader({
	website,
	showBackButton = true,
}: WebsiteHeaderProps) {
	return (
		<div className="box-border bg-sidebar-accent">
			{/* Website info - aligned with logo section */}
			<div className="box-border flex h-12 items-center border-b px-3">
				<div className="flex w-full items-center gap-3">
					<div className="rounded-lg bg-sidebar/80 p-1.5 shadow-sm ring-1 ring-sidebar-border/50">
						<FaviconImage
							altText={`${website?.name || website?.domain || "Website"} favicon`}
							className="size-5 shrink-0"
							domain={website?.domain || ""}
							fallbackIcon={
								<PlanetIcon
									className="text-sidebar-ring"
									size={20}
									weight="duotone"
								/>
							}
							size={20}
						/>
					</div>
					<div className="flex min-w-0 flex-1 flex-col items-start">
						<h2 className="truncate text-left font-semibold text-sidebar-accent-foreground text-sm">
							{website?.name || website?.domain || (
								<Skeleton className="h-4 w-32" />
							)}
						</h2>
						{website?.domain ? (
							<p className="truncate text-left text-sidebar-accent-foreground/70 text-xs">
								{website.domain}
							</p>
						) : (
							<div className="h-3 w-24">
								<Skeleton className="h-3 w-24" />
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Back navigation - aligned with category buttons */}
			{showBackButton && (
				<button
					className="group box-border flex h-10 w-full cursor-pointer items-center justify-start border-b px-3 transition-colors hover:bg-accent"
					type="button"
				>
					<Link className="flex items-center gap-2" href="/websites">
						<CaretLeftIcon
							className="group-hover:-translate-x-0.5 size-3 shrink-0 text-sidebar-accent-foreground/80 transition-transform duration-200 group-hover:text-sidebar-accent-foreground"
							fontWeight="bold"
						/>
						<p className="font-semibold text-sidebar-accent-foreground/80 text-xs transition-colors duration-200 group-hover:text-sidebar-accent-foreground">
							Back to Websites
						</p>
					</Link>
				</button>
			)}
		</div>
	);
}
