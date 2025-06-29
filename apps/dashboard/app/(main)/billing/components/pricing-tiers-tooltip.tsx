"use client";

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Info } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface PricingTier {
    to: number | "inf";
    amount: number;
}

interface PricingTiersTooltipProps {
    tiers: PricingTier[];
    className?: string;
}

export function PricingTiersTooltip({ tiers, className }: PricingTiersTooltipProps) {
    const formatTierRange = (tier: PricingTier, index: number) => {
        const prevTier = index > 0 ? tiers[index - 1] : null;
        const from = prevTier ? (typeof prevTier.to === 'number' ? prevTier.to + 1 : 0) : 0;
        const to = tier.to;

        const formatNumber = (num: number) => {
            if (num >= 1000000) {
                return `${(num / 1000000).toFixed(num % 1000000 === 0 ? 0 : 1)}M`;
            } else if (num >= 1000) {
                return `${(num / 1000).toFixed(num % 1000 === 0 ? 0 : 1)}K`;
            }
            return num.toLocaleString();
        };

        if (to === "inf") {
            return `${formatNumber(from)}+`;
        }

        if (from === 0) {
            return `0 - ${formatNumber(typeof to === 'number' ? to : 0)}`;
        }

        return `${formatNumber(from)} - ${formatNumber(typeof to === 'number' ? to : 0)}`;
    };

    return (
        <HoverCard>
            <HoverCardTrigger asChild>
                <button className={cn("inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors", className)}>
                    <Info size={12} />
                    <span>View pricing tiers</span>
                </button>
            </HoverCardTrigger>
            <HoverCardContent className="w-80" side="top" align="start">
                <div className="space-y-3">
                    <div>
                        <h4 className="font-semibold text-sm">Tiered Pricing Structure</h4>
                        <p className="text-xs text-muted-foreground">
                            Lower rates for higher usage volumes
                        </p>
                    </div>
                    <div className="space-y-2">
                        {tiers.map((tier, index) => (
                            <div key={index} className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground">
                                    {formatTierRange(tier, index)} events
                                </span>
                                <span className="font-mono font-medium">
                                    ${tier.amount.toFixed(6)} each
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="pt-2 border-t text-xs text-muted-foreground">
                        You only pay the tier rate for usage within that range
                    </div>
                </div>
            </HoverCardContent>
        </HoverCard>
    );
} 