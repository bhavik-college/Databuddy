import { Shield, Lock, Database, UserX } from "lucide-react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

const features = [
  {
    icon: Shield,
    title: "GDPR Ready",
    description: "Built with privacy regulations in mind. No cookie consent needed.",
    customers: "EU-based businesses and companies serving European customers"
  },
  {
    icon: Lock,
    title: "CCPA Compliant",
    description: "Automated user data deletion requests to maintain full compliance.",
    customers: "California-based businesses and companies serving US customers"
  },
  {
    icon: Database,
    title: "Data Ownership",
    description: "You own your data. Export or delete it anytime. No vendor lock-in.",
    customers: "Data-conscious organizations that need full control of their analytics"
  },
  {
    icon: UserX,
    title: "Regular Security Audits",
    description: "Penetration testing by NCC Group ensures your data stays secure.",
    customers: "Security-focused businesses with strict compliance requirements"
  },
]

export default function Privacy() {
  return (
    <section id="privacy" className="py-16 sm:py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 to-slate-900/30 pointer-events-none"></div>
      <div className="container px-4 mx-auto relative z-10">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 tracking-tight">Privacy is our <span className="text-sky-400">foundation</span>, not an afterthought</h2>
          <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Built from the ground up with privacy in mind. Reduce legal risk and build customer trust with a solution that puts data protection first.
          </p>
        </div>

        {/* Desktop view: Grid */}
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 max-w-7xl mx-auto">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="p-5 sm:p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-sky-500/30 transition-all duration-300 hover:shadow-[0_0_25px_-5px_rgba(14,165,233,0.15)] group"
            >
              <div className="bg-sky-500/10 p-3 rounded-xl w-fit mb-4 sm:mb-5 group-hover:bg-sky-500/20 transition-colors">
                <feature.icon className="h-6 w-6 sm:h-7 sm:w-7 text-sky-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 group-hover:text-sky-400 transition-colors tracking-tight">{feature.title}</h3>
              <p className="text-slate-300 mb-4 text-sm sm:text-base leading-relaxed">{feature.description}</p>
              <div className="text-xs font-medium text-sky-400/80 bg-sky-500/5 py-2 px-3 rounded-full w-fit">
                <span>Perfect for: {feature.customers}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile view: Carousel */}
        <div className="sm:hidden max-w-sm mx-auto">
          <Carousel
            opts={{
              align: "center",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent>
              {features.map((feature) => (
                <CarouselItem key={feature.title}>
                  <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 h-full">
                    <div className="bg-sky-500/10 p-3 rounded-xl w-fit mb-5 mx-auto">
                      <feature.icon className="h-7 w-7 text-sky-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-3 text-center">{feature.title}</h3>
                    <p className="text-slate-300 mb-4 text-sm text-center leading-relaxed">{feature.description}</p>
                    <div className="text-xs font-medium text-sky-400/80 bg-sky-500/5 py-2 px-3 rounded-full mx-auto text-center">
                      <span>Perfect for: {feature.customers}</span>
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
              {features.map((_, index) => (
                <div 
                  key={index} 
                  className={`h-1.5 rounded-full ${index === 0 ? 'w-4 bg-sky-400' : 'w-1.5 bg-slate-700'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

