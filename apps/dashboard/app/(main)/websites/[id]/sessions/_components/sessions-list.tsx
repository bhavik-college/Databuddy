"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UsersIcon, Loader2Icon } from "lucide-react";
import { useInfiniteAnalyticsSessions } from "@/hooks/use-analytics";
import { SessionRow } from "./session-row";
import { getDefaultDateRange } from "./session-utils";

interface SessionsListProps {
    websiteId: string;
}

export function SessionsList({ websiteId }: SessionsListProps) {
    const [dateRange] = useState(() => getDefaultDateRange());
    const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        error
    } = useInfiniteAnalyticsSessions(websiteId, dateRange, 25);

    const toggleSession = (sessionId: string) => {
        setExpandedSessionId(expandedSessionId === sessionId ? null : sessionId);
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
            rootMargin: '200px', // Increased for better UX
        });

        observer.observe(loadMoreRef);

        return () => {
            observer.disconnect();
        };
    }, [loadMoreRef, handleIntersection]);

    // Flatten all sessions from all pages (memoized for performance)
    const allSessions = useMemo(() => {
        return data?.pages.flatMap(page => page.sessions) || [];
    }, [data?.pages]);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-semibold tracking-tight">Recent Sessions</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        User sessions with event timelines and custom event properties
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="h-16 bg-muted/20 animate-pulse rounded" />
                        ))}
                    </div>
                    <div className="flex items-center justify-center pt-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2Icon className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Loading sessions...</span>
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
                    <CardTitle className="text-lg font-semibold tracking-tight text-destructive">
                        Error Loading Sessions
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        {error?.message || 'Failed to load sessions'}
                    </p>
                </CardContent>
            </Card>
        );
    }

    if (!allSessions || allSessions.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-semibold tracking-tight">Recent Sessions</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        User sessions with event timelines and custom event properties
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                        <UsersIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-2">No sessions found</p>
                        <p className="text-sm">Sessions will appear here once users visit your website</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg font-semibold tracking-tight">
                    Recent Sessions ({allSessions.length} loaded)
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                    User sessions with event timelines and custom event properties
                </p>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-border">
                    {allSessions.map((session, index) => (
                        <SessionRow
                            key={session.session_id || index}
                            session={session}
                            index={index}
                            isExpanded={expandedSessionId === session.session_id}
                            onToggle={() => toggleSession(session.session_id)}
                        />
                    ))}
                </div>

                {/* Load More Trigger */}
                <div className="p-4 border-t border-border">
                    {hasNextPage ? (
                        <div ref={setLoadMoreRef} className="flex justify-center">
                            {isFetchingNextPage ? (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Loader2Icon className="w-4 h-4 animate-spin" />
                                    <span className="text-sm">Loading more sessions...</span>
                                </div>
                            ) : (
                                <Button
                                    variant="outline"
                                    onClick={() => fetchNextPage()}
                                    className="w-full"
                                >
                                    Load More Sessions
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="text-center text-sm text-muted-foreground">
                            All sessions loaded
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
} 