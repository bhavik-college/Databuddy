"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GlobeIcon, XIcon, HouseIcon, ClockIcon, UsersIcon, MapPinIcon, ListIcon, InfoIcon, GitBranchIcon, BugIcon, FunnelIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { NotificationsPopover } from "@/components/notifications/notifications-popover";

const demoNavigation = [
    {
        title: "Analytics",
        items: [
            { name: "Overview", icon: HouseIcon, href: "/demo/OXmNQsViBT-FOS_wZCTHc", highlight: true },
            { name: "Sessions", icon: ClockIcon, href: "/demo/OXmNQsViBT-FOS_wZCTHc/sessions", highlight: true },
            { name: "Funnels", icon: FunnelIcon, href: "/demo/OXmNQsViBT-FOS_wZCTHc/funnels", highlight: true },
            { name: "Journeys", icon: GitBranchIcon, href: "/demo/OXmNQsViBT-FOS_wZCTHc/journeys", highlight: true },
            { name: "Errors", icon: BugIcon, href: "/demo/OXmNQsViBT-FOS_wZCTHc/errors", highlight: true },
            { name: "Profiles", icon: UsersIcon, href: "/demo/OXmNQsViBT-FOS_wZCTHc/profiles", highlight: true },
            { name: "Map", icon: MapPinIcon, href: "/demo/OXmNQsViBT-FOS_wZCTHc/map", highlight: true },
        ],
    }
];


export function Sidebar() {
    const pathname = usePathname();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

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
            {/* Top Header */}
            <header className="fixed top-0 left-0 right-0 z-50 w-full h-16 border-b bg-background/95 backdrop-blur-md">
                <div className="flex items-center h-full px-4 md:px-6">
                    {/* Left side: Logo + Mobile menu */}
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden"
                            onClick={() => setIsMobileOpen(true)}
                        >
                            <ListIcon size={32} weight="duotone" className="h-5 w-5" />
                            <span className="sr-only">Toggle menu</span>
                        </Button>

                        <div className="flex items-center gap-3">
                            <div className="flex flex-row items-center gap-3">
                                <Logo />
                            </div>
                        </div>
                    </div>

                    {/* Right Side - User Controls */}
                    <div className="flex items-center gap-2 ml-auto">
                        <ThemeToggle />

                        {/* Help */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="hidden md:flex h-8 w-8"
                        >
                            <InfoIcon size={32} weight="duotone" className="h-6 w-6" />
                            <span className="sr-only">Help</span>
                        </Button>

                        {/* Notifications */}
                        <NotificationsPopover />

                        {/* User Menu */}
                        <UserMenu />
                    </div>
                </div>
            </header>

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
                        {/* Demo Website Header */}
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded border">
                            <div className="p-2 rounded bg-primary/10 border border-primary/20">
                                <GlobeIcon size={32} weight="duotone" className="h-5 w-5 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h2 className="font-semibold text-sm truncate">Landing Page</h2>
                                <Link href="https://www.databuddy.cc" target="_blank" className="text-xs text-muted-foreground truncate">www.databuddy.cc</Link>
                            </div>
                        </div>

                        {/* Demo Navigation */}
                        {demoNavigation.map((section) => (
                            <div key={section.title}>
                                <h3 className="px-2 mb-2 text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                                    {section.title}
                                </h3>
                                <div className="space-y-1 ml-1">
                                    {section.items.map((item) => {
                                        const isActive = pathname === item.href;
                                        const Icon = item.icon;

                                        return (
                                            <Link
                                                key={item.name}
                                                href={item.href}
                                                className={cn(
                                                    "flex items-center gap-3 px-3 py-2 text-sm rounded transition-all cursor-pointer",
                                                    isActive
                                                        ? "bg-primary/15 text-primary font-medium"
                                                        : "text-foreground hover:bg-accent/70"
                                                )}
                                            >
                                                <Icon size={32} weight="duotone" className={cn("h-4 w-4", isActive && "text-primary")} />
                                                <span className="truncate">{item.name}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>
        </>
    );
} 