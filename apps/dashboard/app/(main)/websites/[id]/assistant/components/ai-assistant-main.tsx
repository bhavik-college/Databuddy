"use client";

import React, { Suspense, useMemo, useState, useCallback } from "react";
import type { WebsiteDataTabProps } from "../../_components/utils/types";
import { useChat } from "../hooks/use-chat";
import type { Message } from "../types/message";
import ChatSection, { ChatSkeleton } from "./chat-section";
import VisualizationSection, { VisualizationSkeleton } from "./visualization-section";
import { cn } from "@/lib/utils";

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
    .find((m: Message) => m.data && m.chartType && m.type === 'assistant' && m.responseType === 'chart');

  let currentQueryMessage: Message | undefined = undefined;
  if (latestVisualizationMessage) {
    const vizMessageIndex = chat.messages.findIndex(m => m.id === latestVisualizationMessage.id);
    if (vizMessageIndex > -1) {
      for (let i = vizMessageIndex - 1; i >= 0; i--) {
        if (chat.messages[i].type === 'user') {
          currentQueryMessage = chat.messages[i];
          break;
        }
      }
    }
  }

  const shouldShowVisualization = useMemo(() => {
    return latestVisualizationMessage?.data && 
           latestVisualizationMessage?.chartType && 
           latestVisualizationMessage?.responseType === 'chart';
  }, [latestVisualizationMessage]);

  const hasRecentActivity = useMemo(() => {
    return chat.messages.length > 1; // More than just the welcome message
  }, [chat.messages.length]);

  return (
    <div className="flex flex-1 lg:flex-row flex-col gap-3 overflow-hidden">
      <div 
        className={cn(
          "flex flex-col overflow-hidden transition-all duration-500 ease-in-out",
          shouldShowVisualization 
            ? "flex-[3_3_0%]" 
            : "flex-1"
        )}
      >
        <Suspense fallback={<ChatSkeleton />}>
          <ChatSection 
            {...props} 
            websiteId={currentWebsiteId}
            websiteData={{ ...props.websiteData, name: currentWebsiteName }}
            messages={chat.messages}
            inputValue={chat.inputValue}
            setInputValue={chat.setInputValue}
            isLoading={chat.isLoading}
            isRateLimited={chat.isRateLimited}
            isInitialized={chat.isInitialized}
            scrollAreaRef={chat.scrollAreaRef}
            sendMessage={chat.sendMessage}
            handleKeyPress={chat.handleKeyPress}
            onResetChat={chat.resetChat}
            onSelectChat={handleSelectChat}
          />
        </Suspense>
      </div>
      
      {/* Visualization Section - smoothly slides in/out based on need */}
      <div 
        className={cn(
          "flex-col overflow-hidden transition-all duration-500 ease-in-out transform",
          shouldShowVisualization 
            ? "flex flex-[2_2_0%] translate-x-0 opacity-100" 
            : "hidden"
        )}
      >
        <Suspense fallback={<VisualizationSkeleton />}>
          <VisualizationSection 
            {...props} 
            latestVisualization={latestVisualizationMessage}
            currentMessage={currentQueryMessage}
            onQuickInsight={chat.sendMessage}
            hasVisualization={shouldShowVisualization}
          />
        </Suspense>
      </div>
    </div>
  );
} 