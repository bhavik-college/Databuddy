"use client";

import { SidebarIcon } from "@phosphor-icons/react";
import { useAtom, useAtomValue } from "jotai";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { agentCanvasOpenAtom, currentArtifactAtom } from "./agent-atoms";

interface ArtifactToggleIconProps {
	artifactId?: string;
}

export function ArtifactToggleIcon({ artifactId }: ArtifactToggleIconProps) {
	const [isCanvasOpen, setCanvasOpen] = useAtom(agentCanvasOpenAtom);
	const currentArtifact = useAtomValue(currentArtifactAtom);

	// Check if this specific artifact is currently shown
	const isCurrentlyOpen =
		isCanvasOpen && (!artifactId || currentArtifact?.id === artifactId);

	const handleToggle = useCallback(() => {
		if (isCurrentlyOpen) {
			setCanvasOpen(false);
		} else {
			setCanvasOpen(true);
		}
	}, [isCurrentlyOpen, setCanvasOpen]);

	return (
		<TooltipProvider delayDuration={200}>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						aria-label={isCurrentlyOpen ? "Close artifact" : "Open artifact"}
						className="size-6"
						onClick={handleToggle}
						size="icon"
						variant="ghost"
					>
						<SidebarIcon className="size-3.5 text-muted-foreground" />
					</Button>
				</TooltipTrigger>
				<TooltipContent className="px-2 py-1 text-xs">
					{isCurrentlyOpen ? "Close artifact" : "Open artifact"}
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}
