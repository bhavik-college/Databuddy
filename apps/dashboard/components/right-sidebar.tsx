import { cn } from "@/lib/utils";

type RightSidebarProps = {
	children: React.ReactNode;
	className?: string;
};

export function RightSidebar({ children, className }: RightSidebarProps) {
	return (
		<aside
			className={cn(
				"flex w-full shrink-0 flex-col border-t bg-card lg:h-full lg:w-auto lg:overflow-y-auto lg:border-t-0 lg:border-l",
				className
			)}
		>
			{children}
		</aside>
	);
}
