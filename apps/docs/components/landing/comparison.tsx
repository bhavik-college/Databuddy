import { Check, X, BarChart3 } from "lucide-react"

const features = [
    {
        name: "Cookie-free tracking",
        us: true,
        ga: false,
        plausible: true,
        fathom: true,
        benefit: "No consent banners, higher opt-in rates"
    },
    {
        name: "GDPR Compliant by default",
        us: true,
        ga: false,
        plausible: true,
        fathom: true,
        benefit: "Reduce legal risk and compliance costs"
    },
    {
        name: "65x faster script",
        us: true,
        ga: false,
        plausible: false,
        fathom: false,
        benefit: "Better Core Web Vitals and SEO rankings"
    },
    {
        name: "Data ownership",
        us: true,
        ga: false,
        plausible: true,
        fathom: false,
        benefit: "Full control of your valuable business data"
    },
    {
        name: "Export raw data",
        us: true,
        ga: false,
        plausible: false,
        fathom: false,
        benefit: "Integrate with your existing business tools"
    },
    {
        name: "AI-powered insights",
        us: true,
        ga: false,
        plausible: false,
        fathom: false,
        benefit: "Predictive analytics and automated recommendations"
    },
    {
        name: "Real-time analytics",
        us: true,
        ga: true,
        plausible: true,
        fathom: true,
        benefit: "Make data-driven decisions instantly"
    },
    {
        name: "Self-hosting option",
        us: true,
        ga: false,
        plausible: true,
        fathom: false,
        benefit: "Complete control over your infrastructure"
    },
    {
        name: "Transparent pricing",
        us: true,
        ga: false,
        plausible: true,
        fathom: true,
        benefit: "No hidden costs or surprise charges"
    },
    {
        name: "Advanced event tracking",
        us: true,
        ga: true,
        plausible: false,
        fathom: false,
        benefit: "Track custom user interactions and conversions"
    }
]

export default function Comparison() {
    return (
        <div className="md:w-10/12 mx-auto font-geist relative md:border-l-0 md:border-b-0 md:border-[1.2px] rounded-none -pr-2 dark:bg-black/[0.95]">
            <div className="w-full md:mx-0">
                {/* Single wide section for comparison */}
                <div className="border-l-[1.2px] border-t-[1.2px] md:border-t-0 border-b-[1.2px] p-10">
                    <div className="flex items-center gap-2 my-1">
                        <BarChart3 className="w-4 h-4" />
                        <p className="text-gray-600 dark:text-gray-400">
                            Feature Comparison
                        </p>
                    </div>
                    <div className="mt-2 mb-8">
                        <div className="max-w-full">
                            <div className="flex gap-3">
                                <p className="max-w-lg text-xl font-normal tracking-tighter md:text-2xl">
                                    Better than <strong>all competitors</strong> in every way.
                                </p>
                            </div>
                        </div>
                        <p className="mt-2 text-sm text-left text-muted-foreground">
                            Compare Databuddy with the most popular analytics platforms and see why we&apos;re the clear choice.
                        </p>
                    </div>

                    {/* Comparison table */}
                    <div className="border border-neutral-800/80 rounded-xl overflow-hidden bg-neutral-900/20">
                        <div className="grid grid-cols-6 bg-neutral-900/50 p-4 border-b border-neutral-800/80">
                            <div className="text-neutral-400 text-sm font-medium">Feature</div>
                            <div className="text-center font-semibold text-sky-400 text-sm">Databuddy</div>
                            <div className="text-center font-semibold text-neutral-400 text-sm">Google Analytics</div>
                            <div className="text-center font-semibold text-neutral-400 text-sm">Plausible</div>
                            <div className="text-center font-semibold text-neutral-400 text-sm">Fathom</div>
                            <div className="text-neutral-400 text-sm font-medium">Business Impact</div>
                        </div>

                        {features.map((feature, index) => (
                            <div key={feature.name} className="grid grid-cols-6 p-4 border-b border-neutral-800/50 last:border-b-0 hover:bg-neutral-900/30 transition-colors">
                                <div className="text-neutral-200 text-sm pr-4">{feature.name}</div>
                                <div className="flex justify-center">
                                    {feature.us ? (
                                        <Check className="h-5 w-5 text-sky-400" />
                                    ) : (
                                        <X className="h-5 w-5 text-neutral-600" />
                                    )}
                                </div>
                                <div className="flex justify-center">
                                    {feature.ga ? (
                                        <Check className="h-5 w-5 text-neutral-400" />
                                    ) : (
                                        <X className="h-5 w-5 text-neutral-600" />
                                    )}
                                </div>
                                <div className="flex justify-center">
                                    {feature.plausible ? (
                                        <Check className="h-5 w-5 text-neutral-400" />
                                    ) : (
                                        <X className="h-5 w-5 text-neutral-600" />
                                    )}
                                </div>
                                <div className="flex justify-center">
                                    {feature.fathom ? (
                                        <Check className="h-5 w-5 text-neutral-400" />
                                    ) : (
                                        <X className="h-5 w-5 text-neutral-600" />
                                    )}
                                </div>
                                <div className="text-xs text-neutral-400">{feature.benefit}</div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 text-center">
                        <p className="text-xs text-neutral-500">
                            All features available on our free plan with up to 50,000 monthly pageviews
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
} 