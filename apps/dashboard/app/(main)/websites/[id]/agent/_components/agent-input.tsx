"use client";

import {
	CommandIcon,
	PaperclipIcon,
	PaperPlaneRightIcon,
	StopIcon,
} from "@phosphor-icons/react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { AgentCommandMenu } from "./agent-command-menu";
import { useAgentChat, useAgentCommands } from "./hooks";
import { RecordButton } from "./record-button";

export function AgentInput() {
	const inputRef = useRef<HTMLInputElement>(null);
	const [isFocused, setIsFocused] = useState(false);
	const { sendMessage, stop, isLoading } = useAgentChat();
	const { input, handleInputChange, handleKeyDown, showCommands } =
		useAgentCommands();

	const handleSubmit = (e?: React.FormEvent) => {
		e?.preventDefault();
		if (!input.trim() || isLoading) return;
		sendMessage(input.trim());
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		handleInputChange(e.target.value, e.target.selectionStart ?? 0);
	};

	const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
		// Let command menu handle navigation keys
		if (handleKeyDown(e)) return;

		// Submit on Enter (when not in command mode)
		if (e.key === "Enter" && !e.shiftKey && !showCommands) {
			e.preventDefault();
			handleSubmit();
		}
	};

	const handleStop = (e: React.MouseEvent) => {
		e.preventDefault();
		stop();
	};

	return (
		<div className="shrink-0 border-t bg-sidebar/30 backdrop-blur-sm">
			<div className="mx-auto max-w-2xl p-4">
				<div className="relative">
					<AgentCommandMenu />

					<form className="flex gap-2" onSubmit={handleSubmit}>
						<div className="relative flex-1">
							<Input
								className={cn(
									"h-12 pr-24 pl-4 text-base",
									isFocused && "ring-2 ring-primary/20"
								)}
								disabled={isLoading}
								onBlur={() => setIsFocused(false)}
								onChange={handleChange}
								onFocus={() => setIsFocused(true)}
								onKeyDown={handleKey}
								placeholder="Ask the agent to analyze your data..."
								ref={inputRef}
								value={input}
							/>

							<div className="-translate-y-1/2 absolute top-1/2 right-2 flex items-center gap-1">
								<Button
									className="size-8"
									disabled={isLoading}
									size="icon"
									title="Attach file"
									type="button"
									variant="ghost"
								>
									<PaperclipIcon className="size-4" weight="duotone" />
								</Button>
								<RecordButton disabled={isLoading} />
								<kbd className="hidden items-center gap-1 rounded border border-border/50 bg-accent px-1.5 py-0.5 font-mono text-[10px] text-foreground/70 sm:flex">
									<CommandIcon className="size-3" />
									<span>K</span>
								</kbd>
							</div>
						</div>

						{isLoading ? (
							<Button
								className="h-12 w-12 shrink-0"
								onClick={handleStop}
								size="icon"
								title="Stop generation"
								type="button"
								variant="destructive"
							>
								<StopIcon className="size-5" weight="fill" />
							</Button>
						) : (
							<Button
								className="h-12 w-12 shrink-0"
								disabled={!input.trim()}
								size="icon"
								title="Send message"
								type="submit"
							>
								<PaperPlaneRightIcon className="size-5" weight="duotone" />
							</Button>
						)}
					</form>
				</div>

				<p className="mt-2 text-foreground/40 text-xs">
					Press{" "}
					<kbd className="rounded border border-border/50 bg-accent px-1 font-mono text-[10px] text-foreground/70">
						Enter
					</kbd>{" "}
					to send ·{" "}
					<kbd className="rounded border border-border/50 bg-accent px-1 font-mono text-[10px] text-foreground/70">
						/
					</kbd>{" "}
					for commands
				</p>
			</div>
		</div>
	);
}
