"use client";

import { Sidebar } from "./[id]/_components/layout/demo-sidebar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen bg-gradient-to-br from-background to-muted/20 text-foreground overflow-hidden">
      <Sidebar />
      <div className="md:pl-72 pt-16 h-screen relative">
        <div className="h-[calc(100vh-4rem)] overflow-y-scroll">
          {children}
        </div>
      </div>
    </div>
  );
}  