"use client";

import { authClient } from "@databuddy/auth/client";
import { GearIcon, SignOutIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";

interface User {
	name?: string | null;
	email?: string | null;
	image?: string | null;
}

interface ProfileButtonClientProps {
	user: User;
}

export function ProfileButtonClient({ user }: ProfileButtonClientProps) {
	const [isLoggingOut, setIsLoggingOut] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const router = useRouter();

	const handleLogout = async () => {
		setIsLoggingOut(true);
		setIsOpen(false);
		await authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					toast.success("Logged out successfully");
					router.push("/login");
				},
				onError: (error) => {
					router.push("/login");
					toast.error(error.error.message || "Failed to log out");
				},
			},
		});
		setIsLoggingOut(false);
	};

	const handleSettings = () => {
		setIsOpen(false);
		router.push("/settings/account");
	};

	const userInitials = user?.name
		? user.name
				.split(" ")
				.map((n) => n[0])
				.join("")
				.toUpperCase()
				.slice(0, 2)
		: user?.email?.[0]?.toUpperCase() || "U";

	return (
		<DropdownMenu onOpenChange={setIsOpen} open={isOpen}>
			<Tooltip>
				<TooltipTrigger asChild>
					<DropdownMenuTrigger
						aria-label="Profile menu"
						className="flex size-8 items-center justify-center rounded-full outline-hidden transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
						disabled={isLoggingOut}
					>
						<Avatar className="size-8">
							<AvatarImage
								alt={user?.name || "User"}
								src={user?.image || undefined}
							/>
							<AvatarFallback className="bg-primary text-primary-foreground text-xs">
								{userInitials}
							</AvatarFallback>
						</Avatar>
					</DropdownMenuTrigger>
				</TooltipTrigger>
				<TooltipContent side="right">
					<p>Profile menu</p>
				</TooltipContent>
			</Tooltip>

			<DropdownMenuContent align="start" className="w-56" side="right">
				<DropdownMenuLabel>
					<div className="flex flex-col space-y-1">
						<p className="font-medium text-sm leading-none">{user?.name}</p>
						<p className="text-muted-foreground text-xs leading-none">
							{user?.email}
						</p>
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={handleSettings}>
					<GearIcon weight="duotone" />
					Settings
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					disabled={isLoggingOut}
					onClick={handleLogout}
					variant="destructive"
				>
					<SignOutIcon weight="duotone" />
					{isLoggingOut ? "Signing out..." : "Sign out"}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
