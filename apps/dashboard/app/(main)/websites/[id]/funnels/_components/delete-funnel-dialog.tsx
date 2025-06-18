"use client";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { TrashIcon } from "@phosphor-icons/react";

interface DeleteFunnelDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export function DeleteFunnelDialog({ isOpen, onClose, onConfirm }: DeleteFunnelDialogProps) {
    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent className="rounded-xl border-border/50 bg-gradient-to-br from-background to-muted/10 animate-in fade-in-50 zoom-in-95 duration-300">
                <AlertDialogHeader className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                            <TrashIcon size={16} weight="duotone" className="h-6 w-6 text-destructive" />
                        </div>
                        <div>
                            <AlertDialogTitle className="text-xl font-semibold text-foreground">Delete Funnel</AlertDialogTitle>
                            <AlertDialogDescription className="text-muted-foreground mt-1">
                                Are you sure you want to delete this funnel? This action cannot be undone and will permanently remove it
                            </AlertDialogDescription>
                        </div>
                    </div>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-3 pt-6 border-t border-border/50">
                    <AlertDialogCancel className="rounded-lg px-6 py-2 font-medium border-border/50 hover:border-border hover:bg-muted/50 transition-all duration-300">
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className="rounded-lg px-6 py-2 font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                        Delete Funnel
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
} 