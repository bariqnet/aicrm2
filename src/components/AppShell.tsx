"use client";

import { useEffect } from "react";
import { SidebarNav } from "@/components/SidebarNav";
import { Topbar } from "@/components/Topbar";
import { CommandPalette } from "@/components/CommandPalette";
import { DetailDrawer } from "@/components/DetailDrawer";
import type { SessionUser } from "@/lib/crm-types";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";

type AppShellProps = React.PropsWithChildren<{
  user?: SessionUser | null;
}>;

export function AppShell({ children, user }: AppShellProps) {
  const { dark, mobileNavOpen, setMobileNavOpen } = useUIStore();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [mobileNavOpen]);

  return (
    <div className="flex min-h-screen bg-bg text-fg">
      <SidebarNav className="transition-all duration-200" user={user} />
      <div
        className={cn(
          "fixed inset-0 z-30 bg-black/35 transition-opacity md:hidden",
          mobileNavOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setMobileNavOpen(false)}
      />
      <SidebarNav
        mobile
        onNavigate={() => setMobileNavOpen(false)}
        user={user}
        className={cn(
          "fixed inset-y-0 left-0 z-40 transition-transform duration-200 md:hidden",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full"
        )}
      />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Topbar />
        <div className="flex-1 px-4 pb-10 pt-6 md:px-8">{children}</div>
      </div>
      <CommandPalette />
      <DetailDrawer />
    </div>
  );
}
