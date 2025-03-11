"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

export function useClipboard(timeout = 2000) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = useCallback(
    async (text: string, successMessage = "Copied to clipboard") => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success(successMessage);
        
        // Reset copied state after timeout
        setTimeout(() => {
          setCopied(false);
        }, timeout);
        
        return true;
      } catch (error) {
        console.error("Failed to copy:", error);
        toast.error("Failed to copy to clipboard");
        return false;
      }
    },
    [timeout]
  );

  return {
    copied,
    copyToClipboard,
  };
} 