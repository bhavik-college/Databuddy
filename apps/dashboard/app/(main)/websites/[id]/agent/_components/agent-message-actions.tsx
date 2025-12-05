"use client";

import {
	ArrowsClockwiseIcon,
	CheckIcon,
	CopyIcon,
	ThumbsDownIcon,
	ThumbsUpIcon,
} from "@phosphor-icons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useAgentChat } from "./hooks/use-agent-chat";

interface AgentMessageActionsProps {
	messageContent: string;
}

export function AgentMessageActions({
	messageContent,
}: AgentMessageActionsProps) {
	const [feedbackGiven, setFeedbackGiven] = useState<
		"positive" | "negative" | null
	>(null);
	const [copied, setCopied] = useState(false);
	const { reset } = useAgentChat();

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(messageContent);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (error) {
			console.error("Failed to copy:", error);
		}
	};

	const handleRegenerate = () => {
		// TODO: Implement actual regeneration
		reset();
	};

	const handlePositive = () => {
		if (feedbackGiven === "positive") {
			setFeedbackGiven(null);
			// TODO: Delete feedback via API
			return;
		}
		setFeedbackGiven("positive");
		// TODO: Submit positive feedback via API
	};

	const handleNegative = () => {
		if (feedbackGiven === "negative") {
			setFeedbackGiven(null);
			// TODO: Delete feedback via API
			return;
		}
		setFeedbackGiven("negative");
		// TODO: Submit negative feedback via API
	};

	return (
		<div className="flex items-center gap-0.5">
			<TooltipProvider delayDuration={200}>
				{/* Copy Button */}
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							className="size-7"
							onClick={handleCopy}
							size="icon"
							variant="ghost"
						>
							{copied ? (
								<CheckIcon className="size-3.5 text-success" />
							) : (
								<CopyIcon className="size-3.5 text-muted-foreground" />
							)}
						</Button>
					</TooltipTrigger>
					<TooltipContent className="px-2 py-1 text-xs">
						{copied ? "Copied!" : "Copy response"}
					</TooltipContent>
				</Tooltip>

				{/* Regenerate Button */}
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							className="size-7"
							onClick={handleRegenerate}
							size="icon"
							variant="ghost"
						>
							<ArrowsClockwiseIcon className="size-3.5 text-muted-foreground" />
						</Button>
					</TooltipTrigger>
					<TooltipContent className="px-2 py-1 text-xs">
						Retry response
					</TooltipContent>
				</Tooltip>

				{/* Positive Feedback */}
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							className="size-7"
							onClick={handlePositive}
							size="icon"
							variant="ghost"
						>
							<ThumbsUpIcon
								className={cn(
									"size-3.5",
									feedbackGiven === "positive"
										? "text-foreground"
										: "text-muted-foreground"
								)}
								weight={feedbackGiven === "positive" ? "fill" : "regular"}
							/>
						</Button>
					</TooltipTrigger>
					<TooltipContent className="px-2 py-1 text-xs">
						{feedbackGiven === "positive" ? "Remove feedback" : "Good response"}
					</TooltipContent>
				</Tooltip>

				{/* Negative Feedback */}
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							className="size-7"
							onClick={handleNegative}
							size="icon"
							variant="ghost"
						>
							<ThumbsDownIcon
								className={cn(
									"size-3.5",
									feedbackGiven === "negative"
										? "text-foreground"
										: "text-muted-foreground"
								)}
								weight={feedbackGiven === "negative" ? "fill" : "regular"}
							/>
						</Button>
					</TooltipTrigger>
					<TooltipContent className="px-2 py-1 text-xs">
						{feedbackGiven === "negative" ? "Remove feedback" : "Poor response"}
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		</div>
	);
}
