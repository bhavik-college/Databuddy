"use client";

import { GlobeIcon, XIcon } from "@phosphor-icons/react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWebsites } from "@/hooks/use-websites";
import { cn } from "@/lib/utils";
import {
  demoNavigation,
  mainNavigation,
  sandboxNavigation,
  websiteNavigation,
} from "./navigation/navigation-config";
import { SandboxHeader } from "./navigation/sandbox-header";
import { WebsiteHeader } from "./navigation/website-header";
import { OrganizationSelector } from "./organization-selector";
import { TopHeader } from "./top-header";

const WebsiteList = dynamic(
  () => import("./navigation/website-list").then((mod) => mod.WebsiteList),
  {
    ssr: false,
    loading: () => null,
  }
);

const NavigationSection = dynamic(
  () => import("./navigation/navigation-section").then((mod) => mod.NavigationSection),
  {
    ssr: false,
    loading: () => null,
  }
);

export function Sidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { websites, isLoading } = useWebsites();

  // Check if we're on a specific website page
  const websitePathMatch = pathname.match(/^\/websites\/([^/]+)(?:\/(.*))?$/);
  const demoPathMatch = pathname.match(/^\/demo\/([^/]+)(?:\/(.*))?$/);
  const currentWebsiteId = websitePathMatch
    ? websitePathMatch[1]
    : demoPathMatch
      ? demoPathMatch[1]
      : null;

  // Check context - demo takes precedence over website
  const isInDemoContext = pathname.startsWith("/demo");
  const isInSandboxContext = pathname.startsWith("/sandbox");
  const isInWebsiteContext = !(isInDemoContext || isInSandboxContext) && !!currentWebsiteId;

  // Find current website details
  const currentWebsite =
    isInWebsiteContext || isInDemoContext
      ? websites?.find((site: any) => site.id === currentWebsiteId)
      : null;

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const closeSidebar = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileOpen) {
        closeSidebar();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMobileOpen, closeSidebar]);

  return (
    <>
      {/* Top Navigation Bar */}
      <TopHeader setMobileOpen={() => setIsMobileOpen(true)} />

      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/20 md:hidden" onClick={closeSidebar} />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-background",
          "border-r pt-16 transition-transform duration-200 ease-out md:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Mobile close button */}
        <Button
          className="absolute top-3 right-3 z-50 h-8 w-8 p-0 md:hidden"
          onClick={closeSidebar}
          size="sm"
          variant="ghost"
        >
          <XIcon className="h-4 w-4" size={32} weight="duotone" />
          <span className="sr-only">Close sidebar</span>
        </Button>

        <ScrollArea className="h-[calc(100vh-4rem)]">
          <div className="space-y-4 p-3">
            {isInWebsiteContext ? (
              // Website-specific navigation
              <div className="space-y-4">
                <WebsiteHeader website={currentWebsite} />

                {websiteNavigation.map((section) => (
                  <NavigationSection
                    currentWebsiteId={currentWebsiteId}
                    items={section.items}
                    key={section.title}
                    pathname={pathname}
                    title={section.title}
                  />
                ))}
              </div>
            ) : isInDemoContext ? (
              // Demo-specific navigation
              <div className="space-y-4">
                <WebsiteHeader website={currentWebsite} />

                {demoNavigation.map((section) => (
                  <NavigationSection
                    currentWebsiteId={currentWebsiteId}
                    items={section.items}
                    key={section.title}
                    pathname={pathname}
                    title={section.title}
                  />
                ))}
              </div>
            ) : isInSandboxContext ? (
              // Sandbox-specific navigation
              <div className="space-y-4">
                <SandboxHeader />

                {sandboxNavigation.map((section) => (
                  <NavigationSection
                    currentWebsiteId="sandbox"
                    items={section.items}
                    key={section.title}
                    pathname={pathname}
                    title={section.title}
                  />
                ))}
              </div>
            ) : (
              // Main navigation
              <div className="space-y-4">
                {/* Organization Selector */}
                <OrganizationSelector />

                {/* Main navigation sections */}
                {mainNavigation.map((section) => (
                  <NavigationSection
                    items={section.items}
                    key={section.title}
                    pathname={pathname}
                    title={section.title}
                  />
                ))}

                {!isInDemoContext && (
                  <div className="border-t pt-4">
                    <h3 className="mb-2 flex items-center gap-2 px-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                      <GlobeIcon className="h-5 w-5" size={32} weight="duotone" />
                      Websites
                    </h3>
                    <WebsiteList isLoading={isLoading} pathname={pathname} websites={websites} />
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </>
  );
}
