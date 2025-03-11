"use client";

import { AddWebsiteDialog } from "@/app/components/dashboard/add-website-dialog";

interface DashboardHeaderProps {
  title: string;
  description: string;
  showAddWebsite?: boolean;
}

export function DashboardHeader({ title, description, showAddWebsite = false }: DashboardHeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-white">{title}</h1>
      <div className="flex items-center justify-between mt-1">
        <p className="text-slate-400">{description}</p>
        {showAddWebsite && <AddWebsiteDialog />}
      </div>
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function SectionHeader({ title, description, action }: SectionHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h2 className="text-xl font-bold text-white">{title}</h2>
        {description && <p className="text-slate-400 text-sm">{description}</p>}
      </div>
      {action}
    </div>
  );
} 