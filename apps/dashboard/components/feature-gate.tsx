"use client";

import { LockIcon, RocketLaunchIcon } from "@phosphor-icons/react";
import Link from "next/link";
import type { ReactNode } from "react";
import {
	useBillingContext,
	type GatedFeatureId,
} from "@/components/providers/billing-provider";
import { Button } from "@/components/ui/button";
import { FEATURE_METADATA, PLAN_IDS } from "@/types/features";

const PLAN_NAMES: Record<string, string> = {
	[PLAN_IDS.FREE]: "Free",
	[PLAN_IDS.HOBBY]: "Hobby",
	[PLAN_IDS.PRO]: "Pro",
	[PLAN_IDS.SCALE]: "Scale",
};

interface FeatureGateProps {
	feature: GatedFeatureId;
	children: ReactNode;
	title?: string;
	description?: string;
	/** Block rendering while checking access (default: false, shows content optimistically) */
	blockWhileLoading?: boolean;
}

/**
 * Wraps content requiring a specific feature.
 * Shows upgrade prompt when feature is unavailable.
 */
export function FeatureGate({
	feature,
	children,
	title,
	description,
	blockWhileLoading = false,
}: FeatureGateProps) {
	const { isFeatureEnabled, currentPlanId, isFree, isLoading } =
		useBillingContext();

	// Optimistic: show content while loading
	if (isLoading && !blockWhileLoading) {
		return <>{children}</>;
	}

	if (isFeatureEnabled(feature)) {
		return <>{children}</>;
	}

	const metadata = FEATURE_METADATA[feature];
	const planName = metadata?.minPlan ? PLAN_NAMES[metadata.minPlan] : "a paid";

	return (
		<div className="flex h-full min-h-[400px] flex-col items-center justify-center p-8">
			<div className="flex max-w-md flex-col items-center text-center">
				<div className="mb-6 flex size-16 items-center justify-center rounded-full bg-secondary">
					<LockIcon
						className="size-8 text-muted-foreground"
						weight="duotone"
					/>
				</div>

				<h2 className="mb-2 font-semibold text-xl">
					{title ??
						`${metadata?.name ?? "This feature"} requires ${planName} plan`}
				</h2>

				<p className="mb-6 text-muted-foreground">
					{description ??
						metadata?.description ??
						"Upgrade your plan to access this feature."}
				</p>

				<div className="flex flex-col gap-3 sm:flex-row">
					<Button asChild>
						<Link href="/billing/plans">
							<RocketLaunchIcon className="mr-2 size-4" weight="duotone" />
							Upgrade to {planName}
						</Link>
					</Button>
					<Button asChild variant="outline">
						<Link href="/billing">View Current Plan</Link>
					</Button>
				</div>

				{isFree && (
					<p className="mt-6 text-muted-foreground text-sm">
						You&apos;re on the{" "}
						<span className="font-medium">
							{PLAN_NAMES[currentPlanId ?? PLAN_IDS.FREE]}
						</span>{" "}
						plan
					</p>
				)}
			</div>
		</div>
	);
}

export function useFeatureGate(feature: GatedFeatureId) {
	const { isFeatureEnabled, getGatedFeatureAccess, isLoading } =
		useBillingContext();

	const access = getGatedFeatureAccess(feature);
	const metadata = FEATURE_METADATA[feature];

	return {
		isEnabled: isFeatureEnabled(feature),
		isLoading,
		...access,
		planName: metadata?.minPlan ? PLAN_NAMES[metadata.minPlan] : null,
		featureName: metadata?.name ?? feature,
	};
}
