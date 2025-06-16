"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";

export interface UserAvatarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  className?: string;
}

export function UserAvatar({ user, className }: UserAvatarProps) {
  return (
    <Avatar className={cn("h-8 w-8", className)}>
      {user?.image ? (
        <AvatarImage
          src={user.image}
          alt={user.name || "User avatar"}
          className="object-cover"
        />
      ) : (
        <AvatarFallback className="bg-slate-700/50">
          {user?.name ? (
            <span className="text-sm font-medium text-slate-100">
              {user.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </span>
          ) : (
            <User className="h-4 w-4 text-slate-100" />
          )}
        </AvatarFallback>
      )}
    </Avatar>
  );
} 