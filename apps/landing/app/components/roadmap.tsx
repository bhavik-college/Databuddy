import { CalendarDays, Code2, Search, Server, Smartphone } from "lucide-react"

const nearTermFeatures = [
  {
    icon: Code2,
    title: "API v2",
    description: "For seamless integration with existing marketing tools and dashboards",
    customers: "Technical teams and marketing agencies",
    eta: "Q2 2023"
  },
  {
    icon: Search,
    title: "Enhanced Search",
    description: "Powerful data exploration to uncover hidden insights and trends",
    customers: "Data analysts and marketing teams",
    eta: "Q3 2023"
  },
  {
    icon: CalendarDays,
    title: "Advanced Reporting",
    description: "Customizable reports and dashboards for specific business needs",
    customers: "Marketing managers and executives",
    eta: "Q3 2023"
  }
]

const longerTermFeatures = [
  {
    icon: Server,
    title: "Self-hosted Enterprise Option",
    description: "Meeting the security and compliance needs of large organizations",
    customers: "Enterprise companies with strict data policies",
    eta: "Q4 2023"
  },
  {
    icon: Smartphone,
    title: "Mobile App",
    description: "Monitor your analytics on the go with real-time notifications",
    customers: "Business owners and marketing teams",
    eta: "Q1 2024"
  }
]

export default function Roadmap() {
  return (
    <section id="roadmap" className="py-16 sm:py-24">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Product Roadmap</h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
            We&apos;re constantly improving our platform. Here&apos;s what&apos;s coming next to help your business grow.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <h3 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-sky-400">Near Term (Next 6 Months)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
            {nearTermFeatures.map((feature) => (
              <div
                key={feature.title}
                className="p-4 sm:p-6 rounded-2xl bg-slate-900/50 border border-slate-800"
              >
                <feature.icon className="h-8 w-8 sm:h-10 sm:w-10 text-sky-500 mb-3 sm:mb-4" />
                <h4 className="text-lg sm:text-xl font-semibold mb-2">{feature.title}</h4>
                <div className="text-xs text-green-400 mb-2 sm:mb-3">Expected: {feature.eta}</div>
                <p className="text-slate-400 mb-2 sm:mb-3 text-sm sm:text-base">{feature.description}</p>
                <div className="text-xs text-sky-400/80">
                  <span>Target: {feature.customers}</span>
                </div>
              </div>
            ))}
          </div>

          <h3 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-sky-400">Longer Term Vision</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
            {longerTermFeatures.map((feature) => (
              <div
                key={feature.title}
                className="p-4 sm:p-6 rounded-2xl bg-slate-900/50 border border-slate-800"
              >
                <feature.icon className="h-8 w-8 sm:h-10 sm:w-10 text-sky-500 mb-3 sm:mb-4" />
                <h4 className="text-lg sm:text-xl font-semibold mb-2">{feature.title}</h4>
                <div className="text-xs text-green-400 mb-2 sm:mb-3">Expected: {feature.eta}</div>
                <p className="text-slate-400 mb-2 sm:mb-3 text-sm sm:text-base">{feature.description}</p>
                <div className="text-xs text-sky-400/80">
                  <span>Target: {feature.customers}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
} 