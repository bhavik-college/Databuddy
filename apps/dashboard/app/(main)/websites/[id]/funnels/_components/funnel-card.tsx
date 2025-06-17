"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
    CheckCircleIcon,
    XCircleIcon,
    ChartBarIcon,
    CaretDownIcon,
    DotsThreeIcon,
    PencilIcon,
    TrashIcon,
    TargetIcon,
    CaretRightIcon
} from "@phosphor-icons/react";
import type { Funnel } from "@/hooks/use-funnels";

interface FunnelCardProps {
    funnel: Funnel;
    isExpanded: boolean;
    onToggle: (funnelId: string) => void;
    onEdit: (funnel: Funnel) => void;
    onDelete: (funnelId: string) => void;
    children?: React.ReactNode;
}

export function FunnelCard({
    funnel,
    isExpanded,
    onToggle,
    onEdit,
    onDelete,
    children
}: FunnelCardProps) {
    return (
        <Card
            className={`group transition-all duration-300 animate-in fade-in-50 slide-in-from-bottom-2 ${isExpanded
                ? 'shadow-lg border-primary/20 bg-gradient-to-br from-background to-muted/10 scale-[1.01]'
                : 'hover:shadow-md hover:border-primary/10 hover:scale-[1.005]'
                } rounded-xl cursor-pointer overflow-hidden`}
            onClick={() => onToggle(funnel.id)}
        >
            <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                <CardTitle className="text-xl font-semibold leading-6 truncate text-foreground">
                                    {funnel.name}
                                </CardTitle>
                                <CaretDownIcon
                                    size={16}
                                    weight="duotone"
                                    className={`h-5 w-5 text-muted-foreground transition-all duration-300 flex-shrink-0 ${isExpanded ? 'rotate-180 text-primary' : 'group-hover:text-foreground'
                                        }`}
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <Badge
                                variant={funnel.isActive ? "default" : "secondary"}
                                className={`text-xs font-medium ${funnel.isActive
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    : ''
                                    }`}
                            >
                                {funnel.isActive ? (
                                    <>
                                        <CheckCircleIcon size={16} weight="duotone" className="h-3 w-3 mr-1" />
                                        Active
                                    </>
                                ) : (
                                    <>
                                        <XCircleIcon size={16} weight="duotone" className="h-3 w-3 mr-1" />
                                        Inactive
                                    </>
                                )}
                            </Badge>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <ChartBarIcon size={16} weight="duotone" className="h-3 w-3" />
                                <span>{funnel.steps.length} steps</span>
                            </div>
                        </div>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 rounded flex-shrink-0"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <DotsThreeIcon size={16} weight="duotone" className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded w-8 p-1 space-y-0">
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(funnel);
                                }}
                                className="p-1 justify-center h-6 min-h-0"
                                title="Edit"
                            >
                                <PencilIcon size={16} weight="duotone" className="h-3 w-3" />
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(funnel.id);
                                }}
                                className="p-1 justify-center h-6 min-h-0 text-destructive focus:text-destructive"
                                title="Delete"
                            >
                                <TrashIcon size={16} weight="duotone" className="h-3 w-3" />
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="mt-4 space-y-3">
                    {funnel.description && (
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {funnel.description}
                        </p>
                    )}

                    <div className="bg-muted/30 rounded-lg p-3 border border-muted/50">
                        <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-2">
                            <TargetIcon size={16} weight="duotone" className="h-3 w-3" />
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
                                        <CaretRightIcon size={16} weight="duotone" className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </CardHeader>

            {isExpanded && (
                <div className="border-t bg-gradient-to-b from-muted/5 to-muted/20 animate-in slide-in-from-top-2 duration-500">
                    <CardContent className="pt-6 pb-6">
                        {children || (
                            <div className="flex items-center justify-center py-8">
                                <div className="relative">
                                    <div className="w-6 h-6 rounded-full border-2 border-muted"></div>
                                    <div className="absolute top-0 left-0 w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                                </div>
                                <div className="ml-3 text-sm text-muted-foreground">
                                    Loading analytics...
                                </div>
                            </div>
                        )}
                    </CardContent>
                </div>
            )}
        </Card>
    );
} 