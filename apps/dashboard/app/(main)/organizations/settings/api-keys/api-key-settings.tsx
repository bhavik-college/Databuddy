"use client";

import {
	BookOpenIcon,
	KeyIcon,
	PlusIcon,
	ShieldCheckIcon,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { ApiKeyCreateDialog } from "@/components/organizations/api-key-create-dialog";
import { ApiKeyDetailDialog } from "@/components/organizations/api-key-detail-dialog";
import { RightSidebar } from "@/components/right-sidebar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Organization } from "@/hooks/use-organizations";
import { orpc } from "@/lib/orpc";
import { ApiKeyRow, type ApiKeyRowItem } from "./api-key-row";

type ApiKeySettingsProps = {
	organization: Organization;
};

function SkeletonRow() {
	return (
		<div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 px-5 py-4">
			<Skeleton className="h-10 w-10 rounded" />
			<div className="space-y-2">
				<Skeleton className="h-4 w-32" />
				<Skeleton className="h-3 w-48" />
			</div>
			<Skeleton className="h-6 w-16 rounded-full" />
			<Skeleton className="h-4 w-4" />
		</div>
	);
}

function ApiKeysSkeleton() {
	return (
		<div className="h-full lg:grid lg:grid-cols-[1fr_18rem]">
			<div className="divide-y border-b lg:border-r lg:border-b-0">
				<SkeletonRow />
				<SkeletonRow />
				<SkeletonRow />
			</div>
			<div className="space-y-4 bg-muted/30 p-5">
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-18 w-full rounded" />
				<Skeleton className="h-10 w-full" />
			</div>
		</div>
	);
}

export function ApiKeySettings({ organization }: ApiKeySettingsProps) {
	const [showCreateDialog, setShowCreateDialog] = useState(false);
	const [showDetailDialog, setShowDetailDialog] = useState(false);
	const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);

	const { data, isLoading, isError } = useQuery({
		...orpc.apikeys.list.queryOptions({
			input: { organizationId: organization.id },
		}),
		refetchOnMount: true,
		refetchOnReconnect: true,
		staleTime: 0,
	});

	const items = (data ?? []) as ApiKeyRowItem[];
	const activeCount = items.filter((k) => k.enabled && !k.revokedAt).length;
	const isEmpty = items.length === 0;

	if (isLoading) {
		return <ApiKeysSkeleton />;
	}
	if (isError) {
		return (
			<EmptyState
				description="Please try again in a moment"
				icon={<KeyIcon weight="duotone" />}
				title="Failed to load API keys"
				variant="error"
			/>
		);
	}

	return (
		<>
			<div className="h-full lg:grid lg:grid-cols-[1fr_18rem]">
				{/* Keys List / Empty State */}
				<div className="flex flex-col border-b lg:border-r lg:border-b-0">
					{isEmpty ? (
						<EmptyState
							description="Create your first API key to start integrating with our platform"
							icon={<KeyIcon weight="duotone" />}
							title="No API keys yet"
						/>
					) : (
						<div className="flex-1 divide-y overflow-y-auto">
							{items.map((apiKey) => (
								<ApiKeyRow
									apiKey={apiKey}
									key={apiKey.id}
									onSelect={(id) => {
										setSelectedKeyId(id);
										setShowDetailDialog(true);
									}}
								/>
							))}
						</div>
					)}
				</div>

				{/* Sidebar */}
				<RightSidebar className="gap-4 p-5">
					{/* Create Button */}
					<Button className="w-full" onClick={() => setShowCreateDialog(true)}>
						<PlusIcon className="mr-2" size={16} />
						Create New Key
					</Button>

					{/* Stats Card */}
					{!isEmpty && (
						<div className="flex items-center gap-3 rounded border bg-background p-4">
							<div className="flex h-10 w-10 items-center justify-center rounded bg-primary/10">
								<ShieldCheckIcon
									className="text-primary"
									size={20}
									weight="duotone"
								/>
							</div>
							<div>
								<p className="font-semibold tabular-nums">
									{activeCount}{" "}
									<span className="font-normal text-muted-foreground">
										/ {items.length}
									</span>
								</p>
								<p className="text-muted-foreground text-sm">Active keys</p>
							</div>
						</div>
					)}

					{/* Actions */}
					<Button asChild className="w-full justify-start" variant="secondary">
						<a
							href="https://www.databuddy.cc/docs/getting-started"
							rel="noopener noreferrer"
							target="_blank"
						>
							<BookOpenIcon size={16} />
							Documentation
						</a>
					</Button>

					{/* Tips */}
					<div className="mt-auto rounded border border-dashed bg-background/50 p-4">
						<p className="mb-2 font-medium text-sm">Security reminder</p>
						<p className="text-muted-foreground text-xs leading-relaxed">
							Keep your API keys secure. Never share them publicly or commit
							them to version control.
						</p>
					</div>
				</RightSidebar>
			</div>

			<ApiKeyCreateDialog
				onOpenChange={setShowCreateDialog}
				open={showCreateDialog}
				organizationId={organization.id}
			/>
			<ApiKeyDetailDialog
				keyId={selectedKeyId}
				onOpenChangeAction={setShowDetailDialog}
				open={showDetailDialog}
			/>
		</>
	);
}
