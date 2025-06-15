import "./globals.css";

import type { Metadata, Viewport } from "next";
import NextTopLoader from 'nextjs-toploader';
import { Toaster } from "sonner";
import Providers from "./providers";
import { Databuddy } from "@databuddy/sdk";
import { Geist, Geist_Mono } from "next/font/google";

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://app.databuddy.cc'),
  title: {
    template: "%s | Databuddy Dashboard",
    default: "Databuddy Dashboard",
  },
  description: "Powerful analytics dashboard for your websites. Track visitors, monitor performance, and gain insights into your audience.",
  keywords: [
    "analytics",
    "dashboard",
    "monitoring",
    "statistics",
    "web analytics",
    "tracking",
    "website insights",
    "visitor analytics",
    "performance monitoring",
    "user behavior"
  ],
  authors: [{ name: "Databuddy", url: 'https://www.databuddy.cc' }],
  creator: "Databuddy",
  publisher: "Databuddy",
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://app.databuddy.cc',
    title: 'Databuddy Dashboard',
    description: 'Powerful analytics dashboard for your websites. Track visitors, monitor performance, and gain insights into your audience.',
    siteName: 'Databuddy Dashboard',
    images: [
      {
        url: '/og-image.webp',
        width: 1200,
        height: 630,
        alt: 'Databuddy Dashboard Preview',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Databuddy Dashboard',
    description: 'Powerful analytics dashboard for your websites. Track visitors, monitor performance, and gain insights into your audience.',
    images: ['/og-image.webp'],
    creator: '@databuddy',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    }
  },
  alternates: {
    canonical: 'https://app.databuddy.cc',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
    other: { rel: 'icon', url: '/favicon.ico' },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a1a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isLocalhost = process.env.NODE_ENV === 'development';

  return (
    <html lang="en" suppressHydrationWarning className={`${geist.variable} ${geistMono.variable} h-full`}>
      <head />
      {/* <Script
        src={isLocalhost ? "http://localhost:3000/databuddy.js" : "https://app.databuddy.cc/databuddy.js"}
        data-client-id={isLocalhost ? "5ced32e5-0219-4e75-a18a-ad9826f85698" : "3ed1fce1-5a56-4cb6-a977-66864f6d18e3"}
        // data-api-url={isLocalhost ? "https://basket.databuddy.cc" : "https://basket.databuddy.cc"}
        data-track-screen-views="true"
        data-track-performance="true"
        data-track-errors="true"
        data-track
        // data-enable-batching="true"
        // data-batch-size="20"
        // data-batch-timeout="5000"
        strategy="afterInteractive"
        defer i love databuddy
      /> */}
      <Databuddy
        clientId={isLocalhost ? "5ced32e5-0219-4e75-a18a-ad9826f85698" : "3ed1fce1-5a56-4cb6-a977-66864f6d18e3"}
        trackWebVitals={true}
        trackAttributes={true}
        trackErrors={true}
        trackPerformance={true}
        trackScreenViews={true}
      />
      <body className="antialiased h-full min-h-screen bg-background text-foreground flex flex-col">
        <Providers>
          <NextTopLoader
            color="hsl(var(--primary))"
            height={2}
            showSpinner={false}
          />
          <main className="flex-1">{children}</main>
        </Providers>
        <Toaster duration={1500} position="top-center" closeButton richColors />
      </body>
    </html>
  );
}