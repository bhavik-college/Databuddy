"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, MailCheck, ChevronLeft, Sparkles } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { signIn } from "@databuddy/auth/client";

export default function MagicSentPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [isLoading, setIsLoading] = useState(false);

  const handleResend = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("No email found");
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
            <MailCheck className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Check your email</h1>
        <p className="text-muted-foreground mt-2">
          Magic link sent to <strong className="text-blue-600 font-medium">{email}</strong>
        </p>
      </div>
      <div className="space-y-5 py-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
          <p className="text-sm">
            We've sent a magic link to <strong>{email}</strong>. Please check your inbox and click the link to sign in instantly.
          </p>
        </div>
        <Button
          className="w-full bg-blue-500 hover:bg-blue-600 text-white"
          disabled={isLoading}
          onClick={handleResend}
          type="button"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            "Resend magic link"
          )}
        </Button>
        <Link href="/login">
          <Button
            variant="outline"
            className="w-full border-blue-200 hover:bg-blue-50"
            type="button"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to login
          </Button>
        </Link>
      </div>
    </div>
  );
} 