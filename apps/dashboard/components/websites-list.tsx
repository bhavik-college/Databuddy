"use client";

import Link from "next/link";
import { PlusCircle } from "lucide-react";

interface Website {
  id: string;
  name: string;
  url: string;
  slug: string;
  createdAt: string;
  isActive: boolean;
}

interface WebsitesListProps {
  websites: Website[];
}

export default function WebsitesList({ websites }: WebsitesListProps) {
  if (websites.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <h2 className="text-xl font-semibold mb-2">No websites yet</h2>
        <p className="text-gray-500 mb-4">Add your first website to start tracking analytics</p>
        <Link 
          href="/dashboard/websites/new"
          className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Your First Website
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {websites.map((website) => (
        <Link 
          key={website.id} 
          href={`/dashboard/websites/${website.slug}`}
          className="block border rounded-lg p-4 hover:border-blue-500 transition-colors"
        >
          <h2 className="font-semibold text-lg">{website.name}</h2>
          <p className="text-gray-500 text-sm">{website.url}</p>
          <div className="mt-2 flex items-center">
            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${website.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
            <span className="text-sm">{website.isActive ? 'Active' : 'Inactive'}</span>
          </div>
        </Link>
      ))}
      
      <Link 
        href="/dashboard/websites/new"
        className="flex items-center justify-center border rounded-lg p-4 hover:border-blue-500 transition-colors border-dashed"
      >
        <div className="text-center">
          <PlusCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="font-medium">Add New Website</p>
        </div>
      </Link>
    </div>
  );
}
 
