"use client";

import Link from "next/link";
import { ArrowRight, Zap, Shield, Users, Play } from "lucide-react";

export default function Hero() {
	return (
		<section className="relative min-h-screen bg-black overflow-hidden">
			{/* Monochromatic background */}
			<div className="absolute inset-0">
				<div className="absolute inset-0 bg-gradient-to-br from-neutral-900/50 via-black to-neutral-800/30" />
				<div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" />
				<div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/3 rounded-full blur-3xl animate-pulse delay-1000" />
				<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/2 rounded-full blur-3xl" />

				{/* Subtle grid overlay */}
				<div className="absolute inset-0 opacity-10">
					<div className="h-full w-full" style={{
						backgroundImage: `
							linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
							linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
						`,
						backgroundSize: '50px 50px'
					}} />
				</div>
			</div>

			<div className="relative z-10 md:w-10/12 mx-auto font-geist md:border-l-0 md:border-b-0 md:border-[1.2px] rounded-none -pr-2 dark:bg-black/[0.95] backdrop-blur-sm">
				<div className="w-full md:mx-0">
					{/* Main hero content */}
					<div className="border-l-[1.2px] border-t-[1.2px] md:border-t-0 p-16 md:p-20 text-center">
						<div className="max-w-4xl mx-auto">
							{/* Badge */}
							<div className="inline-flex items-center gap-2 rounded-full border border-neutral-700/50 bg-neutral-800/30 backdrop-blur-sm px-4 py-2 mb-8">
								<div className="h-2 w-2 rounded-full bg-white animate-pulse" />
								<span className="text-sm text-neutral-300">
									Privacy-first analytics platform
								</span>
							</div>

							{/* Main headline */}
							<h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
								<span className="text-white">Analytics that</span>
								<br />
								<span className="text-white">respect <strong>privacy</strong></span>
							</h1>

							{/* Subheadline */}
							<p className="text-xl md:text-2xl text-neutral-400 mb-12 max-w-3xl mx-auto leading-relaxed">
								Get powerful insights without cookies, tracking, or compromising user privacy.
								65x faster than Google Analytics with complete data ownership.
							</p>

							{/* Clean CTA buttons */}
							<div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
								<Link
									href="https://app.databuddy.cc/register"
									className="group relative inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-black transition-all duration-300 bg-white rounded-2xl hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black shadow-2xl hover:shadow-white/10 transform hover:scale-105 hover:-translate-y-1"
								>
									<span className="flex items-center gap-2">
										Get Started Free
										<ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
									</span>
								</Link>

								<Link
									href="/demo"
									className="group inline-flex items-center justify-center px-8 py-4 text-base font-medium text-neutral-300 transition-all duration-300 bg-neutral-800/50 backdrop-blur-sm border border-neutral-700/50 rounded-2xl hover:bg-neutral-700/50 hover:border-neutral-600/50 hover:text-white transform hover:scale-105"
								>
									<Play className="w-4 h-4 mr-2 transition-transform group-hover:scale-110" />
									View live demo
								</Link>
							</div>

							{/* Key stats - monochromatic */}
							<div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
								<div className="text-center group">
									<div className="flex items-center justify-center gap-3 mb-2">
										<div className="p-2 rounded-xl bg-white/5 border border-white/10 group-hover:bg-white/10 transition-colors">
											<Zap className="w-5 h-5 text-white" />
										</div>
										<span className="text-3xl font-bold text-white">65x</span>
									</div>
									<p className="text-sm text-neutral-500">Faster than GA4</p>
								</div>
								<div className="text-center group">
									<div className="flex items-center justify-center gap-3 mb-2">
										<div className="p-2 rounded-xl bg-white/5 border border-white/10 group-hover:bg-white/10 transition-colors">
											<Shield className="w-5 h-5 text-white" />
										</div>
										<span className="text-3xl font-bold text-white">100%</span>
									</div>
									<p className="text-sm text-neutral-500">GDPR Compliant</p>
								</div>
								<div className="text-center group">
									<div className="flex items-center justify-center gap-3 mb-2">
										<div className="p-2 rounded-xl bg-white/5 border border-white/10 group-hover:bg-white/10 transition-colors">
											<Users className="w-5 h-5 text-white" />
										</div>
										<span className="text-3xl font-bold text-white">500+</span>
									</div>
									<p className="text-sm text-neutral-500">Companies trust us</p>
								</div>
							</div>
						</div>
					</div>

					{/* Trust indicators */}
					<div className="border-l-[1.2px] border-t-[1.2px] p-10 bg-neutral-900/20 backdrop-blur-sm">
						<div className="flex flex-col md:flex-row items-center justify-between gap-6">
							<div className="flex items-center gap-6">
								<span className="text-sm text-neutral-500">Trusted by developers at</span>
								<div className="flex items-center gap-4 text-neutral-400">
									<span className="text-sm hover:text-white transition-colors cursor-default">Rivo.gg</span>
									<span className="text-sm hover:text-white transition-colors cursor-default">Better-auth</span>
									<span className="text-sm hover:text-white transition-colors cursor-default">Confinity</span>
									<span className="text-sm hover:text-white transition-colors cursor-default">Wouldyoubot</span>
									<span className="text-sm text-neutral-500">+496 more</span>
								</div>
							</div>
							<div className="flex items-center gap-6 text-xs text-neutral-500">
								<span className="flex items-center gap-2">
									<div className="w-1.5 h-1.5 bg-white rounded-full" />
									Free 30-day trial
								</span>
								<span className="flex items-center gap-2">
									<div className="w-1.5 h-1.5 bg-white rounded-full" />
									No credit card required
								</span>
								<span className="flex items-center gap-2">
									<div className="w-1.5 h-1.5 bg-white rounded-full" />
									Setup in 5 minutes
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}