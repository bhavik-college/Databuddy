import { useState } from "react";
import Link from "next/link";
import { useSession, authClient } from "@databuddy/auth/client";
import { toast } from "sonner";
import { HouseIcon, SignOutIcon, UserIcon } from "@phosphor-icons/react";
import { redirect } from "next/navigation";
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
} from "@/components/ui/dropdown-menu";

export function UserMenu() {
  const { data: session, isPending: isSessionPending } = useSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const getUserInitials = () => {
    if (!session?.user?.name) return "U";
    return session.user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          toast.success("Logged out successfully");
          redirect("/login");
        },
        onError: (error) => {
          toast.error(error.error.message || "Failed to log out");
        },
      },
    });
    setIsLoggingOut(false);
  };

  if (isSessionPending) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-9 rounded-full" />
      </div>
    );
  }

  return (
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
            <Link href="/websites" className="flex items-center w-full">
              <HouseIcon size={32} weight="duotone" className="mr-2.5 h-4 w-4" />
              Websites
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="h-9 rounded-md">
            <Link href="/settings?tab=profile" className="flex items-center w-full">
              <UserIcon size={32} weight="duotone" className="mr-2.5 h-4 w-4" />
              Profile
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="my-1" />

        <DropdownMenuItem
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="cursor-pointer h-9 rounded-md text-destructive focus:text-destructive hover:bg-destructive/10"
        >
          <SignOutIcon size={32} weight="duotone" className="mr-2.5 h-5 w-5" />
          {isLoggingOut ? "Signing out..." : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 