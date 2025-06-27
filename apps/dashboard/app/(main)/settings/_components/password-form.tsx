"use client";

import { authClient } from "@databuddy/auth/client";
import {
  ArrowClockwiseIcon,
  CheckCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  LockKeyIcon,
  ShieldCheckIcon,
  SignOutIcon,
  SparkleIcon,
  WarningIcon,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

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
function calculatePasswordStrength(password: string): {
  score: number;
  feedback: string;
  color: string;
} {
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
    <div className="fade-in slide-in-from-bottom-2 animate-in space-y-6 duration-300">
      {/* Security Notice */}
      <Alert className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
        <ShieldCheckIcon className="h-4 w-4 text-amber-600" size={16} weight="duotone" />
        <AlertDescription className="text-sm">
          <strong>Security Tip:</strong> Use a strong password with a mix of letters, numbers, and
          special characters. Consider using a password manager.
        </AlertDescription>
      </Alert>

      {/* Form */}
      <Form {...form}>
        <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="currentPassword"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="font-medium text-base">Current Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      className={cn(
                        "pr-10 pl-10 transition-all duration-200",
                        form.formState.errors.currentPassword && "border-destructive"
                      )}
                      placeholder="Enter your current password"
                      type={showCurrentPassword ? "text" : "password"}
                      {...field}
                    />
                    <LockKeyIcon
                      className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground"
                      size={16}
                      weight="duotone"
                    />
                    <Button
                      className="-translate-y-1/2 absolute top-1/2 right-1 h-8 w-8 transform p-0"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      {showCurrentPassword ? (
                        <EyeSlashIcon className="h-4 w-4" size={16} weight="duotone" />
                      ) : (
                        <EyeIcon className="h-4 w-4" size={16} weight="duotone" />
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
                <FormLabel className="font-medium text-base">New Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      className={cn(
                        "pr-10 pl-10 transition-all duration-200",
                        form.formState.errors.newPassword && "border-destructive"
                      )}
                      placeholder="Enter your new password"
                      type={showNewPassword ? "text" : "password"}
                      {...field}
                    />
                    <LockKeyIcon
                      className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground"
                      size={16}
                      weight="duotone"
                    />
                    <Button
                      className="-translate-y-1/2 absolute top-1/2 right-1 h-8 w-8 transform p-0"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      {showNewPassword ? (
                        <EyeSlashIcon className="h-4 w-4" size={16} weight="duotone" />
                      ) : (
                        <EyeIcon className="h-4 w-4" size={16} weight="duotone" />
                      )}
                    </Button>
                  </div>
                </FormControl>

                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="fade-in slide-in-from-bottom-1 animate-in space-y-2 duration-200">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Password strength</span>
                      <span
                        className={cn(
                          "font-medium",
                          passwordStrength.score < 40 && "text-red-600",
                          passwordStrength.score >= 40 &&
                            passwordStrength.score < 70 &&
                            "text-yellow-600",
                          passwordStrength.score >= 70 &&
                            passwordStrength.score < 90 &&
                            "text-blue-600",
                          passwordStrength.score >= 90 && "text-green-600"
                        )}
                      >
                        {passwordStrength.feedback}
                      </span>
                    </div>
                    <Progress className="h-2" value={passwordStrength.score} />
                  </div>
                )}

                <FormDescription className="text-sm leading-relaxed">
                  Must be at least 8 characters with letters and numbers. Special characters
                  recommended.
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
                <FormLabel className="font-medium text-base">Confirm New Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      className={cn(
                        "pr-10 pl-10 transition-all duration-200",
                        form.formState.errors.confirmPassword && "border-destructive",
                        field.value &&
                          field.value === newPassword &&
                          "border-green-500 bg-green-50/50 dark:bg-green-950/20"
                      )}
                      placeholder="Confirm your new password"
                      type={showConfirmPassword ? "text" : "password"}
                      {...field}
                    />
                    <LockKeyIcon
                      className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground"
                      size={16}
                      weight="duotone"
                    />
                    <Button
                      className="-translate-y-1/2 absolute top-1/2 right-1 h-8 w-8 transform p-0"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon className="h-4 w-4" size={16} weight="duotone" />
                      ) : (
                        <EyeIcon className="h-4 w-4" size={16} weight="duotone" />
                      )}
                    </Button>
                    {field.value && field.value === newPassword && (
                      <CheckCircleIcon
                        className="-translate-y-1/2 absolute top-1/2 right-10 h-4 w-4 transform text-green-500"
                        size={16}
                        weight="fill"
                      />
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Session Management */}
          <div className="space-y-3 rounded-lg border border-muted/50 bg-muted/20 p-4">
            <div className="flex items-center space-x-3">
              <Checkbox
                checked={form.watch("revokeOtherSessions")}
                id="revokeOtherSessions"
                onCheckedChange={(checked) =>
                  form.setValue("revokeOtherSessions", checked === true)
                }
              />
              <div className="flex-1">
                <label
                  className="flex cursor-pointer items-center gap-2 font-medium text-sm leading-none"
                  htmlFor="revokeOtherSessions"
                >
                  <SignOutIcon className="h-4 w-4" size={16} weight="duotone" />
                  Log out from all other devices
                </label>
                <p className="mt-1 text-muted-foreground text-xs">
                  This will sign you out of all other sessions for security
                </p>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="border-muted/50 border-t pt-4">
            <Button
              className="w-full transition-all duration-300 sm:w-auto sm:min-w-40"
              disabled={isLoading || passwordStrength.score < 40}
              type="submit"
            >
              {isLoading ? (
                <>
                  <ArrowClockwiseIcon
                    className="mr-2 h-4 w-4 animate-spin"
                    size={16}
                    weight="fill"
                  />
                  Updating Password...
                </>
              ) : (
                <>
                  <ShieldCheckIcon className="mr-2 h-4 w-4" size={16} weight="duotone" />
                  Update Password
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>

      {/* Help Text */}
      <div className="rounded-lg border border-muted/50 bg-muted/30 p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-primary/10 p-1">
            <SparkleIcon className="h-4 w-4 text-primary" size={16} weight="fill" />
          </div>
          <div className="text-sm">
            <p className="mb-1 font-medium">🔒 Password Security Tips</p>
            <ul className="space-y-1 text-muted-foreground leading-relaxed">
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
