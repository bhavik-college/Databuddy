import type { ChatStatus, UIMessage } from "ai";
import { useMemo } from "react";
import type { AgentStatus, ArtifactStage, ArtifactType } from "../agent-atoms";
import { getStatusMessage, getToolMessage } from "../agent-commands";

interface ChatStatusResult {
	agentStatus: AgentStatus;
	currentToolCall: string | null;
	toolMessage: string | null;
	statusMessage: string | null;
	displayMessage: string | null;
	artifactStage: ArtifactStage | null;
	artifactType: ArtifactType | null;
	hasTextContent: boolean;
	isStreaming: boolean;
}

function getTextContent(message: UIMessage): string {
	if (!message.parts) return "";
	return message.parts
		.filter(
			(part): part is { type: "text"; text: string } => part.type === "text"
		)
		.map((part) => part.text)
		.join("");
}

export function useChatStatus(
	messages: UIMessage[],
	status: ChatStatus
): ChatStatusResult {
	return useMemo(() => {
		const isLoading = status === "streaming" || status === "submitted";
		const agentStatus: AgentStatus = isLoading ? "generating" : "idle";

		const defaultResult: ChatStatusResult = {
			agentStatus,
			currentToolCall: null,
			toolMessage: null,
			statusMessage: getStatusMessage(agentStatus),
			displayMessage: null,
			artifactStage: null,
			artifactType: null,
			hasTextContent: false,
			isStreaming: isLoading,
		};

		if (messages.length === 0) {
			return { ...defaultResult, displayMessage: defaultResult.statusMessage };
		}

		const lastMessage = messages.at(-1);
		if (lastMessage?.role !== "assistant") {
			return { ...defaultResult, displayMessage: defaultResult.statusMessage };
		}

		const hasTextContent = Boolean(getTextContent(lastMessage).trim());
		const currentToolCall = null; // SDK handles tool calls differently
		const toolMessage = getToolMessage(currentToolCall);
		const statusMessage = getStatusMessage(agentStatus);

		// Priority: tool message > status message, but hide when text is streaming
		let displayMessage: string | null = null;
		if (!hasTextContent && isLoading) {
			displayMessage = toolMessage ?? statusMessage;
		}

		return {
			agentStatus,
			currentToolCall,
			toolMessage,
			statusMessage,
			displayMessage,
			artifactStage: null,
			artifactType: null,
			hasTextContent,
			isStreaming: isLoading,
		};
	}, [messages, status]);
}

export type { AgentStatus, ArtifactStage, ArtifactType };
