import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { Toaster } from "sonner";
import { PostHogProvider } from "./providers/posthog";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import NextTopLoader from 'nextjs-toploader';
import Head from "next/head";
import { TrackingScript } from "@/components/analytics/tracking-script";
import Script from "next/script";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Databuddy - Privacy-First Web Analytics",
  description: "Experience powerful, privacy-first analytics that matches Google Analytics feature-for-feature without compromising user data. Zero cookies required, 100% data ownership, and AI-powered insights to help your business grow while staying compliant.",
  keywords: ["analytics", "web analytics", "privacy", "GDPR compliant", "cookieless", "website tracking", "data ownership", "performance analytics", "AI analytics", "privacy-first"],
  authors: [{ name: "Databuddy Team" }],
  creator: "Databuddy",
  publisher: "Databuddy",
  metadataBase: new URL("https://www.databuddy.cc"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.databuddy.cc",
    title: "Databuddy - Privacy-First Web Analytics",
    description: "Experience powerful, privacy-first analytics that matches Google Analytics feature-for-feature without compromising user data. Zero cookies required, 100% data ownership, and AI-powered insights to help your business grow while staying compliant.",
    siteName: "Databuddy",
    images: [
      {
        url: "/images/og_image.png",
        width: 1200,
        height: 630,
        alt: "Databuddy Dashboard"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Databuddy - Privacy-First Web Analytics",
    description: "Experience powerful, privacy-first analytics that matches Google Analytics feature-for-feature without compromising user data. Zero cookies required, 100% data ownership, and AI-powered insights to help your business grow while staying compliant.",
    images: ["/images/og_image.png"],
    creator: "@Databuddy_ps",
    site: "@Databuddy_ps"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://www.databuddy.cc",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  userScalable: true,
  colorScheme: "dark"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <Head>
        <NextTopLoader showSpinner={false} />
        <Script 
        src="https://app.databuddy.cc/databuddy.js"
        data-client-id="3ed1fce1-5a56-4cb6-a977-66864f6d18e3"
        data-api-url="https://api.databuddy.cc"
        data-track-screen-views="true"
        data-track-performance="true"
        data-track-web-vitals="true"
        data-track-errors="true"
        data-enable-batching="true"
        data-batch-size="20"
        data-batch-timeout="5000"
        strategy="afterInteractive"
      />
      </Head>
      <PostHogProvider>
        <body
          className={`${poppins.variable} font-sans antialiased bg-slate-950 text-white`}
        >
          <Toaster 
            position="top-right" 
            toastOptions={{
              style: {
                background: "#1e293b",
                color: "#f8fafc",
                border: "1px solid #334155"
              },
              className: "dark-toast"
            }}
          />
          <NuqsAdapter>{children}</NuqsAdapter>
          <TrackingScript trackingId="70ea6264-89df-4de2-8591-e28dca053344" />
        </body>
      </PostHogProvider>
    </html>
  );
}
