'use client';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { addDomain } from "../actions";

const addDomainSchema = z.object({
  domainName: z
    .string()
    .min(1, "Domain name is required")
    .regex(/^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/, "Please enter a valid domain name"),
  verificationStatus: z.enum(['PENDING', 'VERIFIED', 'FAILED']).default('PENDING'),
});

type AddDomainForm = z.infer<typeof addDomainSchema>;

interface AddDomainFormProps {
  userId: string;
}

export function AddDomainForm({ userId }: AddDomainFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<AddDomainForm>({
    defaultValues: {
      domainName: '',
      verificationStatus: 'PENDING',
    },
  });

  const onSubmit = async (data: AddDomainForm) => {
    setIsLoading(true);
    try {
      const result = await addDomain(userId, data.domainName, data.verificationStatus);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(`Domain "${data.domainName}" added successfully with ${data.verificationStatus.toLowerCase()} status`);
      form.reset();
      setIsOpen(false);
    } catch (error) {
      toast.error('Failed to add domain');
      console.error('Error adding domain:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Domain
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Domain</DialogTitle>
          <DialogDescription>
            Add a new domain to this user's account. You can set the verification status as needed.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="domainName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Domain Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="example.com"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the domain name without protocol (e.g., example.com)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="verificationStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verification Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select verification status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="VERIFIED">Verified</SelectItem>
                      <SelectItem value="FAILED">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Set the initial verification status for this domain
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Adding...' : 'Add Domain'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 