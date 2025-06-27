"use client";

import { CaretDownIcon, TargetIcon, TrendDownIcon } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";

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
  const maxUsers = Math.max(...steps.map((s) => s.users));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <TargetIcon className="h-4 w-4 text-primary" size={16} weight="duotone" />
        <h3 className="font-semibold text-base text-foreground">Funnel Steps</h3>
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => {
          const isFirstStep = index === 0;
          const conversionRate = isFirstStep ? 100 : (step.users / totalUsers) * 100;
          const barWidth = Math.max((step.users / maxUsers) * 100, 5);
          const previousStep = index > 0 ? steps[index - 1] : null;
          const droppedUsers = previousStep ? previousStep.users - step.users : 0;
          const stepConversionRate = previousStep ? (step.users / previousStep.users) * 100 : 100;

          return (
            <div className="space-y-2" key={step.step_number}>
              {/* Step header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground text-sm">
                    {index + 1}
                  </div>
                  <div className="font-medium text-foreground">{step.step_name}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-foreground">{conversionRate.toFixed(1)}%</div>
                  <div className="text-muted-foreground text-xs">of total</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="relative h-8 overflow-hidden rounded bg-muted">
                <div
                  className="absolute inset-y-0 left-0 bg-primary transition-all duration-500"
                  style={{ width: `${barWidth}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-between px-3">
                  <span className="font-medium text-sm text-white">
                    {step.users.toLocaleString()} users
                  </span>
                  {!isFirstStep && (
                    <span className="text-muted-foreground text-sm">
                      {stepConversionRate.toFixed(1)}% from previous
                    </span>
                  )}
                </div>
              </div>

              {/* Drop-off info */}
              {!isFirstStep && droppedUsers > 0 && (
                <div className="flex items-center justify-between pl-9 text-muted-foreground text-sm">
                  <span className="text-destructive">
                    -{droppedUsers.toLocaleString()} users dropped off
                  </span>
                </div>
              )}

              {/* Connector */}
              {index < steps.length - 1 && (
                <div className="flex justify-center py-1">
                  <CaretDownIcon className="text-muted-foreground/50" size={16} weight="fill" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 rounded border bg-muted/30 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-foreground">Overall Conversion</div>
            <div className="text-muted-foreground text-sm">
              {steps[steps.length - 1]?.users.toLocaleString() || 0} of{" "}
              {totalUsers.toLocaleString()} users completed the funnel
            </div>
          </div>
          <div className="font-bold text-2xl text-primary">
            {(((steps[steps.length - 1]?.users || 0) / totalUsers) * 100).toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
}
