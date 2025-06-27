"use client";

import { BuildingsIcon, UsersIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useOrganizations } from "@/hooks/use-organizations";

interface CreateOrganizationData {
  name: string;
  slug: string;
  logo: string;
  metadata: Record<string, any>;
}

interface CreateOrganizationDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateOrganizationDialog({ isOpen, onClose }: CreateOrganizationDialogProps) {
  const { createOrganization, isCreatingOrganization } = useOrganizations();
  const router = useRouter();

  const [formData, setFormData] = useState<CreateOrganizationData>({
    name: "",
    slug: "",
    logo: "",
    metadata: {},
  });

  // Auto-generate slug from name
  useEffect(() => {
    if (formData.name && !formData.slug) {
      const generatedSlug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      setFormData((prev: CreateOrganizationData) => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.name, formData.slug]);

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      logo: "",
      metadata: {},
    });
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  const handleSubmit = async () => {
    if (!isFormValid) return;

    try {
      createOrganization(formData);
      handleClose();
      // Navigate to organizations page after creation
      router.push("/organizations");
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  // Form validation
  const isFormValid = useMemo(() => {
    return (
      formData.name.trim().length >= 2 &&
      (formData.slug || "").trim().length >= 2 &&
      /^[a-z0-9-]+$/.test(formData.slug || "")
    );
  }, [formData.name, formData.slug]);

  const handleSlugChange = (value: string) => {
    // Only allow lowercase letters, numbers, and hyphens
    const cleanSlug = value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-");
    setFormData((prev: CreateOrganizationData) => ({ ...prev, slug: cleanSlug }));
  };

  return (
    <Sheet onOpenChange={handleClose} open={isOpen}>
      <SheetContent
        className="w-[40vw] overflow-y-auto p-6"
        side="right"
        style={{ maxWidth: "600px", minWidth: "500px" }}
      >
        <SheetHeader className="space-y-3 border-border/50 border-b pb-6">
          <div className="flex items-center gap-3">
            <div className="rounded border border-primary/20 bg-primary/10 p-3">
              <BuildingsIcon className="h-6 w-6 text-primary" size={16} weight="duotone" />
            </div>
            <div>
              <SheetTitle className="font-semibold text-foreground text-xl">
                Create New Organization
              </SheetTitle>
              <SheetDescription className="mt-1 text-muted-foreground">
                Set up a new organization to collaborate with your team
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 pt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-medium text-foreground text-sm" htmlFor="org-name">
                Organization Name *
              </Label>
              <Input
                className="rounded border-border/50 focus:border-primary/50 focus:ring-primary/20"
                id="org-name"
                maxLength={100}
                onChange={(e) =>
                  setFormData((prev: CreateOrganizationData) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., Acme Corporation"
                value={formData.name}
              />
              <p className="text-muted-foreground text-xs">
                This is the display name for your organization
              </p>
            </div>

            <div className="space-y-2">
              <Label className="font-medium text-foreground text-sm" htmlFor="org-slug">
                Organization Slug *
              </Label>
              <Input
                className="rounded border-border/50 focus:border-primary/50 focus:ring-primary/20"
                id="org-slug"
                maxLength={50}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="e.g., acme-corp"
                value={formData.slug}
              />
              <p className="text-muted-foreground text-xs">
                Used in URLs and must be unique. Only lowercase letters, numbers, and hyphens
                allowed.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="font-medium text-foreground text-sm" htmlFor="org-logo">
                Logo URL
                <span className="font-normal text-muted-foreground"> (optional)</span>
              </Label>
              <Input
                className="rounded border-border/50 focus:border-primary/50 focus:ring-primary/20"
                id="org-logo"
                onChange={(e) =>
                  setFormData((prev: CreateOrganizationData) => ({ ...prev, logo: e.target.value }))
                }
                placeholder="https://example.com/logo.png"
                type="url"
                value={formData.logo || ""}
              />
              <p className="text-muted-foreground text-xs">URL to your organization's logo image</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5 text-primary" size={16} weight="duotone" />
              <Label className="font-semibold text-base text-foreground">Getting Started</Label>
            </div>
            <div className="rounded border border-border/50 bg-muted/30 p-4">
              <p className="text-muted-foreground text-sm">
                After creating your organization, you'll be able to:
              </p>
              <ul className="mt-2 space-y-1 text-muted-foreground text-sm">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-primary">•</span>
                  Invite team members with different roles
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-primary">•</span>
                  Share websites and analytics data
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-primary">•</span>
                  Manage organization settings and permissions
                </li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-border/50 border-t pt-6">
            <Button
              className="rounded"
              disabled={isCreatingOrganization}
              onClick={handleClose}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              className="relative rounded"
              disabled={!isFormValid || isCreatingOrganization}
              onClick={handleSubmit}
            >
              {isCreatingOrganization && (
                <div className="absolute left-3">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                </div>
              )}
              <span className={isCreatingOrganization ? "ml-6" : ""}>
                {isCreatingOrganization ? "Creating..." : "Create Organization"}
              </span>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
