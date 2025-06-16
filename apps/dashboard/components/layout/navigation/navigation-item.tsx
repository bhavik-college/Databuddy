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
  const fullPath = isRootLevel ? href : `/websites/${currentWebsiteId}${href}`;
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
        "flex items-center gap-x-3 px-3 py-2 text-sm rounded-md transition-all cursor-pointer",
        isActive
          ? "bg-primary/15 text-primary font-medium"
          : isHighlighted
            ? "text-foreground hover:text-primary hover:bg-accent/50"
            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
      )}
    >
      <span className={cn("flex-shrink-0", isActive && "text-primary")}>
        <Icon size={32} weight="duotone" className="h-5 w-5" />
      </span>
      <span className="flex-grow truncate">{name}</span>
      <div className="flex items-center gap-1">
        {alpha && (
          <span className="inline-flex items-center rounded-full bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 text-xs font-medium text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800/50">
            Alpha
          </span>
        )}
        {isExternal && <ArrowSquareOut weight="duotone" className="h-3 w-3 text-muted-foreground" />}
      </div>
    </LinkComponent>
  );
} 