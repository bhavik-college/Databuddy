"use client";

import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface DemoTopHeaderProps {
  setMobileOpen: (open: boolean) => void;
}

export function DemoTopHeader({ setMobileOpen }: DemoTopHeaderProps) {
  return (
    <div className="fixed top-0 right-0 left-0 z-30 h-16 border-b bg-background">
      <div className="flex h-full items-center justify-between px-4">
        {/* Left side - Mobile menu button */}
        <Button
          className="h-8 w-8 p-0 md:hidden"
          onClick={() => setMobileOpen(true)}
          size="sm"
          variant="ghost"
        >
          <MenuIcon className="h-4 w-4" />
          <span className="sr-only">Open sidebar</span>
        </Button>

        {/* Center - Logo/Brand */}
        <div className="flex items-center gap-2">
          <Link className="flex items-center gap-2 font-bold text-lg" href="/demo">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="font-bold text-primary-foreground text-sm">D</span>
            </div>
            <span className="hidden sm:inline">Databuddy Demo</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
