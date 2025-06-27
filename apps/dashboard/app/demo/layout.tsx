"use client";

import { Sidebar } from "./[id]/_components/layout/demo-sidebar";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-background to-muted/20 text-foreground">
      <Sidebar />
      <div className="relative h-screen pt-16 md:pl-72">
        <div className="h-[calc(100vh-4rem)] overflow-y-scroll">{children}</div>
      </div>
    </div>
  );
}
