import { CircleNotchIcon, SpinnerIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { Logo } from '../layout/logo';

export interface AuthLoadingProps {
  className?: string;
}

export function AuthLoading({ className }: AuthLoadingProps) {
  return (
    <div
      className={cn(
        'flex h-full flex-col items-center justify-center',
        className
      )}
    >
      <div className="flex flex-col items-center gap-4">
        <div style={{ transform: 'scale(2.5)' }}>
          <Logo />
        </div>
        <SpinnerIcon className="mt-6 animate-spin" size={32 * 1.5} />
      </div>
    </div>
  );
}
