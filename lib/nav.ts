import {
  LayoutDashboard,
  ImageIcon,
  Sparkles,
  Calendar,
  BarChart3,
  Brain,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  soon?: string;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Media", href: "/media", icon: ImageIcon, soon: "v1" },
  { label: "Generator", href: "/generator", icon: Sparkles, soon: "v1" },
  { label: "Kalenteri", href: "/kalenteri", icon: Calendar, soon: "v2" },
  { label: "Analytics", href: "/analytics", icon: BarChart3, soon: "v3" },
  { label: "Brand Brain", href: "/brand-brain", icon: Brain, soon: "v2" },
  { label: "Asetukset", href: "/asetukset", icon: Settings, soon: "v2" },
];
