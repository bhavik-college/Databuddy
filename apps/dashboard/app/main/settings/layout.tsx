"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Card } from "@/components/ui/card";
import { 
  User, 
  Settings, 
  CreditCard, 
  Bell, 
  Shield, 
  Key
} from "lucide-react";

interface SettingsLayoutProps {
  children: ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname();

  const navItems = [
    {
      title: "Profile",
      href: "/dashboard/settings/profile",
      icon: <User className="h-4 w-4" />,
      active: pathname === "/dashboard/settings/profile"
    },
    {
      title: "Account",
      href: "/dashboard/settings/account",
      icon: <Settings className="h-4 w-4" />,
      active: pathname === "/dashboard/settings/account"
    },
    {
      title: "Billing",
      href: "/dashboard/settings/billing",
      icon: <CreditCard className="h-4 w-4" />,
      active: pathname === "/dashboard/settings/billing"
    },
    {
      title: "Notifications",
      href: "/dashboard/settings/notifications",
      icon: <Bell className="h-4 w-4" />,
      active: pathname === "/dashboard/settings/notifications"
    },
    {
      title: "Security",
      href: "/dashboard/settings/security",
      icon: <Shield className="h-4 w-4" />,
      active: pathname === "/dashboard/settings/security"
    },
    {
      title: "API Keys",
      href: "/dashboard/settings/api-keys",
      icon: <Key className="h-4 w-4" />,
      active: pathname === "/dashboard/settings/api-keys"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 mt-1">Manage your account settings and preferences</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0">
          <Card className="bg-slate-900/80 border-slate-800/80 backdrop-blur-sm overflow-hidden">
            <div className="p-2">
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      item.active
                        ? "bg-sky-500/20 text-sky-400"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    {item.icon}
                    {item.title}
                  </Link>
                ))}
              </nav>
            </div>
          </Card>
        </div>

        {/* Content */}
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
} 