"use client";

import { useState } from "react";
import Link from "next/link";
import Squares from "../bits/squares";
import Image from "next/image";

const codeSnippets = [
	{
		name: "Script",
		code: `<!-- Add to your HTML head -->
<script 
  src="https://app.databuddy.cc/databuddy.js"
  data-site-id="your-site-id"
  data-auto-track="true"
  defer>
</script>

<!-- That's it! Analytics start automatically -->`,
	},
	{
		name: "NPM",
		code: `// Install via npm/yarn/pnpm
npm install @databuddy/sdk

// React/Next.js setup
import { Databuddy } from '@databuddy/sdk';

<Databuddy 
  siteId="your-site-id"
  trackPageViews={true}
  trackClicks={true}
/>`,
	},
	{
		name: "Events",
		code: `// Track custom events
databuddy.track('button_click', {
  button: 'signup',
  page: 'landing'
});

// Track conversions
databuddy.track('purchase', {
  value: 99.99,
  currency: 'USD',
  item: 'Pro Plan'
});`,
	},
];

export default function Hero() {
	const [activeTab, setActiveTab] = useState(0);

	return (
		<section className="relative min-h-screen overflow-hidden bg-black">
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
				<div className="grid min-h-[70vh] grid-cols-1 items-center gap-16 lg:grid-cols-2">
					{/* Left side - Content */}
					<div className="text-center lg:text-left relative pointer-events-auto">
						<Link
							href="/blog/we-are-gdpr-compliant"
							className="group mb-8 inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-800 px-3 py-1.5 transition-colors hover:border-neutral-600 pointer-events-auto"
						>
							<div className="h-2 w-2 rounded-full bg-green-500" />
							<span className="text-xs text-neutral-300">
								GDPR & CCPA COMPLIANT
							</span>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="12"
								height="12"
								fill="none"
								viewBox="0 0 24 24"
								className="text-neutral-500 transition-transform group-hover:translate-x-1"
							>
								<title>Arrow</title>
								<path
									stroke="currentColor"
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
									d="M17 8l4 4m0 0l-4 4m4-4H3"
								/>
							</svg>
						</Link>

						<h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight lg:text-6xl">
							<span className="text-white">Privacy-First Analytics</span>
							<br />
							<span className="text-white">that Outperforms Google</span>
						</h1>

						<p className="mx-auto mb-8 max-w-lg text-lg leading-relaxed text-neutral-400 lg:mx-0">
							Gain powerful insights without compromising user privacy. 65x faster than Google Analytics,
							with zero cookies required and complete data ownership.
						</p>

						<div className="flex flex-col sm:flex-row justify-center gap-4 lg:justify-start">
							<Link
								href="https://app.databuddy.cc"
								className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white transition-all duration-200 bg-neutral-800 border border-neutral-700 rounded-xl hover:bg-neutral-700 pointer-events-auto shadow-lg hover:shadow-xl transform hover:scale-105"
							>
								Get Started Free
							</Link>
							<Link
								href="/demo"
								className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-neutral-400 transition-all duration-200 hover:text-white pointer-events-auto"
							>
								View Live Demo →
							</Link>
						</div>
					</div>

					{/* Right side - Code Editor */}
					<div className="hidden lg:block pointer-events-auto">
						<div className="relative">
							<div className="relative overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900">
								<div className="flex items-center justify-between border-b border-neutral-700 bg-neutral-800/50 px-6 py-4">
									<div className="flex items-center gap-3">
										<div className="flex gap-2">
											<div className="h-3 w-3 rounded-full bg-red-500" />
											<div className="h-3 w-3 rounded-full bg-yellow-500" />
											<div className="h-3 w-3 rounded-full bg-green-500" />
										</div>
										<span className="text-sm font-medium text-neutral-400">
											setup.js
										</span>
									</div>

									<div className="flex rounded-lg bg-neutral-800 p-1">
										{codeSnippets.map((tab, index) => (
											<button
												key={tab.name}
												type="button"
												onClick={() => setActiveTab(index)}
												className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${activeTab === index
													? "bg-white text-black"
													: "text-neutral-400 hover:text-white"
													}`}
											>
												{tab.name}
											</button>
										))}
									</div>
								</div>

								<div className="bg-neutral-900 p-6">
									<pre className="overflow-x-auto text-sm leading-relaxed">
										<code className="font-mono text-neutral-300">
											{codeSnippets[activeTab].code
												.split("\n")
												.map((line, index) => (
													<div
														key={`${activeTab}-line-${index + 1}`}
														className="flex"
													>
														<span className="w-8 flex-shrink-0 select-none pr-4 text-right text-neutral-600">
															{String(index + 1).padStart(2, "0")}
														</span>
														<span className="flex-1">{line}</span>
													</div>
												))}
										</code>
									</pre>
								</div>

								<div className="flex items-center justify-between border-t border-neutral-700 bg-neutral-800/30 px-6 py-3">
									<div className="flex items-center gap-2">
										<div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
										<span className="text-xs text-neutral-400">
											Lightning Fast Setup
										</span>
									</div>
									<span className="text-xs text-neutral-500">
										Add one script tag
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}