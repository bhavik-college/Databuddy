"use client";

import React, { Suspense, useCallback, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { WebsiteDataTabProps } from "../../_components/utils/types";
import { useChat } from "../hooks/use-chat";
import type { Message } from "../types/message";
import ChatSection, { ChatSkeleton } from "./chat-section";
import VisualizationSection, { VisualizationSkeleton } from "./visualization-section";

export default function AIAssistantMain(props: WebsiteDataTabProps) {
  const [currentWebsiteId, setCurrentWebsiteId] = useState(props.websiteId);
  const [currentWebsiteName, setCurrentWebsiteName] = useState(props.websiteData?.name);
  const chat = useChat(currentWebsiteId, currentWebsiteName);

  const handleSelectChat = useCallback((websiteId: string, websiteName?: string) => {
    setCurrentWebsiteId(websiteId);
    setCurrentWebsiteName(websiteName);
  }, []);

  const latestVisualizationMessage = chat.messages
    .slice()
    .reverse()
    .find(
      (m: Message) => m.data && m.chartType && m.type === "assistant" && m.responseType === "chart"
    );

  let currentQueryMessage: Message | undefined;
  if (latestVisualizationMessage) {
    const vizMessageIndex = chat.messages.findIndex((m) => m.id === latestVisualizationMessage.id);
    if (vizMessageIndex > -1) {
      for (let i = vizMessageIndex - 1; i >= 0; i--) {
        if (chat.messages[i].type === "user") {
          currentQueryMessage = chat.messages[i];
          break;
        }
      }
    }
  }

  const shouldShowVisualization = useMemo(() => {
    return (
      latestVisualizationMessage?.data &&
      latestVisualizationMessage?.chartType &&
      latestVisualizationMessage?.responseType === "chart"
    );
  }, [latestVisualizationMessage]);

  const hasRecentActivity = useMemo(() => {
    return chat.messages.length > 1; // More than just the welcome message
  }, [chat.messages.length]);

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-hidden lg:flex-row">
      <div
        className={cn(
          "flex flex-col overflow-hidden transition-all duration-500 ease-in-out",
          shouldShowVisualization ? "flex-[3_3_0%]" : "flex-1"
        )}
      >
        <Suspense fallback={<ChatSkeleton />}>
          <ChatSection
            {...props}
            handleKeyPress={chat.handleKeyPress}
            inputValue={chat.inputValue}
            isInitialized={chat.isInitialized}
            isLoading={chat.isLoading}
            isRateLimited={chat.isRateLimited}
            messages={chat.messages}
            onResetChat={chat.resetChat}
            onSelectChat={handleSelectChat}
            scrollAreaRef={chat.scrollAreaRef}
            sendMessage={chat.sendMessage}
            setInputValue={chat.setInputValue}
            websiteData={{ ...props.websiteData, name: currentWebsiteName }}
            websiteId={currentWebsiteId}
          />
        </Suspense>
      </div>

      {/* Visualization Section - smoothly slides in/out based on need */}
      <div
        className={cn(
          "transform flex-col overflow-hidden transition-all duration-500 ease-in-out",
          shouldShowVisualization ? "flex flex-[2_2_0%] translate-x-0 opacity-100" : "hidden"
        )}
      >
        <Suspense fallback={<VisualizationSkeleton />}>
          <VisualizationSection
            {...props}
            currentMessage={currentQueryMessage}
            hasVisualization={shouldShowVisualization}
            latestVisualization={latestVisualizationMessage}
            onQuickInsight={chat.sendMessage}
          />
        </Suspense>
      </div>
    </div>
  );
}
