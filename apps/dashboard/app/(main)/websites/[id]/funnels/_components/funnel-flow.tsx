"use client";

import { Badge } from "@/components/ui/badge";
import {
    TargetIcon,
    ClockIcon,
    TrendDownIcon,
    CaretDownIcon
} from "@phosphor-icons/react";

interface FunnelStep {
    step_number: number;
    step_name: string;
    users: number;
    conversion_rate?: number;
    dropoff_rate?: number;
    avg_time_to_complete?: number;
    dropoffs?: number;
}

interface FunnelFlowProps {
    steps: FunnelStep[];
    totalUsers: number;
    formatCompletionTime: (seconds: number) => string;
}

export function FunnelFlow({ steps, totalUsers, formatCompletionTime }: FunnelFlowProps) {
    return (
        <div className="space-y-4 animate-in fade-in-50 duration-500">
            <div className="flex items-center gap-2">
                <TargetIcon size={16} weight="duotone" className="h-4 w-4 text-primary" />
                <h3 className="text-base font-semibold text-foreground">Funnel Flow</h3>
            </div>
            <div className="space-y-2">
                {steps.map((step, index) => {
                    const isFirstStep = index === 0;
                    const isLastStep = index === steps.length - 1;
                    const conversionRate = step.conversion_rate || 0;
                    const dropoffRate = step.dropoff_rate || 0;
                    const displayStepNumber = index + 1;
                    const progressPercentage = (step.users / totalUsers) * 100;

                    return (
                        <div
                            key={step.step_number}
                            className="animate-in fade-in-50 slide-in-from-left-2 duration-500"
                            style={{ animationDelay: `${index * 150}ms` }}
                        >
                            <div className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-muted/30 transition-all duration-300 hover:shadow-sm">
                                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                                    {displayStepNumber}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-semibold text-foreground truncate pr-4">
                                            {step.step_name}
                                        </h4>
                                        <div className="text-right flex-shrink-0">
                                            <div className="font-bold text-lg text-foreground">
                                                {step.users?.toLocaleString()}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {progressPercentage.toFixed(1)}% of total
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {isFirstStep ? (
                                                <Badge variant="outline" className="text-xs">
                                                    Entry
                                                </Badge>
                                            ) : (
                                                <Badge
                                                    variant={conversionRate > 70 ? "default" : conversionRate > 40 ? "secondary" : "destructive"}
                                                    className="text-xs"
                                                >
                                                    {conversionRate.toFixed(1)}%
                                                </Badge>
                                            )}
                                            {isLastStep && (
                                                <Badge variant="outline" className="text-xs">
                                                    Goal
                                                </Badge>
                                            )}
                                            {step.avg_time_to_complete && step.avg_time_to_complete > 0 && (
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <ClockIcon size={16} weight="duotone" className="h-3 w-3" />
                                                    <span>{formatCompletionTime(step.avg_time_to_complete)}</span>
                                                </div>
                                            )}
                                        </div>
                                        {dropoffRate > 0 && (
                                            <div className="flex items-center gap-1 text-xs text-destructive">
                                                <TrendDownIcon size={16} weight="duotone" className="h-3 w-3" />
                                                <span className="font-medium">
                                                    {dropoffRate.toFixed(1)}% drop
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {!isLastStep && (
                                <div className="flex justify-center py-1">
                                    <CaretDownIcon size={16} weight="duotone" className="h-3 w-3 text-muted-foreground" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
} 