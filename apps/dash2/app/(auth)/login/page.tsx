"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "@databuddy/auth/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Github, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn.email({
        email: formData.email,
        password: formData.password,
        fetchOptions: {
          onSuccess: () => {
            router.push("/home");
          }
        }
      })

      if (result?.error) {
        toast.error("Invalid credentials");
        return;
      }

      toast.success("Logged in successfully");
      router.push("/home");
      router.refresh();
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
            <CardTitle className="text-2xl font-medium text-white">Welcome back</CardTitle>
            <CardDescription className="text-slate-400">
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="bg-slate-700/50 border-slate-600 hover:bg-slate-700/80 hover:text-white text-slate-100 transition-colors duration-200 group relative cursor-pointer"
                onClick={() => signIn.social({ provider: "github", fetchOptions: {
                  onSuccess: () => {
                    router.push("/home");
                  }
                } })}
                disabled={isLoading}
                aria-label="Sign in with Github"
              >
                <Github className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                Github
              </Button>
              <Button
                variant="outline"
                className="bg-slate-700/50 border-slate-600 hover:bg-slate-700/80 hover:text-white text-slate-100 transition-colors duration-200 group relative cursor-pointer"
                onClick={() => signIn.social({ provider: "google", fetchOptions: {
                  onSuccess: () => {
                    router.push("/home");
                  }
                } })}
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
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  <Link
                    href="/forgot-password"
                    className="text-xs text-sky-400 hover:text-sky-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sky-400/20 focus:ring-offset-2 focus:ring-offset-slate-800 rounded"
                  >
                    Forgot password?
                  </Link>
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
                  autoComplete="current-password"
                  aria-label="Password"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-sky-500 hover:bg-sky-600 text-white transition-colors duration-200 focus:ring-2 focus:ring-sky-400/20 focus:ring-offset-2 focus:ring-offset-slate-800"
                disabled={isLoading}
                aria-label={isLoading ? "Signing in..." : "Sign in"}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter>
            <div className="text-center w-full text-sm text-slate-400">
              Don&apos;t have an account?{" "}
              <Link 
                href="/register" 
                className="text-sky-400 hover:text-sky-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sky-400/20 focus:ring-offset-2 focus:ring-offset-slate-800 rounded"
              >
                Create one now
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 