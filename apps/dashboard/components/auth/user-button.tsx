"use client";

import { logout, signOut, useSession } from "@databuddy/auth/client";
import { LogOut, Settings, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { auth } from "../../../../packages/auth/src/auth";
import { UserAvatar } from "./user-avatar";

export interface UserButtonProps {
  afterSignOutUrl?: string;
}

export function UserButton({ afterSignOutUrl = "/" }: UserButtonProps) {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const handleSignOut = async () => {
    try {
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            toast.success("Signed out successfully");
          },
          onError: () => {
            toast.error("Something went wrong");
          },
        },
      });
      toast.success("Signed out successfully");
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  if (isPending) {
    return (
      <Button className="relative h-8 w-8" size="icon" variant="ghost">
        <UserAvatar />
      </Button>
    );
  }

  if (!session?.user) {
    return (
      <Button
        className="relative h-8 w-8"
        onClick={() => router.push("/login")}
        size="icon"
        variant="ghost"
      >
        <UserAvatar />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="relative h-8 w-8" size="icon" variant="ghost">
          <UserAvatar user={session.user} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="font-medium text-sm leading-none">{session.user.name}</p>
            <p className="text-muted-foreground text-xs leading-none">{session.user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push("/account")}>
            <User className="mr-2 h-4 w-4" />
            Account
            <DropdownMenuShortcut>⇧⌘A</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/settings")}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
