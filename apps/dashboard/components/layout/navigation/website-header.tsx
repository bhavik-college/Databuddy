import Link from "next/link";
import { CaretLeftIcon, PlanetIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { WebsiteBasic } from "@databuddy/shared";

interface WebsiteHeaderProps {
  website: WebsiteBasic | null | undefined;
}

export function WebsiteHeader({ website }: WebsiteHeaderProps) {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-foreground cursor-pointer group"
          asChild
        >
          <Link href="/websites">
            <CaretLeftIcon size={32} weight="fill" className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            <span>Back to Websites</span>
          </Link>
        </Button>
      </div>

      <div className="px-2 py-2 bg-accent/30 rounded-lg border border-border/50">
        <h2 className="text-base font-semibold truncate flex items-center">
          <PlanetIcon size={64} weight="duotone" className="h-5 w-5 mr-2 text-primary/70" />
          {website?.name || website?.domain || (
            <Skeleton className="h-5 w-36" />
          )}
        </h2>
        <div className="text-xs text-muted-foreground truncate mt-1 pl-6">
          {website?.domain || <Skeleton className="h-4 w-24" />}
        </div>
      </div>
    </div>
  );
} 