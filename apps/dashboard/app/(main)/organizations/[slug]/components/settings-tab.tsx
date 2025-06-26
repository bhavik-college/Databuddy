"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
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
    GearIcon,
    ImageIcon,
    TrashIcon,
    WarningIcon,
    FloppyDiskIcon
} from "@phosphor-icons/react";
import { useOrganizations } from "@/hooks/use-organizations";
import { toast } from "sonner";
import { TransferAssets } from "./transfer-assets";
import { OrganizationLogoUploader } from "./organization-logo-uploader";

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
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    };

    const handleSlugChange = (value: string) => {
        setSlug(cleanSlug(value));
    };

    const handleSave = () => {
        if (!name.trim() || !slug.trim()) {
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
                }
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

    const hasChanges =
        name !== organization.name ||
        slug !== organization.slug;

    return (
        <div className="space-y-8">
            {/* Organization Settings */}
            <div className="p-6 rounded border border-border/50 bg-muted/30">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <GearIcon size={16} weight="duotone" className="h-5 w-5" />
                    Organization Settings
                </h3>

                <div className="space-y-6">
                    {/* Logo Section */}
                    <OrganizationLogoUploader organization={organization} />

                    {/* Name */}
                    <div className="space-y-2">
                        <Label htmlFor="org-name">Organization Name</Label>
                        <Input
                            id="org-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="My Organization"
                            className="rounded"
                        />
                    </div>

                    {/* Slug */}
                    <div className="space-y-2">
                        <Label htmlFor="org-slug">Organization Slug</Label>
                        <Input
                            id="org-slug"
                            value={slug}
                            onChange={(e) => handleSlugChange(e.target.value)}
                            placeholder="my-organization"
                            className="rounded font-mono"
                        />
                        <p className="text-xs text-muted-foreground">
                            This will be used in your organization URL: /organizations/{slug || "your-slug"}
                        </p>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end pt-4">
                        <Button
                            onClick={handleSave}
                            disabled={!hasChanges || isSaving}
                            className="rounded"
                        >
                            {isSaving ? (
                                <>
                                    <div className="w-3 h-3 rounded-full border border-primary-foreground/30 border-t-primary-foreground animate-spin mr-2" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <FloppyDiskIcon size={16} className="h-4 w-4 mr-2" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="p-6 rounded border border-destructive/20 bg-destructive/5">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-destructive">
                    <WarningIcon size={16} weight="duotone" className="h-5 w-5" />
                    Danger Zone
                </h3>

                <div className="space-y-6">
                    <TransferAssets organizationId={organization.id} />

                    <div>
                        <h4 className="font-medium mb-2">Delete Organization</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                            Permanently delete this organization and all associated data. This action cannot be undone.
                            All team members will lose access and any shared resources will be removed.
                        </p>
                        <Button
                            variant="destructive"
                            onClick={() => setShowDeleteDialog(true)}
                            className="rounded"
                        >
                            <TrashIcon size={16} className="h-4 w-4 mr-2" />
                            Delete Organization
                        </Button>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <WarningIcon size={16} weight="duotone" className="h-5 w-5" />
                            Delete Organization
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <strong>{organization.name}</strong>?
                            <br /><br />
                            This action will:
                            <ul className="list-disc list-inside mt-2 space-y-1">
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
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? (
                                <>
                                    <div className="w-3 h-3 rounded-full border border-destructive-foreground/30 border-t-destructive-foreground animate-spin mr-2" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <TrashIcon size={16} className="h-4 w-4 mr-2" />
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