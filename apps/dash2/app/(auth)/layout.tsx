"use client";

import Iridescence from "@/components/bits/Iridiscence";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { redirect } from "next/navigation";
import { authClient } from "@databuddy/auth/client"

export default function AuthLayout({ children }: { children: React.ReactNode }) {

  const { data: session, isPending } = authClient.useSession()

  if (session && !isPending) {
    redirect("/websites");
  }

  return (
    <div className="flex h-screen">
      {/* Iridescence side */}
      <div className="hidden md:flex md:w-1/2 relative flex-col items-start justify-between p-12 overflow-hidden">
        <div className="absolute inset-0">
          <Iridescence
            color={[0.1, 0.2, 0.9]}
            speed={0.5}
            amplitude={0.2}
          />
        </div>
        <Link href="/" className="relative z-10">
          <Button variant="outline" className="bg-white/20 text-white border-white/10 hover:bg-white/20 group scale-100 hover:scale-105 transition-all duration-200 cursor-pointer">
            <ChevronLeft className="h-4 w-4 group-hover:translate-x-[-4px] transition-all duration-200" />
            Back
          </Button>
        </Link>
        <div className="relative z-10 text-white">
          <h1 className="text-4xl font-bold mb-4">
            Build better <br />products with <br />Databuddy
          </h1>
          <p className="text-white/70 max-w-md">
            Connect your data sources, build insights, and share them with your team.
          </p>
        </div>
      </div>
      {/* Auth form side - Right column */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 bg-background overflow-auto">
        <div className="w-full max-w-md pt-12">
          <Suspense fallback={<div className="flex h-40 items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>}>
            {children}
          </Suspense>
        </div>
      </div>
    </div>
  );
} 