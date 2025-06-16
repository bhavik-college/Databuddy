"use client";

import { useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import Link from "next/link";
import { signIn } from "@databuddy/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Github, Mail, Loader2, Sparkles, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleLogin = () => {
    setIsLoading(true);
    signIn.social({
      provider: "google",
      callbackURL: "/home",
      fetchOptions: {
        onSuccess: () => {
          toast.success("Login successful!");
        },
        onError: () => {
          setIsLoading(false);
          toast.error("Google login failed. Please try again.");
        },
      },
    });
  };

  const handleGithubLogin = () => {
    setIsLoading(true);
    signIn.social({
      provider: "github",
      callbackURL: "/home",
      fetchOptions: {
        onSuccess: () => {
          toast.success("Login successful!");
        },
        onError: () => {
          setIsLoading(false);
          toast.error("GitHub login failed. Please try again.");
        },
      },
    });
  };

  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    setIsLoading(true);
    try {
      const result = await signIn.email({
        email,
        password,
        callbackURL: "/home",
        fetchOptions: {
          onSuccess: () => {
            toast.success("Login successful!");
          },
          onError: (error) => {
            setIsLoading(false);
            if (error?.error?.code === "EMAIL_NOT_VERIFIED" || error?.error?.message?.toLowerCase().includes("not verified")) {
              router.push(`/login/verification-needed?email=${encodeURIComponent(email)}`);
            } else {
              toast.error(error?.error?.message || "Login failed. Please check your credentials and try again.");
            }
          },
        },
      });

      if (result?.error) {
        toast.error("Invalid credentials");
        return;
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
        <p className="text-muted-foreground mt-2">
          Sign in to your account to continue your journey with Databuddy
        </p>
      </div>
      <div className="bg-card rounded-xl shadow p-6 border border-border relative overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="space-y-6">
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center h-11 hover:bg-primary/5 transition-all duration-200 cursor-pointer"
                onClick={handleGithubLogin}
                disabled={isLoading}
              >
                <Github className="mr-2 h-5 w-5" />
                Sign in with GitHub
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center h-11 hover:bg-primary/5 transition-all duration-200 cursor-pointer"
                onClick={handleGoogleLogin}
                disabled={isLoading}
              >
                <Mail className="mr-2 h-5 w-5" />
                Sign in with Google
              </Button>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card px-4 text-sm text-muted-foreground font-medium">
                  or continue with
                </span>
              </div>
            </div>
            <form onSubmit={handleEmailPasswordLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  placeholder="you@example.com"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-foreground font-medium">Password</Label>
                  <Link href="/login/forgot" className="text-xs text-primary p-0 h-auto cursor-pointer">Forgot password?</Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 pr-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                    placeholder="••••••••"
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
              <Button
                type="submit"
                className="w-full h-11 shadow relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/20"
                disabled={isLoading}
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
              <Link href="/login/magic" passHref>
                <Button
                  type="button"
                  variant="link"
                  className="w-full text-primary hover:text-primary/80 font-medium flex items-center justify-center cursor-pointer"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Sign in with magic link
                </Button>
              </Link>
            </form>
          </div>
        </div>
      </div>
      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="text-primary hover:text-primary/80 font-medium"
          >
            Sign up
          </Link>
        </p>
      </div>
    </>
  );
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/20 blur-xl" />
          <Loader2 className="h-8 w-8 animate-spin text-primary relative" />
        </div>
      </div>
    }>
      <LoginPage />
    </Suspense>
  );
} 