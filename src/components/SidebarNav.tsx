"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Command,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Search,
} from "lucide-react";
import { APP_NAV_SECTIONS } from "@/lib/navigation";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useI18n } from "@/hooks/useI18n";
import { SignOutButton } from "@/components/SignOutButton";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";

type SidebarNavProps = {
  mobile?: boolean;
  className?: string;
  onNavigate?: () => void;
};

function SidebarLinks({
  onNavigate,
  collapsed = false,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const path = usePathname();
  const { t, isRtl } = useI18n();

  return (
    <nav className={cn("flex-1 space-y-7 overflow-y-auto", isRtl ? "pl-2" : "pr-2")}>
      {APP_NAV_SECTIONS.map((section) => (
        <div key={section.labelKey}>
          {!collapsed ? (
            <p className="mb-2.5 px-2.5 text-[11px] font-medium uppercase tracking-[0.15em] text-mutedfg dark:text-zinc-600">
              {t(section.labelKey)}
            </p>
          ) : null}
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const Icon = item.icon;
              const label = t(item.labelKey);
              const isActive =
                path === item.href ||
                (item.href !== "/dashboard" && path.startsWith(`${item.href}/`));

              return (
                <Link
                  key={item.href}
                  href={item.href as Route}
                  onClick={onNavigate}
                  title={collapsed ? label : undefined}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "group relative flex text-sm transition",
                    collapsed
                      ? "items-center justify-center rounded-lg px-0 py-2.5"
                      : "items-center justify-between rounded-lg px-2.5 py-1.5",
                    isActive
                      ? "bg-surface2 text-fg dark:bg-white/[0.08] dark:text-white"
                      : "text-mutedfg hover:bg-surface hover:text-fg dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-white",
                  )}
                >
                  {collapsed ? (
                    <Icon
                      size={15}
                      className={cn(
                        isActive
                          ? "text-fg dark:text-white"
                          : "text-mutedfg group-hover:text-fg dark:text-zinc-500 dark:group-hover:text-white",
                      )}
                    />
                  ) : (
                    <>
                      <span
                        className={cn("truncate font-medium", isRtl ? "text-right" : "text-left")}
                      >
                        {label}
                      </span>
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full bg-fg transition-opacity dark:bg-white/70",
                          isActive ? "opacity-100" : "opacity-0 group-hover:opacity-40",
                        )}
                      />
                    </>
                  )}
                  {collapsed ? <span className="sr-only">{label}</span> : null}
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
  const { t, isRtl } = useI18n();
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);
  const setCommandOpen = useUIStore((state) => state.setCommandOpen);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const collapsed = !mobile && sidebarCollapsed;

  return (
    <aside
      className={cn(
        mobile
          ? "relative flex h-[calc(100vh-57px)] w-72 shrink-0 flex-col overflow-visible border-border/90 bg-[hsl(var(--background)/0.96)] px-3 py-4 supports-[backdrop-filter]:backdrop-blur-xl dark:border-white/8 dark:bg-[rgba(5,5,5,0.96)]"
          : "relative sticky top-[57px] hidden h-[calc(100vh-57px)] shrink-0 flex-col overflow-visible border-border/90 bg-[hsl(var(--background)/0.96)] py-4 supports-[backdrop-filter]:backdrop-blur-xl dark:border-white/8 dark:bg-[rgba(5,5,5,0.96)] md:flex",
        isRtl ? "border-l" : "border-r",
        !mobile ? (collapsed ? "w-20 px-2.5" : "w-[248px] px-3.5") : "",
        className,
      )}
    >
      {!mobile ? (
        <button
          type="button"
          className={cn(
            "absolute top-7 z-20 hidden h-9 w-9 items-center justify-center rounded-full border border-border/90 bg-[hsl(var(--background)/0.98)] text-mutedfg shadow-[0_10px_30px_rgba(15,23,42,0.08)] transition hover:border-fg/15 hover:text-fg dark:border-white/10 dark:bg-[rgba(10,10,10,0.98)] dark:text-zinc-500 dark:shadow-[0_14px_32px_rgba(0,0,0,0.38)] dark:hover:border-white/14 dark:hover:text-white md:inline-flex",
            isRtl ? "left-0 -translate-x-1/2" : "right-0 translate-x-1/2",
          )}
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

      <div className={cn("mb-5 px-1 pt-1", collapsed ? "space-y-2" : "space-y-3")}>
        <button
          type="button"
          onClick={() => setCommandOpen(true)}
          aria-label={t("sidebar.searchLabel")}
          title={t("sidebar.searchLabel")}
          className={cn(
            "flex items-center border border-border bg-surface text-sm text-mutedfg transition hover:border-fg/15 hover:bg-surface2 hover:text-fg dark:border-white/8 dark:bg-white/[0.04] dark:text-zinc-400 dark:hover:border-white/14 dark:hover:bg-white/[0.06] dark:hover:text-white",
            collapsed
              ? "mx-auto h-10 w-10 justify-center rounded-xl"
              : "h-10 w-full justify-between rounded-xl px-3",
          )}
        >
          <span className="inline-flex min-w-0 flex-1 items-center gap-2">
            <Search size={15} />
            {!collapsed ? (
              <span className="truncate font-medium text-fg dark:text-zinc-300">
                {t("sidebar.searchLabel")}
              </span>
            ) : null}
          </span>
          {!collapsed ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border bg-bg px-1.5 py-1 text-[10px] text-mutedfg dark:border-white/8 dark:bg-black/40 dark:text-zinc-500">
              <Command size={10} />K
            </span>
          ) : null}
        </button>
      </div>

      <SidebarLinks onNavigate={onNavigate} collapsed={collapsed} />

      <div
        className={cn(
          "mt-auto border-t border-border/90 px-1 pt-4 dark:border-white/8",
          collapsed ? "space-y-2" : "space-y-2.5",
        )}
      >
        {!collapsed ? (
          <div className="space-y-2 rounded-xl border border-border bg-surface p-2 dark:border-white/8 dark:bg-white/[0.02]">
            <div className="flex items-center justify-start">
              <LanguageToggle mode="compact" />
            </div>
            <SignOutButton
              containerClassName="w-full"
              className="btn btn-ghost h-8 w-full justify-start px-2 text-mutedfg hover:text-fg dark:text-zinc-500 dark:hover:text-white"
              label={t("signout.label")}
            />
          </div>
        ) : null}
      </div>
    </aside>
  );
}
