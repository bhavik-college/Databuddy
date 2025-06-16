"use client";

import { Button } from "@/components/ui/button";
import { CheckCircleIcon } from "@phosphor-icons/react";

interface CompleteStepProps {
    onViewDashboard: () => void;
}

export function CompleteStep({ onViewDashboard }: CompleteStepProps) {
    return (
        <div className="space-y-4">
            <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircleIcon size={32} weight="fill" className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">Integration Complete!</h3>
                <p className="text-muted-foreground mb-4">
                    Your Stripe account is now connected to DataBuddy
                </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 dark:bg-green-950/20 dark:border-green-800">
                <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">What's Next?</h4>
                <ul className="space-y-1 text-sm text-green-800 dark:text-green-200">
                    <li>• Revenue data will appear in the Overview tab</li>
                    <li>• Analytics will be available within 24 hours</li>
                    <li>• You'll receive real-time payment notifications</li>
                </ul>
            </div>

            <Button
                onClick={onViewDashboard}
                className="w-full"
            >
                View Revenue Dashboard
            </Button>
        </div>
    );
} 