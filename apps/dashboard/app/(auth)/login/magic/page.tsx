"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { signIn } from "@databuddy/auth/client";

export default function MagicLinkPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }
    setIsLoading(true);
    try {
      await signIn.magicLink({
        email,
        callbackURL: "/home",
        fetchOptions: {
          onSuccess: () => {
            setIsLoading(false);
            toast.success("Magic link sent! Please check your email.");
            router.push(`/login/magic-sent?email=${encodeURIComponent(email)}`);
          },
          onError: () => {
            setIsLoading(false);
            toast.error("Failed to send magic link. Please try again.");
          },
        },
      });
    } catch (error) {
      setIsLoading(false);
      toast.error("Failed to send magic link. Please try again.");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto mt-12 bg-card rounded-xl shadow p-6 border border-border relative overflow-hidden">
      <div className="text-center mb-8">
        <div className="inline-flex justify-center items-center p-3 bg-blue-100 rounded-full mb-5 relative w-16 h-16">
          <div className="absolute inset-0 bg-blue-50 rounded-full animate-pulse" />
          <div className="absolute -inset-1 bg-gradient-to-tr from-blue-200 to-blue-100 rounded-full blur-md opacity-70" />
          <div className="relative bg-gradient-to-tr from-blue-500 to-blue-400 rounded-full p-2.5">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Sign in with magic link</h1>
        <p className="text-muted-foreground mt-2">No password needed — just use your email</p>
      </div>
      <form onSubmit={handleMagicLinkLogin} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="magic-email" className="text-foreground font-medium">Email address</Label>
          <Input
            id="magic-email"
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
            placeholder="name@example.com"
          />
        </div>
        <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800 flex gap-2">
          <Sparkles className="h-5 w-5 flex-shrink-0 text-blue-500" />
          <p>We'll send a secure link to your email that will sign you in instantly — no password needed.</p>
        </div>
        <Button
          type="submit"
          className="w-full h-11 bg-blue-500 hover:bg-blue-600 text-white"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending magic link...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Send magic link
            </>
          )}
        </Button>
        <Link href="/login" className="block mt-4">
          <Button
            variant="outline"
            className="w-full border-blue-200 hover:bg-blue-50"
            type="button"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to login
          </Button>
        </Link>
      </form>
    </div>
  );
} 