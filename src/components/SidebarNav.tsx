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
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  PhoneCall,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useI18n } from "@/hooks/useI18n";
import { SignOutButton } from "@/components/SignOutButton";
import type { SessionUser } from "@/lib/crm-types";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";

type NavItem = {
  href: Route;
  label: string;
  icon: LucideIcon;
};

type SidebarNavProps = {
  mobile?: boolean;
  className?: string;
  onNavigate?: () => void;
  user?: SessionUser | null;
};

function getUserInitials(user: SessionUser | null | undefined): string {
  if (!user) return "?";
  const parts = user.name.trim().split(/\s+/).filter(Boolean).slice(0, 2);

  if (parts.length > 0) {
    return parts.map((part) => part.charAt(0).toUpperCase()).join("");
  }

  return user.email.slice(0, 2).toUpperCase();
}

function SidebarLinks({
  onNavigate,
  collapsed = false,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
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
        { href: "/tasks", label: t("nav.tasks"), icon: CheckSquare },
      ],
    },
    {
      label: t("sidebar.section.operations"),
      items: [
        { href: "/invoices", label: t("nav.invoices"), icon: FileText },
        { href: "/callops", label: t("nav.callops"), icon: PhoneCall },
        { href: "/visits", label: t("nav.visits"), icon: UserRound },
        { href: "/calendar", label: t("nav.calendar"), icon: CalendarDays },
        { href: "/reports", label: t("nav.reports"), icon: LineChart },
      ],
    },
    {
      label: t("sidebar.section.system"),
      items: [
        { href: "/profile", label: t("nav.profile"), icon: CircleUserRound },
        { href: "/settings", label: t("nav.settings"), icon: Cog },
      ],
    },
  ];

  return (
    <nav className="space-y-4 overflow-y-auto pr-1">
      {navSections.map((section) => (
        <div key={section.label}>
          {!collapsed ? (
            <p className="mb-1 px-2 text-[11px] font-medium uppercase tracking-[0.12em] text-mutedfg">
              {section.label}
            </p>
          ) : null}
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive =
                path === item.href ||
                (item.href !== "/dashboard" && path.startsWith(`${item.href}/`));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "group flex rounded-md text-sm transition",
                    collapsed
                      ? "items-center justify-center px-0 py-2"
                      : "items-center gap-2 px-2 py-1.5",
                    isActive
                      ? "bg-muted font-medium text-fg"
                      : "text-mutedfg hover:bg-muted/70 hover:text-fg",
                  )}
                >
                  <Icon
                    size={15}
                    className={cn(isActive ? "text-fg" : "text-mutedfg group-hover:text-fg")}
                  />
                  <span className={cn(collapsed ? "sr-only" : "")}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function SidebarNav({ mobile = false, className, onNavigate, user }: SidebarNavProps) {
  const { t, isRtl } = useI18n();
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const collapsed = !mobile && sidebarCollapsed;
  const displayName = user?.name?.trim() || user?.email || "";
  const initials = getUserInitials(user);

  return (
    <aside
      className={cn(
        mobile
          ? "flex h-full w-72 shrink-0 flex-col border-r border-border bg-surface px-3 py-4"
          : "hidden h-screen shrink-0 flex-col border-r border-border bg-surface py-4 md:flex",
        !mobile ? (collapsed ? "w-20 px-2" : "w-64 px-3") : "",
        className,
      )}
    >
      <div
        className={cn(
          "mb-5 flex items-center",
          collapsed ? "justify-center px-1" : "justify-between px-2",
        )}
      >
        {!collapsed ? (
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
        ) : null}
        {!mobile ? (
          <button
            type="button"
            className="btn h-8 w-8 px-0"
            onClick={toggleSidebar}
            aria-label={collapsed ? t("topbar.openNav") : t("topbar.closeNav")}
            title={collapsed ? t("topbar.openNav") : t("topbar.closeNav")}
          >
            {collapsed ? (
              isRtl ? (
                <PanelRightOpen size={14} />
              ) : (
                <PanelLeftOpen size={14} />
              )
            ) : isRtl ? (
              <PanelRightClose size={14} />
            ) : (
              <PanelLeftClose size={14} />
            )}
          </button>
        ) : null}
      </div>

      {!collapsed ? (
        <button className="btn mb-5 w-full justify-start text-xs text-mutedfg">
          {t("sidebar.defaultWorkspace")}
        </button>
      ) : null}

      <SidebarLinks onNavigate={onNavigate} collapsed={collapsed} />

      <div
        className={cn("mt-auto border-t border-border pt-3", collapsed ? "space-y-2" : "space-y-3")}
      >
        {!collapsed ? <LanguageToggle /> : null}
        {!collapsed && user ? (
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface2/70 px-3 py-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#0f172a,#334155)] text-sm font-semibold text-white">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-fg">{displayName}</p>
              <p className="truncate text-xs text-mutedfg">{user.email}</p>
            </div>
          </div>
        ) : null}
        {!collapsed ? <SignOutButton className="btn w-full justify-center" /> : null}
      </div>
    </aside>
  );
}
