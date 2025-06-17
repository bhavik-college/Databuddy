"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TargetIcon, PlusIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
    onCreateFunnel: () => void;
}

export function EmptyState({ onCreateFunnel }: EmptyStateProps) {
    return (
        <Card className="border-dashed border-2 rounded-xl bg-gradient-to-br from-background to-muted/20 animate-in fade-in-50 duration-700">
            <CardContent className="flex flex-col items-center justify-center py-16 px-8">
                <div className="relative mb-8 group">
                    <div className="p-6 rounded-full bg-primary/10 border-2 border-primary/20 group-hover:scale-105 transition-transform duration-300">
                        <TargetIcon size={16} weight="duotone" className="h-16 w-16 text-primary" />
                    </div>
                    <div className="absolute -top-2 -right-2 p-2 rounded-full bg-background border-2 border-primary/20 shadow-sm animate-pulse">
                        <PlusIcon size={16} className="h-6 w-6 text-primary" />
                    </div>
                </div>
                <div className="text-center space-y-4 max-w-md">
                    <h3 className="text-2xl font-semibold text-foreground">No funnels yet</h3>
                    <p className="text-muted-foreground leading-relaxed">
                        Create your first funnel to start tracking user conversion journeys and identify optimization opportunities in your user flow.
                    </p>
                    <div className="pt-2">
                        <Button
                            onClick={onCreateFunnel}
                            size="lg"
                            className={cn(
                                "gap-2 px-8 py-4 font-medium text-base rounded-lg",
                                "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary",
                                "transition-all duration-300 group relative overflow-hidden"
                            )}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                            <PlusIcon size={16} className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300 relative z-10" />
                            <span className="relative z-10">Create Your First Funnel</span>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
} 