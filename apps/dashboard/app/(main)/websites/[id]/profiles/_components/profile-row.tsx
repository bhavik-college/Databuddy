"use client";

import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDownIcon, ChevronRightIcon, ClockIcon, EyeIcon, UserRound, Users, ExternalLinkIcon } from "lucide-react";
import { format } from "date-fns";
import { getCountryFlag, getDeviceIcon, getBrowserIconComponent, getOSIconComponent, formatDuration } from "./profile-utils";
import { FaviconImage } from "@/components/analytics/favicon-image";
import type { ProfileData } from "@/hooks/use-analytics";

interface ProfileRowProps {
    profile: ProfileData;
    index: number;
    isExpanded: boolean;
    onToggle: () => void;
}

function getReferrerDisplayInfo(session: any) {
    // Check if we have parsed referrer info
    if (session.referrer_parsed) {
        return {
            name: session.referrer_parsed.name || session.referrer_parsed.domain || 'Unknown',
            domain: session.referrer_parsed.domain,
            type: session.referrer_parsed.type
        };
    }

    // Fallback to raw referrer
    if (session.referrer && session.referrer !== 'direct' && session.referrer !== '') {
        try {
            const url = new URL(session.referrer.startsWith('http') ? session.referrer : `https://${session.referrer}`);
            return {
                name: url.hostname.replace('www.', ''),
                domain: url.hostname,
                type: 'referrer'
            };
        } catch {
            return {
                name: session.referrer,
                domain: null,
                type: 'referrer'
            };
        }
    }

    return {
        name: 'Direct',
        domain: null,
        type: 'direct'
    };
}

export function ProfileRow({ profile, index, isExpanded, onToggle }: ProfileRowProps) {
    const avgSessionDuration = profile.total_sessions > 0
        ? (profile.total_duration || 0) / profile.total_sessions
        : 0;

    // Get the most recent session's referrer for the main profile display
    const latestSession = profile.sessions?.[0];
    const profileReferrerInfo = latestSession ? getReferrerDisplayInfo(latestSession) : null;

    return (
        <Collapsible open={isExpanded} onOpenChange={onToggle}>
            <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-5 hover:bg-muted/30 cursor-pointer transition-all duration-200 border-l-4 border-transparent hover:border-primary/20">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                        {/* Expand/Collapse and Profile Number */}
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
                            {getCountryFlag(profile.country)}
                            {getDeviceIcon(profile.device)}
                            {getBrowserIconComponent(profile.browser)}
                            {getOSIconComponent(profile.os)}
                        </div>

                        {/* Profile Info */}
                        <div className="min-w-0 flex-1">
                            <div className="font-semibold text-foreground truncate text-base">
                                Visitor {profile.visitor_id.substring(0, 8)}...
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                                <span>{profile.browser}</span>
                                <span className="text-muted-foreground/60">•</span>
                                <span>{profile.country || 'Unknown'}</span>
                            </div>
                        </div>

                        {/* Latest Referrer Info */}
                        {profileReferrerInfo && (
                            <div className="hidden lg:flex items-center gap-2 flex-shrink-0 min-w-[120px]">
                                <div className="flex items-center gap-2">
                                    {profileReferrerInfo.domain ? (
                                        <FaviconImage
                                            domain={profileReferrerInfo.domain}
                                            size={16}
                                            className="flex-shrink-0"
                                        />
                                    ) : (
                                        <ExternalLinkIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                    )}
                                    <span className="text-sm text-muted-foreground truncate">
                                        {profileReferrerInfo.name}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Key Metrics - More Prominent */}
                    <div className="flex items-center gap-4 text-sm flex-shrink-0 ml-4">
                        {/* Sessions Count */}
                        <div className="hidden sm:flex flex-col items-center gap-1 min-w-[60px]">
                            <div className="flex items-center gap-1 text-muted-foreground text-xs">
                                <Users className="w-3 h-3" />
                                <span>Sessions</span>
                            </div>
                            <span className="font-semibold text-foreground text-sm">{profile.total_sessions}</span>
                        </div>

                        {/* Page Views */}
                        <div className="hidden sm:flex flex-col items-center gap-1 min-w-[60px]">
                            <div className="flex items-center gap-1 text-muted-foreground text-xs">
                                <EyeIcon className="w-3 h-3" />
                                <span>Pages</span>
                            </div>
                            <span className="font-semibold text-foreground text-sm">{profile.total_pageviews}</span>
                        </div>

                        {/* Avg Duration */}
                        <div className="hidden lg:flex flex-col items-center gap-1 min-w-[60px]">
                            <div className="flex items-center gap-1 text-muted-foreground text-xs">
                                <ClockIcon className="w-3 h-3" />
                                <span>Avg Time</span>
                            </div>
                            <span className="font-semibold text-foreground text-sm">{formatDuration(avgSessionDuration)}</span>
                        </div>

                        {/* Visitor Type Badge */}
                        <div className="flex flex-col items-center gap-1 min-w-[70px]">
                            <div className="text-muted-foreground text-xs">Type</div>
                            <Badge variant={profile.total_sessions > 1 ? "default" : "secondary"} className="text-xs font-semibold px-2 py-1">
                                {profile.total_sessions > 1 ? 'Return' : 'New'}
                            </Badge>
                        </div>
                    </div>
                </div>
            </CollapsibleTrigger>

            <CollapsibleContent>
                <div className="px-4 pb-4 bg-muted/20 border-t">
                    {/* Basic Profile Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 text-sm">
                        <div>
                            <div className="text-muted-foreground text-xs mb-1">First Visit</div>
                            <div className="font-medium">
                                {profile.first_visit ? format(new Date(profile.first_visit), 'MMM d, yyyy') : 'Unknown'}
                            </div>
                        </div>
                        <div>
                            <div className="text-muted-foreground text-xs mb-1">Last Visit</div>
                            <div className="font-medium">
                                {profile.last_visit ? format(new Date(profile.last_visit), 'MMM d, yyyy') : 'Unknown'}
                            </div>
                        </div>
                        <div>
                            <div className="text-muted-foreground text-xs mb-1">Location</div>
                            <div className="font-medium">
                                {profile.region && profile.region !== 'Unknown' ? `${profile.region}, ` : ''}
                                {profile.country || 'Unknown'}
                            </div>
                        </div>
                        <div>
                            <div className="text-muted-foreground text-xs mb-1">Total Time</div>
                            <div className="font-medium">
                                {profile.total_duration_formatted || formatDuration(profile.total_duration || 0)}
                            </div>
                        </div>
                    </div>

                    {/* Recent Sessions */}
                    {profile.sessions && profile.sessions.length > 0 && (
                        <div className="pt-4 border-t">
                            <div className="text-sm font-medium text-muted-foreground mb-3">
                                Recent Sessions ({profile.sessions.length})
                            </div>
                            <div className="space-y-2">
                                {profile.sessions.slice(0, 5).map((session, sessionIndex) => (
                                    <div key={session.session_id} className="flex items-center justify-between p-3 bg-background rounded border">
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded bg-primary/10 text-xs font-medium text-primary flex items-center justify-center">
                                                {sessionIndex + 1}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium">{session.session_name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {session.first_visit ? format(new Date(session.first_visit), 'MMM d, HH:mm') : 'Unknown'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs">
                                            <div className="text-center">
                                                <div className="font-medium">{session.duration_formatted}</div>
                                                <div className="text-muted-foreground">Duration</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="font-medium">{session.page_views}</div>
                                                <div className="text-muted-foreground">Pages</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {profile.sessions.length > 5 && (
                                    <div className="text-xs text-muted-foreground text-center py-2">
                                        +{profile.sessions.length - 5} more sessions
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
} 