"use client";

import {
  CaretDownIcon,
  CaretRightIcon,
  ChartBarIcon,
  CheckCircleIcon,
  DotsThreeIcon,
  FunnelIcon,
  PencilIcon,
  TargetIcon,
  TrashIcon,
  XCircleIcon,
} from "@phosphor-icons/react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  children,
}: FunnelCardProps) {
  return (
    <Card
      className={`group transition-all duration-200 ${
        isExpanded
          ? "border-primary/30 bg-gradient-to-r from-background to-primary/5 shadow-lg"
          : "hover:border-border hover:shadow-md"
      } cursor-pointer rounded`}
      onClick={() => onToggle(funnel.id)}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          {/* Left side - Main info */}
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-3">
              <CardTitle className="truncate font-semibold text-foreground text-lg">
                {funnel.name}
              </CardTitle>
              <CaretDownIcon
                className={`h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform duration-200 ${
                  isExpanded ? "rotate-180 text-primary" : ""
                }`}
                size={16}
                weight="fill"
              />
            </div>

            <div className="flex items-center gap-4">
              <Badge className="text-xs" variant={funnel.isActive ? "default" : "secondary"}>
                <CheckCircleIcon className="mr-1" size={12} />
                {funnel.isActive ? "Active" : "Inactive"}
              </Badge>

              <div className="flex items-center gap-1 text-muted-foreground text-sm">
                <ChartBarIcon size={14} />
                <span>{funnel.steps?.length || 0} steps</span>
              </div>

              {funnel.filters && funnel.filters.length > 0 && (
                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                  <FunnelIcon size={14} />
                  <span>
                    {funnel.filters.length} filter{funnel.filters.length !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right side - Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="h-8 w-8 rounded p-0"
                onClick={(e) => e.stopPropagation()}
                size="sm"
                variant="ghost"
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
                <PencilIcon className="mr-2" size={16} />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(funnel.id);
                }}
              >
                <TrashIcon className="mr-2" size={16} />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Description */}
        {funnel.description && (
          <p className="mt-3 text-muted-foreground text-sm leading-relaxed">{funnel.description}</p>
        )}

        {/* Steps preview */}
        <div className="mt-4">
          <div className="mb-3 flex items-center gap-2">
            <TargetIcon className="text-muted-foreground" size={16} />
            <span className="font-medium text-muted-foreground text-sm">Steps</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            {(funnel.steps || []).map((step, index) => (
              <div className="flex flex-shrink-0 items-center gap-2" key={index}>
                <div className="flex items-center gap-2 rounded border bg-muted/50 px-3 py-1.5">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground text-xs">
                    {index + 1}
                  </div>
                  <span
                    className="max-w-32 truncate whitespace-nowrap font-medium text-sm"
                    title={step?.name || "Unnamed Step"}
                  >
                    {step?.name || "Unnamed Step"}
                  </span>
                </div>
                {index < (funnel.steps?.length || 0) - 1 && (
                  <CaretRightIcon className="flex-shrink-0 text-muted-foreground" size={14} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Filters preview */}
        {funnel.filters && funnel.filters.length > 0 && (
          <div className="mt-4">
            <div className="mb-3 flex items-center gap-2">
              <FunnelIcon className="text-muted-foreground" size={16} />
              <span className="font-medium text-muted-foreground text-sm">Filters</span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
              {(funnel.filters || []).map((filter, index) => {
                const getFieldLabel = (field: string) => {
                  const fieldMap: Record<string, string> = {
                    browser_name: "Browser",
                    os_name: "OS",
                    country: "Country",
                    device_type: "Device",
                    utm_source: "UTM Source",
                    utm_medium: "UTM Medium",
                    utm_campaign: "UTM Campaign",
                  };
                  return fieldMap[field] || field;
                };

                const getOperatorSymbol = (operator: string) => {
                  const operatorMap: Record<string, string> = {
                    equals: "=",
                    contains: "⊃",
                    not_equals: "≠",
                    in: "∈",
                    not_in: "∉",
                  };
                  return operatorMap[operator] || operator;
                };

                return (
                  <div
                    className="flex flex-shrink-0 items-center gap-1 rounded border bg-muted/30 px-2 py-1"
                    key={index}
                  >
                    <span className="font-medium text-foreground text-xs">
                      {getFieldLabel(filter?.field || "unknown")}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {getOperatorSymbol(filter?.operator || "equals")}
                    </span>
                    <span
                      className="max-w-20 truncate font-medium text-foreground text-xs"
                      title={(filter?.value as string) || "No value"}
                    >
                      {filter?.value || "No value"}
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
                  <div className="h-6 w-6 rounded-full border-2 border-muted" />
                  <div className="absolute top-0 left-0 h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
                <div className="ml-3 text-muted-foreground text-sm">Loading analytics...</div>
              </div>
            )}
          </CardContent>
        </div>
      )}
    </Card>
  );
}
