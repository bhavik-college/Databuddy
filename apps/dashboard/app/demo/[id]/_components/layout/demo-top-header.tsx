"use client";

import { Button } from "@/components/ui/button";
import { MenuIcon } from "lucide-react";
import Link from "next/link";

interface DemoTopHeaderProps {
    setMobileOpen: (open: boolean) => void;
}

export function DemoTopHeader({ setMobileOpen }: DemoTopHeaderProps) {
    return (
        <div className="fixed top-0 left-0 right-0 z-30 h-16 bg-background border-b">
            <div className="flex h-full items-center justify-between px-4">
                {/* Left side - Mobile menu button */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="md:hidden h-8 w-8 p-0"
                    onClick={() => setMobileOpen(true)}
                >
                    <MenuIcon className="h-4 w-4" />
                    <span className="sr-only">Open sidebar</span>
                </Button>

                {/* Center - Logo/Brand */}
                <div className="flex items-center gap-2">
                    <Link href="/demo" className="flex items-center gap-2 font-bold text-lg">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <span className="text-primary-foreground text-sm font-bold">D</span>
                        </div>
                        <span className="hidden sm:inline">Databuddy Demo</span>
                    </Link>
                </div>

            </div>
        </div>
    );
} 