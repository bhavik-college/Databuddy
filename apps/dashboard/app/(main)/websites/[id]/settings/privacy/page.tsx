"use client";

import {
	CheckIcon,
	ClipboardIcon,
	InfoIcon,
	ShareIcon,
} from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useCallback } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/app/(main)/websites/_components/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
	updateWebsiteCache,
	useWebsite,
	type Website,
} from "@/hooks/use-websites";
import { orpc } from "@/lib/orpc";

export default function PrivacyPage() {
	const params = useParams();
	const websiteId = params.id as string;
	const { data: websiteData } = useWebsite(websiteId);
	const queryClient = useQueryClient();

	const toggleMutation = useMutation({
		...orpc.websites.togglePublic.mutationOptions(),
		onSuccess: (updatedWebsite: Website) => {
			updateWebsiteCache(queryClient, updatedWebsite);
		},
	});

	const isPublic = websiteData?.isPublic ?? false;
	const shareableLink = websiteData
		? `${window.location.origin}/demo/${websiteId}`
		: "";

	const handleTogglePublic = useCallback(() => {
		if (!websiteData) {
			return;
		}

		toast.promise(
			toggleMutation.mutateAsync({ id: websiteId, isPublic: !isPublic }),
			{
				loading: "Updating privacy settings...",
				success: "Privacy settings updated successfully",
				error: "Failed to update privacy settings",
			}
		);
	}, [websiteData, websiteId, isPublic, toggleMutation]);

	const handleCopyLink = useCallback(() => {
		if (!shareableLink) {
			return;
		}
		navigator.clipboard.writeText(shareableLink);
		toast.success("Link copied to clipboard!");
	}, [shareableLink]);

	if (!websiteData) {
		return (
			<div className="flex h-64 items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col">
			<div className="h-[89px] border-b">
				<div className="flex h-full flex-col justify-center gap-2 px-4 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
					<PageHeader
						badgeClassName={
							isPublic
								? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
								: "h-5 px-2"
						}
						badgeContent={isPublic ? "Public" : "Private"}
						description="Control public access to your website's analytics dashboard"
						icon={<ShareIcon />}
						title="Privacy"
					/>
				</div>
			</div>
			<div className="flex min-h-0 flex-1 flex-col">
				<section className="border-b px-4 py-5 sm:px-6">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div className="space-y-1">
							<p className="font-medium text-sm">Enable public sharing</p>
							<p className="text-muted-foreground text-xs">
								Anyone with the link can view your analytics data in read-only
								mode.
							</p>
							{isPublic && (
								<Badge
									className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
									variant="secondary"
								>
									<CheckIcon className="mr-1 h-3 w-3" />
									Public access enabled
								</Badge>
							)}
						</div>
						<Switch
							aria-label="Toggle public access"
							checked={isPublic}
							className="data-[state=checked]:bg-primary"
							id="public-toggle"
							onCheckedChange={handleTogglePublic}
						/>
					</div>
				</section>

				{isPublic && (
					<section className="border-b px-4 py-5 sm:px-6">
						<div className="mb-3 flex items-center gap-2">
							<h2 className="font-semibold text-sm">
								Shareable Dashboard Link
							</h2>
							<Badge className="text-xs" variant="outline">
								Read-only
							</Badge>
						</div>

						<div className="space-y-3">
							<div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
								<code className="flex-1 overflow-x-auto break-all rounded-md bg-muted px-3 py-2 font-mono text-sm">
									{shareableLink}
								</code>
								<Button
									aria-label="Copy shareable link"
									className="shrink-0"
									onClick={handleCopyLink}
									size="sm"
									variant="outline"
								>
									<ClipboardIcon className="h-4 w-4" />
								</Button>
							</div>

							<Alert
								aria-live="polite"
								className="border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/20 dark:text-blue-200"
							>
								<InfoIcon className="h-4 w-4" />
								<AlertDescription className="text-xs">
									This link provides secure, view-only access to your analytics
									dashboard. Shared users can explore data but cannot modify
									settings or delete the website.
								</AlertDescription>
							</Alert>
						</div>
					</section>
				)}
			</div>
		</div>
	);
}
