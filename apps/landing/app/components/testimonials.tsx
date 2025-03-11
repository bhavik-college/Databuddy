"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { StarIcon } from "lucide-react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Marketing Director",
    company: "GrowthTech",
    avatar: "/avatars/sarah.jpg",
    content: "Databuddy transformed our analytics strategy completely. We've reduced our analytics costs by 40% while gaining deeper insights into customer behavior. The real-time dashboard has become essential for our team's daily decision-making.",
    highlight: "40% cost reduction",
    rating: 5
  },
  {
    name: "Michael Chen",
    role: "CTO",
    company: "PrivacyFirst",
    avatar: "/avatars/michael.jpg",
    content: "After struggling with GDPR compliance issues, Databuddy was exactly what we needed. No more cookie consent banners, and our page load times improved by 300ms. Our legal team is thrilled with the built-in compliance features.",
    highlight: "GDPR compliant & faster",
    rating: 5
  },
  {
    name: "Elena Rodriguez",
    role: "E-commerce Manager",
    company: "StyleOutlet",
    avatar: "/avatars/elena.jpg",
    content: "The real-time conversion tracking helped us identify a critical checkout issue that was costing us sales. We fixed it the same day and saw a 15% revenue increase within the first week. The ROI on Databuddy has been exceptional.",
    highlight: "15% revenue increase",
    rating: 5
  },
  {
    name: "David Park",
    role: "Growth Lead",
    company: "SaaS Solutions",
    avatar: "/avatars/david.jpg",
    content: "We've tried every analytics tool on the market. Databuddy stands out with its intuitive interface and actionable insights. Our entire team actually uses it daily now, which was never the case with our previous analytics solution.",
    highlight: "Daily team adoption",
    rating: 5
  }
]

// Trusted by logos
const trustedBy = [
  { name: "Acme Inc", logo: "/logos/acme.svg" },
  { name: "Globex", logo: "/logos/globex.svg" },
  { name: "Stark Industries", logo: "/logos/stark.svg" },
  { name: "Wayne Enterprises", logo: "/logos/wayne.svg" },
  { name: "Umbrella Corp", logo: "/logos/umbrella.svg" },
  { name: "Cyberdyne", logo: "/logos/cyberdyne.svg" },
]

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-16 sm:py-24 bg-slate-950 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-slate-950 pointer-events-none"></div>
      <div className="container px-4 mx-auto relative z-10">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 tracking-tight">Trusted by data-conscious teams</h2>
          <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Join hundreds of companies that rely on Databuddy for privacy-first analytics that drive real business results.
          </p>
        </div>

        {/* Logos section */}
        <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-12 mb-16 max-w-4xl mx-auto opacity-70">
          {trustedBy.map((company) => (
            <div key={company.name} className="h-6 sm:h-8 w-auto grayscale hover:grayscale-0 transition-all duration-300">
              <span className="text-sm sm:text-base font-semibold text-slate-400">{company.name}</span>
            </div>
          ))}
        </div>

        {/* Desktop view: Grid */}
        <div className="hidden md:grid md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name} className="bg-slate-900/50 border-slate-800 hover:border-sky-500/30 transition-all duration-300 hover:shadow-[0_0_25px_-5px_rgba(14,165,233,0.15)]">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-start gap-4 mb-4 sm:mb-5">
                  <Avatar className="h-12 w-12 sm:h-14 sm:w-14 border-2 border-sky-500/20">
                    <AvatarFallback className="bg-sky-950 text-sky-200 text-xs sm:text-sm">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                    <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                  </Avatar>
                  <div>
                    <h4 className="font-semibold text-base sm:text-lg">{testimonial.name}</h4>
                    <p className="text-xs sm:text-sm text-slate-400">
                      {testimonial.role}, {testimonial.company}
                    </p>
                    <div className="flex mt-1">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon 
                          key={i} 
                          className={`h-3.5 w-3.5 ${i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} 
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-slate-300 mb-4 text-sm sm:text-base leading-relaxed">&quot;{testimonial.content}&quot;</p>
                <div className="inline-block px-3 py-1.5 rounded-full bg-sky-950/80 text-sky-300 text-xs font-medium border border-sky-500/20">
                  {testimonial.highlight}
                </div>
              </CardContent>
            </Card>
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
              {testimonials.map((testimonial) => (
                <CarouselItem key={testimonial.name}>
                  <Card className="bg-slate-900/50 border-slate-800 transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <Avatar className="h-12 w-12 border-2 border-sky-500/20">
                          <AvatarFallback className="bg-sky-950 text-sky-200 text-xs">
                            {testimonial.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                          <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                        </Avatar>
                        <div>
                          <h4 className="font-semibold text-base">{testimonial.name}</h4>
                          <p className="text-xs text-slate-400">
                            {testimonial.role}, {testimonial.company}
                          </p>
                          <div className="flex mt-1">
                            {[...Array(5)].map((_, i) => (
                              <StarIcon 
                                key={i} 
                                className={`h-3.5 w-3.5 ${i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} 
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-slate-300 mb-4 text-sm leading-relaxed">&quot;{testimonial.content}&quot;</p>
                      <div className="inline-block px-3 py-1.5 rounded-full bg-sky-950/80 text-sky-300 text-xs font-medium border border-sky-500/20">
                        {testimonial.highlight}
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex items-center justify-center mt-4">
              <CarouselPrevious className="static translate-y-0 mr-2 bg-slate-800 hover:bg-slate-700 border-slate-700" />
              <CarouselNext className="static translate-y-0 ml-2 bg-slate-800 hover:bg-slate-700 border-slate-700" />
            </div>
          </Carousel>
        </div>
      </div>
    </section>
  )
} 