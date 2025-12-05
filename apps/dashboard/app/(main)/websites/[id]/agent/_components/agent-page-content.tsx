"use client";

import {
	ArrowRightIcon,
	BrainIcon,
	ChartBarIcon,
	LightningIcon,
	RobotIcon,
	SidebarIcon,
	TableIcon,
} from "@phosphor-icons/react";
import { useAtom, useSetAtom } from "jotai";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { agentCanvasOpenAtom, agentInputAtom } from "./agent-atoms";
import { AgentCanvas } from "./agent-canvas";
import { AgentHeader } from "./agent-header";
import { AgentInput } from "./agent-input";
import { AgentMessages } from "./agent-messages";
import { AgentStatusIndicator } from "./agent-status-indicator";
import {
	Conversation,
	ConversationContent,
	ConversationScrollButton,
} from "./conversation";
import { useAgentChat } from "./hooks";
import { SuggestedPrompts } from "./suggested-prompts";

interface AgentPageContentProps {
	websiteId: string;
}

const SUGGESTED_PROMPTS = [
	{
		text: "Analyze my traffic trends and find anomalies",
		icon: ChartBarIcon,
		category: "Analysis",
	},
	{
		text: "What's causing my bounce rate to increase?",
		icon: BrainIcon,
		category: "Insights",
	},
	{
		text: "Generate a weekly performance report",
		icon: TableIcon,
		category: "Reports",
	},
	{
		text: "Find my best converting traffic sources",
		icon: LightningIcon,
		category: "Discovery",
	},
];

export function AgentPageContent({
	websiteId: _websiteId,
}: AgentPageContentProps) {
	const setInputValue = useSetAtom(agentInputAtom);
	const [showCanvas, setShowCanvas] = useAtom(agentCanvasOpenAtom);
	const { messages, isLoading } = useAgentChat();

	const hasMessages = messages.length > 0;

	return (
		<div className="relative flex flex-1 overflow-hidden">
			<div
				className={cn(
					"fixed inset-y-0 right-0 z-20 w-full border-l bg-sidebar md:w-[500px] lg:w-[600px]",
					"transition-transform duration-300 ease-in-out",
					showCanvas ? "translate-x-0" : "translate-x-full"
				)}
			>
				<AgentCanvas onClose={() => setShowCanvas(false)} />
			</div>

			<div
				className={cn(
					"flex flex-1 flex-col",
					"transition-all duration-300 ease-in-out",
					showCanvas && "mr-0 md:mr-[500px] lg:mr-[600px]"
				)}
			>
				<div className="shrink-0 border-b bg-sidebar/50 backdrop-blur-sm">
					<div className="flex items-center gap-4 p-4">
						<div className="flex items-center gap-3">
							<Avatar className="size-10 border">
								<AvatarFallback className="bg-primary/10">
									<RobotIcon className="size-5 text-primary" weight="duotone" />
								</AvatarFallback>
							</Avatar>
							<div>
								<div className="flex items-center gap-2">
									<h2 className="font-semibold">AI Agent</h2>
									<span className="rounded border border-border/50 bg-accent px-1.5 py-0.5 text-[10px] text-foreground/60">
										ALPHA
									</span>
								</div>
								<p className="text-foreground/50 text-sm">
									Autonomous analytics assistant
								</p>
							</div>
						</div>

						<div className="flex-1">
							<AgentHeader showBackButton={hasMessages} />
						</div>

						<div className="flex items-center gap-1">
							<Button
								onClick={() => setShowCanvas(!showCanvas)}
								size="icon"
								title="Toggle canvas"
								variant="ghost"
							>
								<SidebarIcon className="size-4" weight="duotone" />
							</Button>
						</div>
					</div>
				</div>

				<Conversation className="flex-1">
					<ConversationContent className="pb-32">
						<div className="mx-auto max-w-2xl">
							{hasMessages ? (
								<>
									<AgentMessages isStreaming={isLoading} messages={messages} />
									<AgentStatusIndicator />
								</>
							) : (
								<WelcomeState onPromptSelect={setInputValue} />
							)}
						</div>
					</ConversationContent>
					<ConversationScrollButton />
				</Conversation>

				{hasMessages && (
					<div className="mx-auto w-full max-w-2xl px-4 pb-2">
						<SuggestedPrompts />
					</div>
				)}

				<AgentInput />
			</div>
		</div>
	);
}

function WelcomeState({
	onPromptSelect,
}: {
	onPromptSelect: (text: string) => void;
}) {
	return (
		<div className="flex min-h-[400px] flex-col items-center justify-center py-8">
			<div className="mb-6 flex size-20 items-center justify-center rounded-full border bg-linear-to-br from-primary/10 to-accent/10">
				<RobotIcon className="size-10 text-primary" weight="duotone" />
			</div>

			<div className="mb-8 max-w-md text-center">
				<h3 className="mb-2 font-semibold text-xl">Meet Your AI Agent</h3>
				<p className="text-foreground/60 text-sm leading-relaxed">
					Unlike simple assistants, the Agent autonomously explores your
					analytics data, discovers patterns, and surfaces actionable insights
					without step-by-step guidance.
				</p>
			</div>

			<div className="mb-8 flex flex-wrap justify-center gap-2">
				{[
					"Deep Analysis",
					"Pattern Detection",
					"Anomaly Alerts",
					"Auto Reports",
				].map((capability) => (
					<span
						className="rounded border border-border/50 bg-accent px-3 py-1 text-foreground/70 text-xs"
						key={capability}
					>
						{capability}
					</span>
				))}
			</div>

			<div className="w-full max-w-lg space-y-3">
				<div className="flex items-center gap-2 text-foreground/50 text-sm">
					<LightningIcon className="size-4" weight="duotone" />
					<span>Try asking:</span>
				</div>
				<div className="grid gap-2 sm:grid-cols-2">
					{SUGGESTED_PROMPTS.map((prompt) => (
						<button
							className={cn(
								"group flex items-start gap-3 rounded border border-dashed p-3 text-left",
								"transition-all hover:border-solid hover:bg-accent/30",
								"disabled:cursor-not-allowed disabled:opacity-50"
							)}
							disabled
							key={prompt.text}
							onClick={() => onPromptSelect(prompt.text)}
							type="button"
						>
							<div className="flex size-8 shrink-0 items-center justify-center rounded bg-accent/50">
								<prompt.icon
									className="size-4 text-foreground/60"
									weight="duotone"
								/>
							</div>
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm">{prompt.text}</p>
								<p className="text-foreground/50 text-xs">{prompt.category}</p>
							</div>
							<ArrowRightIcon className="size-4 shrink-0 text-transparent transition-all group-hover:text-foreground/50" />
						</button>
					))}
				</div>
			</div>
		</div>
	);
}
