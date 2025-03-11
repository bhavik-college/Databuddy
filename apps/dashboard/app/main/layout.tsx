"use client";

import { ReactNode, Suspense } from "react";
import Link from "next/link";
import { LayoutDashboard, Globe, User, Settings, Menu, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { UserDropdown } from "@/app/components/layout/user-dropdown";
import { useSession } from "@/lib/auth-client";

interface DashboardLayoutProps {
  children: ReactNode;
}

const Loading = () => {
  return (
    <div className="flex justify-center items-center h-screen">
      <Loader2 className="h-10 w-10 animate-spin" />
    </div>
  );
};

function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  if (isPending) {
    return <Loading />;
  }

  if (!session && !isPending) {
    router.push("/login");
    return <Loading />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <header className="border-b border-sky-500/20 bg-slate-950/80 backdrop-blur-xl py-3">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="relative group flex items-center">
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-sky-400 via-blue-500 to-sky-600 bg-clip-text text-transparent tracking-tight">
                Databuddy
              </span>
              <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-sky-500/20 to-blue-500/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            
            <nav className="hidden md:block">
              <ul className="flex items-center gap-6">
                <li>
                  <Link href="/dashboard" className="text-slate-300 hover:text-sky-400 font-medium transition-colors flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/websites" className="text-slate-300 hover:text-sky-400 font-medium transition-colors flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Websites
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/settings/profile" className="text-slate-300 hover:text-sky-400 font-medium transition-colors flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/settings/account" className="text-slate-300 hover:text-sky-400 font-medium transition-colors flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </li>
              </ul>
            </nav>
            
            <div className="flex items-center gap-4">
              {/* User dropdown for desktop */}
              <div className="hidden md:block">
                {session?.user && <UserDropdown user={session.user} />}
              </div>
              
              {/* Mobile menu button */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden text-slate-300 hover:text-white hover:bg-slate-800/50"
              >
                <Menu className="h-6 w-6" />
                <span className="sr-only">Menu</span>
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        {children}
      </main>
    </div>
  );
} 

export default function Page({ children }: { children: ReactNode }) {
  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
}