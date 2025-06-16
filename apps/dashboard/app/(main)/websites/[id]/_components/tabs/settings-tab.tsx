"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type { WebsiteDataTabProps, TrackingOptions } from "../utils/types";
import { Check, Clipboard, Code, ExternalLink, Globe, Info, Laptop, Settings2, Zap, HelpCircle, ChevronRight, AlertCircle, Pencil, FileCode, BookOpen, Activity, Sliders, BarChart, TableProperties, Server, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { WebsiteDialog } from "@/components/website-dialog";

import { Slider } from "@/components/ui/slider";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useWebsites } from "@/hooks/use-websites";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import oneDark from 'react-syntax-highlighter/dist/esm/styles/prism/one-dark';

// Import utilities and types
import { RECOMMENDED_DEFAULTS } from "../utils/tracking-defaults";
import {
  generateScriptTag,
  generateNpmCode,
  generateNpmComponentCode
} from "../utils/code-generators";
import {
  toggleTrackingOption,
  enableAllBasicTracking,
  enableAllAdvancedTracking,
  enableAllOptimization,
  resetToDefaults
} from "../utils/tracking-helpers";
import Link from "next/link";


export function WebsiteSettingsTab({
  websiteId,
  websiteData,
  onWebsiteUpdated,
}: WebsiteDataTabProps) {
  const router = useRouter();
  const { deleteWebsite: deleteWebsiteMutation, isDeleting: isMutationDeleting } = useWebsites();
  const [copied, setCopied] = useState(false);
  const [installMethod, setInstallMethod] = useState<"script" | "npm">("script");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<"tracking" | "basic" | "advanced" | "optimization">("tracking");
  const [trackingOptions, setTrackingOptions] = useState<TrackingOptions>(RECOMMENDED_DEFAULTS);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Code copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleOption = (option: keyof TrackingOptions) => {
    setTrackingOptions(prev => toggleTrackingOption(prev, option));
  };

  const handleDeleteWebsite = async () => {
    deleteWebsiteMutation(websiteId, {
      onSuccess: () => {
        router.push("/websites");
        setShowDeleteDialog(false);
      },
      onError: (error: Error) => {
        console.error("Error deleting website:", error);
        setShowDeleteDialog(false);
      },
    });
  };

  const handleWebsiteUpdated = () => {
    setShowEditDialog(false);
    if (onWebsiteUpdated) {
      onWebsiteUpdated();
    }
  };

  const trackingCode = generateScriptTag(websiteId, trackingOptions);
  const npmCode = generateNpmCode(websiteId, trackingOptions);

  return (
    <div className="space-y-6">
      {/* Header */}
      <WebsiteHeader
        websiteData={websiteData}
        websiteId={websiteId}
        onEditClick={() => setShowEditDialog(true)}
      />

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-6">
        <SettingsNavigation
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onDeleteClick={() => setShowDeleteDialog(true)}
          trackingOptions={trackingOptions}
        />

        <div className="col-span-12 lg:col-span-9">
          <Card className="rounded-lg border bg-background shadow-sm">
            <CardContent className="p-6">
              {activeTab === "tracking" && (
                <TrackingCodeTab
                  trackingCode={trackingCode}
                  npmCode={npmCode}
                  installMethod={installMethod}
                  setInstallMethod={setInstallMethod}
                  websiteData={websiteData}
                  websiteId={websiteId}
                  copied={copied}
                  onCopyCode={handleCopyCode}
                  onCopyComponentCode={() => handleCopyCode(generateNpmComponentCode(websiteId, trackingOptions))}
                />
              )}

              {activeTab === "basic" && (
                <BasicTrackingTab
                  trackingOptions={trackingOptions}
                  onToggleOption={handleToggleOption}
                />
              )}

              {activeTab === "advanced" && (
                <AdvancedTrackingTab
                  trackingOptions={trackingOptions}
                  onToggleOption={handleToggleOption}
                />
              )}

              {activeTab === "optimization" && (
                <OptimizationTab
                  trackingOptions={trackingOptions}
                  setTrackingOptions={setTrackingOptions}
                />
              )}

              {activeTab !== "tracking" && (
                <TabActions
                  activeTab={activeTab}
                  installMethod={installMethod}
                  trackingCode={trackingCode}
                  onResetDefaults={() => setTrackingOptions(resetToDefaults())}
                  onEnableAll={() => {
                    if (activeTab === "basic") {
                      setTrackingOptions(prev => enableAllBasicTracking(prev));
                    } else if (activeTab === "advanced") {
                      setTrackingOptions(prev => enableAllAdvancedTracking(prev));
                    } else if (activeTab === "optimization") {
                      setTrackingOptions(prev => enableAllOptimization(prev));
                    }
                  }}
                  onCopyCode={() => handleCopyCode(
                    installMethod === "script"
                      ? trackingCode
                      : generateNpmComponentCode(websiteId, trackingOptions)
                  )}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <WebsiteDialog
        website={websiteData}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        verifiedDomains={[]}
        onUpdateSuccess={handleWebsiteUpdated}
      />

      {/* Delete Dialog */}
      <DeleteWebsiteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        websiteData={websiteData}
        isDeleting={isMutationDeleting}
        onConfirmDelete={handleDeleteWebsite}
      />
    </div>
  );
}

// Extracted Components 
function WebsiteHeader({ websiteData, websiteId, onEditClick }: { websiteData: any; websiteId: string; onEditClick: () => void }) {
  return (
    <Card className="rounded-lg border bg-background shadow-sm">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight">
                    {websiteData.name || "Unnamed Website"}
                  </h1>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1 px-2 text-muted-foreground hover:text-foreground transition-colors"
                          onClick={onEditClick}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          <span className="text-xs">Edit</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Edit website details</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <a
                    href={websiteData.domain}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    {websiteData.domain}
                    <ChevronRight className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <span>Created:</span>
                <span>{new Date(websiteData.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <span>ID:</span>
                <code className="font-mono bg-muted px-1 py-0.5 rounded text-xs">
                  {websiteId.substring(0, 8)}...
                </code>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:items-end gap-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-2 px-3 py-1 bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="font-medium">Active</span>
              </Badge>
            </div>

            <div className="text-xs text-muted-foreground text-right">
              <p>Analytics tracking is enabled</p>
              <p>Data collection in progress</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SettingsNavigation({
  activeTab,
  setActiveTab,
  onDeleteClick,
  trackingOptions
}: {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  onDeleteClick: () => void;
  trackingOptions: TrackingOptions;
}) {
  // Count enabled features for status indicators
  const basicEnabled = [
    !trackingOptions.disabled, // Inverted logic
    trackingOptions.trackScreenViews,
    trackingOptions.trackHashChanges,
    trackingOptions.trackSessions,
    trackingOptions.trackInteractions,
    trackingOptions.trackAttributes,
    trackingOptions.trackOutgoingLinks
  ].filter(Boolean).length;

  const advancedEnabled = [
    trackingOptions.trackEngagement,
    trackingOptions.trackScrollDepth,
    trackingOptions.trackExitIntent,
    trackingOptions.trackBounceRate,
    trackingOptions.trackErrors,
    trackingOptions.trackPerformance,
    trackingOptions.trackWebVitals
  ].filter(Boolean).length;

  const optimizationConfigured = trackingOptions.samplingRate < 1.0 ||
    trackingOptions.maxRetries !== 3 ||
    trackingOptions.initialRetryDelay !== 500 ||
    trackingOptions.enableBatching ||
    !trackingOptions.enableRetries;

  return (
    <div className="col-span-12 lg:col-span-3">
      <Card className="rounded-lg border bg-background shadow-sm">
        <CardContent className="p-4">
          <div className="space-y-2 sticky top-4">
            <Button
              variant={activeTab === "tracking" ? "default" : "ghost"}
              className="w-full justify-between gap-2 h-10 transition-all duration-200"
              onClick={() => setActiveTab("tracking")}
            >
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                <span>Tracking Code</span>
              </div>
              <Badge variant="secondary" className="h-5 px-2 text-xs">
                Ready
              </Badge>
            </Button>

            <div className="px-3 py-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Configuration
              </h3>
            </div>

            <Button
              variant={activeTab === "basic" ? "default" : "ghost"}
              className="w-full justify-between gap-2 h-10 transition-all duration-200"
              onClick={() => setActiveTab("basic")}
            >
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span>Basic Tracking</span>
              </div>
              <Badge
                variant={basicEnabled > 4 ? "default" : basicEnabled > 2 ? "secondary" : "outline"}
                className="h-5 px-2 text-xs"
              >
                {basicEnabled}/7
              </Badge>
            </Button>

            <Button
              variant={activeTab === "advanced" ? "default" : "ghost"}
              className="w-full justify-between gap-2 h-10 transition-all duration-200"
              onClick={() => setActiveTab("advanced")}
            >
              <div className="flex items-center gap-2">
                <TableProperties className="h-4 w-4" />
                <span>Advanced Features</span>
              </div>
              <Badge
                variant={advancedEnabled > 4 ? "default" : advancedEnabled > 2 ? "secondary" : "outline"}
                className="h-5 px-2 text-xs"
              >
                {advancedEnabled}/7
              </Badge>
            </Button>

            <Button
              variant={activeTab === "optimization" ? "default" : "ghost"}
              className="w-full justify-between gap-2 h-10 transition-all duration-200"
              onClick={() => setActiveTab("optimization")}
            >
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4" />
                <span>Optimization</span>
              </div>
              <Badge
                variant={optimizationConfigured ? "default" : "outline"}
                className="h-5 px-2 text-xs"
              >
                {optimizationConfigured ? "Custom" : "Default"}
              </Badge>
            </Button>

            <div className="pt-4 border-t">
              <div className="px-3 py-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Resources
                </h3>
              </div>

              <Link href="https://docs.databuddy.cc/docs" target="_blank">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 h-9 transition-all duration-200 hover:bg-muted/50"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Documentation</span>
                  <ChevronRight className="h-3 w-3 ml-auto" />
                </Button>
              </Link>

              <Link href="https://docs.databuddy.cc/docs/api" target="_blank">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 h-9 transition-all duration-200 hover:bg-muted/50"
                >
                  <FileCode className="h-4 w-4" />
                  <span>API Reference</span>
                  <ChevronRight className="h-3 w-3 ml-auto" />
                </Button>
              </Link>
            </div>

            <div className="pt-4 border-t">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 h-9 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200"
                onClick={onDeleteClick}
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Website</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TrackingCodeTab({
  trackingCode,
  npmCode,
  installMethod,
  setInstallMethod,
  websiteData,
  websiteId,
  copied,
  onCopyCode,
  onCopyComponentCode
}: any) {
  return (
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
          <TabsTrigger value="npm" className="text-xs">NPM Package</TabsTrigger>
        </TabsList>

        <TabsContent value="script" className="mt-0">
          <CodeBlock
            code={trackingCode}
            description="Add this script to the <head> section of your website:"
            copied={copied}
            onCopy={() => onCopyCode(trackingCode)}
          />
        </TabsContent>

        <TabsContent value="npm" className="mt-0">
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
                  copied={copied}
                  onCopy={() => onCopyCode("npm install @databuddy/sdk")}
                />
              </TabsContent>

              <TabsContent value="yarn" className="mt-0">
                <CodeBlock
                  code="yarn add @databuddy/sdk"
                  description=""
                  copied={copied}
                  onCopy={() => onCopyCode("yarn add @databuddy/sdk")}
                />
              </TabsContent>

              <TabsContent value="pnpm" className="mt-0">
                <CodeBlock
                  code="pnpm add @databuddy/sdk"
                  description=""
                  copied={copied}
                  onCopy={() => onCopyCode("pnpm add @databuddy/sdk")}
                />
              </TabsContent>

              <TabsContent value="bun" className="mt-0">
                <CodeBlock
                  code="bun add @databuddy/sdk"
                  description=""
                  copied={copied}
                  onCopy={() => onCopyCode("bun add @databuddy/sdk")}
                />
              </TabsContent>
            </Tabs>

            <CodeBlock
              code={npmCode}
              description="Then initialize the tracker in your code:"
              copied={copied}
              onCopy={onCopyComponentCode}
            />
          </div>
        </TabsContent>
      </Tabs>

      <WebsiteInfoSection websiteData={websiteData} websiteId={websiteId} />
    </div>
  );
}

function CodeBlock({ code, description, copied, onCopy }: any) {
  // Determine language based on code content
  const getLanguage = (code: string) => {
    if (code.includes('npm install') || code.includes('bun add')) return 'bash';
    if (code.includes('<script')) return 'html';
    if (code.includes('import') && code.includes('from')) return 'jsx';
    return 'javascript';
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        {description === "Add this script to the <head> section of your website:" ? (
          <>Add this script to the <code className="text-xs bg-muted px-1 py-0.5 rounded">&lt;head&gt;</code> section of your website:</>
        ) : (
          description
        )}
      </p>
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
          size="icon"
          variant="ghost"
          className="absolute top-2 right-2 h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
          onClick={onCopy}
        >
          {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Clipboard className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  );
}

function WebsiteInfoSection({ websiteData, websiteId }: any) {
  return (
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
              Add the tracking code to your website to start collecting data.
            </p>
            <Button variant="link" size="sm" className="h-6 px-0 text-xs text-primary">
              View Documentation
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BasicTrackingTab({ trackingOptions, onToggleOption }: any) {
  const trackingOptionsConfig = [
    {
      key: "disabled",
      title: "Enable Tracking",
      description: "Master switch for all tracking functionality",
      required: false,
      inverted: true, // This option is inverted (checked when disabled is false)
      data: ["Controls whether any tracking occurs", "When disabled, no data is collected", "Useful for privacy compliance or testing"]
    },
    {
      key: "trackScreenViews",
      title: "Page Views",
      description: "Track when users navigate to different pages",
      required: true,
      data: ["Page URL, title and referrer", "Timestamp", "User session ID"]
    },
    {
      key: "trackHashChanges",
      title: "Hash Changes",
      description: "Track navigation using URL hash changes (SPA routing)",
      data: ["Hash fragment changes", "Previous and new hash values", "Useful for single-page applications"]
    },
    {
      key: "trackSessions",
      title: "Sessions",
      description: "Track user sessions and engagement",
      data: ["Session duration", "Session start/end times", "Number of pages visited", "Bounce detection"]
    },
    {
      key: "trackInteractions",
      title: "Interactions",
      description: "Track button clicks and form submissions",
      data: ["Element clicked (button, link, etc.)", "Element ID, class and text content", "Form submission success/failure"]
    },
    {
      key: "trackAttributes",
      title: "Data Attributes",
      description: "Track events automatically using HTML data-* attributes",
      data: ["Elements with data-track attributes", "All data-* attribute values converted to camelCase", "Automatic event generation from markup"]
    },
    {
      key: "trackOutgoingLinks",
      title: "Outbound Links",
      description: "Track when users click links to external sites",
      data: ["Target URL", "Link text", "Page URL where link was clicked"]
    }
  ];

  return (
    <TrackingOptionsGrid
      title="Basic Tracking Options"
      description="Configure what user activity and page data to collect"
      options={trackingOptionsConfig}
      trackingOptions={trackingOptions}
      onToggleOption={onToggleOption}
    />
  );
}

function AdvancedTrackingTab({ trackingOptions, onToggleOption }: any) {
  const advancedOptionsConfig = [
    {
      key: "trackEngagement",
      title: "Engagement Tracking",
      description: "Track detailed user engagement metrics",
      data: ["Time on page", "Scroll behavior", "Mouse movements", "Interaction patterns"]
    },
    {
      key: "trackScrollDepth",
      title: "Scroll Depth",
      description: "Track how far users scroll on pages",
      data: ["Maximum scroll percentage", "Scroll milestones (25%, 50%, 75%, 100%)", "Time spent at different scroll positions"]
    },
    {
      key: "trackExitIntent",
      title: "Exit Intent",
      description: "Track when users are about to leave the page",
      data: ["Mouse movement towards browser controls", "Exit intent events", "Time before exit detection"]
    },
    {
      key: "trackBounceRate",
      title: "Bounce Rate",
      description: "Track bounce behavior and engagement quality",
      data: ["Single page sessions", "Time spent before bounce", "Interaction before leaving"]
    },
    {
      key: "trackErrors",
      title: "Error Tracking",
      description: "Track JavaScript errors and exceptions",
      data: ["Error message and type", "Stack trace", "Browser and OS info", "Page URL where error occurred"]
    },
    {
      key: "trackPerformance",
      title: "Performance",
      description: "Track page load and runtime performance",
      data: ["Page load time", "DOM content loaded time", "First paint and first contentful paint", "Resource timing"]
    },
    {
      key: "trackWebVitals",
      title: "Web Vitals",
      description: "Track Core Web Vitals metrics",
      data: ["Largest Contentful Paint (LCP)", "First Input Delay (FID)", "Cumulative Layout Shift (CLS)", "Interaction to Next Paint (INP)"]
    }
  ];

  return (
    <TrackingOptionsGrid
      title="Advanced Tracking Features"
      description="Enable additional tracking features for deeper insights"
      options={advancedOptionsConfig}
      trackingOptions={trackingOptions}
      onToggleOption={onToggleOption}
    />
  );
}

function TrackingOptionsGrid({ title, description, options, trackingOptions, onToggleOption }: any) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-1.5">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {options.map((option: any) => (
          <TrackingOptionCard
            key={option.key}
            {...option}
            enabled={trackingOptions[option.key]}
            onToggle={() => onToggleOption(option.key)}
          />
        ))}
      </div>
    </div>
  );
}

function TrackingOptionCard({ title, description, data, enabled, onToggle, required, inverted }: any) {
  const isEnabled = inverted ? !enabled : enabled;

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex justify-between items-start pb-2 border-b">
        <div className="space-y-0.5">
          <div className="font-medium">{title}</div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </div>
        <Switch checked={isEnabled} onCheckedChange={onToggle} />
      </div>
      {required && !isEnabled && (
        <div className="text-xs bg-red-50 dark:bg-red-950/20 p-2 rounded text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/20">
          <span className="font-medium flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Warning:
          </span>
          Disabling page views will prevent analytics from working. This option is required.
        </div>
      )}
      <div className="text-xs text-muted-foreground">
        Data collected:
        <ul className="list-disc pl-4 mt-1 space-y-0.5">
          {data.map((item: string) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function OptimizationTab({ trackingOptions, setTrackingOptions }: any) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-1.5">
        <h3 className="text-lg font-semibold">Performance Optimization</h3>
        <p className="text-sm text-muted-foreground">
          Configure tracking performance and data collection settings
        </p>
      </div>

      <div className="space-y-4">
        <SamplingRateSection
          samplingRate={trackingOptions.samplingRate}
          onSamplingRateChange={(rate: number) => setTrackingOptions((prev: any) => ({ ...prev, samplingRate: rate }))}
        />

        <BatchingSection
          trackingOptions={trackingOptions}
          setTrackingOptions={setTrackingOptions}
        />

        <NetworkResilienceSection
          trackingOptions={trackingOptions}
          setTrackingOptions={setTrackingOptions}
        />
      </div>
    </div>
  );
}

function SamplingRateSection({ samplingRate, onSamplingRateChange }: any) {
  return (
    <div className="rounded-lg border p-4">
      <h4 className="font-medium mb-3">Sampling Rate</h4>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="sampling-rate" className="text-sm">Data Collection Rate</Label>
              <span className="text-sm font-medium">{Math.round(samplingRate * 100)}%</span>
            </div>
            <Slider
              id="sampling-rate"
              min={1}
              max={100}
              step={1}
              value={[samplingRate * 100]}
              onValueChange={(value) => onSamplingRateChange(value[0] / 100)}
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
              Lower sampling rates reduce data collection costs and server load.
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Info className="h-3 w-3" />
              Recommended: 100% for low traffic sites, 10-50% for high traffic sites
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BatchingSection({ trackingOptions, setTrackingOptions }: any) {
  return (
    <div className="rounded-lg border p-4">
      <h4 className="font-medium mb-3">Batching</h4>
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="enable-batching"
            checked={trackingOptions.enableBatching}
            onCheckedChange={(checked) => setTrackingOptions((prev: any) => ({
              ...prev,
              enableBatching: checked
            }))}
          />
          <Label htmlFor="enable-batching">Enable batching</Label>
        </div>

        {trackingOptions.enableBatching && (
          <div className="grid grid-cols-2 gap-4 mt-2 pl-6">
            <div className="space-y-2">
              <Label htmlFor="batch-size" className="text-sm">Batch Size</Label>
              <div className="flex space-x-2 items-center">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setTrackingOptions((prev: any) => ({
                    ...prev,
                    batchSize: Math.max(1, prev.batchSize - 1)
                  }))}
                  disabled={trackingOptions.batchSize <= 1}
                >
                  -
                </Button>
                <span className="text-center w-8">{trackingOptions.batchSize}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setTrackingOptions((prev: any) => ({
                    ...prev,
                    batchSize: Math.min(10, prev.batchSize + 1)
                  }))}
                  disabled={trackingOptions.batchSize >= 10}
                >
                  +
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="batch-timeout" className="text-sm">Batch Timeout (ms)</Label>
              <input
                id="batch-timeout"
                type="number"
                min="100"
                max="5000"
                step="100"
                value={trackingOptions.batchTimeout}
                onChange={(e) => setTrackingOptions((prev: any) => ({
                  ...prev,
                  batchTimeout: Number.parseInt(e.target.value)
                }))}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background"
              />
            </div>

            <div className="col-span-2 text-xs text-muted-foreground">
              Batching helps reduce the number of requests sent to the server, improving performance.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NetworkResilienceSection({ trackingOptions, setTrackingOptions }: any) {
  return (
    <div className="rounded-lg border p-4">
      <h4 className="font-medium mb-3">Network Resilience</h4>
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="enable-retries"
            checked={trackingOptions.enableRetries}
            onCheckedChange={(checked) => setTrackingOptions((prev: any) => ({
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
                  onClick={() => setTrackingOptions((prev: any) => ({
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
                  onClick={() => setTrackingOptions((prev: any) => ({
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
                onChange={(e) => setTrackingOptions((prev: any) => ({
                  ...prev,
                  initialRetryDelay: Number.parseInt(e.target.value)
                }))}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background"
              />
            </div>

            <div className="col-span-2 text-xs text-muted-foreground">
              Retries use exponential backoff with jitter to avoid overwhelming servers.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TabActions({ activeTab, onResetDefaults, onEnableAll, onCopyCode, installMethod }: any) {
  return (
    <div className="mt-8 pt-4 border-t flex justify-between">
      <Button
        variant="outline"
        size="sm"
        onClick={onResetDefaults}
        className="h-8 text-xs"
      >
        Reset to defaults
      </Button>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={onEnableAll}
        >
          <Check className="h-3.5 w-3.5 mr-1.5" />
          Enable all
        </Button>

        <Button
          size="sm"
          className="h-8 text-xs"
          onClick={onCopyCode}
        >
          <Code className="h-3.5 w-3.5 mr-1.5" />
          Copy {installMethod === "script" ? "script" : "component code"}
        </Button>
      </div>
    </div>
  );
}

function DeleteWebsiteDialog({ open, onOpenChange, websiteData, isDeleting, onConfirmDelete }: any) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Website</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Are you sure you want to delete <span className="font-medium">{websiteData.name || websiteData.domain}</span>?
                This action cannot be undone.
              </p>

              <div className="rounded-md bg-amber-50 dark:bg-amber-950/20 p-3 text-amber-700 dark:text-amber-400 text-sm">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-500" />
                  <div className="space-y-1">
                    <p className="font-medium">Warning:</p>
                    <ul className="list-disc pl-4 text-xs space-y-1">
                      <li>All analytics data will be permanently deleted</li>
                      <li>Tracking will stop immediately</li>
                      <li>All website settings will be lost</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirmDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white hover:text-white"
          >
            {isDeleting ? "Deleting..." : "Delete Website"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 