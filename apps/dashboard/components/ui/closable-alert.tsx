"use client";

import { useState } from "react";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ClosableAlertProps {
    id: string;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    variant?: "warning" | "error" | "success" | "info";
    className?: string;
    children?: React.ReactNode;
    onClose?: (id: string) => void;
}

export function ClosableAlert({
    id,
    title,
    description,
    icon: Icon,
    variant = "info",
    className,
    children,
    onClose,
}: ClosableAlertProps) {
    const [isVisible, setIsVisible] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);

    const handleClose = () => {
        setIsVisible(false);
        onClose?.(id);
    };

    if (!isVisible) return null;

    // Only use color for critical errors
    const isError = variant === "error";

    return (
        <div
            className={cn(
                "rounded border bg-muted/50 transition-all duration-200",
                isError && "border-destructive/20 bg-destructive/5",
                className
            )}
        >
            {/* Header - always visible */}
            <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Icon className={cn(
                        "h-4 w-4 flex-shrink-0",
                        isError ? "text-destructive" : "text-muted-foreground"
                    )} />
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium">{title}</h4>
                        {!isExpanded && (
                            <p className="text-xs text-muted-foreground truncate">
                                {description}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1 ml-2">
                    {children && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 rounded"
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            {isExpanded ? (
                                <ChevronUp className="h-3 w-3" />
                            ) : (
                                <ChevronDown className="h-3 w-3" />
                            )}
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 rounded"
                        onClick={handleClose}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            </div>

            {/* Expandable content */}
            {isExpanded && (
                <div className="px-3 pb-3 border-t border-border/50">
                    <div className="pt-3 space-y-2">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            {description}
                        </p>
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
} 