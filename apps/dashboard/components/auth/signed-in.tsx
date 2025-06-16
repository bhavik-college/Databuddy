"use client";

import { useSession } from "@databuddy/auth/client";
import { AuthLoading } from "./auth-loading";

export function SignedIn({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return <AuthLoading />;
  }

  if (!session?.user) {
    return null;
  }

  return <>{children}</>;
} 