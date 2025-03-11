"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Shield, Copy, Check, Code, FileCode, Info } from "lucide-react";
import { toast } from "sonner";

interface TrackingGuideProps {
  trackingId: string;
  websiteUrl: string;
}

export function TrackingGuide({ trackingId, websiteUrl }: TrackingGuideProps) {
  const [copied, setCopied] = useState(false);
  const trackingScriptUrl = `/api/tracking?id=${trackingId}`;
  
  const scriptTag = `<script async defer src="${window.location.origin}${trackingScriptUrl}"></script>`;
  
  const handleCopy = () => {
    navigator.clipboard.writeText(scriptTag);
    setCopied(true);
    toast.success("Tracking script copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };
  
  const customEventExample = `
// Track a custom event
window.databuddy.trackEvent('signup_completed', {
  plan: 'premium',
  referrer: 'homepage'
});
  `.trim();
  
  return (
    <Card className="border-slate-800 bg-slate-900">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-emerald-400" />
          <CardTitle className="text-xl">Privacy-Focused Tracking</CardTitle>
        </div>
        <CardDescription>
          Implement our tracking script to collect anonymous analytics without cookies
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="install">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="install">Installation</TabsTrigger>
            <TabsTrigger value="features">Privacy Features</TabsTrigger>
            <TabsTrigger value="events">Custom Events</TabsTrigger>
          </TabsList>
          
          <TabsContent value="install" className="space-y-4">
            <div className="bg-slate-800 p-4 rounded-md">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-slate-400">Add this script to your website&apos;s <code>&lt;head&gt;</code> section:</div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleCopy}
                  className="h-8 gap-1 text-xs"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <pre className="bg-slate-950 p-3 rounded text-sm overflow-x-auto">
                <code className="text-sky-400">{scriptTag}</code>
              </pre>
            </div>
            
            <div className="flex items-start gap-3 bg-slate-800/50 p-3 rounded-md">
              <Info className="h-5 w-5 text-sky-400 mt-0.5" />
              <div className="text-sm">
                <p className="text-slate-300 mb-1">
                  This script automatically tracks:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-400">
                  <li>Page views</li>
                  <li>Visit duration</li>
                  <li>User interactions</li>
                  <li>Bounce rate</li>
                </ul>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="features" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  icon: <Shield className="h-4 w-4 text-emerald-400" />,
                  title: "No Cookies",
                  description: "Our tracking doesn't use cookies or similar technologies"
                },
                {
                  icon: <Code className="h-4 w-4 text-emerald-400" />,
                  title: "Respects DNT",
                  description: "Automatically honors Do Not Track browser settings"
                },
                {
                  icon: <FileCode className="h-4 w-4 text-emerald-400" />,
                  title: "IP Anonymization",
                  description: "All IP addresses are anonymized before storage"
                },
                {
                  icon: <Info className="h-4 w-4 text-emerald-400" />,
                  title: "Opt-Out API",
                  description: "Built-in API for users to opt out of tracking"
                }
              ].map((feature, index) => (
                <div key={index} className="flex items-start gap-2 bg-slate-800/70 p-3 rounded-md">
                  <div className="mt-0.5">{feature.icon}</div>
                  <div>
                    <h4 className="text-sm font-medium text-white">{feature.title}</h4>
                    <p className="text-xs text-slate-400">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-slate-800/50 p-3 rounded-md">
              <h4 className="text-sm font-medium mb-2">Opt-Out Implementation</h4>
              <p className="text-xs text-slate-400 mb-2">
                You can add an opt-out toggle to your privacy page with this code:
              </p>
              <pre className="bg-slate-950 p-3 rounded text-xs overflow-x-auto">
                <code className="text-sky-400">{`
// Add a toggle button that calls these functions
window.databuddy.optOut();  // To opt out
window.databuddy.optIn();   // To opt back in
                `.trim()}</code>
              </pre>
              <p className="text-xs text-slate-400 mt-2">
                We also provide a React component you can import from our NPM package.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="events" className="space-y-4">
            <div className="bg-slate-800 p-4 rounded-md">
              <h4 className="text-sm font-medium mb-2">Track Custom Events</h4>
              <p className="text-xs text-slate-400 mb-2">
                You can track custom events to measure specific user actions:
              </p>
              <pre className="bg-slate-950 p-3 rounded text-sm overflow-x-auto">
                <code className="text-sky-400">{customEventExample}</code>
              </pre>
            </div>
            
            <div className="bg-slate-800/50 p-3 rounded-md">
              <h4 className="text-sm font-medium mb-2">Common Event Examples</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  {
                    name: "signup_completed",
                    data: "{ plan: 'premium' }"
                  },
                  {
                    name: "purchase_completed",
                    data: "{ amount: 99.99, productId: 'xyz123' }"
                  },
                  {
                    name: "article_read",
                    data: "{ articleId: '123', category: 'tech' }"
                  },
                  {
                    name: "video_played",
                    data: "{ videoId: 'abc', duration: 120 }"
                  }
                ].map((event, index) => (
                  <div key={index} className="bg-slate-900 p-2 rounded text-xs">
                    <code className="text-emerald-400">
                      {`databuddy.trackEvent('${event.name}', ${event.data});`}
                    </code>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 