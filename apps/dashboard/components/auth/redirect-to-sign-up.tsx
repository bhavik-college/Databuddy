"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@databuddy/auth/client";
import { AuthLoading } from "./auth-loading";

export interface RedirectToSignUpProps {
  returnTo?: string;
}

export function RedirectToSignUp({ returnTo }: RedirectToSignUpProps) {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push(`/register${returnTo ? `?returnTo=${returnTo}` : ""}`);
    }
  }, [isPending, session, router, returnTo]);

  return <AuthLoading />;
} 