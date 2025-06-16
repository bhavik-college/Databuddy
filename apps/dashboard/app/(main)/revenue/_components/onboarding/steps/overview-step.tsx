"use client";

import { Button } from "@/components/ui/button";
import { CheckCircleIcon } from "@phosphor-icons/react";

interface OverviewStepProps {
    onNext: () => void;
}

export function OverviewStep({ onNext }: OverviewStepProps) {
    return (
        <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-950/20 dark:border-blue-800">
                <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">What you'll get:</h3>
                <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                    <li className="flex items-center gap-2">
                        <CheckCircleIcon size={16} weight="fill" className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        Real-time payment tracking
                    </li>
                    <li className="flex items-center gap-2">
                        <CheckCircleIcon size={16} weight="fill" className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        Revenue analytics and trends
                    </li>
                    <li className="flex items-center gap-2">
                        <CheckCircleIcon size={16} weight="fill" className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        Refund and chargeback monitoring
                    </li>
                    <li className="flex items-center gap-2">
                        <CheckCircleIcon size={16} weight="fill" className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        Customer payment insights
                    </li>
                </ul>
            </div>
            <Button onClick={onNext} className="w-full">
                Start Integration
            </Button>
        </div>
    );
} 