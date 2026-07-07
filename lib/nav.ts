import {
  LayoutDashboard,
  ImageIcon,
  Sparkles,
  Calendar,
  BarChart3,
  Brain,
  Settings,
  ListChecks,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  soon?: string;
  adminOnly?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Media", href: "/media", icon: ImageIcon },
  { label: "Sisältöjono", href: "/content", icon: ListChecks },
  { label: "Generator", href: "/generator", icon: Sparkles, soon: "v1" },
  { label: "Kalenteri", href: "/calendar", icon: Calendar },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Brand Brain", href: "/brand-brain", icon: Brain },
  { label: "Jäsenet", href: "/settings/members", icon: Users, adminOnly: true },
  { label: "Asetukset", href: "/settings", icon: Settings },
];
