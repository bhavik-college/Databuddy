"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { Globe, Terminal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Website } from "@/hooks/use-websites";
import type { CreateWebsiteData } from "@/hooks/use-websites";
import { useWebsites } from "@/hooks/use-websites";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type VerifiedDomain = {
  id: string;
  name: string;
  verificationStatus: "PENDING" | "VERIFIED" | "FAILED";
};

const createFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  domainId: z.string().min(1, "Please select a verified domain"),
  subdomain: z.string().optional(),
});

const editFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

type CreateFormData = z.infer<typeof createFormSchema>;
type EditFormData = z.infer<typeof editFormSchema>;

interface WebsiteDialogProps {
  website?: Website | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  verifiedDomains: VerifiedDomain[];
  trigger?: React.ReactNode;
  initialValues?: {
    name?: string;
    domainId?: string;
  } | null;
  onCreationSuccess?: () => void;
  onUpdateSuccess?: () => void;
}

// Separate components to avoid TypeScript server crashes
function CreateWebsiteForm({
  onClose,
  verifiedDomains,
  initialValues,
  onCreationSuccess,
}: {
  onClose: () => void;
  verifiedDomains: VerifiedDomain[];
  initialValues?: { name?: string; domainId?: string; } | null;
  onCreationSuccess?: () => void;
}) {
  const { createWebsite, isCreating } = useWebsites();

  const form = useForm<CreateFormData>({
    defaultValues: {
      name: initialValues?.name || "",
      subdomain: "",
      domainId: initialValues?.domainId || "",
    },
  });

  const handleSubmit = async (data: CreateFormData) => {
    const selectedDomain = verifiedDomains.find(d => d.id === data.domainId);
    if (!selectedDomain) {
      toast.error("Please select a verified domain");
      return;
    }

    createWebsite({
      name: data.name,
      domainId: data.domainId,
      domain: selectedDomain.name,
      subdomain: data.subdomain,
    }, {
      onSuccess: () => {
        toast.success("Website created successfully");
        if (onCreationSuccess) {
          onCreationSuccess();
        }
        onClose();
      },
      onError: (error) => {
        toast.error(error.message);
      }
    });
  };

  const selectedDomain = verifiedDomains.find(d => d.id === form.watch("domainId"));
  const verifiedDomainsList = verifiedDomains.filter(domain => domain.verificationStatus === "VERIFIED");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium">Name</FormLabel>
              <FormControl>
                <Input placeholder="My Website" {...field} className="h-9" />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="domainId"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between mb-1.5">
                <FormLabel className="text-xs font-medium">Domain</FormLabel>
                {field.value && selectedDomain?.verificationStatus === "VERIFIED" && (
                  <Badge variant="outline" className="h-5 px-1.5 text-xs font-normal">
                    Verified
                  </Badge>
                )}
              </div>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select a verified domain" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {verifiedDomainsList.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      No verified domains available
                    </div>
                  ) : (
                    verifiedDomainsList.map((domain) => (
                      <SelectItem key={domain.id} value={domain.id}>
                        {domain.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        {selectedDomain && (
          <FormField
            control={form.control}
            name="subdomain"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium">Subdomain (Optional)</FormLabel>
                <div className="flex items-center">
                  <FormControl>
                    <Input
                      placeholder="blog"
                      {...field}
                      className="h-9 rounded-r-none border-r-0"
                    />
                  </FormControl>
                  <div className="flex h-9 items-center rounded-r-md border bg-muted px-3 text-sm text-muted-foreground">
                    .{selectedDomain.name}
                  </div>
                </div>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        )}

        <DialogFooter className="pt-2">
          <div className="flex w-full gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isCreating}
              className="flex-1 h-9"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreating}
              className="flex-1 h-9"
            >
              {isCreating ? "Creating..." : "Create"}
            </Button>
          </div>
        </DialogFooter>
      </form>
    </Form>
  );
}

function EditWebsiteForm({
  website,
  onClose,
  onUpdateSuccess,
}: {
  website: Website;
  onClose: () => void;
  onUpdateSuccess?: () => void;
}) {
  const { updateWebsite, isUpdating } = useWebsites();

  const form = useForm<EditFormData>({
    defaultValues: {
      name: website.name || "",
    },
  });

  const handleSubmit = async (data: EditFormData) => {
    updateWebsite({ id: website.id, name: data.name }, {
      onSuccess: () => {
        toast.success("Website updated successfully");
        if (onUpdateSuccess) {
          onUpdateSuccess();
        }
        onClose();
      },
      onError: (error) => {
        toast.error(error.message);
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium">Name</FormLabel>
              <FormControl>
                <Input placeholder="My Website" {...field} className="h-9" />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <DialogFooter className="pt-2">
          <div className="flex w-full gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isUpdating}
              className="flex-1 h-9"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUpdating}
              className="flex-1 h-9"
            >
              {isUpdating ? "Updating..." : "Update"}
            </Button>
          </div>
        </DialogFooter>
      </form>
    </Form>
  );
}

export function WebsiteDialog({
  website,
  open,
  onOpenChange,
  verifiedDomains = [],
  trigger,
  initialValues = null,
  onCreationSuccess,
  onUpdateSuccess,
}: WebsiteDialogProps) {
  const isEditing = !!website;

  const handleClose = () => {
    onOpenChange(false);
  };

  const selectedDomain = verifiedDomains.find(d => d.id === initialValues?.domainId);
  const isLocalhost = selectedDomain?.name.includes('localhost') || selectedDomain?.name.includes('127.0.0.1');

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            {isLocalhost ? <Terminal className="h-5 w-5" /> : <Globe className="h-5 w-5" />}
            <DialogTitle>{isEditing ? "Edit Website" : "Add Website"}</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            {isEditing
              ? "Update your website settings"
              : "Configure a new website for analytics tracking"}
          </DialogDescription>
        </DialogHeader>

        {isEditing && website ? (
          <EditWebsiteForm
            website={website}
            onClose={handleClose}
            onUpdateSuccess={onUpdateSuccess}
          />
        ) : (
          <CreateWebsiteForm
            onClose={handleClose}
            verifiedDomains={verifiedDomains}
            initialValues={initialValues}
            onCreationSuccess={onCreationSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
} 