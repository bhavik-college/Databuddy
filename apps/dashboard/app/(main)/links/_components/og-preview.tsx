"use client";

import { CircleNotchIcon, ImageIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export interface OgData {
	ogTitle: string;
	ogDescription: string;
	ogImageUrl: string;
}

interface OgPreviewProps {
	targetUrl: string;
	value: OgData;
	onChange: (data: OgData) => void;
	useCustomOg: boolean;
	onUseCustomOgChange: (useCustom: boolean) => void;
}

interface FetchedOgData {
	title: string;
	description: string;
	image: string;
}

async function fetchOgData(url: string): Promise<FetchedOgData> {
	if (!url) {
		throw new Error("No URL provided");
	}

	const fullUrl = url.startsWith("http") ? url : `https://${url}`;

	// Use a proxy service or backend endpoint to fetch OG data
	// For now, we'll use a simple approach that works for many sites
	const response = await fetch(
		`https://api.microlink.io?url=${encodeURIComponent(fullUrl)}`
	);

	if (!response.ok) {
		throw new Error("Failed to fetch OG data");
	}

	const data = await response.json();

	return {
		title: data.data?.title ?? "",
		description: data.data?.description ?? "",
		image: data.data?.image?.url ?? data.data?.logo?.url ?? "",
	};
}

export function OgPreview({
	targetUrl,
	value,
	onChange,
	useCustomOg,
	onUseCustomOgChange,
}: OgPreviewProps) {
	const [imageError, setImageError] = useState(false);

	// Fetch OG data from target URL
	const { data: fetchedOg, isLoading } = useQuery({
		queryKey: ["og-preview", targetUrl],
		queryFn: () => fetchOgData(targetUrl),
		enabled: !!targetUrl && targetUrl.length > 3,
		staleTime: 5 * 60 * 1000, // 5 minutes
		retry: 1,
	});

	// Display data: custom values if set, otherwise fetched values
	const displayData = useMemo<FetchedOgData>(() => {
		if (useCustomOg) {
			return {
				title: value.ogTitle || fetchedOg?.title || "",
				description: value.ogDescription || fetchedOg?.description || "",
				image: value.ogImageUrl || fetchedOg?.image || "",
			};
		}
		return fetchedOg ?? { title: "", description: "", image: "" };
	}, [useCustomOg, value, fetchedOg]);

	const handleFieldChange = useCallback(
		(field: keyof OgData, fieldValue: string) => {
			onChange({
				...value,
				[field]: fieldValue,
			});
		},
		[onChange, value]
	);

	const handleImageLoad = useCallback(() => {
		setImageError(false);
	}, []);

	const handleImageError = useCallback(() => {
		setImageError(true);
	}, []);

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-2">
				<ImageIcon size={16} weight="duotone" />
				<span className="font-medium text-sm">Social Preview</span>
			</div>

			{/* Preview Card */}
			<div className="overflow-hidden rounded border bg-muted/30">
				{isLoading ? (
					<div className="flex h-40 items-center justify-center">
						<CircleNotchIcon className="size-6 animate-spin text-muted-foreground" />
					</div>
				) : (
					<>
						{displayData.image && !imageError ? (
							<div className="relative aspect-video w-full overflow-hidden bg-muted">
								{/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: img onLoad/onError are valid for tracking load state */}
								<img
									alt="OG Preview"
									className="size-full object-cover"
									height={200}
									onError={handleImageError}
									onLoad={handleImageLoad}
									src={displayData.image}
									width={400}
								/>
							</div>
						) : (
							<div className="flex aspect-video w-full items-center justify-center bg-muted">
								<ImageIcon
									className="size-12 text-muted-foreground/50"
									weight="duotone"
								/>
							</div>
						)}
						<div className="space-y-1 p-3">
							<p className="line-clamp-1 font-medium text-sm">
								{displayData.title || "No title"}
							</p>
							<p className="line-clamp-2 text-muted-foreground text-xs">
								{displayData.description || "No description"}
							</p>
						</div>
					</>
				)}
			</div>

			{/* Custom OG Toggle */}
			<div className="flex items-center justify-between">
				<Label className="text-sm" htmlFor="use-custom-og">
					Use custom social preview
				</Label>
				<Switch
					checked={useCustomOg}
					id="use-custom-og"
					onCheckedChange={onUseCustomOgChange}
				/>
			</div>

			{/* Custom OG Fields */}
			{useCustomOg && (
				<div className="space-y-3 border-primary/20 border-l-2 pl-4">
					<div className="grid gap-1.5">
						<Label className="text-xs" htmlFor="og-title">
							Title
						</Label>
						<Input
							className="h-8 text-sm"
							id="og-title"
							maxLength={200}
							onChange={(e) => handleFieldChange("ogTitle", e.target.value)}
							placeholder={fetchedOg?.title || "Enter custom title…"}
							value={value.ogTitle}
						/>
					</div>

					<div className="grid gap-1.5">
						<Label className="text-xs" htmlFor="og-description">
							Description
						</Label>
						<Textarea
							className="min-h-16 resize-none text-sm"
							id="og-description"
							maxLength={500}
							onChange={(e) =>
								handleFieldChange("ogDescription", e.target.value)
							}
							placeholder={
								fetchedOg?.description || "Enter custom description…"
							}
							rows={2}
							value={value.ogDescription}
						/>
					</div>

					<div className="grid gap-1.5">
						<Label className="text-xs" htmlFor="og-image">
							Image URL
						</Label>
						<Input
							className="h-8 text-sm"
							id="og-image"
							onChange={(e) => handleFieldChange("ogImageUrl", e.target.value)}
							placeholder={fetchedOg?.image || "https://example.com/image.jpg"}
							type="url"
							value={value.ogImageUrl}
						/>
					</div>
				</div>
			)}
		</div>
	);
}
