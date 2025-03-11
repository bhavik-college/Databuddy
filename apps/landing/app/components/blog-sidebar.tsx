"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Mail,
  Home,
  ChevronRight,
  ChevronLeft,
  ArrowUp,
  CalendarIcon,
  Hash,
  Layers
} from "lucide-react";
import Link from "next/link";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

// Define navigation sections for blog
const navigationSections = [
  { name: "Blog Home", id: "blog-header", icon: <BookOpen className="h-4 w-4" /> },
  { name: "Articles", id: "blog-content", icon: <BookOpen className="h-4 w-4" /> },
  { name: "Subscribe", id: "blog-subscribe", icon: <Mail className="h-4 w-4" /> },
];

// Define external links
const externalLinks = [
  { name: "Home", href: "/", icon: <Home className="h-4 w-4" /> },
];

interface Post {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  coverImage?: string | null
  createdAt: Date
  author: {
    name: string | null
    image: string | null
  }
}

interface Category {
  id: string
  name: string
  slug: string
  postCount: number
}

interface Tag {
  id: string
  name: string
  slug: string
  postCount: number
}

interface BlogSidebarProps {
  recentPosts: Post[]
  categories: Category[]
  tags: Tag[]
}

export function BlogSidebar({ recentPosts, categories, tags }: BlogSidebarProps) {
  const [activeSection, setActiveSection] = useState("");
  const [sectionProgress, setSectionProgress] = useState<Record<string, number>>({});
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMobile = useIsMobile();
  const progressRef = useRef<Record<string, number>>({});

  useEffect(() => {
    // Show sidebar after a delay to allow page to load
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1000);

    const calculateSectionProgress = () => {
      const updatedProgress: Record<string, number> = {};
      
      navigationSections.forEach(section => {
        const element = document.getElementById(section.id);
        if (!element) {
          updatedProgress[section.id] = 0;
          return;
        }
        
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        // Calculate how much of the section is visible
        const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
        const sectionHeight = rect.height;
        
        // Calculate progress percentage
        let progress = Math.max(0, Math.min(100, (visibleHeight / sectionHeight) * 100));
        
        // If section is above viewport, mark as complete
        if (rect.bottom < 0) progress = 100;
        // If section is below viewport, mark as not started
        if (rect.top > windowHeight) progress = 0;
        
        updatedProgress[section.id] = progress;
      });
      
      // Only update state if progress has changed significantly
      const hasSignificantChanges = navigationSections.some(section => {
        const prevProgress = progressRef.current[section.id] || 0;
        const newProgress = updatedProgress[section.id] || 0;
        return Math.abs(prevProgress - newProgress) > 1;
      });
      
      if (hasSignificantChanges) {
        progressRef.current = updatedProgress;
        setSectionProgress(updatedProgress);
      }
      
      // Find the most visible section
      const mostVisibleSection = navigationSections
        .filter(section => {
          const element = document.getElementById(section.id);
          if (!element) return false;
          const rect = element.getBoundingClientRect();
          // Consider a section visible if it's partially in the viewport
          return rect.top < window.innerHeight * 0.7 && rect.bottom > 0;
        })
        .sort((a, b) => {
          return (updatedProgress[b.id] || 0) - (updatedProgress[a.id] || 0);
        })[0];
      
      if (mostVisibleSection && mostVisibleSection.id !== activeSection) {
        setActiveSection(mostVisibleSection.id);
      }
      
      // Show scroll to top button when scrolled down
      setShowScrollTop(window.scrollY > window.innerHeight);
    };
    
    const handleScroll = () => {
      calculateSectionProgress();
    };
    
    // Initial calculation
    calculateSectionProgress();
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timer);
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []); // Remove sectionProgress from dependencies

  const handleSectionClick = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      // Smooth scroll to section without changing URL
      element.scrollIntoView({ behavior: "smooth" });
    }
  };
  
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsHovering(true);
    setIsCollapsed(false);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setIsHovering(false);
      setIsCollapsed(true);
    }, 300); // 300ms delay before closing
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date))
  }

  if (isMobile || !isVisible) return null;

  return (
    <>
      <motion.div
        ref={sidebarRef}
        initial={{ opacity: 0, x: -20 }}
        animate={{ 
          opacity: 1, 
          x: 0,
          width: isCollapsed ? "60px" : "220px"
        }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "fixed left-4 top-1/2 -translate-y-1/2 z-40 bg-slate-900/80 backdrop-blur-lg",
          "border border-slate-800/50 rounded-xl overflow-hidden transition-all duration-300",
          "shadow-xl shadow-sky-500/5 hidden md:block"
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="p-2">
          <div className="flex flex-col space-y-1">
            {/* Blog sections */}
            {navigationSections.map((section) => {
              const progress = sectionProgress[section.id] || 0;
              const isActive = activeSection === section.id;
              
              return (
                <motion.button
                  key={section.id}
                  onClick={() => handleSectionClick(section.id)}
                  className={cn(
                    "relative flex items-center rounded-lg px-3 py-2 text-left",
                    "transition-all duration-200 overflow-hidden",
                    isActive 
                      ? "text-white bg-gradient-to-r from-sky-500/20 to-blue-500/20 border border-sky-500/20" 
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Progress indicator */}
                  <div 
                    className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-sky-400 to-blue-500"
                    style={{ width: `${progress}%` }}
                  />
                  
                  <div className="flex items-center">
                    <span className={cn(
                      "flex items-center justify-center",
                      isActive ? "text-sky-400" : "text-slate-400"
                    )}>
                      {section.icon}
                    </span>
                    
                    <AnimatePresence>
                      {!isCollapsed && (
                        <motion.span 
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                          className="ml-3 text-sm font-medium truncate"
                        >
                          {section.name}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.button>
              );
            })}
            
            {/* Divider */}
            <div className="h-px bg-slate-800 my-1"></div>
            
            {/* External links */}
            {externalLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "relative flex items-center rounded-lg px-3 py-2 text-left",
                  "transition-all duration-200 overflow-hidden",
                  "text-slate-400 hover:text-white hover:bg-slate-800/50"
                )}
              >
                <div className="flex items-center">
                  <span className="flex items-center justify-center text-slate-400">
                    {link.icon}
                  </span>
                  
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.span 
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className="ml-3 text-sm font-medium truncate"
                      >
                        {link.name}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </motion.div>
      
      {/* Scroll to top button - show on all devices */}
      {showScrollTop && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          onClick={scrollToTop}
          className="fixed right-6 bottom-6 z-40 p-3 rounded-full bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/20 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ArrowUp className="h-5 w-5" />
        </motion.button>
      )}

      <div className="space-y-6">
        {/* Recent Posts */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <CalendarIcon className="h-4 w-4 mr-2 text-sky-400" />
              Recent Posts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentPosts.length > 0 ? (
              <ul className="space-y-4">
                {recentPosts.map(post => (
                  <li key={post.id} className="border-b border-slate-800 pb-3 last:border-0 last:pb-0">
                    <Link 
                      href={`/blog/${post.slug}`}
                      className="group flex items-start gap-3"
                    >
                      {post.coverImage ? (
                        <div className="w-16 h-16 rounded-md overflow-hidden shrink-0">
                          <img 
                            src={post.coverImage} 
                            alt={post.title} 
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-slate-800 rounded-md flex items-center justify-center shrink-0">
                          <span className="text-slate-500 text-xs">No image</span>
                        </div>
                      )}
                      <div>
                        <h3 className="text-sm font-medium text-white group-hover:text-sky-400 transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                          {formatDate(post.createdAt)}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400">No recent posts</p>
            )}
          </CardContent>
        </Card>

        {/* Categories */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Layers className="h-4 w-4 mr-2 text-sky-400" />
              Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <Link key={category.id} href={`/blog/category/${category.slug}`}>
                    <Badge variant="outline" className="hover:bg-slate-800 transition-colors cursor-pointer">
                      {category.name} ({category.postCount})
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No categories</p>
            )}
          </CardContent>
        </Card>

        {/* Tags */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Hash className="h-4 w-4 mr-2 text-sky-400" />
              Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <Link key={tag.id} href={`/blog/tag/${tag.slug}`}>
                    <Badge variant="secondary" className="bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 transition-colors cursor-pointer">
                      {tag.name} ({tag.postCount})
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No tags</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
} 