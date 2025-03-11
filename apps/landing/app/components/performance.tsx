"use client"

import { Zap, Clock, Cpu, Leaf, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

const metrics = [
  {
    icon: Zap,
    metric: "Script Size",
    ours: "1.5kb",
    ga: "371kb",
    improvement: "247x smaller",
    impact: "Minimal impact on site speed, better SEO ranking"
  },
  {
    icon: Clock,
    metric: "Load Time",
    ours: "30-50ms",
    ga: "234ms",
    improvement: "6x faster",
    impact: "Near-instantaneous loading enhances user experience"
  },
  {
    icon: Cpu,
    metric: "CPU Impact",
    ours: "0.8-1.5%",
    ga: "3-6%",
    improvement: "2-5x lighter",
    impact: "Smoother user experience, especially on mobile devices"
  },
  {
    icon: Leaf,
    metric: "Energy Usage",
    ours: "0.8-1.6Wh/1k",
    ga: "8-16Wh/1k",
    improvement: "10x efficient",
    impact: "Reduced carbon footprint and eco-friendly analytics"
  }
]

export default function Performance() {
  return (
    <section id="performance" className="py-16 sm:py-24 bg-slate-900/30">
      <div className="container px-4 mx-auto">
        {/* Schema.org markup for performance metrics */}
        <div itemScope itemType="https://schema.org/Product" className="sr-only">
          <meta itemProp="name" content="Databuddy Analytics" />
          <div itemScope itemType="https://schema.org/AggregateRating" itemProp="aggregateRating">
            <meta itemProp="ratingValue" content="4.9" />
            <meta itemProp="reviewCount" content="128" />
          </div>
          <div itemProp="offers" itemScope itemType="https://schema.org/Offer">
            <meta itemProp="price" content="0" />
            <meta itemProp="priceCurrency" content="USD" />
          </div>
          {metrics.map((item) => (
            <div key={item.metric} itemProp="additionalProperty" itemScope itemType="https://schema.org/PropertyValue">
              <meta itemProp="name" content={item.metric} />
              <meta itemProp="value" content={item.improvement} />
              <meta itemProp="description" content={item.impact} />
            </div>
          ))}
        </div>
        
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Lightning fast performance</h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
            Our analytics script is optimized for speed and efficiency, directly improving your site&apos;s SEO, user experience, and conversion rates.
          </p>
        </div>

        {/* Desktop view: Grid */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 max-w-6xl mx-auto">
          {metrics.map((item, index) => (
            <div
              key={item.metric}
              className="relative p-4 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800"
            >
              <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="p-2 sm:p-3 rounded-lg bg-sky-500/10">
                  <item.icon className="h-5 w-5 sm:h-6 sm:w-6 text-sky-400" aria-hidden="true" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold">{item.metric}</h3>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <div className="text-xs sm:text-sm text-slate-400 mb-1">Our Platform</div>
                  <div className="text-xl sm:text-2xl font-bold text-sky-400">{item.ours}</div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-slate-400 mb-1">Google Analytics</div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-500">{item.ga}</div>
                </div>
                <div className="pt-1 sm:pt-2">
                  <div className="text-xs sm:text-sm font-medium text-green-400">{item.improvement}</div>
                  <div className="text-xs text-slate-400 mt-1">{item.impact}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile view: Carousel */}
        <div className="md:hidden max-w-md mx-auto">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent>
              {metrics.map((item) => (
                <CarouselItem key={item.metric}>
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-sky-500/10">
                        <item.icon className="h-5 w-5 text-sky-400" aria-hidden="true" />
                      </div>
                      <h3 className="text-base font-semibold">{item.metric}</h3>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Our Platform</div>
                        <div className="text-xl font-bold text-sky-400">{item.ours}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Google Analytics</div>
                        <div className="text-xl font-bold text-slate-500">{item.ga}</div>
                      </div>
                      <div className="pt-1">
                        <div className="text-xs font-medium text-green-400">{item.improvement}</div>
                        <div className="text-xs text-slate-400 mt-1">{item.impact}</div>
                      </div>
                    </div>
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

        {/* Methodology explanation */}
        <div className="mt-12 max-w-3xl mx-auto bg-slate-900/70 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Info className="h-5 w-5 text-sky-400" />
            <h3 className="text-lg font-semibold">Our Measurement Methodology</h3>
          </div>
          <div className="text-sm text-slate-400 space-y-3">
            <p>
              <span className="font-medium text-sky-400">CPU Impact:</span> Measured across multiple devices and browsers using the Performance API, 
              capturing CPU utilization during page load and user interactions. Range represents typical usage across different device capabilities.
            </p>
            <p>
              <span className="font-medium text-sky-400">Energy Usage:</span> Estimated based on a model that considers both client-side script execution 
              and server-side processing. We calculate energy consumption using industry benchmarks for data transfer costs, 
              server processing efficiency, and client-side resource utilization.
            </p>
            <p>
              <span className="font-medium text-sky-400">Commitment to Transparency:</span> We continuously refine our methodology and 
              measurements to provide the most accurate performance data possible. Our goal is to deliver analytics that respect both 
              your users and the environment.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

