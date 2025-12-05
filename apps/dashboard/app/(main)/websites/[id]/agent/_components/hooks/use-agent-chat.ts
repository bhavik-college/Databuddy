"use client";

import { useChat, useChatActions } from "@ai-sdk-tools/store";
import type { UIMessage } from "ai";
import { DefaultChatTransport, generateId } from "ai";
import { useSetAtom } from "jotai";
import { useParams } from "next/navigation";
import { useCallback, useMemo, useRef } from "react";
import { agentInputAtom } from "../agent-atoms";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export function useAgentChat() {
	const params = useParams();
	const websiteId = params.id as string;
	const chatIdRef = useRef(generateId());
	const setInput = useSetAtom(agentInputAtom);

	const transport = useMemo(
		() =>
			new DefaultChatTransport({
				api: `${API_URL}/v1/agent/chat`,
				credentials: "include",
				prepareSendMessagesRequest({ messages, id }) {
					const lastMessage = messages.at(-1);
					return {
						body: {
							id,
							websiteId,
							message: lastMessage,
							timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
						},
					};
				},
			}),
		[websiteId]
	);

	const { messages, status } = useChat<UIMessage>({
		id: chatIdRef.current,
		transport,
	});

	const {
		sendMessage: sdkSendMessage,
		reset: sdkReset,
		stop: sdkStop,
	} = useChatActions();

	const sendMessage = useCallback(
		(
			content: string,
			metadata?: { agentChoice?: string; toolChoice?: string }
		) => {
			if (!content.trim()) return;

			setInput("");

			sdkSendMessage({
				text: content.trim(),
				metadata,
			});
		},
		[sdkSendMessage, setInput]
	);

	const reset = useCallback(() => {
		sdkReset();
		setInput("");
		chatIdRef.current = generateId();
	}, [sdkReset, setInput]);

	const stop = useCallback(() => {
		sdkStop();
	}, [sdkStop]);

	const isLoading = status === "streaming" || status === "submitted";

	return {
		messages,
		status,
		isLoading,
		sendMessage,
		stop,
		reset,
	};
}
