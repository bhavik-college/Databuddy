"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { WebsiteDataTabProps } from "../utils/types";
import { Check, Clipboard, Code, ExternalLink, Globe, Info, Laptop, Settings2, Zap, HelpCircle, ChevronRight, AlertCircle, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { WebsiteDialog } from "@/components/website-dialog";
import { updateWebsite } from "@/app/actions/websites";
import { queryClient } from "@/app/providers";

interface WebsiteFormData {
  name?: string;
  domain?: string;
}

interface TrackingOptions {
  trackErrors: boolean;
  trackPerformance: boolean;
  trackWebVitals: boolean;
  trackOutgoingLinks: boolean;
  trackScreenViews: boolean;
  trackSessions: boolean;
  trackInteractions: boolean;
}

// Define the library defaults as a constant so we can reuse it
const LIBRARY_DEFAULTS: TrackingOptions = {
  trackErrors: false,
  trackPerformance: false,
  trackWebVitals: false,
  trackOutgoingLinks: false,
  trackScreenViews: true, // Default is true
  trackSessions: false,
  trackInteractions: false,
};

export function WebsiteSettingsTab({
  websiteId,
  websiteData,
}: WebsiteDataTabProps) {
  const [copied, setCopied] = useState(false);
  const [installMethod, setInstallMethod] = useState<"script" | "npm">("script");
  
  // Initialize with library defaults including trackScreenViews as true
  const [trackingOptions, setTrackingOptions] = useState<TrackingOptions>({...LIBRARY_DEFAULTS});
  
  // Set up useEffect to ensure trackScreenViews is always true on initial load
  useEffect(() => {
    setTrackingOptions(prev => ({
      ...prev,
      trackScreenViews: true
    }));
  }, []);
  
  // Generate tracking code based on selected options and library defaults
  const generateScriptTag = () => {
    // Only include options that differ from defaults
    const options = Object.entries(trackingOptions)
      .filter(([key, value]) => value !== LIBRARY_DEFAULTS[key as keyof TrackingOptions])
      .map(([key, value]) => `data-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}="${value}"`)
      .join(" ");
    
    return `<script src="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.databuddy.cc'}/api/tracking" data-client-id="${websiteId}" ${options} async></script>`;
  };
  
  // Generate NPM init code based on selected options
  const generateNpmCode = () => {
    // For NPM, we'll show all options explicitly
    const options = Object.entries(trackingOptions)
      .map(([key, value]) => `  ${key}: ${value}`)
      .join(",\n");
    
    return `import { DataBuddy } from '@databuddy/tracker';\n\n// Initialize the tracker\nconst databuddy = new DataBuddy({\n  clientId: '${websiteId}',\n${options}\n});`;
  };
  
  const [trackingCode, setTrackingCode] = useState(generateScriptTag());
  const [npmCode, setNpmCode] = useState(generateNpmCode());
  
  // Update code when options change
  useEffect(() => {
    setTrackingCode(generateScriptTag());
    setNpmCode(generateNpmCode());
  }, [trackingOptions, websiteId]);
  
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Tracking code copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleOption = (option: keyof TrackingOptions) => {
    setTrackingOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  return (
    <div className="max-w-[1400px] space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {/* Website Info Card - Take 1/4 of the width */}
        <Card className="col-span-4 md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
              Website Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="space-y-4">
              {/* Website name with edit button */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold leading-none tracking-tight">{websiteData.name || "Unnamed Website"}</h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <WebsiteDialog
                          website={{
                            id: websiteData.id,
                            name: websiteData.name,
                            domain: websiteData.domain,
                          }}
                          onSubmit={(formData: WebsiteFormData) => {
                            // Connect to actual update mutation
                            updateWebsite(websiteData.id, formData)
                              .then((result) => {
                                if (result.error) {
                                  toast.error(result.error);
                                  return;
                                }
                                toast.success("Website updated successfully");
                                // Invalidate queries to refresh data
                                queryClient.invalidateQueries({ queryKey: ["website", websiteData.id] });
                                queryClient.invalidateQueries({ queryKey: ["websites"] });
                              })
                              .catch((error) => {
                                toast.error("Failed to update website");
                                console.error(error);
                              });
                          }}
                          isSubmitting={false}
                        >
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </WebsiteDialog>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Edit website details</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <a 
                  href={websiteData.domain}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary group"
                >
                  {websiteData.domain}
                  <ExternalLink className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
              </div>

              {/* Stats overview */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    <span className="text-sm font-medium">Active</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Last Activity</span>
                  <div className="text-sm">
                    {new Date(websiteData.updatedAt || websiteData.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Technical details */}
              <div className="rounded-md bg-muted/50 p-3 space-y-2.5">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Website ID</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-5 w-5 -mr-1">
                            <HelpCircle className="h-3 w-3 text-muted-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs max-w-sm">
                          This unique ID identifies your website in our system. Use it in your tracking code.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="font-mono text-xs bg-background/70 p-1.5 rounded border flex items-center justify-between group">
                    <span className="truncate font-mono text-xs">{websiteData.id}</span>
                    <Button
                      variant="ghost" 
                      size="icon" 
                      className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        navigator.clipboard.writeText(websiteData.id);
                        toast.success("Website ID copied to clipboard");
                      }}
                    >
                      <Clipboard className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Created</span>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-mono text-xs">{new Date(websiteData.createdAt).toLocaleDateString()}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(websiteData.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tracking status */}
              <div className="rounded-md bg-primary/5 border border-primary/10 p-3">
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 bg-primary/10 rounded-full p-1.5">
                    <Check className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Ready to Track</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Add the tracking code to your website to start collecting data.
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Action Links */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground">Quick Actions</h4>
                <div className="space-y-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start h-8 px-2 text-xs gap-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => {
                      // This would be replaced with actual delete functionality
                      toast.error("Delete functionality not yet implemented");
                    }}
                  >
                    <AlertCircle className="h-3.5 w-3.5" />
                    Delete Website
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Installation Guide - Take 3/4 of the width */}
        <Card className="col-span-4 md:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Code className="h-4 w-4 mr-2 text-muted-foreground" />
              Installation Guide
            </CardTitle>
            <CardDescription>Add tracking to your website in a few steps</CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <Tabs defaultValue="script" className="w-full" onValueChange={(value) => setInstallMethod(value as "script" | "npm")}>
              <TabsList className="mb-3 grid grid-cols-2 h-8">
                <TabsTrigger value="script" className="text-xs">Script Tag</TabsTrigger>
                <TabsTrigger disabled value="npm" className="text-xs">NPM Package</TabsTrigger>
              </TabsList>
              
              <TabsContent value="script" className="mt-0">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Add this script to the <code className="text-xs bg-muted px-1 py-0.5 rounded">&lt;head&gt;</code> section of your website:
                  </p>
                  <div className="relative">
                    <div className="bg-secondary/50 dark:bg-secondary/20 rounded-md p-3 overflow-x-auto border">
                      <pre className="text-xs font-mono leading-relaxed">
                        <code>{trackingCode}</code>
                      </pre>
                    </div>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="absolute top-2 right-2 h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
                      onClick={() => handleCopyCode(trackingCode)}
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Clipboard className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                  <div className="bg-muted/50 rounded p-2 mt-3 flex items-center gap-2 text-xs">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                    <p className="text-muted-foreground">Only options that differ from defaults are included in the script tag. By default, only <span className="font-mono">trackScreenViews</span> is enabled.</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="npm" className="mt-0">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Install the DataBuddy package via npm:
                  </p>
                  <div className="relative">
                    <div className="bg-secondary/50 dark:bg-secondary/20 rounded-md p-3 overflow-x-auto border">
                      <pre className="text-xs font-mono">
                        <code>npm install @databuddy/tracker</code>
                      </pre>
                    </div>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="absolute top-2 right-2 h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
                      onClick={() => handleCopyCode("npm install @databuddy/tracker")}
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Clipboard className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-3">
                    Then initialize the tracker in your code:
                  </p>
                  <div className="relative">
                    <div className="bg-secondary/50 dark:bg-secondary/20 rounded-md p-3 overflow-x-auto border">
                      <pre className="text-xs font-mono leading-relaxed">
                        <code>{npmCode}</code>
                      </pre>
                    </div>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="absolute top-2 right-2 h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
                      onClick={() => handleCopyCode(npmCode)}
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Clipboard className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                  <div className="bg-muted/50 rounded p-2 mt-3 flex items-center gap-2 text-xs">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                    <p className="text-muted-foreground">By default, only <span className="font-mono">trackScreenViews</span> is enabled in the library. Configure the options below to match your tracking needs.</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Options - Full width */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <Settings2 className="h-4 w-4 mr-2 text-muted-foreground" />
            Tracking Configuration
          </CardTitle>
          <CardDescription>
            Select which features to enable in your tracking code
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Basic Tracking - First column */}
            <div className="space-y-4">
              <div className="flex flex-col space-y-1.5">
                <h3 className="text-sm font-medium">Basic Tracking</h3>
                <p className="text-xs text-muted-foreground">
                  Essential features for website analytics
                  <span className="text-xs ml-1 text-muted-foreground/80 italic">(Page Views enabled by default)</span>
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center gap-2">
                  <div className="flex items-start gap-2">
                    <Checkbox 
                      id="trackScreenViews" 
                      checked={trackingOptions.trackScreenViews} 
                      onCheckedChange={() => toggleOption('trackScreenViews')}
                    />
                    <div className="grid gap-0.5">
                      <Label htmlFor="trackScreenViews" className="text-sm font-medium">Page Views</Label>
                      <p className="text-xs text-muted-foreground">Track when users view pages</p>
                    </div>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs">
                        <p className="text-xs">Records when users load or navigate to different pages on your site</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <div className="flex justify-between items-center gap-2">
                  <div className="flex items-start gap-2">
                    <Checkbox 
                      id="trackSessions" 
                      checked={trackingOptions.trackSessions}
                      onCheckedChange={() => toggleOption('trackSessions')}
                    />
                    <div className="grid gap-0.5">
                      <Label htmlFor="trackSessions" className="text-sm font-medium">User Sessions</Label>
                      <p className="text-xs text-muted-foreground">Track user visits over time</p>
                    </div>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs">
                        <p className="text-xs">Groups user interactions into sessions to understand visit patterns</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <div className="flex justify-between items-center gap-2">
                  <div className="flex items-start gap-2">
                    <Checkbox 
                      id="trackOutgoingLinks" 
                      checked={trackingOptions.trackOutgoingLinks}
                      onCheckedChange={() => toggleOption('trackOutgoingLinks')}
                    />
                    <div className="grid gap-0.5">
                      <Label htmlFor="trackOutgoingLinks" className="text-sm font-medium">Outgoing Links</Label>
                      <p className="text-xs text-muted-foreground">Track clicks on external links</p>
                    </div>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs">
                        <p className="text-xs">Records when users click links that lead to external websites</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>

            {/* Advanced Tracking - Second column */}
            <div className="space-y-4">
              <div className="flex flex-col space-y-1.5">
                <h3 className="text-sm font-medium">Advanced Tracking</h3>
                <p className="text-xs text-muted-foreground">Detailed metrics for deeper analysis</p>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center gap-2">
                  <div className="flex items-start gap-2">
                    <Checkbox 
                      id="trackPerformance" 
                      checked={trackingOptions.trackPerformance}
                      onCheckedChange={() => toggleOption('trackPerformance')}
                    />
                    <div className="grid gap-0.5">
                      <Label htmlFor="trackPerformance" className="text-sm font-medium">Performance Metrics</Label>
                      <p className="text-xs text-muted-foreground">Track page load times and more</p>
                    </div>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs">
                        <p className="text-xs">Measures how quickly your pages load for users</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <div className="flex justify-between items-center gap-2">
                  <div className="flex items-start gap-2">
                    <Checkbox 
                      id="trackWebVitals" 
                      checked={trackingOptions.trackWebVitals}
                      onCheckedChange={() => toggleOption('trackWebVitals')}
                    />
                    <div className="grid gap-0.5">
                      <Label htmlFor="trackWebVitals" className="text-sm font-medium">Web Vitals</Label>
                      <p className="text-xs text-muted-foreground">Track Core Web Vitals metrics</p>
                    </div>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs">
                        <p className="text-xs">Measures LCP, FID, CLS and other Google Core Web Vitals</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <div className="flex justify-between items-center gap-2">
                  <div className="flex items-start gap-2">
                    <Checkbox 
                      id="trackErrors" 
                      checked={trackingOptions.trackErrors}
                      onCheckedChange={() => toggleOption('trackErrors')}
                    />
                    <div className="grid gap-0.5">
                      <Label htmlFor="trackErrors" className="text-sm font-medium">JavaScript Errors</Label>
                      <p className="text-xs text-muted-foreground">Track client-side errors</p>
                    </div>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs">
                        <p className="text-xs">Detects JavaScript errors that users encounter</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <div className="flex justify-between items-center gap-2">
                  <div className="flex items-start gap-2">
                    <Checkbox 
                      id="trackInteractions" 
                      checked={trackingOptions.trackInteractions}
                      onCheckedChange={() => toggleOption('trackInteractions')}
                    />
                    <div className="grid gap-0.5">
                      <Label htmlFor="trackInteractions" className="text-sm font-medium">User Interactions</Label>
                      <p className="text-xs text-muted-foreground">Track clicks, scrolls, and other interactions</p>
                    </div>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs">
                        <p className="text-xs">Monitors detailed user behavior like button clicks and scroll depth</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>

            {/* Additional Tracking - Third column */}
            <div className="space-y-4">
              <div className="flex flex-col space-y-1.5">
                <h3 className="text-sm font-medium">Event Tracking</h3>
                <p className="text-xs text-muted-foreground">Analyze user behavior and interactions</p>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center gap-2">
                  <div className="flex items-start gap-2">
                    <Checkbox 
                      id="trackCustomEvents" 
                      checked={false}
                      disabled
                    />
                    <div className="grid gap-0.5">
                      <Label htmlFor="trackCustomEvents" className="text-sm font-medium">Custom Events</Label>
                      <p className="text-xs text-muted-foreground">Track specific user actions</p>
                    </div>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs">
                        <p className="text-xs">Premium feature - Track custom events like form submissions</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <div className="flex justify-between items-center gap-2">
                  <div className="flex items-start gap-2">
                    <Checkbox 
                      id="trackConversions" 
                      checked={false}
                      disabled
                    />
                    <div className="grid gap-0.5">
                      <Label htmlFor="trackConversions" className="text-sm font-medium">Goal Conversions</Label>
                      <div className="flex items-center gap-1">
                        <p className="text-xs text-muted-foreground">Track business goals</p>
                        <Badge variant="outline" className="text-[10px] h-4 bg-primary/10 text-primary border-primary/20">PRO</Badge>
                      </div>
                    </div>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs">
                        <p className="text-xs">Premium feature - Define and track important conversions</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <div className="flex justify-between items-center gap-2">
                  <div className="flex items-start gap-2">
                    <Checkbox 
                      id="trackFunnels" 
                      checked={false}
                      disabled
                    />
                    <div className="grid gap-0.5">
                      <Label htmlFor="trackFunnels" className="text-sm font-medium">Conversion Funnels</Label>
                      <div className="flex items-center gap-1">
                        <p className="text-xs text-muted-foreground">Track user journeys</p>
                        <Badge variant="outline" className="text-[10px] h-4 bg-primary/10 text-primary border-primary/20">PRO</Badge>
                      </div>
                    </div>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs">
                        <p className="text-xs">Premium feature - Visualize user flows through your site</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-4 flex justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 text-xs" 
              onClick={() => setTrackingOptions({...LIBRARY_DEFAULTS})}
            >
              <Settings2 className="h-3.5 w-3.5 mr-1.5" />
              Reset to Defaults
            </Button>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 text-xs" 
              onClick={() => setTrackingOptions({
                trackErrors: true,
                trackPerformance: true,
                trackWebVitals: true,
                trackOutgoingLinks: true,
                trackScreenViews: true,
                trackSessions: true,
                trackInteractions: true,
              })}
            >
              <Check className="h-3.5 w-3.5 mr-1.5" />
              Enable All
            </Button>
            <Button size="sm" className="h-8 text-xs" onClick={() => handleCopyCode(installMethod === "script" ? trackingCode : npmCode)}>
              <Clipboard className="h-3.5 w-3.5 mr-1.5" />
              Copy {installMethod === "script" ? "Script" : "Code"}
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Documentation & Next Steps - Three columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Info className="h-4 w-4 mr-2 text-muted-foreground" />
              Documentation
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-0">
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Learn more about DataBuddy features and how to get the most out of your analytics.
              </p>
              <div className="space-y-2.5">
                <a href="#" className="flex items-center justify-between text-sm hover:text-primary group">
                  <span className="font-medium">Getting Started Guide</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
                </a>
                <a href="#" className="flex items-center justify-between text-sm hover:text-primary group">
                  <span className="font-medium">API Documentation</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
                </a>
                <a href="#" className="flex items-center justify-between text-sm hover:text-primary group">
                  <span className="font-medium">Event Tracking Guide</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
                </a>
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-4">
            <Button variant="outline" size="sm" className="w-full text-xs h-8">
              <ExternalLink className="h-3 w-3 mr-2" />
              View All Documentation
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Zap className="h-4 w-4 mr-2 text-muted-foreground" />
              Next Steps
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-0">
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Take your analytics to the next level with these advanced features:
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 pb-2 border-b">
                  <div className="bg-primary/10 rounded-full p-1">
                    <Laptop className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Custom Events</h4>
                    <p className="text-xs text-muted-foreground">Track specific actions like sign-ups or purchases</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 pb-2 border-b">
                  <div className="bg-primary/10 rounded-full p-1">
                    <Laptop className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Goal Conversion</h4>
                    <p className="text-xs text-muted-foreground">Measure how well your site achieves business objectives</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 rounded-full p-1">
                    <Laptop className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Custom Dashboards</h4>
                    <p className="text-xs text-muted-foreground">Build personalized views of your analytics data</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-4">
            <Button size="sm" className="w-full text-xs h-8">
              <Zap className="h-3 w-3 mr-2" />
              Explore Advanced Features
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertCircle className="h-4 w-4 mr-2 text-muted-foreground" />
              Privacy Compliance
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-0">
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                DataBuddy is designed to be privacy-compliant. Learn how we handle user data responsibly.
              </p>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">GDPR Compliant</span>
                  <span className="text-green-600"><Check className="h-4 w-4" /></span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">CCPA Compliant</span>
                  <span className="text-green-600"><Check className="h-4 w-4" /></span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">No Personal Data Stored</span>
                  <span className="text-green-600"><Check className="h-4 w-4" /></span>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-4">
            <Button variant="outline" size="sm" className="w-full text-xs h-8">
              <Link href="https://www.databuddy.cc/privacy-policy" target="_blank" className="flex flex-row">
                <ExternalLink className="h-3 w-3 mr-2" />
                Privacy Policy
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 