import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  onRetry: () => void;
}

export function ErrorState({ onRetry }: ErrorStateProps) {
  return (
    <div className="p-6 text-center">
      <h1 className="mb-4 font-bold text-2xl">Websites</h1>
      <div className="flex flex-col items-center justify-center py-12">
        <p className="mb-4 text-muted-foreground">Failed to load websites. Please try again.</p>
        <Button onClick={onRetry}>Retry</Button>
      </div>
    </div>
  );
}
