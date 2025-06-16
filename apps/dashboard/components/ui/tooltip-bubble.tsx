import type React from 'react';
import { cn } from '@/lib/utils';

interface TooltipBubbleProps {
  children: React.ReactNode;
  className?: string;
}

export const TooltipBubble: React.FC<TooltipBubbleProps> = ({ children, className }) => {
  return (
    <div
      className={cn(
        'min-w-[150px] p-2 bg-background/80 backdrop-blur-lg rounded-lg shadow-xl border border-border/20 transition-all duration-100',
        className
      )}
    >
      {children}
    </div>
  );
}; 