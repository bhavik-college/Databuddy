import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { BORDER_RADIUS } from './ui-components';

interface TabLayoutProps {
  title?: string;
  description?: string;
  isLoading?: boolean;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

export function TabLayout({
  title,
  description,
  isLoading = false,
  children,
  className = "",
  actions
}: TabLayoutProps) {
  if (isLoading) {
    return <TabLoadingSkeleton />;
  }

  return (
    <div className={`pt-2 space-y-3 ${className}`}>
      {(title || description || actions) && (
        <div className="flex items-center justify-between mb-2">
          {(title || description) && (
            <div>
              {title && <h2 className="text-lg font-semibold">{title}</h2>}
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
          )}
          {actions && <div>{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

export function TabLoadingSkeleton() {
  return (
    <div className="space-y-4 pt-2">
      <div className="grid grid-cols-4 gap-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className={`h-24 w-full ${BORDER_RADIUS.card}`} />
        ))}
      </div>
      <Skeleton className={`h-64 w-full ${BORDER_RADIUS.container}`} />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className={`h-40 w-full ${BORDER_RADIUS.container}`} />
        <Skeleton className={`h-40 w-full ${BORDER_RADIUS.container}`} />
      </div>
    </div>
  );
} 