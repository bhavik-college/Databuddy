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

const variantStyles = {
    warning: "border-l-orange-500 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800",
    error: "border-l-red-500 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800",
    success: "border-l-green-500 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800",
    info: "border-l-blue-500 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800",
};

const iconStyles = {
    warning: "text-orange-500",
    error: "text-red-500",
    success: "text-green-500",
    info: "text-blue-500",
};

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

    return (
        <div
            className={cn(
                "rounded border-l-4 transition-all duration-200",
                variantStyles[variant],
                className
            )}
        >
            {/* Header - always visible */}
            <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Icon className={cn("h-4 w-4 flex-shrink-0", iconStyles[variant])} />
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
                            className="h-6 w-6 p-0 hover:bg-black/5 dark:hover:bg-white/5 rounded"
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            {isExpanded ? (
                                <ChevronUp className="h-3 w-3 text-muted-foreground" />
                            ) : (
                                <ChevronDown className="h-3 w-3 text-muted-foreground" />
                            )}
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-black/5 dark:hover:bg-white/5 rounded"
                        onClick={handleClose}
                    >
                        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </Button>
                </div>
            </div>

            {/* Expandable content */}
            {isExpanded && (
                <div className="px-3 pb-3 border-t border-black/5 dark:border-white/5">
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