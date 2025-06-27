import { ArrowSquareOut } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import type { NavigationItem as NavigationItemType } from "./types";

interface NavigationItemProps extends Omit<NavigationItemType, "icon"> {
  icon: NavigationItemType["icon"];
  isActive: boolean;
  isRootLevel: boolean;
  isExternal?: boolean;
  isHighlighted?: boolean;
  currentWebsiteId?: string | null;
}

export function NavigationItem({
  name,
  icon: Icon,
  href,
  alpha,
  isActive,
  isRootLevel,
  isExternal,
  isHighlighted,
  production,
  currentWebsiteId,
}: NavigationItemProps) {
  const router = useRouter();

  let fullPath: string;
  if (isRootLevel) {
    fullPath = href;
  } else if (currentWebsiteId === "sandbox") {
    fullPath = href === "" ? "/sandbox" : `/sandbox${href}`;
  } else {
    fullPath = `/websites/${currentWebsiteId}${href}`;
  }

  const LinkComponent = isExternal ? "a" : Link;

  if (production === false && process.env.NODE_ENV === "production") {
    return null;
  }

  useEffect(() => {
    if (!isExternal) {
      router.prefetch(fullPath);
    }
  }, [fullPath, isExternal, router]);

  const linkProps = isExternal
    ? { href, target: "_blank", rel: "noopener noreferrer" }
    : {
        href: fullPath,
        prefetch: true,
      };

  return (
    <LinkComponent
      {...linkProps}
      className={cn(
        "group flex items-center gap-x-3 rounded px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-accent font-medium text-foreground"
          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
      )}
      data-is-external={isExternal ? "true" : "false"}
      data-nav-item={name.toLowerCase().replace(/\s+/g, "-")}
      data-nav-section={isRootLevel ? "main-nav" : "website-nav"}
      data-nav-type={isRootLevel ? "main" : "website"}
      data-track="navigation-click"
    >
      <span className="flex-shrink-0">
        <Icon className="h-5 w-5 not-dark:text-primary" size={32} weight="duotone" />
      </span>
      <span className="flex-grow truncate">{name}</span>
      <div className="flex items-center gap-1.5">
        {alpha && <span className="font-mono text-muted-foreground text-xs">ALPHA</span>}
        {isExternal && (
          <ArrowSquareOut
            className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
            weight="duotone"
          />
        )}
      </div>
    </LinkComponent>
  );
}
