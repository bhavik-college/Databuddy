"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  User, Settings, LogOut, CreditCard, 
  BarChart2, Shield, HelpCircle, Bell
} from "lucide-react";
import { toast } from "sonner";

interface UserDropdownProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function UserDropdown({ user }: UserDropdownProps) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut({ fetchOptions: {
        onSuccess: () => {
          toast.success("Signed out successfully");
          router.push("/");
          router.refresh();
        }
      } });
      toast.success("Signed out successfully");
      router.push("/");
      router.refresh();
    } catch (error) {
      toast.error("Failed to sign out");
      console.error("Sign out error:", error);
    } finally {
      setIsSigningOut(false);
    }
  };

  // Get user initials for avatar fallback
  const getInitials = () => {
    if (!user.name) return "U";
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10 border border-slate-700">
            <AvatarImage src={user.image || ""} alt={user.name || "User"} />
            <AvatarFallback className="bg-slate-800 text-sky-500">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-slate-900 border-slate-800 text-slate-300" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium text-white">{user.name}</p>
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-slate-800" />
        <DropdownMenuGroup>
          <DropdownMenuItem className="hover:bg-slate-800 hover:text-white cursor-pointer">
            <Link href="/dashboard" className="flex w-full items-center">
              <BarChart2 className="mr-2 h-4 w-4 text-sky-400" />
              <span>Dashboard</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="hover:bg-slate-800 hover:text-white cursor-pointer">
            <Link href="/dashboard/settings/profile" className="flex w-full items-center">
              <User className="mr-2 h-4 w-4 text-sky-400" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="hover:bg-slate-800 hover:text-white cursor-pointer">
            <Link href="/dashboard/settings/account" className="flex w-full items-center">
              <Settings className="mr-2 h-4 w-4 text-sky-400" />
              <span>Account Settings</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="hover:bg-slate-800 hover:text-white cursor-pointer">
            <Link href="/dashboard/settings/billing" className="flex w-full items-center">
              <CreditCard className="mr-2 h-4 w-4 text-sky-400" />
              <span>Billing</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="hover:bg-slate-800 hover:text-white cursor-pointer">
            <Link href="/dashboard/settings/notifications" className="flex w-full items-center">
              <Bell className="mr-2 h-4 w-4 text-sky-400" />
              <span>Notifications</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-slate-800" />
        <DropdownMenuGroup>
          <DropdownMenuItem className="hover:bg-slate-800 hover:text-white cursor-pointer">
            <Link href="/help" className="flex w-full items-center">
              <HelpCircle className="mr-2 h-4 w-4 text-sky-400" />
              <span>Help & Support</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="hover:bg-slate-800 hover:text-white cursor-pointer">
            <Link href="/privacy" className="flex w-full items-center">
              <Shield className="mr-2 h-4 w-4 text-sky-400" />
              <span>Privacy Policy</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-slate-800" />
        <DropdownMenuItem 
          className="hover:bg-rose-900/20 hover:text-rose-400 cursor-pointer text-rose-500"
          onClick={handleSignOut}
          disabled={isSigningOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isSigningOut ? "Signing out..." : "Sign out"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 