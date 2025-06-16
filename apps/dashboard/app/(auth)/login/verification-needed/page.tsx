"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { authClient } from "@databuddy/auth/client";

export default function VerificationNeededPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [isLoading, setIsLoading] = useState(false);

  const sendVerificationEmail = async () => {
    setIsLoading(true);
    try {
      await authClient.sendVerificationEmail({
        email,
        callbackURL: "/home",
        fetchOptions: {
          onSuccess: () => {
            toast.success("Verification email sent!");
            setIsLoading(false);
          },
          onError: () => {
            setIsLoading(false);
            toast.error("Failed to send verification email. Please try again later.");
          },
        },
      });
    } catch (error) {
      setIsLoading(false);
      toast.error("Failed to send verification email. Please try again later.");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto mt-12 bg-card rounded-xl shadow p-6 border border-border relative overflow-hidden">
      <div className="text-center mb-8">
        <div className="inline-flex justify-center items-center p-3 bg-amber-100 rounded-full mb-5 relative w-16 h-16">
          <div className="absolute inset-0 bg-amber-50 rounded-full animate-pulse" />
          <div className="absolute -inset-1 bg-gradient-to-tr from-amber-200 to-amber-100 rounded-full blur-md opacity-70" />
          <div className="relative bg-gradient-to-tr from-amber-500 to-amber-400 rounded-full p-2.5">
            <AlertCircle className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Verify your email</h1>
        <p className="text-muted-foreground mt-2">
          Verification needed for <strong className="text-amber-600 font-medium">{email}</strong>
        </p>
      </div>
      <div className="space-y-5 py-4">
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
          <p className="text-sm">
            Your email <strong>{email}</strong> needs to be verified before you can sign in. Please check your inbox for the verification link.
          </p>
        </div>
        <Button
          className="w-full bg-amber-500 hover:bg-amber-600 text-white"
          disabled={isLoading}
          onClick={sendVerificationEmail}
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
        <Link href="/login">
          <Button
            variant="outline"
            className="w-full border-amber-200 text-amber-700 hover:bg-amber-50"
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