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
import { TopNav } from "./top-nav";
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
      <TopNav setMobileOpen={setIsMobileOpen} />

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-background border-r transition-transform duration-200 ease-in-out md:translate-x-0 pt-16",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Navigation */}
        <div className="px-4 py-4 h-[calc(100vh-8rem)] overflow-y-auto">
          {isInWebsiteContext ? (
            // Website-specific navigation
            <>
              {/* Back to websites button */}
              <div className="mb-6">
                <Link href="/websites">
                  <Button variant="ghost" className="w-full justify-start mb-4">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    <span>Back to Websites</span>
                  </Button>
                </Link>
                
                {/* Current website name */}
                <div className="px-2 mb-4">
                  <h2 className="text-sm font-semibold truncate">{currentWebsite?.name || currentWebsite?.domain || "Loading..."}</h2>
                  <p className="text-xs text-muted-foreground truncate">{currentWebsite?.domain}</p>
                </div>
              </div>
              
              {/* Website navigation sections */}
              {websiteNavigation.map((section) => (
                <div key={section.title} className="mb-6">
                  <h3 className="px-2 mb-2 text-xs font-medium text-muted-foreground">
                    {section.title}
                  </h3>
                  <div className="space-y-1">
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
                            "flex items-center gap-x-3 px-2 py-2 text-sm rounded-lg transition-colors group",
                            isActive
                              ? "bg-accent text-foreground"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                          )}
                        >
                          <item.icon className={cn(
                            "h-5 w-5",
                            isActive
                              ? "opacity-100" 
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
              <div className="mb-6">
                <Button variant="outline" className="w-full justify-start mb-4 cursor-pointer">
                  <Link href="/websites" className="flex flex-row items-center">
                    <Globe className="h-4 w-4 mr-2" />
                    Websites
                </Link>
                </Button>
                <div className="space-y-1">
                  {isLoading ? (
                    // Loading skeletons
                    <>
                      <div className="px-2 py-1.5">
                        <Skeleton className="h-5 w-full rounded" />
                      </div>
                      <div className="px-2 py-1.5">
                        <Skeleton className="h-5 w-full rounded" />
                      </div>
                    </>
                  ) : websites?.length === 0 ? (
                    // No websites message
                    <div className="px-4 py-2 text-xs text-muted-foreground">
                      No websites yet
                    </div>
                  ) : (
                    // Website list
                    websites?.map((website) => (
                      <Link
                        key={website.id}
                        href={`/websites/${website.id}`}
                        className={cn(
                          "flex items-center gap-x-3 px-2 py-1.5 text-sm rounded-lg transition-colors",
                          pathname === `/websites/${website.id}`
                            ? "bg-accent/70 text-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                        )}
                      >
                        <Globe className="h-4 w-4 mr-1 opacity-75" />
                        <span className="truncate max-w-[180px]">
                          {website.name || website.domain}
                        </span>
                      </Link>
                    ))
                  )}
                </div>
              </div>
              
              {/* Transparency section */}
              {/* <div className="mb-6">
                <h3 className="px-2 mb-2 text-xs font-medium text-muted-foreground">
                  TRANSPARENCY
                </h3>
                <div className="space-y-1">
                  <Link
                    href="/transparency/roadmap"
                    aria-disabled={true}
                    className={cn(
                      "flex items-center gap-x-3 px-2 py-2 text-sm rounded-lg transition-colors group",
                      pathname === "/transparency/roadmap"
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    )}
                  >
                    <MapPin className={cn(
                      "h-5 w-5",
                      pathname === "/transparency/roadmap"
                        ? "opacity-100"
                        : "opacity-75 group-hover:opacity-100"
                    )} />
                    <span>Roadmap</span>
                  </Link>
                  <Link
                    href="/transparency/changelog"
                    className={cn(
                      "flex items-center gap-x-3 px-2 py-2 text-sm rounded-lg transition-colors group",
                      pathname === "/transparency/changelog"
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    )}
                  >
                    <ClipboardList className={cn(
                      "h-5 w-5",
                      pathname === "/transparency/changelog"
                        ? "opacity-100"
                        : "opacity-75 group-hover:opacity-100"
                    )} />
                    <span>Changelog</span>
                  </Link>
                  <Link
                    href="/transparency/feedback"
                    className={cn(
                      "flex items-center gap-x-3 px-2 py-2 text-sm rounded-lg transition-colors group",
                      pathname === "/transparency/feedback"
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    )}
                  >
                    <Megaphone className={cn(
                      "h-5 w-5",
                      pathname === "/transparency/feedback"
                        ? "opacity-100"
                        : "opacity-75 group-hover:opacity-100"
                    )} />
                    <span>Feedback</span>
                  </Link>
                </div>
              </div> */}
              
              {/* Account section */}
              <div className="mb-6">
                <h3 className="px-2 mb-2 text-xs font-medium text-muted-foreground">
                  ACCOUNT
                </h3>
                <div className="space-y-1">
                  <Link
                    href="/settings"
                    className={cn(
                      "flex items-center gap-x-3 px-2 py-2 text-sm rounded-lg transition-colors group",
                      pathname === "/settings"
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    )}
                  >
                    <Settings className={cn(
                      "h-5 w-5",
                      pathname === "/settings" 
                        ? "opacity-100" 
                        : "opacity-75 group-hover:opacity-100"
                    )} />
                    <span>Settings</span>
                  </Link>
                  <Link
                    href="/billing"
                    className={cn(
                      "flex items-center gap-x-3 px-2 py-2 text-sm rounded-lg transition-colors group",
                      pathname === "/billing"
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    )}
                  >
                    <CreditCard className={cn(
                      "h-5 w-5",
                      pathname === "/billing" 
                        ? "opacity-100" 
                        : "opacity-75 group-hover:opacity-100"
                    )} />
                    <span>Billing</span>
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Theme Toggle */}
        <div className="border-t absolute bottom-0 left-0 right-0 p-4 bg-background">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {mounted && theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>

      {/* Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
} 