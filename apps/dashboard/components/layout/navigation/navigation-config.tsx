import {
  GlobeIcon,
  GearIcon,
  ClockIcon,
  UsersIcon,
  MapPinIcon,
  ChatCircleIcon,
  HouseIcon,
  RobotIcon,
  TestTubeIcon,
  BugIcon,
  GitBranchIcon,
  FunnelIcon,
  CurrencyDollarIcon,
  LinkIcon
} from "@phosphor-icons/react";
import type { NavigationSection } from "./types";

export const mainNavigation: NavigationSection[] = [
  {
    title: "Main",
    items: [
      { name: "Websites", icon: GlobeIcon, href: "/websites", rootLevel: true, highlight: true },
      { name: "Domains", icon: LinkIcon, href: "/domains", rootLevel: true, highlight: true },
      { name: "Settings", icon: GearIcon, href: "/settings", rootLevel: true, highlight: true },
      // { name: "Billing", icon: CreditCard, href: "/billing", rootLevel: true, highlight: true },
    ],
  },
  {
    title: "Early Access",
    items: [
      { name: "Revenue", icon: CurrencyDollarIcon, href: "/revenue", rootLevel: true, highlight: true, alpha: true },
    ],
  },
  {
    title: "Resources",
    items: [
      { name: "Roadmap", icon: MapPinIcon, href: "https://trello.com/b/SOUXD4wE/databuddy", rootLevel: true, external: true, highlight: true },
      { name: "Feedback", icon: ChatCircleIcon, href: "https://databuddy.featurebase.app/", rootLevel: true, external: true, highlight: true },
    ],
  }
];

export const websiteNavigation: NavigationSection[] = [
  {
    title: "Analytics",
    items: [
      { name: "Overview", icon: HouseIcon, href: "", highlight: true },
      { name: "Sessions", icon: ClockIcon, href: "/sessions", highlight: true },
      { name: "Profiles", icon: UsersIcon, href: "/profiles", highlight: true },
      { name: "Funnels", icon: FunnelIcon, href: "/funnels", highlight: true },
      { name: "Journeys", icon: GitBranchIcon, href: "/journeys", highlight: true },
      { name: "Errors", icon: BugIcon, href: "/errors", highlight: true },
      { name: "Map", icon: MapPinIcon, href: "/map", highlight: true },
      { name: "Test", icon: TestTubeIcon, href: "/test", highlight: true, production: false },
    ],
  },
  {
    title: "Early Access",
    items: [
      { name: "Assistant", icon: RobotIcon, href: "/assistant", highlight: true, alpha: true },
    ],
  }
]; 