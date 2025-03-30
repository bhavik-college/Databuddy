"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession, logout } from "@databuddy/auth/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, AlertTriangle, Loader2, Info, ShieldAlert } from "lucide-react";
import { deactivateUserAccount } from "@/app/actions/users";

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
import { Separator } from "@/components/ui/separator";

// Define form schema with validation
const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  confirmText: z.string().refine(val => val === "DELETE", {
    message: "Please type DELETE to confirm"
  })
});

type FormValues = z.infer<typeof formSchema>;

export function AccountDeletion() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmText: "" as "DELETE"
    },
  });

  async function onSubmit(data: FormValues) {
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
    } catch (error: any) {
      toast.error(error.message || "Failed to process account deletion");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0 md:space-x-6 p-4 bg-gradient-to-r from-red-950/20 to-red-900/10 rounded-lg border border-red-900/20">
        <div className="flex-1 space-y-2">
          <div className="flex items-center">
            <ShieldAlert className="h-5 w-5 text-red-500 mr-2" />
            <h3 className="text-base font-medium text-red-400">Account Deletion</h3>
          </div>
          <p className="text-sm text-slate-300">
            Deleting your account will remove all your data and cannot be reversed after the grace period.
          </p>
          <div className="hidden md:block text-xs text-slate-400 mt-1 italic">
            A 30-day recovery window will be available before permanent deletion.
          </div>
        </div>
        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button 
              variant="destructive" 
              size="sm" 
              className="bg-red-900/60 hover:bg-red-800 border border-red-800/50 text-white px-4"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-slate-950 border border-red-900/30 max-w-xl">
            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-red-500 text-white p-3 rounded-full">
              <AlertTriangle className="h-6 w-6" />
            </div>
            
            <AlertDialogHeader className="pt-6">
              <AlertDialogTitle className="text-red-400 text-xl text-center">
                Delete Your Account
              </AlertDialogTitle>
              <AlertDialogDescription className="text-slate-300 text-center">
                This action will schedule your account for deletion after a 30-day grace period.
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="bg-red-950/20 border border-red-900/20 rounded-md p-4 my-4">
              <div className="space-y-3 text-sm text-slate-300">
                <div className="flex items-start">
                  <Info className="h-4 w-4 text-red-400 mt-0.5 mr-2 flex-shrink-0" />
                  <p>
                    <span className="font-medium text-red-400">Immediate effects:</span>{" "}
                    Your account will be deactivated and you'll be signed out from all devices.
                  </p>
                </div>
                <div className="flex items-start">
                  <Info className="h-4 w-4 text-red-400 mt-0.5 mr-2 flex-shrink-0" />
                  <p>
                    <span className="font-medium text-red-400">Recovery period:</span>{" "}
                    You'll have 30 days to change your mind and recover your account.
                  </p>
                </div>
                <div className="flex items-start">
                  <Info className="h-4 w-4 text-red-400 mt-0.5 mr-2 flex-shrink-0" />
                  <p>
                    <span className="font-medium text-red-400">Permanent deletion:</span>{" "}
                    After 30 days, all your data will be permanently deleted.
                  </p>
                </div>
              </div>
            </div>
            
            <Separator className="bg-slate-800" />
            
            <Form {...form}>
              <form 
                ref={formRef}
                onSubmit={form.handleSubmit(onSubmit)} 
                className="space-y-5 mt-5"
              >
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
                          type="password" 
                          placeholder="••••••••" 
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
                          className="border-slate-700 bg-slate-900/60 text-red-400 font-medium tracking-wide"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <AlertDialogFooter className="gap-3 sm:gap-0 pt-2">
                  <AlertDialogCancel 
                    className="mt-0 bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                  >
                    Cancel
                  </AlertDialogCancel>
                  <Button 
                    type="submit" 
                    disabled={isLoading} 
                    variant="destructive"
                    className="bg-red-700 hover:bg-red-600 text-white border-red-600"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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