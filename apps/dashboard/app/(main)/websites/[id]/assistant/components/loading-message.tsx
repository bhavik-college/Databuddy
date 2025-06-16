"use client";

import React from "react";
import { Bot } from "lucide-react";

export function LoadingMessage() {
  return (
    <div className="flex gap-3 max-w-[85%]">
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-1">
        <Bot className="h-4 w-4" />
      </div>
      <div className="bg-muted rounded-lg px-4 py-3 mr-2">
        <div className="flex items-center gap-2 text-sm">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
          </div>
          <span className="text-muted-foreground">Nova is analyzing...</span>
        </div>
      </div>
    </div>
  );
} 