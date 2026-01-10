"use client";

import { XIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface QueryChipProps {
	label: string;
	onRemoveAction?: () => void;
	disabled?: boolean;
	className?: string;
}

export function QueryChip({
	label,
	onRemoveAction,
	disabled,
	className,
}: QueryChipProps) {
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 rounded bg-muted px-2.5 py-1 text-sm",
				className
			)}
		>
			<span className="max-w-48 truncate">{label}</span>
			{onRemoveAction && (
				<button
					aria-label={`Remove ${label}`}
					className="text-muted-foreground opacity-60 transition-opacity hover:opacity-100 disabled:opacity-30"
					disabled={disabled}
					onClick={onRemoveAction}
					type="button"
				>
					<XIcon className="size-3.5" />
				</button>
			)}
		</span>
	);
}
