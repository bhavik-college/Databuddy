"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut } from "@databuddy/auth/client";
import { useOrganizationSelector } from "@databuddy/auth";
import { toast } from "sonner";
import { 
  Bell, 
  Menu, 
  LayoutDashboard, 
  LogOut, 
  Settings, 
  Users, 
  Building2, 
  HelpCircle, 
  Plus,
  Home,
  User,
  BookOpen,
  Moon,
  Sun,
  MessageSquare,
  Laptop,
  BarChart
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuShortcut
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TopHeaderProps {
  setMobileOpen: (open: boolean) => void;
}

export function TopHeader({ setMobileOpen }: TopHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = useSession();
  const { theme, setTheme } = useTheme();
//   const { organizations, activeOrganization, selectOrganization } = useOrganizationSelector();
  
  // States
  const [mounted, setMounted] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  // Mock notifications - in a real app these would come from an API
  const notifications = [
    { id: 1, title: "New visitor on Website X", time: "5 min ago", read: false, type: "analytics" },
    { id: 2, title: "Free plan limit reached", time: "2 hours ago", read: false, type: "billing" }
  ];

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

  // Handle organization selection
//   const handleSelectOrganization = async (id: string) => {
//     try {
//       await selectOrganization(id);
//       toast.success("Organization switched successfully");
//     } catch (error) {
//       toast.error("Failed to switch organization");
//     }
//   };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full h-16 border-b bg-background/95 backdrop-blur-md">
      <div className="flex items-center h-full px-4 md:px-6">
        {/* Left side: Logo + Mobile menu */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>

          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="p-1.5 rounded-md bg-primary shadow-sm group-hover:shadow-md transition-all duration-200">
              <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">Databuddy</span>
          </Link>

          {/* Organization selector */}
          {/* {mounted && (
            <div className="hidden md:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 h-9 pl-2 pr-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded bg-primary/10">
                      {activeOrganization?.logo ? (
                        <img 
                          src={activeOrganization.logo} 
                          alt={activeOrganization.name} 
                          className="w-full h-full object-cover rounded" 
                        />
                      ) : (
                        <Building2 className="h-3.5 w-3.5 text-primary" />
                      )}
                    </div>
                    <span className="font-medium truncate max-w-[120px]">
                      {activeOrganization?.name || "Personal"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="start">
                  <DropdownMenuLabel className="text-xs">Your Organizations</DropdownMenuLabel>
                  
                  {organizations && organizations.length > 0 ? (
                    <DropdownMenuGroup>
                      {organizations.map((org) => (
                        <DropdownMenuItem
                          key={org.id}
                          onClick={() => handleSelectOrganization(org.id)}
                          className={cn(
                            "flex items-center gap-2 cursor-pointer",
                            activeOrganization?.id === org.id && "bg-accent"
                          )}
                        >
                          <div className="flex items-center justify-center w-6 h-6 rounded bg-primary/10">
                            {org.logo ? (
                              <img
                                src={org.logo}
                                alt={org.name}
                                className="w-full h-full object-cover rounded"
                              />
                            ) : (
                              <Building2 className="h-3.5 w-3.5 text-primary" />
                            )}
                          </div>
                          <span className="text-sm truncate">{org.name}</span>
                          {activeOrganization?.id === org.id && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"></div>
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
                  ) : (
                    <div className="text-xs text-center py-2 px-2 text-muted-foreground">
                      No organizations yet
                    </div>
                  )}

                  <DropdownMenuSeparator />
                  
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onClick={() => router.push("/organizations/new")}
                      className="cursor-pointer"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      <span className="text-sm">Create Organization</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push("/organizations/settings")}
                      className="cursor-pointer"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      <span className="text-sm">Manage Organizations</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )} */}
        </div>

        {/* Right Side - User Controls */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Theme toggle */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="hidden md:flex h-8 w-8"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  {mounted && theme === "dark" ? (
                    <Moon className="h-4 w-4" />
                  ) : (
                    <Sun className="h-4 w-4" />
                  )}
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{theme === "dark" ? "Light mode" : "Dark mode"}</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Help */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="hidden md:flex h-8 w-8"
                  onClick={() => setHelpOpen(true)}
                >
                  <HelpCircle className="h-4 w-4" />
                  <span className="sr-only">Help</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Help & Resources</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Notifications */}
          <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative h-8 w-8">
                      <Bell className="h-4 w-4" />
                      {notifications.filter(n => !n.read).length > 0 && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
                      )}
                      <span className="sr-only">Notifications</span>
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>Notifications</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="flex items-center justify-between p-3 border-b">
                <h4 className="font-medium text-sm">Notifications</h4>
                <Button variant="ghost" size="sm" className="h-7 text-xs">Mark all as read</Button>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.length > 0 ? (
                  <div className="divide-y">
                    {notifications.map(notification => (
                      <div 
                        key={notification.id} 
                        className={cn(
                          "p-3 flex gap-3 hover:bg-muted/50 cursor-pointer transition-colors",
                          !notification.read && "bg-accent/20"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                          notification.type === 'analytics' && "bg-blue-100 text-blue-700",
                          notification.type === 'billing' && "bg-amber-100 text-amber-700"
                        )}>
                          {notification.type === 'analytics' && <BarChart className="h-4 w-4" />}
                          {notification.type === 'billing' && <Bell className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <span className={cn(
                              "text-sm",
                              !notification.read && "font-medium"
                            )}>
                              {notification.title}
                            </span>
                            {!notification.read && (
                              <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground mt-1 block">{notification.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <span className="text-muted-foreground text-sm">No notifications</span>
                  </div>
                )}
              </div>
              <div className="p-2 border-t">
                <Button variant="outline" className="w-full h-8 text-xs">
                  View all notifications
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* User Menu */}
          {!mounted || isPending ? (
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-9 rounded-full" />
            </div>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex h-9 w-9 rounded-full"
                >
                  <Avatar className="h-9 w-9 border border-border/50">
                    <AvatarImage
                      src={session?.user?.image || ""}
                      alt={session?.user?.name || "User"}
                    />
                    <AvatarFallback className="text-sm font-medium bg-primary/10 text-primary">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-2">
                <div className="flex items-center justify-start gap-3 p-2 mb-1">
                  <Avatar className="h-9 w-9 border border-border/50">
                    <AvatarImage
                      src={session?.user?.image || ""}
                      alt={session?.user?.name || "User"}
                    />
                    <AvatarFallback className="text-sm font-medium">{getUserInitials()}</AvatarFallback>
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
                
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild className="h-9 rounded-md">
                    <Link href="/dashboard" className="flex items-center w-full">
                      <LayoutDashboard className="mr-2.5 h-4 w-4" />
                      Dashboard
                      <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="h-9 rounded-md">
                    <Link href="/settings/profile" className="flex items-center w-full">
                      <User className="mr-2.5 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="h-9 rounded-md">
                    <Link href="/settings" className="flex items-center w-full">
                      <Settings className="mr-2.5 h-4 w-4" />
                      Settings
                      <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                
                <DropdownMenuSeparator className="my-1" />
                
                <DropdownMenuItem 
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="cursor-pointer h-9 rounded-md text-destructive focus:text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="mr-2.5 h-4 w-4" />
                  {isLoggingOut ? "Signing out..." : "Sign out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      
      {/* Help dialog */}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Help & Resources</DialogTitle>
            <DialogDescription>
              Get assistance and learn more about Databuddy
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <Button variant="outline" className="justify-start text-left h-auto py-3">
              <div className="flex items-start gap-3">
                <BookOpen className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm">Documentation</h4>
                  <span className="text-xs text-muted-foreground mt-1 block">Read guides and API references</span>
                </div>
              </div>
            </Button>
            <Button variant="outline" className="justify-start text-left h-auto py-3">
              <div className="flex items-start gap-3">
                <MessageSquare className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm">Contact Support</h4>
                  <span className="text-xs text-muted-foreground mt-1 block">Get help from our support team</span>
                </div>
              </div>
            </Button>
            <Button variant="outline" className="justify-start text-left h-auto py-3">
              <div className="flex items-start gap-3">
                <Laptop className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm">Tutorials</h4>
                  <span className="text-xs text-muted-foreground mt-1 block">Learn Databuddy step by step</span>
                </div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
} 