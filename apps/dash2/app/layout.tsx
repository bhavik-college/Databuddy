import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import Providers from "./providers";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Databuddy Dashboard",
  description: "Analytics dashboard for Databuddy platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <Script id="databuddy-config" strategy="beforeInteractive">
        {`
          window.databuddyConfig = {
            apiUrl: "${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}",
            trackScreenViews: true,
            trackPerformance: true,
            trackWebVitals: true
          };
        `}
      </Script>
      <Script 
        src="/databuddy.js" 
        data-client-id={process.env.NEXT_PUBLIC_ANALYTICS_CLIENT_ID || "5ced32e5-0219-4e75-a18a-ad9826f85698"}
        data-track-screen-views="true"
        data-track-performance="true"
        data-track-web-vitals="true"
        data-track-errors="true"
        strategy="afterInteractive"
      />
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
        </Providers>
        <Toaster duration={1500} position="top-center" closeButton />
      </body>
    </html>
  );
}
