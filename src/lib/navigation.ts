import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Building2,
  CalendarDays,
  CheckSquare,
  CircleUserRound,
  Cog,
  FileText,
  Home,
  KanbanSquare,
  PhoneCall,
  RouteIcon,
  UserRoundPlus,
  Users,
} from "lucide-react";

export type NavItem = {
  href: string;
  icon: LucideIcon;
  labelKey: string;
};

export type NavSection = {
  labelKey: string;
  items: NavItem[];
};

export const APP_TOP_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", icon: Home, labelKey: "nav.dashboard" },
  { href: "/leads", icon: UserRoundPlus, labelKey: "nav.leads" },
  { href: "/deals", icon: KanbanSquare, labelKey: "nav.deals" },
  { href: "/reports", icon: BarChart3, labelKey: "nav.reports" },
  { href: "/settings", icon: Cog, labelKey: "nav.settings" },
];

export const APP_NAV_SECTIONS: NavSection[] = [
  {
    labelKey: "sidebar.section.overview",
    items: [
      { href: "/dashboard", icon: Home, labelKey: "nav.dashboard" },
      { href: "/tasks", icon: CheckSquare, labelKey: "nav.tasks" },
      { href: "/calendar", icon: CalendarDays, labelKey: "nav.calendar" },
    ],
  },
  {
    labelKey: "sidebar.section.relationships",
    items: [
      { href: "/leads", icon: UserRoundPlus, labelKey: "nav.leads" },
      { href: "/contacts", icon: Users, labelKey: "nav.contacts" },
      { href: "/companies", icon: Building2, labelKey: "nav.companies" },
      { href: "/deals", icon: KanbanSquare, labelKey: "nav.deals" },
    ],
  },
  {
    labelKey: "sidebar.section.revenue",
    items: [
      { href: "/invoices", icon: FileText, labelKey: "nav.invoices" },
      { href: "/reports", icon: BarChart3, labelKey: "nav.reports" },
    ],
  },
  {
    labelKey: "sidebar.section.operations",
    items: [
      { href: "/callops", icon: PhoneCall, labelKey: "nav.callops" },
      { href: "/visits", icon: RouteIcon, labelKey: "nav.visits" },
    ],
  },
  {
    labelKey: "sidebar.section.system",
    items: [
      { href: "/settings", icon: Cog, labelKey: "nav.settings" },
      { href: "/profile", icon: CircleUserRound, labelKey: "nav.profile" },
    ],
  },
];

export function findNavItem(pathname: string) {
  for (const section of APP_NAV_SECTIONS) {
    for (const item of section.items) {
      if (
        pathname === item.href ||
        (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`))
      ) {
        return item;
      }
    }
  }

  return null;
}
