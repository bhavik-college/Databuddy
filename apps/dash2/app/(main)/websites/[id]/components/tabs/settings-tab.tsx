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
import { Check, Clipboard, Code, ExternalLink, Globe, Info, Laptop, Settings2, Zap, HelpCircle, ChevronRight, AlertCircle, Pencil, FileCode, BookOpen, Activity, Sliders, BarChart, TableProperties, Server } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { WebsiteDialog } from "@/components/website-dialog";
import { updateWebsite } from "@/app/actions/websites";
import { queryClient } from "@/app/providers";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";

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
  samplingRate: number;
  enableRetries: boolean;
  maxRetries: number;
  initialRetryDelay: number;
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
  samplingRate: 1.0,     // 100% sampling by default
  enableRetries: true,   // Retries enabled by default
  maxRetries: 3,         // 3 retries by default
  initialRetryDelay: 500 // 500ms initial delay by default
};

export function WebsiteSettingsTab({
  websiteId,
  websiteData,
}: WebsiteDataTabProps) {
  const [copied, setCopied] = useState(false);
  const [installMethod, setInstallMethod] = useState<"script" | "npm">("script");
  
  // Active configuration tab
  const [activeTab, setActiveTab] = useState<"tracking" | "basic" | "advanced" | "optimization">("tracking");
  
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

  // Layout with sidebar navigation
  return (
    <div className="space-y-6">
      {/* Website Header Section */}
      <div className="flex items-center justify-between py-4 px-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold tracking-tight">{websiteData.name || "Unnamed Website"}</h2>
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
                    <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-muted-foreground">
                      <Pencil className="h-3.5 w-3.5" />
                      <span className="text-xs">Edit</span>
                    </Button>
                  </WebsiteDialog>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Edit website details</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="h-3.5 w-3.5" />
            <a 
              href={websiteData.domain}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline hover:text-foreground"
            >
              {websiteData.domain}
            </a>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1 text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
            Active
          </Badge>
          <Badge variant="outline" className="gap-1 text-xs">
            ID: {websiteId.substring(0, 8)}...
          </Badge>
        </div>
      </div>
      
      <Separator />
      
      {/* Main Content with Sidebar */}
      <div className="grid grid-cols-12 gap-4">
        {/* Left Navigation Sidebar */}
        <div className="col-span-3">
          <div className="space-y-1 sticky top-4">
            <Button
              variant={activeTab === "tracking" ? "default" : "ghost"} 
              className="w-full justify-start gap-2 h-9"
              onClick={() => setActiveTab("tracking")}
            >
              <Code className="h-4 w-4" />
              <span>Tracking Code</span>
            </Button>
            
            <Separator className="my-2" />
            
            <h3 className="text-xs font-medium text-muted-foreground px-3 py-1">Tracking Options</h3>
            <Button
              variant={activeTab === "basic" ? "default" : "ghost"}
              className="w-full justify-start gap-2 h-9"
              onClick={() => setActiveTab("basic")}
            >
              <Activity className="h-4 w-4" />
              <span>Basic Tracking</span>
            </Button>
            <Button
              variant={activeTab === "advanced" ? "default" : "ghost"}
              className="w-full justify-start gap-2 h-9"
              onClick={() => setActiveTab("advanced")}
            >
              <TableProperties className="h-4 w-4" />
              <span>Advanced Features</span>
            </Button>
            <Button
              variant={activeTab === "optimization" ? "default" : "ghost"}
              className="w-full justify-start gap-2 h-9"
              onClick={() => setActiveTab("optimization")}
            >
              <Sliders className="h-4 w-4" />
              <span>Optimization</span>
            </Button>
            
            <Separator className="my-2" />
            
            <h3 className="text-xs font-medium text-muted-foreground px-3 py-1">Resources</h3>
            <Button variant="ghost" className="w-full justify-start gap-2 h-9">
              <BookOpen className="h-4 w-4" />
              <span>Documentation</span>
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2 h-9">
              <FileCode className="h-4 w-4" />
              <span>API Reference</span>
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2 h-9 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20">
              <AlertCircle className="h-4 w-4" />
              <span>Delete Website</span>
            </Button>
          </div>
        </div>
        
        {/* Right Content Area - Shows different tabs */}
        <div className="col-span-9">
          <Card className="border-none shadow-none bg-transparent">
            <CardContent className="p-0">
              {/* Tracking Code Tab */}
              {activeTab === "tracking" && (
                <div className="space-y-4">
                  <div className="flex flex-col space-y-1.5">
                    <h3 className="text-lg font-semibold">Tracking Installation</h3>
                    <p className="text-sm text-muted-foreground">
                      Add this tracking code to your website to start collecting analytics data
                    </p>
                  </div>
                  
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
                        <div className="flex items-center gap-2 py-2 px-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/20 rounded text-amber-700 dark:text-amber-400 text-xs">
                          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>The script tag contains only options that differ from the defaults. Ensure this matches your setup. For advanced customizations, check the documentation.</span>
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
                      </div>
                    </TabsContent>
                  </Tabs>
                  
                  {/* Website Info in Tracking Tab */}
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="rounded-md bg-muted/50 p-4 space-y-3">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Info className="h-4 w-4 text-muted-foreground" />
                        Website Details
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Created</span>
                          <span>{new Date(websiteData.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Website ID</span>
                          <div className="font-mono text-xs flex items-center gap-1">
                            {websiteId}
                            <Button
                              variant="ghost" 
                              size="icon" 
                              className="h-5 w-5"
                              onClick={() => {
                                navigator.clipboard.writeText(websiteId);
                                toast.success("Website ID copied to clipboard");
                              }}
                            >
                              <Clipboard className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="rounded-md bg-primary/5 border border-primary/10 p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 bg-primary/10 rounded-full p-1.5">
                          <Check className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Ready to Track</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Add the tracking code to your website to start collecting data. Once installed, you'll see events in your dashboard.
                          </p>
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="h-6 px-0 text-xs text-primary"
                          >
                            View Documentation
                            <ChevronRight className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Basic Tracking Tab */}
              {activeTab === "basic" && (
                <div className="space-y-4">
                  <div className="flex flex-col space-y-1.5">
                    <h3 className="text-lg font-semibold">Basic Tracking Options</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure what user activity and page data to collect
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4 rounded-lg border p-4">
                      <div className="flex justify-between items-start pb-2 border-b">
                        <div className="space-y-0.5">
                          <div className="font-medium">Page Views</div>
                          <div className="text-xs text-muted-foreground">Track when users navigate to different pages</div>
                        </div>
                        <Switch 
                          checked={trackingOptions.trackScreenViews}
                          onCheckedChange={() => toggleOption("trackScreenViews")}
                        />
                      </div>
                      {!trackingOptions.trackScreenViews && (
                        <div className="text-xs bg-amber-50 dark:bg-amber-950/20 p-2 rounded text-amber-700 dark:text-amber-400">
                          <span className="font-medium flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Warning:
                          </span>
                          Disabling page views will prevent most analytics from working properly
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        Data collected:
                        <ul className="list-disc pl-4 mt-1 space-y-0.5">
                          <li>Page URL, title and referrer</li>
                          <li>Timestamp</li>
                          <li>User session ID</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="space-y-4 rounded-lg border p-4">
                      <div className="flex justify-between items-start pb-2 border-b">
                        <div className="space-y-0.5">
                          <div className="font-medium">Sessions</div>
                          <div className="text-xs text-muted-foreground">Track user sessions and engagement</div>
                        </div>
                        <Switch 
                          checked={trackingOptions.trackSessions}
                          onCheckedChange={() => toggleOption("trackSessions")}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Data collected:
                        <ul className="list-disc pl-4 mt-1 space-y-0.5">
                          <li>Session duration</li>
                          <li>Session start/end times</li>
                          <li>Number of pages visited</li>
                          <li>Bounce detection</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="space-y-4 rounded-lg border p-4">
                      <div className="flex justify-between items-start pb-2 border-b">
                        <div className="space-y-0.5">
                          <div className="font-medium">Interactions</div>
                          <div className="text-xs text-muted-foreground">Track button clicks and form submissions</div>
                        </div>
                        <Switch 
                          checked={trackingOptions.trackInteractions}
                          onCheckedChange={() => toggleOption("trackInteractions")}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Data collected:
                        <ul className="list-disc pl-4 mt-1 space-y-0.5">
                          <li>Element clicked (button, link, etc.)</li>
                          <li>Element ID, class and text content</li>
                          <li>Form submission success/failure</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="space-y-4 rounded-lg border p-4">
                      <div className="flex justify-between items-start pb-2 border-b">
                        <div className="space-y-0.5">
                          <div className="font-medium">Outbound Links</div>
                          <div className="text-xs text-muted-foreground">Track when users click links to external sites</div>
                        </div>
                        <Switch 
                          checked={trackingOptions.trackOutgoingLinks}
                          onCheckedChange={() => toggleOption("trackOutgoingLinks")}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Data collected:
                        <ul className="list-disc pl-4 mt-1 space-y-0.5">
                          <li>Target URL</li>
                          <li>Link text</li>
                          <li>Page URL where link was clicked</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Advanced Tracking Tab */}
              {activeTab === "advanced" && (
                <div className="space-y-4">
                  <div className="flex flex-col space-y-1.5">
                    <h3 className="text-lg font-semibold">Advanced Tracking Features</h3>
                    <p className="text-sm text-muted-foreground">
                      Enable additional tracking features for deeper insights
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4 rounded-lg border p-4">
                      <div className="flex justify-between items-start pb-2 border-b">
                        <div className="space-y-0.5">
                          <div className="font-medium">Error Tracking</div>
                          <div className="text-xs text-muted-foreground">Track JavaScript errors and exceptions</div>
                        </div>
                        <Switch 
                          checked={trackingOptions.trackErrors}
                          onCheckedChange={() => toggleOption("trackErrors")}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Data collected:
                        <ul className="list-disc pl-4 mt-1 space-y-0.5">
                          <li>Error message and type</li>
                          <li>Stack trace</li>
                          <li>Browser and OS info</li>
                          <li>Page URL where error occurred</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="space-y-4 rounded-lg border p-4">
                      <div className="flex justify-between items-start pb-2 border-b">
                        <div className="space-y-0.5">
                          <div className="font-medium">Performance</div>
                          <div className="text-xs text-muted-foreground">Track page load and runtime performance</div>
                        </div>
                        <Switch 
                          checked={trackingOptions.trackPerformance}
                          onCheckedChange={() => toggleOption("trackPerformance")}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Data collected:
                        <ul className="list-disc pl-4 mt-1 space-y-0.5">
                          <li>Page load time</li>
                          <li>DOM content loaded time</li>
                          <li>First paint and first contentful paint</li>
                          <li>Resource timing</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="space-y-4 rounded-lg border p-4">
                      <div className="flex justify-between items-start pb-2 border-b">
                        <div className="space-y-0.5">
                          <div className="font-medium">Web Vitals</div>
                          <div className="text-xs text-muted-foreground">Track Core Web Vitals metrics</div>
                        </div>
                        <Switch 
                          checked={trackingOptions.trackWebVitals}
                          onCheckedChange={() => toggleOption("trackWebVitals")}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Data collected:
                        <ul className="list-disc pl-4 mt-1 space-y-0.5">
                          <li>Largest Contentful Paint (LCP)</li>
                          <li>First Input Delay (FID)</li>
                          <li>Cumulative Layout Shift (CLS)</li>
                          <li>Interaction to Next Paint (INP)</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
                      <div className="flex justify-between items-start pb-2 border-b">
                        <div className="space-y-0.5">
                          <div className="font-medium flex items-center gap-1">
                            Custom Events
                            <Badge variant="outline" className="h-5 px-1.5 text-[10px] uppercase">Coming Soon</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">Define custom events to track</div>
                        </div>
                        <Switch disabled />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Use the JavaScript API to track custom events:
                        <pre className="mt-1 bg-secondary/30 p-2 rounded font-mono text-[10px] leading-relaxed">
                          {`databuddy.track('purchase_completed', {
  amount: 99.99,
  productId: 'prod_123',
  currency: 'USD'
});`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Optimization Tab */}
              {activeTab === "optimization" && (
                <div className="space-y-4">
                  <div className="flex flex-col space-y-1.5">
                    <h3 className="text-lg font-semibold">Performance Optimization</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure tracking performance and data collection settings
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="rounded-lg border p-4">
                      <h4 className="font-medium mb-3">Sampling Rate</h4>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <Label htmlFor="sampling-rate" className="text-sm">Data Collection Rate</Label>
                              <span className="text-sm font-medium">{Math.round(trackingOptions.samplingRate * 100)}%</span>
                            </div>
                            <Slider
                              id="sampling-rate"
                              min={1}
                              max={100}
                              step={1}
                              value={[trackingOptions.samplingRate * 100]}
                              onValueChange={(value) => setTrackingOptions(prev => ({
                                ...prev,
                                samplingRate: value[0] / 100
                              }))}
                              className="py-4"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>1%</span>
                              <span>50%</span>
                              <span>100%</span>
                            </div>
                          </div>
                          
                          <div className="text-sm space-y-2">
                            <p className="text-muted-foreground text-xs leading-relaxed">
                              Sampling rate determines what percentage of your visitors will be tracked. 
                              Lower sampling rates reduce data collection costs and server load while 
                              still providing statistically significant data.
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Info className="h-3 w-3" />
                              Recommended: 100% for low traffic sites, 10-50% for high traffic sites
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="rounded-lg border p-4">
                      <h4 className="font-medium mb-3">Network Resilience</h4>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="enable-retries"
                            checked={trackingOptions.enableRetries}
                            onCheckedChange={(checked) => setTrackingOptions(prev => ({
                              ...prev,
                              enableRetries: checked
                            }))}
                          />
                          <Label htmlFor="enable-retries">Enable request retries</Label>
                        </div>
                        
                        {trackingOptions.enableRetries && (
                          <div className="grid grid-cols-2 gap-4 mt-2 pl-6">
                            <div className="space-y-2">
                              <Label htmlFor="max-retries" className="text-sm">Maximum Retry Attempts</Label>
                              <div className="flex space-x-2 items-center">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => setTrackingOptions(prev => ({
                                    ...prev,
                                    maxRetries: Math.max(1, prev.maxRetries - 1)
                                  }))}
                                  disabled={trackingOptions.maxRetries <= 1}
                                >
                                  -
                                </Button>
                                <span className="text-center w-8">{trackingOptions.maxRetries}</span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => setTrackingOptions(prev => ({
                                    ...prev,
                                    maxRetries: Math.min(10, prev.maxRetries + 1)
                                  }))}
                                  disabled={trackingOptions.maxRetries >= 10}
                                >
                                  +
                                </Button>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="retry-delay" className="text-sm">Initial Retry Delay (ms)</Label>
                              <input
                                id="retry-delay"
                                type="number"
                                min="100"
                                max="5000"
                                step="100"
                                value={trackingOptions.initialRetryDelay}
                                onChange={(e) => setTrackingOptions(prev => ({
                                  ...prev,
                                  initialRetryDelay: parseInt(e.target.value)
                                }))}
                                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background"
                              />
                            </div>
                            
                            <div className="col-span-2 text-xs text-muted-foreground">
                              Retries use exponential backoff with jitter to avoid overwhelming servers.
                              Each retry will wait approximately 2x longer than the previous one.
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab !== "tracking" && (
                <div className="mt-8 pt-4 border-t flex justify-between">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setTrackingOptions({...LIBRARY_DEFAULTS})}
                    className="h-8 text-xs"
                  >
                    Reset to defaults
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => {
                        if (activeTab === "basic") {
                          setTrackingOptions(prev => ({
                            ...prev,
                            trackScreenViews: true,
                            trackSessions: true,
                            trackInteractions: true,
                            trackOutgoingLinks: true
                          }));
                        } else if (activeTab === "advanced") {
                          setTrackingOptions(prev => ({
                            ...prev,
                            trackErrors: true,
                            trackPerformance: true,
                            trackWebVitals: true
                          }));
                        } else if (activeTab === "optimization") {
                          setTrackingOptions(prev => ({
                            ...prev,
                            samplingRate: 1.0,
                            enableRetries: true,
                            maxRetries: 3,
                            initialRetryDelay: 500
                          }));
                        }
                      }}
                    >
                      <Check className="h-3.5 w-3.5 mr-1.5" />
                      Enable all
                    </Button>
                    
                    <Button 
                      size="sm" 
                      className="h-8 text-xs" 
                      onClick={() => handleCopyCode(trackingCode)}
                    >
                      <Code className="h-3.5 w-3.5 mr-1.5" />
                      Copy tracking code
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 