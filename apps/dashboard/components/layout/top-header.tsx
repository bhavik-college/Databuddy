"use client";

import { useState } from "react";
import { ListIcon, InfoIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";
import { NotificationsPopover } from "@/components/notifications/notifications-popover";


const HelpDialog = dynamic(() => import("./help-dialog").then(mod => mod.HelpDialog), {
  ssr: false,
  loading: () => null
});

interface TopHeaderProps {
  setMobileOpen: () => void;
}

export function TopHeader({ setMobileOpen }: TopHeaderProps) {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full h-16 border-b bg-background/95 backdrop-blur-md">
      <div className="flex items-center h-full px-4 md:px-6">
        {/* Left side: Logo + Mobile menu */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={setMobileOpen}
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
            onClick={() => setHelpOpen(true)}
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

      {/* Help dialog */}
      <HelpDialog open={helpOpen} onOpenChange={setHelpOpen} />
    </header>
  );
} 