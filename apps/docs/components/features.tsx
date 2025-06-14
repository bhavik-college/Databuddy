"use client";

// Credits to better-auth for the inspiration

import {
	Shield,
	Plus,
	Users,
	Zap,
	Globe2Icon,
	TrendingUp,
	AlertTriangle,
	BarChart3,
	Code,
} from "lucide-react";

import { cn } from "@/lib/utils";
import Testimonials from "./landing/testimonials";
import LiquidChrome from "./bits/liquid";

const whyWeExist = [
	{
		id: 1,
		label: "Bloated and creepy",
		title: "Most analytics tools are either <strong>bloated and creepy</strong> (hi Google)",
		description:
			"Google Analytics tracks everything, slows down your site, and requires cookie banners that hurt conversion rates.",
		icon: AlertTriangle,
	},
	{
		id: 2,
		label: "Minimal but useless",
		title: "Or <strong>minimal but useless</strong> (hi SimpleAnalytics)",
		description:
			"Simple tools give you basic pageviews but lack the depth developers need to make informed decisions about their products.",
		icon: BarChart3,
	},
	{
		id: 3,
		label: "Complex product analytics",
		title: "Or \"product analytics\" platforms that need <strong>a data team to set up</strong> (hi PostHog)",
		description:
			"Enterprise tools are powerful but require dedicated data engineers and complex setup processes that small teams can't handle.",
		icon: Users,
	},
];

const whatYouGet = [
	{
		id: 4,
		label: "Privacy-First Approach",
		title: "Build trust & reduce legal risk with built-in <strong>GDPR/CCPA compliance</strong>.",
		description:
			"No cookies required, complete data anonymization, and full GDPR/CCPA compliance out of the box. Build user trust while staying compliant.",
		icon: Shield,
	},
	{
		id: 5,
		label: "Real-time Analytics",
		title: "Make data-driven decisions instantly with <strong>live dashboards</strong>.",
		description:
			"See your data update in real-time with beautiful dashboards. No data sampling means 100% accurate data for confident decision making.",
		icon: TrendingUp,
	},
	{
		id: 6,
		label: "Data Ownership",
		title: "Full control of your <strong>valuable business data</strong>.",
		description:
			"Your data stays yours. Export raw data, integrate with existing tools, and maintain complete control over your analytics.",
		icon: Users,
	},
	{
		id: 7,
		label: "Energy Efficient",
		title: "Up to 10x more eco-friendly with <strong>lower carbon footprint</strong>.",
		description:
			"Reduce your environmental impact with our energy-efficient analytics platform while maintaining powerful insights.",
		icon: Globe2Icon,
	},
	{
		id: 8,
		label: "Open Source",
		title: "Open source, <strong>free forever</strong>.",
		description:
			"Databuddy is open source, free forever to self-host. No hidden fees, no paywall, no BS, cloud version is only pay for what you use",
		icon: Code,
	},
	{
		id: 9,
		label: "Lightweight",
		title: "Lightweight, <strong>no cookies, no fingerprinting, no consent needed</strong>.",
		description:
			"Databuddy is lightweight, no cookies, no fingerprinting, no consent needed. It's GDPR compliant out of the box.",
		icon: Code,
	}
];

interface FeaturesProps {
	stars: string | null;
}

export default function Features({ stars }: FeaturesProps) {
	return (
		<div className="md:w-10/12 mx-auto font-geist relative md:border-l-0 md:border-b-0 md:border-[1.2px] rounded-none -pr-2 dark:bg-black/[0.95]">
			<div className="w-full md:mx-0">
				{/* Why We Exist Section */}
				<div className="border-l-[1.2px] border-t-[1.2px] md:border-t-0 p-10 pb-2">
					<div className="flex items-center gap-2 my-1">
						<AlertTriangle className="w-4 h-4" />
						<p className="text-gray-600 dark:text-gray-400">
							Why We Exist
						</p>
					</div>
					<div className="mt-2">
						<div className="max-w-full">
							<div className="flex gap-3">
								<p className="max-w-lg text-xl font-normal tracking-tighter md:text-2xl">
									Most analytics tools are either:
								</p>
							</div>
						</div>
					</div>
				</div>
				<div className="grid grid-cols-1 relative md:grid-rows-1 md:grid-cols-3">
					<div className="hidden md:grid top-1/2 left-0 -translate-y-1/2 w-full grid-cols-3 z-10 pointer-events-none select-none absolute">
						<Plus className="w-8 h-8 text-neutral-300 translate-x-[16.5px] translate-y-[.5px] ml-auto dark:text-neutral-600" />
						<Plus className="w-8 h-8 text-neutral-300 ml-auto translate-x-[16.5px] translate-y-[.5px] dark:text-neutral-600" />
					</div>
					{whyWeExist.map((item, index) => (
						<div
							key={item.id}
							className={cn(
								"justify-center border-l-[1.2px] md:min-h-[240px] border-t-[1.2px] md:border-t-0 transform-gpu flex flex-col p-10",
							)}
						>
							<div className="flex items-center gap-2 my-1">
								<item.icon className="w-4 h-4" />
								<p className="text-gray-600 dark:text-gray-400">
									{item.label}
								</p>
							</div>
							<div className="mt-2">
								<div className="max-w-full">
									<div className="flex gap-3">
										<p
											className="max-w-lg text-xl font-normal tracking-tighter md:text-2xl"
											// biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
											dangerouslySetInnerHTML={{ __html: item.title }}
										/>
									</div>
								</div>
								<p className="mt-2 text-sm text-left text-muted-foreground">
									{item.description}
								</p>
							</div>
						</div>
					))}
				</div>

				{/* What You Get Section */}
				<div className="border-l-[1.2px] border-t-[1.2px] p-10">
					<div className="flex items-center gap-2 my-1">
						<Zap className="w-4 h-4" />
						<p className="text-gray-600 dark:text-gray-400">
							What You Get
						</p>
					</div>
					<div className="mt-2">
						<div className="max-w-full">
							<div className="flex gap-3">
								<p className="max-w-lg text-xl font-normal tracking-tighter md:text-2xl">
									Databuddy is different. It's:
								</p>
							</div>
						</div>
						<p className="mt-2 text-sm text-left text-muted-foreground">
							Actually privacy-friendly (no cookies, no fingerprinting, no consent needed)<br />
							Fast, self-explanatory dashboards, not another GA4 maze<br />
							Built for developers who want real data and insights without the noise
						</p>
					</div>
				</div>
				<div className="grid grid-cols-1 relative md:grid-rows-1 md:grid-cols-3 border-t-[1.2px]">
					<div className="hidden md:grid top-1/2 left-0 -translate-y-1/2 w-full grid-cols-3 z-10 pointer-events-none select-none absolute">
						<Plus className="w-8 h-8 text-neutral-300 translate-x-[16.5px] translate-y-[.5px] ml-auto dark:text-neutral-600" />
						<Plus className="w-8 h-8 text-neutral-300 ml-auto translate-x-[16.5px] translate-y-[.5px] dark:text-neutral-600" />
					</div>
					{whatYouGet.map((item, index) => (
						<div
							key={item.id}
							className={cn(
								"justify-center border-l-[1.2px] border-b-[1.2px] md:min-h-[240px] border-t-[1.2px] md:border-t-0 transform-gpu flex flex-col p-10",
							)}
						>
							<div className="flex items-center gap-2 my-1">
								<item.icon className="w-4 h-4" />
								<p className="text-gray-600 dark:text-gray-400">
									{item.label}
								</p>
							</div>
							<div className="mt-2">
								<div className="max-w-full">
									<div className="flex gap-3">
										<p
											className="max-w-lg text-xl font-normal tracking-tighter md:text-2xl"
											// biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
											dangerouslySetInnerHTML={{ __html: item.title }}
										/>
									</div>
								</div>
								<p className="mt-2 text-sm text-left text-muted-foreground">
									{item.description}
								</p>
							</div>
						</div>
					))}
				</div>

				{/* For Who Section */}
				<div className="border-l-[1.2px] border-t-[1.2px] p-10 pb-2">
					<div className="flex items-center gap-2 my-1">
						<Users className="w-4 h-4" />
						<p className="text-gray-600 dark:text-gray-400">
							For Who?
						</p>
					</div>
					<div className="mt-2">
						<div className="max-w-full">
							<div className="flex gap-3">
								<p className="max-w-lg text-xl font-normal tracking-tighter md:text-2xl">
									If you're a developer, indie hacker, or small team who wants to:
								</p>
							</div>
						</div>
						<p className="mt-2 text-sm text-left text-muted-foreground">
							• Stop blindly shipping features<br />
							• Stay GDPR-compliant without paying a lawyer<br />
							• Avoid tracking your users like it's 2010<br /><br />
							Then Databuddy is for you.
						</p>
					</div>
				</div>

				<div className="w-full border-l hidden md:block">
					<Testimonials />
				</div>
			</div >
		</div >
	);
} 