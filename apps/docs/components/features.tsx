"use client";

// Credits to better-auth for the inspiration

import {
	Shield,
	Plus,
	Users,
	Zap,
	Globe2Icon,
	Brain,
	TrendingUp,
} from "lucide-react";

import { cn } from "@/lib/utils";
import Testimonials from "./landing/testimonials";
import LiquidChrome from "./bits/liquid";

const features = [
	{
		id: 1,
		label: "65x Faster Analytics",
		title: "Boost site speed, improve SEO rankings & <strong>enhance user experience</strong>.",
		description:
			"247x smaller script than Google Analytics. Improve Core Web Vitals, boost performance, and enhance SEO while getting powerful insights.",
		icon: Zap,
	},
	{
		id: 2,
		label: "Privacy-First Approach",
		title: "Build trust & reduce legal risk with built-in <strong>GDPR/CCPA compliance</strong>.",
		description:
			"No cookies required, complete data anonymization, and full GDPR/CCPA compliance out of the box. Build user trust while staying compliant.",
		icon: Shield,
	},
	{
		id: 3,
		label: "AI-Powered Insights",
		title: "Identify actionable trends & maximize ROI with <strong>predictive analytics</strong>.",
		description:
			"Leverage AI to provide actionable insights and recommendations. Get predictive analytics that help you make data-driven decisions.",
		icon: Brain,
	},
	{
		id: 4,
		label: "Real-time Analytics",
		title: "Make data-driven decisions instantly with <strong>live dashboards</strong>.",
		description:
			"See your data update in real-time with beautiful dashboards. No data sampling means 100% accurate data for confident decision making.",
		icon: TrendingUp,
	},
	{
		id: 5,
		label: "Data Ownership",
		title: "Full control of your <strong>valuable business data</strong>.",
		description:
			"Your data stays yours. Export raw data, integrate with existing tools, and maintain complete control over your analytics.",
		icon: Users,
	},
	{
		id: 6,
		label: "Energy Efficient",
		title: "Up to 10x more eco-friendly with <strong>lower carbon footprint</strong>.",
		description:
			"Reduce your environmental impact with our energy-efficient analytics platform while maintaining powerful insights.",
		icon: Globe2Icon,
	},
];

interface FeaturesProps {
	stars: string | null;
}

export default function Features({ stars }: FeaturesProps) {
	return (
		<div className="md:w-10/12 mx-auto font-geist relative md:border-l-0 md:border-b-0 md:border-[1.2px] rounded-none -pr-2 dark:bg-black/[0.95]">
			<div className="w-full md:mx-0">
				<div className="grid grid-cols-1 relative md:grid-rows-2 md:grid-cols-3 border-b-[1.2px]">
					<div className="hidden md:grid top-1/2 left-0 -translate-y-1/2 w-full grid-cols-3 z-10 pointer-events-none select-none absolute">
						<Plus className="w-8 h-8 text-neutral-300 translate-x-[16.5px] translate-y-[.5px] ml-auto dark:text-neutral-600" />
						<Plus className="w-8 h-8 text-neutral-300 ml-auto translate-x-[16.5px] translate-y-[.5px] dark:text-neutral-600" />
					</div>
					{features.map((feature, index) => (
						<div
							key={feature.id}
							className={cn(
								"justify-center border-l-[1.2px] md:min-h-[240px] border-t-[1.2px] md:border-t-0 transform-gpu flex flex-col p-10",
								index >= 3 && "md:border-t-[1.2px]",
							)}
							data-track="feature-card-view"
							data-section="features"
							data-feature-id={feature.id}
							data-feature-name={feature.label.toLowerCase().replace(/\s+/g, '-')}
						>
							<div className="flex items-center gap-2 my-1">
								<feature.icon className="w-4 h-4" />
								<p className="text-gray-600 dark:text-gray-400">
									{feature.label}
								</p>
							</div>
							<div className="mt-2">
								<div className="max-w-full">
									<div className="flex gap-3">
										<p
											className="max-w-lg text-xl font-normal tracking-tighter md:text-2xl"
											// biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
											dangerouslySetInnerHTML={{ __html: feature.title }}
										/>
									</div>
								</div>
								<p className="mt-2 text-sm text-left text-muted-foreground">
									{feature.description}
									<a
										className="ml-2 underline"
										href="/docs"
										target="_blank"
										rel="noreferrer"
										data-track="feature-learn-more-click"
										data-section="features"
										data-feature-id={feature.id}
										data-feature-name={feature.label.toLowerCase().replace(/\s+/g, '-')}
									>
										Learn more
									</a>
								</p>
							</div>
						</div>
					))}
				</div>
				<div className="w-full border-l hidden md:block">
					<Testimonials />
				</div>
			</div>
		</div>
	);
} 