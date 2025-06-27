"use client";

import { MantineProvider } from "@mantine/core";
import { useAuthSession } from "@/app/providers";
import { AuthLoading } from "@/components/auth/auth-loading";
import { RedirectToSignIn } from "@/components/auth/redirect-to-sign-in";
import { Sidebar } from "@/components/layout/sidebar";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuthSession();

  if (isLoading) {
    return <AuthLoading />;
  }

  if (!session) {
    return <RedirectToSignIn />;
  }

  return (
    <div className="h-screen overflow-hidden text-foreground">
      <Sidebar />
      <div className="relative h-screen pt-16 md:pl-72">
        <div className="h-[calc(100vh-4rem)] overflow-y-scroll">{children}</div>
      </div>
    </div>
  );
}
