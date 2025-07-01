"use client";

import { Sidebar } from "@/components/layout/sidebar";

export default function MainLayout({ children }: { children: React.ReactNode }) {

  return (
    <div className="h-screen overflow-hidden text-foreground">
      <Sidebar />
      <div className="relative h-screen pt-16 md:pl-72">
        <div className="h-[calc(100vh-4rem)] overflow-y-scroll">{children}</div>
      </div>
    </div>
  );
}
