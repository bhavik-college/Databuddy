"use client";

import {
  BarChart3,
  Bot,
  Bug,
  ChevronDown,
  ChevronRight,
  Clock,
  Hash,
  LineChart,
  PieChart,
  TrendingUp,
  User,
} from "lucide-react";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import type { Message } from "../types/message";

interface MessageBubbleProps {
  message: Message;
}

const getChartIcon = (chartType: string) => {
  switch (chartType) {
    case "bar":
      return <BarChart3 className="h-4 w-4" />;
    case "line":
      return <LineChart className="h-4 w-4" />;
    case "pie":
      return <PieChart className="h-4 w-4" />;
    default:
      return <BarChart3 className="h-4 w-4" />;
  }
};

export function MessageBubble({ message }: MessageBubbleProps) {
  const [showThinking, setShowThinking] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  return (
    <div
      className={cn(
        "fade-in-0 slide-in-from-bottom-2 flex w-full animate-in gap-3 duration-300",
        message.type === "user" ? "justify-end" : "justify-start"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full shadow-sm",
          message.type === "user"
            ? "order-2 bg-primary text-primary-foreground"
            : "order-1 border bg-muted"
        )}
      >
        {message.type === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Message Content */}
      <div
        className={cn(
          "min-w-0 max-w-[85%] rounded-lg px-4 py-3 shadow-sm",
          message.type === "user"
            ? "order-1 bg-primary text-primary-foreground"
            : "order-2 border bg-muted/70"
        )}
      >
        {/* Main message text */}
        <div className="overflow-wrap-anywhere whitespace-pre-wrap break-words text-sm leading-relaxed">
          {message.content}
        </div>

        {/* Metric Display */}
        {message.responseType === "metric" &&
          message.metricValue !== undefined &&
          message.type === "assistant" && (
            <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Hash className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-muted-foreground text-xs uppercase tracking-wide">
                    {message.metricLabel || "Result"}
                  </div>
                  <div className="mt-1 break-words font-bold text-2xl text-foreground">
                    {typeof message.metricValue === "number"
                      ? message.metricValue.toLocaleString()
                      : message.metricValue}
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* Thinking Steps */}
        {message.thinkingSteps &&
          message.thinkingSteps.length > 0 &&
          message.type === "assistant" && (
            <div className="mt-3 border-border/30 border-t pt-3">
              <button
                className="flex items-center gap-2 text-muted-foreground text-xs transition-colors hover:text-foreground"
                onClick={() => setShowThinking(!showThinking)}
                type="button"
              >
                {showThinking ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
                <Clock className="h-3 w-3" />
                <span>Thinking process ({message.thinkingSteps.length} steps)</span>
              </button>

              {showThinking && (
                <div className="slide-in-from-top-1 mt-2 animate-in space-y-1 duration-200">
                  {message.thinkingSteps.map((step, index) => (
                    <div
                      className="py-1 pl-5 text-muted-foreground text-xs"
                      key={`thinking-${index}-${step.slice(0, 20)}`}
                    >
                      {step}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        {/* Visualization Indicator */}
        {message.hasVisualization && message.type === "assistant" && (
          <div className="mt-3 border-border/30 border-t pt-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              {getChartIcon(message.chartType || "bar")}
              <span>Visualization available in the data panel →</span>
            </div>
          </div>
        )}

        {/* Debug Information */}
        {message.debugInfo && message.type === "assistant" && (
          <div className="mt-3 border-border/30 border-t pt-3">
            <button
              className="flex items-center gap-2 text-muted-foreground text-xs transition-colors hover:text-foreground"
              onClick={() => setShowDebug(!showDebug)}
              type="button"
            >
              {showDebug ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              <Bug className="h-3 w-3" />
              <span>Debug info</span>
            </button>

            {showDebug && (
              <div className="slide-in-from-top-1 mt-2 animate-in duration-200">
                <pre className="overflow-x-auto rounded border bg-background/50 p-2 text-xs">
                  {JSON.stringify(message.debugInfo, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Timestamp */}
        <div className="mt-3 font-mono text-xs opacity-60">
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}
