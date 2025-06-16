"use client";

import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDownIcon, ChevronRightIcon, ClockIcon, EyeIcon, MousePointerClickIcon, AlertTriangleIcon, SparklesIcon, ExternalLinkIcon } from "lucide-react";
import { getCountryFlag, getDeviceIcon, getBrowserIconComponent, getOSIconComponent } from "./session-utils";
import { SessionEventTimeline } from "./session-event-timeline";
import { FaviconImage } from "@/components/analytics/favicon-image";

interface SessionRowProps {
    session: any;
    index: number;
    isExpanded: boolean;
    onToggle: () => void;
}

function getReferrerDisplayInfo(session: any) {
    if (session.referrer_parsed) {
        return {
            name: session.referrer_parsed.name || session.referrer_parsed.domain || 'Unknown',
            domain: session.referrer_parsed.domain,
            type: session.referrer_parsed.type
        };
    }

    return {
        name: 'Direct',
        domain: null,
        type: 'direct'
    };
}

export function SessionRow({ session, index, isExpanded, onToggle }: SessionRowProps) {
    const errorCount = session.events?.filter((e: any) => e.error_message).length || 0;
    const customEventCount = session.events?.filter((e: any) =>
        e.properties && Object.keys(e.properties).length > 0
    ).length || 0;

    const referrerInfo = getReferrerDisplayInfo(session);

    return (
        <Collapsible open={isExpanded} onOpenChange={onToggle}>
            <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-5 hover:bg-muted/30 cursor-pointer transition-all duration-200 border-l-4 border-transparent hover:border-primary/20">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                        {/* Expand/Collapse and Session Number */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                            {isExpanded ? (
                                <ChevronDownIcon className="w-4 h-4 text-muted-foreground transition-transform" />
                            ) : (
                                <ChevronRightIcon className="w-4 h-4 text-muted-foreground transition-transform" />
                            )}
                            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                                {index + 1}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {getCountryFlag(session.country)}
                            {getDeviceIcon(session.device)}
                            {getBrowserIconComponent(session.browser)}
                            {getOSIconComponent(session.os)}
                        </div>

                        {/* Session Info */}
                        <div className="min-w-0 flex-1">
                            <div className="font-semibold text-foreground truncate text-base">
                                {session.session_name}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                                <span>{session.browser}</span>
                                <span className="text-muted-foreground/60">•</span>
                                <span>{session.country || 'Unknown'}</span>
                                {session.is_returning_visitor && (
                                    <>
                                        <span className="text-muted-foreground/60">•</span>
                                        <span className="text-blue-600 font-medium">Returning</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Referrer Info */}
                        <div className="hidden lg:flex items-center gap-2 flex-shrink-0 min-w-[120px]">
                            <div className="flex items-center gap-2">
                                {referrerInfo.domain ? (
                                    <FaviconImage
                                        domain={referrerInfo.domain}
                                        size={16}
                                        className="flex-shrink-0"
                                    />
                                ) : (
                                    <ExternalLinkIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                )}
                                <span className="text-sm text-muted-foreground truncate">
                                    {referrerInfo.name}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Key Metrics - More Prominent */}
                    <div className="flex items-center gap-4 text-sm flex-shrink-0 ml-4">
                        {/* Duration */}
                        <div className="hidden sm:flex flex-col items-center gap-1 min-w-[60px]">
                            <div className="flex items-center gap-1 text-muted-foreground text-xs">
                                <ClockIcon className="w-3 h-3" />
                                <span>Duration</span>
                            </div>
                            <span className="font-semibold text-foreground text-sm">{session.duration_formatted}</span>
                        </div>

                        {/* Page Views */}
                        <div className="hidden sm:flex flex-col items-center gap-1 min-w-[60px]">
                            <div className="flex items-center gap-1 text-muted-foreground text-xs">
                                <EyeIcon className="w-3 h-3" />
                                <span>Pages</span>
                            </div>
                            <span className="font-semibold text-foreground text-sm">{session.page_views}</span>
                        </div>

                        {/* Events Count */}
                        <div className="flex flex-col items-center gap-1 min-w-[60px]">
                            <div className="text-muted-foreground text-xs">Events</div>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs font-semibold px-2 py-1">
                                    {session.events?.length || 0}
                                </Badge>
                            </div>
                        </div>

                        {/* Special Badges */}
                        <div className="flex items-center gap-2">
                            {/* Custom Events */}
                            {customEventCount > 0 && (
                                <div className="flex flex-col items-center gap-1">
                                    <div className="text-violet-600 text-xs font-medium">Custom</div>
                                    <Badge className="text-xs bg-gradient-to-r from-violet-500 to-purple-500 text-white border-0 shadow-sm font-semibold">
                                        <SparklesIcon className="w-3 h-3 mr-1" />
                                        {customEventCount}
                                    </Badge>
                                </div>
                            )}

                            {/* Errors */}
                            {errorCount > 0 && (
                                <div className="flex flex-col items-center gap-1">
                                    <div className="text-red-600 text-xs font-medium">Errors</div>
                                    <Badge className="text-xs bg-gradient-to-r from-red-500 to-red-600 text-white border-0 shadow-sm font-semibold">
                                        <AlertTriangleIcon className="w-3 h-3 mr-1" />
                                        {errorCount}
                                    </Badge>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CollapsibleTrigger>

            <CollapsibleContent>
                <div className="px-4 pb-4 bg-muted/20 border-t border-border">
                    {/* Session Info Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 py-4 text-sm border-b border-border/50">
                        <div className="text-center">
                            <span className="text-muted-foreground text-xs uppercase tracking-wide block mb-2">Duration</span>
                            <div className="font-bold text-foreground text-lg">{session.duration_formatted}</div>
                        </div>
                        <div className="text-center">
                            <span className="text-muted-foreground text-xs uppercase tracking-wide block mb-2">Page Views</span>
                            <div className="font-bold text-foreground text-lg">{session.page_views}</div>
                        </div>
                        <div className="text-center">
                            <span className="text-muted-foreground text-xs uppercase tracking-wide block mb-2">Visitor Type</span>
                            <div className="font-medium text-foreground">
                                {session.is_returning_visitor ? (
                                    <span className="text-blue-600 font-semibold">Returning</span>
                                ) : (
                                    <span className="text-green-600 font-semibold">New</span>
                                )}
                            </div>
                        </div>
                        <div className="text-center">
                            <span className="text-muted-foreground text-xs uppercase tracking-wide block mb-2">Session #</span>
                            <div className="font-bold text-foreground text-lg">
                                #{session.visitor_session_count || 1}
                            </div>
                        </div>
                        <div className="text-center">
                            <span className="text-muted-foreground text-xs uppercase tracking-wide block mb-2">Referrer</span>
                            <div className="flex items-center justify-center gap-2">
                                {referrerInfo.domain ? (
                                    <FaviconImage
                                        domain={referrerInfo.domain}
                                        size={16}
                                        className="flex-shrink-0"
                                    />
                                ) : (
                                    <ExternalLinkIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                )}
                                <span className="font-medium text-foreground text-sm truncate">
                                    {referrerInfo.name}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Events Timeline */}
                    <div className="pt-6">
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="font-semibold text-lg text-foreground">Event Timeline</h4>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg">
                                    <span className="text-sm font-bold text-slate-800">{session.events?.length || 0}</span>
                                    <span className="text-xs text-slate-600">total events</span>
                                </div>
                                {customEventCount > 0 && (
                                    <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-violet-100 to-purple-100 rounded-lg">
                                        <SparklesIcon className="w-4 h-4 text-violet-600" />
                                        <span className="text-sm font-bold text-violet-800">{customEventCount}</span>
                                        <span className="text-xs text-violet-600">custom</span>
                                    </div>
                                )}
                                {errorCount > 0 && (
                                    <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-red-100 to-red-100 rounded-lg">
                                        <AlertTriangleIcon className="w-4 h-4 text-red-600" />
                                        <span className="text-sm font-bold text-red-800">{errorCount}</span>
                                        <span className="text-xs text-red-600">errors</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <SessionEventTimeline events={session.events || []} />
                    </div>
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
} 