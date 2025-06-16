"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@databuddy/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Github, Mail, Loader2, Info, ChevronLeft, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import VisuallyHidden from "@/components/ui/visuallyhidden";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

function RegisterPageContent() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isHoneypot, setIsHoneypot] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationStep, setRegistrationStep] = useState<"form" | "success" | "verification-needed">("form");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!acceptTerms) {
      toast.error("You must accept the terms and conditions");
      return;
    }

    if (isHoneypot) {
      toast.error("Server error, please try again later");
      return;
    }

    setIsLoading(true);

    try {
      const result = await authClient.signUp.email({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        fetchOptions: {
          onSuccess: (ctx) => {
            const authToken = ctx.response.headers.get("set-auth-token")
            if (authToken) {
              localStorage.setItem("authToken", authToken);
            }
            toast.success("Account created! Please check your email to verify your account.");
            setRegistrationStep("verification-needed");
            // router.push(`/verify?email=${encodeURIComponent(formData.email)}`);
          },
        }
      });

      if (result?.error) {
        toast.error(result.error.message || "Failed to create account");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerificationEmail = async () => {
    setIsLoading(true);
    try {
      await authClient.sendVerificationEmail({
        email: formData.email,
        callbackURL: "/home",
        fetchOptions: {
          onSuccess: () => {
            toast.success("Verification email sent!");
          },
          onError: () => {
            toast.error("Failed to send verification email. Please try again later.");
          },
        },
      });
    } catch (error) {
      toast.error("Failed to send verification email. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: "github" | "google") => {
    setIsLoading(true);
    try {
      await authClient.signIn.social({
        provider: provider,
        fetchOptions: {
          onSuccess: (ctx) => {
            const authToken = ctx.response.headers.get("set-auth-token")
            if (authToken) {
              localStorage.setItem("authToken", authToken);
            }
            toast.success("Login successful!");
            router.push("/home");
          },
          onError: () => {
            toast.error("Login failed. Please try again.");
          }
        }
      });
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  // Render header content based on current registration step
  const renderHeaderContent = () => {
    switch (registrationStep) {
      case "verification-needed":
        return (
          <>
            <div className="inline-flex justify-center items-center p-3 bg-amber-100 rounded-full mb-5 relative w-16 h-16">
              <div className="absolute inset-0 bg-amber-50 rounded-full animate-pulse" />
              <div className="absolute -inset-1 bg-gradient-to-tr from-amber-200 to-amber-100 rounded-full blur-md opacity-70" />
              <div className="relative bg-gradient-to-tr from-amber-500 to-amber-400 rounded-full p-2.5">
                <AlertCircle className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Verify your email</h1>
            <p className="text-muted-foreground mt-2">
              We've sent a verification link to <strong className="text-amber-600 font-medium">{formData.email}</strong>
            </p>
          </>
        );
      case "success":
        return (
          <>
            <div className="inline-flex justify-center items-center p-3 bg-green-100 rounded-full mb-5 relative w-16 h-16">
              <div className="absolute inset-0 bg-green-50 rounded-full animate-pulse" />
              <div className="absolute -inset-1 bg-gradient-to-tr from-green-200 to-green-100 rounded-full blur-md opacity-70" />
              <div className="relative bg-gradient-to-tr from-green-500 to-green-400 rounded-full p-2.5">
                <CheckCircle2 className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Success!</h1>
            <p className="text-muted-foreground mt-2">
              Your account has been created successfully
            </p>
          </>
        );
      default:
        return (
          <>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Create your account</h1>
            <p className="text-muted-foreground mt-2">
              Sign up to start building better products with Databuddy
            </p>
          </>
        );
    }
  };

  // Render content based on current registration step
  const renderContent = () => {
    switch (registrationStep) {
      case "verification-needed":
        return (
          <div className="space-y-5 py-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
              <p className="text-sm">
                Please check your email inbox and click the verification link to activate your account. If you don't see the email, check your spam folder.
              </p>
            </div>

            <div className="flex flex-col space-y-3">
              <Button
                className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                disabled={isLoading}
                onClick={resendVerificationEmail}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Resend verification email"
                )}
              </Button>

              <Button
                variant="outline"
                className="w-full border-amber-200 text-amber-700 hover:bg-amber-50"
                onClick={() => setRegistrationStep("form")}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to registration
              </Button>
            </div>
          </div>
        );
      case "success":
        return (
          <div className="space-y-5 py-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
              <p className="text-sm">
                Your account has been created successfully. You can now sign in to access your dashboard.
              </p>
            </div>

            <Button
              className="w-full bg-green-500 hover:bg-green-600 text-white"
              onClick={() => router.push("/login")}
            >
              Continue to login
            </Button>
          </div>
        );
      default:
        return (
          <div className="space-y-5">
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center h-11 hover:bg-primary/5 transition-all duration-200 cursor-pointer"
                onClick={() => handleSocialLogin("github")}
                disabled={isLoading}
              >
                <Github className="mr-2 h-5 w-5" />
                Sign up with GitHub
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center h-11 hover:bg-primary/5 transition-all duration-200 cursor-pointer"
                onClick={() => handleSocialLogin("google")}
                disabled={isLoading}
              >
                <Mail className="mr-2 h-5 w-5" />
                Sign up with Google
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card px-4 text-sm text-muted-foreground font-medium">
                  or continue with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground font-medium">Full name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  disabled={isLoading}
                  autoComplete="name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-medium">Email address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-foreground font-medium">Password</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Password must be at least 8 characters long</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={formData.password}
                    onChange={handleChange}
                    className="h-11 pr-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-foreground font-medium">Confirm password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="h-11 pr-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <VisuallyHidden>
                <div className="flex items-center space-x-2" id="honeypot">
                  <Checkbox
                    id="honeypot"
                    checked={isHoneypot}
                    onCheckedChange={(checked) => setIsHoneypot(checked as boolean)}
                    disabled={isLoading}
                  />
                </div>
              </VisuallyHidden>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={acceptTerms}
                  onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                  disabled={isLoading}
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary cursor-pointer"
                />
                <Label
                  htmlFor="terms"
                  className="text-sm text-muted-foreground leading-tight"
                >
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    className="text-primary hover:text-primary/80 font-medium"
                    target="_blank"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="text-primary hover:text-primary/80 font-medium"
                    target="_blank"
                  >
                    Privacy Policy
                  </Link>
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full h-11 shadow relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/20"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create account"
                )}
              </Button>
            </form>
          </div>
        );
    }
  };

  return (
    <>
      <div className="text-center mb-8">
        {renderHeaderContent()}
      </div>
      <div className="bg-card rounded-xl shadow p-6 border border-border relative overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          {renderContent()}
        </div>
      </div>
      {registrationStep === "form" && (
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary hover:text-primary/80 font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
      )}
    </>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/20 blur-xl" />
          <Loader2 className="h-8 w-8 animate-spin text-primary relative" />
        </div>
      </div>
    }>
      <RegisterPageContent />
    </Suspense>
  );
} 