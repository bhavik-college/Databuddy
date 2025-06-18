"use client";

import { Badge } from "@/components/ui/badge";
import {
    TargetIcon,
    CaretDownIcon,
    TrendDownIcon
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
    const maxUsers = Math.max(...steps.map(s => s.users));

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <TargetIcon size={16} weight="duotone" className="h-4 w-4 text-primary" />
                <h3 className="text-base font-semibold text-foreground">Funnel Flow</h3>
            </div>

            <div className="space-y-3">
                {steps.map((step, index) => {
                    const isFirstStep = index === 0;
                    const conversionRate = isFirstStep ? 100 : ((step.users / totalUsers) * 100);
                    const barWidth = (step.users / maxUsers) * 100;
                    const previousStep = index > 0 ? steps[index - 1] : null;
                    const droppedUsers = previousStep ? previousStep.users - step.users : 0;
                    const stepConversionRate = previousStep ? ((step.users / previousStep.users) * 100) : 100;

                    return (
                        <div key={step.step_number} className="space-y-1">
                            {/* Step header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                                        {index + 1}
                                    </div>
                                    <div className="font-medium text-foreground text-sm">
                                        {step.step_name}
                                    </div>
                                </div>
                                <div className="text-lg font-bold text-foreground">
                                    {conversionRate.toFixed(conversionRate < 1 ? 2 : 1)}%
                                </div>
                            </div>

                            {/* Progress bar and stats */}
                            <div className="space-y-1">
                                <div className="relative h-6 bg-muted rounded overflow-hidden">
                                    <div
                                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/80 rounded transition-all duration-500"
                                        style={{ width: `${barWidth}%` }}
                                    />
                                    <div className="absolute inset-0 flex items-center px-2">
                                        <span className="text-xs font-semibold text-foreground">
                                            {step.users.toLocaleString()} users
                                        </span>
                                    </div>
                                </div>

                                {/* Dropoff info */}
                                {!isFirstStep && droppedUsers > 0 && (
                                    <div className="flex items-center justify-between text-xs text-muted-foreground pl-7">
                                        <span className="text-destructive">
                                            {droppedUsers.toLocaleString()} dropped
                                        </span>
                                        <span>
                                            {stepConversionRate.toFixed(1)}% from previous
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Connector arrow */}
                            {index < steps.length - 1 && (
                                <div className="flex justify-start pl-2 py-0.5">
                                    <CaretDownIcon size={12} weight="fill" className="text-muted-foreground/60" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

        </div>
    );
} 