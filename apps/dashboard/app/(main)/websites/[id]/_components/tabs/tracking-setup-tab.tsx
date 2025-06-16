"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type { WebsiteDataTabProps, TrackingOptions } from "../utils/types";
import { 
  Check, 
  Clipboard, 
  Code, 
  ExternalLink, 
  Info, 
  AlertCircle, 
  FileCode, 
  BookOpen, 
  Activity,
} from "lucide-react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';



// Import utilities and types
import { RECOMMENDED_DEFAULTS } from "../utils/tracking-defaults";
import { 
  generateScriptTag, 
  generateNpmCode, 
  generateNpmComponentCode 
} from "../utils/code-generators";
import { 
  toggleTrackingOption
} from "../utils/tracking-helpers";

export function WebsiteTrackingSetupTab({
  websiteId,
  websiteData,
}: WebsiteDataTabProps) {
  const [copied, setCopied] = useState(false);
  const [installMethod, setInstallMethod] = useState<"script" | "npm">("script");
  const [trackingOptions, setTrackingOptions] = useState<TrackingOptions>(RECOMMENDED_DEFAULTS);
  
  const trackingCode = generateScriptTag(websiteId, trackingOptions);
  const npmCode = generateNpmCode(websiteId, trackingOptions);
  
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Tracking code copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleOption = (option: keyof TrackingOptions) => {
    setTrackingOptions(prev => toggleTrackingOption(prev, option));
  };

  // Determine language based on code content
  const getLanguage = (code: string) => {
    if (code.includes('npm install') || code.includes('yarn add') || code.includes('pnpm add') || code.includes('bun add')) return 'bash';
    if (code.includes('<script')) return 'html';
    if (code.includes('import') && code.includes('from')) return 'jsx';
    return 'javascript';
  };

  const CodeBlock = ({ code, description, onCopy }: { code: string; description?: string; onCopy: () => void }) => (
    <div className="space-y-2">
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      <div className="relative">
        <div className="rounded-md overflow-hidden border">
          <SyntaxHighlighter
            language={getLanguage(code)}
            style={oneDark}
            customStyle={{
              margin: 0,
              fontSize: '12px',
              lineHeight: '1.5',
              padding: '12px',
            }}
            showLineNumbers={false}
          >
            {code}
          </SyntaxHighlighter>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
          onClick={onCopy}
        >
          {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Clipboard className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Quick Setup Alert */}
      <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Tracking Not Setup
          </CardTitle>
          <CardDescription>
            Install the tracking script to start collecting analytics data for your website.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Installation Instructions */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Code className="w-5 h-5" />
            Installation
          </CardTitle>
          <CardDescription>
            Choose your preferred installation method
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={installMethod} onValueChange={(value) => setInstallMethod(value as "script" | "npm")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="script" className="flex items-center gap-2">
                <FileCode className="w-4 h-4" />
                HTML Script Tag
              </TabsTrigger>
              <TabsTrigger value="npm" className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                NPM Package
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="script" className="space-y-4">
              <CodeBlock 
                code={trackingCode}
                description="Add this script to the <head> section of your HTML:"
                onCopy={() => handleCopyCode(trackingCode)}
              />
              <p className="text-xs text-muted-foreground">
                Data will appear within a few minutes after installation.
              </p>
            </TabsContent>
            
            <TabsContent value="npm" className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-3">
                  Install the DataBuddy package using your preferred package manager:
                </p>
                
                <Tabs defaultValue="npm" className="w-full">
                  <TabsList className="mb-2 grid grid-cols-4 h-8">
                    <TabsTrigger value="npm" className="text-xs">npm</TabsTrigger>
                    <TabsTrigger value="yarn" className="text-xs">yarn</TabsTrigger>
                    <TabsTrigger value="pnpm" className="text-xs">pnpm</TabsTrigger>
                    <TabsTrigger value="bun" className="text-xs">bun</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="npm" className="mt-0">
                    <CodeBlock 
                      code="npm install @databuddy/sdk"
                      description=""
                      onCopy={() => handleCopyCode("npm install @databuddy/sdk")}
                    />
                  </TabsContent>
                  
                  <TabsContent value="yarn" className="mt-0">
                    <CodeBlock 
                      code="yarn add @databuddy/sdk"
                      description=""
                      onCopy={() => handleCopyCode("yarn add @databuddy/sdk")}
                    />
                  </TabsContent>
                  
                  <TabsContent value="pnpm" className="mt-0">
                    <CodeBlock 
                      code="pnpm add @databuddy/sdk"
                      description=""
                      onCopy={() => handleCopyCode("pnpm add @databuddy/sdk")}
                    />
                  </TabsContent>
                  
                  <TabsContent value="bun" className="mt-0">
                    <CodeBlock 
                      code="bun add @databuddy/sdk"
                      description=""
                      onCopy={() => handleCopyCode("bun add @databuddy/sdk")}
                    />
                  </TabsContent>
                </Tabs>
                
                <CodeBlock 
                  code={npmCode}
                  description="Then initialize the tracker in your code:"
                  onCopy={() => handleCopyCode(generateNpmComponentCode(websiteId, trackingOptions))}
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Tracking Configuration */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Configuration
          </CardTitle>
          <CardDescription>
            Customize tracking options (optional)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Core Tracking */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Core Tracking</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label htmlFor="disabled" className="text-sm">Enable Tracking</Label>
                    <div className="text-xs text-muted-foreground">Master switch for all tracking</div>
                  </div>
                  <Switch
                    id="disabled"
                    checked={!trackingOptions.disabled}
                    onCheckedChange={() => handleToggleOption('disabled')}
                  />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label htmlFor="trackScreenViews" className="text-sm">Page Views</Label>
                    <div className="text-xs text-muted-foreground">Track page visits</div>
                  </div>
                  <Switch
                    id="trackScreenViews"
                    checked={trackingOptions.trackScreenViews}
                    onCheckedChange={() => handleToggleOption('trackScreenViews')}
                  />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label htmlFor="trackHashChanges" className="text-sm">Hash Changes</Label>
                    <div className="text-xs text-muted-foreground">Track URL hash navigation</div>
                  </div>
                  <Switch
                    id="trackHashChanges"
                    checked={trackingOptions.trackHashChanges}
                    onCheckedChange={() => handleToggleOption('trackHashChanges')}
                  />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label htmlFor="trackSessions" className="text-sm">Sessions</Label>
                    <div className="text-xs text-muted-foreground">Track session duration</div>
                  </div>
                  <Switch
                    id="trackSessions"
                    checked={trackingOptions.trackSessions}
                    onCheckedChange={() => handleToggleOption('trackSessions')}
                  />
                </div>
              </div>
            </div>

            {/* Interaction Tracking */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Interaction Tracking</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label htmlFor="trackInteractions" className="text-sm">Interactions</Label>
                    <div className="text-xs text-muted-foreground">Track clicks and forms</div>
                  </div>
                  <Switch
                    id="trackInteractions"
                    checked={trackingOptions.trackInteractions}
                    onCheckedChange={() => handleToggleOption('trackInteractions')}
                  />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label htmlFor="trackAttributes" className="text-sm">Data Attributes</Label>
                    <div className="text-xs text-muted-foreground">Track data-* attributes</div>
                  </div>
                  <Switch
                    id="trackAttributes"
                    checked={trackingOptions.trackAttributes}
                    onCheckedChange={() => handleToggleOption('trackAttributes')}
                  />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label htmlFor="trackOutgoingLinks" className="text-sm">Outbound Links</Label>
                    <div className="text-xs text-muted-foreground">Track external link clicks</div>
                  </div>
                  <Switch
                    id="trackOutgoingLinks"
                    checked={trackingOptions.trackOutgoingLinks}
                    onCheckedChange={() => handleToggleOption('trackOutgoingLinks')}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Engagement Tracking */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Engagement Tracking</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label htmlFor="trackEngagement" className="text-sm">Engagement</Label>
                    <div className="text-xs text-muted-foreground">Track user engagement</div>
                  </div>
                  <Switch
                    id="trackEngagement"
                    checked={trackingOptions.trackEngagement}
                    onCheckedChange={() => handleToggleOption('trackEngagement')}
                  />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label htmlFor="trackScrollDepth" className="text-sm">Scroll Depth</Label>
                    <div className="text-xs text-muted-foreground">Track scroll percentage</div>
                  </div>
                  <Switch
                    id="trackScrollDepth"
                    checked={trackingOptions.trackScrollDepth}
                    onCheckedChange={() => handleToggleOption('trackScrollDepth')}
                  />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label htmlFor="trackExitIntent" className="text-sm">Exit Intent</Label>
                    <div className="text-xs text-muted-foreground">Track exit behavior</div>
                  </div>
                  <Switch
                    id="trackExitIntent"
                    checked={trackingOptions.trackExitIntent}
                    onCheckedChange={() => handleToggleOption('trackExitIntent')}
                  />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label htmlFor="trackBounceRate" className="text-sm">Bounce Rate</Label>
                    <div className="text-xs text-muted-foreground">Track bounce detection</div>
                  </div>
                  <Switch
                    id="trackBounceRate"
                    checked={trackingOptions.trackBounceRate}
                    onCheckedChange={() => handleToggleOption('trackBounceRate')}
                  />
                </div>
              </div>
            </div>

            {/* Performance Tracking */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Performance Tracking</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label htmlFor="trackPerformance" className="text-sm">Load Times</Label>
                    <div className="text-xs text-muted-foreground">Track page performance</div>
                  </div>
                  <Switch
                    id="trackPerformance"
                    checked={trackingOptions.trackPerformance}
                    onCheckedChange={() => handleToggleOption('trackPerformance')}
                  />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label htmlFor="trackWebVitals" className="text-sm">Web Vitals</Label>
                    <div className="text-xs text-muted-foreground">Track Core Web Vitals</div>
                  </div>
                  <Switch
                    id="trackWebVitals"
                    checked={trackingOptions.trackWebVitals}
                    onCheckedChange={() => handleToggleOption('trackWebVitals')}
                  />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label htmlFor="trackErrors" className="text-sm">Errors</Label>
                    <div className="text-xs text-muted-foreground">Track JS errors</div>
                  </div>
                  <Switch
                    id="trackErrors"
                    checked={trackingOptions.trackErrors}
                    onCheckedChange={() => handleToggleOption('trackErrors')}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Optimization */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Optimization</h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label htmlFor="enableBatching" className="text-sm">Enable Batching</Label>
                  <div className="text-xs text-muted-foreground">Batch requests for efficiency</div>
                </div>
                <Switch
                  id="enableBatching"
                  checked={trackingOptions.enableBatching}
                  onCheckedChange={() => handleToggleOption('enableBatching')}
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label htmlFor="enableRetries" className="text-sm">Enable Retries</Label>
                  <div className="text-xs text-muted-foreground">Retry failed requests</div>
                </div>
                <Switch
                  id="enableRetries"
                  checked={trackingOptions.enableRetries}
                  onCheckedChange={() => handleToggleOption('enableRetries')}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help Links */}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" size="sm" asChild>
          <a href="https://docs.databuddy.cc" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Documentation
            <ExternalLink className="w-3 h-3 ml-auto" />
          </a>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href="mailto:support@databuddy.cc" className="flex items-center gap-2">
            <Info className="w-4 h-4" />
            Get Support
          </a>
        </Button>
      </div>
    </div>
  );
} 