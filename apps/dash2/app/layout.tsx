// import "@/app/once-ui/styles/index.scss";
// import "@/app/once-ui/tokens/index.scss";

import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import NextTopLoader from 'nextjs-toploader';
import "./globals.css";
import { Toaster } from "sonner";
import Providers from "./providers";
import Script from "next/script";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
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
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${jetbrainsMono.variable} h-full`}>
      <head />
      <Script 
        // src="http://localhost:3000/databuddy.js"
        src="https://app.databuddy.cc/databuddy.js"
        data-client-id="5ced32e5-0219-4e75-a18a-ad9826f85698"
        // data-api-url="http://localhost:4000"
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
