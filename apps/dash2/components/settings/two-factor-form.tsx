"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "@databuddy/auth/auth-client";
import { authClient, useUser } from "@databuddy/auth/auth-client";
import { enableTwoFactor, verifyTwoFactorCode, generateBackupCodes } from "@databuddy/auth/auth-helpers";
import { toast } from "sonner";
import { Loader2, Copy, Check, Key, Shield, Download } from "lucide-react";

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
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const setupFormSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

const verifyFormSchema = z.object({
  code: z.string().min(6, "Code is required").max(6, "Code should be 6 digits"),
  trustDevice: z.boolean().default(false),
});

type SetupFormValues = z.infer<typeof setupFormSchema>;
type VerifyFormValues = z.infer<typeof verifyFormSchema>;

export function TwoFactorForm() {
  const { data: session } = useSession();
//   const { user, isLoading: userLoading } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [setupStep, setSetupStep] = useState<'initial' | 'qrcode' | 'verify' | 'complete'>('initial');
  const [qrCodeURI, setQrCodeURI] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [copied, setCopied] = useState(false);
  const otpInputRef = useRef<HTMLInputElement>(null);

  // Setup form for entering password
  const setupForm = useForm<SetupFormValues>({
    resolver: zodResolver(setupFormSchema),
    defaultValues: {
      password: "",
    },
  });

  // Verify form for entering 2FA code
  const verifyForm = useForm<VerifyFormValues>({
    resolver: zodResolver(verifyFormSchema),
    defaultValues: {
      code: "",
      trustDevice: false,
    },
  });

  // Check if 2FA is already enabled
  useEffect(() => {
    const checkTwoFactorStatus = async () => {
      try {
        // As a fallback, we'll just check if we can find any property that might indicate 2FA is enabled
        // Different auth implementations might use different property names
        const user = session?.user;
        if (user) {
          setIsEnabled(
            !!(user as any).twoFactorEnabled || 
            !!(user as any).mfaEnabled || 
            !!(user as any).hasTwoFactor
          );
        }
      } catch (error) {
        console.error("Failed to check 2FA status:", error);
      }
    };

    if (session) {
      checkTwoFactorStatus();
    }
  }, [session]);

  // Focus OTP input when QR code is shown
  useEffect(() => {
    if (setupStep === 'qrcode' && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [setupStep]);

  // Handle setup 2FA (Step 1: Enter password)
  const onSetupSubmit = async (data: SetupFormValues) => {
    setIsLoading(true);
    try {
      const result = await enableTwoFactor(data.password, {
        onSuccess: (data) => {
          if (data?.totpURI) {
            setQrCodeURI(data.totpURI);
            setBackupCodes(data.backupCodes || []);
            setSetupStep('qrcode');
          }
        },
        onError: (error) => {
          toast.error(error.message || "Failed to enable 2FA");
        }
      });
      
      if (!result.success) {
        toast.error("Failed to enable 2FA");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to enable 2FA");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle verify code (Step 2: Enter 2FA code)
  const onVerifySubmit = async (data: VerifyFormValues) => {
    setIsLoading(true);
    try {
      const result = await verifyTwoFactorCode(data.code, {
        trustDevice: data.trustDevice,
        onSuccess: () => {
          toast.success("Two-factor authentication enabled successfully");
          setSetupStep('complete');
          setIsEnabled(true);
          // Force a session refresh
          window.location.reload();
        },
        onError: (error) => {
          toast.error(error.message || "Failed to verify code");
        }
      });
      
      if (!result.success) {
        toast.error("Failed to verify code");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to verify code");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle disable 2FA
  const handleDisable2FA = async () => {
    if (!confirm("Are you sure you want to disable two-factor authentication? This will make your account less secure.")) {
      return;
    }

    setIsLoading(true);
    try {
      await authClient.twoFactor.disable({
        password: prompt("Enter your password to confirm") || ""
      });
      toast.success("Two-factor authentication disabled");
      setIsEnabled(false);
      setSetupStep('initial');
      // Force a session refresh
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "Failed to disable 2FA");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle regenerate backup codes
  const handleRegenerateBackupCodes = async () => {
    const password = prompt("Enter your password to generate new backup codes");
    if (!password) return;
    
    setIsLoading(true);
    try {
      const result = await generateBackupCodes(password, {
        onSuccess: (codes) => {
          setBackupCodes(codes);
          toast.success("New backup codes generated");
        },
        onError: (error) => {
          toast.error(error.message || "Failed to generate backup codes");
        }
      });
      
      if (!result.success) {
        toast.error("Failed to generate backup codes");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to generate backup codes");
    } finally {
      setIsLoading(false);
    }
  };

  // Copy backup codes to clipboard
  const copyBackupCodes = () => {
    if (backupCodes) {
      navigator.clipboard.writeText(backupCodes.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Download backup codes as a text file
  const downloadBackupCodes = () => {
    if (!backupCodes || backupCodes.length === 0) return;
    
    const fileName = "databuddy-backup-codes.txt";
    const content = 
      "Databuddy Two-Factor Authentication Backup Codes\n" +
      "Save these codes in a safe place. Each code can only be used once.\n\n" +
      backupCodes.join('\n') + 
      "\n\nGenerated on: " + new Date().toLocaleString();
    
    const element = document.createElement('a');
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast.success("Backup codes downloaded");
  };

  // Format OTP input to auto-format numbers
  const formatOtpInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only digits
    const digitsOnly = value.replace(/\D/g, '');
    // Limit to 6 digits
    const truncated = digitsOnly.slice(0, 6);
    // Update the form value
    verifyForm.setValue('code', truncated);
  };

  // Show backup codes component
  const BackupCodesDisplay = () => {
    if (!backupCodes || backupCodes.length === 0) return null;
    
    return (
      <div className="p-4 border rounded-md bg-muted/50">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium">Your Backup Codes</h4>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={downloadBackupCodes}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" size="sm" onClick={copyBackupCodes}>
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {backupCodes.map((code, index) => (
            <code key={index} className="p-1 text-xs bg-muted rounded">
              {code}
            </code>
          ))}
        </div>
      </div>
    );
  };

  if (setupStep === 'qrcode') {
    return (
      <div className="space-y-4">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertTitle>Set up two-factor authentication</AlertTitle>
          <AlertDescription>
            Scan the QR code below with your authenticator app and enter the code it provides.
          </AlertDescription>
        </Alert>

        <div className="flex flex-col items-center justify-center p-6 border rounded-md">
          {qrCodeURI && (
            <div className="mb-4">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeURI)}`}
                alt="QR Code for 2FA"
                width={200}
                height={200}
              />
            </div>
          )}
          
          <Form {...verifyForm}>
            <form onSubmit={verifyForm.handleSubmit(onVerifySubmit)} className="w-full max-w-md space-y-4">
              <FormField
                control={verifyForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Authentication Code</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter 6-digit code" 
                        {...field}
                        autoComplete="one-time-code"
                        inputMode="numeric"
                        pattern="\d{6}"
                        maxLength={6}
                        ref={otpInputRef}
                        onChange={(e) => {
                          formatOtpInput(e);
                          field.onChange(e);
                        }}
                        className="text-center text-lg tracking-widest font-mono"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={verifyForm.control}
                name="trustDevice"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Trust this device
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setSetupStep('initial')}>
                  Back
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify
                </Button>
              </div>
            </form>
          </Form>
        </div>

        <Alert>
          <Key className="h-4 w-4" />
          <AlertTitle>Backup Codes</AlertTitle>
          <AlertDescription>
            Save these backup codes somewhere safe. You can use them to log in if you lose access to your authenticator app.
          </AlertDescription>
        </Alert>

        <BackupCodesDisplay />
      </div>
    );
  }
  
  if (setupStep === 'complete') {
    return (
      <div className="space-y-4">
        <Alert className="bg-green-500/10 border-green-500/20">
          <Check className="h-4 w-4 text-green-500" />
          <AlertTitle>Two-factor authentication enabled</AlertTitle>
          <AlertDescription>
            Your account is now protected with two-factor authentication.
          </AlertDescription>
        </Alert>

        <BackupCodesDisplay />

        <Button variant="destructive" onClick={handleDisable2FA} disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Disable Two-Factor Authentication
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isEnabled ? (
        <>
          <Alert className="bg-green-500/10 border-green-500/20">
            <Check className="h-4 w-4 text-green-500" />
            <AlertTitle>Two-factor authentication is enabled</AlertTitle>
            <AlertDescription>
              Your account is protected with two-factor authentication.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={handleRegenerateBackupCodes} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate New Backup Codes
            </Button>
            
            <Button variant="destructive" onClick={handleDisable2FA} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Disable Two-Factor Authentication
            </Button>
          </div>
        </>
      ) : (
        <>
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertTitle>Add an extra layer of security</AlertTitle>
            <AlertDescription>
              Two-factor authentication adds an additional layer of security to your account by requiring more than just a password to sign in.
            </AlertDescription>
          </Alert>

          <Form {...setupForm}>
            <form onSubmit={setupForm.handleSubmit(onSetupSubmit)} className="space-y-4">
              <FormField
                control={setupForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enable Two-Factor Authentication
              </Button>
            </form>
          </Form>
        </>
      )}
    </div>
  );
} 