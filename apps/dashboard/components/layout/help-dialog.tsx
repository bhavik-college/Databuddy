import {
  BookOpenIcon,
  ChatCircleIcon,
  LaptopIcon,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface HelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HelpDialog({ open, onOpenChange }: HelpDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Help & Resources</DialogTitle>
          <DialogDescription>
            Get assistance and learn more about Databuddy
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-4">
          <Button
            className="h-auto justify-start py-3 text-left"
            variant="outline"
          >
            <div className="flex items-start gap-3">
              <BookOpenIcon
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary"
                size={32}
                weight="duotone"
              />
              <div>
                <h4 className="font-medium text-sm">Documentation</h4>
                <span className="mt-1 block text-muted-foreground text-xs">
                  Read guides and API references
                </span>
              </div>
            </div>
          </Button>
          <Button
            className="h-auto justify-start py-3 text-left"
            variant="outline"
          >
            <div className="flex items-start gap-3">
              <ChatCircleIcon
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary"
                size={32}
                weight="duotone"
              />
              <div>
                <h4 className="font-medium text-sm">Contact Support</h4>
                <span className="mt-1 block text-muted-foreground text-xs">
                  Get help from our support team
                </span>
              </div>
            </div>
          </Button>
          <Button
            className="h-auto justify-start py-3 text-left"
            variant="outline"
          >
            <div className="flex items-start gap-3">
              <LaptopIcon
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary"
                size={32}
                weight="duotone"
              />
              <div>
                <h4 className="font-medium text-sm">Tutorials</h4>
                <span className="mt-1 block text-muted-foreground text-xs">
                  Learn Databuddy step by step
                </span>
              </div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
