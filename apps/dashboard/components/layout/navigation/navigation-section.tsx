import { NavigationItem } from './navigation-item';
import type { NavigationSection as NavigationSectionType } from './types';

interface NavigationSectionProps {
  title: string;
  items: NavigationSectionType['items'];
  pathname: string;
  currentWebsiteId?: string | null;
}

export function NavigationSection({
  title,
  items,
  pathname,
  currentWebsiteId,
}: NavigationSectionProps) {
  return (
    <div>
      <h3 className="mb-2 px-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
        {title}
      </h3>
      <div className="ml-1 space-y-1">
        {items.map((item) => {
          let fullPath: string;
          let isActive: boolean;

          if (item.rootLevel) {
            fullPath = item.href;
            isActive = pathname === item.href;
          } else if (currentWebsiteId === 'sandbox') {
            // Handle sandbox context
            fullPath = item.href === '' ? '/sandbox' : `/sandbox${item.href}`;
            isActive =
              item.href === ''
                ? pathname === '/sandbox'
                : pathname === fullPath;
          } else if (pathname.startsWith('/demo')) {
            // Handle demo context
            fullPath =
              item.href === ''
                ? `/demo/${currentWebsiteId}`
                : `/demo/${currentWebsiteId}${item.href}`;
            isActive =
              item.href === ''
                ? pathname === `/demo/${currentWebsiteId}`
                : pathname === fullPath;
          } else {
            // Handle website context
            fullPath = `/websites/${currentWebsiteId}${item.href}`;
            isActive =
              item.href === ''
                ? pathname === `/websites/${currentWebsiteId}`
                : pathname === fullPath;
          }

          return (
            <NavigationItem
              alpha={item.alpha}
              currentWebsiteId={currentWebsiteId}
              href={item.href}
              icon={item.icon}
              isActive={isActive}
              isExternal={item.external}
              isHighlighted={item.highlight}
              isRootLevel={!!item.rootLevel}
              key={item.name}
              name={item.name}
              production={item.production}
            />
          );
        })}
      </div>
    </div>
  );
}
