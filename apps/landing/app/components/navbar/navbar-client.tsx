"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Menu, X, ChevronDown, BarChart2, ArrowRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import VisuallyHidden from "@/components/ui/visuallyhidden"
import { 
  homeNavGroups, blogNavGroups, demoNavGroups, 
  compareNavGroups, contactNavGroups, flattenNavItems 
} from "./nav-links"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"

export default function NavbarClient() {
  const pathname = usePathname()
  const [activeTab, setActiveTab] = React.useState("")
  const [isScrolled, setIsScrolled] = React.useState(false)
  const [isOpen, setIsOpen] = React.useState(false)
  const [activeGroup, setActiveGroup] = React.useState("About")
  const [hoveredGroup, setHoveredGroup] = React.useState<string | null>(null)
  const [hoveredTab, setHoveredTab] = React.useState<string | null>(null)
  const [showDropdown, setShowDropdown] = React.useState(false)
  const closeTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const navRef = React.useRef<HTMLDivElement>(null)
  
  // Determine which nav groups to use based on the current path
  const getNavGroups = () => {
    if (pathname === "/") return homeNavGroups
    if (pathname.startsWith("/blog")) return blogNavGroups
    if (pathname.startsWith("/demo")) return demoNavGroups
    if (pathname.startsWith("/compare")) return compareNavGroups
    if (pathname.startsWith("/contact")) return contactNavGroups
    return homeNavGroups // Default to home nav groups
  }
  
  const navGroups = getNavGroups()
  const tabs = flattenNavItems(navGroups)
  const isHomePage = pathname === "/"
  
  const ctaLink = isHomePage ? "#cta-form" : "/#cta-form"

  React.useEffect(() => {
    // Reset active tab when pathname changes
    setActiveTab(tabs[0]?.name || "")
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
      
      // Only update active tab based on scroll position on the home page
      if (isHomePage) {
        const sections = tabs.map(tab => {
          const element = document.querySelector(tab.href)
          if (!element) return { name: tab.name, top: 0 }
          
          const rect = element.getBoundingClientRect()
          return {
            name: tab.name,
            top: rect.top
          }
        })
        
        // Find the section closest to the top of the viewport
        const activeSection = sections
          .filter(section => section.top <= 200)
          .sort((a, b) => b.top - a.top)[0]
          
        if (activeSection) {
          setActiveTab(activeSection.name)
          
          // Find which group the active tab belongs to
          for (const group of navGroups) {
            if (group.items.some(item => item.name === activeSection.name)) {
              setActiveGroup(group.name);
              break;
            }
          }
        }
      }
    }
    
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", handleScroll)
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    }
  }, [pathname, isHomePage, tabs, navGroups])

  // Handle hash change and smooth scroll
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault()
      const element = document.querySelector(href)
      if (element) {
        element.scrollIntoView({ behavior: "smooth" })
      }
    }
  }

  // Logo animation variants
  const logoVariants = {
    normal: { scale: 1 },
    hover: { scale: 1.05, transition: { duration: 0.2 } }
  }

  // Button animation variants
  const buttonVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.05, transition: { duration: 0.2 } },
    tap: { scale: 0.95, transition: { duration: 0.1 } }
  }

  // Desktop navigation using shadcn Navigation Menu
  const DesktopNav = () => (
    <NavigationMenu className="hidden md:flex">
      <NavigationMenuList>
        {navGroups.map((group) => (
          <NavigationMenuItem key={group.name}>
            <NavigationMenuTrigger className="bg-transparent text-slate-200 hover:text-white hover:bg-slate-800/50">
              {group.name}
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[220px] gap-2 p-4 md:w-[260px] bg-slate-900 border border-slate-800 rounded-lg">
                {group.items.map((item) => (
                  <li key={item.name}>
                    <NavigationMenuLink asChild>
                      <Link
                        href={item.href}
                        onClick={(e) => handleNavClick(e, item.href)}
                        className="flex items-center gap-2 p-2 hover:bg-slate-800 rounded-md text-slate-300 hover:text-sky-400 transition-colors"
                      >
                        {item.icon}
                        <span>{item.name}</span>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  )

  // Mobile navigation
  const MobileNav = () => (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild className="md:hidden">
        <Button 
          variant="ghost" 
          size="icon" 
          aria-label="Menu"
          className="text-slate-300 hover:text-white hover:bg-slate-800/50"
        >
          <Menu className="h-6 w-6" />
          <VisuallyHidden>Open menu</VisuallyHidden>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] bg-slate-950 border-slate-800">
        <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-sky-400 to-sky-600 bg-clip-text text-transparent">
          Databuddy
        </SheetTitle>
        <nav className="flex flex-col space-y-4 mt-8">
          {navGroups.map((group) => (
            <div key={group.name} className="space-y-2">
              <h3 className="text-sm font-medium text-slate-400">{group.name}</h3>
              <ul className="space-y-1 pl-2">
                {group.items.map((item) => (
                  <li key={item.name}>
                    <SheetClose asChild>
                      <Link
                        href={item.href}
                        onClick={(e) => handleNavClick(e, item.href)}
                        className="flex items-center gap-2 p-2 text-slate-300 hover:text-sky-400 hover:bg-slate-800/50 rounded-md transition-colors"
                      >
                        {item.icon}
                        <span>{item.name}</span>
                      </Link>
                    </SheetClose>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="pt-4 mt-4 border-t border-slate-800">
            <SheetClose asChild>
              <Button asChild className="w-full bg-sky-500 hover:bg-sky-600">
                <Link href={ctaLink}>Join Waitlist</Link>
              </Button>
            </SheetClose>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  )

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled 
          ? "py-2 bg-slate-950 backdrop-blur-xl border-b border-sky-500/10" 
          : "py-4 bg-transparent"
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div
            variants={logoVariants}
            initial="normal"
            whileHover="hover"
          >
            <Link
              href="/"
              className="relative group flex items-center"
            >
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-sky-400 via-blue-500 to-sky-600 bg-clip-text text-transparent tracking-tight">
                Databuddy
              </span>
              <motion.div 
                className="absolute -inset-1 rounded-lg bg-gradient-to-r from-sky-500/20 to-blue-500/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
              />
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            <DesktopNav />
            
            {/* Demo Button */}
            <div className="h-6 w-px bg-slate-800 mx-2"></div>
            <motion.div
              variants={buttonVariants}
              initial="initial"
              whileHover="hover"
              whileTap="tap"
            >
              <Link 
                href="/demo" 
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-500/10 rounded-full border border-emerald-500/20 hover:bg-emerald-500/20"
              >
                <span className="inline-flex"><BarChart2 className="h-4 w-4" /></span>
                <span>Live Demo</span>
              </Link>
            </motion.div>
            
            {/* CTA Button */}
            <motion.div
              variants={buttonVariants}
              initial="initial"
              whileHover="hover"
              whileTap="tap"
              className="ml-2"
            >
              <Button 
                className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 font-medium shadow-lg shadow-sky-500/20 rounded-full group"
                size="sm"
                asChild
              >
                <Link href={ctaLink} className="flex items-center gap-1.5">
                  Join Waitlist
                  <span className="inline-flex"><ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
                </Link>
              </Button>
            </motion.div>
          </div>

          {/* Mobile Menu Trigger */}
          <div className="lg:hidden flex items-center gap-3">
            <MobileNav />
          </div>
        </div>
      </div>
    </motion.nav>
  )
} 