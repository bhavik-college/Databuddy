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
          const fullPath = item.rootLevel ? item.href : `/websites/${currentWebsiteId}${item.href}`;
          const isActive = item.rootLevel 
            ? pathname === item.href
            : (item.href === "" 
                ? pathname === `/websites/${currentWebsiteId}` 
                : pathname === fullPath);

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