"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal, Pencil, Trash2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateWebsiteName, deleteWebsite } from "./actions";
import { toast } from "sonner";

export function WebsiteActions({ website }: { website: { id: string; name: string | null } }) {
  const [loading, setLoading] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [name, setName] = useState(website.name || "");
  const [isDeletePending, startDeleteTransition] = useTransition();

  const handleEdit = async () => {
    if (!name.trim()) return;

    setLoading(true);
    try {
      await updateWebsiteName(website.id, name);
      toast.success("Website name updated");
      setShowEdit(false);
    } catch (error) {
      toast.error("Failed to update website name");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    startDeleteTransition(async () => {
      try {
        await deleteWebsite(website.id);
        toast.success("Website deleted");
        setShowDelete(false);
      } catch (error) {
        toast.error("Failed to delete website");
      }
    });
  };

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(website.id);
      toast.success("Website ID copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy website ID");
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" disabled={loading}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={handleCopyId}>
            <Copy className="mr-2 h-4 w-4" />
            Copy ID
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => { setName(website.name || ""); setShowEdit(true); }}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Name
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowDelete(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Website Name</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Website Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter website name"
                disabled={loading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={loading || !name.trim()}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete website?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete <strong>{website.name || "this website"}</strong>? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletePending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeletePending}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeletePending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 