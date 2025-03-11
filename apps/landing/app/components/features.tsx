"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { 
  Server, 
  Globe, 
  Code, 
  Database, 
  Shield, 
  Zap, 
  BarChart2, 
  Layers, 
  Cpu, 
  GitBranch,
  FileJson,
  Code2,
  Gauge,
  Lock,
  LineChart,
  Activity,
  Sparkles,
  RefreshCw,
  Boxes,
  PieChart,
  Users,
  Timer,
  MousePointer,
  Smartphone,
  Map,
  Filter,
  Share2,
  Target
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

// Define feature categories
const categories = [
  { id: "core", label: "Core Analytics", icon: <BarChart2 className="h-5 w-5" /> },
  { id: "integration", label: "Integration", icon: <Code className="h-5 w-5" /> },
  { id: "privacy", label: "Privacy", icon: <Shield className="h-5 w-5" /> },
  { id: "performance", label: "Performance", icon: <Gauge className="h-5 w-5" /> },
  { id: "advanced", label: "Advanced", icon: <Sparkles className="h-5 w-5" /> },
]

// Define features for each category
const features = {
  core: [
    {
      title: "Real-time Dashboard",
      description: "Monitor visitor activity with live updates and minimal latency",
      icon: <Activity className="h-6 w-6" />,
      status: "available",
    },
    {
      title: "Traffic Sources",
      description: "Understand where your visitors are coming from without cookies",
      icon: <Share2 className="h-6 w-6" />,
      status: "available",
    },
    {
      title: "Page Analytics",
      description: "Detailed metrics for each page including views, time on page, and bounce rate",
      icon: <LineChart className="h-6 w-6" />,
      status: "available",
    },
    {
      title: "Visitor Insights",
      description: "Anonymous visitor data including country, device, and browser",
      icon: <Users className="h-6 w-6" />,
      status: "available",
    },
    {
      title: "Custom Events",
      description: "Track specific user interactions like button clicks and form submissions",
      icon: <MousePointer className="h-6 w-6" />,
      status: "available",
    },
    {
      title: "Conversion Funnels",
      description: "Track user journeys through your site to optimize conversion paths",
      icon: <Filter className="h-6 w-6" />,
      status: "coming",
    },
  ],
  integration: [
    {
      title: "Next.js Integration",
      description: "One-line setup with Next.js App Router and Pages Router",
      icon: <Code className="h-6 w-6" />,
      status: "available",
    },
    {
      title: "JavaScript Snippet",
      description: "Lightweight script for any website regardless of framework",
      icon: <Code2 className="h-6 w-6" />,
      status: "available",
    },
    {
      title: "GitHub Integration",
      description: "Monitor analytics changes based on latest commits, issues, and bugs",
      icon: <GitBranch className="h-6 w-6" />,
      status: "available",
    },
    {
      title: "API Access",
      description: "Comprehensive REST API for custom dashboards and integrations",
      icon: <FileJson className="h-6 w-6" />,
      status: "available",
    },
    {
      title: "React/Vue/Angular",
      description: "Framework-specific packages for seamless integration",
      icon: <Layers className="h-6 w-6" />,
      status: "coming",
    },
    {
      title: "Data Export",
      description: "Export analytics data to CSV, JSON, or directly to your data warehouse",
      icon: <Database className="h-6 w-6" />,
      status: "coming",
    },
    {
      title: "Webhooks",
      description: "Real-time data streaming via webhooks for event-driven applications",
      icon: <RefreshCw className="h-6 w-6" />,
      status: "roadmap",
    },
  ],
  privacy: [
    {
      title: "Cookieless Tracking",
      description: "Privacy-first analytics without cookies or personal identifiers",
      icon: <Lock className="h-6 w-6" />,
      status: "available",
    },
    {
      title: "GDPR Compliant",
      description: "Built from the ground up to comply with global privacy regulations",
      icon: <Shield className="h-6 w-6" />,
      status: "available",
    },
    {
      title: "Data Ownership",
      description: "You own 100% of your analytics data with no third-party access",
      icon: <Database className="h-6 w-6" />,
      status: "available",
    },
    {
      title: "IP Anonymization",
      description: "Automatic IP anonymization to protect visitor privacy",
      icon: <Users className="h-6 w-6" />,
      status: "available",
    },
    {
      title: "Consent Management",
      description: "Built-in tools for managing user consent and privacy preferences",
      icon: <Layers className="h-6 w-6" />,
      status: "coming",
    },
    {
      title: "Data Retention Controls",
      description: "Configurable data retention policies to comply with regulations",
      icon: <Timer className="h-6 w-6" />,
      status: "coming",
    },
  ],
  performance: [
    {
      title: "Lightweight Script",
      description: "< 2KB script size with zero impact on Core Web Vitals",
      icon: <Zap className="h-6 w-6" />,
      status: "available",
    },
    {
      title: "Edge Processing",
      description: "Data processing at the edge for minimal latency and maximum reliability",
      icon: <Globe className="h-6 w-6" />,
      status: "available",
    },
    {
      title: "Performance Metrics",
      description: "Track Core Web Vitals and other performance metrics for your site",
      icon: <Activity className="h-6 w-6" />,
      status: "coming",
    },
    {
      title: "Resource Monitoring",
      description: "Identify slow-loading resources and performance bottlenecks",
      icon: <Timer className="h-6 w-6" />,
      status: "coming",
    },
    {
      title: "Self-hosted Option",
      description: "Deploy on your own infrastructure for maximum control and performance",
      icon: <Server className="h-6 w-6" />,
      status: "roadmap",
    },
  ],
  advanced: [
    {
      title: "Custom Dashboards",
      description: "Build personalized dashboards with the metrics that matter to you",
      icon: <PieChart className="h-6 w-6" />,
      status: "coming",
    },
    {
      title: "Goal Tracking",
      description: "Set and monitor conversion goals to measure site effectiveness",
      icon: <Target className="h-6 w-6" />,
      status: "coming",
    },
    {
      title: "Heatmaps",
      description: "Visualize user interactions with click, move, and scroll heatmaps",
      icon: <MousePointer className="h-6 w-6" />,
      status: "roadmap",
    },
    {
      title: "A/B Testing",
      description: "Test different versions of your pages to optimize conversions",
      icon: <GitBranch className="h-6 w-6" />,
      status: "roadmap",
    },
    {
      title: "Mobile App Analytics",
      description: "Track user behavior in your mobile applications",
      icon: <Smartphone className="h-6 w-6" />,
      status: "roadmap",
    },
    {
      title: "AI Insights",
      description: "Automated anomaly detection and actionable recommendations",
      icon: <Cpu className="h-6 w-6" />,
      status: "roadmap",
    },
  ],
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  if (status === "available") {
    return (
      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
        Available Now
      </Badge>
    )
  }
  
  if (status === "coming") {
    return (
      <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
        Coming Soon
      </Badge>
    )
  }
  
  return (
    <Badge variant="outline" className="bg-slate-500/10 text-slate-400 border-slate-500/20">
      On Roadmap
    </Badge>
  )
}

export default function Features() {
  const [activeCategory, setActiveCategory] = useState("core")
  
  return (
    <section id="features" className="py-16 sm:py-24 bg-slate-900/30">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Powerful features, simple interface</h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
            Everything you need to understand your audience without compromising their privacy or your site&apos;s performance.
          </p>
        </div>

        {/* Desktop view: Tabs */}
        <div className="hidden md:block">
          <Tabs defaultValue="core" className="w-full max-w-5xl mx-auto" onValueChange={setActiveCategory}>
            <TabsList className="grid grid-cols-5 mb-8 bg-slate-900/50 p-1 rounded-lg">
              {categories.map((category) => (
                <TabsTrigger 
                  key={category.id} 
                  value={category.id}
                  className={cn(
                    "flex items-center gap-2 py-2 data-[state=active]:bg-sky-500/10 data-[state=active]:text-sky-400",
                  )}
                >
                  {category.icon}
                  <span className="hidden sm:inline">{category.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            
            {Object.entries(features).map(([categoryId, categoryFeatures]) => (
              <TabsContent key={categoryId} value={categoryId} className="mt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {categoryFeatures.map((feature) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="relative p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-sky-500/30 transition-all duration-300 hover:shadow-[0_0_25px_-5px_rgba(14,165,233,0.15)]"
                    >
                      <div className="flex items-center gap-4 mb-3">
                        <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
                          {feature.icon}
                        </div>
                        <h3 className="text-lg font-semibold">{feature.title}</h3>
                      </div>
                      <p className="text-slate-400 text-sm mb-4">{feature.description}</p>
                      {feature.status === "coming" ? (
                        <Badge variant="outline" className="text-yellow-400 border-yellow-400/30 bg-yellow-400/10">
                          Coming soon
                        </Badge>
                      ) : null}
                    </motion.div>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Mobile view: Category selector + Carousel */}
        <div className="md:hidden">
          <div className="flex overflow-x-auto pb-4 mb-6 gap-2 scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-sm",
                  activeCategory === category.id 
                    ? "bg-sky-500/10 text-sky-400 border border-sky-500/30" 
                    : "bg-slate-800 text-slate-300 border border-slate-700"
                )}
              >
                {category.icon}
                <span>{category.label}</span>
              </button>
            ))}
          </div>

          {Object.entries(features).map(([categoryId, categoryFeatures]) => (
            categoryId === activeCategory && (
              <div key={categoryId}>
                <Carousel
                  opts={{
                    align: "start",
                    loop: true,
                  }}
                  className="w-full"
                >
                  <CarouselContent>
                    {categoryFeatures.map((feature) => (
                      <CarouselItem key={feature.title} className="basis-full sm:basis-1/2">
                        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 h-full">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
                              {feature.icon}
                            </div>
                            <h3 className="text-base font-semibold">{feature.title}</h3>
                          </div>
                          <p className="text-slate-400 text-sm mb-4">{feature.description}</p>
                          {feature.status === "coming" ? (
                            <Badge variant="outline" className="text-yellow-400 border-yellow-400/30 bg-yellow-400/10">
                              Coming soon
                            </Badge>
                          ) : null}
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <div className="flex items-center justify-center mt-4">
                    <CarouselPrevious className="static translate-y-0 mr-2 bg-slate-800 hover:bg-slate-700 border-slate-700" />
                    <CarouselNext className="static translate-y-0 ml-2 bg-slate-800 hover:bg-slate-700 border-slate-700" />
                  </div>
                </Carousel>
              </div>
            )
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="#cta-form">
            <Button size="lg" className="bg-sky-500 hover:bg-sky-600 text-white">
              Get early access
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
} 