"use client";

import { logout, useSession } from "@databuddy/auth/client";
import {
  ArrowClockwiseIcon,
  InfoIcon,
  ShieldCheckIcon,
  TrashIcon,
  WarningIcon,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { deactivateUserAccount } from "@/app/actions/users";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { Separator } from "@/components/ui/separator";

// Define form schema with validation
const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  confirmText: z.literal("DELETE"),
});

export function AccountDeletion() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    defaultValues: {
      email: "",
      password: "",
      confirmText: "DELETE",
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    if (data.email !== session?.user?.email) {
      toast.error("Email doesn't match your account email");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("password", data.password);
      formData.append("email", data.email);

      const result = await deactivateUserAccount(formData);

      if (result.success) {
        toast.success("Your account has been scheduled for deletion");
        form.reset();
        setIsDialogOpen(false);

        // Sign out the user
        await logout();
        router.push("/login");
      } else if (result.error) {
        toast.error(result.error);
      } else {
        toast.error("Failed to process account deletion");
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message || "Failed to process account deletion");
      } else {
        toast.error("Failed to process account deletion");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <div className="flex flex-col justify-between space-y-4 rounded-lg border border-red-900/20 bg-gradient-to-r from-red-950/20 to-red-900/10 p-4 md:flex-row md:items-center md:space-x-6 md:space-y-0">
        <div className="flex-1 space-y-2">
          <div className="flex items-center">
            <ShieldCheckIcon className="mr-2 h-5 w-5 text-red-500" size={20} weight="fill" />
            <h3 className="font-medium text-base text-red-400">Account Deletion</h3>
          </div>
          <p className="text-slate-300 text-sm">
            Deleting your account will remove all your data and cannot be reversed after the grace
            period.
          </p>
          <div className="mt-1 hidden text-slate-400 text-xs italic md:block">
            A 30-day recovery window will be available before permanent deletion.
          </div>
        </div>
        <AlertDialog onOpenChange={setIsDialogOpen} open={isDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button
              className="border border-red-800/50 bg-red-900/60 px-4 text-white hover:bg-red-800"
              size="sm"
              variant="destructive"
            >
              <TrashIcon className="mr-2 h-4 w-4" size={16} weight="duotone" />
              Delete Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-xl border border-red-900/30 bg-slate-950">
            <div className="-top-12 -translate-x-1/2 absolute left-1/2 transform rounded-full bg-red-500 p-3 text-white">
              <WarningIcon className="h-6 w-6" size={24} weight="duotone" />
            </div>

            <AlertDialogHeader className="pt-6">
              <AlertDialogTitle className="text-center text-red-400 text-xl">
                Delete Your Account
              </AlertDialogTitle>
              <AlertDialogDescription className="text-center text-slate-300">
                This action will schedule your account for deletion after a 30-day grace period.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="my-4 rounded-md border border-red-900/20 bg-red-950/20 p-4">
              <div className="space-y-3 text-slate-300 text-sm">
                <div className="flex items-start">
                  <InfoIcon
                    className="mt-0.5 mr-2 h-4 w-4 flex-shrink-0 text-red-400"
                    size={16}
                    weight="duotone"
                  />
                  <p>
                    <span className="font-medium text-red-400">Immediate effects:</span> Your
                    account will be deactivated and you&apos;ll be signed out from all devices.
                  </p>
                </div>
                <div className="flex items-start">
                  <InfoIcon
                    className="mt-0.5 mr-2 h-4 w-4 flex-shrink-0 text-red-400"
                    size={16}
                    weight="duotone"
                  />
                  <p>
                    <span className="font-medium text-red-400">Recovery period:</span> You&apos;ll
                    have 30 days to change your mind and recover your account.
                  </p>
                </div>
                <div className="flex items-start">
                  <InfoIcon
                    className="mt-0.5 mr-2 h-4 w-4 flex-shrink-0 text-red-400"
                    size={16}
                    weight="duotone"
                  />
                  <p>
                    <span className="font-medium text-red-400">Permanent deletion:</span> After 30
                    days, all your data will be permanently deleted.
                  </p>
                </div>
              </div>
            </div>

            <Separator className="bg-slate-800" />

            <Form {...form}>
              <form className="mt-5 space-y-5" onSubmit={form.handleSubmit(onSubmit)} ref={formRef}>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Confirm your email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={session?.user?.email || "your@email.com"}
                          {...field}
                          className="border-slate-700 bg-slate-900/60"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Your password</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="••••••••"
                          type="password"
                          {...field}
                          className="border-slate-700 bg-slate-900/60"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Type "DELETE" to confirm</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="DELETE"
                          {...field}
                          className="border-slate-700 bg-slate-900/60 font-medium text-red-400 tracking-wide"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <AlertDialogFooter className="gap-3 pt-2 sm:gap-0">
                  <AlertDialogCancel className="mt-0 border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white">
                    Cancel
                  </AlertDialogCancel>
                  <Button
                    className="border-red-600 bg-red-700 text-white hover:bg-red-600"
                    disabled={isLoading}
                    type="submit"
                    variant="destructive"
                  >
                    {isLoading ? (
                      <>
                        <ArrowClockwiseIcon
                          className="mr-2 h-4 w-4 animate-spin"
                          size={16}
                          weight="fill"
                        />
                        Processing...
                      </>
                    ) : (
                      "Confirm Deletion"
                    )}
                  </Button>
                </AlertDialogFooter>
              </form>
            </Form>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
