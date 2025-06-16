"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  LineChart,
  Users2,
  Bell,
  Settings2,
} from "lucide-react";

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    color: "text-slate-400",
  },
  {
    label: "Analytics",
    icon: LineChart,
    href: "/dashboard/analytics",
    color: "text-slate-400",
  },
  {
    label: "Users",
    icon: Users2,
    href: "/dashboard/users",
    color: "text-slate-400",
  },
  {
    label: "Notifications",
    icon: Bell,
    href: "/dashboard/notifications",
    color: "text-slate-400",
  },
  {
    label: "Settings",
    icon: Settings2,
    href: "/dashboard/settings",
    color: "text-slate-400",
  },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col space-y-1">
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            "flex items-center gap-x-3 px-3 py-2 text-sm text-slate-400 font-medium hover:bg-slate-800 hover:text-slate-100 border-l-2 border-transparent",
            pathname === route.href && "text-slate-100 bg-slate-800 border-l-2 border-sky-500"
          )}
        >
          <route.icon className={cn("h-4 w-4 stroke-[1.5]", 
            pathname === route.href ? "text-sky-500" : route.color
          )} />
          {route.label}
        </Link>
      ))}
    </nav>
  );
} 