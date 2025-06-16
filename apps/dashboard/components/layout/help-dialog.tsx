import { BookOpenIcon, ChatCircleIcon, LaptopIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface HelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HelpDialog({ open, onOpenChange }: HelpDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Help & Resources</DialogTitle>
          <DialogDescription>
            Get assistance and learn more about Databuddy
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-4">
          <Button variant="outline" className="justify-start text-left h-auto py-3">
            <div className="flex items-start gap-3">
              <BookOpenIcon size={32} weight="duotone" className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Documentation</h4>
                <span className="text-xs text-muted-foreground mt-1 block">Read guides and API references</span>
              </div>
            </div>
          </Button>
          <Button variant="outline" className="justify-start text-left h-auto py-3">
            <div className="flex items-start gap-3">
              <ChatCircleIcon size={32} weight="duotone" className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Contact Support</h4>
                <span className="text-xs text-muted-foreground mt-1 block">Get help from our support team</span>
              </div>
            </div>
          </Button>
          <Button variant="outline" className="justify-start text-left h-auto py-3">
            <div className="flex items-start gap-3">
              <LaptopIcon size={32} weight="duotone" className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Tutorials</h4>
                <span className="text-xs text-muted-foreground mt-1 block">Learn Databuddy step by step</span>
              </div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 