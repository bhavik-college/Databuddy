"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    WarningCircleIcon,
    UserIcon,
    CalendarIcon,
    CodeIcon,
    TerminalIcon,
    MapPinIcon,
} from "@phosphor-icons/react";
import { getErrorTypeIcon, getDeviceIcon } from "./error-icons";
import { getSeverityColor, safeFormatDate } from "./utils";
import type { ProcessedError } from "./types";

interface RecentErrorsListProps {
    processedRecentErrors: ProcessedError[];
}

export const RecentErrorsList = ({ processedRecentErrors }: RecentErrorsListProps) => {
    if (!processedRecentErrors.length) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Error Types</CardTitle>
                <CardDescription>Latest error occurrences grouped by type. Click to see details.</CardDescription>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible className="w-full">
                    {processedRecentErrors.slice(0, 15).map((error, index) => (
                        <AccordionItem value={`item-${index}`} key={`${error.error_message}-${index}`}>
                            <AccordionTrigger className="p-3 text-left hover:bg-muted/50 transition-colors rounded-md">
                                <div className="flex items-start gap-3 w-full">
                                    <div className="mt-1">
                                        {getErrorTypeIcon(error.error_type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge className={getSeverityColor(error.severity)}>
                                                {error.error_type}
                                            </Badge>
                                            <Badge variant="outline" className="text-xs">
                                                {error.category}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-1">
                                            {error.error_message}
                                        </p>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                            <span className="flex items-center gap-1">
                                                <WarningCircleIcon size={16} weight="duotone" className="h-3 w-3" />
                                                {error.count}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <UserIcon size={16} weight="duotone" className="h-3 w-3" />
                                                {error.unique_sessions}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <CalendarIcon size={16} weight="duotone" className="h-3 w-3" />
                                                {safeFormatDate(error.last_occurrence, 'MMM d, HH:mm')}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right ml-4">
                                        <div className="text-sm font-semibold">{error.count}</div>
                                        <div className="text-xs text-muted-foreground">errors</div>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="space-y-4 p-4 border-t">
                                    {/* Error Message */}
                                    <Card className="p-3">
                                        <h4 className="font-medium mb-2 flex items-center gap-2 text-sm">
                                            <CodeIcon size={16} weight="duotone" className="h-4 w-4" />
                                            Full Error Message
                                        </h4>
                                        <div className="bg-muted/50 p-3 rounded-md">
                                            <p className="text-sm font-mono break-words">{error.sample_error?.error_message || 'No error message available'}</p>
                                        </div>
                                    </Card>

                                    {/* Stack Trace */}
                                    {error.sample_error?.error_stack && (
                                        <Card className="p-3">
                                            <h4 className="font-medium mb-2 flex items-center gap-2 text-sm">
                                                <TerminalIcon size={16} weight="duotone" className="h-4 w-4" />
                                                Stack Trace
                                            </h4>
                                            <div className="bg-muted/50 p-3 rounded-md max-h-60 overflow-y-auto">
                                                <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                                                    {error.sample_error?.error_stack || 'No stack trace available'}
                                                </pre>
                                            </div>
                                        </Card>
                                    )}

                                    {/* Error Overview */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <Card className="p-3">
                                            <h4 className="font-medium mb-2 flex items-center gap-2 text-sm">
                                                <WarningCircleIcon size={16} weight="duotone" className="h-4 w-4" />
                                                Context
                                            </h4>
                                            <div className="space-y-2">
                                                <div>
                                                    <div className="text-xs font-medium text-muted-foreground mb-0.5">Last Seen</div>
                                                    <p className="text-sm">{safeFormatDate(error.sample_error?.time || '', 'MMM d, yyyy HH:mm:ss')}</p>
                                                </div>
                                                <div>
                                                    <div className="text-xs font-medium text-muted-foreground mb-0.5">Page URL</div>
                                                    <p className="text-sm break-all">{error.sample_error?.page_url || 'Unknown'}</p>
                                                </div>
                                            </div>
                                        </Card>

                                        <Card className="p-3">
                                            <h4 className="font-medium mb-2 flex items-center gap-2 text-sm">
                                                <UserIcon size={16} weight="duotone" className="h-4 w-4" />
                                                User & Device
                                            </h4>
                                            <div className="space-y-2">
                                                <div>
                                                    <div className="text-xs font-medium text-muted-foreground mb-0.5">User ID</div>
                                                    <p className="text-sm font-mono">{error.sample_error?.anonymous_id || 'Unknown'}</p>
                                                </div>
                                                <div>
                                                    <div className="text-xs font-medium text-muted-foreground mb-0.5">Device</div>
                                                    <p className="text-sm flex items-center gap-1">
                                                        {getDeviceIcon(error.sample_error?.device_type)}
                                                        {error.sample_error?.device_type || 'Unknown'} • {error.sample_error?.browser_name || 'Unknown'} • {error.sample_error?.os_name || 'Unknown'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <div className="text-xs font-medium text-muted-foreground mb-0.5">Location</div>
                                                    <p className="text-sm flex items-center gap-1">
                                                        <MapPinIcon size={16} weight="duotone" className="h-3 w-3" />
                                                        {error.sample_error?.city && error.sample_error?.country
                                                            ? `${error.sample_error?.city}, ${error.sample_error?.country}`
                                                            : error.sample_error?.country || 'Unknown'
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        </Card>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </CardContent>
        </Card>
    );
}; 