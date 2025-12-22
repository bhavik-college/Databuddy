"use client";

import { XIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { DependencySelectorProps } from "./types";

export function DependencySelector({
	value = [],
	onChange,
	availableFlags = [],
	currentFlagKey,
}: DependencySelectorProps) {
	const selectableFlags = availableFlags.filter(
		(flag) => flag.key !== currentFlagKey && !value.includes(flag.key)
	);

	const getFlagName = (flagKey: string) =>
		availableFlags.find((f) => f.key === flagKey)?.name ?? flagKey;

	return (
		<div className="space-y-2">
			<Select
				disabled={selectableFlags.length === 0}
				onValueChange={(flagKey) => onChange([...value, flagKey])}
				value=""
			>
				<SelectTrigger className="h-8">
					<SelectValue placeholder="Select a flag dependency..." />
				</SelectTrigger>
				<SelectContent>
					{selectableFlags.map((flag) => (
						<SelectItem key={flag.key} value={flag.key}>
							{flag.name || flag.key}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			{value.length > 0 ? (
				<div className="flex flex-wrap gap-2">
					{value.map((flagKey) => (
						<div
							className="flex items-center gap-1 rounded border bg-secondary px-2 py-1 text-sm"
							key={flagKey}
						>
							<span>{getFlagName(flagKey)}</span>
							<Button
								aria-label={`Remove ${getFlagName(flagKey)} dependency`}
								className="h-4 w-4 text-muted-foreground hover:text-destructive"
								onClick={() => onChange(value.filter((k) => k !== flagKey))}
								size="icon"
								type="button"
								variant="ghost"
							>
								<XIcon className="h-3 w-3" />
							</Button>
						</div>
					))}
				</div>
			) : null}
		</div>
	);
}
