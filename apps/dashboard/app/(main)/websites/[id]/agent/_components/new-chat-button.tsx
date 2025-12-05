"use client";

import { PlusIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useAgentChat } from "./hooks/use-agent-chat";

export function NewChatButton() {
	const { reset } = useAgentChat();

	return (
		<Button
			className="gap-1.5"
			onClick={() => reset()}
			size="sm"
			variant="outline"
		>
			<PlusIcon className="size-4" />
			<span className="hidden sm:inline">New Chat</span>
		</Button>
	);
}
