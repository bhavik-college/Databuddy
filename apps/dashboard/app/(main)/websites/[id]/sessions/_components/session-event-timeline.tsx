"use client";

import { Badge } from "@/components/ui/badge";
import { FileTextIcon, SparklesIcon } from "lucide-react";
import { getEventIconAndColor, getDisplayPath, cleanUrl, formatPropertyValue } from "./session-utils";

interface SessionEvent {
    event_id?: string;
    time: string;
    event_name: string;
    path?: string;
    error_message?: string;
    error_type?: string;
    properties?: Record<string, any>;
}

interface SessionEventTimelineProps {
    events: SessionEvent[];
}

export function SessionEventTimeline({ events }: SessionEventTimelineProps) {
    if (!events || events.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <FileTextIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No events recorded for this session</p>
            </div>
        );
    }

    return (
        <div className="space-y-3 max-h-96 overflow-y-auto">
            {events.map((event, eventIndex) => {
                const hasProperties = Boolean(event.properties && Object.keys(event.properties).length > 0);
                const { icon, color, bgColor, borderColor, badgeColor } = getEventIconAndColor(
                    event.event_name,
                    Boolean(event.error_message),
                    hasProperties
                );
                const displayPath = getDisplayPath(event.path || '');
                const fullPath = cleanUrl(event.path || '');

                return (
                    <div key={event.event_id || eventIndex} className={`flex items-start gap-3 p-4 rounded-lg border-2 ${bgColor} ${borderColor} ${hasProperties ? 'shadow-sm' : ''}`}>
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-card border-2 text-xs font-bold ${color} flex-shrink-0 shadow-sm`}>
                            {eventIndex + 1}
                        </div>
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className={`${color} flex-shrink-0 mt-1`}>
                                {icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                                        <span className={`font-semibold text-sm ${event.error_message ? 'text-destructive' : hasProperties ? 'text-accent-foreground' : 'text-foreground'
                                            }`}>
                                            {event.error_message ? 'Error' : event.event_name}
                                        </span>
                                        {displayPath && (
                                            <Badge
                                                variant="secondary"
                                                className="text-xs font-mono"
                                                title={fullPath}
                                            >
                                                {displayPath}
                                            </Badge>
                                        )}
                                        {hasProperties && (
                                            <Badge className={`text-xs font-medium ${badgeColor}`}>
                                                Custom Event
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0 font-medium">
                                        {new Date(event.time).toLocaleTimeString()}
                                    </div>
                                </div>

                                {hasProperties && (
                                    <div className="mt-3 p-3 bg-accent/10 border-2 border-accent/20 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <SparklesIcon className="w-4 h-4 text-accent-foreground" />
                                            <span className="font-semibold text-accent-foreground text-sm">Event Properties</span>
                                        </div>
                                        <div className="space-y-2">
                                            {Object.entries(event.properties || {}).map(([key, value]) => (
                                                <div key={key} className="flex items-center gap-3 p-2 bg-card/60 rounded border border-accent/20">
                                                    <span className="font-mono text-accent-foreground text-xs font-semibold min-w-0 truncate">{key}</span>
                                                    <span className="text-accent-foreground font-medium text-xs bg-accent/20 px-2 py-1 rounded">{formatPropertyValue(value)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {event.error_message && (
                                    <div className="mt-3 p-3 bg-destructive/10 border-2 border-destructive/20 rounded-lg">
                                        <div className="text-destructive text-sm">
                                            <span className="font-semibold">{event.error_type}:</span> {event.error_message}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
} 