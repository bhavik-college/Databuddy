"use client";

import { useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import {
    RefreshCw,
    TrendingDown,
    Users,
    Target,
    Plus,
    BarChart3,
    Clock,
    ArrowRight,
    ChevronRight,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Trash2,
    Edit,
    ChevronDown,
    MoreVertical,
    Eye,
    EyeOff
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/analytics/stat-card";
import { ClosableAlert } from "@/components/ui/closable-alert";
import { useWebsite } from "@/hooks/use-websites";
import { useAtom } from "jotai";
import {
    dateRangeAtom,
    timeGranularityAtom,
    formattedDateRangeAtom,
} from "@/stores/jotai/filterAtoms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import {
    useFunnels,
    useFunnelAnalytics,
    type Funnel,
    type FunnelStep,
    type CreateFunnelData,
} from "@/hooks/use-funnels";

export default function FunnelsPage() {
    const { id } = useParams();
    const websiteId = id as string;
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [expandedFunnelId, setExpandedFunnelId] = useState<string | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingFunnel, setEditingFunnel] = useState<Funnel | null>(null);
    const [deletingFunnelId, setDeletingFunnelId] = useState<string | null>(null);
    const [newFunnel, setNewFunnel] = useState<CreateFunnelData>({
        name: '',
        description: '',
        steps: [
            { type: 'PAGE_VIEW' as const, target: '/', name: 'Landing Page' },
            { type: 'PAGE_VIEW' as const, target: '/signup', name: 'Sign Up Page' }
        ]
    });

    const [,] = useAtom(dateRangeAtom);
    const [currentGranularity] = useAtom(timeGranularityAtom);
    const [formattedDateRangeState] = useAtom(formattedDateRangeAtom);

    const memoizedDateRangeForTabs = useMemo(() => ({
        start_date: formattedDateRangeState.startDate,
        end_date: formattedDateRangeState.endDate,
        granularity: currentGranularity,
    }), [formattedDateRangeState, currentGranularity]);

    const { data: websiteData } = useWebsite(websiteId);

    // Only fetch funnels list initially - no analytics
    const {
        data: funnels,
        isLoading: funnelsLoading,
        error: funnelsError,
        refetch: refetchFunnels,
        createFunnel,
        updateFunnel,
        deleteFunnel,
        isCreating,
        isUpdating,
    } = useFunnels(websiteId);

    // Only load analytics when a funnel is expanded
    const {
        data: analyticsData,
        isLoading: analyticsLoading,
        error: analyticsError,
        refetch: refetchAnalytics
    } = useFunnelAnalytics(
        websiteId,
        expandedFunnelId || '',
        memoizedDateRangeForTabs,
        { enabled: !!expandedFunnelId }
    );

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        try {
            const promises: Promise<any>[] = [refetchFunnels()];

            if (expandedFunnelId) {
                promises.push(refetchAnalytics());
            }

            await Promise.all(promises);
        } catch (error) {
            console.error("Failed to refresh funnel data:", error);
        } finally {
            setIsRefreshing(false);
        }
    }, [refetchFunnels, refetchAnalytics, expandedFunnelId]);

    const handleCreateFunnel = async () => {
        try {
            await createFunnel(newFunnel);
            setIsCreateDialogOpen(false);
            resetNewFunnel();
        } catch (error) {
            console.error("Failed to create funnel:", error);
        }
    };

    const handleUpdateFunnel = async () => {
        if (!editingFunnel) return;

        try {
            await updateFunnel({
                funnelId: editingFunnel.id,
                updates: {
                    name: editingFunnel.name,
                    description: editingFunnel.description,
                    steps: editingFunnel.steps
                }
            });
            setIsEditDialogOpen(false);
            setEditingFunnel(null);
        } catch (error) {
            console.error("Failed to update funnel:", error);
        }
    };

    const handleDeleteFunnel = async (funnelId: string) => {
        try {
            await deleteFunnel(funnelId);
            if (expandedFunnelId === funnelId) {
                setExpandedFunnelId(null);
            }
            setDeletingFunnelId(null);
        } catch (error) {
            console.error("Failed to delete funnel:", error);
        }
    };

    const handleToggleFunnel = (funnelId: string) => {
        setExpandedFunnelId(expandedFunnelId === funnelId ? null : funnelId);
    };

    const resetNewFunnel = () => {
        setNewFunnel({
            name: '',
            description: '',
            steps: [
                { type: 'PAGE_VIEW' as const, target: '/', name: 'Landing Page' },
                { type: 'PAGE_VIEW' as const, target: '/signup', name: 'Sign Up Page' }
            ]
        });
    };

    const addStep = (isEditing = false) => {
        if (isEditing) {
            setEditingFunnel(prev => prev ? ({
                ...prev,
                steps: [...prev.steps, { type: 'PAGE_VIEW' as const, target: '', name: '' }]
            }) : prev);
        } else {
            setNewFunnel(prev => ({
                ...prev,
                steps: [...prev.steps, { type: 'PAGE_VIEW' as const, target: '', name: '' }]
            }));
        }
    };

    const removeStep = (index: number, isEditing = false) => {
        const funnel = isEditing ? editingFunnel : newFunnel;

        if (funnel && funnel.steps.length > 2) {
            if (isEditing) {
                setEditingFunnel(prev => prev ? ({
                    ...prev,
                    steps: prev.steps.filter((_, i) => i !== index)
                }) : prev);
            } else {
                setNewFunnel(prev => ({
                    ...prev,
                    steps: prev.steps.filter((_, i) => i !== index)
                }));
            }
        }
    };

    const updateStep = (index: number, field: keyof FunnelStep, value: string, isEditing = false) => {
        if (isEditing) {
            setEditingFunnel(prev => prev ? ({
                ...prev,
                steps: prev.steps.map((step, i) =>
                    i === index ? { ...step, [field]: value } : step
                )
            }) : prev);
        } else {
            setNewFunnel(prev => ({
                ...prev,
                steps: prev.steps.map((step, i) =>
                    i === index ? { ...step, [field]: value } : step
                )
            }));
        }
    };

    // Calculate summary stats from analytics data
    const summaryStats = useMemo(() => {
        if (!analyticsData?.data?.steps_analytics) {
            return {
                totalUsers: 0,
                overallConversion: 0,
                avgCompletionTime: 0,
                biggestDropoffRate: 0
            };
        }

        const steps = analyticsData.data.steps_analytics;
        const firstStep = steps[0];
        const lastStep = steps[steps.length - 1];

        return {
            totalUsers: firstStep?.users || 0,
            overallConversion: firstStep?.users > 0 ? ((lastStep?.users || 0) / firstStep.users) * 100 : 0,
            avgCompletionTime: analyticsData.data.avg_completion_time || 0,
            biggestDropoffRate: Math.max(...steps.map(step => step.dropoff_rate || 0))
        };
    }, [analyticsData]);

    const formatCompletionTime = (seconds: number) => {
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
        return `${Math.round(seconds / 3600)}h`;
    };

    const isLoading = funnelsLoading || isRefreshing;

    // Remove unused variables
    const showAnalytics = (funnel: Funnel) => expandedFunnelId === funnel.id && analyticsData;

    if (funnelsError) {
        return (
            <div className="p-6 max-w-[1600px] mx-auto">
                <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 rounded">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <TrendingDown className="h-5 w-5 text-red-600" />
                            <p className="text-red-600 font-medium">Error loading funnel data</p>
                        </div>
                        <p className="text-red-600/80 text-sm mt-2">{funnelsError.message}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-3 sm:p-4 lg:p-6 max-w-[1600px] mx-auto space-y-6">
            {/* Header */}
            <div className="border-b bg-gradient-to-r from-background via-background to-muted/20 -mx-3 sm:-mx-4 lg:-mx-6 px-3 sm:px-4 lg:px-6 pb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                                <Target className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Conversion Funnels</h1>
                                <p className="text-muted-foreground text-sm sm:text-base">
                                    Track user journeys and optimize conversion drop-off points
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            variant="outline"
                            size="default"
                            className="gap-2 rounded-lg px-4 py-2 font-medium border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
                        >
                            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            Refresh Data
                        </Button>
                        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    size="default"
                                    className={cn(
                                        "gap-2 px-6 py-3 font-medium rounded-lg",
                                        "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary",
                                        "transition-all duration-300 group relative overflow-hidden"
                                    )}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                                    <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300 relative z-10" />
                                    <span className="relative z-10">Create Funnel</span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto rounded-xl">
                                <DialogHeader className="space-y-3 pb-6 border-b border-border/50">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                                            <Target className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <DialogTitle className="text-xl font-semibold text-foreground">Create New Funnel</DialogTitle>
                                            <DialogDescription className="text-muted-foreground mt-1">
                                                Define a series of steps to track user conversion through your website
                                            </DialogDescription>
                                        </div>
                                    </div>
                                </DialogHeader>
                                <div className="space-y-6 pt-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-sm font-medium text-foreground">Funnel Name</Label>
                                            <Input
                                                id="name"
                                                value={newFunnel.name}
                                                onChange={(e) => setNewFunnel(prev => ({ ...prev, name: e.target.value }))}
                                                placeholder="e.g., Sign Up Flow"
                                                className="rounded-lg border-border/50 focus:border-primary/50 focus:ring-primary/20"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="description" className="text-sm font-medium text-foreground">Description</Label>
                                            <Input
                                                id="description"
                                                value={newFunnel.description}
                                                onChange={(e) => setNewFunnel(prev => ({ ...prev, description: e.target.value }))}
                                                placeholder="Optional description"
                                                className="rounded-lg border-border/50 focus:border-primary/50 focus:ring-primary/20"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <BarChart3 className="h-5 w-5 text-primary" />
                                            <Label className="text-base font-semibold text-foreground">Funnel Steps</Label>
                                        </div>
                                        <div className="space-y-4">
                                            {newFunnel.steps.map((step, index) => (
                                                <div key={index} className="flex items-center gap-4 p-4 border rounded-xl hover:shadow-sm transition-all duration-200">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-2 border-primary/20 flex items-center justify-center text-sm font-semibold shadow-sm">
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                                                        <Select
                                                            value={step.type}
                                                            onValueChange={(value) => updateStep(index, 'type', value)}
                                                        >
                                                            <SelectTrigger className="rounded-lg border-border/50 focus:border-primary/50">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent className="rounded-lg">
                                                                <SelectItem value="PAGE_VIEW">Page View</SelectItem>
                                                                <SelectItem value="EVENT">Event</SelectItem>
                                                                <SelectItem value="CUSTOM">Custom</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <Input
                                                            placeholder={step.type === 'PAGE_VIEW' ? '/page-path' : 'event_name'}
                                                            value={step.target}
                                                            onChange={(e) => updateStep(index, 'target', e.target.value)}
                                                            className="rounded-lg border-border/50 focus:border-primary/50 focus:ring-primary/20"
                                                        />
                                                        <Input
                                                            placeholder="Step name"
                                                            value={step.name}
                                                            onChange={(e) => updateStep(index, 'name', e.target.value)}
                                                            className="rounded-lg border-border/50 focus:border-primary/50 focus:ring-primary/20"
                                                        />
                                                    </div>
                                                    {newFunnel.steps.length > 2 && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => removeStep(index)}
                                                            className="rounded-lg h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="default"
                                            className="rounded-lg border-dashed border-2 border-primary/30 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 group"
                                            onClick={() => addStep()}
                                            disabled={newFunnel.steps.length >= 10}
                                        >
                                            <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                                            Add Step
                                        </Button>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setIsCreateDialogOpen(false)}
                                            className="rounded"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleCreateFunnel}
                                            disabled={!newFunnel.name || newFunnel.steps.some(s => !s.name || !s.target) || isCreating}
                                            className="rounded"
                                        >
                                            {isCreating ? 'Creating...' : 'Create Funnel'}
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>

            {/* Funnels Grid with Expandable Analytics */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Your Funnels</h2>
                    <div className="text-sm text-muted-foreground">
                        {funnels.length} funnel{funnels.length !== 1 ? 's' : ''}
                    </div>
                </div>

                {funnelsLoading ? (
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <Card key={i} className="animate-pulse rounded-xl">
                                <CardHeader className="pb-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-center gap-3">
                                                <div className="h-6 bg-muted rounded-lg w-48"></div>
                                                <div className="h-4 w-4 bg-muted rounded"></div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="h-5 bg-muted rounded-full w-16"></div>
                                                <div className="h-4 bg-muted rounded w-20"></div>
                                            </div>
                                        </div>
                                        <div className="h-8 w-8 bg-muted rounded"></div>
                                    </div>
                                    <div className="mt-4 space-y-3">
                                        <div className="h-4 bg-muted rounded w-2/3"></div>
                                        <div className="bg-muted/50 rounded-lg p-3">
                                            <div className="h-3 bg-muted rounded w-24 mb-2"></div>
                                            <div className="flex gap-2">
                                                <div className="h-8 bg-muted rounded-lg w-32"></div>
                                                <div className="h-4 w-4 bg-muted rounded"></div>
                                                <div className="h-8 bg-muted rounded-lg w-28"></div>
                                                <div className="h-4 w-4 bg-muted rounded"></div>
                                                <div className="h-8 bg-muted rounded-lg w-36"></div>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                ) : funnels.length === 0 ? (
                    <Card className="border-dashed border-2 rounded-xl bg-gradient-to-br from-background to-muted/20">
                        <CardContent className="flex flex-col items-center justify-center py-16 px-8">
                            <div className="relative mb-8">
                                <div className="p-6 rounded-full bg-primary/10 border-2 border-primary/20">
                                    <Target className="h-16 w-16 text-primary" />
                                </div>
                                <div className="absolute -top-2 -right-2 p-2 rounded-full bg-background border-2 border-primary/20 shadow-sm">
                                    <Plus className="h-6 w-6 text-primary" />
                                </div>
                            </div>
                            <div className="text-center space-y-4 max-w-md">
                                <h3 className="text-2xl font-semibold text-foreground">No funnels yet</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Create your first funnel to start tracking user conversion journeys and identify optimization opportunities in your user flow.
                                </p>
                                <div className="pt-2">
                                    <Button
                                        onClick={() => setIsCreateDialogOpen(true)}
                                        size="lg"
                                        className={cn(
                                            "gap-2 px-8 py-4 font-medium text-base rounded-lg",
                                            "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary",
                                            "transition-all duration-300 group relative overflow-hidden"
                                        )}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                                        <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300 relative z-10" />
                                        <span className="relative z-10">Create Your First Funnel</span>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {funnels.map((funnel) => {
                            const isExpanded = expandedFunnelId === funnel.id;
                            const hasAnalytics = showAnalytics(funnel);

                            return (
                                <Card
                                    key={funnel.id}
                                    className={`group transition-all duration-300 ${isExpanded ? 'shadow-lg border-primary/20 bg-gradient-to-br from-background to-muted/10' : 'hover:shadow-md hover:border-primary/10'} rounded-xl cursor-pointer overflow-hidden`}
                                    onClick={() => handleToggleFunnel(funnel.id)}
                                >
                                    {/* Funnel Header - Always Visible */}
                                    <CardHeader className="pb-4">
                                        <div className="flex items-start justify-between">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                                        <CardTitle className="text-xl font-semibold leading-6 truncate text-foreground">
                                                            {funnel.name}
                                                        </CardTitle>
                                                        <ChevronDown className={`h-5 w-5 text-muted-foreground transition-all duration-300 flex-shrink-0 ${isExpanded ? 'rotate-180 text-primary' : 'group-hover:text-foreground'}`} />
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <Badge
                                                        variant={funnel.isActive ? "default" : "secondary"}
                                                        className={`text-xs font-medium ${funnel.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}`}
                                                    >
                                                        {funnel.isActive ? (
                                                            <>
                                                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                                                Active
                                                            </>
                                                        ) : (
                                                            <>
                                                                <XCircle className="h-3 w-3 mr-1" />
                                                                Inactive
                                                            </>
                                                        )}
                                                    </Badge>
                                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                        <BarChart3 className="h-3 w-3" />
                                                        <span>{funnel.steps.length} steps</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions Dropdown - Simplified */}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0 rounded flex-shrink-0"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="rounded">
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingFunnel(funnel);
                                                            setIsEditDialogOpen(true);
                                                        }}
                                                        className="gap-2"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                        Edit Funnel
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setDeletingFunnelId(funnel.id);
                                                        }}
                                                        className="gap-2 text-destructive focus:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        Delete Funnel
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        {/* Description and Steps Flow */}
                                        <div className="mt-4 space-y-3">
                                            {funnel.description && (
                                                <p className="text-sm text-muted-foreground leading-relaxed">
                                                    {funnel.description}
                                                </p>
                                            )}

                                            {/* Steps Flow - Enhanced visualization */}
                                            <div className="bg-muted/30 rounded-lg p-3 border border-muted/50">
                                                <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-2">
                                                    <Target className="h-3 w-3" />
                                                    <span>Funnel Steps</span>
                                                </div>
                                                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                                                    {funnel.steps.map((step, index) => (
                                                        <div key={index} className="flex items-center gap-2 flex-shrink-0">
                                                            <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-2 shadow-sm">
                                                                <div className="w-5 h-5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center text-xs font-semibold">
                                                                    {index + 1}
                                                                </div>
                                                                <span className="text-sm font-medium text-foreground whitespace-nowrap" title={step.name}>
                                                                    {step.name}
                                                                </span>
                                                            </div>
                                                            {index < funnel.steps.length - 1 && (
                                                                <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>

                                    {/* Analytics Content */}
                                    {isExpanded && (
                                        <div className="border-t bg-gradient-to-b from-muted/5 to-muted/20 animate-in slide-in-from-top-2 duration-300">
                                            <CardContent className="pt-6 pb-6">
                                                {analyticsLoading ? (
                                                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                                        <div className="relative">
                                                            <div className="w-12 h-12 rounded-full border-4 border-muted"></div>
                                                            <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="font-medium text-foreground">Loading analytics...</p>
                                                            <p className="text-sm text-muted-foreground mt-1">Analyzing funnel performance</p>
                                                        </div>
                                                    </div>
                                                ) : analyticsError ? (
                                                    <div className="py-8">
                                                        <div className="flex flex-col items-center text-center space-y-3">
                                                            <div className="p-3 rounded-full bg-destructive/10 border border-destructive/20">
                                                                <TrendingDown className="h-6 w-6 text-destructive" />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-semibold text-destructive">Error loading analytics</h4>
                                                                <p className="text-muted-foreground text-sm mt-1">{analyticsError.message}</p>
                                                            </div>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => refetchAnalytics()}
                                                                className="gap-2 rounded"
                                                            >
                                                                <RefreshCw className="h-4 w-4" />
                                                                Retry
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : hasAnalytics ? (
                                                    <div className="space-y-8">
                                                        {/* Summary Stats */}
                                                        <div className="space-y-4">
                                                            <div className="flex items-center gap-2">
                                                                <BarChart3 className="h-5 w-5 text-primary" />
                                                                <h3 className="text-lg font-semibold text-foreground">Performance Overview</h3>
                                                            </div>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                                                <StatCard
                                                                    title="Users Entered"
                                                                    value={summaryStats.totalUsers.toLocaleString()}
                                                                    icon={Users}
                                                                    isLoading={analyticsLoading}
                                                                    description="Started the funnel journey"
                                                                />
                                                                <StatCard
                                                                    title="Overall Conversion"
                                                                    value={`${summaryStats.overallConversion.toFixed(1)}%`}
                                                                    icon={Target}
                                                                    isLoading={analyticsLoading}
                                                                    description="Completed entire funnel"
                                                                />
                                                                <StatCard
                                                                    title="Avg Completion Time"
                                                                    value={formatCompletionTime(summaryStats.avgCompletionTime)}
                                                                    icon={Clock}
                                                                    isLoading={analyticsLoading}
                                                                    description="Time to complete funnel"
                                                                />
                                                                <StatCard
                                                                    title="Biggest Drop-off Rate"
                                                                    value={`${summaryStats.biggestDropoffRate.toFixed(1)}%`}
                                                                    icon={TrendingDown}
                                                                    isLoading={analyticsLoading}
                                                                    description="Worst performing step"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Performance Insights */}
                                                        {(summaryStats.overallConversion < 10 || summaryStats.overallConversion > 50) && (
                                                            <div className="space-y-3">
                                                                {summaryStats.overallConversion < 10 && (
                                                                    <ClosableAlert
                                                                        id={`low-conversion-${funnel.id}`}
                                                                        title="Low Conversion Alert"
                                                                        description="This funnel has a low conversion rate. Consider optimizing steps with high drop-offs to improve user flow and increase conversions."
                                                                        icon={AlertTriangle}
                                                                        variant="warning"
                                                                    >
                                                                        <div className="flex justify-between items-center">
                                                                            <span className="text-xs font-medium">
                                                                                Current rate: {summaryStats.overallConversion.toFixed(1)}%
                                                                            </span>
                                                                            <Badge variant="destructive" className="text-xs">
                                                                                Needs attention
                                                                            </Badge>
                                                                        </div>
                                                                    </ClosableAlert>
                                                                )}

                                                                {summaryStats.overallConversion > 50 && (
                                                                    <ClosableAlert
                                                                        id={`high-performance-${funnel.id}`}
                                                                        title="High Performance Funnel"
                                                                        description="This funnel is performing excellently with a high conversion rate. Great work on optimizing the user experience!"
                                                                        icon={CheckCircle2}
                                                                        variant="success"
                                                                    >
                                                                        <div className="flex justify-between items-center">
                                                                            <span className="text-xs font-medium">
                                                                                Current rate: {summaryStats.overallConversion.toFixed(1)}%
                                                                            </span>
                                                                            <Badge variant="default" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                                                Excellent
                                                                            </Badge>
                                                                        </div>
                                                                    </ClosableAlert>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Funnel Flow Visualization */}
                                                        {analyticsData?.data?.steps_analytics && (
                                                            <div className="space-y-6">
                                                                <div className="flex items-center gap-2">
                                                                    <Target className="h-5 w-5 text-primary" />
                                                                    <h3 className="text-lg font-semibold text-foreground">Funnel Flow Analysis</h3>
                                                                </div>

                                                                {/* Funnel Steps */}
                                                                <div className="space-y-3">
                                                                    {analyticsData.data.steps_analytics.map((step, index) => {
                                                                        const isFirstStep = index === 0;
                                                                        const isLastStep = index === analyticsData.data.steps_analytics.length - 1;
                                                                        const conversionRate = step.conversion_rate || 0;
                                                                        const dropoffRate = step.dropoff_rate || 0;
                                                                        const displayStepNumber = index + 1;
                                                                        const progressPercentage = (step.users / summaryStats.totalUsers) * 100;

                                                                        return (
                                                                            <div key={step.step_number} className="relative">
                                                                                {/* Step Card */}
                                                                                <Card className="rounded-xl border-muted/30 bg-gradient-to-r from-background via-background to-muted/5 hover:shadow-md transition-all duration-300">
                                                                                    <CardContent className="p-6">
                                                                                        <div className="flex items-start gap-4">
                                                                                            {/* Step Number Circle */}
                                                                                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-2 border-primary/20 flex items-center justify-center font-bold text-sm shadow-lg">
                                                                                                {displayStepNumber}
                                                                                            </div>

                                                                                            {/* Step Content */}
                                                                                            <div className="flex-1 min-w-0 space-y-4">
                                                                                                {/* Header */}
                                                                                                <div className="flex items-start justify-between">
                                                                                                    <div className="min-w-0 flex-1">
                                                                                                        <h4 className="font-semibold text-lg text-foreground truncate mb-1">
                                                                                                            {step.step_name}
                                                                                                        </h4>
                                                                                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                                                                            <span>Step {displayStepNumber}</span>
                                                                                                            {step.avg_time_to_complete && step.avg_time_to_complete > 0 && (
                                                                                                                <div className="flex items-center gap-1">
                                                                                                                    <Clock className="h-3 w-3" />
                                                                                                                    <span>{formatCompletionTime(step.avg_time_to_complete)}</span>
                                                                                                                </div>
                                                                                                            )}
                                                                                                        </div>
                                                                                                    </div>
                                                                                                    <div className="text-right flex-shrink-0">
                                                                                                        <div className="font-bold text-2xl text-foreground">
                                                                                                            {step.users?.toLocaleString()}
                                                                                                        </div>
                                                                                                        <div className="text-sm text-muted-foreground">
                                                                                                            users ({progressPercentage.toFixed(1)}%)
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </div>

                                                                                                {/* Progress Bar */}
                                                                                                <div className="space-y-2">
                                                                                                    <div className="flex items-center justify-between text-sm">
                                                                                                        <span className="font-medium text-muted-foreground">Funnel Progress</span>
                                                                                                        <span className="font-semibold text-foreground">
                                                                                                            {progressPercentage.toFixed(1)}%
                                                                                                        </span>
                                                                                                    </div>
                                                                                                    <Progress
                                                                                                        value={progressPercentage}
                                                                                                        className="h-3 bg-muted/30"
                                                                                                    />
                                                                                                </div>

                                                                                                {/* Metrics */}
                                                                                                <div className="flex items-center justify-between">
                                                                                                    <div className="flex items-center gap-3">
                                                                                                        {isFirstStep ? (
                                                                                                            <Badge variant="outline" className="text-xs font-medium">
                                                                                                                <Users className="h-3 w-3 mr-1" />
                                                                                                                Entry Point
                                                                                                            </Badge>
                                                                                                        ) : (
                                                                                                            <Badge
                                                                                                                variant={conversionRate > 70 ? "default" : conversionRate > 40 ? "secondary" : "destructive"}
                                                                                                                className="text-xs font-medium"
                                                                                                            >
                                                                                                                {conversionRate.toFixed(1)}% conversion rate
                                                                                                            </Badge>
                                                                                                        )}
                                                                                                        {isLastStep && (
                                                                                                            <Badge variant="outline" className="text-xs font-medium bg-green-50 text-green-700 border-green-200">
                                                                                                                <Target className="h-3 w-3 mr-1" />
                                                                                                                Goal
                                                                                                            </Badge>
                                                                                                        )}
                                                                                                    </div>
                                                                                                    {dropoffRate > 0 && (
                                                                                                        <div className="flex items-center gap-1 text-sm text-red-600">
                                                                                                            <TrendingDown className="h-3 w-3" />
                                                                                                            <span className="font-medium">
                                                                                                                {step.dropoffs?.toLocaleString()} dropped ({dropoffRate.toFixed(1)}%)
                                                                                                            </span>
                                                                                                        </div>
                                                                                                    )}
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    </CardContent>
                                                                                </Card>

                                                                                {/* Flow Arrow */}
                                                                                {!isLastStep && (
                                                                                    <div className="flex justify-center py-3">
                                                                                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 border border-muted">
                                                                                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                                                                            <span className="text-xs text-muted-foreground font-medium">
                                                                                                {((analyticsData.data.steps_analytics[index + 1]?.users / step.users) * 100).toFixed(1)}% continue
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : null}
                                            </CardContent>
                                        </div>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deletingFunnelId} onOpenChange={() => setDeletingFunnelId(null)}>
                <AlertDialogContent className="rounded-xl border-border/50 bg-gradient-to-br from-background to-muted/10">
                    <AlertDialogHeader className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                                <Trash2 className="h-6 w-6 text-destructive" />
                            </div>
                            <div>
                                <AlertDialogTitle className="text-xl font-semibold text-foreground">Delete Funnel</AlertDialogTitle>
                                <AlertDialogDescription className="text-muted-foreground mt-1">
                                    Are you sure you want to delete this funnel? This action cannot be undone and will permanently remove all associated analytics data.
                                </AlertDialogDescription>
                            </div>
                        </div>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3 pt-6 border-t border-border/50">
                        <AlertDialogCancel className="rounded-lg px-6 py-2 font-medium border-border/50 hover:border-border hover:bg-muted/50 transition-all duration-300">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deletingFunnelId && handleDeleteFunnel(deletingFunnelId)}
                            className="rounded-lg px-6 py-2 font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                            Delete Funnel
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto rounded-xl">
                    <DialogHeader className="space-y-3 pb-6 border-b border-border/50">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                                <Edit className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-semibold text-foreground">Edit Funnel</DialogTitle>
                                <DialogDescription className="text-muted-foreground mt-1">
                                    Update funnel configuration and steps
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    {editingFunnel && (
                        <div className="space-y-6 pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-name" className="text-sm font-medium text-foreground">Funnel Name</Label>
                                    <Input
                                        id="edit-name"
                                        value={editingFunnel.name}
                                        onChange={(e) => setEditingFunnel(prev => prev ? ({ ...prev, name: e.target.value }) : prev)}
                                        placeholder="e.g., Sign Up Flow"
                                        className="rounded-lg border-border/50 focus:border-primary/50 focus:ring-primary/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-description" className="text-sm font-medium text-foreground">Description</Label>
                                    <Input
                                        id="edit-description"
                                        value={editingFunnel.description || ''}
                                        onChange={(e) => setEditingFunnel(prev => prev ? ({ ...prev, description: e.target.value }) : prev)}
                                        placeholder="Optional description"
                                        className="rounded-lg border-border/50 focus:border-primary/50 focus:ring-primary/20"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5 text-primary" />
                                    <Label className="text-base font-semibold text-foreground">Funnel Steps</Label>
                                </div>
                                <div className="space-y-4">
                                    {editingFunnel.steps.map((step, index) => (
                                        <div key={index} className="flex items-center gap-4 p-4 border rounded-xl hover:shadow-sm transition-all duration-200">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-2 border-primary/20 flex items-center justify-center text-sm font-semibold shadow-sm">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                                                <Select
                                                    value={step.type}
                                                    onValueChange={(value) => updateStep(index, 'type', value, true)}
                                                >
                                                    <SelectTrigger className="rounded-lg border-border/50 focus:border-primary/50">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-lg">
                                                        <SelectItem value="PAGE_VIEW">Page View</SelectItem>
                                                        <SelectItem value="EVENT">Event</SelectItem>
                                                        <SelectItem value="CUSTOM">Custom</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Input
                                                    placeholder={step.type === 'PAGE_VIEW' ? '/page-path' : 'event_name'}
                                                    value={step.target}
                                                    onChange={(e) => updateStep(index, 'target', e.target.value, true)}
                                                    className="rounded-lg border-border/50 focus:border-primary/50 focus:ring-primary/20"
                                                />
                                                <Input
                                                    placeholder="Step name"
                                                    value={step.name}
                                                    onChange={(e) => updateStep(index, 'name', e.target.value, true)}
                                                    className="rounded-lg border-border/50 focus:border-primary/50 focus:ring-primary/20"
                                                />
                                            </div>
                                            {editingFunnel.steps.length > 2 && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => removeStep(index, true)}
                                                    className="rounded-lg h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="default"
                                    className="rounded-lg border-dashed border-2 border-primary/30 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 group"
                                    onClick={() => addStep(true)}
                                    disabled={editingFunnel.steps.length >= 10}
                                >
                                    <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                                    Add Step
                                </Button>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setIsEditDialogOpen(false);
                                        setEditingFunnel(null);
                                    }}
                                    className="rounded-lg px-6 py-2 font-medium border-border/50 hover:border-border hover:bg-muted/50 transition-all duration-300"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleUpdateFunnel}
                                    disabled={!editingFunnel.name || editingFunnel.steps.some(s => !s.name || !s.target) || isUpdating}
                                    className={cn(
                                        "rounded-lg px-6 py-2 font-medium",
                                        "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary",
                                        "shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden",
                                        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
                                    )}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                                    <span className="relative z-10">
                                        {isUpdating ? 'Updating...' : 'Update Funnel'}
                                    </span>
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
} 