import { Metadata } from "next";
import { notFound } from "next/navigation";
import { WebsiteHeader } from "./components/website-header";
import { StatsSummary } from "./components/stats-summary";
import { AnalyticsTabs } from "./components/analytics-tabs";
import { TrackingCode } from "./components/tracking-code";
import db from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";



interface WebsitePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: WebsitePageProps): Promise<Metadata> {
  const { slug } = await params;
  
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user) {
    return {
      title: "Website Not Found | Databuddy",
    };
  }

  const website = await db.website.findFirst({
    where: {
      slug,
      userId: session.user.id
    }
  });
  
  if (!website) {
    return {
      title: "Website Not Found | Databuddy",
    };
  }
  
  return {
    title: `${website.name} Analytics | Databuddy`,
    description: `Analytics and insights for ${website.name}`,
  };
}

export default async function WebsitePage({ params }: WebsitePageProps) {
  const { slug } = await params;
  
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user) {
    notFound();
  }

  const website = await db.website.findFirst({
    where: {
      slug,
      userId: session.user.id
    }
  });
  
  if (!website) {
    notFound();
  }
  
  // We'll fetch initial stats on the client side
  // Just provide basic website info for now
  const websiteWithStats = {
    ...website,
    visitors: 0,
    pageViews: 0,
    bounceRate: 0,
    averageTime: 0
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <WebsiteHeader name={website.name} url={website.url} />
      
      <StatsSummary 
        visitors={websiteWithStats.visitors}
        pageViews={websiteWithStats.pageViews}
        bounceRate={websiteWithStats.bounceRate}
        averageTime={websiteWithStats.averageTime}
        websiteId={website.id}
        trackingId={website.trackingId}
      />
      
      <AnalyticsTabs 
        trackingId={website.trackingId}
        websiteUrl={website.url}
        websiteId={website.id}
      />
      
      <TrackingCode trackingId={website.trackingId} />
    </div>
  );
} 