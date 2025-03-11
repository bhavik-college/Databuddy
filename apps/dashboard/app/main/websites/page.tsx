import { Metadata } from "next";
import { DashboardHeader, SectionHeader } from "../components/dashboard-header";
import { WebsitesList } from "../components/websites-list";
import { AddWebsiteDialog } from "@/app/components/dashboard/add-website-dialog";
import { getWebsites } from "../hooks/get-websites";

export const metadata: Metadata = {
  title: "Websites | Databuddy",
  description: "Manage your websites and analytics",
};

export default async function WebsitesPage() {
  const websites = await getWebsites();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <DashboardHeader 
        title="Websites" 
        description="Manage and monitor your websites" 
      />

      {/* Websites List */}
      <SectionHeader 
        title="Your Websites" 
        description={`You have ${websites.length} website${websites.length !== 1 ? 's' : ''}`} 
        action={<AddWebsiteDialog />} 
      />

      <WebsitesList websites={websites} variant="list" />
    </div>
  );
} 