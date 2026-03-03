"use client";

import Image from "next/image";
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
  Home,
  KanbanSquare,
  LineChart,
  PhoneCall,
  UserRound,
  Users,
  type LucideIcon
} from "lucide-react";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useI18n } from "@/hooks/useI18n";
import { SignOutButton } from "@/components/SignOutButton";
import { cn } from "@/lib/utils";

type NavItem = {
  href: Route;
  label: string;
  icon: LucideIcon;
};

type SidebarNavProps = {
  mobile?: boolean;
  className?: string;
  onNavigate?: () => void;
};

function SidebarLinks({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  const { t } = useI18n();
  const navSections: Array<{ label: string; items: NavItem[] }> = [
    {
      label: t("sidebar.section.workspace"),
      items: [
        { href: "/dashboard", label: t("nav.dashboard"), icon: Home },
        { href: "/contacts", label: t("nav.contacts"), icon: Users },
        { href: "/companies", label: t("nav.companies"), icon: Building2 },
        { href: "/deals", label: t("nav.deals"), icon: KanbanSquare },
        { href: "/tasks", label: t("nav.tasks"), icon: CheckSquare }
      ]
    },
    {
      label: t("sidebar.section.operations"),
      items: [
        { href: "/invoices", label: t("nav.invoices"), icon: FileText },
        { href: "/callops", label: t("nav.callops"), icon: PhoneCall },
        { href: "/visits", label: t("nav.visits"), icon: UserRound },
        { href: "/calendar", label: t("nav.calendar"), icon: CalendarDays },
        { href: "/reports", label: t("nav.reports"), icon: LineChart }
      ]
    },
    {
      label: t("sidebar.section.system"),
      items: [
        { href: "/profile", label: t("nav.profile"), icon: CircleUserRound },
        { href: "/settings", label: t("nav.settings"), icon: Cog }
      ]
    }
  ];

  return (
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
                  onClick={onNavigate}
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
  );
}

export function SidebarNav({ mobile = false, className, onNavigate }: SidebarNavProps) {
  const { t } = useI18n();

  return (
    <aside
      className={cn(
        mobile
          ? "flex h-full w-72 shrink-0 flex-col border-r border-border bg-surface px-3 py-4"
          : "hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-surface px-3 py-4 md:flex",
        className
      )}
    >
      <div className="mb-5 px-2">
        <Link href="/dashboard" onClick={onNavigate} className="inline-flex">
          <Image
            src="/fav.png"
            alt="Que logo"
            width={100}
            height={32}
            className="h-auto w-[100px]"
            priority
          />
        </Link>
      </div>

      <button className="btn mb-5 w-full justify-start text-xs text-mutedfg">{t("sidebar.defaultWorkspace")}</button>

      <SidebarLinks onNavigate={onNavigate} />

      <div className="mt-auto space-y-3 border-t border-border pt-3">
        <LanguageToggle />
        <div className="text-xs text-mutedfg">alex@workspace.io</div>
        {mobile ? <SignOutButton className="btn w-full justify-center" /> : null}
      </div>
    </aside>
  );
}
