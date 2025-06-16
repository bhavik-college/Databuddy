import {
  Sparkles, Shield, Zap, LineChart,
  Layers, HelpCircle, Mail, Info,
  Lightbulb, DollarSign, FileText, Briefcase, Play
} from "lucide-react"

export const homeNavGroups = [
  {
    name: "About",
    items: [
      { name: "Features", href: "/features", icon: <Sparkles className="h-4 w-4" /> },
      { name: "Pricing", href: "/pricing", icon: <DollarSign className="h-4 w-4" /> },
      { name: "About Us", href: "/about", icon: <Info className="h-4 w-4" /> },
      { name: "Careers", href: "/careers", icon: <Briefcase className="h-4 w-4" /> },
    ]
  },
  {
    name: "Compare",
    items: [
      { name: "Full Comparison", href: "/compare", icon: <Layers className="h-4 w-4" /> },
    ]
  },
  {
    name: "Resources",
    items: [
      { name: "Demo", href: "/demo", icon: <Play className="h-4 w-4" /> },
      { name: "Blog", href: "/blog", icon: <Lightbulb className="h-4 w-4" /> },
      { name: "Privacy Policy", href: "/privacy", icon: <Shield className="h-4 w-4" /> },
      { name: "Terms of Service", href: "/terms", icon: <FileText className="h-4 w-4" /> },
    ]
  },
  {
    name: "Help",
    items: [
      { name: "Contact Page", href: "/contact", icon: <Mail className="h-4 w-4" /> },
    ]
  }
];

export const blogNavGroups = [
  {
    name: "About",
    items: [
      { name: "Features", href: "/features", icon: <Sparkles className="h-4 w-4" /> },
      { name: "Pricing", href: "/pricing", icon: <DollarSign className="h-4 w-4" /> },
      { name: "About Us", href: "/about", icon: <Info className="h-4 w-4" /> },
      { name: "Careers", href: "/careers", icon: <Briefcase className="h-4 w-4" /> },
    ]
  },
  {
    name: "Resources",
    items: [
      { name: "Demo", href: "/demo", icon: <Play className="h-4 w-4" /> },
      { name: "Blog", href: "/blog", icon: <Lightbulb className="h-4 w-4" /> },
      { name: "Privacy Policy", href: "/privacy", icon: <Shield className="h-4 w-4" /> },
      { name: "Terms of Service", href: "/terms", icon: <FileText className="h-4 w-4" /> },
    ]
  },
  {
    name: "Help",
    items: [
      { name: "Contact", href: "/contact", icon: <Mail className="h-4 w-4" /> },
    ]
  }
];

export const demoNavGroups = [
  {
    name: "About",
    items: [
      { name: "Features", href: "/features", icon: <Sparkles className="h-4 w-4" /> },
      { name: "Pricing", href: "/pricing", icon: <DollarSign className="h-4 w-4" /> },
      { name: "About Us", href: "/about", icon: <Info className="h-4 w-4" /> },
      { name: "Careers", href: "/careers", icon: <Briefcase className="h-4 w-4" /> },
    ]
  },
  {
    name: "Resources",
    items: [
      { name: "Blog", href: "/blog", icon: <Lightbulb className="h-4 w-4" /> },
      { name: "Privacy Policy", href: "/privacy", icon: <Shield className="h-4 w-4" /> },
      { name: "Terms of Service", href: "/terms", icon: <FileText className="h-4 w-4" /> },
    ]
  },
  {
    name: "Help",
    items: [
      { name: "Contact", href: "/contact", icon: <Mail className="h-4 w-4" /> },
    ]
  }
];

export const compareNavGroups = [
  {
    name: "About",
    items: [
      { name: "Features", href: "/features", icon: <Sparkles className="h-4 w-4" /> },
      { name: "Pricing", href: "/pricing", icon: <DollarSign className="h-4 w-4" /> },
      { name: "About Us", href: "/about", icon: <Info className="h-4 w-4" /> },
      { name: "Careers", href: "/careers", icon: <Briefcase className="h-4 w-4" /> },
    ]
  },
  {
    name: "Resources",
    items: [
      { name: "Demo", href: "/demo", icon: <Play className="h-4 w-4" /> },
      { name: "Blog", href: "/blog", icon: <Lightbulb className="h-4 w-4" /> },
      { name: "Privacy Policy", href: "/privacy", icon: <Shield className="h-4 w-4" /> },
      { name: "Terms of Service", href: "/terms", icon: <FileText className="h-4 w-4" /> },
    ]
  },
  {
    name: "Help",
    items: [
      { name: "Contact", href: "/contact", icon: <Mail className="h-4 w-4" /> },
    ]
  }
];

export const contactNavGroups = [
  {
    name: "About",
    items: [
      { name: "Features", href: "/features", icon: <Sparkles className="h-4 w-4" /> },
      { name: "Pricing", href: "/pricing", icon: <DollarSign className="h-4 w-4" /> },
      { name: "About Us", href: "/about", icon: <Info className="h-4 w-4" /> },
      { name: "Careers", href: "/careers", icon: <Briefcase className="h-4 w-4" /> },
    ]
  },
  {
    name: "Resources",
    items: [
      { name: "Demo", href: "/demo", icon: <Play className="h-4 w-4" /> },
      { name: "Blog", href: "/blog", icon: <Lightbulb className="h-4 w-4" /> },
      { name: "Privacy Policy", href: "/privacy", icon: <Shield className="h-4 w-4" /> },
      { name: "Terms of Service", href: "/terms", icon: <FileText className="h-4 w-4" /> },
    ]
  }
];

// Flatten all navigation groups for mobile navigation and scroll tracking
export function flattenNavItems(navGroups: any[]) {
  return navGroups.flatMap(group => group.items);
}

// Legal pages
export const legalPages = [
  { name: "Privacy Policy", href: "/privacy" },
  { name: "Terms of Service", href: "/terms-of-service" },
]; 