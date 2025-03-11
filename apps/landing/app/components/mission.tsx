import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Mission() {
  return (
    <section id="mission" className="py-16 sm:py-24 bg-slate-900/30">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Our Purpose</h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
            We&apos;re building a better future for web analytics that respects users while empowering businesses.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-xl sm:text-2xl text-sky-400">Our Mission</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-slate-300 text-base sm:text-lg">
                To provide businesses everywhere with lightning-fast, privacy-focused analytics that doesn&apos;t compromise user privacy or site performance.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-xl sm:text-2xl text-sky-400">Our Vision</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-slate-300 text-base sm:text-lg">
                To build a web that balances user security, ethical data collection, and powerful insights for businesses of all sizes.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
} 