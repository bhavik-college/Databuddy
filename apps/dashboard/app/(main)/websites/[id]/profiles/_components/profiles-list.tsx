"use client";

import { Loader2Icon, UserRound } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useInfiniteAnalyticsProfiles } from "@/hooks/use-analytics";
import { ProfileRow } from "./profile-row";
import { getDefaultDateRange } from "./profile-utils";

interface ProfilesListProps {
  websiteId: string;
}

export function ProfilesList({ websiteId }: ProfilesListProps) {
  const [dateRange] = useState(() => getDefaultDateRange());
  const [expandedProfileId, setExpandedProfileId] = useState<string | null>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, error } =
    useInfiniteAnalyticsProfiles(websiteId, dateRange, 25);

  const toggleProfile = (profileKey: string) => {
    setExpandedProfileId(expandedProfileId === profileKey ? null : profileKey);
  };

  // Intersection Observer for infinite scrolling
  const [loadMoreRef, setLoadMoreRef] = useState<HTMLDivElement | null>(null);

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  useEffect(() => {
    if (!loadMoreRef) return;

    const observer = new IntersectionObserver(handleIntersection, {
      threshold: 0.1,
      rootMargin: "200px", // Increased for better UX
    });

    observer.observe(loadMoreRef);

    return () => {
      observer.disconnect();
    };
  }, [loadMoreRef, handleIntersection]);

  // Flatten all profiles from all pages (memoized for performance)
  const allProfiles = useMemo(() => {
    return data?.pages.flatMap((page) => page.profiles) || [];
  }, [data?.pages]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-semibold text-lg tracking-tight">Recent Profiles</CardTitle>
          <p className="text-muted-foreground text-sm">
            Visitor profiles with session data and behavior patterns
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div className="h-16 animate-pulse rounded bg-muted/20" key={i} />
            ))}
          </div>
          <div className="flex items-center justify-center pt-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2Icon className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading profiles...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-semibold text-destructive text-lg tracking-tight">
            Error Loading Profiles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            {error?.message || "Failed to load profiles"}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!allProfiles || allProfiles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-semibold text-lg tracking-tight">Recent Profiles</CardTitle>
          <p className="text-muted-foreground text-sm">
            Visitor profiles with session data and behavior patterns
          </p>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center text-muted-foreground">
            <UserRound className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p className="mb-2 font-medium text-lg">No profiles found</p>
            <p className="text-sm">
              Visitor profiles will appear here once users visit your website
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-semibold text-lg tracking-tight">
          Recent Profiles ({allProfiles.length} loaded)
        </CardTitle>
        <p className="text-muted-foreground text-sm">
          Visitor profiles with session data and behavior patterns
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {allProfiles.map((profile, index) => {
            const profileKey = `${profile.visitor_id}-${profile.first_visit}-${profile.last_visit}-${index}`;
            return (
              <ProfileRow
                index={index}
                isExpanded={expandedProfileId === profileKey}
                key={profileKey}
                onToggle={() => toggleProfile(profileKey)}
                profile={profile}
              />
            );
          })}
        </div>

        {/* Load More Trigger */}
        <div className="border-border border-t p-4">
          {hasNextPage ? (
            <div className="flex justify-center" ref={setLoadMoreRef}>
              {isFetchingNextPage ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading more profiles...</span>
                </div>
              ) : (
                <Button className="w-full" onClick={() => fetchNextPage()} variant="outline">
                  Load More Profiles
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center text-muted-foreground text-sm">All profiles loaded</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
