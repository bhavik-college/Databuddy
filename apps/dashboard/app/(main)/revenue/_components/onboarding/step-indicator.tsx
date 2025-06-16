"use client";

import { CheckCircle } from "lucide-react";
import type { OnboardingStep } from "../../utils/types";

interface StepIndicatorProps {
    currentStep: OnboardingStep;
    steps: OnboardingStep[];
}

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
    return (
        <div className="flex items-center gap-4">
            {steps.map((step, index) => (
                <div key={step} className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep === step
                        ? 'bg-blue-500 text-white'
                        : index < steps.indexOf(currentStep)
                            ? 'bg-green-500 text-white'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                        {index < steps.indexOf(currentStep) ? (
                            <CheckCircle className="h-4 w-4" />
                        ) : (
                            index + 1
                        )}
                    </div>
                    {index < steps.length - 1 && <div className="w-8 h-px bg-border" />}
                </div>
            ))}
        </div>
    );
} 