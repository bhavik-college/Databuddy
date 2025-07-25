'use client';

import { InfoIcon, ListIcon } from '@phosphor-icons/react';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { NotificationsPopover } from '@/components/notifications/notifications-popover';
import { Button } from '@/components/ui/button';
import { Logo } from './logo';
import { ThemeToggle } from './theme-toggle';
import { UserMenu } from './user-menu';

const HelpDialog = dynamic(
  () => import('./help-dialog').then((mod) => mod.HelpDialog),
  {
    ssr: false,
    loading: () => null,
  }
);

interface TopHeaderProps {
  setMobileOpen: () => void;
}

export function TopHeader({ setMobileOpen }: TopHeaderProps) {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <header className="fixed top-0 right-0 left-0 z-50 h-16 w-full border-b bg-background/95 backdrop-blur-md">
      <div className="flex h-full items-center px-4 md:px-6">
        {/* Left side: Logo + Mobile menu */}
        <div className="flex items-center gap-4">
          <Button
            className="md:hidden"
            onClick={setMobileOpen}
            size="icon"
            variant="ghost"
          >
            <ListIcon className="h-5 w-5" size={32} weight="duotone" />
            <span className="sr-only">Toggle menu</span>
          </Button>

          <div className="flex select-none items-center gap-3">
            <div className="flex flex-row items-center gap-3">
              <Logo />
            </div>
          </div>
        </div>

        {/* Right Side - User Controls */}
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />

          {/* Help */}
          <Button
            className="hidden h-8 w-8 md:flex"
            onClick={() => setHelpOpen(true)}
            size="icon"
            variant="ghost"
          >
            <InfoIcon className="h-6 w-6" size={32} weight="duotone" />
            <span className="sr-only">Help</span>
          </Button>

          {/* Notifications */}
          <NotificationsPopover />

          {/* User Menu */}
          <UserMenu />
        </div>
      </div>

      {/* Help dialog */}
      <HelpDialog onOpenChange={setHelpOpen} open={helpOpen} />
    </header>
  );
}
