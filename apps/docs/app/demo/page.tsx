'use client';

import Link from "next/link";
import { Play, BarChart3, Users, Zap, Eye, ArrowRight, Maximize2, Minimize2 } from 'lucide-react';
import Squares from "@/components/bits/squares";
import Image from "next/image";
import { useState } from 'react';

export default function DemoPage() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-black">
        {/* Animated squares background */}
        <div className="absolute inset-0 shadow-2xs">
          <Squares
            direction="diagonal"
            speed={0.5}
            borderColor="rgba(255, 255, 255, 0.1)"
            squareSize={60}
            hoverFillColor="rgba(255, 255, 255, 0.15)"
          />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 pointer-events-none">
          <div className="text-center pointer-events-auto">
            {/* Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-800 px-3 py-1.5">
              <Play className="h-3 w-3 text-sky-400" />
              <span className="text-xs text-neutral-300">
                Interactive Demo
              </span>
            </div>

            {/* Title */}
            <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight text-white lg:text-6xl">
              See Databuddy in action
            </h1>

            {/* Subtitle */}
            <p className="mx-auto mb-12 max-w-2xl text-xl leading-relaxed text-neutral-400">
              Watch how our privacy-first analytics provides powerful insights without compromising your visitors' privacy or your site's performance.
            </p>

            {/* Demo Container */}
            <div className={`transition-all duration-300 ${isFullscreen
              ? 'fixed inset-0 z-50 bg-black p-2 sm:p-4 flex flex-col' // Add flex-col for mobile stacking
              : 'mx-auto max-w-[100vw] sm:max-w-[95vw]'
              }`} style={isFullscreen ? { minHeight: '100dvh', minWidth: '100vw' } : {}}>
              <div className="relative overflow-hidden rounded-lg sm:rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl h-full flex flex-col" style={{ minHeight: isFullscreen ? '100dvh' : '60vw' }}>
                <div className="flex items-center justify-between border-b border-neutral-700 bg-neutral-800/50 px-4 sm:px-6 py-3 sm:py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-500" />
                      <div className="h-3 w-3 rounded-full bg-yellow-500" />
                      <div className="h-3 w-3 rounded-full bg-green-500" />
                    </div>
                    <span className="text-sm font-medium text-neutral-400">
                      Databuddy Analytics Dashboard
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                      <span className="text-xs text-neutral-400">Live Demo</span>
                    </div>
                    <button
                      onClick={toggleFullscreen}
                      className="flex items-center gap-2 px-3 py-2 sm:py-1.5 text-xs text-neutral-400 hover:text-white hover:bg-neutral-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400"
                      data-track="demo-fullscreen-toggle"
                      data-section="demo"
                      data-action={isFullscreen ? 'exit-fullscreen' : 'enter-fullscreen'}
                      style={{ minWidth: 110 }}
                      type="button"
                    >
                      {isFullscreen ? (
                        <>
                          <Minimize2 className="h-4 w-4" />
                          <span className="hidden xs:inline">Exit Fullscreen</span>
                          <span className="inline xs:hidden">Exit</span>
                        </>
                      ) : (
                        <>
                          <Maximize2 className="h-4 w-4" />
                          <span className="hidden xs:inline">Fullscreen</span>
                          <span className="inline xs:hidden">Full</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className={`bg-black flex-1 ${isFullscreen ? 'h-[calc(100dvh-56px)]' : ''}`}
                  style={isFullscreen
                    ? { height: 'calc(100dvh - 56px)', minHeight: 200 }
                    : { height: '60vw', minHeight: 200, width: '100%' }
                  }
                >
                  <iframe
                    src="https://app.databuddy.cc/demo/OXmNQsViBT-FOS_wZCTHc"
                    className="h-full w-full border-0 min-h-[200px] rounded-b-lg sm:rounded-b-xl"
                    title="Databuddy Analytics Demo Dashboard"
                    loading="lazy"
                    data-track="demo-iframe-interaction"
                    data-section="demo"
                    data-demo-type="live-dashboard"
                    allow="web-share"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-neutral-800 bg-black py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              What You'll See in the Demo
            </h2>
            <p className="text-neutral-400 max-w-2xl mx-auto">
              Experience all the key features that make Databuddy the fastest, most privacy-focused analytics platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="relative">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 mb-4">
                <BarChart3 className="h-6 w-6 text-sky-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Real-time Analytics</h3>
              <p className="text-sm text-neutral-400">
                Watch data update instantly as visitors interact with your website. No delays, no data sampling.
              </p>
            </div>

            <div className="relative">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 mb-4">
                <Users className="h-6 w-6 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Privacy-First</h3>
              <p className="text-sm text-neutral-400">
                See detailed insights without compromising visitor privacy. No cookies, fully GDPR compliant.
              </p>
            </div>

            <div className="relative">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 mb-4">
                <Zap className="h-6 w-6 text-yellow-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">65x Faster</h3>
              <p className="text-sm text-neutral-400">
                Experience lightning-fast loading that improves your Core Web Vitals and SEO rankings.
              </p>
            </div>

            <div className="relative">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 mb-4">
                <Eye className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Beautiful UI</h3>
              <p className="text-sm text-neutral-400">
                Explore intuitive dashboards with customizable reports and actionable insights.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="border-t border-neutral-800 bg-black py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-6">
                Everything you need to grow
              </h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-sky-400 mt-2" />
                  <div>
                    <h3 className="font-semibold text-white mb-1">Real-time visitor tracking</h3>
                    <p className="text-sm text-neutral-400">See active users, page views, and conversions as they happen</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-sky-400 mt-2" />
                  <div>
                    <h3 className="font-semibold text-white mb-1">Geographic insights</h3>
                    <p className="text-sm text-neutral-400">Understand where your visitors come from with detailed location data</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-sky-400 mt-2" />
                  <div>
                    <h3 className="font-semibold text-white mb-1">Performance monitoring</h3>
                    <p className="text-sm text-neutral-400">Track Core Web Vitals, page load times, and user experience metrics</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-sky-400 mt-2" />
                  <div>
                    <h3 className="font-semibold text-white mb-1">Traffic sources</h3>
                    <p className="text-sm text-neutral-400">Identify your best-performing referrers, campaigns, and search terms</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-sky-400 mt-2" />
                  <div>
                    <h3 className="font-semibold text-white mb-1">Custom events & conversions</h3>
                    <p className="text-sm text-neutral-400">Track specific actions and conversions that matter to your business</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl border border-neutral-800 bg-neutral-900 p-8">
                <Image src="/demo-thumbnail.webp" alt="Dashboard Preview" width={500} height={500} className="rounded-2xl" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-neutral-800 bg-black py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to get started?
          </h2>
          <p className="text-xl text-neutral-400 mb-8 max-w-2xl mx-auto">
            Join thousands of developers who've switched to faster, privacy-first analytics. Get insights in minutes, not hours.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="https://app.databuddy.cc/register"
              className="inline-flex items-center justify-center w-full px-8 py-4 text-base font-medium text-white transition-all duration-300 bg-neutral-800 border border-neutral-700 rounded-lg sm:w-auto hover:bg-neutral-700"
              data-track="demo-cta-start-trial-click"
              data-section="demo-cta"
              data-button-type="primary-cta"
              data-destination="register"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center justify-center w-full px-8 py-4 text-base font-medium text-neutral-300 transition-all duration-300 border border-neutral-700 bg-transparent rounded-lg sm:w-auto hover:border-neutral-600 hover:bg-neutral-900/50 hover:text-white"
              data-track="demo-cta-docs-click"
              data-section="demo-cta"
              data-button-type="secondary-cta"
              data-destination="docs"
            >
              View Documentation
            </Link>
          </div>

          <p className="text-sm text-neutral-500 mt-8">
            Questions about the demo?
            <a
              href="mailto:support@databuddy.cc"
              className="text-sky-400 hover:underline ml-1"
              data-track="demo-support-email-click"
              data-section="demo-cta"
              data-link-type="support-contact"
            >
              Contact our support team
            </a>
          </p>
        </div>
      </section>
    </div>
  );
} 