"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Users,
  Globe,
  Network,
  Settings,
  LayoutDashboard,
  UserCircle,
  Activity,
  Zap,
  TrendingUp,
  X,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

const navLinks = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/events", label: "Events", icon: Activity },
  { href: "/blocked-traffic", label: "Blocked Traffic", icon: ShieldAlert },
  { href: "/events/realtime", label: "Real-Time Events", icon: TrendingUp },
  { href: "/users", label: "Users", icon: Users },
  { href: "/websites", label: "Websites", icon: Globe },
  { href: "/domains", label: "Domains", icon: Network },
  { href: "/query-performance", label: "Query Performance", icon: Zap },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-48 h-screen bg-background border-r shadow-lg sticky top-0 z-30 overflow-y-auto scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent">
      {/* Logo/Header */}
      <div className="flex items-center justify-between h-16 px-6 border-b">
        <Link href="/admin" className="flex items-center gap-2 text-xl font-bold text-primary">
          <LayoutDashboard className="h-7 w-7" />
          <span>Databuddy</span>
        </Link>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            onKeyDown={(e) => e.key === 'Enter' && onClose()}
            className="md:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-2 py-6 px-2">
        {navLinks.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors hover:bg-muted/60 hover:text-primary ${pathname === href ? "bg-muted text-primary" : "text-muted-foreground"
              }`}
            aria-current={pathname === href ? "page" : undefined}
            onClick={onClose}
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      {/* Theme Toggle */}
      <div className="p-4 border-t">
        <div className="flex items-center justify-center">
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
} 