import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { Toaster } from "sonner";
import { PostHogProvider } from "./providers/posthog";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import NextTopLoader from 'nextjs-toploader';
import Head from "next/head";
import { TrackingScript } from "@/components/analytics/tracking-script";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Databuddy Analytics - Privacy-First Web Analytics",
  description: "Get powerful analytics without compromising user privacy. Full feature parity with Google Analytics, zero cookies required, and 100% data ownership.",
  keywords: ["analytics", "web analytics", "privacy", "GDPR compliant", "cookieless", "website tracking", "data ownership", "performance analytics", "AI analytics", "privacy-first"],
  authors: [{ name: "Databuddy Team" }],
  creator: "Databuddy Analytics",
  publisher: "Databuddy Analytics",
  metadataBase: new URL("https://databuddy.ai"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.databuddy.cc",
    title: "Databuddy Analytics - Privacy-First Web Analytics",
    description: "Get powerful analytics without compromising user privacy. Full feature parity with Google Analytics, zero cookies required, and 100% data ownership.",
    siteName: "Databuddy Analytics",
    images: [
      {
        url: "/images/og_image.png",
        width: 1200,
        height: 630,
        alt: "Databuddy Analytics Dashboard"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Databuddy Analytics - Privacy-First Web Analytics",
    description: "Get powerful analytics without compromising user privacy. Full feature parity with Google Analytics, zero cookies required, and 100% data ownership.",
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
