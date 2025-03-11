
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { MessageSquareText } from "lucide-react"

const faqs = [
  {
    question: "How is Databuddy different from Google Analytics?",
    answer: "Databuddy is built for privacy-first analytics with no cookies required, making it GDPR and CCPA compliant out of the box. Our script is 65x faster than GA4, with a <1KB footprint that won't impact your Core Web Vitals. Plus, our interface delivers actionable insights without the complexity – most teams see value within 15 minutes of installation."
  },
  {
    question: "Do I need to add cookie consent banners with Databuddy?",
    answer: "No. Databuddy's analytics are completely cookieless, using privacy-preserving techniques to provide accurate analytics without tracking individual users. Our customers typically see a 30% increase in conversion rates after removing those intrusive cookie banners while still getting the insights they need."
  },
  {
    question: "How accurate is cookieless analytics compared to traditional methods?",
    answer: "Our cookieless analytics are 95-98% accurate compared to cookie-based solutions. For most businesses, this slight difference is far outweighed by the benefits: higher conversion rates (no consent banners), better data collection (no blocked cookies), and simplified compliance. Many customers report more accurate data overall since we aren't blocked by ad-blockers or privacy browsers."
  },
  {
    question: "Can I migrate my historical data from another analytics platform?",
    answer: "Yes, we offer migration tools for Google Analytics, Matomo, and other major platforms. While we can't import every data point (due to our privacy-first approach), we can bring over aggregated historical trends to ensure continuity in your reporting. Our migration specialists will help you through the entire process."
  },
  {
    question: "What's included in the free plan?",
    answer: "Our free plan includes up to 50,000 monthly pageviews, real-time analytics, basic event tracking, and 30-day data retention. It's perfect for small websites, personal projects, or to test Databuddy before upgrading. You'll get access to all core features with no artificial limitations on functionality."
  },
  {
    question: "How does Databuddy handle high-traffic sites?",
    answer: "Our infrastructure is built to scale, handling millions of events per minute with sub-second processing times. We use a distributed architecture that automatically scales with your traffic patterns. For enterprise customers with extreme traffic needs (50M+ monthly pageviews), we offer dedicated infrastructure options to ensure optimal performance."
  },
  {
    question: "How easy is it to implement Databuddy on my website?",
    answer: "Implementation takes less than 5 minutes for most websites. Simply add our lightweight script to your site (we provide easy integrations for Next.js, React, WordPress, Shopify, and more), and you'll start seeing data immediately. No complex configuration required – though advanced customization options are available when you need them."
  },
  {
    question: "Is my data secure with Databuddy?",
    answer: "Absolutely. We employ industry-leading security practices including end-to-end encryption, regular security audits, and SOC 2 compliance. Your data is stored in EU-based servers with strict access controls. We never sell your data or use it for any purpose other than providing you with analytics insights."
  },
  {
    question: "Can I track custom events and conversions?",
    answer: "Yes! Beyond standard pageview analytics, you can track custom events, goals, and conversion funnels. Our event tracking API is simple to implement and allows you to measure specific user actions like button clicks, form submissions, purchases, and more. Most customers set up their first conversion funnel within 30 minutes of installation."
  },
  {
    question: "What kind of support do you offer?",
    answer: "All paid plans include priority email support with responses within 24 hours. Business and Enterprise plans receive dedicated Slack support with 4-hour response times during business hours. We also provide comprehensive documentation, implementation guides, and regular webinars to help you get the most from Databuddy."
  }
]

export default function FAQ() {
  return (
    <section id="faq" className="py-16 sm:py-24 relative">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 to-slate-900 opacity-50 pointer-events-none"></div>
      <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent"></div>
      
      <div className="container px-4 mx-auto relative z-10">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 tracking-tight">
            Frequently Asked <span className="text-sky-400">Questions</span>
          </h2>
          <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Everything you need to know about Databuddy Analytics. Can&apos;t find the answer you&apos;re looking for?
            <a href="#contact" className="text-sky-400 hover:text-sky-300 ml-1 font-medium">
              Reach out to our team
            </a>.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`} 
                className="border-b border-slate-800 overflow-hidden"
              >
                <AccordionTrigger className="text-left font-medium py-4 sm:py-5 text-sm sm:text-base hover:text-sky-400 transition-colors">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-slate-300 pb-4 sm:pb-5 text-xs sm:text-sm leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          
          <div className="mt-10 sm:mt-12 text-center">
            <Button variant="outline" className="group border-slate-700 hover:border-sky-500 text-slate-300 hover:text-sky-400">
              <MessageSquareText className="mr-2 h-4 w-4 group-hover:text-sky-400" />
              Ask a different question
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

