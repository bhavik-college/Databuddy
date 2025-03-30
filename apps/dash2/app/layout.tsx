import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import Providers from "./providers";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Databuddy Dashboard",
    default: "Databuddy Dashboard",
  },
  description: "Powerful analytics dashboard for your websites",
  keywords: ["analytics", "dashboard", "monitoring", "statistics", "web analytics", "tracking"],
  authors: [{ name: "Databuddy" }],
  creator: "Databuddy",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a1a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <head />
      <Script 
        src="http://localhost:3000/databuddy.js"
        data-client-id="5ced32e5-0219-4e75-a18a-ad9826f85698"
        data-api-url="http://localhost:4000"
        data-track-screen-views="true"
        data-track-performance="true"
        data-track-web-vitals="true"
        data-track-errors="true"
        strategy="afterInteractive"
      />
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full min-h-screen bg-background text-foreground flex flex-col`}
      >
        <Providers>
          <main className="flex-1">{children}</main>
        </Providers>
        <Toaster duration={1500} position="top-center" closeButton richColors />
      </body>
    </html>
  );
}
