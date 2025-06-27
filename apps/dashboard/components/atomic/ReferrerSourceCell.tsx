"use client";

import type React from "react";

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
  const displayName = name || referrer || "Direct";

  if (displayName === "Direct" || !domain) {
    return (
      <span
        className={className ? `${className} font-medium text-sm` : "font-medium text-sm"}
        id={id}
      >
        {displayName}
      </span>
    );
  }

  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // Attempt to hide the image, or you could replace it with a placeholder
    e.currentTarget.style.display = "none";
    // Optionally, add a class to the parent to indicate no icon
    // e.currentTarget.parentElement?.classList.add("no-favicon");
  };

  return (
    <span
      className={
        className
          ? `${className} flex items-center gap-2 font-medium text-sm`
          : "flex items-center gap-2 font-medium text-sm"
      }
      id={id}
    >
      <img
        alt={`${displayName} favicon`}
        className="rounded-sm"
        height={16}
        onError={handleImageError}
        src={faviconUrl}
        width={16}
      />
      {displayName}
    </span>
  );
};

export default ReferrerSourceCell;
