'use client';

import type React from 'react';
import { FaviconImage } from '../analytics/favicon-image';

// Mirroring the ReferrerItem type from WebsiteOverviewTab.tsx
// Ideally, this would be a shared type if used in multiple places outside atomic components.
export interface ReferrerSourceCellData {
  // The primary display name, maps to 'value' if accessorKey is 'name' in a table
  name?: string;
  // The raw referrer string
  referrer?: string;
  // The domain used for fetching the favicon
  domain?: string;
  // Optional unique ID for the component instance
  id?: string;
}

interface ReferrerSourceCellProps extends ReferrerSourceCellData {
  className?: string;
}

export const ReferrerSourceCell: React.FC<ReferrerSourceCellProps> = ({
  id,
  name,
  referrer,
  domain,
  className,
}) => {
  const displayName = name || referrer || 'Direct';

  if (displayName === 'Direct' || !domain) {
    return (
      <span
        className={
          className ? `${className} font-medium text-sm` : 'font-medium text-sm'
        }
        id={id}
      >
        {displayName}
      </span>
    );
  }

  return (
    <span
      className={
        className
          ? `${className} flex items-center gap-2 font-medium text-sm`
          : 'flex items-center gap-2 font-medium text-sm'
      }
      id={id}
    >
      <FaviconImage
        altText={`${displayName} favicon`}
        className="rounded-sm"
        domain={domain}
        size={16}
      />
      {displayName}
    </span>
  );
};

export default ReferrerSourceCell;
