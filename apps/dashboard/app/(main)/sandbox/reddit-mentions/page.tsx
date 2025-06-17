"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
    ChatCircleIcon,
    ArrowUpIcon,
    ClockIcon,
    UserIcon,
    WarningCircleIcon,
    WifiHighIcon,
    WifiLowIcon,
    PlusIcon,
    X,
    Download,
    MagnifyingGlassIcon,
    ArrowClockwiseIcon,
    FunnelIcon,
    TrendUpIcon,
    ArrowSquareOutIcon,
    CircleNotchIcon,
} from "@phosphor-icons/react";
import { useRedditMentions, useRefreshRedditMentions, useRedditHealth, useExportRedditData, useSearchHistory, type RedditPost, type SearchFilters } from "./hooks/use-reddit-mentions";
import { cn } from "@/lib/utils";

const DEFAULT_KEYWORDS = ['databuddy', 'analytics platform', 'website analytics'];

function LoadingSkeleton() {
    return (
        <div className="space-y-6">
            {/* Stats skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i}>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-10 w-10 rounded-lg" />
                                <div className="space-y-2">
                                    <Skeleton className="h-3 w-20 rounded" />
                                    <Skeleton className="h-6 w-12 rounded" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Posts skeleton */}
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <Card key={i}>
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-5 w-3/4 rounded" />
                                        <div className="flex gap-4">
                                            <Skeleton className="h-4 w-20 rounded" />
                                            <Skeleton className="h-4 w-16 rounded" />
                                            <Skeleton className="h-4 w-24 rounded" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-8 w-8 rounded" />
                                </div>
                                <Skeleton className="h-16 w-full rounded" />
                                <div className="flex justify-between">
                                    <Skeleton className="h-6 w-20 rounded" />
                                    <div className="flex gap-4">
                                        <Skeleton className="h-4 w-12 rounded" />
                                        <Skeleton className="h-4 w-12 rounded" />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

function EmptyState({ onRefresh }: { onRefresh: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="relative mb-8">
                <div className="rounded-full bg-muted/50 p-8 border">
                    <MagnifyingGlassIcon size={64} weight="duotone" className="h-16 w-16 text-muted-foreground" />
                </div>
                <div className="absolute -top-2 -right-2 p-2 rounded-full bg-primary/10 border border-primary/20">
                    <ChatCircleIcon size={24} weight="fill" className="h-6 w-6 text-primary" />
                </div>
            </div>

            <h3 className="text-2xl font-bold mb-4">No mentions found</h3>
            <p className="text-muted-foreground mb-8 max-w-md leading-relaxed">
                Try adjusting your keywords or time range, or check back later for new mentions.
            </p>

            <Button onClick={onRefresh} variant="outline" size="lg">
                <ArrowClockwiseIcon size={16} weight="fill" className="h-4 w-4 mr-2" />
                Refresh Data
            </Button>
        </div>
    );
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="rounded-full bg-red-50 p-8 border border-red-200 mb-8">
                <WarningCircleIcon size={64} weight="fill" className="h-16 w-16 text-red-500" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Something went wrong</h3>
            <p className="text-muted-foreground mb-8 max-w-md leading-relaxed">
                {error}
            </p>
            <Button onClick={onRetry} variant="outline" size="lg">
                Try Again
            </Button>
        </div>
    );
}

export default function RedditMentionsPage() {
    const [keywords, setKeywords] = useState<string[]>(DEFAULT_KEYWORDS);
    const [newKeyword, setNewKeyword] = useState('');
    const [timeRange, setTimeRange] = useState('24h');
    const [subreddits, setSubreddits] = useState<string[]>([]);
    const [minScore, setMinScore] = useState<number | undefined>(undefined);
    const [sortBy, setSortBy] = useState<'relevance' | 'new' | 'top' | 'hot'>('new');
    const [excludeStickied, setExcludeStickied] = useState(false);
    const [backgroundSync, setBackgroundSync] = useState(false);

    const filters = {
        keywords,
        timeRange,
        subreddits: subreddits.length > 0 ? subreddits : undefined,
        minScore,
        sortBy,
        excludeStickied,
    };

    const {
        data: redditData,
        isLoading,
        error,
        isError,
        isFetching,
        dataUpdatedAt,
        refetch
    } = useRedditMentions(filters, { backgroundSync });

    const { data: healthData } = useRedditHealth();
    const refreshMutation = useRefreshRedditMentions();
    const exportMutation = useExportRedditData();
    const { addToHistory } = useSearchHistory();

    const posts = redditData?.posts || [];
    const stats = redditData?.stats || {
        total_mentions: 0,
        average_score: 0,
        top_subreddit: '',
        recent_mentions: 0
    };

    const handleRefresh = () => {
        refreshMutation.mutate();
        // Add to search history
        addToHistory(filters);
    };

    const addKeyword = () => {
        if (newKeyword.trim() && !keywords.includes(newKeyword.trim()) && keywords.length < 10) {
            setKeywords([...keywords, newKeyword.trim()]);
            setNewKeyword('');
        }
    };

    const removeKeyword = (keyword: string) => {
        setKeywords(keywords.filter(k => k !== keyword));
    };

    const handleExport = (format: 'json' | 'csv') => {
        exportMutation.mutate({ format, filters });
    };

    const formatTimeAgo = (timestamp: number) => {
        const date = new Date(timestamp * 1000);
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

        if (diffInHours < 1) return 'Less than an hour ago';
        if (diffInHours === 1) return '1 hour ago';
        if (diffInHours < 24) return `${diffInHours} hours ago`;
        return `${Math.floor(diffInHours / 24)} days ago`;
    };

    const isApiHealthy = healthData?.status === 'healthy' && healthData?.reddit_connected;
    const isRefreshing = refreshMutation.isPending || isFetching;

    return (
        <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Enhanced header */}
            <div className="border-b bg-gradient-to-r from-background via-background to-muted/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:px-4 sm:py-4 gap-3 sm:gap-0">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                                <ChatCircleIcon size={20} weight="fill" className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
                                    Reddit Mentions
                                </h1>
                                <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
                                    Track mentions of your keywords across Reddit
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* API Status Indicator */}
                        <div className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border",
                            isApiHealthy
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-red-50 text-red-700 border-red-200"
                        )}>
                            {isApiHealthy ? (
                                <WifiHighIcon size={16} className="h-4 w-4" />
                            ) : (
                                <WifiLowIcon size={16} className="h-4 w-4" />
                            )}
                            <span>{isApiHealthy ? 'Connected' : 'Disconnected'}</span>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                onClick={() => exportMutation.mutate({ format: 'csv', filters })}
                                disabled={exportMutation.isPending || posts.length === 0}
                                variant="outline"
                                size="default"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Export CSV
                            </Button>

                            <Button
                                onClick={handleRefresh}
                                disabled={isRefreshing || !isApiHealthy}
                                size="default"
                                className={cn(
                                    "gap-2 px-6 py-3 font-medium",
                                    "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary",
                                    "shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
                                )}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                                {isRefreshing ? (
                                    <CircleNotchIcon size={16} weight="fill" className="h-4 w-4 animate-spin relative z-10" />
                                ) : (
                                    <ArrowClockwiseIcon size={16} weight="fill" className="h-4 w-4 relative z-10" />
                                )}
                                <span className="relative z-10">
                                    {isRefreshing ? 'Refreshing...' : 'Refresh'}
                                </span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto p-3 sm:px-4 sm:pt-4 sm:pb-6">
                {/* Error Alert */}
                {isError && (
                    <Alert variant="destructive" className="mb-6">
                        <WarningCircleIcon size={16} weight="duotone" className="h-4 w-4" />
                        <AlertDescription>
                            {error?.message || 'Failed to fetch Reddit mentions. Please try again.'}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Configuration Card */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="text-lg">Configuration</CardTitle>
                        <CardDescription>
                            Manage your keywords and time range settings
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Keywords Management */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">Keywords</Label>
                                <span className="text-xs text-muted-foreground">{keywords.length}/10</span>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {keywords.map((keyword) => (
                                    <Badge
                                        key={keyword}
                                        variant="secondary"
                                        className="px-3 py-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors group"
                                        onClick={() => removeKeyword(keyword)}
                                    >
                                        {keyword}
                                        <X className="h-3 w-3 ml-1 opacity-50 group-hover:opacity-100" />
                                    </Badge>
                                ))}
                            </div>

                            <div className="flex gap-2">
                                <Input
                                    placeholder="Add new keyword..."
                                    value={newKeyword}
                                    onChange={(e) => setNewKeyword(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                                    className="flex-1"
                                    disabled={keywords.length >= 10}
                                />
                                <Button
                                    onClick={addKeyword}
                                    variant="outline"
                                    disabled={keywords.length >= 10 || !newKeyword.trim()}
                                >
                                    <PlusIcon size={16} className="h-4 w-4" />
                                </Button>
                            </div>

                            {keywords.length >= 10 && (
                                <p className="text-xs text-muted-foreground">
                                    Maximum of 10 keywords reached. Remove a keyword to add a new one.
                                </p>
                            )}
                        </div>

                        <Separator />

                        {/* Time Range Selection */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Time Range</Label>
                            <Select value={timeRange} onValueChange={setTimeRange}>
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1h">Last Hour</SelectItem>
                                    <SelectItem value="24h">Last 24 Hours</SelectItem>
                                    <SelectItem value="7d">Last 7 Days</SelectItem>
                                    <SelectItem value="30d">Last 30 Days</SelectItem>
                                    <SelectItem value="365d">Last Year</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Separator />

                        {/* Advanced Filters */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <FunnelIcon size={16} weight="fill" className="h-4 w-4" />
                                <Label className="text-sm font-medium">Advanced Filters</Label>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium">Sort By</Label>
                                    <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="new">Newest First</SelectItem>
                                            <SelectItem value="top">Highest Score</SelectItem>
                                            <SelectItem value="hot">Most Active</SelectItem>
                                            <SelectItem value="relevance">Most Relevant</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-medium">Min Score</Label>
                                    <Input
                                        type="number"
                                        placeholder="e.g. 10"
                                        value={minScore || ''}
                                        onChange={(e) => setMinScore(e.target.value ? parseInt(e.target.value) : undefined)}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="excludeStickied"
                                    checked={excludeStickied}
                                    onChange={(e) => setExcludeStickied(e.target.checked)}
                                    className="rounded"
                                />
                                <Label htmlFor="excludeStickied" className="text-xs">
                                    Exclude stickied posts
                                </Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="backgroundSync"
                                    checked={backgroundSync}
                                    onChange={(e) => setBackgroundSync(e.target.checked)}
                                    className="rounded"
                                />
                                <Label htmlFor="backgroundSync" className="text-xs">
                                    Auto-refresh every 10 minutes
                                </Label>
                            </div>
                        </div>

                        {dataUpdatedAt && (
                            <div className="text-xs text-muted-foreground pt-2 border-t">
                                Last updated: {new Date(dataUpdatedAt).toLocaleString()}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Stats Cards */}
                {!isLoading && !isError && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                                        <MagnifyingGlassIcon size={20} weight="fill" className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Total Mentions</p>
                                        <p className="text-2xl font-bold">{stats.total_mentions}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                                        <TrendUpIcon size={20} weight="fill" className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Avg Score</p>
                                        <p className="text-2xl font-bold">{Math.round(stats.average_score)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                                        <ChatCircleIcon size={20} weight="fill" className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Top Subreddit</p>
                                        <p className="text-lg font-bold truncate">r/{stats.top_subreddit || 'N/A'}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                                        <ClockIcon size={20} weight="fill" className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Recent</p>
                                        <p className="text-2xl font-bold">{stats.recent_mentions}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Results Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Recent Mentions</h2>
                        {!isLoading && !isError && (
                            <Badge variant="outline" className="text-sm">
                                {posts.length} results
                            </Badge>
                        )}
                    </div>

                    {/* Loading State */}
                    {isLoading && <LoadingSkeleton />}

                    {/* Error State */}
                    {isError && (
                        <ErrorState
                            error={error?.message || 'Failed to fetch Reddit mentions'}
                            onRetry={() => refetch()}
                        />
                    )}

                    {/* Empty State */}
                    {!isLoading && !isError && posts.length === 0 && (
                        <EmptyState onRefresh={handleRefresh} />
                    )}

                    {/* Results */}
                    {!isLoading && !isError && posts.length > 0 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
                            {posts.map((post: RedditPost, index: number) => (
                                <div
                                    key={post.id}
                                    className="animate-in fade-in slide-in-from-bottom-4"
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    <Card className="hover:shadow-md transition-all duration-200 border-l-4 border-l-primary/20 hover:border-l-primary">
                                        <CardContent className="p-6">
                                            <div className="space-y-4">
                                                {/* Header */}
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2">
                                                            {post.title}
                                                        </h3>
                                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                            <div className="flex items-center gap-1">
                                                                <ChatCircleIcon size={16} weight="fill" className="h-4 w-4" />
                                                                <span className="font-medium">r/{post.subreddit}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <UserIcon size={16} weight="fill" className="h-4 w-4" />
                                                                <span>u/{post.author}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <ClockIcon size={16} weight="fill" className="h-4 w-4" />
                                                                <span>{formatTimeAgo(post.created_utc)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Button variant="ghost" size="sm" asChild>
                                                        <a href={`https://reddit.com${post.permalink}`} target="_blank" rel="noopener noreferrer">
                                                            <ArrowSquareOutIcon size={16} weight="fill" className="h-4 w-4" />
                                                        </a>
                                                    </Button>
                                                </div>

                                                {/* Content */}
                                                {post.selftext && (
                                                    <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">
                                                        {post.selftext}
                                                    </p>
                                                )}

                                                {/* Footer */}
                                                <div className="flex items-center justify-between pt-2">
                                                    <Badge variant="outline" className="text-xs">
                                                        {post.keyword}
                                                    </Badge>

                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                        <div className="flex items-center gap-1">
                                                            <ArrowUpIcon size={16} weight="fill" className="h-4 w-4" />
                                                            <span className="font-medium">{post.score}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <ChatCircleIcon size={16} weight="fill" className="h-4 w-4" />
                                                            <span>{post.num_comments}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 