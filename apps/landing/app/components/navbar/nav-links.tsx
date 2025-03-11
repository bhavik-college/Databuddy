import { 
  Sparkles, Shield, Zap, LineChart, 
  Layers, HelpCircle, Mail, Info, 
  Lightbulb, DollarSign
} from "lucide-react"

export const homeNavGroups = [
  {
    name: "About",
    items: [
      { name: "Features", href: "#features", id: "features", icon: <Sparkles className="h-4 w-4" /> },
      { name: "Privacy", href: "#privacy", id: "privacy", icon: <Shield className="h-4 w-4" /> },
      { name: "Mission", href: "#mission", id: "mission", icon: <Zap className="h-4 w-4" /> },
      { name: "Pricing", href: "#pricing", id: "pricing", icon: <DollarSign className="h-4 w-4" /> },
    ]
  },
  {
    name: "Compare",
    items: [
      { name: "Comparison", href: "#compare", id: "compare", icon: <LineChart className="h-4 w-4" /> },
      { name: "Performance", href: "#performance", id: "performance", icon: <Layers className="h-4 w-4" /> },
    ]
  },
  {
    name: "Help",
    items: [
      { name: "FAQ", href: "#faq", id: "faq", icon: <HelpCircle className="h-4 w-4" /> },
      { name: "Contact", href: "#contact", id: "contact", icon: <Mail className="h-4 w-4" /> },
    ]
  }
];

export const blogNavGroups = [
  {
    name: "About",
    items: [
      { name: "About Us", href: "/#mission", icon: <Info className="h-4 w-4" /> },
      { name: "Features", href: "/#features", icon: <Sparkles className="h-4 w-4" /> },
      { name: "Privacy", href: "/#privacy", icon: <Shield className="h-4 w-4" /> },
    ]
  },
  {
    name: "Resources",
    items: [
      { name: "Blog", href: "/blog", icon: <Lightbulb className="h-4 w-4" /> },
      { name: "Pricing", href: "/#pricing", icon: <DollarSign className="h-4 w-4" /> },
    ]
  },
  {
    name: "Help",
    items: [
      { name: "FAQ", href: "/#faq", icon: <HelpCircle className="h-4 w-4" /> },
      { name: "Contact", href: "/#contact", icon: <Mail className="h-4 w-4" /> },
    ]
  }
];

export const demoNavGroups = [
  {
    name: "About",
    items: [
      { name: "Features", href: "/#features", icon: <Sparkles className="h-4 w-4" /> },
      { name: "Privacy", href: "/#privacy", icon: <Shield className="h-4 w-4" /> },
      { name: "Mission", href: "/#mission", icon: <Zap className="h-4 w-4" /> },
    ]
  },
  {
    name: "Compare",
    items: [
      { name: "Comparison", href: "/#compare", icon: <LineChart className="h-4 w-4" /> },
      { name: "Performance", href: "/#performance", icon: <Layers className="h-4 w-4" /> },
    ]
  },
  {
    name: "Help",
    items: [
      { name: "FAQ", href: "/#faq", icon: <HelpCircle className="h-4 w-4" /> },
      { name: "Contact", href: "/#contact", icon: <Mail className="h-4 w-4" /> },
    ]
  }
];

export const compareNavGroups = [
  {
    name: "About",
    items: [
      { name: "Features", href: "/#features", icon: <Sparkles className="h-4 w-4" /> },
      { name: "Privacy", href: "/#privacy", icon: <Shield className="h-4 w-4" /> },
      { name: "Mission", href: "/#mission", icon: <Zap className="h-4 w-4" /> },
    ]
  },
  {
    name: "Compare",
    items: [
      { name: "Comparison", href: "/compare", icon: <LineChart className="h-4 w-4" /> },
      { name: "Performance", href: "/#performance", icon: <Layers className="h-4 w-4" /> },
    ]
  },
  {
    name: "Help",
    items: [
      { name: "FAQ", href: "/#faq", icon: <HelpCircle className="h-4 w-4" /> },
      { name: "Contact", href: "/#contact", icon: <Mail className="h-4 w-4" /> },
    ]
  }
];

export const contactNavGroups = [
  {
    name: "About",
    items: [
      { name: "Features", href: "/#features", icon: <Sparkles className="h-4 w-4" /> },
      { name: "Privacy", href: "/#privacy", icon: <Shield className="h-4 w-4" /> },
      { name: "Mission", href: "/#mission", icon: <Zap className="h-4 w-4" /> },
    ]
  },
  {
    name: "Compare",
    items: [
      { name: "Comparison", href: "/#compare", icon: <LineChart className="h-4 w-4" /> },
      { name: "Performance", href: "/#performance", icon: <Layers className="h-4 w-4" /> },
    ]
  },
  {
    name: "Help",
    items: [
      { name: "FAQ", href: "/#faq", icon: <HelpCircle className="h-4 w-4" /> },
      { name: "Contact", href: "/contact", icon: <Mail className="h-4 w-4" /> },
    ]
  }
];

// Flatten all navigation groups for mobile navigation and scroll tracking
export function flattenNavItems(navGroups: any[]) {
  return navGroups.flatMap(group => group.items);
}

// Legal pages
export const legalPages = [
  { name: "Privacy Policy", href: "/privacy-policy" },
  { name: "Terms of Service", href: "/terms-of-service" },
]; 