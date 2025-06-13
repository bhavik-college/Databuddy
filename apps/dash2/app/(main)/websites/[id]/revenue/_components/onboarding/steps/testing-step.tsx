"use client";

import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";

interface TestingStepProps {
    copyToClipboard: (text: string, label: string) => void;
    onBack: () => void;
    onNext: () => void;
}

export function TestingStep({ copyToClipboard, onBack, onNext }: TestingStepProps) {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="font-medium mb-3">Step 2: Test Integration</h3>
                <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 dark:bg-green-950/20 dark:border-green-800">
                        <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">Test with Stripe CLI</h4>
                        <div className="space-y-2">
                            <code className="block bg-green-100 dark:bg-green-900/30 p-2 rounded text-sm font-mono text-green-800 dark:text-green-200">
                                stripe payment_intents create \<br />
                                &nbsp;&nbsp;--amount 2000 \<br />
                                &nbsp;&nbsp;--currency usd \<br />
                                &nbsp;&nbsp;--client-reference-id "sess_db_test_123" \<br />
                                &nbsp;&nbsp;--metadata[user_id]="user_test_123"
                            </code>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(
                                    'stripe payment_intents create --amount 2000 --currency usd --client-reference-id "sess_db_test_123" --metadata[user_id]="user_test_123"',
                                    'Test command'
                                )}
                            >
                                <Copy className="h-4 w-4 mr-2" />
                                Copy Command
                            </Button>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-950/20 dark:border-blue-800">
                        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Integration Status</h4>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                <span>Waiting for test webhook...</span>
                            </div>
                            <p className="text-xs text-blue-800 dark:text-blue-200">
                                Create a test payment in Stripe to verify the integration
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-2">
                <Button
                    variant="outline"
                    onClick={onBack}
                >
                    Back
                </Button>
                <Button
                    onClick={onNext}
                    className="flex-1"
                >
                    Complete Setup
                </Button>
            </div>
        </div>
    );
} 