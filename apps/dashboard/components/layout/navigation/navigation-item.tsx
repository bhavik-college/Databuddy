import Link from "next/link";
import { ArrowSquareOut } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type { NavigationItem as NavigationItemType } from "./types";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface NavigationItemProps extends Omit<NavigationItemType, 'icon'> {
  icon: NavigationItemType['icon'];
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
  currentWebsiteId
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

  const LinkComponent = isExternal ? 'a' : Link;

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
      prefetch: true
    };

  return (
    <LinkComponent
      {...linkProps}
      data-track="navigation-click"
      data-nav-item={name.toLowerCase().replace(/\s+/g, '-')}
      data-nav-type={isRootLevel ? 'main' : 'website'}
      data-nav-section={isRootLevel ? 'main-nav' : 'website-nav'}
      data-is-external={isExternal ? 'true' : 'false'}
      className={cn(
        "group flex items-center gap-x-3 px-3 py-2 text-sm rounded transition-colors",
        isActive
          ? "bg-accent text-foreground font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
      )}
    >
      <span className="flex-shrink-0">
        <Icon size={32} weight="duotone" className="h-4 w-4" />
      </span>
      <span className="flex-grow truncate">{name}</span>
      <div className="flex items-center gap-1.5">
        {alpha && (
          <span className="text-xs text-muted-foreground font-mono">
            ALPHA
          </span>
        )}
        {isExternal && (
          <ArrowSquareOut
            weight="duotone"
            className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          />
        )}
      </div>
    </LinkComponent>
  );
}