"use client";

import type React from "react";
import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Send, Sparkles, MessageSquare, RotateCcw, Zap, Brain, TrendingUp, BarChart3, Hash, History } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WebsiteDataTabProps } from "../../_components/utils/types";
import type { Message } from "../types/message";
import { MessageBubble } from "./message-bubble";
import { LoadingMessage } from "./loading-message";
import { ChatHistorySidebar } from "./chat-history-sidebar";

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
    <div className="flex flex-col h-full bg-gradient-to-br from-background to-muted/10 border rounded shadow-lg overflow-hidden backdrop-blur-sm">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/5 to-accent/5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div>
            <Skeleton className="h-5 w-36 mb-2" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
        <Skeleton className="h-9 w-9 rounded-md" />
      </div>
      {/* Messages Area Skeleton */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        <div className="flex gap-3 animate-pulse">
          <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
          <Skeleton className="h-16 w-3/4 rounded-2xl" />
        </div>
        <div className="flex gap-3 ml-auto flex-row-reverse animate-pulse delay-75">
          <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
          <Skeleton className="h-12 w-1/2 rounded-2xl" />
        </div>
        <div className="flex gap-3 animate-pulse delay-150">
          <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
          <Skeleton className="h-20 w-4/5 rounded-2xl" />
        </div>
      </div>
      {/* Input Area Skeleton */}
      <div className="p-4 border-t bg-gradient-to-r from-muted/10 to-muted/5 flex-shrink-0">
        <div className="flex gap-2">
          <Skeleton className="h-11 flex-1 rounded-xl" />
          <Skeleton className="h-11 w-11 rounded-xl" />
        </div>
        <Skeleton className="h-3 w-2/3 mt-3" />
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
  onSelectChat
}: ChatSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);

  // Calculate message statistics
  const messageStats = {
    total: messages.length - 1, // Excluding welcome message
    charts: messages.filter(m => m.responseType === 'chart').length,
    metrics: messages.filter(m => m.responseType === 'metric').length,
    text: messages.filter(m => m.responseType === 'text').length
  };

  const quickQuestions = [
    { text: "Show me page views over the last 7 days", icon: TrendingUp, type: "chart" },
    { text: "How many visitors yesterday?", icon: Hash, type: "metric" },
    { text: "Top traffic sources breakdown", icon: BarChart3, type: "chart" },
    { text: "What's my bounce rate?", icon: Hash, type: "metric" }
  ];

  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current && !isLoading) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  const hasMessages = messages.length > 1;

  return (
    <div className="flex flex-col flex-1 bg-gradient-to-br from-background to-muted/10 border rounded shadow-lg overflow-hidden min-h-0 backdrop-blur-sm">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/5 to-accent/5 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0 shadow-sm">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            {isLoading && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-lg truncate">Nova</h2>
              {hasMessages && (
                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                  {messageStats.total} {messageStats.total === 1 ? 'query' : 'queries'}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {isLoading ? 'Nova is analyzing your data...' : `Your AI analytics partner for ${websiteData?.name || 'your website'}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowChatHistory(true)}
            className="h-9 w-9 flex-shrink-0 hover:bg-primary/10 hover:text-primary transition-all duration-200"
            title="Chat history"
            disabled={isLoading}
          >
            <History className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onResetChat}
            className="h-9 w-9 flex-shrink-0 hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
            title="Reset chat"
            disabled={isLoading}
          >
            <RotateCcw className={cn("h-4 w-4 transition-transform duration-200", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto min-h-0 relative">
        <ScrollArea ref={scrollAreaRef} className="h-full">
          <div className="px-4 py-3">
            {/* Welcome State */}
            {!hasMessages && !isLoading && isInitialized && (
              <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Welcome to Nova</h3>
                  <p className="text-muted-foreground text-sm max-w-md mx-auto">
                    I'm Nova, your AI analytics partner. I can help you understand your website data through charts, metrics, and insights. Just ask me anything!
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Zap className="h-4 w-4" />
                    <span>Try these examples:</span>
                  </div>
                  {quickQuestions.map((question, index) => (
                    <Button
                      key={question.text}
                      variant="outline"
                      size="sm"
                      className={cn(
                        "w-full text-left justify-start h-auto py-3 px-4 text-sm font-normal",
                        "hover:bg-gradient-to-r hover:from-primary/5 hover:to-accent/5",
                        "border-dashed hover:border-solid transition-all duration-300",
                        "animate-in fade-in-0 slide-in-from-left-2"
                      )}
                      style={{ animationDelay: `${index * 100}ms` }}
                      onClick={() => sendMessage(question.text)}
                      disabled={isLoading || isRateLimited || !isInitialized}
                    >
                      <question.icon className="h-4 w-4 mr-3 flex-shrink-0 text-primary/70" />
                      <div className="flex-1">
                        <div className="font-medium">{question.text}</div>
                        <div className="text-xs text-muted-foreground capitalize">{question.type} response</div>
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
                    key={message.id}
                    className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <MessageBubble message={message} />
                  </div>
                ))}
              </div>
            )}
            
            {/* Loading Message */}
            {isLoading && (
              <div className="mt-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                <LoadingMessage />
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
        
      {/* Enhanced Input Area */}
      <div className="p-4 border-t bg-gradient-to-r from-muted/10 to-muted/5 flex-shrink-0">
        <div className="relative">
          <div className={cn(
            "flex gap-3 transition-all duration-300",
            inputFocused && "scale-[1.02]"
          )}>
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder={
                isLoading ? "Nova is thinking..." : 
                isRateLimited ? "Rate limited - please wait..." :
                "Ask Nova about your analytics data..."
              }
              disabled={isLoading || isRateLimited}
              className={cn(
                "flex-1 h-11 rounded-xl border-2 bg-background/50 backdrop-blur-sm",
                "placeholder:text-muted-foreground/60",
                "focus:border-primary/30 focus:bg-background/80",
                "transition-all duration-200"
              )}
            />
            <Button
              onClick={() => sendMessage()}
              disabled={!inputValue.trim() || isLoading || isRateLimited || !isInitialized}
              size="icon"
              className={cn(
                "h-11 w-11 flex-shrink-0 rounded-xl",
                "bg-gradient-to-r from-primary to-primary/80",
                "hover:from-primary/90 hover:to-primary/70",
                "disabled:from-muted disabled:to-muted",
                "transition-all duration-200 shadow-lg",
                (!inputValue.trim() || isRateLimited || !isInitialized) && !isLoading && "opacity-50"
              )}
              title="Send message"
            >
              <Send className={cn(
                "h-4 w-4 transition-transform duration-200",
                inputValue.trim() && !isLoading && !isRateLimited && "scale-110"
              )} />
            </Button>
          </div>
          
          {/* Helper text */}
          <div className="flex flex-wrap items-center justify-between mt-3 text-xs gap-2">
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