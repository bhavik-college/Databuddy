"use client"

import { ArrowRight, Check, BarChart2, Zap, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import LiquidChrome from "../bits/liquid"

const ctaItems = [
    {
        title: "View demo",
        description: "See Databuddy in action with our interactive demo dashboard.",
        href: "/demo",
        primary: true
    },
    {
        title: "Get started",
        description: "Drop your site in and see what your users are doing in seconds",
        href: "https://app.databuddy.cc",
        primary: true
    },
    {
        title: "Read Documentation",
        description: "Learn how to integrate Databuddy with your tech stack.",
        href: "/docs",
        primary: false
    }
]

export default function CTA() {
    return (
        <div className="md:w-10/12 mx-auto font-geist relative md:border-l-0 md:border-b-0 md:border-[1.2px] rounded-none -pr-2 dark:bg-black/[0.95]">
            <div className="w-full md:mx-0">
                {/* CTA grid */}
                <div className="grid grid-cols-1 relative md:grid-rows-1 md:grid-cols-3 border-t-[1.2px]">
                    <div className="hidden md:grid top-1/2 left-0 -translate-y-1/2 w-full grid-cols-3 z-10 pointer-events-none select-none absolute">
                        <Plus className="w-8 h-8 text-neutral-300 translate-x-[16.5px] translate-y-[.5px] ml-auto dark:text-neutral-600" />
                        <Plus className="w-8 h-8 text-neutral-300 ml-auto translate-x-[16.5px] translate-y-[.5px] dark:text-neutral-600" />
                    </div>

                    {ctaItems.map((item, index) => (
                        <Link
                            key={item.title}
                            href={item.href}
                            className={cn(
                                "justify-center border-l-[1.2px] md:min-h-[240px] border-t-[1.2px] md:border-t-0 transform-gpu flex flex-col p-10 group hover:bg-neutral-900/20 transition-colors",
                            )}
                            target={item.href.startsWith('http') ? '_blank' : undefined}
                            rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                        >
                            <div className="flex items-center gap-2 my-1">
                                {item.primary ? (
                                    <div className="w-4 h-4 bg-sky-400 rounded-sm flex items-center justify-center">
                                        <ArrowRight className="w-2 h-2 text-white" />
                                    </div>
                                ) : (
                                    <div className="w-4 h-4 border border-neutral-600 rounded-sm flex items-center justify-center">
                                        <ArrowRight className="w-2 h-2 text-neutral-400" />
                                    </div>
                                )}
                                <p className="text-gray-600 dark:text-gray-400 text-xs">
                                    {item.primary ? 'Try Now' : 'Learn More'}
                                </p>
                            </div>
                            <div className="mt-2">
                                <div className="max-w-full">
                                    <div className="flex gap-3 items-center">
                                        <p className={cn(
                                            "max-w-lg text-lg font-medium tracking-tight group-hover:text-sky-400 transition-colors",
                                            item.primary && "text-sky-400"
                                        )}>
                                            {item.title}
                                        </p>
                                        <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-sky-400 group-hover:translate-x-1 transition-all" />
                                    </div>
                                </div>
                                <p className="mt-2 text-sm text-left text-muted-foreground">
                                    {item.description}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Liquid Chrome CTA Section */}
                <div className="relative border-l-[1.2px] border-t-[1.2px] min-h-[400px] overflow-hidden">
                    {/* Liquid Chrome Background */}
                    <div className="absolute inset-0 opacity-30">
                        <LiquidChrome
                            speed={0.3}
                            amplitude={0.4}
                            frequencyX={2.5}
                            frequencyY={1.8}
                            interactive={false}
                        />
                    </div>

                    {/* Gradient overlays for edge fading */}
                    <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-transparent to-white/80 dark:from-black/80 dark:via-transparent dark:to-black/80" />
                    <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-transparent to-white/60 dark:from-black/60 dark:via-transparent dark:to-black/60" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/40 via-transparent to-transparent dark:from-black/40 dark:via-transparent dark:to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-bl from-transparent via-transparent to-white/40 dark:from-transparent dark:via-transparent dark:to-black/40" />

                    <div className="relative z-10 p-10 h-full">
                        <div className="flex flex-col items-center justify-center w-full h-full gap-8 text-center">
                            <div className="space-y-4">
                                <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
                                    Ready to get started?
                                </h2>
                                <p className="text-lg text-muted-foreground max-w-md mx-auto">
                                    Join developers who've ditched Google Analytics for something better.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <a
                                    href="https://app.databuddy.cc"
                                    className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white transition-all duration-200 bg-sky-600 rounded-xl hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-black shadow-lg hover:shadow-xl transform hover:scale-105"
                                    data-track="cta-get-started-click"
                                    data-section="cta"
                                    data-button-type="primary-cta"
                                    data-destination="register"
                                >
                                    Get started
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </a>

                                <a
                                    href="/demo"
                                    className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-muted-foreground transition-all duration-200 hover:text-foreground"
                                    data-track="cta-demo-click"
                                    data-section="cta"
                                    data-button-type="secondary-cta"
                                    data-destination="demo"
                                >
                                    View demo →
                                </a>
                            </div>

                            <div className="flex items-center gap-8 text-sm text-muted-foreground opacity-60">
                                <span>Rivo.gg</span>
                                <span>Better-auth</span>
                                <span>Confinity</span>
                                <span>Wouldyoubot</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Benefits footer */}
                <div className="border-l-[1.2px] border-t-[1.2px] p-10 bg-neutral-900/20 backdrop-blur-sm">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-sm text-neutral-400">
                            <div className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-400" />
                                No cookies, no consent banners
                            </div>
                            <div className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-400" />
                                Real-time dashboard
                            </div>
                            <div className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-400" />
                                GDPR compliant by default
                            </div>
                        </div>
                        <div className="text-xs text-neutral-500">
                            Privacy-first analytics
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
} 