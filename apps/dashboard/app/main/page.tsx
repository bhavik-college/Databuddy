import { Metadata } from "next";
import { DashboardHeader, SectionHeader } from "@/components/dashboard-header";
import { AnalyticsSummaryCards } from "@/components/analytics-dashboard";
import { DashboardCharts } from "@/components/dashboard-charts";
import WebsitesList from "@/components/websites-list";
import { AddWebsiteDialog } from "@/components/add-website-dialog";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { auth } from "@databuddy/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db, Website } from "@databuddy/db";

export const metadata: Metadata = {
  title: "Dashboard | Databuddy",
  description: "Manage your websites and analytics",
};

function LoadingState() {
  return (
    <div className="flex justify-center items-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <Alert variant="destructive" className="my-6 bg-rose-500/10 border-rose-500/30 text-rose-500">
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

export default async function DashboardPage() {
  // Check authentication
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user) {
    redirect("/login");
  }

  // Fetch websites from the database
  let websites: Website[] = [];
  let websitesError = null;

  try {
    websites = await db.website.findMany({
      where: {
        userId: session.user.id
      }
    });
  } catch (error) {
    console.error("Failed to load websites:", error);
    websitesError = "Failed to load your websites. Please try again later.";
  }

  // Add default analytics data for the WebsitesList component
  const websitesWithAnalytics = websites.map(website => ({
    ...website,
    visitors: 0,
    pageViews: 0,
    bounceRate: 0,
    trend: "+0%",
    averageTime: 0
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      
      {/* Analytics Summary */}
      <SectionHeader 
        title="Analytics Overview" 
        description="Real-time analytics data for all your websites" 
      />
      
      <div className="mb-8">
        <AnalyticsSummaryCards />
      </div>
      
      {/* Analytics Charts */}
      <div className="mb-8">
        <DashboardCharts />
      </div>

      {/* Websites Section */}
      <SectionHeader 
        title="Your Websites" 
        description="Manage and monitor your website analytics" 
        action={<AddWebsiteDialog />} 
      />

      {websitesError ? (
        <ErrorState message={websitesError} />
      ) : (
        // <WebsitesList websites={websitesWithAnalytics as Website[]} variant="grid" />
        <LoadingState />
      )}
    </div>
  );
}
