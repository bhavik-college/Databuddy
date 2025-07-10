"use client";

import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { useEffect, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { CreateWebsiteData, Website } from "@/hooks/use-websites";
import { useCreateWebsite, useUpdateWebsite } from "@/hooks/use-websites";
import { authClient } from "@databuddy/auth/client";
import { LoaderCircle } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  domain: z
    .string()
    .min(1, "Domain is required")
    .regex(
      /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/,
      "Invalid domain format",
    ),
});

type FormData = z.infer<typeof formSchema>;

interface WebsiteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  website?: Website | null;
  onSave?: (website: Website) => void;
}

export function WebsiteDialog({
  open,
  onOpenChange,
  website,
  onSave = () => { },
}: WebsiteDialogProps) {
  const isEditing = !!website;
  const { data: activeOrganization } = authClient.useActiveOrganization();
  const formRef = useRef<HTMLFormElement>(null);

  const createWebsiteMutation = useCreateWebsite();
  const updateWebsiteMutation = useUpdateWebsite();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      domain: "",
    },
  });

  useEffect(() => {
    if (website) {
      form.reset({ name: website.name || "", domain: website.domain || "" });
    } else {
      form.reset({ name: "", domain: "" });
    }
  }, [website, form]);

  const handleSubmit = form.handleSubmit(async (formData) => {
    const submissionData: CreateWebsiteData = {
      name: formData.name,
      domain: formData.domain,
      organizationId: activeOrganization?.id,
    };

    const promise = async () =>
      isEditing
        ? updateWebsiteMutation.mutate({ id: website.id, name: formData.name })
        : createWebsiteMutation.mutate(submissionData);

    toast.promise(promise(), {
      loading: "Loading...",
      success: (result) => {
        onSave(result as Website);
        onOpenChange(false);
        return `Website ${isEditing ? "updated" : "created"} successfully!`;
      },
      error: (err: any) => {
        const message =
          err.data?.code === "CONFLICT"
            ? "A website with this domain already exists."
            : `Failed to ${isEditing ? "update" : "create"} website.`;
        return message;
      },
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Website" : "Create a new website"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details of your existing website."
              : "Create a new website to start tracking analytics."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            <fieldset
              disabled={
                createWebsiteMutation.isPending || updateWebsiteMutation.isPending
              }
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your project's name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="domain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Domain</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="your-company.com"
                        {...field}
                        onChange={(e) => {
                          let domain = e.target.value.trim();
                          if (
                            domain.startsWith("http://") ||
                            domain.startsWith("https://")
                          ) {
                            try {
                              domain = new URL(domain).hostname;
                            } catch {
                              // if parsing fails, we fallback to the original value
                            }
                          }
                          field.onChange(domain.replace(/^www\./, ""));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </fieldset>
          </form>
        </Form>
        <DialogFooter>
          <Button
            type="submit"
            form="form"
            onClick={handleSubmit}
            disabled={
              createWebsiteMutation.isPending || updateWebsiteMutation.isPending
            }
          >
            {(createWebsiteMutation.isPending || updateWebsiteMutation.isPending) && (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isEditing ? "Save changes" : "Create website"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
