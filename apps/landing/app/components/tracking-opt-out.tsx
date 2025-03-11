"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Info } from "lucide-react";

export function TrackingOptOut() {
  const [isOptedOut, setIsOptedOut] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Check localStorage on component mount
  useEffect(() => {
    const optOutStatus = localStorage.getItem("databuddy_opt_out");
    setIsOptedOut(optOutStatus === "true");
  }, []);

  const handleOptOutChange = (checked: boolean) => {
    if (checked) {
      // Opt out
      localStorage.setItem("databuddy_opt_out", "true");
      if (window.databuddy && typeof window.databuddy.optOut === "function") {
        window.databuddy.optOut();
      }
    } else {
      // Opt in
      localStorage.removeItem("databuddy_opt_out");
      if (window.databuddy && typeof window.databuddy.optIn === "function") {
        window.databuddy.optIn();
      }
    }
    setIsOptedOut(checked);
  };

  return (
    <Card className="w-full max-w-md bg-slate-900 border-slate-800 text-slate-200">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-emerald-400" />
          <CardTitle className="text-lg">Privacy Preferences</CardTitle>
        </div>
        <CardDescription className="text-slate-400">
          Control how we collect anonymous usage data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="font-medium">Analytics Tracking</div>
            <div className="text-sm text-slate-400">
              {isOptedOut
                ? "You've opted out of anonymous analytics"
                : "We collect anonymous usage data to improve our service"}
            </div>
          </div>
          <Switch
            checked={isOptedOut}
            onCheckedChange={handleOptOutChange}
            aria-label="Toggle analytics tracking"
          />
        </div>

        <Button
          variant="link"
          className="text-slate-400 p-0 h-auto"
          onClick={() => setShowDetails(!showDetails)}
        >
          <Info className="h-4 w-4 mr-1" />
          {showDetails ? "Hide details" : "What data do we collect?"}
        </Button>

        {showDetails && (
          <div className="text-sm text-slate-400 bg-slate-800 p-3 rounded-md">
            <p className="mb-2">
              Our analytics collects anonymous information about:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Pages you visit</li>
              <li>Time spent on pages</li>
              <li>Browser and device type</li>
              <li>Screen size</li>
              <li>Referrer (where you came from)</li>
            </ul>
            <p className="mt-2">
              We <strong>do not</strong> collect personally identifiable information or use cookies for tracking.
              Your data is anonymized and cannot be traced back to you individually.
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t border-slate-800 pt-4">
        <p className="text-xs text-slate-500">
          We respect your privacy. You can change these settings at any time.
          Opting out will stop all analytics collection on this device.
        </p>
      </CardFooter>
    </Card>
  );
}

// Add TypeScript declaration for the databuddy global object
declare global {
  interface Window {
    databuddy?: {
      trackEvent: (eventName: string, eventData?: Record<string, any>) => void;
      optOut: () => void;
      optIn: () => void;
    };
  }
} 