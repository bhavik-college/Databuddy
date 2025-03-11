"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import Link from "next/link"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

// Pricing calculation functions
const calculatePayAsYouGo = (pageviews: number): number => {
  const basePageviews = 50000
  const extraPageviews = Math.max(0, pageviews - basePageviews)

  let cost = 0

  // Tier 1: 0-100,000 extra pageviews at $1.00 per 10,000
  const tier1 = Math.min(extraPageviews, 100000)
  cost += (tier1 / 10000) * 1.0

  // Tier 2: 100,000-500,000 extra pageviews at $0.80 per 10,000
  const tier2 = Math.min(Math.max(0, extraPageviews - 100000), 400000)
  cost += (tier2 / 10000) * 0.8

  // Tier 3: 500,000+ extra pageviews at $0.50 per 10,000
  const tier3 = Math.max(0, extraPageviews - 500000)
  cost += (tier3 / 10000) * 0.5

  return Math.round(cost * 100) / 100
}

const calculateBundle = (pageviews: number): number => {
  const basePageviews = 50000
  const extraPageviews = Math.max(0, pageviews - basePageviews)

  if (extraPageviews <= 0) return 0
  if (extraPageviews <= 100000) return 10
  if (extraPageviews <= 500000) return 40

  // For volumes above 1,000,000, we use a custom formula
  // but still provide an estimate
  const extraBundles = Math.ceil((extraPageviews - 500000) / 500000)
  return 40 + extraBundles * 35 // Discounted rate for additional 500k bundles
}

// Animated number component
const AnimatedNumber = ({ value }: { value: number }) => {
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={value}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        {value.toLocaleString()}
      </motion.span>
    </AnimatePresence>
  )
}

export default function Pricing() {
  const [pageviews, setPageviews] = useState(100000)
  const [useBundle, setUseBundle] = useState(false)
  const [isAnnual, setIsAnnual] = useState(false)

  const payAsYouGoCost = calculatePayAsYouGo(pageviews)
  const bundleCost = calculateBundle(pageviews)

  // Apply annual discount (20%)
  const finalCost = isAnnual
    ? useBundle
      ? bundleCost * 0.8
      : payAsYouGoCost * 0.8
    : useBundle
      ? bundleCost
      : payAsYouGoCost

  // Format the cost with 2 decimal places
  const formattedCost = finalCost.toFixed(2)

  // Slider marks for better UX
  const sliderMarks = [
    { value: 50000, label: "50k" },
    { value: 100000, label: "100k" },
    { value: 250000, label: "250k" },
    { value: 500000, label: "500k" },
    { value: 1000000, label: "1M" },
  ]

  // Format pageviews for display
  const formatPageviews = (pv: number) => {
    if (pv >= 1000000) {
      return `${(pv / 1000000).toFixed(1)}M`
    }
    return `${(pv / 1000).toFixed(0)}k`
  }

  // Define pricing plans for schema.org markup
  const pricingPlans = [
    {
      name: "Starter",
      price: "0",
      description: "Perfect for side projects",
      features: [
        "Up to 50,000 pageviews/month",
        "Real-time analytics",
        "Basic reports",
        "30-day data retention",
        "Cookie-free tracking",
        "GDPR compliant",
      ],
    },
    {
      name: "Pro",
      price: formattedCost,
      description: "For growing businesses",
      features: [
        "Pay only for what you use",
        "Real-time analytics",
        "Advanced reports",
        "1-year data retention",
        "Custom events",
        "Team collaboration",
        "API access",
        "Email reports",
      ],
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Contact us",
      description: "For large organizations",
      features: [
        "Custom pageviews",
        "Advanced reports",
        "Unlimited data retention",
        "Custom events",
        "Team collaboration",
        "Dedicated support",
        "SLA guarantee",
        "Custom integrations",
        "On-premise option",
      ],
    },
  ]

  return (
    <section id="pricing" className="py-16 sm:py-24">
      <div className="container px-4 mx-auto">
        {/* Schema.org markup for pricing */}
        <div itemScope itemType="https://schema.org/SoftwareApplication" className="sr-only">
          <meta itemProp="name" content="Databuddy Analytics" />
          <meta itemProp="applicationCategory" content="BusinessApplication" />
          <div itemScope itemType="https://schema.org/AggregateOffer" itemProp="offers">
            <meta itemProp="lowPrice" content="0" />
            <meta itemProp="highPrice" content="100" />
            <meta itemProp="priceCurrency" content="USD" />
            <meta itemProp="offerCount" content="3" />
            
            {pricingPlans.map((plan, index) => (
              <div key={plan.name} itemScope itemType="https://schema.org/Offer" itemProp="offers">
                <meta itemProp="name" content={plan.name} />
                <meta itemProp="price" content={plan.price === "Contact us" ? "0" : plan.price} />
                <meta itemProp="priceCurrency" content="USD" />
                <meta itemProp="description" content={plan.description} />
                <div itemScope itemType="https://schema.org/ItemList" itemProp="itemOffered">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} itemScope itemType="https://schema.org/ListItem" itemProp="itemListElement">
                      <meta itemProp="position" content={`${featureIndex + 1}`} />
                      <meta itemProp="name" content={feature} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Simple, transparent pricing</h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
            Start with 50,000 free pageviews per month. Scale up as you grow with our flexible pricing.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Pricing Calculator */}
          <motion.div
            className="mb-10 sm:mb-16 p-6 sm:p-8 rounded-2xl border border-slate-800 bg-slate-900/50"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h3 className="text-xl sm:text-2xl font-bold mb-6">Calculate your price</h3>

            {/* Billing toggle */}
            <div className="flex items-center justify-center mb-8">
              <span className={`mr-2 text-sm sm:text-base ${!isAnnual ? "text-white" : "text-slate-400"}`}>Monthly</span>
              <Switch checked={isAnnual} onCheckedChange={setIsAnnual} className="mx-2" />
              <span className={`ml-2 text-sm sm:text-base ${isAnnual ? "text-white" : "text-slate-400"}`}>
                Annual <span className="text-sky-400 text-xs sm:text-sm">(20% off)</span>
              </span>
            </div>

            {/* Pageviews slider */}
            <div className="mb-8">
              <div className="flex justify-between mb-2">
                <span className="text-xs sm:text-sm text-slate-400">Monthly pageviews</span>
                <span className="font-semibold text-sm sm:text-base">
                  <AnimatedNumber value={pageviews} />
                </span>
              </div>

              <Slider
                value={[pageviews]}
                min={50000}
                max={1000000}
                step={10000}
                onValueChange={(value) => setPageviews(value[0])}
                className="my-6"
              />

              <div className="flex justify-between text-xs text-slate-500">
                {sliderMarks.map((mark) => (
                  <span key={mark.value} className="relative">
                    {mark.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Pricing options */}
            <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div
                className={`p-4 sm:p-6 rounded-xl border ${
                  !useBundle ? "border-sky-500 bg-sky-500/10" : "border-slate-800 bg-slate-900"
                } cursor-pointer transition-colors`}
                onClick={() => setUseBundle(false)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-base sm:text-lg font-semibold">Pay as you go</h4>
                    <p className="text-xs sm:text-sm text-slate-400">Flexible pricing based on usage</p>
                  </div>
                  <div className="h-5 w-5 rounded-full border-2 flex items-center justify-center">
                    {!useBundle && <div className="h-3 w-3 rounded-full bg-sky-500"></div>}
                  </div>
                </div>
                <div className="text-sm sm:text-base">
                  <span className="text-xl sm:text-2xl font-bold">${payAsYouGoCost.toFixed(2)}</span>
                  <span className="text-slate-400 text-xs sm:text-sm"> / month</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">Only pay for what you use</p>
              </div>

              <div
                className={`p-4 sm:p-6 rounded-xl border ${
                  useBundle ? "border-sky-500 bg-sky-500/10" : "border-slate-800 bg-slate-900"
                } cursor-pointer transition-colors`}
                onClick={() => setUseBundle(true)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-base sm:text-lg font-semibold">Bundle</h4>
                    <p className="text-xs sm:text-sm text-slate-400">Fixed price for predictable billing</p>
                  </div>
                  <div className="h-5 w-5 rounded-full border-2 flex items-center justify-center">
                    {useBundle && <div className="h-3 w-3 rounded-full bg-sky-500"></div>}
                  </div>
                </div>
                <div className="text-sm sm:text-base">
                  <span className="text-xl sm:text-2xl font-bold">${bundleCost.toFixed(2)}</span>
                  <span className="text-slate-400 text-xs sm:text-sm"> / month</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">Predictable billing, no surprises</p>
              </div>
            </div>

            {/* Final price */}
            <div className="bg-slate-800/50 p-4 sm:p-6 rounded-xl border border-slate-700 text-center">
              <p className="text-sm sm:text-base text-slate-300 mb-2">Your estimated price:</p>
              <div className="text-2xl sm:text-3xl font-bold mb-2">
                ${formattedCost}
                <span className="text-slate-400 text-sm sm:text-base"> / month</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400">
                {isAnnual ? "Billed annually" : "Billed monthly"} for {formatPageviews(pageviews)} pageviews
              </p>
            </div>
          </motion.div>

          {/* Desktop view: Pricing plans grid */}
          <div className="hidden md:grid md:grid-cols-3 gap-6 mb-8">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border ${
                  plan.popular ? "border-sky-500" : "border-slate-800"
                } bg-slate-900/50 overflow-hidden relative`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-sky-500 text-white text-xs font-medium py-1 px-3 rounded-bl-lg">
                    Most Popular
                  </div>
                )}
                <div className="p-6 border-b border-slate-800">
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-slate-400 text-sm mb-4">{plan.description}</p>
                  <div className="mb-4">
                    {plan.price === "Contact us" ? (
                      <span className="text-2xl font-bold">Contact us</span>
                    ) : (
                      <>
                        <span className="text-3xl font-bold">
                          {plan.price === "0" ? "Free" : `$${plan.price}`}
                        </span>
                        {plan.price !== "0" && <span className="text-slate-400"> / month</span>}
                      </>
                    )}
                  </div>
                  <Button
                    className={`w-full ${
                      plan.popular
                        ? "bg-sky-500 hover:bg-sky-600 text-white"
                        : "bg-slate-800 hover:bg-slate-700 text-white"
                    }`}
                    asChild
                  >
                    <Link href="#cta-form">
                      {plan.price === "0" ? "Get Started" : plan.price === "Contact us" ? "Contact Sales" : "Subscribe"}
                    </Link>
                  </Button>
                </div>
                <div className="p-6">
                  <h4 className="font-medium mb-4 text-sm">What&apos;s included:</h4>
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start">
                        <Check className="h-5 w-5 text-sky-400 mr-3 shrink-0" />
                        <span className="text-sm text-slate-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile view: Pricing plans carousel */}
          <div className="md:hidden">
            <Carousel
              opts={{
                align: "center",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent>
                {pricingPlans.map((plan) => (
                  <CarouselItem key={plan.name}>
                    <div
                      className={`rounded-2xl border ${
                        plan.popular ? "border-sky-500" : "border-slate-800"
                      } bg-slate-900/50 overflow-hidden relative h-full`}
                    >
                      {plan.popular && (
                        <div className="absolute top-0 right-0 bg-sky-500 text-white text-xs font-medium py-1 px-3 rounded-bl-lg">
                          Most Popular
                        </div>
                      )}
                      <div className="p-6 border-b border-slate-800">
                        <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                        <p className="text-slate-400 text-sm mb-4">{plan.description}</p>
                        <div className="mb-4">
                          {plan.price === "Contact us" ? (
                            <span className="text-2xl font-bold">Contact us</span>
                          ) : (
                            <>
                              <span className="text-3xl font-bold">
                                {plan.price === "0" ? "Free" : `$${plan.price}`}
                              </span>
                              {plan.price !== "0" && <span className="text-slate-400"> / month</span>}
                            </>
                          )}
                        </div>
                        <Button
                          className={`w-full ${
                            plan.popular
                              ? "bg-sky-500 hover:bg-sky-600 text-white"
                              : "bg-slate-800 hover:bg-slate-700 text-white"
                          }`}
                          asChild
                        >
                          <Link href="#cta-form">
                            {plan.price === "0" ? "Get Started" : plan.price === "Contact us" ? "Contact Sales" : "Subscribe"}
                          </Link>
                        </Button>
                      </div>
                      <div className="p-6">
                        <h4 className="font-medium mb-4 text-sm">What&apos;s included:</h4>
                        <ul className="space-y-3">
                          {plan.features.map((feature) => (
                            <li key={feature} className="flex items-start">
                              <Check className="h-5 w-5 text-sky-400 mr-3 shrink-0" />
                              <span className="text-sm text-slate-300">{feature}</span>
                            </li>
                          ))}
                        </ul>
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
            
            <div className="mt-4 flex justify-center">
              <div className="inline-flex gap-1">
                {pricingPlans.map((_, index) => (
                  <div 
                    key={index} 
                    className={`h-1.5 rounded-full ${index === 0 ? 'w-4 bg-sky-400' : 'w-1.5 bg-slate-700'}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* FAQ section */}
          <div className="mt-16 text-center">
            <p className="text-slate-400 mb-4">Have questions about pricing?</p>
            <Button variant="outline" asChild>
              <Link href="#faq">View Pricing FAQ</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

