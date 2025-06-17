"use client";

export default function SandboxPage() {
    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-foreground mb-2">Sandbox</h1>
                <p className="text-muted-foreground">
                    Test and experiment with new features and functionality
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-semibold mb-2">Reddit Mentions</h3>
                    <p className="text-muted-foreground mb-4">
                        Track mentions of your brand or keywords across Reddit
                    </p>
                    <a
                        href="/sandbox/reddit-mentions"
                        className="text-primary hover:underline"
                    >
                        View Test →
                    </a>
                </div>

                <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-semibold mb-2">API Testing</h3>
                    <p className="text-muted-foreground mb-4">
                        Test API endpoints and data structures
                    </p>
                    <a
                        href="/sandbox/api-testing"
                        className="text-primary hover:underline"
                    >
                        View Test →
                    </a>
                </div>

                <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-semibold mb-2">UI Components</h3>
                    <p className="text-muted-foreground mb-4">
                        Test new UI components and layouts
                    </p>
                    <a
                        href="/sandbox/ui-components"
                        className="text-primary hover:underline"
                    >
                        View Test →
                    </a>
                </div>
            </div>
        </div>
    );
} 