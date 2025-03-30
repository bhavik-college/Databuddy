"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard,
  Settings,
  Sun,
  Moon,
  BarChart,
  FileText,
  Globe,
  PlusCircle,
  Filter,
  Target,
  TestTube,
  CreditCard,
  BookOpen,
  LifeBuoy,
  ChevronDown,
  ArrowLeft,
  Users,
  Clock,
  Map,
  MapPin,
  ClipboardList,
  Megaphone,
  Inbox,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { TopHeader } from "./top-header";
import { useWebsites } from "@/hooks/use-websites";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
// import { OrganizationSelector } from "./organization-selector";

// Website-specific navigation items
const websiteNavigation = [
  {
    title: "ANALYTICS",
    items: [
      { name: "Overview", icon: LayoutDashboard, href: "" },
      // { name: "Sessions", icon: Clock, href: "/sessions" },
      // { name: "Profiles", icon: Users, href: "/profiles" },
      // { name: "Geography", icon: Map, href: "/geography" },
    ],
  },
  // {
  //   title: "ANALYSIS",
  //   items: [
  //     { name: "Funnels", icon: Filter, href: "/funnels" },
  //     { name: "Goals", icon: Target, href: "/goals" },
  //     { name: "A/B Testing", icon: TestTube, href: "/experiments" },
  //   ],
  // },
  // {
  //   title: "TRANSPARENCY",
  //   items: [
  //     { name: "Roadmap", icon: MapPin, href: "/transparency/roadmap", disabled: true },
  //     { name: "Changelog", icon: ClipboardList, href: "/transparency/changelog", disabled: true },
  //     { name: "Feedback", icon: Megaphone, href: "/transparency/feedback", disabled: true },
  //   ],
  // },
  {
    title: "ACCOUNT",
    items: [
      { name: "Settings", icon: Settings, href: "/settings" },
      { name: "Billing", icon: CreditCard, href: "/billing" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { websites, isLoading } = useWebsites();

  // Check if we're on a specific website page
  const websitePathMatch = pathname.match(/^\/websites\/([^\/]+)(?:\/(.*))?$/);
  const currentWebsiteId = websitePathMatch ? websitePathMatch[1] : null;
  const currentWebsiteSubpath = websitePathMatch ? websitePathMatch[2] || "" : "";
  const isInWebsiteContext = !!currentWebsiteId;

  // Find current website details
  const currentWebsite = isInWebsiteContext 
    ? websites?.find(site => site.id === currentWebsiteId) 
    : null;

  // This effect runs once after mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {/* Top Navigation Bar */}
      <TopHeader setMobileOpen={setIsMobileOpen} />

      {/* Mobile sidebar backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 bg-background border-r transition-transform duration-300 ease-in-out md:translate-x-0 pt-16 shadow-sm",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Navigation */}
        <div className="px-4 py-5 h-[calc(100vh-8rem)] overflow-y-auto">
          {isInWebsiteContext ? (
            // Website-specific navigation
            <>
              {/* Back to websites button */}
              <div className="mb-6">
                <Link href="/websites">
                  <Button variant="outline" className="w-full justify-start mb-5 group focus-ring">
                    <ArrowLeft className="h-4 w-4 mr-2.5 group-hover:-translate-x-0.5 transition-transform" />
                    <span>Back to Websites</span>
                  </Button>
                </Link>
                
                {/* Current website name */}
                <div className="px-2 py-1 mb-4">
                  <h2 className="text-base font-semibold truncate">
                    {currentWebsite?.name || currentWebsite?.domain || (
                      <Skeleton className="h-5 w-36" />
                    )}
                  </h2>
                  <div className="text-sm text-muted-foreground truncate mt-0.5">
                    {currentWebsite ? 
                      currentWebsite.domain : 
                      <Skeleton className="h-4 w-24 mt-1" />
                    }
                  </div>
                </div>
              </div>
              
              {/* Website navigation sections */}
              {websiteNavigation.map((section) => (
                <div key={section.title} className="mb-8">
                  <h3 className="px-2 mb-3 text-xs font-semibold text-muted-foreground tracking-wider">
                    {section.title}
                  </h3>
                  <div className="space-y-1.5">
                    {section.items.map((item) => {
                      const fullPath = `/websites/${currentWebsiteId}${item.href}`;
                      const isActive = item.href === "" 
                        ? pathname === `/websites/${currentWebsiteId}` 
                        : pathname === fullPath;
                      
                      return (
                        <Link
                          key={item.name}
                          href={fullPath}
                          className={cn(
                            "flex items-center gap-x-3.5 px-3 py-2.5 text-sm rounded-md transition-all focus-ring",
                            isActive
                              ? "bg-primary/10 text-primary font-medium shadow-sm"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                          )}
                        >
                          <item.icon className={cn(
                            "h-5 w-5",
                            isActive
                              ? "text-primary" 
                              : "opacity-75 group-hover:opacity-100"
                          )} />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </>
          ) : (
            // Regular sidebar for website selection page
            <>
              <div className="mb-8">
                <Button variant="default" className="w-full justify-start mb-5 focus-ring">
                  <Link href="/websites" className="flex flex-row items-center">
                    <Globe className="h-4 w-4 mr-2.5" />
                    Websites
                  </Link>
                </Button>

                <div className="space-y-1.5 mt-5">
                  {isLoading ? (
                    // Loading skeletons
                    <>
                      <div className="px-2 py-2">
                        <Skeleton className="h-5 w-full rounded-md" />
                      </div>
                      <div className="px-2 py-2">
                        <Skeleton className="h-5 w-full rounded-md" />
                      </div>
                      <div className="px-2 py-2">
                        <Skeleton className="h-5 w-full rounded-md" />
                      </div>
                    </>
                  ) : websites?.length === 0 ? (
                    // No websites message
                    <div className="px-4 py-3 text-sm text-muted-foreground bg-accent/50 rounded-md">
                      No websites yet
                    </div>
                  ) : (
                    // Website list
                    <Collapsible
                      defaultOpen
                      className="space-y-1.5"
                    >
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground cursor-pointer">
                          <span className="font-medium">Your Websites</span>
                          <ChevronDown className="h-4 w-4" />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-1.5 space-y-1">
                        {websites.map((site) => (
                          <Link
                            key={site.id}
                            href={`/websites/${site.id}`}
                            className={cn(
                              "flex items-center justify-between px-3 py-2.5 text-sm rounded-md transition-all focus-ring",
                              pathname === `/websites/${site.id}`
                                ? "bg-primary/10 text-primary font-medium shadow-sm"
                                : "text-foreground hover:bg-accent/50"
                            )}
                          >
                            <span className="truncate">{site.name || site.domain}</span>
                          </Link>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </div>
              </div>

              {/* Add other navigation sections here */}
              <div className="mb-8">
                <h3 className="px-2 mb-3 text-xs font-semibold text-muted-foreground tracking-wider">
                  ACCOUNT
                </h3>
                <div className="space-y-1.5">
                  <Link
                    href="/settings"
                    className={cn(
                      "flex items-center gap-x-3.5 px-3 py-2.5 text-sm rounded-md transition-all focus-ring",
                      pathname === "/settings"
                        ? "bg-primary/10 text-primary font-medium shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    )}
                  >
                    <Settings className="h-5 w-5" />
                    <span>Settings</span>
                  </Link>
                  <Link
                    href="/billing"
                    className={cn(
                      "flex items-center gap-x-3.5 px-3 py-2.5 text-sm rounded-md transition-all focus-ring",
                      pathname === "/billing"
                        ? "bg-primary/10 text-primary font-medium shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    )}
                  >
                    <CreditCard className="h-5 w-5" />
                    <span>Billing</span>
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Theme toggle at the bottom of sidebar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Theme</span>
            <Button
              variant="ghost"
              size="icon"
              className="focus-ring h-8 w-8"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {mounted && theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
} 