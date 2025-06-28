"use client";

import {
  Activity,
  AlertCircle,
  BarChart,
  BookOpen,
  Check,
  ChevronRight,
  Clipboard,
  Code,
  ExternalLink,
  FileCode,
  Globe,
  HelpCircle,
  Info,
  Laptop,
  Pencil,
  Server,
  Settings2,
  Sliders,
  TableProperties,
  Trash2,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import oneDark from "react-syntax-highlighter/dist/esm/styles/prism/one-dark";
import { toast } from "sonner";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { WebsiteDialog } from "@/components/website-dialog";
import { websiteApi } from "@/hooks/use-websites";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  generateNpmCode,
  generateNpmComponentCode,
  generateScriptTag,
} from "../utils/code-generators";
import { RECOMMENDED_DEFAULTS } from "../utils/tracking-defaults";
import {
  enableAllAdvancedTracking,
  enableAllBasicTracking,
  enableAllOptimization,
  resetToDefaults,
  toggleTrackingOption,
} from "../utils/tracking-helpers";
import type { TrackingOptions, WebsiteDataTabProps } from "../utils/types";

export function WebsiteSettingsTab({
  websiteId,
  websiteData,
  onWebsiteUpdated,
}: WebsiteDataTabProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { mutate: deleteWebsiteMutation, isPending: isMutationDeleting } =
    useMutation({
      mutationFn: (id: string) => websiteApi.delete(id),
      onSuccess: () => {
        toast.success("Website deleted successfully");
        queryClient.invalidateQueries({ queryKey: ["websites"] });
        router.push("/websites");
        setShowDeleteDialog(false);
      },
      onError: (error: Error) => {
        toast.error(error.message || "Failed to delete website");
        setShowDeleteDialog(false);
      },
    });
  const [copied, setCopied] = useState(false);
  const [installMethod, setInstallMethod] = useState<"script" | "npm">(
    "script"
  );
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<"tracking" | "basic" | "advanced" | "optimization">(
    "tracking"
  );
  const [trackingOptions, setTrackingOptions] = useState<TrackingOptions>(RECOMMENDED_DEFAULTS);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Code copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleOption = (option: keyof TrackingOptions) => {
    setTrackingOptions((prev) => toggleTrackingOption(prev, option));
  };

  const handleDeleteWebsite = async () => {
    deleteWebsiteMutation(websiteId);
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
        onEditClick={() => setShowEditDialog(true)}
        websiteData={websiteData}
        websiteId={websiteId}
      />

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-6">
        <SettingsNavigation
          activeTab={activeTab}
          onDeleteClick={() => setShowDeleteDialog(true)}
          setActiveTab={setActiveTab}
          trackingOptions={trackingOptions}
        />

        <div className="col-span-12 lg:col-span-9">
          <Card className="rounded-lg border bg-background shadow-sm">
            <CardContent className="p-6">
              {activeTab === "tracking" && (
                <TrackingCodeTab
                  copied={copied}
                  installMethod={installMethod}
                  npmCode={npmCode}
                  onCopyCode={handleCopyCode}
                  onCopyComponentCode={() =>
                    handleCopyCode(generateNpmComponentCode(websiteId, trackingOptions))
                  }
                  setInstallMethod={setInstallMethod}
                  trackingCode={trackingCode}
                  websiteData={websiteData}
                  websiteId={websiteId}
                />
              )}

              {activeTab === "basic" && (
                <BasicTrackingTab
                  onToggleOption={handleToggleOption}
                  trackingOptions={trackingOptions}
                />
              )}

              {activeTab === "advanced" && (
                <AdvancedTrackingTab
                  onToggleOption={handleToggleOption}
                  trackingOptions={trackingOptions}
                />
              )}

              {activeTab === "optimization" && (
                <OptimizationTab
                  setTrackingOptions={setTrackingOptions}
                  trackingOptions={trackingOptions}
                />
              )}

              {activeTab !== "tracking" && (
                <TabActions
                  activeTab={activeTab}
                  installMethod={installMethod}
                  onCopyCode={() =>
                    handleCopyCode(
                      installMethod === "script"
                        ? trackingCode
                        : generateNpmComponentCode(websiteId, trackingOptions)
                    )
                  }
                  onEnableAll={() => {
                    if (activeTab === "basic") {
                      setTrackingOptions((prev) => enableAllBasicTracking(prev));
                    } else if (activeTab === "advanced") {
                      setTrackingOptions((prev) => enableAllAdvancedTracking(prev));
                    } else if (activeTab === "optimization") {
                      setTrackingOptions((prev) => enableAllOptimization(prev));
                    }
                  }}
                  onResetDefaults={() => setTrackingOptions(resetToDefaults())}
                  trackingCode={trackingCode}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <WebsiteDialog
        onOpenChange={setShowEditDialog}
        onUpdateSuccess={handleWebsiteUpdated}
        open={showEditDialog}
        website={websiteData}
      />

      {/* Delete Dialog */}
      <DeleteWebsiteDialog
        isDeleting={isMutationDeleting}
        onConfirmDelete={handleDeleteWebsite}
        onOpenChange={setShowDeleteDialog}
        open={showDeleteDialog}
        websiteData={websiteData}
      />
    </div>
  );
}

// Extracted Components
function WebsiteHeader({
  websiteData,
  websiteId,
  onEditClick,
}: {
  websiteData: any;
  websiteId: string;
  onEditClick: () => void;
}) {
  return (
    <Card className="rounded-lg border bg-background shadow-sm">
      <CardContent className="p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-2xl tracking-tight">
                    {websiteData.name || "Unnamed Website"}
                  </h1>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          className="h-8 gap-1 px-2 text-muted-foreground transition-colors hover:text-foreground"
                          onClick={onEditClick}
                          size="sm"
                          variant="ghost"
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
                <div className="mt-1 flex items-center gap-2 text-muted-foreground text-sm">
                  <a
                    className="flex items-center gap-1 transition-colors hover:text-foreground hover:underline"
                    href={websiteData.domain}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {websiteData.domain}
                    <ChevronRight className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-muted-foreground text-xs">
              <div className="flex items-center gap-1">
                <span>Created:</span>
                <span>{new Date(websiteData.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <span>ID:</span>
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                  {websiteId.substring(0, 8)}...
                </code>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:items-end">
            <div className="flex items-center gap-2">
              <Badge
                className="gap-2 border-green-200 bg-green-50 px-3 py-1 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400"
                variant="outline"
              >
                <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                <span className="font-medium">Active</span>
              </Badge>
            </div>

            <div className="text-right text-muted-foreground text-xs">
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
  trackingOptions,
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
    trackingOptions.trackOutgoingLinks,
  ].filter(Boolean).length;

  const advancedEnabled = [
    trackingOptions.trackEngagement,
    trackingOptions.trackScrollDepth,
    trackingOptions.trackExitIntent,
    trackingOptions.trackBounceRate,
    trackingOptions.trackErrors,
    trackingOptions.trackPerformance,
    trackingOptions.trackWebVitals,
  ].filter(Boolean).length;

  const optimizationConfigured =
    trackingOptions.samplingRate < 1.0 ||
    trackingOptions.maxRetries !== 3 ||
    trackingOptions.initialRetryDelay !== 500 ||
    trackingOptions.enableBatching ||
    !trackingOptions.enableRetries;

  return (
    <div className="col-span-12 lg:col-span-3">
      <Card className="rounded-lg border bg-background shadow-sm">
        <CardContent className="p-4">
          <div className="sticky top-4 space-y-2">
            <Button
              className="h-10 w-full justify-between gap-2 transition-all duration-200"
              onClick={() => setActiveTab("tracking")}
              variant={activeTab === "tracking" ? "default" : "ghost"}
            >
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                <span>Tracking Code</span>
              </div>
              <Badge className="h-5 px-2 text-xs" variant="secondary">
                Ready
              </Badge>
            </Button>

            <div className="px-3 py-2">
              <h3 className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                Configuration
              </h3>
            </div>

            <Button
              className="h-10 w-full justify-between gap-2 transition-all duration-200"
              onClick={() => setActiveTab("basic")}
              variant={activeTab === "basic" ? "default" : "ghost"}
            >
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span>Basic Tracking</span>
              </div>
              <Badge
                className="h-5 px-2 text-xs"
                variant={basicEnabled > 4 ? "default" : basicEnabled > 2 ? "secondary" : "outline"}
              >
                {basicEnabled}/7
              </Badge>
            </Button>

            <Button
              className="h-10 w-full justify-between gap-2 transition-all duration-200"
              onClick={() => setActiveTab("advanced")}
              variant={activeTab === "advanced" ? "default" : "ghost"}
            >
              <div className="flex items-center gap-2">
                <TableProperties className="h-4 w-4" />
                <span>Advanced Features</span>
              </div>
              <Badge
                className="h-5 px-2 text-xs"
                variant={
                  advancedEnabled > 4 ? "default" : advancedEnabled > 2 ? "secondary" : "outline"
                }
              >
                {advancedEnabled}/7
              </Badge>
            </Button>

            <Button
              className="h-10 w-full justify-between gap-2 transition-all duration-200"
              onClick={() => setActiveTab("optimization")}
              variant={activeTab === "optimization" ? "default" : "ghost"}
            >
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4" />
                <span>Optimization</span>
              </div>
              <Badge
                className="h-5 px-2 text-xs"
                variant={optimizationConfigured ? "default" : "outline"}
              >
                {optimizationConfigured ? "Custom" : "Default"}
              </Badge>
            </Button>

            <div className="border-t pt-4">
              <div className="px-3 py-2">
                <h3 className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                  Resources
                </h3>
              </div>

              <Link href="https://docs.databuddy.cc/docs" target="_blank">
                <Button
                  className="h-9 w-full justify-start gap-2 transition-all duration-200 hover:bg-muted/50"
                  variant="ghost"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Documentation</span>
                  <ChevronRight className="ml-auto h-3 w-3" />
                </Button>
              </Link>

              <Link href="https://docs.databuddy.cc/docs/api" target="_blank">
                <Button
                  className="h-9 w-full justify-start gap-2 transition-all duration-200 hover:bg-muted/50"
                  variant="ghost"
                >
                  <FileCode className="h-4 w-4" />
                  <span>API Reference</span>
                  <ChevronRight className="ml-auto h-3 w-3" />
                </Button>
              </Link>
            </div>

            <div className="border-t pt-4">
              <Button
                className="h-9 w-full justify-start gap-2 text-red-500 transition-all duration-200 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20"
                onClick={onDeleteClick}
                variant="ghost"
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
  onCopyComponentCode,
}: any) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-1.5">
        <h3 className="font-semibold text-lg">Tracking Installation</h3>
        <p className="text-muted-foreground text-sm">
          Add this tracking code to your website to start collecting analytics data
        </p>
      </div>

      <Tabs
        className="w-full"
        defaultValue="script"
        onValueChange={(value) => setInstallMethod(value as "script" | "npm")}
      >
        <TabsList className="mb-3 grid h-8 grid-cols-2">
          <TabsTrigger className="text-xs" value="script">
            Script Tag
          </TabsTrigger>
          <TabsTrigger className="text-xs" value="npm">
            NPM Package
          </TabsTrigger>
        </TabsList>

        <TabsContent className="mt-0" value="script">
          <CodeBlock
            code={trackingCode}
            copied={copied}
            description="Add this script to the <head> section of your website:"
            onCopy={() => onCopyCode(trackingCode)}
          />
        </TabsContent>

        <TabsContent className="mt-0" value="npm">
          <div className="space-y-2">
            <p className="mb-3 text-muted-foreground text-xs">
              Install the DataBuddy package using your preferred package manager:
            </p>

            <Tabs className="w-full" defaultValue="npm">
              <TabsList className="mb-2 grid h-8 grid-cols-4">
                <TabsTrigger className="text-xs" value="npm">
                  npm
                </TabsTrigger>
                <TabsTrigger className="text-xs" value="yarn">
                  yarn
                </TabsTrigger>
                <TabsTrigger className="text-xs" value="pnpm">
                  pnpm
                </TabsTrigger>
                <TabsTrigger className="text-xs" value="bun">
                  bun
                </TabsTrigger>
              </TabsList>

              <TabsContent className="mt-0" value="npm">
                <CodeBlock
                  code="npm install @databuddy/sdk"
                  copied={copied}
                  description=""
                  onCopy={() => onCopyCode("npm install @databuddy/sdk")}
                />
              </TabsContent>

              <TabsContent className="mt-0" value="yarn">
                <CodeBlock
                  code="yarn add @databuddy/sdk"
                  copied={copied}
                  description=""
                  onCopy={() => onCopyCode("yarn add @databuddy/sdk")}
                />
              </TabsContent>

              <TabsContent className="mt-0" value="pnpm">
                <CodeBlock
                  code="pnpm add @databuddy/sdk"
                  copied={copied}
                  description=""
                  onCopy={() => onCopyCode("pnpm add @databuddy/sdk")}
                />
              </TabsContent>

              <TabsContent className="mt-0" value="bun">
                <CodeBlock
                  code="bun add @databuddy/sdk"
                  copied={copied}
                  description=""
                  onCopy={() => onCopyCode("bun add @databuddy/sdk")}
                />
              </TabsContent>
            </Tabs>

            <CodeBlock
              code={npmCode}
              copied={copied}
              description="Then initialize the tracker in your code:"
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
    if (code.includes("npm install") || code.includes("bun add")) return "bash";
    if (code.includes("<script")) return "html";
    if (code.includes("import") && code.includes("from")) return "jsx";
    return "javascript";
  };

  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-xs">
        {description === "Add this script to the <head> section of your website:" ? (
          <>
            Add this script to the{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">&lt;head&gt;</code> section of
            your website:
          </>
        ) : (
          description
        )}
      </p>
      <div className="relative">
        <div className="overflow-hidden rounded-md border">
          <SyntaxHighlighter
            customStyle={{
              margin: 0,
              fontSize: "12px",
              lineHeight: "1.5",
              padding: "12px",
            }}
            language={getLanguage(code)}
            showLineNumbers={false}
            style={oneDark}
          >
            {code}
          </SyntaxHighlighter>
        </div>
        <Button
          className="absolute top-2 right-2 h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
          onClick={onCopy}
          size="icon"
          variant="ghost"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Clipboard className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
    </div>
  );
}

function WebsiteInfoSection({ websiteData, websiteId }: any) {
  return (
    <div className="mt-6 grid grid-cols-2 gap-4">
      <div className="space-y-3 rounded-md bg-muted/50 p-4">
        <h4 className="flex items-center gap-2 font-medium text-sm">
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
            <div className="flex items-center gap-1 font-mono text-xs">
              {websiteId}
              <Button
                className="h-5 w-5"
                onClick={() => {
                  navigator.clipboard.writeText(websiteId);
                  toast.success("Website ID copied to clipboard");
                }}
                size="icon"
                variant="ghost"
              >
                <Clipboard className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-md border border-primary/10 bg-primary/5 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-full bg-primary/10 p-1.5">
            <Check className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-medium text-sm">Ready to Track</p>
            <p className="mt-1 text-muted-foreground text-xs">
              Add the tracking code to your website to start collecting data.
            </p>
            <Button className="h-6 px-0 text-primary text-xs" size="sm" variant="link">
              View Documentation
              <ChevronRight className="ml-1 h-3 w-3" />
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
      data: [
        "Controls whether any tracking occurs",
        "When disabled, no data is collected",
        "Useful for privacy compliance or testing",
      ],
    },
    {
      key: "trackScreenViews",
      title: "Page Views",
      description: "Track when users navigate to different pages",
      required: true,
      data: ["Page URL, title and referrer", "Timestamp", "User session ID"],
    },
    {
      key: "trackHashChanges",
      title: "Hash Changes",
      description: "Track navigation using URL hash changes (SPA routing)",
      data: [
        "Hash fragment changes",
        "Previous and new hash values",
        "Useful for single-page applications",
      ],
    },
    {
      key: "trackSessions",
      title: "Sessions",
      description: "Track user sessions and engagement",
      data: [
        "Session duration",
        "Session start/end times",
        "Number of pages visited",
        "Bounce detection",
      ],
    },
    {
      key: "trackInteractions",
      title: "Interactions",
      description: "Track button clicks and form submissions",
      data: [
        "Element clicked (button, link, etc.)",
        "Element ID, class and text content",
        "Form submission success/failure",
      ],
    },
    {
      key: "trackAttributes",
      title: "Data Attributes",
      description: "Track events automatically using HTML data-* attributes",
      data: [
        "Elements with data-track attributes",
        "All data-* attribute values converted to camelCase",
        "Automatic event generation from markup",
      ],
    },
    {
      key: "trackOutgoingLinks",
      title: "Outbound Links",
      description: "Track when users click links to external sites",
      data: ["Target URL", "Link text", "Page URL where link was clicked"],
    },
  ];

  return (
    <TrackingOptionsGrid
      description="Configure what user activity and page data to collect"
      onToggleOption={onToggleOption}
      options={trackingOptionsConfig}
      title="Basic Tracking Options"
      trackingOptions={trackingOptions}
    />
  );
}

function AdvancedTrackingTab({ trackingOptions, onToggleOption }: any) {
  const advancedOptionsConfig = [
    {
      key: "trackEngagement",
      title: "Engagement Tracking",
      description: "Track detailed user engagement metrics",
      data: ["Time on page", "Scroll behavior", "Mouse movements", "Interaction patterns"],
    },
    {
      key: "trackScrollDepth",
      title: "Scroll Depth",
      description: "Track how far users scroll on pages",
      data: [
        "Maximum scroll percentage",
        "Scroll milestones (25%, 50%, 75%, 100%)",
        "Time spent at different scroll positions",
      ],
    },
    {
      key: "trackExitIntent",
      title: "Exit Intent",
      description: "Track when users are about to leave the page",
      data: [
        "Mouse movement towards browser controls",
        "Exit intent events",
        "Time before exit detection",
      ],
    },
    {
      key: "trackBounceRate",
      title: "Bounce Rate",
      description: "Track bounce behavior and engagement quality",
      data: ["Single page sessions", "Time spent before bounce", "Interaction before leaving"],
    },
    {
      key: "trackErrors",
      title: "Error Tracking",
      description: "Track JavaScript errors and exceptions",
      data: [
        "Error message and type",
        "Stack trace",
        "Browser and OS info",
        "Page URL where error occurred",
      ],
    },
    {
      key: "trackPerformance",
      title: "Performance",
      description: "Track page load and runtime performance",
      data: [
        "Page load time",
        "DOM content loaded time",
        "First paint and first contentful paint",
        "Resource timing",
      ],
    },
    {
      key: "trackWebVitals",
      title: "Web Vitals",
      description: "Track Core Web Vitals metrics",
      data: [
        "Largest Contentful Paint (LCP)",
        "First Input Delay (FID)",
        "Cumulative Layout Shift (CLS)",
        "Interaction to Next Paint (INP)",
      ],
    },
  ];

  return (
    <TrackingOptionsGrid
      description="Enable additional tracking features for deeper insights"
      onToggleOption={onToggleOption}
      options={advancedOptionsConfig}
      title="Advanced Tracking Features"
      trackingOptions={trackingOptions}
    />
  );
}

function TrackingOptionsGrid({
  title,
  description,
  options,
  trackingOptions,
  onToggleOption,
}: any) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-1.5">
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
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

function TrackingOptionCard({
  title,
  description,
  data,
  enabled,
  onToggle,
  required,
  inverted,
}: any) {
  const isEnabled = inverted ? !enabled : enabled;

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-start justify-between border-b pb-2">
        <div className="space-y-0.5">
          <div className="font-medium">{title}</div>
          <div className="text-muted-foreground text-xs">{description}</div>
        </div>
        <Switch checked={isEnabled} onCheckedChange={onToggle} />
      </div>
      {required && !isEnabled && (
        <div className="rounded border border-red-200 bg-red-50 p-2 text-red-700 text-xs dark:border-red-800/20 dark:bg-red-950/20 dark:text-red-400">
          <span className="flex items-center gap-1 font-medium">
            <AlertCircle className="h-3 w-3" />
            Warning:
          </span>
          Disabling page views will prevent analytics from working. This option is required.
        </div>
      )}
      <div className="text-muted-foreground text-xs">
        Data collected:
        <ul className="mt-1 list-disc space-y-0.5 pl-4">
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
        <h3 className="font-semibold text-lg">Performance Optimization</h3>
        <p className="text-muted-foreground text-sm">
          Configure tracking performance and data collection settings
        </p>
      </div>

      <div className="space-y-4">
        <SamplingRateSection
          onSamplingRateChange={(rate: number) =>
            setTrackingOptions((prev: any) => ({ ...prev, samplingRate: rate }))
          }
          samplingRate={trackingOptions.samplingRate}
        />

        <BatchingSection
          setTrackingOptions={setTrackingOptions}
          trackingOptions={trackingOptions}
        />

        <NetworkResilienceSection
          setTrackingOptions={setTrackingOptions}
          trackingOptions={trackingOptions}
        />
      </div>
    </div>
  );
}

function SamplingRateSection({ samplingRate, onSamplingRateChange }: any) {
  return (
    <div className="rounded-lg border p-4">
      <h4 className="mb-3 font-medium">Sampling Rate</h4>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-sm" htmlFor="sampling-rate">
                Data Collection Rate
              </Label>
              <span className="font-medium text-sm">{Math.round(samplingRate * 100)}%</span>
            </div>
            <Slider
              className="py-4"
              id="sampling-rate"
              max={100}
              min={1}
              onValueChange={(value) => onSamplingRateChange(value[0] / 100)}
              step={1}
              value={[samplingRate * 100]}
            />
            <div className="flex justify-between text-muted-foreground text-xs">
              <span>1%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground text-xs leading-relaxed">
              Sampling rate determines what percentage of your visitors will be tracked. Lower
              sampling rates reduce data collection costs and server load.
            </p>
            <p className="flex items-center gap-1 text-muted-foreground text-xs">
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
      <h4 className="mb-3 font-medium">Batching</h4>
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            checked={trackingOptions.enableBatching}
            id="enable-batching"
            onCheckedChange={(checked) =>
              setTrackingOptions((prev: any) => ({
                ...prev,
                enableBatching: checked,
              }))
            }
          />
          <Label htmlFor="enable-batching">Enable batching</Label>
        </div>

        {trackingOptions.enableBatching && (
          <div className="mt-2 grid grid-cols-2 gap-4 pl-6">
            <div className="space-y-2">
              <Label className="text-sm" htmlFor="batch-size">
                Batch Size
              </Label>
              <div className="flex items-center space-x-2">
                <Button
                  className="h-7 w-7"
                  disabled={trackingOptions.batchSize <= 1}
                  onClick={() =>
                    setTrackingOptions((prev: any) => ({
                      ...prev,
                      batchSize: Math.max(1, prev.batchSize - 1),
                    }))
                  }
                  size="icon"
                  variant="outline"
                >
                  -
                </Button>
                <span className="w-8 text-center">{trackingOptions.batchSize}</span>
                <Button
                  className="h-7 w-7"
                  disabled={trackingOptions.batchSize >= 10}
                  onClick={() =>
                    setTrackingOptions((prev: any) => ({
                      ...prev,
                      batchSize: Math.min(10, prev.batchSize + 1),
                    }))
                  }
                  size="icon"
                  variant="outline"
                >
                  +
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm" htmlFor="batch-timeout">
                Batch Timeout (ms)
              </Label>
              <input
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background"
                id="batch-timeout"
                max="5000"
                min="100"
                onChange={(e) =>
                  setTrackingOptions((prev: any) => ({
                    ...prev,
                    batchTimeout: Number.parseInt(e.target.value),
                  }))
                }
                step="100"
                type="number"
                value={trackingOptions.batchTimeout}
              />
            </div>

            <div className="col-span-2 text-muted-foreground text-xs">
              Batching helps reduce the number of requests sent to the server, improving
              performance.
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
      <h4 className="mb-3 font-medium">Network Resilience</h4>
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            checked={trackingOptions.enableRetries}
            id="enable-retries"
            onCheckedChange={(checked) =>
              setTrackingOptions((prev: any) => ({
                ...prev,
                enableRetries: checked,
              }))
            }
          />
          <Label htmlFor="enable-retries">Enable request retries</Label>
        </div>

        {trackingOptions.enableRetries && (
          <div className="mt-2 grid grid-cols-2 gap-4 pl-6">
            <div className="space-y-2">
              <Label className="text-sm" htmlFor="max-retries">
                Maximum Retry Attempts
              </Label>
              <div className="flex items-center space-x-2">
                <Button
                  className="h-7 w-7"
                  disabled={trackingOptions.maxRetries <= 1}
                  onClick={() =>
                    setTrackingOptions((prev: any) => ({
                      ...prev,
                      maxRetries: Math.max(1, prev.maxRetries - 1),
                    }))
                  }
                  size="icon"
                  variant="outline"
                >
                  -
                </Button>
                <span className="w-8 text-center">{trackingOptions.maxRetries}</span>
                <Button
                  className="h-7 w-7"
                  disabled={trackingOptions.maxRetries >= 10}
                  onClick={() =>
                    setTrackingOptions((prev: any) => ({
                      ...prev,
                      maxRetries: Math.min(10, prev.maxRetries + 1),
                    }))
                  }
                  size="icon"
                  variant="outline"
                >
                  +
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm" htmlFor="retry-delay">
                Initial Retry Delay (ms)
              </Label>
              <input
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background"
                id="retry-delay"
                max="5000"
                min="100"
                onChange={(e) =>
                  setTrackingOptions((prev: any) => ({
                    ...prev,
                    initialRetryDelay: Number.parseInt(e.target.value),
                  }))
                }
                step="100"
                type="number"
                value={trackingOptions.initialRetryDelay}
              />
            </div>

            <div className="col-span-2 text-muted-foreground text-xs">
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
    <div className="mt-8 flex justify-between border-t pt-4">
      <Button className="h-8 text-xs" onClick={onResetDefaults} size="sm" variant="outline">
        Reset to defaults
      </Button>

      <div className="flex gap-2">
        <Button className="h-8 text-xs" onClick={onEnableAll} size="sm" variant="outline">
          <Check className="mr-1.5 h-3.5 w-3.5" />
          Enable all
        </Button>

        <Button className="h-8 text-xs" onClick={onCopyCode} size="sm">
          <Code className="mr-1.5 h-3.5 w-3.5" />
          Copy {installMethod === "script" ? "script" : "component code"}
        </Button>
      </div>
    </div>
  );
}

function DeleteWebsiteDialog({
  open,
  onOpenChange,
  websiteData,
  isDeleting,
  onConfirmDelete,
}: any) {
  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Website</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Are you sure you want to delete{" "}
                <span className="font-medium">{websiteData.name || websiteData.domain}</span>? This
                action cannot be undone.
              </p>

              <div className="rounded-md bg-amber-50 p-3 text-amber-700 text-sm dark:bg-amber-950/20 dark:text-amber-400">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-500" />
                  <div className="space-y-1">
                    <p className="font-medium">Warning:</p>
                    <ul className="list-disc space-y-1 pl-4 text-xs">
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
            className="bg-red-600 text-white hover:bg-red-700 hover:text-white"
            disabled={isDeleting}
            onClick={onConfirmDelete}
          >
            {isDeleting ? "Deleting..." : "Delete Website"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
