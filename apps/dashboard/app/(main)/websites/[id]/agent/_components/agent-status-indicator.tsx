"use client";

import {
	BrainIcon,
	ChartBarIcon,
	CircleNotchIcon,
	MagnifyingGlassIcon,
	SparkleIcon,
	TableIcon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAgentChat } from "./hooks/use-agent-chat";
import { useChatStatus } from "./hooks/use-chat-status";

const STATUS_ICONS: Record<string, typeof SparkleIcon> = {
	routing: BrainIcon,
	thinking: BrainIcon,
	analyzing: MagnifyingGlassIcon,
	searching: MagnifyingGlassIcon,
	generating: SparkleIcon,
	visualizing: ChartBarIcon,
};

const TOOL_ICONS: Record<string, typeof SparkleIcon> = {
	analyze_traffic: ChartBarIcon,
	analyze_sources: ChartBarIcon,
	analyze_funnel: ChartBarIcon,
	generate_report: TableIcon,
	create_chart: ChartBarIcon,
	get_top_pages: TableIcon,
	get_events: TableIcon,
	get_sessions: TableIcon,
	find_anomalies: MagnifyingGlassIcon,
	find_insights: SparkleIcon,
	compare_periods: ChartBarIcon,
};

export function AgentStatusIndicator() {
	const { messages, status } = useAgentChat();
	const { displayMessage, currentToolCall, agentStatus, isStreaming } =
		useChatStatus(messages, status);

	if (!(displayMessage || isStreaming)) return null;

	const Icon = currentToolCall
		? (TOOL_ICONS[currentToolCall] ?? SparkleIcon)
		: (STATUS_ICONS[agentStatus] ?? SparkleIcon);

	return (
		<div className="flex h-8 items-center">
			<AnimatePresence mode="wait">
				{displayMessage ? (
					<motion.div
						animate={{ opacity: 1, x: 0 }}
						className="flex items-center gap-2"
						exit={{ opacity: 0, x: -10 }}
						initial={{ opacity: 0, x: 10 }}
						key={displayMessage}
						transition={{ duration: 0.15 }}
					>
						<Icon
							className="size-4 animate-pulse text-foreground/50"
							weight="duotone"
						/>
						<span className="text-foreground/50 text-xs">{displayMessage}</span>
					</motion.div>
				) : isStreaming ? (
					<motion.div
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						initial={{ opacity: 0 }}
						key="loader"
					>
						<CircleNotchIcon
							className="size-4 animate-spin text-foreground/50"
							weight="bold"
						/>
					</motion.div>
				) : null}
			</AnimatePresence>
		</div>
	);
}

export function ShimmerText({
	text,
	className,
}: {
	text: string;
	className?: string;
}) {
	return (
		<span
			className={cn(
				"relative inline-block overflow-hidden",
				"bg-linear-to-r from-foreground/50 via-foreground to-foreground/50",
				"bg-size-[200%_100%] bg-clip-text text-transparent",
				"animate-shimmer",
				className
			)}
		>
			{text}
		</span>
	);
}
