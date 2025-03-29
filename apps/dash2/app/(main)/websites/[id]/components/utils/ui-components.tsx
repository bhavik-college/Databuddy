import React from "react";
import { ExternalLink } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Consistent border radius values
export const BORDER_RADIUS = {
  sm: "rounded-md", // Small components like buttons
  md: "rounded-lg", // Cards, panels
  lg: "rounded-xl", // Large containers
  card: "rounded-2xl", // Standard card component
  container: "rounded-2xl", // Containers that hold cards
};

interface MetricToggleProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: () => void;
  color: string;
}

export const MetricToggle: React.FC<MetricToggleProps> = ({
  id,
  label,
  checked,
  onChange,
  color,
}) => (
  <div className="flex items-center space-x-2">
    <Checkbox 
      id={id} 
      checked={checked}
      onCheckedChange={onChange}
      className={`data-[state=checked]:bg-${color} data-[state=checked]:text-white`}
    />
    <Label htmlFor={id} className="text-xs cursor-pointer flex items-center gap-1">
      <div className={`w-3 h-3 rounded-full bg-${color}`}></div>
      {label}
    </Label>
  </div>
);

interface MetricTogglesProps {
  metrics: Record<string, boolean>;
  onToggle: (metric: string) => void;
  colors: Record<string, string>;
  labels?: Record<string, string>;
}

export const MetricToggles: React.FC<MetricTogglesProps> = ({
  metrics,
  onToggle,
  colors,
  labels = {},
}) => (
  <div className="flex items-center gap-3 flex-wrap">
    {Object.keys(metrics).map(metric => (
      <MetricToggle
        key={metric}
        id={`metric-${metric}`}
        label={labels[metric] || metric.charAt(0).toUpperCase() + metric.slice(1).replace(/_/g, ' ')}
        checked={metrics[metric]}
        onChange={() => onToggle(metric)}
        color={colors[metric] || 'blue-500'}
      />
    ))}
  </div>
);

interface ExternalLinkButtonProps {
  href: string;
  label: string;
  title?: string;
  className?: string;
  showTooltip?: boolean;
}

export const ExternalLinkButton: React.FC<ExternalLinkButtonProps> = ({
  href,
  label,
  title,
  className = "font-medium hover:text-primary hover:underline truncate max-w-[250px] flex items-center gap-1",
  showTooltip = true
}) => {
  const content = (
    <a 
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {label}
      <ExternalLink className="h-3 w-3 opacity-70" />
    </a>
  );

  if (!showTooltip) return content;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent className="bg-background border text-foreground p-2 shadow-lg text-xs dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100">
          {title || href}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}> = ({ icon, title, description, action }) => (
  <div className="h-64 flex items-center justify-center">
    <div className="text-center text-muted-foreground">
      <div className="mx-auto mb-2 opacity-30">{icon}</div>
      <p className="font-medium text-base mb-1">{title}</p>
      <p className="mb-3">{description}</p>
      {action}
    </div>
  </div>
); 