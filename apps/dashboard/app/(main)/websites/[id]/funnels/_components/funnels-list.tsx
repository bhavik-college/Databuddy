"use client";

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FunnelCard } from "./funnel-card";
import { EmptyState } from "./empty-state";
import type { Funnel } from "@/hooks/use-funnels";

interface FunnelsListProps {
    funnels: Funnel[];
    isLoading: boolean;
    expandedFunnelId: string | null;
    onToggleFunnel: (funnelId: string) => void;
    onEditFunnel: (funnel: Funnel) => void;
    onDeleteFunnel: (funnelId: string) => void;
    onCreateFunnel: () => void;
    children?: (funnel: Funnel) => React.ReactNode;
}

export function FunnelsList({
    funnels,
    isLoading,
    expandedFunnelId,
    onToggleFunnel,
    onEditFunnel,
    onDeleteFunnel,
    onCreateFunnel,
    children
}: FunnelsListProps) {
    if (isLoading) {
        return (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <Card key={i} className="animate-pulse rounded-xl">
                        <CardHeader className="pb-4">
                            <div className="flex items-start justify-between">
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-6 bg-muted rounded-lg w-48"></div>
                                        <div className="h-4 w-4 bg-muted rounded"></div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="h-5 bg-muted rounded-full w-16"></div>
                                        <div className="h-4 bg-muted rounded w-20"></div>
                                    </div>
                                </div>
                                <div className="h-8 w-8 bg-muted rounded"></div>
                            </div>
                            <div className="mt-4 space-y-3">
                                <div className="h-4 bg-muted rounded w-2/3"></div>
                                <div className="bg-muted/50 rounded-lg p-3">
                                    <div className="h-3 bg-muted rounded w-24 mb-2"></div>
                                    <div className="flex gap-2">
                                        <div className="h-8 bg-muted rounded-lg w-32"></div>
                                        <div className="h-4 w-4 bg-muted rounded"></div>
                                        <div className="h-8 bg-muted rounded-lg w-28"></div>
                                        <div className="h-4 w-4 bg-muted rounded"></div>
                                        <div className="h-8 bg-muted rounded-lg w-36"></div>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>
                ))}
            </div>
        );
    }

    if (funnels.length === 0) {
        return <EmptyState onCreateFunnel={onCreateFunnel} />;
    }

    return (
        <div className="space-y-3">
            {funnels.map((funnel, index) => (
                <div
                    key={funnel.id}
                    className="animate-in fade-in-50 slide-in-from-bottom-2 duration-500"
                    style={{ animationDelay: `${index * 100}ms` }}
                >
                    <FunnelCard
                        funnel={funnel}
                        isExpanded={expandedFunnelId === funnel.id}
                        onToggle={onToggleFunnel}
                        onEdit={onEditFunnel}
                        onDelete={onDeleteFunnel}
                    >
                        {children?.(funnel)}
                    </FunnelCard>
                </div>
            ))}
        </div>
    );
} 