import { Check, X, Leaf } from "lucide-react"

const features = [
  {
    name: "Real-time analytics",
    us: true,
    ga: true,
    benefit: "Make data-driven decisions instantly"
  },
  {
    name: "Cookie-free tracking",
    us: true,
    ga: false,
    benefit: "No consent banners, higher opt-in rates"
  },
  {
    name: "GDPR Compliant by default",
    us: true,
    ga: false,
    benefit: "Reduce legal risk and compliance costs"
  },
  {
    name: "Data ownership",
    us: true,
    ga: false,
    benefit: "Full control of your valuable business data"
  },
  {
    name: "Custom events",
    us: true,
    ga: true,
    benefit: "Track specific user actions that matter to your business"
  },
  {
    name: "User flow analysis",
    us: true,
    ga: true,
    benefit: "Optimize conversion paths and reduce drop-offs"
  },
  {
    name: "Export raw data",
    us: true,
    ga: false,
    benefit: "Integrate with your existing business tools"
  },
  {
    name: "No data sampling",
    us: true,
    ga: false,
    benefit: "100% accurate data for confident decision making"
  },
  {
    name: "Energy efficient",
    us: true,
    ga: false,
    benefit: "Up to 10x more eco-friendly with lower carbon footprint"
  },
]

export default function Comparison() {
  return (
    <section id="compare" className="py-16 sm:py-24">
      <div className="container px-4 mx-auto">
        {/* Schema.org markup for comparison */}
        <div itemScope itemType="https://schema.org/Product" className="sr-only">
          <meta itemProp="name" content="Databuddy Analytics" />
          <div itemProp="offers" itemScope itemType="https://schema.org/Offer">
            <meta itemProp="price" content="0" />
            <meta itemProp="priceCurrency" content="USD" />
          </div>
          <div itemScope itemType="https://schema.org/ItemList">
            {features.map((feature, index) => (
              <div key={feature.name} itemScope itemType="https://schema.org/ListItem" itemProp="itemListElement">
                <meta itemProp="position" content={`${index + 1}`} />
                <meta itemProp="name" content={feature.name} />
                <meta itemProp="description" content={feature.benefit} />
              </div>
            ))}
          </div>
        </div>
        
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Better than Google Analytics</h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
            Get all the features you love about Google Analytics, plus privacy-first tracking and full data ownership that directly impacts your bottom line.
          </p>
        </div>

        <div className="max-w-4xl mx-auto rounded-xl border border-slate-800 overflow-hidden">
          <div className="grid grid-cols-3 md:grid-cols-4 bg-slate-900/50 p-3 sm:p-4">
            <div className="text-slate-400 text-sm sm:text-base">Feature</div>
            <div className="text-center font-semibold text-sky-400 text-sm sm:text-base">Databuddy</div>
            <div className="text-center font-semibold text-slate-400 text-sm sm:text-base">Google</div>
            <div className="text-slate-400 hidden md:block text-sm sm:text-base">Business Impact</div>
          </div>

          {features.map((feature, index) => (
            <div key={feature.name} className="grid grid-cols-3 md:grid-cols-4 p-3 sm:p-4 border-t border-slate-800">
              <div className="text-slate-300 text-xs sm:text-sm md:text-base pr-2">{feature.name}</div>
              <div className="flex justify-center">
                {feature.us ? <Check className="h-4 w-4 sm:h-5 sm:w-5 text-sky-400" aria-hidden="true" /> : <X className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" aria-hidden="true" />}
              </div>
              <div className="flex justify-center">
                {feature.ga ? <Check className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" aria-hidden="true" /> : <X className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" aria-hidden="true" />}
              </div>
              <div className="text-xs text-slate-400 hidden md:block">{feature.benefit}</div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 text-xs text-slate-500 text-center md:hidden">
          <p>Swipe to see business impact details</p>
        </div>
      </div>
    </section>
  )
}

