"use client";

import type React from "react";
import { ExternalLinkIcon, FileTextIcon } from "lucide-react"; // Using FileTextIcon as a generic page icon
import { cn } from "@/lib/utils";
import { formatDomainLink } from "@/app/(main)/websites/[id]/_components/utils/analytics-helpers"; // Adjusted path

export interface PageLinkCellData {
  path: string;
  websiteDomain?: string;
  // Optional unique ID for the component instance
  id?: string; 
}

interface PageLinkCellProps extends PageLinkCellData {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  maxLength?: number; // Max length for the displayed path before truncation
}

export const PageLinkCell: React.FC<PageLinkCellProps> = ({
  id,
  path,
  websiteDomain,
  className,
  iconClassName = "h-4 w-4 text-muted-foreground",
  textClassName = "text-sm",
  maxLength = 35, // Default max length for the path
}) => {
  if (!path) {
    return <span id={id} className={cn("text-sm text-muted-foreground", className)}>(not set)</span>;
  }

  const { href, display } = formatDomainLink(path, websiteDomain, maxLength);
  const isExternal = href.startsWith("http");

  return (
    <a
      id={id}
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className={cn(
        "flex items-center gap-1.5 hover:underline group",
        className
      )}
    >
      <FileTextIcon className={cn("flex-shrink-0", iconClassName)} />
      <span className={cn("truncate group-hover:text-primary", textClassName)} style={{ maxWidth: `${maxLength + 2}ch` }}>
        {display}
      </span>
      {isExternal && (
        <ExternalLinkIcon className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </a>
  );
};

export default PageLinkCell; 