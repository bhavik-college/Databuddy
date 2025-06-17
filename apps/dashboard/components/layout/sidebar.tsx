"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GlobeIcon, XIcon } from "@phosphor-icons/react";
import { TopHeader } from "./top-header";
import { useWebsites } from "@/hooks/use-websites";
import { WebsiteHeader } from "./navigation/website-header";
import { SandboxHeader } from "./navigation/sandbox-header";
import { mainNavigation, websiteNavigation, sandboxNavigation, demoNavigation } from "./navigation/navigation-config";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";

const WebsiteList = dynamic(() => import("./navigation/website-list").then(mod => mod.WebsiteList), {
  ssr: false,
  loading: () => null
});

const NavigationSection = dynamic(() => import("./navigation/navigation-section").then(mod => mod.NavigationSection), {
  ssr: false,
  loading: () => null
});

export function Sidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { websites, isLoading } = useWebsites();

  // Check if we're on a specific website page
  const websitePathMatch = pathname.match(/^\/websites\/([^\/]+)(?:\/(.*))?$/);
  const demoPathMatch = pathname.match(/^\/demo\/([^\/]+)(?:\/(.*))?$/);
  const currentWebsiteId = websitePathMatch ? websitePathMatch[1] : demoPathMatch ? demoPathMatch[1] : null;

  // Check context - demo takes precedence over website
  const isInDemoContext = pathname.startsWith('/demo');
  const isInSandboxContext = pathname.startsWith('/sandbox');
  const isInWebsiteContext = !isInDemoContext && !isInSandboxContext && !!currentWebsiteId;

  // Find current website details
  const currentWebsite = isInWebsiteContext || isInDemoContext
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
      if (e.key === 'Escape' && isMobileOpen) {
        closeSidebar();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, closeSidebar]);

  return (
    <>
      {/* Top Navigation Bar */}
      <TopHeader setMobileOpen={() => setIsMobileOpen(true)} />

      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-background",
          "border-r transition-transform duration-200 ease-out md:translate-x-0 pt-16",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Mobile close button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-3 right-3 z-50 md:hidden h-8 w-8 p-0"
          onClick={closeSidebar}
        >
          <XIcon size={32} weight="duotone" className="h-4 w-4" />
          <span className="sr-only">Close sidebar</span>
        </Button>

        <ScrollArea className="h-[calc(100vh-4rem)]">
          <div className="p-3 space-y-4">
            {isInWebsiteContext ? (
              // Website-specific navigation
              <div className="space-y-4">
                <WebsiteHeader website={currentWebsite} />

                {websiteNavigation.map((section) => (
                  <NavigationSection
                    key={section.title}
                    title={section.title}
                    items={section.items}
                    pathname={pathname}
                    currentWebsiteId={currentWebsiteId}
                  />
                ))}
              </div>
            ) : isInDemoContext ? (
              // Demo-specific navigation
              <div className="space-y-4">
                <WebsiteHeader website={currentWebsite} />

                {demoNavigation.map((section) => (
                  <NavigationSection
                    key={section.title}
                    title={section.title}
                    items={section.items}
                    pathname={pathname}
                    currentWebsiteId={currentWebsiteId}
                  />
                ))}
              </div>
            ) : isInSandboxContext ? (
              // Sandbox-specific navigation
              <div className="space-y-4">
                <SandboxHeader />

                {sandboxNavigation.map((section) => (
                  <NavigationSection
                    key={section.title}
                    title={section.title}
                    items={section.items}
                    pathname={pathname}
                    currentWebsiteId="sandbox"
                  />
                ))}
              </div>
            ) : (
              // Main navigation
              <div className="space-y-4">
                {/* Main navigation sections */}
                {mainNavigation.map((section) => (
                  <NavigationSection
                    key={section.title}
                    title={section.title}
                    items={section.items}
                    pathname={pathname}
                  />
                ))}



                {!isInDemoContext && <div className="border-t pt-4">
                  <h3 className="px-2 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <GlobeIcon size={32} weight="duotone" className="h-5 w-5" />
                    Websites
                  </h3>
                  <WebsiteList
                    websites={websites}
                    isLoading={isLoading}
                    pathname={pathname}
                  />
                </div>
                }
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </>
  );
}   
