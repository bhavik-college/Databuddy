import { NavigationItem } from "./navigation-item";
import type { NavigationSection as NavigationSectionType } from "./types";

interface NavigationSectionProps {
  title: string;
  items: NavigationSectionType['items'];
  pathname: string;
  currentWebsiteId?: string | null;
}

export function NavigationSection({ title, items, pathname, currentWebsiteId }: NavigationSectionProps) {
  return (
    <div>
      <h3 className="px-2 mb-2 text-xs font-semibold text-muted-foreground tracking-wider uppercase">
        {title}
      </h3>
      <div className="space-y-1 ml-1">
        {items.map((item) => {
          let fullPath: string;
          let isActive: boolean;

          if (item.rootLevel) {
            fullPath = item.href;
            isActive = pathname === item.href;
          } else if (currentWebsiteId === "sandbox") {
            // Handle sandbox context
            fullPath = item.href === "" ? "/sandbox" : `/sandbox${item.href}`;
            isActive = item.href === ""
              ? pathname === "/sandbox"
              : pathname === fullPath;
          } else if (pathname.startsWith("/demo")) {
            // Handle demo context
            fullPath = item.href === "" ? `/demo/${currentWebsiteId}` : `/demo/${currentWebsiteId}${item.href}`;
            isActive = item.href === ""
              ? pathname === `/demo/${currentWebsiteId}`
              : pathname === fullPath;
          } else {
            // Handle website context
            fullPath = `/websites/${currentWebsiteId}${item.href}`;
            isActive = item.href === ""
              ? pathname === `/websites/${currentWebsiteId}`
              : pathname === fullPath;
          }

          return (
            <NavigationItem
              key={item.name}
              name={item.name}
              icon={item.icon}
              href={item.href}
              alpha={item.alpha}
              isActive={isActive}
              isRootLevel={!!item.rootLevel}
              isExternal={item.external}
              isHighlighted={item.highlight}
              production={item.production}
              currentWebsiteId={currentWebsiteId}
            />
          );
        })}
      </div>
    </div>
  );
} 