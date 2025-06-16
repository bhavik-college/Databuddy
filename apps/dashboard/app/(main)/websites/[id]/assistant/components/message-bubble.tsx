"use client";

import React, { useState } from "react";
import { Bot, User, BarChart3, LineChart, PieChart, ChevronDown, ChevronRight, Bug, Clock, TrendingUp, Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message } from "../types/message";

interface MessageBubbleProps {
  message: Message;
}

const getChartIcon = (chartType: string) => {
  switch (chartType) {
    case 'bar': return <BarChart3 className="h-4 w-4" />;
    case 'line': return <LineChart className="h-4 w-4" />;
    case 'pie': return <PieChart className="h-4 w-4" />;
    default: return <BarChart3 className="h-4 w-4" />;
  }
};

export function MessageBubble({ message }: MessageBubbleProps) {
  const [showThinking, setShowThinking] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  
  return (
    <div
      className={cn(
        "flex gap-3 w-full animate-in fade-in-0 slide-in-from-bottom-2 duration-300",
        message.type === 'user' ? "justify-end" : "justify-start"
      )}
    >
      {/* Avatar */}
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm",
        message.type === 'user' 
          ? "bg-primary text-primary-foreground order-2" 
          : "bg-muted border order-1"
      )}>
        {message.type === 'user' ? (
          <User className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>
      
      {/* Message Content */}
      <div className={cn(
        "rounded-lg px-4 py-3 shadow-sm min-w-0 max-w-[85%]",
        message.type === 'user'
          ? "bg-primary text-primary-foreground order-1"
          : "bg-muted/70 border order-2"
      )}>
        {/* Main message text */}
        <div className="text-sm whitespace-pre-wrap break-words leading-relaxed overflow-wrap-anywhere">
          {message.content}
        </div>
        
        {/* Metric Display */}
        {message.responseType === 'metric' && message.metricValue !== undefined && message.type === 'assistant' && (
          <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Hash className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
                  {message.metricLabel || 'Result'}
                </div>
                <div className="text-2xl font-bold text-foreground mt-1 break-words">
                  {typeof message.metricValue === 'number' 
                    ? message.metricValue.toLocaleString() 
                    : message.metricValue}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Thinking Steps */}
        {message.thinkingSteps && message.thinkingSteps.length > 0 && message.type === 'assistant' && (
          <div className="mt-3 pt-3 border-t border-border/30">
            <button
              type="button"
              onClick={() => setShowThinking(!showThinking)}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showThinking ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              <Clock className="h-3 w-3" />
              <span>Thinking process ({message.thinkingSteps.length} steps)</span>
            </button>
            
            {showThinking && (
              <div className="mt-2 space-y-1 animate-in slide-in-from-top-1 duration-200">
                {message.thinkingSteps.map((step, index) => (
                  <div key={`thinking-${index}-${step.slice(0, 20)}`} className="text-xs text-muted-foreground pl-5 py-1">
                    {step}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Visualization Indicator */}
        {message.hasVisualization && message.type === 'assistant' && (
          <div className="mt-3 pt-3 border-t border-border/30">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {getChartIcon(message.chartType || 'bar')}
              <span>Visualization available in the data panel →</span>
            </div>
          </div>
        )}
        
        {/* Debug Information */}
        {message.debugInfo && message.type === 'assistant' && (
          <div className="mt-3 pt-3 border-t border-border/30">
            <button
              type="button"
              onClick={() => setShowDebug(!showDebug)}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showDebug ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              <Bug className="h-3 w-3" />
              <span>Debug info</span>
            </button>
            
            {showDebug && (
              <div className="mt-2 animate-in slide-in-from-top-1 duration-200">
                <pre className="text-xs bg-background/50 rounded p-2 overflow-x-auto border">
                  {JSON.stringify(message.debugInfo, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
        
        {/* Timestamp */}
        <div className="text-xs opacity-60 mt-3 font-mono">
          {message.timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    </div>
  );
} 