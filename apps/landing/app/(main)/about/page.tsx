
import Background from "@/app/components/background";
import Navbar from "@/app/components/navbar";
import Footer from "@/app/components/footer";
import Mission from "@/app/components/mission";
import FadeIn from "@/app/components/FadeIn";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";
import { 
  Users, 
  Shield, 
  Lightbulb, 
  Target, 
  Heart
} from "lucide-react";

// Define metadata for SEO
export const metadata: Metadata = {
  title: "About Us | Databuddy",
  description: "Learn about Databuddy' mission to provide lightning-fast, privacy-focused web analytics that doesn't compromise user privacy or site performance.",
  keywords: "privacy analytics, analytics mission, ethical data collection, web analytics vision, databuddy team, user privacy",
  alternates: {
    canonical: 'https://www.databuddy.cc/about',
  },
  openGraph: {
    type: 'website',
    url: 'https://www.databuddy.cc/about',
    title: 'About Databuddy',
    description: 'Our mission is to provide businesses with privacy-focused analytics that respects users while delivering powerful insights.',
    siteName: 'Databuddy',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Databuddy',
    description: 'Our mission is to provide businesses with privacy-focused analytics that respects users while delivering powerful insights.',
    creator: '@databuddyps',
  },
};

// Static page for About/Mission
export default function AboutPage() {
  const teamMembers = [
    {
      name: "Issa Nassar",
      role: "Founder",
      bio: "Full-stack engineer and entrepreneur passionate about building privacy-first tools that empower businesses without compromising user trust.",
      image: "/images/team/issa.jpg",
      github: "https://github.com/izadoesdev",
      twitter: "https://twitter.com/databuddyps",
      linkedin: "https://www.linkedin.com/in/issanassar/",
    },
    {
      name: "Open Position",
      role: "Co-Founder",
      bio: "We're looking for passionate individuals to join our founding team and help shape the future of privacy-first analytics.",
      image: "/images/team/open.jpg",
    },
  ];

  const values = [
    {
      title: "Privacy First",
      description: "We believe user privacy is a fundamental right, not an afterthought. Our solutions are built with privacy at their core.",
      icon: "🔒",
    },
    {
      title: "Data Ownership",
      description: "Your data belongs to you. We provide the tools to collect and analyze it without locking you into proprietary systems.",
      icon: "🗝️",
    },
    {
      title: "Community Driven",
      description: "We're building Databuddy with feedback from our early adopters, valuing their input to create a product that truly meets their needs.",
      icon: "👥",
    },
    {
      title: "Ethical Innovation",
      description: "We push the boundaries of what's possible while maintaining strict ethical standards in all our work.",
      icon: "💡",
    },
  ];

  return (
    <div className="fixed inset-0 overflow-hidden">
      <Background />
      <div className="relative z-10 h-full overflow-auto scrollbar-hide">
        <Navbar />
        <main className="pt-8" itemScope itemType="https://schema.org/AboutPage">
          {/* Hero section */}
          <FadeIn>
            <div className="container mx-auto px-4 py-16 max-w-6xl relative">
              {/* Decorative elements */}
              <div className="absolute top-0 right-10 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl -z-10" aria-hidden="true" />
              <div className="absolute bottom-0 left-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -z-10" aria-hidden="true" />
              
              <div className="text-center mb-8 relative">
                <div className="inline-flex items-center justify-center p-2 bg-sky-500/10 rounded-full mb-5 border border-sky-500/20" aria-hidden="true">
                  <Heart className="h-6 w-6 text-sky-400" />
                </div>
                <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-blue-500 mb-6" itemProp="headline">
                  About Databuddy
                </h1>
                <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto mb-10" itemProp="description">
                  We&apos;re on a mission to build better analytics that balances powerful insights with respect for user privacy.
                </p>
              </div>
            </div>
          </FadeIn>

          {/* Mission section */}
          <div id="our-mission">
            <Mission />
          </div>

          {/* Values section */}
          <FadeIn delay={100}>
            <div className="container mx-auto px-4 py-16 max-w-6xl">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Core Values</h2>
                <p className="text-slate-400 max-w-2xl mx-auto">
                  These principles guide everything we do at Databuddy.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-sky-500/30 transition-all duration-300">
                  <div className="bg-sky-500/10 p-3 rounded-xl w-fit mb-4">
                    <Shield className="h-6 w-6 text-sky-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Privacy First</h3>
                  <p className="text-slate-400">
                    We believe user privacy is non-negotiable. All our features are designed with privacy as the foundation.
                  </p>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-sky-500/30 transition-all duration-300">
                  <div className="bg-sky-500/10 p-3 rounded-xl w-fit mb-4">
                    <Lightbulb className="h-6 w-6 text-sky-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Innovation</h3>
                  <p className="text-slate-400">
                    We constantly push the boundaries of what&apos;s possible in analytics, bringing new ideas and approaches to the industry.
                  </p>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-sky-500/30 transition-all duration-300">
                  <div className="bg-sky-500/10 p-3 rounded-xl w-fit mb-4">
                    <Target className="h-6 w-6 text-sky-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Simplicity</h3>
                  <p className="text-slate-400">
                    We believe powerful analytics doesn&apos;t need to be complex. We focus on intuitive design and ease of use.
                  </p>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-sky-500/30 transition-all duration-300">
                  <div className="bg-sky-500/10 p-3 rounded-xl w-fit mb-4">
                    <Users className="h-6 w-6 text-sky-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Customer Focus</h3>
                  <p className="text-slate-400">
                    Our users drive our development. We listen to feedback and continuously improve based on real needs.
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Our Story section */}
          <FadeIn delay={150}>
            <div className="container mx-auto px-4 py-16 max-w-4xl">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Story</h2>
              </div>
              
              <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-8">
                <p className="text-slate-300 mb-6 leading-relaxed">
                  Databuddy was founded in 2024 by Issa Nassar, a full-stack engineer and entrepreneur who was frustrated with the state of web analytics. He saw that existing solutions either compromised user privacy or were too complex and slow.
                </p>
                <p className="text-slate-300 mb-6 leading-relaxed">
                  He believed there had to be a better way—analytics that respect user privacy while still providing valuable insights, without slowing down websites or requiring complex configurations.
                </p>
                <p className="text-slate-300 leading-relaxed">
                  Today, Databuddy is helping businesses of all sizes understand their audience and improve their digital experiences, all while maintaining the highest standards of privacy and performance.
                </p>
              </div>
            </div>
          </FadeIn>

          {/* CTA section */}
          <FadeIn delay={200}>
            <div className="container mx-auto px-4 py-16 max-w-5xl">
              <div className="bg-gradient-to-r from-sky-900/20 to-blue-900/20 rounded-2xl p-8 md:p-12 border border-sky-500/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl -z-10" aria-hidden="true" />
                <div className="md:flex items-center justify-between">
                  <div className="mb-8 md:mb-0 md:mr-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Join us on our mission</h2>
                    <p className="text-slate-300 md:text-lg max-w-xl">
                      Experience analytics that aligns with your values while delivering the insights your business needs to grow.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild className="bg-sky-500 hover:bg-sky-600 text-white">
                      <Link href="/demo">Get Started</Link>
                    </Button>
                    <Button asChild variant="outline" className="border-slate-700 bg-slate-800/50 hover:bg-slate-800">
                      <Link href="/contact">Contact Us</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
          
          {/* Structured data for SEO */}
          <script
            type="application/ld+json"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Organization",
                "name": "Databuddy",
                "url": "https://www.databuddy.cc",
                "logo": "https://www.databuddy.cc/logo.png",
                "description": "Privacy-first web analytics that doesn't compromise on features or performance.",
                "foundingDate": "2024",
                "founders": [{
                  "@type": "Person",
                  "name": "Issa Nassar"
                }],
                "sameAs": [
                  "https://twitter.com/databuddyps",
                  "https://github.com/izadoesdev"
                ]
              })
            }}
          />
        </main>
        <Footer />
      </div>
    </div>
  );
} 