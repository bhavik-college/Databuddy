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
    CaretRightIcon,
    FunnelIcon
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
            className={`group transition-all duration-200 ${isExpanded
                ? 'shadow-lg border-primary/30 bg-gradient-to-r from-background to-primary/5'
                : 'hover:shadow-md hover:border-border'
                } rounded cursor-pointer`}
            onClick={() => onToggle(funnel.id)}
        >
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    {/* Left side - Main info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                            <CardTitle className="text-lg font-semibold text-foreground truncate">
                                {funnel.name}
                            </CardTitle>
                            <CaretDownIcon
                                size={16}
                                weight="fill"
                                className={`h-4 w-4 text-muted-foreground transition-transform duration-200 flex-shrink-0 ${isExpanded ? 'rotate-180 text-primary' : ''
                                    }`}
                            />
                        </div>

                        <div className="flex items-center gap-4">
                            <Badge
                                variant={funnel.isActive ? "default" : "secondary"}
                                className="text-xs"
                            >
                                <CheckCircleIcon size={12} className="mr-1" />
                                {funnel.isActive ? 'Active' : 'Inactive'}
                            </Badge>

                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <ChartBarIcon size={14} />
                                <span>{funnel.steps.length} steps</span>
                            </div>

                            {funnel.filters && funnel.filters.length > 0 && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <FunnelIcon size={14} />
                                    <span>{funnel.filters.length} filter{funnel.filters.length !== 1 ? 's' : ''}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right side - Actions */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 rounded"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <DotsThreeIcon size={16} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded">
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(funnel);
                                }}
                            >
                                <PencilIcon size={16} className="mr-2" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(funnel.id);
                                }}
                                className="text-destructive focus:text-destructive"
                            >
                                <TrashIcon size={16} className="mr-2" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Description */}
                {funnel.description && (
                    <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                        {funnel.description}
                    </p>
                )}

                {/* Steps preview */}
                <div className="mt-4">
                    <div className="flex items-center gap-2 mb-3">
                        <TargetIcon size={16} className="text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">Steps</span>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto">
                        {funnel.steps.map((step, index) => (
                            <div key={index} className="flex items-center gap-2 flex-shrink-0">
                                <div className="flex items-center gap-2 bg-muted/50 rounded px-3 py-1.5 border">
                                    <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                                        {index + 1}
                                    </div>
                                    <span className="text-sm font-medium whitespace-nowrap max-w-32 truncate" title={step.name}>
                                        {step.name}
                                    </span>
                                </div>
                                {index < funnel.steps.length - 1 && (
                                    <CaretRightIcon size={14} className="text-muted-foreground flex-shrink-0" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Filters preview */}
                {funnel.filters && funnel.filters.length > 0 && (
                    <div className="mt-4">
                        <div className="flex items-center gap-2 mb-3">
                            <FunnelIcon size={16} className="text-muted-foreground" />
                            <span className="text-sm font-medium text-muted-foreground">Filters</span>
                        </div>

                        <div className="flex items-center gap-2 overflow-x-auto">
                            {funnel.filters.map((filter, index) => {
                                const getFieldLabel = (field: string) => {
                                    const fieldMap: Record<string, string> = {
                                        'browser_name': 'Browser',
                                        'os_name': 'OS',
                                        'country': 'Country',
                                        'device_type': 'Device',
                                        'utm_source': 'UTM Source',
                                        'utm_medium': 'UTM Medium',
                                        'utm_campaign': 'UTM Campaign',
                                    };
                                    return fieldMap[field] || field;
                                };

                                const getOperatorSymbol = (operator: string) => {
                                    const operatorMap: Record<string, string> = {
                                        'equals': '=',
                                        'contains': '⊃',
                                        'not_equals': '≠',
                                        'in': '∈',
                                        'not_in': '∉',
                                    };
                                    return operatorMap[operator] || operator;
                                };

                                return (
                                    <div key={index} className="flex items-center gap-1 bg-muted/30 border rounded px-2 py-1 flex-shrink-0">
                                        <span className="text-xs font-medium text-foreground">
                                            {getFieldLabel(filter.field)}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {getOperatorSymbol(filter.operator)}
                                        </span>
                                        <span className="text-xs font-medium text-foreground max-w-20 truncate" title={filter.value as string}>
                                            {filter.value}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </CardHeader>

            {isExpanded && (
                <div className="border-t">
                    <CardContent className="pt-6">
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