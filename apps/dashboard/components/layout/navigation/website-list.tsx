import type { Website } from "@databuddy/shared";
import { GlobeIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface WebsiteListProps {
  websites: Website[] | undefined;
  isLoading: boolean;
  pathname: string;
}

export function WebsiteList({ websites, isLoading, pathname }: WebsiteListProps) {
  const router = useRouter();

  // Pre-fetch website details when component mounts
  useEffect(() => {
    if (websites?.length) {
      for (const website of websites) {
        router.prefetch(`/websites/${website.id}`);
      }
    }
  }, [websites, router]);

  if (isLoading) {
    return (
      <>
        <div className="px-2 py-1.5">
          <Skeleton className="h-7 w-full rounded-md" />
        </div>
        <div className="px-2 py-1.5">
          <Skeleton className="h-7 w-full rounded-md" />
        </div>
      </>
    );
  }

  if (!websites?.length) {
    return (
      <div className="rounded-md border border-border/50 bg-accent/30 px-3 py-2 text-muted-foreground text-sm">
        No websites yet
      </div>
    );
  }

  return (
    <div className="rounded-md bg-accent/20 py-1">
      {websites.map((site) => (
        <Link
          className={cn(
            "mx-1 flex cursor-pointer items-center gap-x-3 rounded-md px-3 py-2 text-sm transition-all",
            pathname === `/websites/${site.id}`
              ? "bg-primary/15 font-medium text-primary"
              : "text-foreground hover:bg-accent/70"
          )}
          href={`/websites/${site.id}`}
          key={site.id}
          prefetch={true}
        >
          <GlobeIcon
            className={cn(
              "h-4 w-4 not-dark:text-primary",
              pathname === `/websites/${site.id}` && "text-primary"
            )}
            size={32}
            weight="duotone"
          />
          <span className="truncate">{site.name || site.domain}</span>
        </Link>
      ))}
    </div>
  );
}
