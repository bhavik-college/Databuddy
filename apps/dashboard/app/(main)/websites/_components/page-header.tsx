"use client";

import type { IconProps } from "@phosphor-icons/react";
import { cloneElement, memo } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
	title: string;
	description: string;
	icon: React.ReactElement<IconProps>;
	badgeContent?: string;
	badgeVariant?: "default" | "secondary" | "destructive" | "outline";
	badgeClassName?: string;
	right?: React.ReactNode;
	count?: number;
};

export const PageHeader = memo(
	({
		title,
		description,
		icon,
		badgeContent,
		badgeVariant = "secondary",
		badgeClassName,
		right,
		count,
	}: PageHeaderProps) => (
		<div className="box-content flex h-22 min-h-fit flex-col justify-between gap-0 border-box border-b sm:flex-row sm:items-center lg:gap-3">
			<div className="flex h-full items-center gap-3 p-3 sm:p-4">
				<div className="rounded-lg border border-accent-foreground/10 bg-sidebar-accent p-2.5">
					{cloneElement(icon, {
						...icon.props,
						className: cn(
							"size-5 text-accent-foreground",
							icon.props.className
						),
						"aria-hidden": "true",
						size: 24,
						weight: "fill",
					})}
				</div>
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2">
						<h1 className="truncate font-medium text-foreground text-xl tracking-tight sm:text-2xl">
							{title}
						</h1>
						{typeof count === "number" && (
							<div className="flex items-center gap-2 text-accent-foreground/60 text-sm">
								{count}
							</div>
						)}
						{badgeContent && (
							<Badge
								className={cn("h-5 px-2", badgeClassName)}
								variant={badgeVariant}
							>
								{badgeContent}
							</Badge>
						)}
					</div>
					<p className="text-muted-foreground text-xs sm:text-sm">
						{description}
					</p>
				</div>
			</div>
			{right && <div className="flex items-center gap-2 p-3">{right}</div>}
		</div>
	)
);

PageHeader.displayName = "PageHeader";
