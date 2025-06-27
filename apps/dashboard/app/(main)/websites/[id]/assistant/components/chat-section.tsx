"use client";

import {
  BarChart3,
  Brain,
  Hash,
  History,
  MessageSquare,
  RotateCcw,
  Send,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { WebsiteDataTabProps } from "../../_components/utils/types";
import type { Message } from "../types/message";
import { ChatHistorySidebar } from "./chat-history-sidebar";
import { LoadingMessage } from "./loading-message";
import { MessageBubble } from "./message-bubble";

interface ChatSectionProps extends WebsiteDataTabProps {
  messages: Message[];
  inputValue: string;
  setInputValue: (value: string) => void;
  isLoading: boolean;
  isRateLimited: boolean;
  isInitialized: boolean;
  scrollAreaRef: React.RefObject<HTMLDivElement | null>;
  sendMessage: (content?: string) => Promise<void>;
  handleKeyPress: (e: React.KeyboardEvent) => void;
  onResetChat: () => Promise<void>;
  onSelectChat?: (websiteId: string, websiteName?: string) => void;
}

export function ChatSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded border bg-gradient-to-br from-background to-muted/10 shadow-lg backdrop-blur-sm">
      {/* Header Skeleton */}
      <div className="flex flex-shrink-0 items-center justify-between border-b bg-gradient-to-r from-primary/5 to-accent/5 p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div>
            <Skeleton className="mb-2 h-5 w-36" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
        <Skeleton className="h-9 w-9 rounded-md" />
      </div>
      {/* Messages Area Skeleton */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <div className="flex animate-pulse gap-3">
          <Skeleton className="h-9 w-9 flex-shrink-0 rounded-full" />
          <Skeleton className="h-16 w-3/4 rounded-2xl" />
        </div>
        <div className="ml-auto flex animate-pulse flex-row-reverse gap-3 delay-75">
          <Skeleton className="h-9 w-9 flex-shrink-0 rounded-full" />
          <Skeleton className="h-12 w-1/2 rounded-2xl" />
        </div>
        <div className="flex animate-pulse gap-3 delay-150">
          <Skeleton className="h-9 w-9 flex-shrink-0 rounded-full" />
          <Skeleton className="h-20 w-4/5 rounded-2xl" />
        </div>
      </div>
      {/* Input Area Skeleton */}
      <div className="flex-shrink-0 border-t bg-gradient-to-r from-muted/10 to-muted/5 p-4">
        <div className="flex gap-2">
          <Skeleton className="h-11 flex-1 rounded-xl" />
          <Skeleton className="h-11 w-11 rounded-xl" />
        </div>
        <Skeleton className="mt-3 h-3 w-2/3" />
      </div>
    </div>
  );
}

export default function ChatSection({
  websiteData,
  websiteId,
  messages,
  inputValue,
  setInputValue,
  isLoading,
  isRateLimited,
  isInitialized,
  scrollAreaRef,
  sendMessage,
  handleKeyPress,
  onResetChat,
  onSelectChat,
}: ChatSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);

  // Calculate message statistics
  const messageStats = {
    total: messages.length - 1, // Excluding welcome message
    charts: messages.filter((m) => m.responseType === "chart").length,
    metrics: messages.filter((m) => m.responseType === "metric").length,
    text: messages.filter((m) => m.responseType === "text").length,
  };

  const quickQuestions = [
    { text: "Show me page views over the last 7 days", icon: TrendingUp, type: "chart" },
    { text: "How many visitors yesterday?", icon: Hash, type: "metric" },
    { text: "Top traffic sources breakdown", icon: BarChart3, type: "chart" },
    { text: "What's my bounce rate?", icon: Hash, type: "metric" },
  ];

  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current && !isLoading) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  const hasMessages = messages.length > 1;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded border bg-gradient-to-br from-background to-muted/10 shadow-lg backdrop-blur-sm">
      {/* Enhanced Header */}
      <div className="flex flex-shrink-0 items-center justify-between border-b bg-gradient-to-r from-primary/5 to-accent/5 p-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="relative">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20 shadow-sm">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            {isLoading && (
              <div className="-bottom-1 -right-1 absolute flex h-4 w-4 items-center justify-center rounded-full bg-green-500">
                <div className="h-2 w-2 animate-pulse rounded-full bg-white" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="truncate font-semibold text-lg">Nova</h2>
              {hasMessages && (
                <Badge className="px-2 py-0.5 text-xs" variant="secondary">
                  {messageStats.total} {messageStats.total === 1 ? "query" : "queries"}
                </Badge>
              )}
            </div>
            <p className="truncate text-muted-foreground text-sm">
              {isLoading
                ? "Nova is analyzing your data..."
                : `Your AI analytics partner for ${websiteData?.name || "your website"}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            className="h-9 w-9 flex-shrink-0 transition-all duration-200 hover:bg-primary/10 hover:text-primary"
            disabled={isLoading}
            onClick={() => setShowChatHistory(true)}
            size="icon"
            title="Chat history"
            variant="ghost"
          >
            <History className="h-4 w-4" />
          </Button>
          <Button
            className="h-9 w-9 flex-shrink-0 transition-all duration-200 hover:bg-destructive/10 hover:text-destructive"
            disabled={isLoading}
            onClick={onResetChat}
            size="icon"
            title="Reset chat"
            variant="ghost"
          >
            <RotateCcw
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                isLoading && "animate-spin"
              )}
            />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="relative min-h-0 flex-1 overflow-y-auto">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="px-4 py-3">
            {/* Welcome State */}
            {!(hasMessages || isLoading) && isInitialized && (
              <div className="fade-in-0 slide-in-from-bottom-4 animate-in space-y-6 duration-500">
                <div className="py-8 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-accent/10">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="mb-2 font-semibold text-lg">Welcome to Nova</h3>
                  <p className="mx-auto max-w-md text-muted-foreground text-sm">
                    I'm Nova, your AI analytics partner. I can help you understand your website data
                    through charts, metrics, and insights. Just ask me anything!
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="mb-3 flex items-center gap-2 text-muted-foreground text-sm">
                    <Zap className="h-4 w-4" />
                    <span>Try these examples:</span>
                  </div>
                  {quickQuestions.map((question, index) => (
                    <Button
                      className={cn(
                        "h-auto w-full justify-start px-4 py-3 text-left font-normal text-sm",
                        "hover:bg-gradient-to-r hover:from-primary/5 hover:to-accent/5",
                        "border-dashed transition-all duration-300 hover:border-solid",
                        "fade-in-0 slide-in-from-left-2 animate-in"
                      )}
                      disabled={isLoading || isRateLimited || !isInitialized}
                      key={question.text}
                      onClick={() => sendMessage(question.text)}
                      size="sm"
                      style={{ animationDelay: `${index * 100}ms` }}
                      variant="outline"
                    >
                      <question.icon className="mr-3 h-4 w-4 flex-shrink-0 text-primary/70" />
                      <div className="flex-1">
                        <div className="font-medium">{question.text}</div>
                        <div className="text-muted-foreground text-xs capitalize">
                          {question.type} response
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {hasMessages && (
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    className="fade-in-0 slide-in-from-bottom-2 animate-in duration-300"
                    key={message.id}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <MessageBubble message={message} />
                  </div>
                ))}
              </div>
            )}

            {/* Loading Message */}
            {isLoading && (
              <div className="fade-in-0 slide-in-from-bottom-2 mt-4 animate-in duration-300">
                <LoadingMessage />
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Enhanced Input Area */}
      <div className="flex-shrink-0 border-t bg-gradient-to-r from-muted/10 to-muted/5 p-4">
        <div className="relative">
          <div
            className={cn("flex gap-3 transition-all duration-300", inputFocused && "scale-[1.02]")}
          >
            <Input
              className={cn(
                "h-11 flex-1 rounded-xl border-2 bg-background/50 backdrop-blur-sm",
                "placeholder:text-muted-foreground/60",
                "focus:border-primary/30 focus:bg-background/80",
                "transition-all duration-200"
              )}
              disabled={isLoading || isRateLimited}
              onBlur={() => setInputFocused(false)}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onKeyPress={handleKeyPress}
              placeholder={
                isLoading
                  ? "Nova is thinking..."
                  : isRateLimited
                    ? "Rate limited - please wait..."
                    : "Ask Nova about your analytics data..."
              }
              ref={inputRef}
              value={inputValue}
            />
            <Button
              className={cn(
                "h-11 w-11 flex-shrink-0 rounded-xl",
                "bg-gradient-to-r from-primary to-primary/80",
                "hover:from-primary/90 hover:to-primary/70",
                "disabled:from-muted disabled:to-muted",
                "shadow-lg transition-all duration-200",
                (!inputValue.trim() || isRateLimited || !isInitialized) &&
                  !isLoading &&
                  "opacity-50"
              )}
              disabled={!inputValue.trim() || isLoading || isRateLimited || !isInitialized}
              onClick={() => sendMessage()}
              size="icon"
              title="Send message"
            >
              <Send
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  inputValue.trim() && !isLoading && !isRateLimited && "scale-110"
                )}
              />
            </Button>
          </div>

          {/* Helper text */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Sparkles className="h-3 w-3 flex-shrink-0" />
              <span>Ask about trends, comparisons, or specific metrics</span>
            </div>
            {hasMessages && (
              <div className="flex items-center gap-3 text-muted-foreground">
                {messageStats.charts > 0 && (
                  <span className="flex items-center gap-1">
                    <BarChart3 className="h-3 w-3" />
                    {messageStats.charts}
                  </span>
                )}
                {messageStats.metrics > 0 && (
                  <span className="flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    {messageStats.metrics}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat History Sidebar */}
      <ChatHistorySidebar
        currentWebsiteId={websiteId}
        currentWebsiteName={websiteData?.name}
        isOpen={showChatHistory}
        onClose={() => setShowChatHistory(false)}
        onSelectChat={(websiteId, websiteName) => {
          setShowChatHistory(false);
          onSelectChat?.(websiteId, websiteName);
        }}
      />
    </div>
  );
}
