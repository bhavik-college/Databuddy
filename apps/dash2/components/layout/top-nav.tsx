"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "@databuddy/auth/client";
import { Bell, Menu, Search, ChevronDown, LayoutDashboard, LogOut, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CommandSearch } from "@/components/ui/command-search";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export function TopNav({
  setMobileOpen,
}: {
  setMobileOpen: (open: boolean) => void;
}) {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [mounted, setMounted] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Function to get user initials for avatar fallback
  const getUserInitials = () => {
    if (!session?.user?.name) return "U";
    return session.user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Handle logout
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      router.push("/login");
    } catch (error: any) {
      toast.error(error.message || "Failed to log out");
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Always render the component structure, even when not mounted yet
  // This prevents layout shifts and disappearing elements
  return (
    <>
      {mounted && <CommandSearch />}
      <header className="fixed top-0 left-0 right-0 z-50 w-full h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between h-full px-4 md:px-6">
          {/* Left Side */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden focus-ring"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
            <Link href="/dashboard" className="flex items-center gap-2.5 group transition-all duration-200">
              <div className="p-1.5 rounded-md bg-primary shadow-sm group-hover:shadow-md transition-all duration-200">
                <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-lg">Databuddy</span>
            </Link>
          </div>

          {/* Center - Search */}
          <div className="hidden md:block max-w-md w-full mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search... (⌘K)"
                className="pl-10 pr-4 h-10 focus-ring transition-all duration-200"
                onClick={() => {
                  if (mounted) {
                    // Simulate a cmd+k keypress to open search
                    document.dispatchEvent(
                      new KeyboardEvent("keydown", {
                        key: "k",
                        metaKey: true,
                      })
                    );
                  }
                }}
              />
            </div>
          </div>

          {/* Right Side - User Controls */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative focus-ring">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
              <span className="sr-only">Notifications</span>
            </Button>

            {/* User Menu - Show skeleton while loading */}
            {!mounted || isPending ? (
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-9 rounded-full" />
                <Skeleton className="h-4 w-4" />
              </div>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2.5 h-9 px-2 rounded-full focus-ring transition-all duration-200 hover:bg-accent"
                  >
                    <Avatar className="h-9 w-9 border border-border/50">
                      <AvatarImage
                        src={session?.user?.image || ""}
                        alt={session?.user?.name || "User"}
                      />
                      <AvatarFallback className="text-sm font-medium">{getUserInitials()}</AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-1.5">
                  <div className="flex items-center justify-start gap-3 p-3">
                    <Avatar className="h-10 w-10 border border-border/50">
                      <AvatarImage
                        src={session?.user?.image || ""}
                        alt={session?.user?.name || "User"}
                      />
                      <AvatarFallback className="font-medium">{getUserInitials()}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-sm font-medium leading-none">
                        {session?.user?.name || "User"}
                      </span>
                      <span className="text-xs leading-none text-muted-foreground">
                        {session?.user?.email || ""}
                      </span>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuItem asChild className="focus-ring h-9 rounded-md">
                    <Link href="/dashboard" className="flex items-center w-full">
                      <LayoutDashboard className="mr-2.5 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="focus-ring h-9 rounded-md">
                    <Link href="/settings" className="flex items-center w-full">
                      <Settings className="mr-2.5 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="cursor-pointer focus-ring h-9 rounded-md text-destructive focus:text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="mr-2.5 h-4 w-4" />
                    {isLoggingOut ? "Signing out..." : "Sign out"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>
    </>
  );
} 