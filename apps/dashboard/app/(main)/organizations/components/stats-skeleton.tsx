import { Skeleton } from '@/components/ui/skeleton';

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Skeleton className="h-[88px] w-full rounded" />
      <Skeleton className="h-[88px] w-full rounded" />
      <Skeleton className="h-[88px] w-full rounded" />
    </div>
  );
}
