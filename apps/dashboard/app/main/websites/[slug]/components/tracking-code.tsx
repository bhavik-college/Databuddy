"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, Code } from "lucide-react";
import { useClipboard } from "../hooks";

interface TrackingCodeProps {
  trackingId: string;
}

export function TrackingCode({ trackingId }: TrackingCodeProps) {
  const { copied, copyToClipboard } = useClipboard();
  const trackingScriptUrl = `/api/tracking?id=${trackingId}`;
  
  const scriptTag = `<script src="${typeof window !== 'undefined' ? window.location.origin : 'https://www.databuddy.cc'}${trackingScriptUrl}" async></script>`;
  
  const handleCopy = () => {
    copyToClipboard(scriptTag, "Tracking script copied to clipboard");
  };
  
  return (
    <Card className="bg-slate-900/80 border-slate-800/80 backdrop-blur-sm mb-6">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2 text-base">
            <Code className="h-4 w-4 text-sky-400" />
            Tracking Code
          </CardTitle>
          <Button 
            onClick={handleCopy}
            size="sm"
            variant="outline"
            className="h-8 gap-1 text-xs border-slate-700 hover:bg-slate-800"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy Code
              </>
            )}
          </Button>
        </div>
        <CardDescription className="text-slate-400 text-xs">
          Add this code to your website to start tracking analytics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-slate-950 border border-slate-800 rounded-md p-3 font-mono text-xs text-slate-300 overflow-x-auto">
          {scriptTag}
        </div>
        <p className="text-xs text-slate-400 mt-3">
          Add this script tag to the <code className="bg-slate-800 px-1 py-0.5 rounded text-xs">&lt;head&gt;</code> section of your website to start collecting analytics data.
        </p>
      </CardContent>
    </Card>
  );
} 