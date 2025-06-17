"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Copy, Check } from "lucide-react";

export default function ApiTestingPage() {
    const [endpoint, setEndpoint] = useState('/api/v1/analytics');
    const [method, setMethod] = useState('GET');
    const [headers, setHeaders] = useState('{\n  "Content-Type": "application/json"\n}');
    const [body, setBody] = useState('');
    const [response, setResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleTest = async () => {
        setIsLoading(true);

        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Mock response based on endpoint
            let mockResponse;
            if (endpoint.includes('analytics')) {
                mockResponse = {
                    status: 200,
                    data: {
                        pageviews: 1234,
                        visitors: 567,
                        bounce_rate: 0.45,
                        avg_session_duration: 180,
                        top_pages: [
                            { path: '/', views: 456 },
                            { path: '/about', views: 234 },
                            { path: '/contact', views: 123 }
                        ]
                    },
                    timestamp: new Date().toISOString()
                };
            } else {
                mockResponse = {
                    status: 200,
                    message: 'API test successful',
                    endpoint: endpoint,
                    method: method,
                    timestamp: new Date().toISOString()
                };
            }

            setResponse(JSON.stringify(mockResponse, null, 2));
        } catch (error) {
            setResponse(JSON.stringify({ error: 'API test failed', message: String(error) }, null, 2));
        } finally {
            setIsLoading(false);
        }
    };

    const copyResponse = () => {
        navigator.clipboard.writeText(response);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-foreground mb-2">API Testing</h1>
                <p className="text-muted-foreground">
                    Test API endpoints and data structures
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Request Configuration</CardTitle>
                        <CardDescription>Configure your API request parameters</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <Label htmlFor="method">Method</Label>
                                <select
                                    id="method"
                                    value={method}
                                    onChange={(e) => setMethod(e.target.value)}
                                    className="w-full p-2 border rounded-md bg-background"
                                >
                                    <option value="GET">GET</option>
                                    <option value="POST">POST</option>
                                    <option value="PUT">PUT</option>
                                    <option value="DELETE">DELETE</option>
                                </select>
                            </div>
                            <div className="col-span-2">
                                <Label htmlFor="endpoint">Endpoint</Label>
                                <Input
                                    id="endpoint"
                                    value={endpoint}
                                    onChange={(e) => setEndpoint(e.target.value)}
                                    placeholder="/api/v1/endpoint"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="headers">Headers (JSON)</Label>
                            <Textarea
                                id="headers"
                                value={headers}
                                onChange={(e) => setHeaders(e.target.value)}
                                rows={4}
                                className="font-mono text-sm"
                            />
                        </div>

                        {(method === 'POST' || method === 'PUT') && (
                            <div>
                                <Label htmlFor="body">Request Body (JSON)</Label>
                                <Textarea
                                    id="body"
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    rows={6}
                                    className="font-mono text-sm"
                                    placeholder='{\n  "key": "value"\n}'
                                />
                            </div>
                        )}

                        <Button
                            onClick={handleTest}
                            disabled={isLoading}
                            className="w-full flex items-center gap-2"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                            {isLoading ? 'Testing...' : 'Send Request'}
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Response</CardTitle>
                                <CardDescription>API response data</CardDescription>
                            </div>
                            {response && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={copyResponse}
                                    className="flex items-center gap-2"
                                >
                                    {copied ? (
                                        <Check className="h-4 w-4" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                    {copied ? 'Copied!' : 'Copy'}
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {response ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-green-600">
                                        200 OK
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">
                                        Response received
                                    </span>
                                </div>
                                <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                                    <code>{response}</code>
                                </pre>
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground py-8">
                                <p>No response yet. Send a request to see the results.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Quick Tests</CardTitle>
                    <CardDescription>Common API endpoints for testing</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                        {[
                            { name: 'Analytics Overview', endpoint: '/api/v1/analytics', method: 'GET' },
                            { name: 'Website List', endpoint: '/api/v1/websites', method: 'GET' },
                            { name: 'User Profile', endpoint: '/api/v1/user/profile', method: 'GET' },
                            { name: 'Event Tracking', endpoint: '/api/v1/events', method: 'POST' },
                            { name: 'Settings Update', endpoint: '/api/v1/settings', method: 'PUT' },
                            { name: 'Health Check', endpoint: '/api/health', method: 'GET' },
                        ].map((test) => (
                            <Button
                                key={test.name}
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setEndpoint(test.endpoint);
                                    setMethod(test.method);
                                }}
                                className="justify-start"
                            >
                                <Badge variant="secondary" className="mr-2 text-xs">
                                    {test.method}
                                </Badge>
                                {test.name}
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 