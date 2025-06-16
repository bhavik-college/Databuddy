import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  onRetry: () => void;
}

export function ErrorState({ onRetry }: ErrorStateProps) {
  return (
    <div className="p-6 text-center">
      <h1 className="text-2xl font-bold mb-4">Websites</h1>
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground mb-4">
          Failed to load websites. Please try again.
        </p>
        <Button onClick={onRetry}>Retry</Button>
      </div>
    </div>
  );
} 