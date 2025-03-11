"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, Activity, BarChart2 } from "lucide-react";

interface WebsiteHeaderProps {
  name: string;
  url: string;
}

export function WebsiteHeader({ name, url }: WebsiteHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Button variant="outline" size="sm" asChild className="border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{name}</h1>
          <div className="flex items-center text-slate-400 mt-1">
            <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-sky-400 transition-colors text-sm">
              {url}
              <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white">
            <Activity className="h-4 w-4 mr-2" />
            Check Status
          </Button>
          <Button size="sm" className="bg-sky-600 hover:bg-sky-700 text-white">
            <BarChart2 className="h-4 w-4 mr-2" />
            View Reports
          </Button>
        </div>
      </div>
    </div>
  );
} 