"use client";

import { PaperclipIcon, RobotIcon } from "@phosphor-icons/react";
import type { UIMessage } from "ai";
import { useSetAtom } from "jotai";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
	type AgentArtifact,
	agentCanvasOpenAtom,
	currentArtifactAtom,
} from "./agent-atoms";
import { AgentMessageActions } from "./agent-message-actions";

interface AgentMessagesProps {
	messages: UIMessage[];
	isStreaming?: boolean;
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

export function AgentMessages({
	messages,
	isStreaming = false,
}: AgentMessagesProps) {
	if (messages.length === 0) return null;

	return (
		<div className="space-y-4">
			{messages.map((message, index) => {
				const isLastMessage = index === messages.length - 1;
				const isMessageFinished = !(isLastMessage && isStreaming);
				const isAssistant = message.role === "assistant";
				const content = getTextContent(message);

				return (
					<div className="group" key={message.id}>
						<MessageBubble
							content={content}
							isFinished={isMessageFinished}
							isStreaming={isLastMessage && isStreaming}
							role={message.role}
						/>

						{isAssistant && isMessageFinished && content && (
							<div className="mt-2 opacity-0 transition-opacity group-hover:opacity-100">
								<AgentMessageActions messageContent={content} />
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
}

interface MessageBubbleProps {
	content: string;
	role: string;
	isFinished: boolean;
	isStreaming: boolean;
}

function MessageBubble({
	content,
	role,
	isFinished,
	isStreaming,
}: MessageBubbleProps) {
	const isUser = role === "user";
	const showStreamingIndicator = isStreaming && !content;

	if (isUser) {
		return (
			<div className="flex justify-end gap-3">
				<div className="max-w-[80%] rounded border bg-primary/5 p-3">
					<p className="text-sm">{content}</p>
				</div>
				<UserAvatar />
			</div>
		);
	}

	return (
		<div className="flex gap-3">
			<AgentAvatar />
			<div className="max-w-[80%] flex-1">
				<div className="rounded border bg-sidebar p-3">
					{showStreamingIndicator ? (
						<StreamingIndicator />
					) : (
						<div className="prose prose-sm dark:prose-invert max-w-none">
							<p className="whitespace-pre-wrap text-sm leading-relaxed">
								{content}
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

function UserAvatar() {
	return (
		<Avatar className="size-8 shrink-0 border">
			<AvatarImage src="" />
			<AvatarFallback className="bg-accent text-foreground/70 text-xs">
				U
			</AvatarFallback>
		</Avatar>
	);
}

function AgentAvatar() {
	return (
		<Avatar className="size-8 shrink-0 border">
			<AvatarFallback className="bg-primary/10">
				<RobotIcon className="size-4 text-primary" weight="duotone" />
			</AvatarFallback>
		</Avatar>
	);
}

function StreamingIndicator() {
	return (
		<div className="flex items-center gap-1">
			<span className="size-1.5 animate-pulse rounded-full bg-primary" />
			<span className="size-1.5 animate-pulse rounded-full bg-primary [animation-delay:150ms]" />
			<span className="size-1.5 animate-pulse rounded-full bg-primary [animation-delay:300ms]" />
		</div>
	);
}

interface ArtifactPreviewProps {
	artifact: AgentArtifact;
}

function ArtifactPreview({ artifact }: ArtifactPreviewProps) {
	const setCanvasOpen = useSetAtom(agentCanvasOpenAtom);
	const setCurrentArtifact = useSetAtom(currentArtifactAtom);

	const handleClick = () => {
		setCurrentArtifact(artifact);
		setCanvasOpen(true);
	};

	return (
		<button
			className={cn(
				"flex items-center gap-2 rounded border bg-accent/30 px-2 py-1",
				"text-xs transition-colors hover:bg-accent/50"
			)}
			onClick={handleClick}
			type="button"
		>
			<span className="text-foreground/60 capitalize">{artifact.type}</span>
			<span className="truncate text-foreground/80">{artifact.title}</span>
		</button>
	);
}

interface FileAttachmentProps {
	file: {
		url?: string;
		mediaType?: string;
		filename?: string;
	};
}

export function FileAttachment({ file }: FileAttachmentProps) {
	const isImage = file.mediaType?.startsWith("image/");

	if (isImage && file.url) {
		return (
			<div className="relative overflow-hidden rounded border">
				<Image
					alt={file.filename ?? "attachment"}
					className="max-h-48 max-w-xs object-cover"
					height={192}
					src={file.url}
					unoptimized
					width={300}
				/>
			</div>
		);
	}

	return (
		<div className="flex items-center gap-2 rounded border bg-muted/50 px-3 py-2">
			<PaperclipIcon
				className="size-4 shrink-0 text-muted-foreground"
				weight="duotone"
			/>
			<span className="font-medium text-sm">
				{file.filename ?? "Unknown file"}
			</span>
		</div>
	);
}

export function MessagesLoadingSkeleton() {
	return (
		<div className="space-y-4">
			<div className="flex justify-end gap-3">
				<div className="max-w-[60%] rounded border bg-primary/5 p-3">
					<Skeleton className="h-4 w-32" />
				</div>
				<Skeleton className="size-8 rounded-full" />
			</div>
			<div className="flex gap-3">
				<Skeleton className="size-8 shrink-0 rounded-full" />
				<div className="flex-1 space-y-2 rounded border bg-sidebar p-3">
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-3/4" />
					<Skeleton className="h-4 w-1/2" />
				</div>
			</div>
		</div>
	);
}
