"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { authClient } from "@databuddy/auth/client";
import { toast } from "sonner";
import { ArrowClockwiseIcon, LockKeyIcon, EyeIcon, EyeSlashIcon, ShieldCheckIcon, WarningIcon, CheckCircleIcon, SparkleIcon, SignOutIcon } from "@phosphor-icons/react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Define form schema with validation
const formSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/^(?=.*[a-zA-Z])(?=.*[0-9])/, "Password must include letters and numbers"),
    confirmPassword: z.string(),
    revokeOtherSessions: z.boolean().default(false),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof formSchema>;

// Password strength calculation
function calculatePasswordStrength(password: string): { score: number; feedback: string; color: string } {
  if (!password) return { score: 0, feedback: "Enter a password", color: "bg-gray-200" };

  let score = 0;
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    numbers: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  score += checks.length ? 20 : 0;
  score += checks.lowercase ? 15 : 0;
  score += checks.uppercase ? 15 : 0;
  score += checks.numbers ? 20 : 0;
  score += checks.special ? 30 : 0;

  if (score < 40) return { score, feedback: "Weak", color: "bg-red-500" };
  if (score < 70) return { score, feedback: "Fair", color: "bg-yellow-500" };
  if (score < 90) return { score, feedback: "Good", color: "bg-blue-500" };
  return { score, feedback: "Strong", color: "bg-green-500" };
}

export function PasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<FormValues>({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      revokeOtherSessions: false,
    },
  });

  const newPassword = form.watch("newPassword");
  const passwordStrength = calculatePasswordStrength(newPassword);

  async function onSubmit(data: FormValues) {
    setIsLoading(true);
    try {
      const response = await authClient.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        revokeOtherSessions: data.revokeOtherSessions,
      });

      if (response.error) {
        toast.error(response.error.message || "Failed to update password");
      } else {
        form.reset();
        toast.success("Password updated successfully");
        if (data.revokeOtherSessions) {
          toast.info("All other sessions have been logged out");
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message || "Failed to update password");
      } else {
        toast.error("Failed to update password");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Security Notice */}
      <Alert className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
        <ShieldCheckIcon size={16} weight="duotone" className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-sm">
          <strong>Security Tip:</strong> Use a strong password with a mix of letters, numbers, and special characters. Consider using a password manager.
        </AlertDescription>
      </Alert>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="currentPassword"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-base font-medium">Current Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showCurrentPassword ? "text" : "password"}
                      placeholder="Enter your current password"
                      className={cn(
                        "pl-10 pr-10 transition-all duration-200",
                        form.formState.errors.currentPassword && "border-destructive"
                      )}
                      {...field}
                    />
                    <LockKeyIcon size={16} weight="duotone" className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeSlashIcon size={16} weight="duotone" className="h-4 w-4" />
                      ) : (
                        <EyeIcon size={16} weight="duotone" className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormDescription className="text-sm leading-relaxed">
                  Confirm your identity with your current password.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-base font-medium">New Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter your new password"
                      className={cn(
                        "pl-10 pr-10 transition-all duration-200",
                        form.formState.errors.newPassword && "border-destructive"
                      )}
                      {...field}
                    />
                    <LockKeyIcon size={16} weight="duotone" className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeSlashIcon size={16} weight="duotone" className="h-4 w-4" />
                      ) : (
                        <EyeIcon size={16} weight="duotone" className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </FormControl>

                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-bottom-1 duration-200">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Password strength</span>
                      <span className={cn(
                        "font-medium",
                        passwordStrength.score < 40 && "text-red-600",
                        passwordStrength.score >= 40 && passwordStrength.score < 70 && "text-yellow-600",
                        passwordStrength.score >= 70 && passwordStrength.score < 90 && "text-blue-600",
                        passwordStrength.score >= 90 && "text-green-600"
                      )}>
                        {passwordStrength.feedback}
                      </span>
                    </div>
                    <Progress
                      value={passwordStrength.score}
                      className="h-2"
                    />
                  </div>
                )}

                <FormDescription className="text-sm leading-relaxed">
                  Must be at least 8 characters with letters and numbers. Special characters recommended.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-base font-medium">Confirm New Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your new password"
                      className={cn(
                        "pl-10 pr-10 transition-all duration-200",
                        form.formState.errors.confirmPassword && "border-destructive",
                        field.value && field.value === newPassword && "border-green-500 bg-green-50/50 dark:bg-green-950/20"
                      )}
                      {...field}
                    />
                    <LockKeyIcon size={16} weight="duotone" className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon size={16} weight="duotone" className="h-4 w-4" />
                      ) : (
                        <EyeIcon size={16} weight="duotone" className="h-4 w-4" />
                      )}
                    </Button>
                    {field.value && field.value === newPassword && (
                      <CheckCircleIcon size={16} weight="fill" className="absolute right-10 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Session Management */}
          <div className="space-y-3 p-4 border border-muted/50 rounded-lg bg-muted/20">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="revokeOtherSessions"
                checked={form.watch("revokeOtherSessions")}
                onCheckedChange={(checked) =>
                  form.setValue("revokeOtherSessions", checked === true)
                }
              />
              <div className="flex-1">
                <label
                  htmlFor="revokeOtherSessions"
                  className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2"
                >
                  <SignOutIcon size={16} weight="duotone" className="h-4 w-4" />
                  Log out from all other devices
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  This will sign you out of all other sessions for security
                </p>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-4 border-t border-muted/50">
            <Button
              type="submit"
              disabled={isLoading || passwordStrength.score < 40}
              className="w-full sm:w-auto sm:min-w-40 transition-all duration-300"
            >
              {isLoading ? (
                <>
                  <ArrowClockwiseIcon size={16} weight="fill" className="mr-2 h-4 w-4 animate-spin" />
                  Updating Password...
                </>
              ) : (
                <>
                  <ShieldCheckIcon size={16} weight="duotone" className="mr-2 h-4 w-4" />
                  Update Password
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
            <SparkleIcon size={16} weight="fill" className="h-4 w-4 text-primary" />
          </div>
          <div className="text-sm">
            <p className="font-medium mb-1">🔒 Password Security Tips</p>
            <ul className="text-muted-foreground leading-relaxed space-y-1">
              <li>• Use a unique password you don't use elsewhere</li>
              <li>• Include uppercase, lowercase, numbers, and symbols</li>
              <li>• Consider using a password manager</li>
              <li>• Enable two-factor authentication for extra security</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 