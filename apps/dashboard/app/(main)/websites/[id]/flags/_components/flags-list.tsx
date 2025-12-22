"use client";

import { FlagIcon } from "@phosphor-icons/react";
import { EmptyState } from "@/components/empty-state";
import { FlagItem } from "./flag-item";
import type { FlagsListProps } from "./types";

export function FlagsList({
	flags,
	isLoading,
	onCreateFlagAction,
	onEditFlagAction,
	onDeleteFlag,
}: FlagsListProps & {
	onDeleteFlag?: (flagId: string) => void;
}) {
	if (isLoading) {
		return null;
	}

	if (flags.length === 0) {
		return (
			<div className="flex flex-1 items-center justify-center py-16">
				<EmptyState
					action={{
						label: "Create Your First Flag",
						onClick: onCreateFlagAction,
					}}
					description="Create your first feature flag to start controlling feature rollouts and A/B testing across your application."
					icon={<FlagIcon weight="duotone" />}
					title="No feature flags yet"
					variant="minimal"
				/>
			</div>
		);
	}

	return (
		<div>
			{flags.map((flag) => (
				<FlagItem
					flag={flag}
					key={flag.id}
					onDelete={onDeleteFlag ?? (() => {})}
					onEdit={onEditFlagAction}
				/>
			))}
		</div>
	);
}
