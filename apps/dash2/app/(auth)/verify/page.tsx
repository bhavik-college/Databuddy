"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient, useSession } from "@databuddy/auth/auth-client";
import { toast } from "sonner";
import { Loader2, Mail, ArrowLeft, Lock, User, LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Define verification form schema with validation
const verifyFormSchema = z.object({
  otp: z.string().min(8, "Please enter the 8-digit code").max(8, "Code must be 8 digits"),
});

// Define email form schema with validation
const emailFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type VerifyFormValues = z.infer<typeof verifyFormSchema>;
type EmailFormValues = z.infer<typeof emailFormSchema>;

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlEmail = searchParams.get("email");
  const urlCode = searchParams.get("code");
  const { data: session, isPending: isSessionLoading } = useSession();
  const [email, setEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [activeTab, setActiveTab] = useState<string>("email");
  const otpInputRef = useRef<HTMLInputElement>(null);

  // Form for verification code
  const verifyForm = useForm<VerifyFormValues>({
    resolver: zodResolver(verifyFormSchema),
    defaultValues: {
      otp: "",
    },
  });

  // Form for email input
  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      email: "",
    },
  });

  // Initialize email and form values based on URL param or session
  useEffect(() => {
    if (isSessionLoading) return;
    
    // Priority:
    // 1. URL email parameter (if provided)
    // 2. Session email (if user is logged in)
    const initialEmail = urlEmail || session?.user?.email || null;
    
    if (initialEmail) {
      setEmail(initialEmail);
      setActiveTab("verify");
      emailForm.setValue("email", initialEmail);
      
      // If user is already verified, show verified screen
      if (session?.user?.email === initialEmail && session?.user?.emailVerified === true) {
        setIsVerified(true);
      }
    }
  }, [urlEmail, session, isSessionLoading, emailForm]);

  // Check URL hash for OTP code or query param for OTP code
  useEffect(() => {
    if (typeof window !== 'undefined' && !isVerified && email) {
      // First check for code in query params (higher priority)
      if (urlCode && urlCode.length === 6 && /^\d+$/.test(urlCode)) {
        verifyForm.setValue("otp", urlCode);
        
        // Auto-submit if we have an OTP from the URL
        if (email) {
          handleVerify(urlCode);
        }
      } 
      // Then check hash in URL
      else {
        const hash = window.location.hash;
        if (hash && hash.length > 1) {
          const otpFromHash = hash.substring(1); // Remove the # character
          if (otpFromHash.length === 6 && /^\d+$/.test(otpFromHash)) {
            verifyForm.setValue("otp", otpFromHash);
            
            // Auto-submit if we have an OTP from the hash
            if (email) {
              handleVerify(otpFromHash);
            }
          }
        }
      }
    }
    
    // Focus the OTP input when the page loads if we have an email
    if (otpInputRef.current && !isVerified && email) {
      otpInputRef.current.focus();
    }
  }, [verifyForm, email, isVerified, urlCode]);

  // Format OTP input to only allow numbers
  const formatOtpInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").substring(0, 6);
    e.target.value = value;
  };

  // Handle submitting email form
  const onEmailSubmit = async (data: EmailFormValues) => {
    setIsLoading(true);
    try {
      // Using the documented sendVerificationOtp method
      const result = await authClient.emailOtp.sendVerificationOtp({
        email: data.email,
        type: "email-verification"
      });

      if (result.error) {
        toast.error(result.error.message || "Failed to send verification code");
      } else {
        setEmail(data.email);
        setActiveTab("verify");
        router.replace(`/verify?email=${encodeURIComponent(data.email)}`);
        toast.success("Verification code sent to your email");
        setCountdown(60);
        
        // Focus the OTP input after changing tab
        setTimeout(() => {
          if (otpInputRef.current) {
            otpInputRef.current.focus();
          }
        }, 100);
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Something went wrong");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      setActiveTab("email");
      return;
    }

    setIsLoading(true);
    try {
      // Using the documented sendVerificationOtp method
      const result = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "email-verification"
      });

      if (result.error) {
        toast.error(result.error.message || "Failed to send verification code");
      } else {
        toast.success("Verification code sent to your email");
        setCountdown(60);
      }
    } catch (error) {
      toast.error("Something went wrong when resending the code");
    } finally {
      setIsLoading(false);
    }
  };

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Helper function to handle verification
  const handleVerify = async (otpCode: string) => {
    if (!email) {
      setActiveTab("email");
      return;
    }

    setIsLoading(true);
    try {
      // Using the documented verifyEmail method
      const result = await authClient.emailOtp.verifyEmail({
        email,
        otp: otpCode
      });

      if (result.error) {
        toast.error(result.error.message || "Invalid verification code");
      } else {
        setIsVerified(true);
        toast.success("Email verified successfully");
        
        // Redirect to login after brief delay
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Something went wrong");
      }
    } finally {
      setIsLoading(false);
    }
  };

  async function onVerifySubmit(data: VerifyFormValues) {
    await handleVerify(data.otp);
  }

  // Show loading while checking session
  if (isSessionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4 antialiased">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-sky-400 mx-auto mb-4" />
          <p className="text-slate-400">Checking verification status...</p>
        </div>
      </div>
    );
  }

  if (isVerified) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4 antialiased">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link
              href="/"
              className="inline-block text-2xl font-bold bg-gradient-to-r from-sky-400 to-sky-600 bg-clip-text text-transparent hover:from-sky-300 hover:to-sky-500 transition-all duration-200"
              aria-label="Go to Databuddy homepage"
            >
              Databuddy
            </Link>
          </div>
          <Card className="bg-slate-800/80 border-slate-700/50 backdrop-blur-sm shadow-xl">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-medium text-white">Email Verified!</CardTitle>
              <CardDescription className="text-slate-400">
                Your account has been successfully verified.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-8">
              <div className="rounded-full bg-green-500/20 p-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full bg-sky-600 hover:bg-sky-700 text-white transition-colors duration-200"
                onClick={() => router.push("/login")}
              >
                <LogIn className="mr-2 h-4 w-4" />
                Go to Login
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4 antialiased">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-block text-2xl font-bold bg-gradient-to-r from-sky-400 to-sky-600 bg-clip-text text-transparent hover:from-sky-300 hover:to-sky-500 transition-all duration-200"
            aria-label="Go to Databuddy homepage"
          >
            Databuddy
          </Link>
        </div>
        <Card className="bg-slate-800/80 border-slate-700/50 backdrop-blur-sm shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-medium text-white">Verify your email</CardTitle>
            <CardDescription className="text-slate-400">
              {email 
                ? `We've sent a verification code to ${email}`
                : "Enter your email to receive a verification code"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {session?.user && !session.user.emailVerified && (
              <Alert className="mb-4 bg-amber-600/20 border-amber-600/30">
                <AlertDescription className="text-amber-100">
                  Your account needs email verification to access all features.
                </AlertDescription>
              </Alert>
            )}
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4 bg-slate-700/30">
                <TabsTrigger 
                  value="email" 
                  className="data-[state=active]:bg-sky-600 data-[state=active]:text-white"
                >
                  <User className="mr-2 h-4 w-4" />
                  Email
                </TabsTrigger>
                <TabsTrigger 
                  value="verify" 
                  className="data-[state=active]:bg-sky-600 data-[state=active]:text-white"
                  disabled={!email}
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Verify
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="email" className="mt-0">
                {email && (
                  <Alert className="mb-4 bg-sky-900/20 border-sky-900/50">
                    <AlertDescription className="text-sky-100">
                      A verification code has been sent to <span className="font-semibold">{email}</span>
                    </AlertDescription>
                  </Alert>
                )}
                <Form {...emailForm}>
                  <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                    <FormField
                      control={emailForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder="Your email address"
                              {...field}
                              type="email"
                              autoComplete="email"
                              className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-sky-400 focus:ring-sky-400/10"
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button
                      type="submit"
                      className="w-full bg-sky-600 hover:bg-sky-700 text-white transition-colors duration-200"
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                      Send Verification Code
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="verify" className="mt-0">
                <Form {...verifyForm}>
                  <form onSubmit={verifyForm.handleSubmit(onVerifySubmit)} className="space-y-4">
                    <FormField
                      control={verifyForm.control}
                      name="otp"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder="Enter 6-digit code"
                              {...field}
                              ref={otpInputRef}
                              autoComplete="one-time-code"
                              onChange={(e) => {
                                field.onChange(e);
                              }}
                              className="text-center text-lg tracking-widest font-mono bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-sky-400 focus:ring-sky-400/10"
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button
                      type="submit"
                      className="w-full bg-sky-600 hover:bg-sky-700 text-white transition-colors duration-200"
                      disabled={isLoading}
                    >
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Verify Email
                    </Button>
                  </form>
                </Form>
                
                <div className="mt-4 text-center">
                  <p className="text-sm text-slate-400 mb-2">
                    Didn't receive a code?
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      type="button"
                      className="bg-slate-700/50 border-slate-600 hover:bg-slate-700/80 hover:text-white text-slate-100 transition-colors duration-200"
                      onClick={() => setActiveTab("email")}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Change Email
                    </Button>
                    <Button
                      variant="outline"
                      type="button"
                      className="bg-slate-700/50 border-slate-600 hover:bg-slate-700/80 hover:text-white text-slate-100 transition-colors duration-200"
                      onClick={handleResendCode}
                      disabled={isLoading || countdown > 0}
                    >
                      {countdown > 0 ? (
                        `Resend in ${countdown}s`
                      ) : (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Resend Code
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-slate-700/50 pt-4">
            <Button
              variant="link"
              className="text-slate-400 hover:text-white"
              onClick={() => router.push("/login")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 