"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useAtomValue } from "jotai";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { agentSuggestionsAtom } from "./agent-atoms";
import { useAgentChat } from "./hooks/use-agent-chat";

interface SuggestedPromptsProps {
	className?: string;
}

const DEFAULT_PROMPTS = [
	"What were my top traffic sources this week?",
	"Show me conversion trends",
	"Any anomalies in recent data?",
	"Compare to last month",
];

export function SuggestedPrompts({ className }: SuggestedPromptsProps) {
	const { sendMessage, isLoading, messages } = useAgentChat();
	const suggestions = useAtomValue(agentSuggestionsAtom);

	const scrollRef = useRef<HTMLDivElement>(null);
	const [canScrollLeft, setCanScrollLeft] = useState(false);
	const [canScrollRight, setCanScrollRight] = useState(false);
	const [isScrollable, setIsScrollable] = useState(false);

	const prompts = suggestions.length > 0 ? suggestions : DEFAULT_PROMPTS;
	const hasMessages = messages.length > 0;

	const handlePromptClick = (prompt: string) => {
		if (isLoading) return;
		sendMessage(prompt);
	};

	useEffect(() => {
		const container = scrollRef.current;
		if (!container) return;

		const checkScrollability = () => {
			const { scrollLeft, scrollWidth, clientWidth } = container;
			const scrollable = scrollWidth > clientWidth;
			const maxScrollLeft = scrollWidth - clientWidth;

			setIsScrollable(scrollable);
			setCanScrollLeft(scrollLeft > 1);
			setCanScrollRight(scrollLeft < maxScrollLeft - 1);
		};

		requestAnimationFrame(checkScrollability);
		container.addEventListener("scroll", checkScrollability, { passive: true });

		const resizeObserver = new ResizeObserver(() => {
			requestAnimationFrame(checkScrollability);
		});
		resizeObserver.observe(container);

		return () => {
			container.removeEventListener("scroll", checkScrollability);
			resizeObserver.disconnect();
		};
	}, [prompts]);

	if (prompts.length === 0 || isLoading) return null;
	if (!hasMessages) return null;

	return (
		<AnimatePresence mode="wait">
			<motion.div
				animate={{ opacity: 1, y: 0 }}
				className={cn("relative", className)}
				exit={{ opacity: 0, y: 10 }}
				initial={{ opacity: 0, y: 20 }}
				transition={{ duration: 0.3, delay: 0.05, ease: "easeOut" }}
			>
				{isScrollable && canScrollLeft && (
					<div className="pointer-events-none absolute top-0 bottom-0 left-0 z-20 w-6 bg-linear-to-r from-background to-transparent" />
				)}

				{isScrollable && canScrollRight && (
					<div className="pointer-events-none absolute top-0 right-0 bottom-0 z-20 w-6 bg-linear-to-l from-background to-transparent" />
				)}

				<div
					className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
					ref={scrollRef}
				>
					{prompts.map((prompt, index) => (
						<motion.div
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.95 }}
							initial={{ opacity: 0, y: 10 }}
							key={prompt}
							transition={{
								duration: 0.2,
								delay: 0.05 + index * 0.05,
								ease: "easeOut",
							}}
						>
							<Button
								className="h-auto shrink-0 whitespace-nowrap rounded-full border bg-background px-3 py-1.5 font-normal text-foreground/60 text-xs hover:text-foreground"
								disabled={isLoading}
								onClick={() => handlePromptClick(prompt)}
								size="sm"
								variant="ghost"
							>
								{prompt}
							</Button>
						</motion.div>
					))}
				</div>
			</motion.div>
		</AnimatePresence>
	);
}

export function InlineSuggestedPrompts({
	prompts,
	onSelect,
	disabled = false,
}: {
	prompts: string[];
	onSelect: (prompt: string) => void;
	disabled?: boolean;
}) {
	return (
		<div className="flex flex-wrap gap-2">
			{prompts.map((prompt, index) => (
				<motion.button
					animate={{ opacity: 1, scale: 1 }}
					className={cn(
						"rounded-full border border-dashed px-3 py-1.5 text-foreground/70 text-xs",
						"transition-colors hover:border-solid hover:bg-accent/30",
						"disabled:cursor-not-allowed disabled:opacity-50"
					)}
					disabled={disabled}
					initial={{ opacity: 0, scale: 0.95 }}
					key={prompt}
					onClick={() => onSelect(prompt)}
					transition={{ delay: index * 0.05 }}
					type="button"
				>
					{prompt}
				</motion.button>
			))}
		</div>
	);
}
