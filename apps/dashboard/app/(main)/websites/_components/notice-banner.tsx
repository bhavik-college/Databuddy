import type { IconProps } from "@phosphor-icons/react";
import { cloneElement } from "react";
import { cn } from "@/lib/utils";

export const NoticeBanner = ({
	children,
	icon,
	className,
}: {
	children: React.ReactNode;
	icon: React.ReactElement<IconProps>;
	className?: string;
}) => (
	<div
		className={cn(
			"notice-banner-angled-rectangle-gradient flex items-center gap-2 rounded-lg border border-accent-foreground bg-accent-foreground/80 px-3 py-2 font-medium text-accent-brighter text-sm",
			className
		)}
	>
		<div>
			{cloneElement(icon, {
				...icon.props,
				className: cn("size-5 text-accent", icon.props.className),
				"aria-hidden": "true",
				weight: "fill",
				size: 24,
			})}
		</div>
		<div>{children}</div>
	</div>
);
