"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { 
  Github, 
  Twitter, 
  Linkedin, 
  Youtube, 
  Mail,
  ArrowUp
} from "lucide-react"

const footerLinks = [
  {
    title: "Product",
    links: [
      { name: "Features", href: "/#features" },
      { name: "Pricing", href: "/#pricing" },
      { name: "FAQ", href: "/#faq" },
      { name: "Early Access", href: "/#early-access" },
    ]
  },
  {
    title: "Company",
    links: [
      { name: "About", href: "/about" },
      { name: "Blog", href: "/blog" },
      { name: "Careers", href: "/careers" },
      { name: "Contact", href: "/contact" },
    ]
  },
  {
    title: "Resources",
    links: [
      { name: "Documentation", href: "https://docs.databuddy.cc" },
      { name: "Support", href: "/contact" },
      { name: "Status", href: "https://status.databuddy.cc" },
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
    ]
  },
  {
    title: "Compare",
    links: [
      { name: "vs Google Analytics", href: "/compare?competitor=google-analytics" },
      { name: "vs Plausible", href: "/compare?competitor=plausible" },
      { name: "vs Fathom", href: "/compare?competitor=fathom" },
      { name: "vs Matomo", href: "/compare?competitor=matomo" },
    ]
  }
]

const socialLinks = [
  { name: "Twitter", icon: Twitter, href: "https://twitter.com/databuddyps" },
  { name: "LinkedIn", icon: Linkedin, href: "https://linkedin.com/company/databuddyps" },
]

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    })
  }
  
  return (
    <footer className="relative pt-16 pb-10 border-t border-slate-800 bg-slate-950">
      <div className="container px-4 mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2">
            <Link
              href="/"
              className="inline-block text-2xl font-bold bg-gradient-to-r from-sky-400 to-sky-600 bg-clip-text text-transparent mb-4"
            >
              Databuddy
            </Link>
            <p className="text-slate-400 text-sm mb-4 max-w-md">
              We&apos;re building the next generation of privacy-first analytics. Join our early adopters and help shape the future of ethical web analytics.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((link) => (
                <a 
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-900 hover:bg-sky-500/10 text-slate-400 hover:text-sky-400 transition-colors"
                  aria-label={link.name}
                >
                  <link.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          
          {footerLinks.map((group) => (
            <div key={group.title} className="col-span-1">
              <h3 className="font-medium text-white mb-3">{group.title}</h3>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={link.name}>
                    <Link 
                      href={link.href}
                      className="text-sm text-slate-400 hover:text-sky-400 transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-slate-800">
          <p className="text-xs text-slate-500 mb-4 md:mb-0">
            © {new Date().getFullYear()} Databuddy Analytics. All rights reserved.
          </p>
          
          <div className="flex items-center space-x-6">
            <Link href="/terms" className="text-xs text-slate-500 hover:text-sky-400">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-xs text-slate-500 hover:text-sky-400">
              Privacy Policy
            </Link>
            <Button 
              variant="outline" 
              size="icon" 
              className="w-8 h-8 rounded-full border-slate-800 hover:border-sky-500 text-slate-400 hover:text-sky-400"
              onClick={scrollToTop}
              aria-label="Scroll to top"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </footer>
  )
} 