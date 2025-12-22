"use client";

import {
	DotsThreeIcon,
	PencilSimpleIcon,
	TrashIcon,
} from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { orpc } from "@/lib/orpc";
import { cn } from "@/lib/utils";
import type { Flag } from "./types";

type FlagItemProps = {
	flag: Flag;
	onEdit: (flag: Flag) => void;
	onDelete: (flagId: string) => void;
	className?: string;
};

function StatusBadge({ status }: { status: Flag["status"] }) {
	if (status === "active") {
		return (
			<Badge className="gap-1.5" variant="green">
				<span className="size-1.5 rounded bg-green-500" />
				Active
			</Badge>
		);
	}
	if (status === "inactive") {
		return (
			<Badge className="gap-1.5" variant="secondary">
				<span className="size-1.5 rounded bg-zinc-400" />
				Inactive
			</Badge>
		);
	}
	if (status === "archived") {
		return (
			<Badge className="gap-1.5" variant="amber">
				<span className="size-1.5 rounded bg-amber-500" />
				Archived
			</Badge>
		);
	}
	return <Badge variant="secondary">{status}</Badge>;
}

export function FlagItem({ flag, onEdit, onDelete, className }: FlagItemProps) {
	const rollout = flag.rolloutPercentage ?? 0;
	const ruleCount = flag.rules?.length ?? 0;
	const variantCount = flag.variants?.length ?? 0;
	const queryClient = useQueryClient();

	const updateStatusMutation = useMutation({
		...orpc.flags.update.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: orpc.flags.list.key({
					input: { websiteId: flag.websiteId ?? "" },
				}),
			});
		},
	});

	const handleSwitchChange = (checked: boolean) => {
		updateStatusMutation.mutate({
			id: flag.id,
			status: checked ? "active" : "inactive",
		});
	};

	return (
		<div className={cn("border-border border-b", className)}>
			<div className="group flex items-center hover:bg-accent/50">
				{/* Clickable area for editing */}
				<button
					className="flex flex-1 cursor-pointer items-center gap-4 px-4 py-3 text-left sm:px-6 sm:py-4"
					onClick={() => onEdit(flag)}
					type="button"
				>
					{/* Flag details */}
					<div className="min-w-0 flex-1">
						<div className="flex items-center gap-2">
							<h3 className="truncate font-medium text-foreground">
								{flag.name || flag.key}
							</h3>
							<Badge className="shrink-0" variant="gray">
								{flag.type}
							</Badge>
							<StatusBadge status={flag.status} />
						</div>
						<p className="mt-0.5 truncate font-mono text-muted-foreground text-sm">
							{flag.key}
						</p>
						{flag.description && (
							<p className="mt-0.5 line-clamp-1 text-muted-foreground text-xs">
								{flag.description}
							</p>
						)}
					</div>

					{/* Stats - Desktop */}
					<div className="hidden items-center gap-6 lg:flex">
						{rollout > 0 && (
							<div className="w-20 text-right">
								<div className="font-semibold tabular-nums">{rollout}%</div>
								<div className="text-muted-foreground text-xs">rollout</div>
							</div>
						)}

						{ruleCount > 0 && (
							<div className="w-16 text-right">
								<div className="font-semibold tabular-nums">{ruleCount}</div>
								<div className="text-muted-foreground text-xs">
									rule{ruleCount !== 1 ? "s" : ""}
								</div>
							</div>
						)}

						{variantCount > 0 && (
							<div className="w-20 text-right">
								<div className="font-semibold tabular-nums">{variantCount}</div>
								<div className="text-muted-foreground text-xs">
									variant{variantCount !== 1 ? "s" : ""}
								</div>
							</div>
						)}
					</div>

					{/* Stats - Mobile */}
					<div className="flex items-center gap-2 lg:hidden">
						{rollout > 0 && (
							<span className="font-semibold text-primary text-sm tabular-nums">
								{rollout}%
							</span>
						)}
					</div>
				</button>

				{/* Switch - separate from clickable area */}
				<div className="shrink-0 pr-2">
					<Switch
						checked={flag.status === "active"}
						disabled={updateStatusMutation.isPending}
						onCheckedChange={handleSwitchChange}
					/>
				</div>

				{/* Actions dropdown - separate from clickable area */}
				<div className="shrink-0 pr-4 sm:pr-6">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								className="size-8 opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
								size="icon"
								variant="ghost"
							>
								<DotsThreeIcon className="size-5" weight="bold" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-40">
							<DropdownMenuItem onClick={() => onEdit(flag)}>
								<PencilSimpleIcon className="size-4" weight="duotone" />
								Edit
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								className="text-destructive focus:text-destructive"
								onClick={() => onDelete(flag.id)}
							>
								<TrashIcon className="size-4" weight="duotone" />
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</div>
	);
}

export function FlagItemSkeleton() {
	return (
		<div className="flex items-center border-border border-b px-4 py-3 sm:px-6 sm:py-4">
			<div className="flex flex-1 items-center gap-4">
				<Skeleton className="size-4 shrink-0" />
				<div className="min-w-0 flex-1 space-y-1.5">
					<div className="flex items-center gap-2">
						<Skeleton className="h-5 w-40" />
						<Skeleton className="h-5 w-16" />
					</div>
					<Skeleton className="h-4 w-48" />
				</div>
				<div className="hidden items-center gap-6 lg:flex">
					<div className="w-20 space-y-1 text-right">
						<Skeleton className="ml-auto h-5 w-12" />
						<Skeleton className="ml-auto h-3 w-16" />
					</div>
					<Skeleton className="h-5 w-20" />
				</div>
				<Skeleton className="size-8 shrink-0" />
			</div>
		</div>
	);
}
