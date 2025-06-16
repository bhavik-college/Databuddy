"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { authClient, useSession } from "@databuddy/auth/client";
import { toast } from "sonner";
import { Loader2, Mail, Lock, AlertCircle, Shield, CheckCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Define form schema with validation
const formSchema = z.object({
  newEmail: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof formSchema>;

export function EmailForm() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    defaultValues: {
      newEmail: "",
      password: "",
    },
  });

  async function onSubmit(data: FormValues) {
    setIsLoading(true);
    try {
      const response = await authClient.changeEmail({
        newEmail: data.newEmail,
      });

      if (response.error) {
        toast.error(response.error.message || "Failed to update email");
      } else {
        form.reset();
        toast.success("Email update request sent! Check your new email for verification.");
      }

      form.reset();
    } catch (error: any) {
      toast.error(error.message || "Failed to update email");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Current Email Display */}
      <Card className="border-muted/50 bg-gradient-to-br from-muted/20 to-muted/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-600/5 border border-blue-500/20 flex items-center justify-center">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Current Email</p>
                <p className="text-sm text-muted-foreground">{session?.user?.email || "Not available"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {session?.user?.emailVerified ? (
                <Badge variant="secondary" className="text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs border-amber-300 text-amber-600">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Unverified
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Alert className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-sm">
          <strong>Security Notice:</strong> Changing your email requires verification. You'll receive a confirmation link at your new email address.
        </AlertDescription>
      </Alert>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="newEmail"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-base font-medium">New Email Address</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="Enter your new email address"
                      className={cn(
                        "pl-10 transition-all duration-200",
                        form.formState.errors.newEmail && "border-destructive"
                      )}
                      {...field}
                    />
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </FormControl>
                <FormDescription className="text-sm leading-relaxed">
                  Enter the new email address you want to use for your account. You'll need to verify this email before the change takes effect.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-base font-medium">Current Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type="password"
                      placeholder="Enter your current password"
                      className={cn(
                        "pl-10 transition-all duration-200",
                        form.formState.errors.password && "border-destructive"
                      )}
                      {...field}
                    />
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </FormControl>
                <FormDescription className="text-sm leading-relaxed">
                  Confirm your identity by entering your current password.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Action Button */}
          <div className="pt-4 border-t border-muted/50">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto sm:min-w-40 transition-all duration-300"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Request...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Update Email
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>

      {/* Help Text */}
      <div className="bg-muted/30 rounded-lg p-4 border border-muted/50">
        <div className="flex items-start gap-3">
          <div className="p-1 rounded-md bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="text-sm">
            <p className="font-medium mb-1">📧 Email Change Process</p>
            <ul className="text-muted-foreground leading-relaxed space-y-1">
              <li>• A verification link will be sent to your new email</li>
              <li>• Click the link to confirm the email change</li>
              <li>• Your old email will remain active until verification</li>
              <li>• You'll be notified at both email addresses</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 