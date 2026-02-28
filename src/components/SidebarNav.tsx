"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import {
  Building2,
  CalendarDays,
  CheckSquare,
  CircleUserRound,
  Cog,
  FileText,
  Handshake,
  Home,
  LineChart,
  UserRound,
  Users,
  type LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: Route;
  label: string;
  icon: LucideIcon;
};

const navSections: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "Workspace",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: Home },
      { href: "/contacts", label: "Contacts", icon: Users },
      { href: "/companies", label: "Companies", icon: Building2 },
      { href: "/deals", label: "Deals", icon: Handshake },
      { href: "/tasks", label: "Tasks", icon: CheckSquare }
    ]
  },
  {
    label: "Operations",
    items: [
      { href: "/invoices", label: "Invoices", icon: FileText },
      { href: "/visits", label: "Visits", icon: UserRound },
      { href: "/calendar", label: "Calendar", icon: CalendarDays },
      { href: "/reports", label: "Reports", icon: LineChart }
    ]
  },
  {
    label: "System",
    items: [
      { href: "/profile", label: "Profile", icon: CircleUserRound },
      { href: "/settings", label: "Settings", icon: Cog }
    ]
  }
];

export function SidebarNav() {
  const path = usePathname();

  return (
    <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-surface px-3 py-4 md:flex">
      <div className="mb-5 px-2">
        <p className="text-[11px] uppercase tracking-[0.15em] text-mutedfg">Workspace</p>
        <p className="text-lg font-semibold tracking-tight">AI CRM</p>
      </div>

      <button className="btn mb-5 w-full justify-start text-xs text-mutedfg">Default workspace</button>

      <nav className="space-y-4 overflow-y-auto pr-1">
        {navSections.map((section) => (
          <div key={section.label}>
            <p className="mb-1 px-2 text-[11px] font-medium uppercase tracking-[0.12em] text-mutedfg">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  path === item.href || (item.href !== "/dashboard" && path.startsWith(`${item.href}/`));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition",
                      isActive
                        ? "bg-muted font-medium text-fg"
                        : "text-mutedfg hover:bg-muted/70 hover:text-fg"
                    )}
                  >
                    <Icon size={15} className={cn(isActive ? "text-fg" : "text-mutedfg group-hover:text-fg")} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-auto border-t border-border pt-3 text-xs text-mutedfg">alex@workspace.io</div>
    </aside>
  );
}
