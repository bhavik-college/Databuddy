"use client";

import { FloppyDiskIcon, GearIcon, ImageIcon, TrashIcon, WarningIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrganizations } from "@/hooks/use-organizations";
import { OrganizationLogoUploader } from "./organization-logo-uploader";
import { TransferAssets } from "./transfer-assets";

interface SettingsTabProps {
  organization: any;
}

export function SettingsTab({ organization }: SettingsTabProps) {
  const router = useRouter();
  const [name, setName] = useState(organization.name);
  const [slug, setSlug] = useState(organization.slug);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { updateOrganization, deleteOrganization } = useOrganizations();

  const getOrganizationInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const cleanSlug = (value: string) => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleSlugChange = (value: string) => {
    setSlug(cleanSlug(value));
  };

  const handleSave = () => {
    if (!(name.trim() && slug.trim())) {
      toast.error("Name and slug are required");
      return;
    }

    setIsSaving(true);
    try {
      updateOrganization({
        organizationId: organization.id,
        data: {
          name: name.trim(),
          slug: slug.trim(),
        },
      });

      toast.success("Organization updated successfully");

      // If slug changed, redirect to new URL
      if (slug !== organization.slug) {
        router.push(`/organizations/${slug}`);
      }
    } catch (error) {
      toast.error("Failed to update organization");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteOrganization(organization.id);
      toast.success("Organization deleted successfully");
      router.push("/organizations");
    } catch (error) {
      toast.error("Failed to delete organization");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const hasChanges = name !== organization.name || slug !== organization.slug;

  return (
    <div className="space-y-8">
      {/* Organization Settings */}
      <div className="rounded border border-border/50 bg-muted/30 p-6">
        <h3 className="mb-6 flex items-center gap-2 font-semibold text-lg">
          <GearIcon className="h-5 w-5" size={16} weight="duotone" />
          Organization Settings
        </h3>

        <div className="space-y-6">
          {/* Logo Section */}
          <OrganizationLogoUploader organization={organization} />

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="org-name">Organization Name</Label>
            <Input
              className="rounded"
              id="org-name"
              onChange={(e) => setName(e.target.value)}
              placeholder="My Organization"
              value={name}
            />
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <Label htmlFor="org-slug">Organization Slug</Label>
            <Input
              className="rounded font-mono"
              id="org-slug"
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="my-organization"
              value={slug}
            />
            <p className="text-muted-foreground text-xs">
              This will be used in your organization URL: /organizations/{slug || "your-slug"}
            </p>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <Button className="rounded" disabled={!hasChanges || isSaving} onClick={handleSave}>
              {isSaving ? (
                <>
                  <div className="mr-2 h-3 w-3 animate-spin rounded-full border border-primary-foreground/30 border-t-primary-foreground" />
                  Saving...
                </>
              ) : (
                <>
                  <FloppyDiskIcon className="mr-2 h-4 w-4" size={16} />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded border border-destructive/20 bg-destructive/5 p-6">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-destructive text-lg">
          <WarningIcon className="h-5 w-5" size={16} weight="duotone" />
          Danger Zone
        </h3>

        <div className="space-y-6">
          <TransferAssets organizationId={organization.id} />

          <div>
            <h4 className="mb-2 font-medium">Delete Organization</h4>
            <p className="mb-4 text-muted-foreground text-sm">
              Permanently delete this organization and all associated data. This action cannot be
              undone. All team members will lose access and any shared resources will be removed.
            </p>
            <Button
              className="rounded"
              onClick={() => setShowDeleteDialog(true)}
              variant="destructive"
            >
              <TrashIcon className="mr-2 h-4 w-4" size={16} />
              Delete Organization
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog onOpenChange={setShowDeleteDialog} open={showDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <WarningIcon className="h-5 w-5" size={16} weight="duotone" />
              Delete Organization
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{organization.name}</strong>?
              <br />
              <br />
              This action will:
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Permanently delete the organization</li>
                <li>Remove all team members</li>
                <li>Delete all shared resources</li>
                <li>Cancel all pending invitations</li>
              </ul>
              <br />
              <strong>This action cannot be undone.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={handleDelete}
            >
              {isDeleting ? (
                <>
                  <div className="mr-2 h-3 w-3 animate-spin rounded-full border border-destructive-foreground/30 border-t-destructive-foreground" />
                  Deleting...
                </>
              ) : (
                <>
                  <TrashIcon className="mr-2 h-4 w-4" size={16} />
                  Delete Organization
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
