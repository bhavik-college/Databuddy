"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginWithEmail, registerWithEmail, loginWithGithub, loginWithGoogle } from "@databuddy/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Github, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type AuthFormProps = {
  view: "signIn" | "signUp" | "forgotPassword" | "resetPassword" | "verifyEmail" | "verifyPassword";
  redirectTo?: string;
  callbackURL?: string;
  className?: string;
};

export function AuthForm({
  view,
  redirectTo,
  callbackURL,
  className,
}: AuthFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    code: "",
    name: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (view === "signIn") {
        const result = await loginWithEmail(formData.email, formData.password, {
          redirectUrl: redirectTo,
          router,
          onError: (error) => {
            toast.error("Invalid credentials");
          }
        });

        if (!result.error) {
          toast.success("Logged in successfully");
        }
      } else if (view === "signUp") {
        if (formData.password !== formData.confirmPassword) {
          toast.error("Passwords do not match");
          return;
        }

        const result = await registerWithEmail(
          formData.email,
          formData.password,
          formData.name,
          {
            redirectUrl: redirectTo,
            router,
            onError: (error) => {
              toast.error("Failed to create account");
            }
          }
        );

        if (!result.error) {
          toast.success("Account created successfully");
        }
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: "github" | "google") => {
    setIsLoading(true);
    try {
      const result = provider === "github" 
        ? await loginWithGithub({ redirectUrl: redirectTo, router })
        : await loginWithGoogle({ redirectUrl: redirectTo, router });

      if (result.error) {
        toast.error(`Failed to sign in with ${provider}`);
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {(view === "signIn" || view === "signUp") && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="bg-slate-700/50 border-slate-600 hover:bg-slate-700/80 hover:text-white text-slate-100 transition-colors duration-200 group relative cursor-pointer"
              onClick={() => handleSocialSignIn("github")}
              disabled={isLoading}
              aria-label="Sign in with Github"
            >
              <Github className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
              Github
            </Button>
            <Button
              variant="outline"
              className="bg-slate-700/50 border-slate-600 hover:bg-slate-700/80 hover:text-white text-slate-100 transition-colors duration-200 group relative cursor-pointer"
              onClick={() => handleSocialSignIn("google")}
              disabled={isLoading}
              aria-label="Sign in with Google"
            >
              <Mail className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
              Google
            </Button>
          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-800 px-2 text-slate-400">
                Or continue with email
              </span>
            </div>
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {view === "signUp" && (
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white">Full name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="John Doe"
              required
              value={formData.name}
              onChange={handleChange}
              className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-sky-400 focus:ring-sky-400/10 transition-colors duration-200"
              disabled={isLoading}
              autoComplete="name"
              aria-label="Full name"
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="text-white">Email address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="name@example.com"
            required
            value={formData.email}
            onChange={handleChange}
            className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-sky-400 focus:ring-sky-400/10 transition-colors duration-200"
            disabled={isLoading}
            autoComplete="email"
            aria-label="Email address"
          />
        </div>

        {(view === "signIn" || view === "signUp" || view === "resetPassword") && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-white">Password</Label>
              {view === "signIn" && (
                <a
                  href="/forgot-password"
                  className="text-xs text-sky-400 hover:text-sky-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sky-400/20 focus:ring-offset-2 focus:ring-offset-slate-800 rounded"
                >
                  Forgot password?
                </a>
              )}
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-sky-400 focus:ring-sky-400/10 transition-colors duration-200"
              disabled={isLoading}
              autoComplete={view === "signIn" ? "current-password" : "new-password"}
              aria-label="Password"
            />
          </div>
        )}

        {view === "signUp" && (
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-white">Confirm password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-sky-400 focus:ring-sky-400/10 transition-colors duration-200"
              disabled={isLoading}
              autoComplete="new-password"
              aria-label="Confirm password"
            />
          </div>
        )}

        {(view === "verifyEmail" || view === "verifyPassword") && (
          <div className="space-y-2">
            <Label htmlFor="code" className="text-white">Verification code</Label>
            <Input
              id="code"
              name="code"
              type="text"
              required
              value={formData.code}
              onChange={handleChange}
              className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-sky-400 focus:ring-sky-400/10 transition-colors duration-200"
              disabled={isLoading}
              autoComplete="one-time-code"
              aria-label="Verification code"
            />
          </div>
        )}

        <Button
          type="submit"
          className="w-full bg-sky-500 hover:bg-sky-600 text-white transition-colors duration-200 focus:ring-2 focus:ring-sky-400/20 focus:ring-offset-2 focus:ring-offset-slate-800"
          disabled={isLoading}
          aria-label={isLoading ? "Processing..." : view === "signIn" ? "Sign in" : "Sign up"}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            view === "signIn" ? "Sign in" : "Sign up"
          )}
        </Button>
      </form>
    </div>
  );
} 