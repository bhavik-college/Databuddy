import type React from "react";
import { ExternalLink, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PERFORMANCE_THRESHOLDS } from "./analytics-helpers";

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
  description?: string;
}

export const MetricToggle: React.FC<MetricToggleProps> = ({
  id,
  label,
  checked,
  onChange,
  color,
  description
}) => {
  
  // Get proper hex values for the colors
  const getColorMap = (colorName: string) => {
    const colorMap: Record<string, string> = {
      'blue-500': '#3b82f6',
      'green-500': '#22c55e',
      'emerald-500': '#10b981',
      'yellow-500': '#eab308',
      'red-500': '#ef4444',
      'purple-500': '#a855f7',
      'pink-500': '#ec4899',
      'indigo-500': '#6366f1',
      'orange-500': '#f97316',
      'sky-500': '#0ea5e9',
    };
    
    return colorMap[colorName] || '#3b82f6'; // Default to blue if color not found
  };
  
  const colorHex = getColorMap(color);
  
  return (
    <button
      type="button"
      className={cn(
        "group flex items-center gap-2.5 px-3.5 py-2 rounded-lg transition-all duration-200 cursor-pointer border",
        checked 
          ? "bg-primary/5 border-primary/20 shadow-sm hover:bg-primary/10 hover:border-primary/30" 
          : "border-border/50 bg-transparent hover:bg-muted/30 hover:border-border"
      )}
      onClick={onChange}
      aria-pressed={checked}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onChange();
        }
      }}
    >
      <div 
        className={cn(
          "w-2.5 h-2.5 rounded-full transition-all duration-200", 
          checked ? "scale-100 shadow-sm" : "scale-75 opacity-50 group-hover:scale-90 group-hover:opacity-75"
        )}
        style={{ 
          backgroundColor: colorHex,
          boxShadow: checked ? `0 0 0 2px ${colorHex}20` : 'none'
        }}
      />
      <span className={cn(
        "text-sm font-medium transition-colors duration-200",
        checked ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
      )}>
        {label}
      </span>
    </button>
  );
};

interface MetricTogglesProps {
  metrics: Record<string, boolean>;
  onToggle: (metric: string) => void;
  colors: Record<string, string>;
  labels?: Record<string, string>;
  descriptions?: Record<string, string>;
}

export const MetricToggles: React.FC<MetricTogglesProps> = ({
  metrics,
  onToggle,
  colors,
  labels = {},
  descriptions = {},
}) => {
  const metricDescriptions = {
    pageviews: "Total number of pages viewed by visitors",
    visitors: "Number of unique users visiting your website",
    sessions: "A group of interactions within a time frame",
    bounce_rate: "Percentage of single-page sessions",
    avg_session_duration: "Average time spent during a session",
    ...descriptions
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {Object.keys(metrics).map(metric => (
        <MetricToggle
          key={metric}
          id={`metric-${metric}`}
          label={labels[metric] || metric.charAt(0).toUpperCase() + metric.slice(1).replace(/_/g, ' ')}
          checked={metrics[metric]}
          onChange={() => onToggle(metric)}
          color={colors[metric] || 'blue-500'}
          description={metricDescriptions[metric as keyof typeof metricDescriptions]}
        />
      ))}
    </div>
  );
};

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

// Tooltip for performance metrics
export const MetricTooltip = ({ 
  metricKey, 
  label,
  children 
}: { 
  metricKey: keyof typeof PERFORMANCE_THRESHOLDS, 
  label?: string,
  children: React.ReactNode 
}) => {
  const threshold = PERFORMANCE_THRESHOLDS[metricKey];
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="w-full relative">
            {children}
            <HelpCircle className="h-3 w-3 absolute top-2 right-2 text-muted-foreground/50" />
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-background border text-foreground p-3 shadow-lg max-w-[300px] space-y-2">
          <div className="font-medium text-xs">{label || String(metricKey).replace(/_/g, ' ')}</div>
          <div className="text-xs space-y-1">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1.5" />
              <span>Good: &lt; {threshold.good}{threshold.unit}</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1.5" />
              <span>Needs improvement: {threshold.good}{threshold.unit} - {threshold.average}{threshold.unit}</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-1.5" />
              <span>Poor: &gt; {threshold.average}{threshold.unit}</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}; 