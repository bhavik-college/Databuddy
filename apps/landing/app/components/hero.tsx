"use client"

import { ArrowRight, Shield, Eye, Activity, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import FadeIn from "./FadeIn"
import Link from "next/link"

export default function Hero() {
  return (
    <section className="min-h-[90vh] flex items-center justify-center pt-16 px-4 sm:px-6">
      <div className="container mx-auto">
        <div itemScope itemType="https://schema.org/SoftwareApplication" className="sr-only">
          <meta itemProp="name" content="Databuddy Analytics"/>
          <meta itemProp="applicationCategory" content="BusinessApplication"/>
          <meta itemProp="operatingSystem" content="Web"/>
          <meta itemProp="offers" itemScope itemType="https://schema.org/Offer">
          </meta>
          <div itemProp="featureList">
            {[
              {
                title: "65x Faster Analytics",
                description: "Boost site speed, improve SEO rankings & enhance user experience",
              },
              {
                title: "Privacy-First Approach",
                description: "Build trust & reduce legal risk with built-in GDPR/CCPA compliance",
              },
              {
                title: "AI-Powered Insights",
                description: "Identify actionable trends & maximize ROI with predictive analytics",
              },
            ].map(f => (
              <span key={f.title}>{f.title}: {f.description}</span>
            ))}
          </div>
        </div>
        <div className="text-center space-y-6 sm:space-y-8 max-w-4xl mx-auto">
          <FadeIn delay={100}>
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-sky-400 bg-sky-500/10 w-fit mx-auto px-3 sm:px-4 py-1.5 sm:py-2 rounded-full">
              <Shield className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
              <span className="whitespace-nowrap tracking-wide">GDPR & CCPA COMPLIANT</span>
              <Badge variant="secondary" className="ml-1 sm:ml-2 bg-sky-500/20 text-white text-xs">
                New
              </Badge>
            </div>
          </FadeIn>

          <FadeIn delay={200}>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.1] sm:leading-[1.1]">
              Privacy-First{" "}
              <span className="bg-gradient-to-r from-sky-400 to-sky-600 bg-clip-text text-transparent">Analytics</span>{" "}
              that Outperforms <span className="bg-gradient-to-r from-sky-400 to-sky-600 bg-clip-text text-transparent">Google</span>
            </h1>
          </FadeIn>

          <FadeIn delay={300}>
            <p className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-slate-300 px-4 sm:px-0 leading-relaxed">
              Gain powerful insights without compromising user privacy. 65x faster than Google Analytics, 
              with zero cookies required and complete data ownership.
            </p>
          </FadeIn>

          <FadeIn delay={400}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2">
              <Button size="lg" className="bg-sky-500 hover:bg-sky-600 group w-full sm:w-auto font-medium" asChild>
                <Link href="#cta-form">
                  Join Waitlist
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </Link>
              </Button>
              <Link href="/demo" className="border-slate-700 hover:border-slate-600 text-white w-full sm:w-auto mt-3 sm:mt-0 font-medium">
                View Live Demo
              </Link>
            </div>
          </FadeIn>

          <FadeIn delay={500}>
            <div className="pt-8 sm:pt-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 text-left">
              {[
                {
                  icon: Shield,
                  title: "65x Faster Analytics",
                  description: "Boost site speed, improve SEO rankings & enhance user experience",
                },
                {
                  icon: Eye,
                  title: "Privacy-First Approach",
                  description: "Build trust & reduce legal risk with built-in GDPR/CCPA compliance",
                },
                {
                  icon: Activity,
                  title: "AI-Powered Insights",
                  description: "Identify actionable trends & maximize ROI with predictive analytics",
                },
              ].map((feature, index) => (
                <div
                  key={feature.title}
                  className="flex items-start gap-3 bg-slate-900/50 p-4 sm:p-5 rounded-lg border border-slate-800 hover:border-sky-500/50 transition-colors group"
                >
                  <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-sky-400 mt-1 group-hover:text-sky-300 transition-colors" aria-hidden="true" />
                  <div>
                    <h3 className="font-semibold group-hover:text-sky-400 transition-colors text-sm sm:text-base tracking-tight">{feature.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>

          <FadeIn delay={600}>
            <div className="pt-6 sm:pt-8">
              <ChevronDown className="h-5 w-5 sm:h-6 sm:w-6 text-slate-400 mx-auto animate-bounce" aria-hidden="true" />
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}

