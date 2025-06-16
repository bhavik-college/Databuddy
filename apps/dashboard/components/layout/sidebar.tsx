"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GlobeIcon, XIcon, } from "@phosphor-icons/react";
import { TopHeader } from "./top-header";
import { useWebsites } from "@/hooks/use-websites";
import { WebsiteHeader } from "./navigation/website-header";
import { mainNavigation, websiteNavigation } from "./navigation/navigation-config";
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

interface SwipeGestureProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  children: React.ReactNode;
  className?: string;
}

function SwipeGesture({ onSwipeLeft, onSwipeRight, children, className }: SwipeGestureProps) {
  const [startX, setStartX] = useState<number | null>(null);
  const [currentX, setCurrentX] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setCurrentX(e.touches[0].clientX);
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!startX || !isDragging) return;
    setCurrentX(e.touches[0].clientX);
  }, [startX, isDragging]);

  const handleTouchEnd = useCallback(() => {
    if (!startX || !currentX || !isDragging) {
      setIsDragging(false);
      setStartX(null);
      setCurrentX(null);
      return;
    }

    const deltaX = currentX - startX;
    const threshold = 50;

    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }

    setIsDragging(false);
    setStartX(null);
    setCurrentX(null);
  }, [startX, currentX, isDragging, onSwipeLeft, onSwipeRight]);

  return (
    <div
      ref={containerRef}
      className={className}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { websites, isLoading } = useWebsites();
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Check if we're on a specific website page
  const websitePathMatch = pathname.match(/^\/websites\/([^\/]+)(?:\/(.*))?$/);
  const currentWebsiteId = websitePathMatch ? websitePathMatch[1] : null;
  const isInWebsiteContext = !!currentWebsiteId;

  // Find current website details
  const currentWebsite = isInWebsiteContext
    ? websites?.find((site: any) => site.id === currentWebsiteId)
    : null;

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileOpen]);

  // Handle swipe to close sidebar
  const handleSwipeLeft = useCallback(() => {
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
  }, [isMobileOpen]);

  // Handle swipe to open sidebar (from edge of screen)
  const handleSwipeRight = useCallback(() => {
    if (!isMobileOpen) {
      setIsMobileOpen(true);
    }
  }, [isMobileOpen]);

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

  // Add edge swipe detection for opening sidebar
  useEffect(() => {
    let startX: number | null = null;
    let isEdgeSwipe = false;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      isEdgeSwipe = startX < 20;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!startX || !isEdgeSwipe || isMobileOpen) return;

      const currentX = e.touches[0].clientX;
      const deltaX = currentX - startX;

      if (deltaX > 50) {
        setIsMobileOpen(true);
        isEdgeSwipe = false;
      }
    };

    const handleTouchEnd = () => {
      startX = null;
      isEdgeSwipe = false;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobileOpen]);

  return (
    <>
      {/* Top Navigation Bar */}
      <TopHeader setMobileOpen={() => setIsMobileOpen(true)} />

      {/* Mobile backdrop */}
      {isMobileOpen && (
        <SwipeGesture
          onSwipeLeft={handleSwipeLeft}
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
        >
          <div
            className="w-full h-full"
            onClick={closeSidebar}
          />
        </SwipeGesture>
      )}

      {/* Sidebar */}
      <SwipeGesture onSwipeLeft={handleSwipeLeft}>
        <div
          ref={sidebarRef}
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

                  {/* Websites section */}
                  <div className="border-t pt-4">
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
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </SwipeGesture>
    </>
  );
}   
