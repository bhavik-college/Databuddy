"use client";

import { DesktopIcon, MoonIcon, SunIcon } from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { RightSidebar } from "@/components/right-sidebar";
import { cn } from "@/lib/utils";
import { SettingsSection } from "../_components/settings-section";

type ThemeOption = {
	id: "light" | "dark" | "system";
	name: string;
	icon: typeof SunIcon;
	description: string;
};

const themeOptions: ThemeOption[] = [
	{
		id: "light",
		name: "Light",
		icon: SunIcon,
		description: "Light background with dark text",
	},
	{
		id: "dark",
		name: "Dark",
		icon: MoonIcon,
		description: "Dark background with light text",
	},
	{
		id: "system",
		name: "System",
		icon: DesktopIcon,
		description: "Follows your system preference",
	},
];

export default function AppearanceSettingsPage() {
	const { theme, setTheme } = useTheme();

	return (
		<div className="h-full lg:grid lg:grid-cols-[1fr_18rem]">
			<div className="flex flex-col">
				<div className="flex-1 overflow-y-auto">
					{/* Theme Selection */}
					<SettingsSection
						description="Choose how Databuddy looks to you"
						title="Theme"
					>
						<div className="grid gap-3 sm:grid-cols-3">
							{themeOptions.map((option) => {
								const Icon = option.icon;
								const isActive = theme === option.id;
								return (
									<button
										className={cn(
											"flex flex-col items-center gap-2 rounded border p-4 text-center transition-colors",
											isActive
												? "border-primary bg-primary/5"
												: "border-border hover:bg-accent"
										)}
										key={option.id}
										onClick={() => setTheme(option.id)}
										type="button"
									>
										<div
											className={cn(
												"flex size-12 items-center justify-center rounded-full",
												isActive ? "bg-primary/10" : "bg-accent"
											)}
										>
											<Icon
												className={cn(
													"size-6",
													isActive ? "text-primary" : "text-muted-foreground"
												)}
												weight="duotone"
											/>
										</div>
										<div>
											<p className="font-medium text-sm">{option.name}</p>
											<p className="text-muted-foreground text-xs">
												{option.description}
											</p>
										</div>
									</button>
								);
							})}
						</div>
					</SettingsSection>
				</div>
			</div>

			<RightSidebar className="gap-0 p-0">
				<RightSidebar.Section border title="Current Settings">
					<div className="space-y-2.5">
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground text-sm">Theme</span>
							<span className="font-medium text-sm capitalize">{theme}</span>
						</div>
					</div>
				</RightSidebar.Section>

				<RightSidebar.Section border title="Keyboard Shortcuts">
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground text-sm">
								Toggle theme
							</span>
							<kbd className="rounded border bg-secondary px-1.5 py-0.5 font-mono text-xs">
								⌘ D
							</kbd>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground text-sm">Search</span>
							<kbd className="rounded border bg-secondary px-1.5 py-0.5 font-mono text-xs">
								⌘ K
							</kbd>
						</div>
					</div>
				</RightSidebar.Section>
			</RightSidebar>
		</div>
	);
}
