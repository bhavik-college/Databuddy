"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerWithEmail } from "@databuddy/auth/auth-helpers";
import { authClient } from "@databuddy/auth/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Github, Mail, Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import VisuallyHidden from "@/components/ui/visuallyhidden";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function RegisterPage() {
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
      // Use authClient.signUp.email to register the user
      const result = await authClient.signUp.email({
        email: formData.email,
        password: formData.password,
        name: formData.name
      });

      if (result.error) {
        toast.error(result.error.message || "Failed to create account");
        return;
      }

      toast.success("Account created! Please check your email to verify your account.");
      router.push(`/verify?email=${encodeURIComponent(formData.email)}`);
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

  const handleSocialLogin = async (provider: "github" | "google") => {
    setIsLoading(true);
    try {
      await authClient.signIn.social({ 
        provider: provider, 
        fetchOptions: {
          onSuccess: () => {
            router.push("/home");
          }
        } 
      });
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

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
            <CardTitle className="text-2xl font-medium text-white">Create your account</CardTitle>
            <CardDescription className="text-slate-400">
              Get started with Databuddy analytics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="bg-slate-700/50 border-slate-600 hover:bg-slate-700/80 hover:text-white text-slate-100 transition-colors duration-200 group relative cursor-pointer"
                onClick={() => handleSocialLogin("github")}
                disabled={isLoading}
                aria-label="Sign up with Github"
              >
                <Github className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                Github
              </Button>
              <Button
                variant="outline"
                className="bg-slate-700/50 border-slate-600 hover:bg-slate-700/80 hover:text-white text-slate-100 transition-colors duration-200 group relative cursor-pointer"
                onClick={() => handleSocialLogin("google")}
                disabled={isLoading}
                aria-label="Sign up with Google"
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
            <form onSubmit={handleSubmit} className="space-y-4">
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
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-white">Password</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-slate-400 hover:text-slate-300 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Password must be at least 8 characters long</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={handleChange}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-sky-400 focus:ring-sky-400/10 transition-colors duration-200"
                  disabled={isLoading}
                  autoComplete="new-password"
                  aria-label="Password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  minLength={8}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-sky-400 focus:ring-sky-400/10 transition-colors duration-200"
                  disabled={isLoading}
                  autoComplete="new-password"
                  aria-label="Confirm password"
                />
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
                  className="border-slate-600 data-[state=checked]:bg-sky-500 data-[state=checked]:border-sky-500"
                  aria-label="Accept terms and conditions"
                />
                <Label
                  htmlFor="terms"
                  className="text-sm font-medium leading-none text-slate-400 cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I agree to the{" "}
                  <Link href="/terms" className="text-sky-400 hover:text-sky-300 transition-colors duration-200">
                    terms and conditions
                  </Link>
                </Label>
              </div>
              <Button
                type="submit"
                className="w-full mt-6 bg-sky-600 hover:bg-sky-700 text-white transition-colors duration-200"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-slate-700/50 pt-4">
            <div className="text-sm text-slate-400">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-sky-400 hover:text-sky-300 transition-colors duration-200"
              >
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 