import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog | Databuddy Analytics",
  description: "Explore the latest insights on privacy-first web analytics, data ownership, and website performance optimization.",
  keywords: ['web analytics blog', 'privacy-first analytics', 'GDPR compliant analytics', 'website performance', 'data ownership'],
  openGraph: {
    title: 'Blog | Databuddy Analytics',
    description: 'Explore the latest insights on privacy-first web analytics, data ownership, and website performance optimization.',
    type: 'website',
    url: 'https://www.databuddy.cc/blog',
  },
  alternates: {
    canonical: 'https://www.databuddy.cc/blog',
  }
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 