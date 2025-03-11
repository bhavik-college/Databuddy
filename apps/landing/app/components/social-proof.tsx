"use client"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

const companies = [
  {
    name: "Acme Inc",
    logo: "/logos/acme.svg",
    alt: "Acme Inc logo"
  },
  {
    name: "Globex",
    logo: "/logos/globex.svg",
    alt: "Globex logo"
  },
  {
    name: "Soylent Corp",
    logo: "/logos/soylent.svg",
    alt: "Soylent Corp logo"
  },
  {
    name: "Initech",
    logo: "/logos/initech.svg",
    alt: "Initech logo"
  },
  {
    name: "Umbrella Corp",
    logo: "/logos/umbrella.svg",
    alt: "Umbrella Corp logo"
  },
  {
    name: "Stark Industries",
    logo: "/logos/stark.svg",
    alt: "Stark Industries logo"
  }
]

const metrics = [
  {
    value: "65x",
    label: "Faster than Google Analytics",
    description: "Our script loads in milliseconds, not seconds"
  },
  {
    value: "30%",
    label: "Higher conversion rates",
    description: "When cookie banners are removed"
  },
  {
    value: "99.99%",
    label: "Uptime guarantee",
    description: "Enterprise-grade reliability"
  },
  {
    value: "500+",
    label: "Companies trust us",
    description: "From startups to enterprises"
  }
]

export default function SocialProof() {
  return (
    <section className="py-12 sm:py-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-950 pointer-events-none"></div>
      <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent"></div>
      
      <div className="container px-4 mx-auto relative z-10">
        <div className="text-center mb-10">
          <p className="text-sky-400 font-medium text-sm mb-2">TRUSTED BY INNOVATIVE COMPANIES</p>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Join 500+ companies already improving their analytics
          </h2>
        </div>
        
        {/* Company logos */}
        <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-12 mb-12 sm:mb-16 max-w-4xl mx-auto">
          {companies.map((company, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="h-8 sm:h-10 opacity-70 hover:opacity-100 transition-opacity"
            >
              <div className="w-24 sm:w-28 h-8 sm:h-10 bg-slate-800/50 rounded-md flex items-center justify-center">
                {company.name}
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Key metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {metrics.map((metric, index) => (
            <Card 
              key={index} 
              className={cn(
                "bg-slate-900/60 backdrop-blur-sm border-slate-800 overflow-hidden",
                "hover:border-slate-700 transition-colors"
              )}
            >
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-sky-400 mb-2">{metric.value}</div>
                  <div className="font-medium text-white mb-1">{metric.label}</div>
                  <div className="text-sm text-slate-400">{metric.description}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
} 